import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const slsheet = wb.getWorksheet("Snow Load Breakdown");
const smsheet = wb.getWorksheet("Snow - Math Calculations");

// Focus on X31 which seems to be the Verticals price
console.log("=== KEY PRICE CELLS ===\n");

// Check Row 31 for Verticals price breakdown
console.log("Snow Load Breakdown Row 31 (Verticals data):");
for (let c = 1; c <= 25; c++) {
  const cell = slsheet.getCell(31, c);
  if (cell.value || cell.formula) {
    const colLetter = String.fromCharCode(64 + c);
    console.log(`  ${colLetter}31: val="${cell.value}" | formula="${cell.formula || ""}"`);
  }
}

// Check specific cells
console.log("\n\nCritical Verticals formulas:");
console.log("X31: ", slsheet.getCell("X31").formula, "=", slsheet.getCell("X31").value);
console.log("V31: ", slsheet.getCell("V31").formula, "=", slsheet.getCell("V31").value);

console.log("\n\nSnow - Math Calculations AA5 (Total Verticals cost):");
const aa5 = smsheet.getCell("AA5");
console.log(`  AA5: val="${aa5.value}" | formula="${aa5.formula || ""}"`);

console.log("\nSnow - Math Calculations AA6 (Vertical pricing):");
const aa6 = smsheet.getCell("AA6");
console.log(`  AA6: val="${aa6.value}" | formula="${aa6.formula || ""}"`);

// Scan Snow - Math Calculations for all formulas
console.log("\n\n=== SNOW - MATH CALCULATIONS FORMULAS ===");
for (let r = 1; r <= 35; r++) {
  for (let c = 1; c <= 30; c++) {
    const cell = smsheet.getCell(r, c);
    if (cell.formula) {
      console.log(`  ${cell.address}: formula="${cell.formula}"`);
    }
  }
}
