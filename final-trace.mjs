import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const smsheet = wb.getWorksheet("Snow - Math Calculations");
const slsheet = wb.getWorksheet("Snow Load Breakdown");
const svsheet = wb.getWorksheet("Snow - Verticals");
const pssheet = wb.getWorksheet("PSB-Quote Sheet");

// Get the actual result values using cell.result
console.log("=== ACTUAL CALCULATED VALUES ===\n");

// Direct access to calculated values
const getVal = (sheet, ref) => {
  const cell = sheet.getCell(ref);
  return cell.result ?? cell.value ?? cell.formula;
};

console.log("Heights/Dimensions:");
console.log("  PSB D2 (Width):", getVal(smsheet, "D2"));
console.log("  SMC D10 (Leg height base):", getVal(smsheet, "D10"));
console.log("  SMC D20 (Leg height in inches):", getVal(smsheet, "D20"));
console.log("  SMC D21 (Leg height in inches * 12?):", getVal(smsheet, "D21"));
console.log("  SMC D30 (Base leg height):", getVal(smsheet, "D30"));
console.log("  SMC D31 (Inches for calc):", getVal(smsheet, "D31"));

console.log("\nVertical Spacing:");
console.log("  SMC P8 (Required spacing from table):", getVal(smsheet, "P8"));
console.log("  SVsheet Z8 (lookup result):", getVal(svsheet, "Z8"));

console.log("\nVertical Extras Calculation:");
console.log("  SMC D32 (D31/P8):", getVal(smsheet, "D32"));
console.log("  SMC D33 (ROUNDUP D32):", getVal(smsheet, "D33"));
console.log("  SMC D34 (D33+1):", getVal(smsheet, "D34"));
console.log("  SMC T8 (Original Verticals from Snow-Verticals!B21):", getVal(smsheet, "T8"));
console.log("  SMC I34 (Is Enclosed Ends?):", getVal(smsheet, "I34"));
console.log("  SMC I35 (I34 * L28 qty):", getVal(smsheet, "I35"));
console.log("  PSB L28 (Enclosed Ends qty):", getVal(pssheet, "L28"));

console.log("\nFinal Extras & Cost:");
console.log("  SMC D35 ((D34-T8)*I35):", getVal(smsheet, "D35"));
console.log("  SMC H31 (IF D35<0):", getVal(smsheet, "H31"));
console.log("  SMC H32 (H31*D35 - TOTAL COST):", getVal(smsheet, "H32"));

console.log("\nFinal Verticals Cost in Snow Load Breakdown:");
console.log("  SLB V31 (references AA5):", getVal(slsheet, "V31"));
console.log("  SMC AA5:", getVal(smsheet, "AA5"));

// Now read exact formula text
console.log("\n\n=== FORMULA TEXT ===");
const fh32 = smsheet.getCell("H32").formula;
const fd35 = smsheet.getCell("D35").formula;
const fd34 = smsheet.getCell("D34").formula;
const fd33 = smsheet.getCell("D33").formula;
const fd32 = smsheet.getCell("D32").formula;
const fd31 = smsheet.getCell("D31").formula;
const fd29 = smsheet.getCell("D29").formula;
const fp8 = smsheet.getCell("P8").formula;
const ft8 = smsheet.getCell("T8").formula;
const fi35 = smsheet.getCell("I35").formula;

console.log("H32 (TOTAL VERTICALS COST):", fh32);
console.log("  = H31 * D35");
console.log("  = H31 * ((D34 - T8) * I35)");
console.log("     D34 = D33 + 1");
console.log("       D33 = ROUNDUP(D32, 0) = ROUNDUP(" + fd32 + ", 0)");
console.log("         D32 = D31 / P8");
console.log("           D31 =", fd31);
console.log("           P8 =", fp8);
console.log("     T8 =", ft8);
console.log("     I35 =", fi35);

// Get the vertical price per foot from the pricing sheet
console.log("\n\n=== CHECKING PRICING SHEETS ===");
const pricesheets = [
  "Pricing - Changers",
  "Pricing - Legs",
  "Pricing - Roof Style",
];

for (const sheetName of pricesheets) {
  const sheet = wb.getWorksheet(sheetName);
  if (sheet && sheet.getCell("U69")) {
    console.log(`\n${sheetName}:`);
    console.log("  U69:", sheet.getCell("U69").value);
  }
  if (sheet && sheet.getCell("D66")) {
    console.log("  D66:", sheet.getCell("D66").value);
  }
}

console.log("\n\n=== CHECK PRICING-CHANGERS FOR VERTICAL PRICING ===");
const pc = wb.getWorksheet("Pricing - Changers");
if (pc) {
  // Scan for "Vertical" in first 80 rows
  let found = false;
  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 30; c++) {
      const cell = pc.getCell(r, c);
      if (cell.value && typeof cell.value === "string" && cell.value.toLowerCase().includes("vertical")) {
        console.log(`  ${cell.address}: ${cell.value}`);
        found = true;
      }
    }
  }
  if (!found) console.log("  (No 'Vertical' text found in Pricing - Changers)");
}
