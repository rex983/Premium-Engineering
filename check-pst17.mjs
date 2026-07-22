import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const pssheet = wb.getWorksheet("PSB-Quote Sheet");

console.log("=== PSB-QUOTE SHEET HEIGHT CELLS ===\n");

console.log("L17 (might be height input):");
console.log("  Value:", pssheet.getCell("L17").value);
console.log("  Formula:", pssheet.getCell("L17").formula);

console.log("\nT17 (referenced by Snow-Changers D29):");
console.log("  Value:", pssheet.getCell("T17").value);
console.log("  Formula:", pssheet.getCell("T17").formula);

console.log("\nP17 (referenced by SMC D2):");
console.log("  Value:", pssheet.getCell("P17").value);
console.log("  Formula:", pssheet.getCell("P17").formula);

console.log("\n\n=== CHECKING ROW 17 CONTEXT ===");
for (let c = 1; c <= 25; c++) {
  const cell = pssheet.getCell(17, c);
  if (cell.value || cell.formula) {
    const colLetter = String.fromCharCode(64 + c);
    console.log(`${colLetter}17: ${cell.value || cell.formula}`);
  }
}

console.log("\n\n=== UNDERSTANDING THE INPUT ===");
console.log("Row 16 (likely labels):");
for (let c = 11; c <= 20; c++) {
  const cell = pssheet.getCell(16, c);
  if (cell.value) {
    const colLetter = String.fromCharCode(64 + c);
    console.log(`${colLetter}16: ${cell.value}`);
  }
}

console.log("\n\nSo if P17=20 (WIDTH) and T17=8 (something)");
console.log("And L17=12 (HEIGHT in feet)");

console.log("\n\nNow let's reconsider:");
console.log("D20 (in SMC) = 8 = Height base or something?");
console.log("D10 (in SMC) = ?");

const d10 = wb.getWorksheet("Snow - Math Calculations").getCell("D10");
console.log("D10 formula:", d10.formula);
console.log("D10 value:", d10.value);

const d29Changers = wb.getWorksheet("Snow - Changers").getCell("D29");
console.log("\nSnow-Changers D29 formula:", d29Changers.formula);
console.log("Which means Snow-Changers!D29 = PSB-Quote Sheet!T17");

// Let me check if there's a height vs leg height distinction
console.log("\n\n=== HEIGHT DISTINCTION ===");
console.log("Let me check what the actual data labels are on PSB-Quote Sheet row 15-16:");

for (let c = 11; c <= 20; c++) {
  const cell15 = pssheet.getCell(15, c);
  const cell16 = pssheet.getCell(16, c);
  const cell17 = pssheet.getCell(17, c);
  const colLetter = String.fromCharCode(64 + c);
  if (cell15.value || cell16.value) {
    console.log(`${colLetter}15: ${cell15.value || ''} | ${colLetter}16: ${cell16.value} | ${colLetter}17: ${cell17.value}`);
  }
}
