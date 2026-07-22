import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const smsheet = wb.getWorksheet("Snow - Math Calculations");

// H32 is "per-vertical" or "total extras"? Let's check what U19 is
console.log("=== FINDING PER-VERTICAL PRICE ===\n");

console.log("AA6 formula:", smsheet.getCell("AA6").formula);
console.log("  References U19");

console.log("\nU19 (Per Vertical pricing):");
console.log("  Formula:", smsheet.getCell("U19").formula);
console.log("  Value:", smsheet.getCell("U19").value);

console.log("\nU18:");
console.log("  Formula:", smsheet.getCell("U18").formula);
console.log("  Value:", smsheet.getCell("U18").value);

console.log("\nU17:");
console.log("  Formula:", smsheet.getCell("U17").formula);
console.log("  Value:", smsheet.getCell("U17").value);

console.log("\nU16:");
console.log("  Formula:", smsheet.getCell("U16").formula);
console.log("  Value:", smsheet.getCell("U16").value);

console.log("\nU15:");
console.log("  Formula:", smsheet.getCell("U15").formula);
console.log("  Value:", smsheet.getCell("U15").value);

console.log("\nU14:");
console.log("  Formula:", smsheet.getCell("U14").formula);
console.log("  Value:", smsheet.getCell("U14").value);

console.log("\nU13:");
console.log("  Formula:", smsheet.getCell("U13").formula);
console.log("  Value:", smsheet.getCell("U13").value);

// Check Pricing - Changers for the tubing price
console.log("\n\n=== PRICING - CHANGERS ===");
const pc = wb.getWorksheet("Pricing - Changers");

// Find cells with "tube" or "tubing" or "$"
for (let r = 1; r <= 100; r++) {
  for (let c = 1; c <= 30; c++) {
    const cell = pc.getCell(r, c);
    if (cell.value && (
      (typeof cell.value === "string" && (cell.value.includes("tubing") || cell.value.includes("Tubing") || cell.value.includes("tube"))) ||
      (typeof cell.value === "number" && cell.value > 10 && cell.value < 50 && r > 60)
    )) {
      console.log(`  ${cell.address}: ${cell.value}`);
    }
  }
}
