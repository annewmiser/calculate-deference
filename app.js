// ========================================
// Helper Functions
// ========================================

// Recurring Amount ต่อเดือน ÷ 30 = ราคาต่อวัน

document.addEventListener("DOMContentLoaded", function () {

  function addEnterEvent(inputIds, callback) {
    inputIds.forEach(function (id) {
      const input = document.getElementById(id);

      if (!input) {
        return;
      }

      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          callback();
        }
      });
    });
  }


  // Step 1
  addEnterEvent(
    ["recurringAmount", "remainingDays"],
    calculatePriceDifference
  );


  // Step 2
  addEnterEvent(
    ["productPrice", "numberOfMonths"],
    calculateContract
  );

});
function calculateDailyPrice(recurringAmount) {
  return recurringAmount / 30;
}


// Daily Price × Remaining Days = ส่วนต่าง
function calculateDifference(dailyPrice, remainingDays) {
  return dailyPrice * remainingDays;
}


// Product Price × จำนวนเดือน
function calculateContractPrice(productPrice, numberOfMonths) {
  return productPrice * numberOfMonths;
}


// Contract Price + Price Difference
function calculateTotalPrice(contractPrice, priceDifference) {
  return contractPrice + priceDifference;
}


// ปัดเป็นทศนิยม 1 ตำแหน่ง
// มากกว่า 0.05 จึงปัดขึ้น
function roundPriceOneDecimal(price) {
  const scaledPrice = price * 10;
  const basePrice = Math.floor(scaledPrice);
  const remainder = scaledPrice - basePrice;

  if (remainder > 0.5 + Number.EPSILON) {
    return (basePrice + 1) / 10;
  }

  return basePrice / 10;
}


// แสดงราคาให้มีทศนิยม 1 ตำแหน่งเสมอ
function formatPrice(price) {
  return price.toLocaleString("th-TH", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}


// ========================================
// Step 1
// Calculate Price Difference
// ========================================

function calculatePriceDifference() {
  const recurringInput =
    document.getElementById("recurringAmount").value;

  const remainingDaysInput =
    document.getElementById("remainingDays").value;


  if (recurringInput === "") {
    document.getElementById("result_priceDifference").textContent =
      "กรุณากรอก Recurring Amount";

    return;
  }


  if (remainingDaysInput === "") {
    document.getElementById("result_priceDifference").textContent =
      "กรุณากรอก Remaining Days";

    return;
  }


  const recurringAmount = Number(recurringInput);
  const remainingDays = Number(remainingDaysInput);


  if (
    !Number.isFinite(recurringAmount) ||
    recurringAmount <= 0
  ) {
    document.getElementById("result_priceDifference").textContent =
      "Recurring Amount ต้องมากกว่า 0";

    return;
  }


  if (
    !Number.isInteger(remainingDays) ||
    remainingDays < 0
  ) {
    document.getElementById("result_priceDifference").textContent =
      "Remaining Days ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป";

    return;
  }


  // Recurring Amount ÷ 30
  const dailyPrice =
    calculateDailyPrice(recurringAmount);


  // Daily Price × Remaining Days
  const rawPriceDifference =
    calculateDifference(
      dailyPrice,
      remainingDays
    );


  const displayDailyPrice =
    roundPriceOneDecimal(dailyPrice);

  const priceDifference =
    roundPriceOneDecimal(rawPriceDifference);


  document.getElementById("result_dailyPrice").textContent =
    `Daily Price: ${formatPrice(displayDailyPrice)} บาท`;


  document.getElementById("result_priceDifference").textContent =
    `Price Difference: ${formatPrice(priceDifference)} บาท`;
}


// ========================================
// Step 2
// Calculate Contract Price
// ========================================

function calculateContract() {
  const productPriceInput =
    document.getElementById("productPrice").value;

  const numberOfMonthsInput =
    document.getElementById("numberOfMonths").value;


  if (productPriceInput === "") {
    document.getElementById("result_contractPrice").textContent =
      "กรุณากรอก Product Price";

    return;
  }


  if (numberOfMonthsInput === "") {
    document.getElementById("result_contractPrice").textContent =
      "กรุณากรอก Number of Months";

    return;
  }


  const productPrice =
    Number(productPriceInput);

  const numberOfMonths =
    Number(numberOfMonthsInput);


  if (
    !Number.isFinite(productPrice) ||
    productPrice <= 0
  ) {
    document.getElementById("result_contractPrice").textContent =
      "Product Price ต้องมากกว่า 0";

    return;
  }


  if (
    !Number.isInteger(numberOfMonths) ||
    numberOfMonths <= 0
  ) {
    document.getElementById("result_contractPrice").textContent =
      "Number of Months ต้องเป็นจำนวนเต็มมากกว่า 0";

    return;
  }


  const contractPrice =
    calculateContractPrice(
      productPrice,
      numberOfMonths
    );


  document.getElementById("result_contractPrice").textContent =
    `Contract Price: ${formatPrice(contractPrice)} บาท`;
}


// ========================================
// Step 3
// Contract Price + Price Difference
// ========================================

function calculateContractTotal() {
  const recurringInput =
    document.getElementById("recurringAmount").value;

  const remainingDaysInput =
    document.getElementById("remainingDays").value;

  const productPriceInput =
    document.getElementById("productPrice").value;

  const numberOfMonthsInput =
    document.getElementById("numberOfMonths").value;


  if (
    recurringInput === "" ||
    remainingDaysInput === "" ||
    productPriceInput === "" ||
    numberOfMonthsInput === ""
  ) {
    document.getElementById("result_totalPrice").textContent =
      "กรุณากรอกข้อมูลให้ครบ";

    return;
  }


  const recurringAmount =
    Number(recurringInput);

  const remainingDays =
    Number(remainingDaysInput);

  const productPrice =
    Number(productPriceInput);

  const numberOfMonths =
    Number(numberOfMonthsInput);


  if (
    recurringAmount <= 0 ||
    !Number.isInteger(remainingDays) ||
    remainingDays < 0 ||
    productPrice <= 0 ||
    !Number.isInteger(numberOfMonths) ||
    numberOfMonths <= 0
  ) {
    document.getElementById("result_totalPrice").textContent =
      "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง";

    return;
  }


  // Price Difference
  const dailyPrice =
    calculateDailyPrice(recurringAmount);

  const rawPriceDifference =
    calculateDifference(
      dailyPrice,
      remainingDays
    );

  const priceDifference =
    roundPriceOneDecimal(rawPriceDifference);


  // Contract Price
  const contractPrice =
    calculateContractPrice(
      productPrice,
      numberOfMonths
    );


  // Contract Price + Difference
  const totalPrice =
    calculateTotalPrice(
      contractPrice,
      priceDifference
    );


  document.getElementById("result_totalPrice").textContent =
    `Total Price: ${formatPrice(totalPrice)} บาท`;
}


// reset
function resetSection(event) {
    const container = event.target.closest('.container'); // หากล่องแม่
    if (!container) return;

    // เคลียร์ input ภายใน container
    const inputs = container.querySelectorAll('input[type="text"] , input[type="number"]');
    inputs.forEach(input => input.value = "");

    // เคลียร์ <p> ที่มี id และอยู่ใน container
    const outputs = container.querySelectorAll('p[id]');
    outputs.forEach(p => p.innerHTML = "");
}

// เพิ่ม Event Listener ให้กับปุ่ม reset ทุกปุ่ม
document.querySelectorAll('.reset').forEach(btn => {
    btn.addEventListener('click', resetSection);
});



