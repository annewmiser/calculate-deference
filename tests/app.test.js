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
  const yearlyOutputs = [...html.matchAll(/data-yearly-result="([^"]+)"/g)].map((match) => ({
    ...createElement(),
    dataset: { yearlyResult: match[1] },
  }));
  elements.calculationMode.value = "monthly";
  const listeners = {};
  const document = {
    getElementById: (id) => elements[id],
    querySelectorAll(selector) {
      if (selector === "[data-monthly-result]") return outputs;
      if (selector === "[data-yearly-result]") return yearlyOutputs;
      throw new Error(`Unexpected selector: ${selector}`);
    },
    addEventListener: (type, callback) => { listeners[type] = callback; },
  };
  const context = vm.createContext({ document });
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((match) => match[1]);
  for (const filename of scripts) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", filename), "utf8"), context);
  }
  listeners.DOMContentLoaded();

  return {
    elements,
    outputs,
    yearlyOutputs,
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
    submitYearly(oldPrice = "700", newPrice = "1000", days = "180") {
      elements.yearlyOldProductPrice.value = oldPrice;
      elements.yearlyNewProductPrice.value = newPrice;
      elements.yearlyRemainingDays.value = days;
      let prevented = false;
      elements.yearlyForm.listeners.submit({ preventDefault() { prevented = true; } });
      assert.equal(prevented, true);
    },
    yearlyResult(name) {
      return yearlyOutputs.find((output) => output.dataset.yearlyResult === name).textContent;
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

test("the selector defaults to monthly and shows only the selected mode", () => {
  const app = loadApp();
  assert.equal(app.elements.monthlyMode.hidden, false);
  assert.equal(app.elements.singlePackageMode.hidden, true);
  assert.equal(app.elements.yearlyMode.hidden, true);
  for (const mode of ["yearly", "single-package", "monthly"]) {
    app.elements.calculationMode.value = mode;
    app.elements.calculationMode.listeners.change();
    assert.equal(app.elements.monthlyMode.hidden, mode !== "monthly");
    assert.equal(app.elements.singlePackageMode.hidden, mode !== "single-package");
    assert.equal(app.elements.yearlyMode.hidden, mode !== "yearly");
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

test("yearly form renders discounted prices, proration and the final VAT-inclusive difference", () => {
  const app = loadApp();
  app.submitYearly();
  for (const [name, expected] of Object.entries({
    oldYearlyPrice: "6,720.00 บาท", newYearlyPrice: "9,600.00 บาท",
    oldMonthlyPrice: "560.00 บาท", newMonthlyPrice: "800.00 บาท",
    oldDailyPrice: "18.67 บาท", newDailyPrice: "26.67 บาท",
    oldProductDifference: "3,360.00 บาท", newProductDifference: "4,800.00 บาท",
    difference: "1,440.00 บาท", vat: "100.80 บาท", net: "1,540.80 บาท",
  })) {
    assert.equal(app.yearlyResult(name), expected);
  }
  assert.equal(app.elements.yearlyResults.hidden, false);
  assert.equal(app.elements.yearlyCreditNote.hidden, true);
  assert.equal(app.elements.yearlyError.textContent, "");
});

test("yearly input validation clears stale results and reports errors", () => {
  const app = loadApp();
  for (const values of [
    ["", "1000", "180"], ["700", "", "180"], ["700", "1000", ""],
    ["-1", "1000", "180"], ["700", "-1", "180"], ["abc", "1000", "180"],
    ["700", "Infinity", "180"], ["700", "1000", "-1"],
    ["700", "1000", "1.5"], ["700", "1000", "366"],
  ]) {
    app.submitYearly();
    app.submitYearly(...values);
    assert.equal(app.elements.yearlyResults.hidden, true);
    assert.ok(app.yearlyOutputs.every((output) => output.textContent === ""));
    assert.notEqual(app.elements.yearlyError.textContent, "");
  }
});

test("yearly form handles credits and both period boundaries", () => {
  const app = loadApp();
  app.submitYearly("1000", "700", "180");
  assert.equal(app.yearlyResult("net"), "-1,540.80 บาท");
  assert.equal(app.elements.yearlyCreditNote.hidden, false);
  app.submitYearly("700", "1000", "0");
  assert.equal(app.yearlyResult("net"), "0.00 บาท");
  assert.equal(app.elements.yearlyCreditNote.hidden, true);
  app.submitYearly("700", "1000", "365");
  assert.equal(app.yearlyResult("net"), "3,124.40 บาท");
});

test("editing or resetting yearly inputs clears results independently of other modes", () => {
  const app = loadApp();
  app.submit();
  app.submitSingle();
  for (const type of ["input", "reset"]) {
    app.submitYearly("1000", "700", "180");
    app.elements.yearlyForm.listeners[type]();
    assert.equal(app.elements.yearlyResults.hidden, true);
    assert.equal(app.elements.yearlyCreditNote.hidden, true);
    assert.ok(app.yearlyOutputs.every((output) => output.textContent === ""));
    assert.equal(app.result("net"), "160.50 บาท");
    assert.equal(app.elements.singlePackageDifferenceWithVat.textContent, "374.50 บาท");
    app.submitYearly("", "1000", "180");
    app.elements.yearlyForm.listeners[type]();
    assert.equal(app.elements.yearlyError.textContent, "");
  }
  app.submitYearly();
  app.elements.monthlyForm.listeners.reset();
  app.elements.singlePackageForm.listeners.reset();
  assert.equal(app.yearlyResult("net"), "1,540.80 บาท");
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
