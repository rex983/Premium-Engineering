#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "formulas-dump4.md");
const FILE = "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE);

  const md = [];
  md.push(`# Formulas dump 4 — leg-symbol row + raw truss table probe`);
  md.push("");

  // Dump Snow - Changers rows 26-28 (leg height axis, symbol, tubing feet)
  md.push(`## Snow - Changers rows 26-28`);
  md.push("| Col | 26 (leg-h) | 27 (symbol) | 28 (tubing-feet) |");
  md.push("|---|---|---|---|");
  const sc = wb.getWorksheet("Snow - Changers");
  const toLetter = (n) => { let s = ""; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };
  for (let c = 2; c <= 22; c++) {
    const L = toLetter(c);
    const v26 = sc.getCell(`${L}26`).value;
    const v27 = sc.getCell(`${L}27`).value;
    const v28 = sc.getCell(`${L}28`).value;
    md.push(`| ${L} | ${JSON.stringify(v26)} | ${JSON.stringify(v27)} | ${JSON.stringify(v28)} |`);
  }
  md.push("");

  // Dump the truss spacing rowKeys (first column A2:A43)
  md.push(`## Snow - Truss Spacing rowKeys (A2:A43)`);
  md.push("| Row | Key |");
  md.push("|---|---|");
  const ts = wb.getWorksheet("Snow - Truss Spacing");
  for (let r = 2; r <= 43; r++) {
    const v = ts.getCell(`A${r}`).value;
    md.push(`| ${r} | ${JSON.stringify(v)} |`);
  }
  md.push("");

  // Dump colKeys row 1 for E-130-30-AFV specifically — search for the col
  md.push(`## Snow - Truss Spacing search for E-130-30-AFV column`);
  const cols = [];
  for (let c = 2; c <= 225; c++) {
    const v = ts.getCell(`${toLetter(c)}1`).value;
    if (v === "E-130-30-AFV") cols.push(c);
    if (v === "E-130-30-STD") cols.push({ std: c });
  }
  md.push(`Cols matching: ${JSON.stringify(cols)}`);
  md.push("");

  // Also probe M-60GL, T-60GL row indices
  const targetRowKeys = ["M-60GL", "T-60GL", "S-60GL", "M-70GL", "T-70GL", "M-30GL", "T-30GL"];
  md.push(`## Row indices for common leg-symbol/snow keys`);
  md.push("| Key | Row |");
  md.push("|---|---|");
  for (const key of targetRowKeys) {
    let found = null;
    for (let r = 2; r <= 43; r++) {
      if (ts.getCell(`A${r}`).value === key) { found = r; break; }
    }
    md.push(`| ${key} | ${found} |`);
  }
  md.push("");

  // Probe the raw spacing values at those combos for column E-130-30-AFV
  md.push(`## Raw spacing values at [rowKey × E-130-30-AFV]`);
  md.push("| Row key | Col letter | Value |");
  md.push("|---|---|---|");
  const searchCol = 2;
  let afvCol = null;
  for (let c = 2; c <= 225; c++) {
    if (ts.getCell(`${toLetter(c)}1`).value === "E-130-30-AFV") { afvCol = c; break; }
  }
  if (afvCol) {
    for (const key of targetRowKeys) {
      let found = null;
      for (let r = 2; r <= 43; r++) {
        if (ts.getCell(`A${r}`).value === key) { found = r; break; }
      }
      if (found) {
        const cell = ts.getCell(`${toLetter(afvCol)}${found}`);
        const v = cell.value;
        md.push(`| ${key} | ${toLetter(afvCol)}${found} | ${JSON.stringify(v)} |`);
      }
    }
  }
  md.push("");

  // Also dump the leg-height adjust table row 88 (width=30) fully
  md.push(`## F94 (Snow - Changers) width=30 row (row 88)`);
  md.push("| Col | Snow header (row 80) | Value (row 88) |");
  md.push("|---|---|---|");
  for (let c = 2; c <= 16; c++) {
    const L = toLetter(c);
    const hdr = sc.getCell(`${L}80`).value;
    const v = sc.getCell(`${L}88`).value;
    md.push(`| ${L} | ${JSON.stringify(hdr)} | ${JSON.stringify(v)} |`);
  }

  writeFileSync(OUT, md.join("\n"));
  console.log(`Dumped → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
