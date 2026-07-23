#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "formulas-dump3.md");
const FILE = "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx";

const TARGETS = [
  ["Snow - Truss Spacing", "rows:44-58"],
  ["Snow - Truss Spacing", "rows:88-100"],
  ["Snow - Hat Channels", ["L7", "AD10", "L4", "L5", "L6"]],
  ["Snow - Girts ", ["F14", "T11"]],
  ["Snow - Girts ", "rows:1-20"],
  ["Snow - Verticals", ["Z8", "B21"]],
  ["Snow - Verticals", "rows:1-25"],
];

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  const md = [];
  md.push(`# Formulas dump 3 — ${FILE.split("/").pop()}`);
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
