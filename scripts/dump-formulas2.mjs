#!/usr/bin/env node
/**
 * Dump additional formulas — Snow - Changers lookup cells, plus references
 * from Snow - Math Calculations that we're chasing.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "formulas-dump2.md");
const FILE = "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx";

const TARGETS = [
  ["Snow - Math Calculations", ["P2", "P4", "P6", "P8", "T4", "T6", "T8", "D2", "D6", "D34", "AC19"]],
  ["Snow - Changers", ["C102", "G31", "J72", "J75", "J76", "G76", "D47", "D54", "D29"]],
  ["Snow - Changers", "rows:29-34"],
  ["Snow - Changers", "rows:100-110"],
  ["Pricing - Changers", ["U64", "U65", "U69", "D66", "H65", "H66"]],
  ["Snow - Changers", "rows:80-100"], // F94 leg-height adjust table
];

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  const md = [];
  md.push(`# Formulas dump 2 — ${FILE.split("/").pop()}`);
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
      if (cell.value === null || cell.value === undefined) continue;
      if (typeof cell.value === "object" && cell.value.formula) {
        formula = "=" + cell.value.formula;
        value = cell.value.result ?? "";
      } else if (cell.formula) {
        formula = "=" + cell.formula;
        value = cell.result ?? cell.value;
      } else {
        value = typeof cell.value === "object" ? JSON.stringify(cell.value) : String(cell.value);
      }
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
