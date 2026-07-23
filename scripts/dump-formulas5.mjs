#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "formulas-dump5.md");
const FILE = "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  const md = [];
  md.push(`# Formulas dump 5 — G7 truss-extras chain + F94 sanity`);
  md.push("");

  const dump = (sheetName, addrs) => {
    md.push(`## ${sheetName}`);
    md.push("| Cell | Formula | Value |");
    md.push("|---|---|---|");
    const s = wb.getWorksheet(sheetName);
    for (const a of addrs) {
      const c = s.getCell(a);
      let f = "", v = "";
      if (c.value === null || c.value === undefined) { md.push(`| ${a} | (empty) | |`); continue; }
      if (typeof c.value === "object" && c.value.formula) { f = "=" + c.value.formula; v = c.value.result ?? ""; }
      else if (c.formula) { f = "=" + c.formula; v = c.result ?? c.value; }
      else v = typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value);
      md.push(`| ${a} | \`${String(f).replaceAll("|", "\\|")}\` | ${String(v).replaceAll("|", "\\|")} |`);
    }
    md.push("");
  };

  // The G7 chain for extras trusses
  dump("Snow - Math Calculations", ["G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11"]);
  dump("Snow - Math Calculations", ["D2", "D3", "D4", "D5", "D6", "D7", "D8", "P2", "P4", "P6", "P8"]);
  dump("Snow - Math Calculations", ["T2", "T3", "T4", "T5", "T6", "T7", "T8"]);
  dump("Snow - Math Calculations", ["Z14", "Z15", "Z16"]);

  // F94 formula probing (do we have any variance?)
  dump("Snow - Changers", ["F94", "D14", "B92", "B93", "D92", "G92"]);

  // Check for any secondary F94 or width-adjustment cell
  const sc = wb.getWorksheet("Snow - Changers");
  md.push(`## Search for cells referencing F94, D31, or Q47`);
  const toLetter = (n) => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  const hits = [];
  for (const sheetName of wb.worksheets.map(s => s.name)) {
    const s = wb.getWorksheet(sheetName);
    for (let r = 1; r <= 110; r++) {
      for (let c = 1; c <= 40; c++) {
        const cell = s.getRow(r).getCell(c);
        const f = (typeof cell.value === "object" && cell.value?.formula) || cell.formula;
        if (typeof f === "string" && /F94|D31|Q47|Q49/.test(f)) {
          hits.push(`${sheetName}!${cell.address}: ${f}`);
        }
      }
    }
  }
  for (const h of hits.slice(0, 100)) md.push(`- ${h}`);
  md.push("");

  writeFileSync(OUT, md.join("\n"));
  console.log(`Dumped → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
