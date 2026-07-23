#!/usr/bin/env node
/**
 * Smoke-test harness — compares premium-engineering's snow-engineering engine
 * against the actual PSB spreadsheets across a matrix of configurations.
 *
 * Strategy:
 *  - HyperFormula loads the workbook (with small compatibility fixups for
 *    merged-cell range refs and INDEX(range, row, 0) patterns), then we
 *    poke input cells and read the 4 line-item output cells directly.
 *  - The app's engine is invoked via tsx-imported parser + snow-engineering.
 *  - Any diff > $0.51 counts as a real discrepancy.
 *
 * Report written to scripts/smoke-report.md.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const REPORT_PATH = resolve(__dirname, "smoke-report.md");

const FILES = {
  south: "C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx",
  north: "C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx",
};

// ---------------------------------------------------------------------------
// HyperFormula workbook loader
// ---------------------------------------------------------------------------

function fixMergedRangeFormula(f) {
  const cleaned = f.trim();
  // "SheetName!A1:B2" or "'Sheet Name'!A1:B2" or "A1:B2" as full body → first cell only
  const m = /^(('([^']+)'|([A-Za-z0-9_]+))!)?\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$/.exec(cleaned);
  if (!m) return f;
  const sheet = m[1] ?? "";
  return `${sheet}${m[5]}${m[6]}`;
}

function fixIndexZero(f) {
  // Replace INDEX(..., X, 0) → INDEX(..., X)
  // HF doesn't accept 0 as "whole row/col" whereas Excel does.
  // We do a conservative regex on the common single-column pattern.
  // For 2D uses (like INDEX(range, MATCH(...), 0)) we drop the trailing ",0".
  return f.replace(/INDEX\(([^()]+),\s*([^,()]+),\s*0\)/gi, "INDEX($1, $2)");
}

function fixFormula(f) {
  let out = f;
  out = fixMergedRangeFormula(out);
  out = fixIndexZero(out);
  return out;
}

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
  // Add named ranges
  const definedNames = wb.definedNames?.model ?? [];
  for (const dn of definedNames) {
    if (!dn.name || !dn.ranges?.length) continue;
    try { hf.addNamedExpression(dn.name, "=" + dn.ranges[0]); } catch {}
  }
  return hf;
}

// ---------------------------------------------------------------------------
// HF cell coordinates (0-indexed col/row)
// ---------------------------------------------------------------------------
// PSB-Quote Sheet inputs
const IN_WIDTH      = ["PSB-Quote Sheet", 11, 16]; // L17
const IN_LENGTH     = ["PSB-Quote Sheet", 15, 16]; // P17
const IN_HEIGHT     = ["PSB-Quote Sheet", 19, 16]; // T17
const IN_ROOFSTYLE  = ["PSB-Quote Sheet",  4, 15]; // E16
const IN_SIDES      = ["PSB-Quote Sheet",  6, 26]; // G27
const IN_SIDESQTY   = ["PSB-Quote Sheet", 11, 26]; // L27
const IN_SIDESPANEL = ["PSB-Quote Sheet", 13, 26]; // N27
const IN_ENDS       = ["PSB-Quote Sheet",  6, 27]; // G28
const IN_ENDSQTY    = ["PSB-Quote Sheet", 11, 27]; // L28
const IN_ENDSPANEL  = ["PSB-Quote Sheet", 13, 27]; // N28
const IN_WIND       = ["PSB-Quote Sheet",  9, 54]; // J55
const IN_SNOW       = ["PSB-Quote Sheet", 13, 54]; // N55
const IN_STATE      = ["PSB-Quote Sheet", 25,  9]; // Z10

// Snow - Math Calculations outputs (each is [sheet, col0, row0])
const OUT_TRUSSES   = ["Snow - Math Calculations", 15, 21]; // P22
const OUT_HAT       = ["Snow - Math Calculations", 15, 28]; // P29
const OUT_GIRTS     = ["Snow - Math Calculations", 19, 29]; // T30
const OUT_VERT      = ["Snow - Math Calculations", 20, 18]; // U19
const OUT_TOTAL     = ["Snow - Math Calculations", 29, 19]; // AD20

const STATE_LONG_NAME = {
  IN: "Indiana", OH: "Ohio", KY: "Kentucky", IL: "Illinois", TN: "Tennessee", WV: "West Virginia", MO: "Missouri",
  MI: "Michigan", WI: "Wisconsin", PA: "Pennsylvania", MN: "Minnesota",
};

function setInputs(hf, config) {
  const set = (loc, val) => {
    const [sheet, col, row] = loc;
    const sid = hf.getSheetId(sheet);
    hf.setCellContents({ sheet: sid, col, row }, val);
  };
  set(IN_WIDTH, config.width);
  set(IN_LENGTH, config.length);
  set(IN_HEIGHT, config.height);
  set(IN_ROOFSTYLE, config.roofStyle);
  set(IN_SIDES, "Fully Enclosed");
  set(IN_SIDESQTY, config.sidesQty);
  set(IN_SIDESPANEL, config.sidesPanel);
  set(IN_ENDS, config.ends);
  set(IN_ENDSQTY, config.endsQty);
  set(IN_ENDSPANEL, config.endsPanel);
  set(IN_WIND, config.windMph);
  set(IN_SNOW, config.snowLoad);
  set(IN_STATE, STATE_LONG_NAME[config.state] ?? config.state);
}

function readOut(hf, loc) {
  const [sheet, col, row] = loc;
  const sid = hf.getSheetId(sheet);
  const v = hf.getCellValue({ sheet: sid, col, row });
  if (v === null || v === undefined) return { ok: true, value: 0 };
  if (typeof v === "object" && "type" in v) return { ok: false, err: `${v.type}${v.message ? ":" + v.message : ""}` };
  if (typeof v === "string") return { ok: false, err: `string(${v})` };
  return { ok: true, value: v };
}

function readSpreadsheet(hf, config) {
  setInputs(hf, config);
  return {
    trusses: readOut(hf, OUT_TRUSSES),
    hat:     readOut(hf, OUT_HAT),
    girts:   readOut(hf, OUT_GIRTS),
    vert:    readOut(hf, OUT_VERT),
    total:   readOut(hf, OUT_TOTAL),
  };
}

// ---------------------------------------------------------------------------
// Test matrix
// ---------------------------------------------------------------------------
const BASE = {
  roofStyle: "A-Frame Vertical",
  sides: "Fully Enclosed",
  ends: "Enclosed Ends",
  sidesPanel: "Vertical",
  endsPanel: "Vertical",
  sidesQty: 2,
  endsQty: 2,
};

function buildMatrix() {
  const cases = [];
  const widths = [12, 18, 24, 30];
  const lengths = [20, 40, 60, 100];
  const heights = [8, 12, 14, 16, 18, 20];
  const snows = ["30 Ground Load", "60 Ground Load", "70 Ground Load"];
  const winds = [105, 130, 155];

  // (A) Main matrix: all AFV enclosed vertical panels, ends qty=2 — split IN/MI.
  //     Skip C102 trivial cases (30GL + wind<=130).
  let idx = 0;
  for (const st of ["IN", "MI"]) {
    for (const w of widths) {
      for (const l of lengths) {
        for (const h of heights) {
          for (const s of snows) {
            for (const wind of winds) {
              // C102 kill-switch (skip trivial zero cases to keep matrix meaningful)
              const isDead = s === "30 Ground Load" && wind <= 130;
              if (isDead) continue;
              // Cap so matrix stays ~100 cases: sample every 4th
              idx++;
              if (idx % 12 !== 1) continue;
              cases.push({
                label: `${st} ${w}x${l}x${h} ${s.split(" ")[0]}GL ${wind}mph AFV·E2V`,
                state: st,
                width: w, length: l, height: h,
                windMph: wind, snowLoad: s,
                ...BASE,
              });
            }
          }
        }
      }
    }
  }

  // (B) Deliberate hand-picked coverage cases (guarantee we hit every axis).
  const hand = [
    // User's two verified data points
    { label: "MI 30x100x16 70GL 105mph AFV·E2V (verified $9056.50)", state: "MI", width: 30, length: 100, height: 16, windMph: 105, snowLoad: "70 Ground Load" },
    { label: "MI 30x100x20 70GL 105mph AFV·E2V (verified $12788.50)", state: "MI", width: 30, length: 100, height: 20, windMph: 105, snowLoad: "70 Ground Load" },
    // Pitch verification at other widths (peak-add math)
    { label: "IN 12x40x12 60GL 130mph AFV·E2V", state: "IN", width: 12, length: 40, height: 12, windMph: 130, snowLoad: "60 Ground Load" },
    { label: "IN 18x40x14 60GL 130mph AFV·E2V", state: "IN", width: 18, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load" },
    { label: "IN 24x40x16 60GL 130mph AFV·E2V", state: "IN", width: 24, length: 40, height: 16, windMph: 130, snowLoad: "60 Ground Load" },
    { label: "IN 30x40x18 60GL 130mph AFV·E2V", state: "IN", width: 30, length: 40, height: 18, windMph: 130, snowLoad: "60 Ground Load" },
    // Height boundary tests: 12/13/14/15 (mult=2), 16/17/18 (mult=2.5), 19/20 (mult=3)
    { label: "MI 24x60x14 60GL 155mph AFV·E2V", state: "MI", width: 24, length: 60, height: 14, windMph: 155, snowLoad: "60 Ground Load" },
    { label: "MI 24x60x18 60GL 155mph AFV·E2V", state: "MI", width: 24, length: 60, height: 18, windMph: 155, snowLoad: "60 Ground Load" },
    { label: "MI 24x60x20 60GL 155mph AFV·E2V", state: "MI", width: 24, length: 60, height: 20, windMph: 155, snowLoad: "60 Ground Load" },
    // C102 kill-switch check (should all be $0)
    { label: "IN 20x40x8 30GL 105mph AFV·E2V (dead — expect $0)", state: "IN", width: 20, length: 40, height: 8, windMph: 105, snowLoad: "30 Ground Load" },
    { label: "MI 30x60x12 30GL 130mph AFV·E2V (dead — expect $0)", state: "MI", width: 30, length: 60, height: 12, windMph: 130, snowLoad: "30 Ground Load" },
    // Roof style horizontal (hat channels should be 0)
    { label: "IN 30x60x16 60GL 130mph AFH·E2V (horizontal roof)", state: "IN", width: 30, length: 60, height: 16, windMph: 130, snowLoad: "60 Ground Load", roofStyle: "A-Frame Horizontal" },
    { label: "MI 24x40x14 60GL 130mph AFH·E2V (horizontal roof)", state: "MI", width: 24, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load", roofStyle: "A-Frame Horizontal" },
    // Open ends (should zero out girts + verticals)
    { label: "IN 24x40x14 60GL 130mph AFV·O2V (open ends)", state: "IN", width: 24, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load", ends: "Open Ends" },
    { label: "MI 30x60x16 60GL 155mph AFV·O2V (open ends)", state: "MI", width: 30, length: 60, height: 16, windMph: 155, snowLoad: "60 Ground Load", ends: "Open Ends" },
    // Horizontal panels on ends (girts still count, verticals stay because ends=Enclosed)
    { label: "IN 24x40x14 60GL 130mph AFV·E2H (ends horizontal)", state: "IN", width: 24, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load", endsPanel: "Horizontal" },
    { label: "MI 30x60x16 60GL 155mph AFV·E2H (ends horizontal)", state: "MI", width: 30, length: 60, height: 16, windMph: 155, snowLoad: "60 Ground Load", endsPanel: "Horizontal" },
    // Sides horizontal (girts should be 0)
    { label: "IN 24x40x14 60GL 130mph AFV·H·E2V (sides horizontal)", state: "IN", width: 24, length: 40, height: 14, windMph: 130, snowLoad: "60 Ground Load", sidesPanel: "Horizontal" },
    // Spot-check TN and PA
    { label: "TN 24x60x12 60GL 130mph AFV·E2V", state: "TN", width: 24, length: 60, height: 12, windMph: 130, snowLoad: "60 Ground Load" },
    { label: "PA 30x100x18 60GL 155mph AFV·E2V", state: "PA", width: 30, length: 100, height: 18, windMph: 155, snowLoad: "60 Ground Load" },
    { label: "TN 18x40x16 70GL 105mph AFV·E2V", state: "TN", width: 18, length: 40, height: 16, windMph: 105, snowLoad: "70 Ground Load" },
    { label: "PA 24x60x14 70GL 130mph AFV·E2V", state: "PA", width: 24, length: 60, height: 14, windMph: 130, snowLoad: "70 Ground Load" },
    // Ends qty = 1 (single-end enclosure)
    { label: "IN 24x60x16 60GL 130mph AFV·E1V (ends qty 1)", state: "IN", width: 24, length: 60, height: 16, windMph: 130, snowLoad: "60 Ground Load", endsQty: 1 },
    { label: "MI 30x100x18 70GL 105mph AFV·E1V (ends qty 1)", state: "MI", width: 30, length: 100, height: 18, windMph: 105, snowLoad: "70 Ground Load", endsQty: 1 },
  ];

  for (const h of hand) cases.push({ ...BASE, ...h });

  return cases;
}

// ---------------------------------------------------------------------------
// Engine invocation
// ---------------------------------------------------------------------------

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
    state: STATE_LONG_NAME[c.state] ?? c.state,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Parse both workbooks via app parser (for engine).
  const parserMod = await import(pathToFileURL(resolve(root, "src/lib/excel/parser.ts")).href);
  const engineeringMod = await import(pathToFileURL(resolve(root, "src/lib/pricing/snow-engineering.ts")).href);
  const parsed = {};
  for (const [region, path] of Object.entries(FILES)) {
    if (!existsSync(path)) { console.log(`[${region}] FILE MISSING: ${path}`); continue; }
    const buf = readFileSync(path);
    parsed[region] = parserMod.parsePsbWorkbook(buf, path.split(/[\\/]/).pop());
    if (!parsed[region].validation.ok) console.log(`[${region}] parser warnings:`, parsed[region].validation.errors);
    console.log(`[${region}] parsed OK (region=${parsed[region].matrices.region})`);
  }

  // Build HF instances for each workbook (one-time cost).
  console.log("Loading workbooks into HyperFormula…");
  const hf = {};
  for (const [region, path] of Object.entries(FILES)) {
    if (!existsSync(path)) continue;
    console.log(`  [${region}] loading ${path.split(/[\\/]/).pop()}…`);
    hf[region] = await loadWorkbookHF(path);
    console.log(`  [${region}] HF ready.`);
  }

  const stateRegion = {
    IN: "south", OH: "south", KY: "south", IL: "south", TN: "south", WV: "south", MO: "south",
    MI: "north", WI: "north", PA: "north", MN: "north",
  };

  const matrix = buildMatrix();
  console.log(`\nRunning ${matrix.length} test configs…\n`);

  const results = [];
  let done = 0;
  for (const c of matrix) {
    const region = stateRegion[c.state];
    const hfInst = hf[region];
    const parsedRegion = parsed[region];
    if (!hfInst || !parsedRegion) {
      results.push({ config: c, error: `no ${region} workbook loaded` });
      continue;
    }
    // Engine
    const engineOut = engineeringMod.calcSnowEngineering(toEngineConfig(c), parsedRegion.matrices.snow);
    // Spreadsheet
    let sheetOut;
    try {
      sheetOut = readSpreadsheet(hfInst, c);
    } catch (e) {
      sheetOut = { error: e.message };
    }
    results.push({ config: c, region, engine: engineOut, sheet: sheetOut });
    done++;
    if (done % 10 === 0) console.log(`  …${done}/${matrix.length}`);
  }

  // Emit report
  const report = generateReport(results);
  writeFileSync(REPORT_PATH, report);
  console.log(`\nReport written to ${REPORT_PATH}`);
  console.log(summarize(results));
}

function fmt(n, ok = true) {
  if (!ok || n === null || n === undefined) return "—";
  if (typeof n !== "number") return String(n);
  return "$" + n.toFixed(2);
}

function classify(engineVal, sheetOut) {
  if (!sheetOut || sheetOut.error) return "sheet_error";
  if (!sheetOut.ok) return "sheet_" + (sheetOut.err || "err");
  const diff = engineVal - sheetOut.value;
  if (Math.abs(diff) <= 0.51) return "match";
  return "diff";
}

function summarize(results) {
  const total = results.length;
  let matchAll = 0;
  const perLine = { trusses: { match: 0, diff: 0, err: 0 }, hat: { match: 0, diff: 0, err: 0 }, girts: { match: 0, diff: 0, err: 0 }, vert: { match: 0, diff: 0, err: 0 }, total: { match: 0, diff: 0, err: 0 } };
  for (const r of results) {
    if (!r.engine || !r.sheet) continue;
    const lines = [
      ["trusses", r.engine.trussPrice, r.sheet.trusses],
      ["hat", r.engine.hatChannelPrice, r.sheet.hat],
      ["girts", r.engine.girtPrice, r.sheet.girts],
      ["vert", r.engine.verticalPrice, r.sheet.vert],
      ["total", r.engine.totalEngineering, r.sheet.total],
    ];
    let allLinesMatch = true;
    for (const [name, ev, so] of lines) {
      const cls = classify(ev, so);
      if (cls === "match") perLine[name].match++;
      else if (cls === "diff") { perLine[name].diff++; allLinesMatch = false; }
      else { perLine[name].err++; allLinesMatch = false; }
    }
    if (allLinesMatch) matchAll++;
  }
  return `
SUMMARY (${total} configs)
  Full-match (all lines): ${matchAll}/${total}
  Per line (match / diff / err):
    Trusses     : ${perLine.trusses.match} / ${perLine.trusses.diff} / ${perLine.trusses.err}
    Hat channels: ${perLine.hat.match} / ${perLine.hat.diff} / ${perLine.hat.err}
    Girts       : ${perLine.girts.match} / ${perLine.girts.diff} / ${perLine.girts.err}
    Verticals   : ${perLine.vert.match} / ${perLine.vert.diff} / ${perLine.vert.err}
    TOTAL       : ${perLine.total.match} / ${perLine.total.diff} / ${perLine.total.err}
`.trim();
}

function generateReport(results) {
  const total = results.length;
  const rows = [];
  let matchAll = 0, diffAny = 0, errAny = 0;
  const patterns = {};

  for (const r of results) {
    if (!r.engine) {
      rows.push({ config: r.config, error: r.error });
      errAny++;
      continue;
    }
    const lines = {
      trusses: [r.engine.trussPrice, r.sheet.trusses],
      hat:     [r.engine.hatChannelPrice, r.sheet.hat],
      girts:   [r.engine.girtPrice, r.sheet.girts],
      vert:    [r.engine.verticalPrice, r.sheet.vert],
      total:   [r.engine.totalEngineering, r.sheet.total],
    };
    let hasDiff = false, hasErr = false;
    const lineStatus = {};
    for (const [name, [ev, so]] of Object.entries(lines)) {
      const cls = classify(ev, so);
      lineStatus[name] = { cls, engine: ev, sheet: so };
      if (cls === "diff") { hasDiff = true; patterns[name] = (patterns[name] ?? 0) + 1; }
      else if (cls !== "match") { hasErr = true; }
    }
    if (!hasDiff && !hasErr) matchAll++;
    else if (hasDiff) diffAny++;
    if (hasErr) errAny++;
    rows.push({ config: r.config, region: r.region, lineStatus });
  }

  const summary = summarize(results);
  const md = [];
  md.push(`# PSB Snow-Engineering Engine Smoke-Test Report`);
  md.push("");
  md.push(`_Generated ${new Date().toISOString()}_`);
  md.push("");
  md.push(`## Summary`);
  md.push("");
  md.push("```");
  md.push(summary);
  md.push("```");
  md.push("");

  // Systematic patterns
  const sysDiffs = Object.entries(patterns).sort((a, b) => b[1] - a[1]);
  if (sysDiffs.length) {
    md.push(`## Systematic diff patterns`);
    md.push("");
    for (const [line, count] of sysDiffs) {
      md.push(`- **${line}**: ${count} of ${total} configs diverge`);
    }
    md.push("");
  }

  // Detailed table
  md.push(`## Per-config breakdown`);
  md.push("");
  md.push("Table columns: engine value vs spreadsheet value; `Δ` shows engine−sheet. `✓` = match ≤ $0.51, `✗` = real diff, `err` = spreadsheet couldn't evaluate.");
  md.push("");
  md.push("| # | Config | Region | Trusses (eng/sheet) | Hat (eng/sheet) | Girts (eng/sheet) | Vert (eng/sheet) | Total (eng/sheet) |");
  md.push("|---|--------|--------|--------|--------|--------|--------|--------|");

  let n = 0;
  for (const r of rows) {
    n++;
    if (r.error) {
      md.push(`| ${n} | ${r.config.label} | — | ERROR | ERROR | ERROR | ERROR | ${r.error} |`);
      continue;
    }
    const cell = (l) => {
      const s = r.lineStatus[l];
      if (s.cls === "match") return `${fmt(s.engine)} ✓`;
      if (s.cls === "diff") {
        const diff = s.engine - s.sheet.value;
        return `${fmt(s.engine)} / ${fmt(s.sheet.value)} **Δ${diff >= 0 ? "+" : ""}${diff.toFixed(2)}** ✗`;
      }
      return `${fmt(s.engine)} / err(${s.sheet.err || "?"})`;
    };
    md.push(`| ${n} | ${r.config.label} | ${r.region} | ${cell("trusses")} | ${cell("hat")} | ${cell("girts")} | ${cell("vert")} | ${cell("total")} |`);
  }

  md.push("");
  md.push(`## Configs where the spreadsheet couldn't produce a value`);
  md.push("");
  const errRows = rows.filter(r => !r.error && Object.values(r.lineStatus).some(s => s.cls.startsWith("sheet_")));
  if (!errRows.length) {
    md.push("_(none)_");
  } else {
    for (const r of errRows) {
      const errs = Object.entries(r.lineStatus).filter(([, s]) => s.cls.startsWith("sheet_")).map(([n, s]) => `${n}=${s.cls}`).join(", ");
      md.push(`- ${r.config.label}: ${errs}`);
    }
  }

  md.push("");
  md.push(`## Notes on methodology`);
  md.push("");
  md.push(`- Workbooks: \`${FILES.south}\` (south), \`${FILES.north}\` (north).`);
  md.push(`- Spreadsheet evaluation: HyperFormula (GPL). Two compatibility fixes: (a) merged-cell range refs like \`'PSB-Quote Sheet'!N55:Q55\` collapsed to \`N55\`; (b) \`INDEX(range, row, 0)\` rewritten to \`INDEX(range, row)\`. Neither changes numeric behavior — they translate Excel-isms HF doesn't accept.`);
  md.push(`- Line-item cells read: \`Snow - Math Calculations!P22\` (trusses), \`P29\` (hat channels), \`T30\` (girts), \`U19\` (verticals), \`AD20\` (total).`);
  md.push(`- Discrepancy threshold: > $0.51 = real diff, ≤ $0.51 = rounding noise.`);
  md.push(`- Skipped combinations that hit the C102 kill switch trivially (\`30GL\` + wind ≤ 130), except a couple of deliberate zero-check cases.`);

  return md.join("\n");
}

main().catch((err) => { console.error(err); process.exit(1); });
