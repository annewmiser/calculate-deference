"use strict";

const YEARLY_MONTHS = 12;
const YEARLY_DISCOUNT_RATE = 0.2;
const YEARLY_DAYS_PER_MONTH = 30;
const YEARLY_VAT_RATE = 0.07;
const YEARLY_CONTRACT_DAYS = 365;

function calculate_yearly_price(py, dc = YEARLY_DISCOUNT_RATE, yr = YEARLY_MONTHS) {
  return py * yr * (1 - dc);
}

function calculate_monthly_price(ppy, yr = YEARLY_MONTHS) {
  return ppy / yr;
}

function calculate_daily_price(ppm, dy = YEARLY_DAYS_PER_MONTH) {
  return ppm / dy;
}

function calculate_dff_price(ppd, pr) {
  return ppd * pr;
}

function calculateYearlyProduct(productPrice, period) {
  if (!Number.isFinite(productPrice) || productPrice < 0) {
    throw new RangeError("ราคาแพ็กเกจต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
  }

  if (!Number.isInteger(period) || period < 0 || period > YEARLY_CONTRACT_DAYS) {
    throw new RangeError("จำนวนวันที่เหลือต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 365 วัน");
  }

  const yearlyPrice = calculate_yearly_price(productPrice);
  const monthlyPrice = calculate_monthly_price(yearlyPrice);
  const dailyPrice = calculate_daily_price(monthlyPrice);
  const productDifference = calculate_dff_price(dailyPrice, period);

  return { yearlyPrice, monthlyPrice, dailyPrice, productDifference };
}

function calculateYearlyDifference(oldProductPrice, newProductPrice, period) {
  // Both packages use the same discount and retain full precision until display.
  const oldProduct = calculateYearlyProduct(oldProductPrice, period);
  const newProduct = calculateYearlyProduct(newProductPrice, period);
  const difference = newProduct.productDifference - oldProduct.productDifference;
  const vat = difference * YEARLY_VAT_RATE;
  const result = {
    oldYearlyPrice: oldProduct.yearlyPrice,
    newYearlyPrice: newProduct.yearlyPrice,
    oldMonthlyPrice: oldProduct.monthlyPrice,
    newMonthlyPrice: newProduct.monthlyPrice,
    oldDailyPrice: oldProduct.dailyPrice,
    newDailyPrice: newProduct.dailyPrice,
    oldProductDifference: oldProduct.productDifference,
    newProductDifference: newProduct.productDifference,
    difference,
    vat,
    net: difference + vat,
  };

  if (!Object.values(result).every(Number.isFinite)) {
    throw new RangeError("ราคาแพ็กเกจสูงเกินกว่าที่จะคำนวณได้ กรุณาลดราคาที่กรอก");
  }

  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    YEARLY_MONTHS,
    YEARLY_DISCOUNT_RATE,
    YEARLY_DAYS_PER_MONTH,
    YEARLY_VAT_RATE,
    YEARLY_CONTRACT_DAYS,
    calculate_yearly_price,
    calculate_monthly_price,
    calculate_daily_price,
    calculate_dff_price,
    calculateYearlyDifference,
  };
}
