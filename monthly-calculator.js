"use strict";

const MONTHLY_CONTRACT_DAYS = 30;
const VAT_RATE = 0.07;

function validateMonthlyProduct(productPrice, period) {
  if (!Number.isFinite(productPrice) || productPrice < 0) {
    throw new RangeError("ราคาแพ็กเกจต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
  }

  if (!Number.isInteger(period) || period < 0 || period > MONTHLY_CONTRACT_DAYS) {
    throw new RangeError("จำนวนวันที่เหลือต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 30 วัน");
  }
}

function calculate_difference_price_oldder_product(productPrice, period) {
  validateMonthlyProduct(productPrice, period);
  return (productPrice / MONTHLY_CONTRACT_DAYS) * period;
}

function calculate_difference_price_new_product(newProductPrice, period) {
  validateMonthlyProduct(newProductPrice, period);
  return (newProductPrice / MONTHLY_CONTRACT_DAYS) * period;
}

function difference_between_newproduct_oldproduct(dfOld, dfNew) {
  const difference = dfNew - dfOld;
  return difference + difference * VAT_RATE;
}

function calculateMonthlyDifference(oldProductPrice, newProductPrice, period) {
  // Keep the full daily rates until display; rounding them first changes the bill.
  const oldProductDifference = calculate_difference_price_oldder_product(oldProductPrice, period);
  const newProductDifference = calculate_difference_price_new_product(newProductPrice, period);
  const difference = newProductDifference - oldProductDifference;

  return {
    oldDailyPrice: oldProductPrice / MONTHLY_CONTRACT_DAYS,
    newDailyPrice: newProductPrice / MONTHLY_CONTRACT_DAYS,
    oldProductDifference,
    newProductDifference,
    difference,
    vat: difference * VAT_RATE,
    net: difference_between_newproduct_oldproduct(oldProductDifference, newProductDifference),
  };
}

// The same calculation runs in the browser and in the Node.js tests.
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    MONTHLY_CONTRACT_DAYS,
    VAT_RATE,
    calculate_difference_price_oldder_product,
    calculate_difference_price_new_product,
    difference_between_newproduct_oldproduct,
    calculateMonthlyDifference,
  };
}
