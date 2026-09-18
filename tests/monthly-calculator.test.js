const test = require("node:test");
const assert = require("node:assert/strict");
const {
  calculate_difference_price_oldder_product,
  calculate_difference_price_new_product,
  difference_between_newproduct_oldproduct,
  calculateMonthlyDifference,
} = require("../monthly-calculator.js");

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `Expected ${actual} to equal ${expected}`);
}

test("700 to 1000 with 15 days remaining costs 160.50 including VAT", () => {
  const result = calculateMonthlyDifference(700, 1000, 15);
  closeTo(result.oldDailyPrice, 700 / 30);
  closeTo(result.newDailyPrice, 1000 / 30);
  closeTo(result.oldProductDifference, 350);
  closeTo(result.newProductDifference, 500);
  closeTo(result.difference, 150);
  closeTo(result.vat, 10.5);
  closeTo(result.net, 160.5);
});

test("individual calculation functions follow the requested formula", () => {
  closeTo(calculate_difference_price_oldder_product(700, 15), 350);
  closeTo(calculate_difference_price_new_product(1000, 15), 500);
  closeTo(difference_between_newproduct_oldproduct(350, 500), 160.5);
});

test("a full 30-day period charges the full monthly difference plus VAT", () => {
  closeTo(calculateMonthlyDifference(700, 1000, 30).net, 321);
});

test("daily rates are not rounded before calculating partial periods", () => {
  const result = calculateMonthlyDifference(700, 1000, 1);
  closeTo(result.difference, 10);
  closeTo(result.net, 10.7);
  closeTo(calculateMonthlyDifference(699.99, 999.99, 17).net, 181.9);
});

test("zero remaining days or equal package prices have no additional charge", () => {
  const expired = calculateMonthlyDifference(700, 1000, 0);
  assert.equal(expired.oldProductDifference, 0);
  assert.equal(expired.newProductDifference, 0);
  assert.equal(expired.net, 0);
  assert.equal(calculateMonthlyDifference(700, 700, 15).net, 0);
});

test("a lower package price preserves the negative difference and VAT", () => {
  const result = calculateMonthlyDifference(1000, 700, 15);
  closeTo(result.difference, -150);
  closeTo(result.vat, -10.5);
  closeTo(result.net, -160.5);
});

test("free packages are supported", () => {
  closeTo(calculateMonthlyDifference(0, 1000, 15).net, 535);
  closeTo(calculateMonthlyDifference(1000, 0, 15).net, -535);
});

test("invalid prices are rejected for either package", () => {
  for (const price of [-1, NaN, Infinity, -Infinity, "700", null, undefined]) {
    assert.throws(() => calculateMonthlyDifference(price, 1000, 15), RangeError);
    assert.throws(() => calculateMonthlyDifference(700, price, 15), RangeError);
  }
});

test("remaining days must be whole days within the 30-day contract", () => {
  for (const period of [-1, 31, 1.5, NaN, Infinity, "15", null, undefined]) {
    assert.throws(() => calculateMonthlyDifference(700, 1000, period), RangeError);
  }
});
