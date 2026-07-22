import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const pssheet = wb.getWorksheet("PSB-Quote Sheet");
const smsheet = wb.getWorksheet("Snow - Math Calculations");
const slsheet = wb.getWorksheet("Snow Load Breakdown");

console.log("=== CURRENT TEST DATA IN WORKBOOK ===\n");

// Get current config values
console.log("Building Dimensions:");
console.log("  Width (P17):", pssheet.getCell("P17").value);
console.log("  Height (L17):", pssheet.getCell("L17").value);
console.log("  Length: (need to find)");

// Check for length
console.log("\nSearching for length in row 17...");
for (let c = 1; c <= 30; c++) {
  const cell = pssheet.getCell(16, c);
  if (cell.value && (typeof cell.value === "string" && cell.value.toLowerCase().includes("length"))) {
    const colLetter = String.fromCharCode(64 + c);
    console.log(`  Found at ${colLetter}: ${cell.value}`);
    console.log(`  ${colLetter}17 = ${pssheet.getCell(17, c).value}`);
  }
}

// Check what the actual Verticals cost is showing
console.log("\n\n=== VERTICALS COST OUTPUT ===");
console.log("Snow Load Breakdown V31 (Verticals cost):", slsheet.getCell("V31").value);
console.log("Snow Load Breakdown X31 (another field):", slsheet.getCell("X31").value);

// Check the calculation components
console.log("\n\n=== CALCULATION COMPONENTS ===");
console.log("SMC H32 (extras count):", smsheet.getCell("H32").value?.result ?? smsheet.getCell("H32").value);
console.log("SMC U19 (per-vert cost):", smsheet.getCell("U19").value?.result ?? smsheet.getCell("U19").value);
console.log("SMC AA5 (final vert cost):", smsheet.getCell("AA5").value?.result ?? smsheet.getCell("AA5").value);

// Get numeric breakdown
console.log("\n\n=== NUMERIC BREAKDOWN FOR CURRENT DATA ===");
const h32 = smsheet.getCell("H32").value?.result ?? smsheet.getCell("H32").value;
const u16 = smsheet.getCell("U16").value?.result ?? smsheet.getCell("U16").value;
const u17 = smsheet.getCell("U17").value?.result ?? smsheet.getCell("U17").value;
const u18 = smsheet.getCell("U18").value?.result ?? smsheet.getCell("U18").value;
const u13 = smsheet.getCell("U13").value?.result ?? smsheet.getCell("U13").value;
const u19 = smsheet.getCell("U19").value?.result ?? smsheet.getCell("U19").value;

console.log("H32 (extras):", h32);
console.log("U16 (D20 + U15 = height component):", u16);
console.log("U17 (tubing price/ft):", u17);
console.log("U18 (U16 * U17):", u18);
console.log("U13 (= H32):", u13);
console.log("U19 (U18 * U13 = TOTAL COST):", u19);

// Break down U16
console.log("\n\nBreaking down U16:");
const d20 = smsheet.getCell("D20").value?.result ?? smsheet.getCell("D20").value;
const u15 = smsheet.getCell("U15").value?.result ?? smsheet.getCell("U15").value;
const u14 = smsheet.getCell("U14").value?.result ?? smsheet.getCell("U14").value;
const d10 = smsheet.getCell("D10").value?.result ?? smsheet.getCell("D10").value;

console.log("D20 (base height value):", d20);
console.log("U15 (ROUNDUP of adjustment):", u15);
console.log("U14 (calculation):", u14);
console.log("D10 (used in U14 calc):", d10);
console.log("U16 = D20 + U15 =", d20, "+", u15, "=", u16);

console.log("\nSo per-vertical length used = ", u16, "ft");
console.log("Per-vertical cost = ", u16, "ft *", u17, "$/ft =", u16 * u17);
console.log("Total verticals cost = ", u19, "(", u18, "per-vert *", h32, "extras)");
