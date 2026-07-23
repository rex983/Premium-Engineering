#!/usr/bin/env node
/**
 * Diagnose engine vs spreadsheet divergences.
 *
 * For each failing config in the smoke report, this script sets inputs in HF
 * and reads the intermediate cells on `Snow - Math Calculations` so we can see
 * *which stage* (spacing, original, extras, price/ft) diverges.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const OUT = resolve(__dirname, "diagnose-report.md");

const FILES = {
  south: "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx",
  north: "C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx",
};

// --- HF workbook loader (same as smoke.mjs) -------------------------------

function fixMergedRangeFormula(f) {
  const cleaned = f.trim();
  const m = /^(('([^']+)'|([A-Za-z0-9_]+))!)?\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(cleaned);
  if (!m) return f;
  const sheet = m[1] ?? "";
  return `${sheet}${m[5]}${m[6]}`;
}
function fixIndexZero(f) { return f.replace(/INDEX\(([^()]+),\s*([^,()]+),\s*0\)/gi, "INDEX($1, $2)"); }
function fixFormula(f) { return fixIndexZero(fixMergedRangeFormula(f)); }
function cellToHF(cell) {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "object" && "formula" in v) return "=" + fixFormula(v.formula);
  if (typeof v === "object" && "richText" in v) return v.richText.map(t => t.text).join("");
  if (cell.formula) return "=" + fixFormula(cell.formula);
  if (v instanceof Date) return v;
  return v;
}
async function loadWorkbookHF(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const sheetData = {};
  wb.eachSheet((sheet) => {
    const rows = [];
    const maxRow = Math.min(sheet.rowCount, 1000);
    const maxCol = Math.min(sheet.columnCount, 250);
    for (let r = 1; r <= maxRow; r++) {
      const row = [];
      for (let c = 1; c <= maxCol; c++) row.push(cellToHF(sheet.getRow(r).getCell(c)));
      rows.push(row);
    }
    sheetData[sheet.name] = rows;
  });
  const hf = HyperFormula.buildFromSheets(sheetData, { licenseKey: "gpl-v3" });
  const definedNames = wb.definedNames?.model ?? [];
  for (const dn of definedNames) {
    if (!dn.name || !dn.ranges?.length) continue;
    try { hf.addNamedExpression(dn.name, "=" + dn.ranges[0]); } catch {}
  }
  return hf;
}

// --- Cell coords ---------------------------------------------------------

// Address helper: convert "P22" → [colIdx0, rowIdx0]
function addr(a) {
  const m = /^([A-Z]+)(\d+)$/.exec(a);
  let c = 0;
  for (const ch of m[1]) c = c * 26 + (ch.charCodeAt(0) - 64);
  return [c - 1, parseInt(m[2], 10) - 1];
}

const IN_WIDTH      = ["PSB-Quote Sheet", ...addr("L17")];
const IN_LENGTH     = ["PSB-Quote Sheet", ...addr("P17")];
const IN_HEIGHT     = ["PSB-Quote Sheet", ...addr("T17")];
const IN_ROOFSTYLE  = ["PSB-Quote Sheet", ...addr("E16")];
const IN_SIDES      = ["PSB-Quote Sheet", ...addr("G27")];
const IN_SIDESQTY   = ["PSB-Quote Sheet", ...addr("L27")];
const IN_SIDESPANEL = ["PSB-Quote Sheet", ...addr("N27")];
const IN_ENDS       = ["PSB-Quote Sheet", ...addr("G28")];
const IN_ENDSQTY    = ["PSB-Quote Sheet", ...addr("L28")];
const IN_ENDSPANEL  = ["PSB-Quote Sheet", ...addr("N28")];
const IN_WIND       = ["PSB-Quote Sheet", ...addr("J55")];
const IN_SNOW       = ["PSB-Quote Sheet", ...addr("N55")];
const IN_STATE      = ["PSB-Quote Sheet", ...addr("Z10")];

// Snow - Math Calculations intermediates + outputs.
const MC = "Snow - Math Calculations";
const MC_CELLS = {
  // C102 kill switch
  C102: addr("C102"),
  H12: addr("H12"),   // orig trusses
  H22: addr("H22"),   // extras trusses
  H23: addr("H23"),   // total trusses needed?
  I35: addr("I35"),
  P13: addr("P13"),
  P19: addr("P19"),
  P22: addr("P22"),   // TRUSS PRICE (final)
  // Hat channel chain
  P25: addr("P25"),
  P29: addr("P29"),
  // Girt chain
  H15: addr("H15"),
  H32: addr("H32"),
  T25: addr("T25"),
  T30: addr("T30"),
  // Vertical chain
  H14: addr("H14"),
  H31: addr("H31"),
  D35: addr("D35"),
  U13: addr("U13"),
  U15: addr("U15"),
  U19: addr("U19"),
  U20: addr("U20"),
  // Total
  AD20: addr("AD20"),
};

const STATE_LONG = {
  IN: "Indiana", OH: "Ohio", KY: "Kentucky", IL: "Illinois", TN: "Tennessee", WV: "West Virginia", MO: "Missouri",
  MI: "Michigan", WI: "Wisconsin", PA: "Pennsylvania", MN: "Minnesota",
};

function setInputs(hf, c) {
  const set = (loc, val) => {
    const [sheet, col, row] = loc;
    const sid = hf.getSheetId(sheet);
    hf.setCellContents({ sheet: sid, col, row }, val);
  };
  set(IN_WIDTH, c.width);
  set(IN_LENGTH, c.length);
  set(IN_HEIGHT, c.height);
  set(IN_ROOFSTYLE, c.roofStyle);
  set(IN_SIDES, "Fully Enclosed");
  set(IN_SIDESQTY, c.sidesQty);
  set(IN_SIDESPANEL, c.sidesPanel);
  set(IN_ENDS, c.ends);
  set(IN_ENDSQTY, c.endsQty);
  set(IN_ENDSPANEL, c.endsPanel);
  set(IN_WIND, c.windMph);
  set(IN_SNOW, c.snowLoad);
  set(IN_STATE, STATE_LONG[c.state] ?? c.state);
}

// Snow - Truss Spacing intermediates
const TS = "Snow - Truss Spacing";
const TS_CELLS = {
  E45: addr("E45"),  // leg symbol used
  E46: addr("E46"),  // snow code used
  E47: addr("E47"),  // row key = symbol-snow
  E48: addr("E48"),  // row match
  G47: addr("G47"),  // col key = ends-wind-width-style
  G48: addr("G48"),  // col match
  E51: addr("E51"),  // raw INDEX
  F51: addr("F51"),  // IFERROR raw
  Q47: addr("Q47"),  // height>14 flag
  Q48: addr("Q48"),  // F94 lookup
  Q49: addr("Q49"),  // Q47*Q48
  H52: addr("H52"),
  E52: addr("E52"),  // raw - H52 - Q49
  F52: addr("F52"),  // IF(E52=-12, 0, E52)
};

// Snow - Changers reference cells
const SC = "Snow - Changers";
const SC_CELLS = {
  D29: addr("D29"),  // eave height
  D30: addr("D30"),  // pos in row
  D31: addr("D31"),  // leg symbol via row 27
  F94: addr("F94"),  // width×snow lookup
};

function readSheetCells(hf) {
  const out = {};
  const readAt = (sheet, cells, prefix) => {
    const sid = hf.getSheetId(sheet);
    for (const [key, [col, row]] of Object.entries(cells)) {
      const v = hf.getCellValue({ sheet: sid, col, row });
      let val;
      if (v === null || v === undefined) val = null;
      else if (typeof v === "object" && "type" in v) val = `ERR:${v.type}`;
      else val = v;
      out[prefix + key] = val;
    }
  };
  readAt(MC, MC_CELLS, "");
  readAt(TS, TS_CELLS, "TS_");
  readAt(SC, SC_CELLS, "SC_");
  return out;
}

// --- Failing configs (from smoke-report.md) --------------------------------

const BASE = {
  roofStyle: "A-Frame Vertical",
  sides: "Fully Enclosed",
  ends: "Enclosed Ends",
  sidesPanel: "Vertical",
  endsPanel: "Vertical",
  sidesQty: 2,
  endsQty: 2,
};

const FAILING = [
  // Verticals fail: engine>0, sheet=$0 — h≤14 + wind=130
  { label: "IN 18x20x12 70GL 130mph AFV·E2V", state: "IN", width: 18, length: 20, height: 12, windMph: 130, snowLoad: "70 Ground Load", tag: "V" },
  { label: "IN 30x20x12 70GL 130mph AFV·E2V", state: "IN", width: 30, length: 20, height: 12, windMph: 130, snowLoad: "70 Ground Load", tag: "V" },
  { label: "IN 24x40x14 60GL 130mph AFV·E2H (endsPanel=H)", state: "IN", width: 24, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load", endsPanel: "Horizontal", tag: "V" },
  { label: "IN 18x40x14 60GL 130mph AFV·E2V (row 116)", state: "IN", width: 18, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load", tag: "V+G" },
  { label: "PA 24x60x14 70GL 130mph AFV·E2V", state: "PA", width: 24, length: 60, height: 14, windMph: 130, snowLoad: "70 Ground Load", tag: "V+G" },

  // Compare: passing case at h=12
  { label: "IN 12x20x12 70GL 130mph AFV·E2V (PASS reference)", state: "IN", width: 12, length: 20, height: 12, windMph: 130, snowLoad: "70 Ground Load", tag: "REF" },
  // Compare: passing case at h=8
  { label: "IN 18x20x8 30GL 155mph AFV·E2V (PASS ref)", state: "IN", width: 18, length: 20, height: 8, windMph: 155, snowLoad: "30 Ground Load", tag: "REF" },
  // Compare: passing case at h=16
  { label: "IN 18x20x16 60GL 155mph AFV·E2V (PASS ref)", state: "IN", width: 18, length: 20, height: 16, windMph: 155, snowLoad: "60 Ground Load", tag: "REF" },

  // Trusses fail: 30w × h=18 × 60GL × 130mph
  { label: "IN 30x40x18 60GL 130mph AFV·E2V (row 49)", state: "IN", width: 30, length: 40, height: 18, windMph: 130, snowLoad: "60 Ground Load", tag: "T" },
  { label: "IN 30x100x18 60GL 130mph AFV·E2V (row 56)", state: "IN", width: 30, length: 100, height: 18, windMph: 130, snowLoad: "60 Ground Load", tag: "T" },
  { label: "MI 30x100x18 60GL 130mph AFV·E2V (row 112)", state: "MI", width: 30, length: 100, height: 18, windMph: 130, snowLoad: "60 Ground Load", tag: "T" },
  // Compare: passing 30w cases
  { label: "IN 30x40x8 70GL 155mph AFV·E2V (PASS ref)", state: "IN", width: 30, length: 40, height: 8, windMph: 155, snowLoad: "70 Ground Load", tag: "REF" },
  { label: "IN 30x20x16 60GL 155mph AFV·E2V (PASS ref)", state: "IN", width: 30, length: 20, height: 16, windMph: 155, snowLoad: "60 Ground Load", tag: "REF" },

  // EndsQty=1
  { label: "IN 24x60x16 60GL 130mph AFV·E1V (row 135)", state: "IN", width: 24, length: 60, height: 16, windMph: 130, snowLoad: "60 Ground Load", endsQty: 1, tag: "E1" },
  { label: "MI 30x100x18 70GL 105mph AFV·E1V (row 136)", state: "MI", width: 30, length: 100, height: 18, windMph: 105, snowLoad: "70 Ground Load", endsQty: 1, tag: "E1" },
  // Compare: E2V version of row 135
  { label: "IN 24x60x16 60GL 155mph AFV·E2V (row 38 PASS ref)", state: "IN", width: 24, length: 60, height: 16, windMph: 155, snowLoad: "60 Ground Load", tag: "REF" },
];

const STATE_REGION = {
  IN: "south", OH: "south", KY: "south", IL: "south", TN: "south", WV: "south", MO: "south",
  MI: "north", WI: "north", PA: "north", MN: "north",
};

// --- Engine invocation ----------------------------------------------------

function toEngineConfig(c) {
  return {
    width: c.width, length: c.length, height: c.height,
    roofStyle: c.roofStyle,
    sides: c.sides,
    ends: c.ends,
    sidesPanel: c.sidesPanel,
    endsPanel: c.endsPanel,
    sidesQty: c.sidesQty,
    endsQty: c.endsQty,
    windMph: c.windMph,
    snowLoad: c.snowLoad,
    state: STATE_LONG[c.state] ?? c.state,
  };
}

// --- Main ------------------------------------------------------------------

async function main() {
  const parserMod = await import(pathToFileURL(resolve(root, "src/lib/excel/parser.ts")).href);
  const engineeringMod = await import(pathToFileURL(resolve(root, "src/lib/pricing/snow-engineering.ts")).href);
  const parsed = {};
  for (const [region, path] of Object.entries(FILES)) {
    if (!existsSync(path)) continue;
    const buf = readFileSync(path);
    parsed[region] = parserMod.parsePsbWorkbook(buf, path.split(/[\\/]/).pop());
  }
  console.log("Loading workbooks…");
  const hf = {};
  for (const [region, path] of Object.entries(FILES)) {
    if (!existsSync(path)) continue;
    console.log(`  [${region}] loading…`);
    hf[region] = await loadWorkbookHF(path);
  }

  const rows = [];
  for (const c of FAILING) {
    const cfg = { ...BASE, ...c };
    const region = STATE_REGION[cfg.state];
    const hfInst = hf[region];
    setInputs(hfInst, cfg);
    const sheet = readSheetCells(hfInst);
    const eng = engineeringMod.calcSnowEngineering(toEngineConfig(cfg), parsed[region].matrices.snow);
    rows.push({ cfg, sheet, eng });
  }

  // Emit MD report
  const md = [];
  md.push(`# Diagnose report`);
  md.push("");
  md.push(`Generated ${new Date().toISOString()}`);
  md.push("");
  for (const r of rows) {
    md.push(`## [${r.cfg.tag}] ${r.cfg.label}`);
    md.push("");
    md.push("### Spreadsheet intermediates");
    md.push("");
    md.push("| Cell | Meaning | Value |");
    md.push("|---|---|---|");
    md.push(`| C102 | kill switch | ${r.sheet.C102} |`);
    md.push(`| SC.D29 | eave height | ${r.sheet.SC_D29} |`);
    md.push(`| SC.D31 | leg symbol | ${r.sheet.SC_D31} |`);
    md.push(`| SC.F94 | width×snow adjust | ${r.sheet.SC_F94} |`);
    md.push(`| TS.E45 | leg symbol | ${r.sheet.TS_E45} |`);
    md.push(`| TS.E47 | rowKey | ${r.sheet.TS_E47} |`);
    md.push(`| TS.G47 | colKey | ${r.sheet.TS_G47} |`);
    md.push(`| TS.E48 | row match | ${r.sheet.TS_E48} |`);
    md.push(`| TS.G48 | col match | ${r.sheet.TS_G48} |`);
    md.push(`| TS.E51 | raw INDEX | ${r.sheet.TS_E51} |`);
    md.push(`| TS.F51 | iferror raw | ${r.sheet.TS_F51} |`);
    md.push(`| TS.Q47 | height>14 | ${r.sheet.TS_Q47} |`);
    md.push(`| TS.Q48 | F94 | ${r.sheet.TS_Q48} |`);
    md.push(`| TS.Q49 | Q47×Q48 | ${r.sheet.TS_Q49} |`);
    md.push(`| TS.H52 | H52 | ${r.sheet.TS_H52} |`);
    md.push(`| TS.E52 | raw-H52-Q49 | ${r.sheet.TS_E52} |`);
    md.push(`| TS.F52 | if(E52=-12,0,E52) | ${r.sheet.TS_F52} |`);
    md.push(`| H12  | orig trusses | ${r.sheet.H12} |`);
    md.push(`| H22  | extras trusses | ${r.sheet.H22} |`);
    md.push(`| H23  | total trusses | ${r.sheet.H23} |`);
    md.push(`| I35  | ? | ${r.sheet.I35} |`);
    md.push(`| P13  | ? | ${r.sheet.P13} |`);
    md.push(`| P19  | ? | ${r.sheet.P19} |`);
    md.push(`| **P22** | **truss $** | **${r.sheet.P22}** |`);
    md.push(`| P25  | extras hat | ${r.sheet.P25} |`);
    md.push(`| **P29** | **hat $** | **${r.sheet.P29}** |`);
    md.push(`| H15  | orig girts | ${r.sheet.H15} |`);
    md.push(`| H32  | extras girts | ${r.sheet.H32} |`);
    md.push(`| T25  | ? | ${r.sheet.T25} |`);
    md.push(`| **T30** | **girt $** | **${r.sheet.T30}** |`);
    md.push(`| H14  | orig verticals | ${r.sheet.H14} |`);
    md.push(`| H31  | extras verticals base | ${r.sheet.H31} |`);
    md.push(`| D35  | ends multiplier | ${r.sheet.D35} |`);
    md.push(`| U13  | ? | ${r.sheet.U13} |`);
    md.push(`| U15  | peakAdd | ${r.sheet.U15} |`);
    md.push(`| **U19** | **vert $** | **${r.sheet.U19}** |`);
    md.push(`| U20  | ? | ${r.sheet.U20} |`);
    md.push(`| **AD20** | **TOTAL $** | **${r.sheet.AD20}** |`);
    md.push("");
    md.push("### Engine values");
    md.push("");
    md.push("| Field | Value |");
    md.push("|---|---|");
    md.push(`| trussSpacing | ${r.eng.trussSpacing} |`);
    md.push(`| originalTrusses | ${r.eng.originalTrusses} |`);
    md.push(`| extraTrussesNeeded | ${r.eng.extraTrussesNeeded} |`);
    md.push(`| **trussPrice** | **${r.eng.trussPrice}** |`);
    md.push(`| hatChannelSpacing | ${r.eng.hatChannelSpacing} |`);
    md.push(`| originalHatChannels | ${r.eng.originalHatChannels} |`);
    md.push(`| extraChannelsNeeded | ${r.eng.extraChannelsNeeded} |`);
    md.push(`| **hatChannelPrice** | **${r.eng.hatChannelPrice}** |`);
    md.push(`| girtSpacing | ${r.eng.girtSpacing} |`);
    md.push(`| originalGirts | ${r.eng.originalGirts} |`);
    md.push(`| extraGirtsNeeded | ${r.eng.extraGirtsNeeded} |`);
    md.push(`| **girtPrice** | **${r.eng.girtPrice}** |`);
    md.push(`| verticalSpacing | ${r.eng.verticalSpacing} |`);
    md.push(`| originalVerticals | ${r.eng.originalVerticals} |`);
    md.push(`| extraVerticalsNeeded | ${r.eng.extraVerticalsNeeded} |`);
    md.push(`| **verticalPrice** | **${r.eng.verticalPrice}** |`);
    md.push(`| **totalEngineering** | **${r.eng.totalEngineering}** |`);
    md.push("");
    md.push("---");
    md.push("");
  }

  writeFileSync(OUT, md.join("\n"));
  console.log(`Diagnose report → ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
