document.addEventListener("DOMContentLoaded", function () {
  const modeSelect = document.getElementById("calculationMode");
  function updateMode() {
    document.getElementById("monthlyMode").hidden = modeSelect.value !== "monthly";
    document.getElementById("yearlyMode").hidden = modeSelect.value !== "yearly";
    document.getElementById("singlePackageMode").hidden = modeSelect.value !== "single-package";
  }
  modeSelect.addEventListener("change", updateMode);
  updateMode();

  const monthlyForm = document.getElementById("monthlyForm");
  monthlyForm.addEventListener("submit", calculateMonthlyPriceDifference);
  monthlyForm.addEventListener("input", clearMonthlyResults);
  monthlyForm.addEventListener("reset", clearMonthlyResults);

  const yearlyForm = document.getElementById("yearlyForm");
  yearlyForm.addEventListener("submit", calculateYearlyPriceDifference);
  yearlyForm.addEventListener("input", clearYearlyResults);
  yearlyForm.addEventListener("reset", clearYearlyResults);

  const singlePackageForm = document.getElementById("singlePackageForm");
  singlePackageForm.addEventListener("submit", calculateSinglePackageDifference);
  singlePackageForm.addEventListener("input", clearSinglePackageResults);
  singlePackageForm.addEventListener("reset", clearSinglePackageResults);
});

function formatPrice(amount) {
  return amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " บาท";
}

function clearMonthlyResults() {
  document.getElementById("monthlyResults").hidden = true;
  document.getElementById("monthlyError").textContent = "";
  document.getElementById("monthlyCreditNote").hidden = true;
  document.querySelectorAll("[data-monthly-result]").forEach(function (output) {
    output.textContent = "";
  });
}

function calculateMonthlyPriceDifference(event) {
  event.preventDefault();
  clearMonthlyResults();

  const oldPriceInput = document.getElementById("oldProductPrice").value.trim();
  const newPriceInput = document.getElementById("newProductPrice").value.trim();
  const periodInput = document.getElementById("monthlyRemainingDays").value.trim();
  const errorOutput = document.getElementById("monthlyError");

  if (oldPriceInput === "" || newPriceInput === "" || periodInput === "") {
    errorOutput.textContent = "กรุณากรอกราคาแพ็กเกจเดิม ราคาแพ็กเกจใหม่ และจำนวนวันที่เหลือให้ครบ";
    return;
  }

  try {
    const result = calculateMonthlyDifference(
      Number(oldPriceInput),
      Number(newPriceInput),
      Number(periodInput)
    );

    document.querySelectorAll("[data-monthly-result]").forEach(function (output) {
      output.textContent = formatPrice(result[output.dataset.monthlyResult]);
    });

    document.getElementById("monthlyResults").hidden = false;
    document.getElementById("monthlyCreditNote").hidden = result.net >= 0;
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }
    errorOutput.textContent = error.message;
  }
}

function clearYearlyResults() {
  document.getElementById("yearlyResults").hidden = true;
  document.getElementById("yearlyError").textContent = "";
  document.getElementById("yearlyCreditNote").hidden = true;
  document.querySelectorAll("[data-yearly-result]").forEach(function (output) {
    output.textContent = "";
  });
}

function calculateYearlyPriceDifference(event) {
  event.preventDefault();
  clearYearlyResults();

  const oldPriceInput = document.getElementById("yearlyOldProductPrice").value.trim();
  const newPriceInput = document.getElementById("yearlyNewProductPrice").value.trim();
  const periodInput = document.getElementById("yearlyRemainingDays").value.trim();
  const errorOutput = document.getElementById("yearlyError");

  if (oldPriceInput === "" || newPriceInput === "" || periodInput === "") {
    errorOutput.textContent = "กรุณากรอกราคาแพ็กเกจเดิม ราคาแพ็กเกจใหม่ และจำนวนวันที่เหลือให้ครบ";
    return;
  }

  try {
    const result = calculateYearlyDifference(
      Number(oldPriceInput),
      Number(newPriceInput),
      Number(periodInput)
    );

    document.querySelectorAll("[data-yearly-result]").forEach(function (output) {
      output.textContent = formatPrice(result[output.dataset.yearlyResult]);
    });

    document.getElementById("yearlyResults").hidden = false;
    document.getElementById("yearlyCreditNote").hidden = result.net >= 0;
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }
    errorOutput.textContent = error.message;
  }
}

function clearSinglePackageResults() {
  document.getElementById("singlePackageResults").hidden = true;
  document.getElementById("singlePackageError").textContent = "";
  document.getElementById("singlePackageDailyPrice").textContent = "";
  document.getElementById("singlePackageDifference").textContent = "";
  document.getElementById("singlePackageDifferenceWithVat").textContent = "";
}

function calculateSinglePackageDifference(event) {
  event.preventDefault();
  clearSinglePackageResults();

  const productPriceInput = document.getElementById("singlePackagePrice").value.trim();
  const periodInput = document.getElementById("singlePackageRemainingDays").value.trim();
  const errorOutput = document.getElementById("singlePackageError");

  if (productPriceInput === "" || periodInput === "") {
    errorOutput.textContent = "กรุณากรอกราคาแพ็กเกจและจำนวนวันที่เหลือให้ครบ";
    return;
  }

  try {
    const productPrice = Number(productPriceInput);
    const difference = calculate_difference_price_oldder_product(productPrice, Number(periodInput));

    document.getElementById("singlePackageDailyPrice").textContent = formatPrice(productPrice / MONTHLY_CONTRACT_DAYS);
    document.getElementById("singlePackageDifference").textContent = formatPrice(difference);
    document.getElementById("singlePackageDifferenceWithVat").textContent = formatPrice(difference + difference * VAT_RATE);
    document.getElementById("singlePackageResults").hidden = false;
  } catch (error) {
    if (!(error instanceof RangeError)) {
      throw error;
    }
    errorOutput.textContent = error.message;
  }
}



