import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const smsheet = wb.getWorksheet("Snow - Math Calculations");
const scsheet = wb.getWorksheet("Snow - Changers");

console.log("=== COMPLETE VERTICALS COST FORMULA CHAIN ===\n");

console.log("FINAL OUTPUT CELL: V31 (Snow Load Breakdown)");
console.log("  Formula: 'Snow - Math Calculations'!$AA$5");

console.log("\nAA5 in Snow - Math Calculations:");
console.log("  Formula: IF($P$8=0,...,$H$32)");
console.log("  When P8 != 0, returns H32");

console.log("\nH32 = $H$31 * $D$35");
console.log("  H31 = IF($D$35<0,0,1) - just a gate, returns 0 or 1");
console.log("  D35 = ($D$34 - $T$8) * $I$35");

console.log("\n--- BREAKDOWN OF D35 ---");
console.log("D34 = $D$33 + 1");
console.log("  D33 = ROUNDUP($D$32, 0)");
console.log("    D32 = $D$31 / $P$8");
console.log("      D31 = $D$29 * 12");
console.log("        D29 = 'Snow - Changers'!$D$54 (LEG HEIGHT BASE)");
console.log("      P8 = 'Snow - Verticals'!$Z$8 (REQUIRED SPACING)");

console.log("\nT8 = 'Snow - Verticals'!$B$21 (ORIGINAL VERTICALS)");

console.log("\nI35 = $I$34 * 'PSB-Quote Sheet'!L28");
console.log("  I34 = IF('PSB-Quote Sheet'!G28='Enclosed Ends',1,0)");
console.log("  L28 = Enclosed Ends qty from PSB-Quote Sheet");

console.log("\n--- FINAL FORMULA IN WORDS ---");
console.log("Extras = CEILING(((LegHeight*12) / RequiredSpacing), 1) + 1 - OriginalVerticals");
console.log("Extras = Extras * (1 if Enclosed Ends else 0) * EnclosedEndsQty");
console.log("VerticalsCost = (1 if Extras >= 0 else 0) * Extras");

console.log("\n--- BUT WAIT! This doesn't match user's formula ---");
console.log("User says: Cost = extras × (height + 4) × tubingPrice/ft");
console.log("\nLet me check what H32 actually represents...");

console.log("\nH32 = H31 * D35");
console.log("  = (1 if D35>=0) * ((D34-T8)*I35)");
console.log("  = (1 if extras>=0) * (extras * endsMultiplier)");

console.log("\nSo H32 = EXTRAS COUNT, not the COST!");
console.log("Then where is the COST calculation?");

console.log("\nLooking at AA6 reference again:");
console.log("AA6 = IF($P$8=0,...,$U$19)");
console.log("where U19 = $U$18 * $U$13");
console.log("and U18 = $U$16 * $U$17");
console.log("  U16 = $D$20 + $U$15");
console.log("  U17 = 'Snow - Changers'!$J$76 (TUBING PRICE/FT)");
console.log("and U13 = $H$32 (the extras count!)");

console.log("\nSo the ACTUAL COST is:");
console.log("VerticalsCost = U19 = U18 * U13");
console.log("           = (U16 * U17) * U13");
console.log("           = (($D$20 + ROUNDUP(((($D$10/2)*3)/12),0)) * $J$76) * $H$32");

console.log("\nWhere:");
const d10 = smsheet.getCell("D10").value?.result || smsheet.getCell("D10").value;
const d20 = smsheet.getCell("D20").value?.result || smsheet.getCell("D20").value;
const j76 = scsheet.getCell("J76").value;

console.log("  D10 = Leg height base = 12");
console.log("  D20 = Something else = ", d20);
console.log("  (($D$10/2)*3)/12) = ((12/2)*3)/12 = 1.5");
console.log("  ROUNDUP(1.5) = 2");
console.log("  D20 + 2 = ", d20, "+ 2 = ", d20 + 2);
console.log("  J76 (Tubing price/ft) from Snow-Changers = ", j76);
console.log("  H32 = Extras = ?");

console.log("\n=== CHECKING THE ACTUAL RELATIONSHIP ===");
console.log("In user's formula: Cost = extras × (height + 4) × tubing/ft");
console.log("Height = 16ft (test case)");
console.log("Cost = 1160");
console.log("So: 1160 = extras × 20 × tubing/ft");
console.log("If extras=4 (single end): 1160 = 4 × 20 × tubing/ft => tubing/ft = 14.50");
console.log("If extras=18 (both ends): Cost should be 4620 if same formula, but it's 3132");

console.log("\nLet me check U14 and U16 again with actual height of 16:");
console.log("When height=16 (not 8):");
console.log("  D10 = 16 (not 12)");
console.log("  D20 = ?");
console.log("  U14 = ((16/2)*3)/12 = (8*3)/12 = 24/12 = 2");
console.log("  U15 = ROUNDUP(2,0) = 2");
console.log("  U16 = D20 + 2 = (16 height value) + 2 = 18 or 20?");
