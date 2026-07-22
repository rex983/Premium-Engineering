import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const smsheet = wb.getWorksheet("Snow - Math Calculations");
const scsheet = wb.getWorksheet("Snow - Changers");

console.log("=== UNDERSTANDING THE +4 ===\n");

console.log("KEY FINDING: U16 = D20 + U15");
console.log("  U15 = ROUNDUP(((($D$10/2)*3)/12), 0)");
console.log("     = ROUNDUP((LegHeight/2)*3/12, 0)");
console.log("     = ROUNDUP(LegHeight*3/24, 0)");
console.log("     = ROUNDUP(LegHeight*0.125, 0)");
console.log("");
console.log("So U16 = D20 + something based on LegHeight");
console.log("");

console.log("D20 formula:", smsheet.getCell("D20").formula);
console.log("D20 value:", smsheet.getCell("D20").value);

console.log("\nLet's trace D20:");
console.log("D20 = 'Snow - Changers'!$D$29");

const d29 = scsheet.getCell("D29");
console.log("Snow-Changers D29:", d29.value, "formula:", d29.formula);

// Check if D29 is actually a leg-height value
console.log("\n\nChecking Snow-Changers D column around row 29:");
for (let r = 20; r <= 35; r++) {
  const cell = scsheet.getCell(r, 4); // Column D
  if (cell.value || cell.formula) {
    console.log(`  D${r}: ${cell.value} (formula: ${cell.formula || 'none'})`);
  }
}

console.log("\n\nLet me look at the actual D20 definition again:");
console.log("D20 formula in SMC:", smsheet.getCell("D20").formula);

// Let's get D19
console.log("D19:", smsheet.getCell("D19").value, smsheet.getCell("D19").formula);

// D30
console.log("D30:", smsheet.getCell("D30").value, smsheet.getCell("D30").formula);

// Actually trace back from the input height
console.log("\n\n=== TRACING HEIGHT INPUT ===");
console.log("PSB-Quote Sheet L17 (this is height input)");
const pssheet = wb.getWorksheet("PSB-Quote Sheet");
console.log("  L17:", pssheet.getCell("L17").value);

console.log("\nSnow Load Breakdown K8 (pulls height):");
const slsheet = wb.getWorksheet("Snow Load Breakdown");
console.log("  K8 formula:", slsheet.getCell("K8").formula);
console.log("  K8 value:", slsheet.getCell("K8").value);

console.log("\nSnow - Math Calculations pulls this as D2:");
console.log("  D2 formula:", smsheet.getCell("D2").formula);
console.log("  D2 value:", smsheet.getCell("D2").value);

console.log("\nSo the HEIGHT is coming into SMC as D2");
console.log("But U14 uses D10, not D2");

console.log("\n\nWait, let me re-check the per-vertical cost formula:");
console.log("U19 = U18 * U13");
console.log("U18 = U16 * U17");
console.log("U16 = D20 + U15");
console.log("U15 = ROUNDUP(((D10/2)*3)/12, 0)");
console.log("U17 = 'Snow - Changers'!J76 (tubing price/ft)");
console.log("U13 = H32 (extras count)");

console.log("\nSo VerticalCost = (D20 + ROUNDUP((D10/2)*3/12, 0)) * TubingPrice * Extras");

console.log("\n\n=== THE MYSTERY: What is D20? ===");
console.log("D20 = ", smsheet.getCell("D20").formula);
const d20Formula = smsheet.getCell("D20").formula;
if (d20Formula && d20Formula.includes("D10")) {
  console.log("D20 is based on D10!");
}

// D20 formula is: 'Snow - Changers'!$D$29
// Let's check what D29 really is in changers
console.log("\nSnow-Changers D29 and context:");
for (let r = 25; r <= 32; r++) {
  const cellA = scsheet.getCell(r, 1);
  const cellD = scsheet.getCell(r, 4);
  if (cellA.value || cellD.value) {
    console.log(`  Row ${r}: A=${cellA.value} | D=${cellD.value}`);
  }
}

console.log("\n\nLet me just check if D20 actually holds a NUMBER that makes sense:");
console.log("Current cached D20 value:", smsheet.getCell("D20").value);
console.log("In Snow-Changers, D29:", scsheet.getCell("D29").value);

// Get actual numeric value
const d20Val = smsheet.getCell("D20").value?.result ?? smsheet.getCell("D20").value;
console.log("D20 numeric:", d20Val);

// If D29 is accessed, what does it point to?
const d29inChangers = scsheet.getCell("D29");
console.log("\nSnow-Changers!D29:");
console.log("  Value:", d29inChangers.value);
console.log("  Formula:", d29inChangers.formula);
