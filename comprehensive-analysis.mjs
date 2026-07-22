import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

const smsheet = wb.getWorksheet("Snow - Math Calculations");
const scsheet = wb.getWorksheet("Snow - Changers");

console.log("=== COMPREHENSIVE VERTICALS FORMULA ANALYSIS ===\n");

console.log("USER'S CLAIM:");
console.log("Cost = extras × peakHeight × tubingPricePerFt");
console.log("with mysterious +4 in per-vertical calculation\n");

console.log("SPREADSHEET FORMULA CHAIN:");
console.log("Final Output: Snow Load Breakdown!X31");
console.log("  = 'Snow - Math Calculations'!AA6");
console.log("  = IF($P$8=0, error, $U$19)");
console.log("  = $U$18 * $U$13");
console.log("  = ($U$16 * $U$17) * $H$32\n");

console.log("COMPONENT BREAKDOWN:");
console.log("================================\n");

console.log("1. U16 (Per-vertical height in feet):");
console.log("   Formula: $D$20 + $U$15");
console.log("   = (PSB-Quote Sheet!T17) + ROUNDUP(((($D$10/2)*3)/12), 0)");
console.log("   = (LegHeightInput) + ROUNDUP((LegHeightBase/2)*3/12, 0)\n");

console.log("2. $D$20 (Base value):");
console.log("   Formula: 'Snow - Changers'!$D$29");
console.log("   = 'PSB-Quote Sheet'!T17");
console.log("   This is the LEG HEIGHT input from the quote sheet\n");

console.log("3. $D$10 (Leg height base):");
console.log("   Formula: 'Snow - Changers'!$D$54");
const d54 = scsheet.getCell("D54");
console.log("   Value: " + (d54.value?.result ?? d54.value) + " (probably dynamic based on state/config)\n");

console.log("4. $U$15 (Height adjustment):");
console.log("   Formula: ROUNDUP(((($D$10/2)*3)/12), 0)");
console.log("   = ROUNDUP(LegHeightBase * 0.125, 0)\n");

console.log("5. $U$17 (Tubing price per foot):");
console.log("   Formula: 'Snow - Changers'!$J$76");
const j76 = scsheet.getCell("J76");
console.log("   Value: " + (j76.value?.result ?? j76.value) + " (index into pricing table)\n");

console.log("6. $H$32 (Extras count):");
console.log("   Formula: $H$31 * $D$35");
console.log("   where $D$35 = ($D$34 - $T$8) * $I$35");
console.log("   = (CEILING((LegHeightBase*12)/RequiredSpacing, 1) + 1 - OriginalVerticals) * (1 if EnclosedEnds) * EndQty\n");

console.log("================================\n");
console.log("EXPANDING U16:");
console.log("If LegHeightBase = 16, then:");
console.log("  D10 = 16");
console.log("  U14 = ((16/2)*3)/12 = (8*3)/12 = 24/12 = 2.0");
console.log("  U15 = ROUNDUP(2.0, 0) = 2");
console.log("  If D20 (input height) = 16:");
console.log("    U16 = 16 + 2 = 18");
console.log("  If D20 (input height) = 20:");
console.log("    U16 = 20 + 2 = 22\n");

console.log("WAIT - But user said height=16 and cost=1160 with extras=4:");
console.log("  1160 = 4 * 16 * X?");
console.log("  1160 = 64 * X");
console.log("  X = 18.125 ≠ 16\n");

console.log("Let me reconsider. If formula is:");
console.log("  Cost = extras * U16 * U17");
console.log("  1160 = 4 * U16 * 7.25");
console.log("  1160 = 29 * U16");
console.log("  U16 = 40 ≈ 1160/29 = 40\n");

console.log("But that doesn't match either. Let me check if user's +4 refers to U15:");
console.log("  U15 = ROUNDUP((Height/2)*3/12, 0) = ROUNDUP(Height*0.125, 0)");
console.log("  For height=16: U15 = ROUNDUP(2.0, 0) = 2");
console.log("  For height=20: U15 = ROUNDUP(2.5, 0) = 3");
console.log("  This looks like it could be the source of adjustments!\n");

console.log("FINAL REALIZATION:");
console.log("The formula is NOT: extras * height * tubing");
console.log("It IS: extras * (D20 + ROUNDUP((D10/2)*3/12, 0)) * tubingPrice");
console.log("     = extras * (InputHeight + HeightAdjustment) * tubingPrice\n");

console.log("The '+4' or adjustment might come from:");
console.log("- State-specific leg height constants");
console.log("- Or the rounding/ceiling of the (LegHeight/2)*3/12 calculation");
console.log("- Or dynamic values from Snow-Changers based on config\n");

console.log("EXACT SPREADSHEET FORMULA:");
console.log("VerticalsCost = H32 * (D20 + ROUNDUP(((D10/2)*3)/12, 0)) * 'Snow-Changers'!J76");
console.log("where:");
console.log("  H32 = Extras count calculation");
console.log("  D20 = PSB-Quote Sheet!T17 (input leg height)");
console.log("  D10 = Snow-Changers!D54 (state-based leg height)");
console.log("  J76 = Snow-Changers!J76 (tubing price index)");
