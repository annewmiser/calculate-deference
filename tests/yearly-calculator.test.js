const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculate_yearly_price,
  calculate_monthly_price,
  calculate_daily_price,
  calculate_dff_price,
  calculateYearlyDifference,
} = require("../yearly-calculator.js");

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `Expected ${actual} to equal ${expected}`);
}

test("yearly upgrade discounts both packages and adds VAT only to their difference", () => {
  const result = calculateYearlyDifference(700, 1000, 180);
  closeTo(result.oldYearlyPrice, 6720);
  closeTo(result.newYearlyPrice, 9600);
  closeTo(result.oldMonthlyPrice, 560);
  closeTo(result.newMonthlyPrice, 800);
  closeTo(result.oldDailyPrice, 560 / 30);
  closeTo(result.newDailyPrice, 800 / 30);
  closeTo(result.oldProductDifference, 3360);
  closeTo(result.newProductDifference, 4800);
  closeTo(result.difference, 1440);
  closeTo(result.vat, 100.8);
  closeTo(result.net, 1540.8);
});

test("requested calculation functions accept explicit constants and defaults", () => {
  closeTo(calculate_yearly_price(1000, 0.2, 12), 9600);
  closeTo(calculate_yearly_price(1000), 9600);
  closeTo(calculate_monthly_price(9600, 12), 800);
  closeTo(calculate_monthly_price(9600), 800);
  closeTo(calculate_daily_price(800, 30), 800 / 30);
  closeTo(calculate_daily_price(800), 800 / 30);
  closeTo(calculate_dff_price(800 / 30, 180), 4800);
});

test("full yearly period, zero days, equal prices and free packages are supported", () => {
  closeTo(calculateYearlyDifference(700, 1000, 365).net, 3124.4);
  closeTo(calculateYearlyDifference(700, 1000, 0).net, 0);
  closeTo(calculateYearlyDifference(700, 700, 180).net, 0);
  closeTo(calculateYearlyDifference(0, 1000, 180).net, 5136);
  closeTo(calculateYearlyDifference(1000, 0, 180).net, -5136);
});

test("a yearly downgrade preserves the negative difference and VAT", () => {
  const result = calculateYearlyDifference(1000, 700, 180);
  closeTo(result.difference, -1440);
  closeTo(result.vat, -100.8);
  closeTo(result.net, -1540.8);
});

test("discounted daily prices are not rounded before proration or VAT", () => {
  const result = calculateYearlyDifference(699.99, 999.99, 17);
  closeTo(result.oldProductDifference, 317.3288);
  closeTo(result.newProductDifference, 453.3288);
  closeTo(result.net, 145.52);
  closeTo(calculateYearlyDifference(0, 1, 1).net, 0.028533333333333334);
});

test("invalid prices and non-finite calculated amounts are rejected", () => {
  for (const price of [-1, NaN, Infinity, -Infinity, "700", null, undefined, Number.MAX_VALUE]) {
    assert.throws(() => calculateYearlyDifference(price, 1000, 180), RangeError);
    assert.throws(() => calculateYearlyDifference(700, price, 180), RangeError);
  }
});

test("yearly days must be whole days from zero through 365", () => {
  for (const period of [-1, 366, 1.5, NaN, Infinity, "180", null, undefined]) {
    assert.throws(() => calculateYearlyDifference(700, 1000, period), RangeError);
  }
});
