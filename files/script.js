// ===== Fitness Calorie Tracker =====

// ARRAYS: day names and sample values are stored in arrays.
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SAMPLE_DATA = [300, 400, 350, 500, 450, 300, 400];
const THRESHOLD = 2500;   // academic rule: total >= 2500 means ACTIVE
const MAX_PER_DAY = 5000; // maximum allowed calories for one day

// DOM references (DOM manipulation starts by selecting elements)
const inputGrid = document.getElementById("inputGrid");
const form = document.getElementById("calorieForm");
const formMessage = document.getElementById("formMessage");
const results = document.getElementById("results");
const inputs = [];  // array of the 7 input elements
const errors = [];  // array of the 7 error elements

// LOOP: create seven labelled input fields.
function buildInputs() {
  for (let i = 0; i < DAYS.length; i++) {
    const field = document.createElement("div");
    field.className = "field";
    field.innerHTML =
      '<label for="day' + i + '">' + DAYS[i] + '</label>' +
      '<input type="text" id="day' + i + '" inputmode="numeric" autocomplete="off" ' +
      'placeholder="0 - ' + MAX_PER_DAY + '" aria-describedby="err' + i + '">' +
      '<span class="error" id="err' + i + '" aria-live="polite"></span>';
    inputGrid.appendChild(field);
    inputs.push(field.querySelector("input"));
    errors.push(field.querySelector(".error"));
  }
}

// VALIDATION: checks one raw text value. Returns an object {valid, value, message}.
function validateValue(rawText) {
  const text = rawText.trim();
  if (text === "") return { valid: false, message: "Required. Enter 0 if no calories were burned." };
  if (text.startsWith("-")) return { valid: false, message: "Negative values are not allowed." };
  if (text.includes(".")) return { valid: false, message: "Decimals are not allowed. Use a whole number." };
  if (!/^[0-9]+$/.test(text)) return { valid: false, message: "Digits only. Letters and symbols are not allowed." };
  const number = Number(text);
  if (number > MAX_PER_DAY) return { valid: false, message: "Maximum allowed is " + MAX_PER_DAY + "." };
  return { valid: true, value: number, message: "" };
}

// Reads all fields. Returns an array of 7 numbers, or null if any field is invalid.
function readAllValues() {
  const values = [];
  let allValid = true;
  for (let i = 0; i < inputs.length; i++) {
    const check = validateValue(inputs[i].value);
    errors[i].textContent = check.message;
    inputs[i].setAttribute("aria-invalid", check.valid ? "false" : "true");
    if (check.valid) values.push(check.value); else allValid = false;
  }
  return allValid ? values : null;
}

// ARITHMETIC: total and average using a loop.
function calculateTotal(values) {
  let total = 0;
  for (let i = 0; i < values.length; i++) total += values[i];
  return total;
}
function calculateAverage(total, count) { return total / count; }

// Finds the highest or lowest value and ALL days that share it (handles ties).
function findExtreme(values, type) {
  let best = values[0];
  for (let i = 1; i < values.length; i++) {
    if (type === "max" && values[i] > best) best = values[i];
    if (type === "min" && values[i] < best) best = values[i];
  }
  const days = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] === best) days.push(DAYS[i]);
  }
  return { value: best, days: days };
}

// CONDITIONAL: inclusive comparison, 2500 gives ACTIVE.
function getStatus(total) {
  if (total >= THRESHOLD) return "ACTIVE";
  return "INACTIVE";
}

// DOM: show all results.
function showResults(values) {
  const total = calculateTotal(values);
  const average = calculateAverage(total, values.length);
  const highest = findExtreme(values, "max");
  const lowest = findExtreme(values, "min");
  const status = getStatus(total);

  document.getElementById("totalValue").textContent = total + " kcal";
  document.getElementById("averageValue").textContent = average.toFixed(2) + " kcal";
  document.getElementById("highestDays").textContent = highest.days.join(", ");
  document.getElementById("highestValue").textContent = highest.value + " kcal";
  document.getElementById("lowestDays").textContent = lowest.days.join(", ");
  document.getElementById("lowestValue").textContent = lowest.value + " kcal";
  document.getElementById("differenceValue").textContent = (highest.value - lowest.value) + " kcal";

  const badge = document.getElementById("statusBadge");
  badge.textContent = status;
  badge.className = "badge " + (status === "ACTIVE" ? "active" : "inactive");
  document.getElementById("statusText").textContent = status === "ACTIVE"
    ? "Weekly total reached the " + THRESHOLD + " kcal target."
    : "Weekly total is " + (THRESHOLD - total) + " kcal short of the " + THRESHOLD + " kcal target.";

  // Progress is capped at 100% for the bar only; the real total is shown as text.
  let percent = (total / THRESHOLD) * 100;
  if (percent > 100) percent = 100;
  document.getElementById("progressFill").style.width = percent + "%";
  document.getElementById("progressTrack").setAttribute("aria-valuenow", Math.round(percent));
  document.getElementById("progressLabel").textContent = total + " / " + THRESHOLD + " kcal (" + Math.round(percent) + "% shown)";

  drawChart(values, highest.value);
  results.hidden = false;
}

// Bar chart built with plain divs. Heights are relative to the highest value.
function drawChart(values, maxValue) {
  const chart = document.getElementById("chart");
  chart.innerHTML = "";
  const labelRow = document.createElement("div");
  labelRow.className = "chart-labels";
  for (let i = 0; i < values.length; i++) {
    const col = document.createElement("div");
    col.className = "bar-col";
    const height = maxValue === 0 ? 0 : (values[i] / maxValue) * 80; // all-zero safe
    col.innerHTML = '<span class="bar-value">' + values[i] + '</span>' +
      '<div class="bar" style="height:' + height + '%"></div>';
    chart.appendChild(col);
    const label = document.createElement("span");
    label.textContent = DAYS[i].slice(0, 3);
    label.title = DAYS[i];
    labelRow.appendChild(label);
  }
  // Day labels sit under the axis line, directly after the chart.
  if (chart.nextElementSibling && chart.nextElementSibling.className === "chart-labels") chart.nextElementSibling.remove();
  chart.insertAdjacentElement("afterend", labelRow);
}

function clearResults() {
  results.hidden = true;
  document.getElementById("chart").innerHTML = "";
  const old = document.querySelector(".chart-labels");
  if (old) old.remove();
  document.getElementById("progressFill").style.width = "0%";
  document.getElementById("progressTrack").setAttribute("aria-valuenow", 0);
  document.getElementById("statusBadge").textContent = "";
  document.getElementById("statusBadge").className = "badge";
  document.getElementById("statusText").textContent = "";
  document.getElementById("progressLabel").textContent = "";
}

// EVENT HANDLING
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const values = readAllValues();
  if (values === null) {
    clearResults(); // never show misleading results
    formMessage.textContent = "Please fix the highlighted fields and try again.";
    return;
  }
  formMessage.textContent = "";
  showResults(values);
});

document.getElementById("sampleBtn").addEventListener("click", function () {
  for (let i = 0; i < inputs.length; i++) inputs[i].value = SAMPLE_DATA[i];
  formMessage.textContent = "";
  const values = readAllValues(); // clears old errors and gives valid array
  if (values !== null) showResults(values);
});

document.getElementById("resetBtn").addEventListener("click", function () {
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].value = "";
    inputs[i].setAttribute("aria-invalid", "false");
    errors[i].textContent = "";
  }
  formMessage.textContent = "";
  clearResults();
});

buildInputs();
