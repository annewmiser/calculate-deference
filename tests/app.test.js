const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// A small DOM fixture tests event wiring and displayed values without a browser.
// Layout and native browser behavior still need a browser smoke test.
function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  const createElement = () => ({
    value: "",
    textContent: "",
    hidden: false,
    listeners: {},
    addEventListener(type, callback) {
      this.listeners[type] = callback;
    },
  });
  const elements = Object.fromEntries(
    [...html.matchAll(/id="([^"]+)"/g)].map((match) => [match[1], createElement()])
  );
  const outputs = [...html.matchAll(/data-monthly-result="([^"]+)"/g)].map((match) => ({
    ...createElement(),
    dataset: { monthlyResult: match[1] },
  }));
  elements.calculationMode.value = "monthly";
  const listeners = {};
  const document = {
    getElementById: (id) => elements[id],
    querySelectorAll(selector) {
      if (selector === "[data-monthly-result]") return outputs;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    addEventListener: (type, callback) => { listeners[type] = callback; },
  };
  const context = vm.createContext({ document });
  for (const filename of ["monthly-calculator.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), context);
  }
  listeners.DOMContentLoaded();

  return {
    elements,
    outputs,
    submit(oldPrice = "700", newPrice = "1000", days = "15") {
      elements.oldProductPrice.value = oldPrice;
      elements.newProductPrice.value = newPrice;
      elements.monthlyRemainingDays.value = days;
      let prevented = false;
      elements.monthlyForm.listeners.submit({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    },
    result(name) {
      return outputs.find((output) => output.dataset.monthlyResult === name).textContent;
    },
    submitSingle(price = "700", days = "15") {
      elements.singlePackagePrice.value = price;
      elements.singlePackageRemainingDays.value = days;
      let prevented = false;
      elements.singlePackageForm.listeners.submit({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    },
  };
}

test("monthly form renders the example with two decimal places", () => {
  const app = loadApp();
  app.submit();
  assert.equal(app.result("oldProductDifference"), "350.00 บาท");
  assert.equal(app.result("newProductDifference"), "500.00 บาท");
  assert.equal(app.result("difference"), "150.00 บาท");
  assert.equal(app.result("vat"), "10.50 บาท");
  assert.equal(app.result("net"), "160.50 บาท");
  assert.equal(app.elements.monthlyResults.hidden, false);
  assert.equal(app.elements.monthlyCreditNote.hidden, true);
});

test("invalid or missing input hides the previous result and shows an error", () => {
  const app = loadApp();
  for (const values of [["", "1000", "15"], ["700", "", "15"], ["700", "1000", ""], ["-1", "1000", "15"], ["700", "1000", "1.5"], ["700", "1000", "31"]]) {
    app.submit();
    app.submit(...values);
    assert.equal(app.elements.monthlyResults.hidden, true);
    assert.notEqual(app.elements.monthlyError.textContent, "");
    assert.equal(app.result("net"), "");
  }
});

test("editing or resetting monthly inputs clears old results", () => {
  const app = loadApp();
  for (const type of ["input", "reset"]) {
    app.submit();
    app.elements.monthlyForm.listeners[type]();
    assert.equal(app.elements.monthlyResults.hidden, true);
    assert.equal(app.elements.monthlyError.textContent, "");
    assert.ok(app.outputs.every((output) => output.textContent === ""));
  }
});

test("downgrading shows a credit and zero days renders zero", () => {
  const app = loadApp();
  app.submit("1000", "700", "15");
  assert.equal(app.result("net"), "-160.50 บาท");
  assert.equal(app.elements.monthlyCreditNote.hidden, false);
  app.submit("700", "1000", "0");
  assert.equal(app.result("net"), "0.00 บาท");
  assert.equal(app.elements.monthlyCreditNote.hidden, true);
});

test("the selector defaults to monthly and switches to single-package mode", () => {
  const app = loadApp();
  assert.equal(app.elements.monthlyMode.hidden, false);
  assert.equal(app.elements.singlePackageMode.hidden, true);
  for (const mode of ["single-package", "monthly"]) {
    app.elements.calculationMode.value = mode;
    app.elements.calculationMode.listeners.change();
    assert.equal(app.elements.monthlyMode.hidden, mode !== "monthly");
    assert.equal(app.elements.singlePackageMode.hidden, mode !== "single-package");
  }
});

test("single-package mode shows both the prorated price and the total including 7% VAT", () => {
  const app = loadApp();
  app.submitSingle();
  assert.equal(app.elements.singlePackageDailyPrice.textContent, "23.33 บาท");
  assert.equal(app.elements.singlePackageDifference.textContent, "350.00 บาท");
  assert.equal(app.elements.singlePackageDifferenceWithVat.textContent, "374.50 บาท");
  assert.equal(app.elements.singlePackageResults.hidden, false);
  assert.equal(app.elements.singlePackageError.textContent, "");
});

test("single-package mode supports zero days, a full period, free and decimal prices", () => {
  const app = loadApp();
  for (const [price, days, expected, expectedWithVat] of [
    ["700", "0", "0.00 บาท", "0.00 บาท"],
    ["700", "30", "700.00 บาท", "749.00 บาท"],
    ["0", "15", "0.00 บาท", "0.00 บาท"],
    ["999.99", "17", "566.66 บาท", "606.33 บาท"],
    ["1", "1", "0.03 บาท", "0.04 บาท"],
  ]) {
    app.submitSingle(price, days);
    assert.equal(app.elements.singlePackageDifference.textContent, expected);
    assert.equal(app.elements.singlePackageDifferenceWithVat.textContent, expectedWithVat);
    assert.equal(app.elements.singlePackageResults.hidden, false);
  }
});

test("invalid single-package input clears stale results and shows an error", () => {
  const app = loadApp();
  for (const values of [["", "15"], ["700", ""], ["-1", "15"], ["Infinity", "15"], ["abc", "15"], ["700", "-1"], ["700", "1.5"], ["700", "31"]]) {
    app.submitSingle();
    app.submitSingle(...values);
    assert.equal(app.elements.singlePackageResults.hidden, true);
    assert.equal(app.elements.singlePackageDailyPrice.textContent, "");
    assert.equal(app.elements.singlePackageDifference.textContent, "");
    assert.equal(app.elements.singlePackageDifferenceWithVat.textContent, "");
    assert.notEqual(app.elements.singlePackageError.textContent, "");
  }
});

test("single-package edit and reset clear results without changing monthly results", () => {
  const app = loadApp();
  app.submit();
  for (const type of ["input", "reset"]) {
    app.submitSingle();
    app.elements.singlePackageForm.listeners[type]();
    assert.equal(app.elements.singlePackageResults.hidden, true);
    assert.equal(app.elements.singlePackageDifference.textContent, "");
    assert.equal(app.elements.singlePackageDailyPrice.textContent, "");
    assert.equal(app.elements.singlePackageDifferenceWithVat.textContent, "");
    assert.equal(app.elements.singlePackageError.textContent, "");
    assert.equal(app.result("net"), "160.50 บาท");

    app.submitSingle("", "15");
    app.elements.singlePackageForm.listeners[type]();
    assert.equal(app.elements.singlePackageError.textContent, "");
  }
  app.submitSingle();
  app.elements.monthlyForm.listeners.reset();
  assert.equal(app.elements.singlePackageDifference.textContent, "350.00 บาท");
  assert.equal(app.elements.singlePackageDifferenceWithVat.textContent, "374.50 บาท");
});
