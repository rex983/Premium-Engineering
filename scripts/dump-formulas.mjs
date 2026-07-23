#!/usr/bin/env node
/**
 * Dump specific cell formulas from the workbooks to understand the sheet's
 * actual calculation logic. Focuses on Snow - Math Calculations and related.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "formulas-dump.md");
const FILE = "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx";

// (sheet, [addresses...])
const TARGETS = [
  // Truss chain: spacing + adjustment
  ["Snow - Math Calculations", ["C102", "E52", "F52", "H12", "H22", "H23", "P13", "P19", "P22", "Q47", "Q48", "Q49", "I35"]],
  ["Snow - Math Calculations", ["P24", "P25", "P26", "P29", "T24", "T25", "T30"]],
  ["Snow - Math Calculations", ["H14", "H15", "H31", "H32", "D35", "U13", "U15", "U19", "U20"]],
  ["Snow - Math Calculations", ["AD20", "AC20"]],
  // Wider dump of Snow - Math Calculations rows 10..40 to catch formulas
  ["Snow - Math Calculations", "rows:10-40"],
  ["Snow - Math Calculations", "rows:95-110"],
];

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  const md = [];
  md.push(`# Formulas dump — ${FILE.split("/").pop()}`);
  md.push("");
  md.push(`Generated ${new Date().toISOString()}`);
  md.push("");

  for (const [sheetName, spec] of TARGETS) {
    const sheet = wb.getWorksheet(sheetName);
    if (!sheet) { md.push(`## ${sheetName} — NOT FOUND\n`); continue; }
    md.push(`## ${sheetName}`);
    md.push("");
    md.push("| Cell | Formula | Value |");
    md.push("|---|---|---|");

    let addresses;
    if (Array.isArray(spec)) addresses = spec;
    else if (typeof spec === "string" && spec.startsWith("rows:")) {
      const [a, b] = spec.slice(5).split("-").map(Number);
      addresses = [];
      for (let r = a; r <= b; r++) {
        for (let c = 1; c <= 40; c++) {
          const cell = sheet.getRow(r).getCell(c);
          if (cell && (cell.formula || (cell.value != null && cell.value !== ""))) {
            addresses.push(cell.address);
          }
        }
      }
    } else continue;

    for (const addr of addresses) {
      const cell = sheet.getCell(addr);
      let formula = "";
      let value = "";
      if (cell.value === null || cell.value === undefined) {
        continue;
      }
      if (typeof cell.value === "object" && cell.value.formula) {
        formula = "=" + cell.value.formula;
        value = cell.value.result ?? "";
      } else if (cell.formula) {
        formula = "=" + cell.formula;
        value = cell.result ?? cell.value;
      } else {
        value = typeof cell.value === "object" ? JSON.stringify(cell.value) : String(cell.value);
      }
      // Escape pipes
      formula = String(formula).replaceAll("|", "\\|");
      value = String(value).replaceAll("|", "\\|");
      md.push(`| ${addr} | \`${formula}\` | ${value} |`);
    }
    md.push("");
  }

  writeFileSync(OUT, md.join("\n"));
  console.log(`Dumped → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
