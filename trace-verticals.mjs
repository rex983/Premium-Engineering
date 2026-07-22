import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const smsheet = wb.getWorksheet("Snow - Math Calculations");

// Trace the formula chain for Verticals cost
console.log("=== VERTICALS COST FORMULA CHAIN ===\n");

const cells = [
  "AA5", "AA6",   // These are referenced in Snow Load Breakdown
  "H32",          // Referenced in AA5
  "H31", "D35",   // Referenced in H32
  "D34", "T8", "I35", "I34",  // Referenced in D35
  "D33", "P8",    // Referenced in D34
  "D32",          // Referenced in D33
  "T26", "V29", "V30"  // Other vertical-related cells
];

console.log("Checking all related cells with values and formulas:\n");

for (const cellRef of cells) {
  const cell = smsheet.getCell(cellRef);
  console.log(`${cellRef}:`);
  console.log(`  Formula: ${cell.formula || "NONE"}`);
  console.log(`  Value: ${cell.value}`);
  console.log();
}

// Now let's trace some specific values with the actual data
console.log("\n=== CHECKING WITH TEST DATA (16ft height) ===");
console.log("P8 (Required Vertical Spacing):", smsheet.getCell("P8").value);
console.log("D35 (Height + 4 calculation):", smsheet.getCell("D35").value, smsheet.getCell("D35").formula);

// Get the actual numeric values
console.log("\n=== NUMERIC VALUES FOR VERIFICATION ===");
const values = {
  "H31": smsheet.getCell("H31").value,
  "D35": smsheet.getCell("D35").value,
  "H32": smsheet.getCell("H32").value,
  "AA5": smsheet.getCell("AA5").value,
};
console.log("H31 (indicator):", values.H31);
console.log("D35 (extras):", values.D35);
console.log("H32 (cost):", values.H32);
console.log("AA5 (total verticals):", values.AA5);

// Trace back the dependencies
console.log("\n=== BACKWARD TRACE ===");
console.log("D35 = ($D$34 - $T$8) * $I$35");
console.log("  D34 =", smsheet.getCell("D34").value, smsheet.getCell("D34").formula);
console.log("  T8 =", smsheet.getCell("T8").value, smsheet.getCell("T8").formula);
console.log("  I35 =", smsheet.getCell("I35").value, smsheet.getCell("I35").formula);
console.log("  I34 =", smsheet.getCell("I34").value, smsheet.getCell("I34").formula);

// The key part - what's the per-vertical cost calculation?
console.log("\n=== PER-VERTICAL CALCULATIONS ===");
console.log("H32 formula: $H$31 * $D$35");
console.log("  H31 = IF($D$35<0,0,1) =", smsheet.getCell("H31").value);
console.log("  D35 = ($D$34 - $T$8) * $I$35");
console.log("    D34 = $D$33 + 1");
console.log("      D33 = ROUNDUP($D$32,0)");
console.log("        D32 = $D$31/$P$8");
console.log("          D31 = $D$29*12");
console.log("            D29 ='Snow - Changers'!$D$54 =", smsheet.getCell("D29").value);
console.log("          P8 ='Snow - Verticals'!$Z$8 =", smsheet.getCell("P8").value);

// Height and per-foot-price
console.log("\n=== KEY INPUT VALUES ===");
console.log("D10 (leg height base):", smsheet.getCell("D10").value, smsheet.getCell("D10").formula);
console.log("D20 (leg height * 12):", smsheet.getCell("D20").value, smsheet.getCell("D20").formula);
console.log("D30 (related to another dimension):", smsheet.getCell("D30").value, smsheet.getCell("D30").formula);
