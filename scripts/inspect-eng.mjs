import XLSX from "xlsx";
import * as fs from "fs";

const southPath = "C:\Users\Redir\Downloads\IN OH KY IL TN WV MO 1_26_26.xlsx";
const northPath = "C:\Users\Redir\Downloads\MI WI PA MN 1_26_26.xlsx";
const outPath = "C:\Users\Redir\premium-engineering\inspection-raw.json";

function readWorkbook(filePath) {
  return XLSX.readFile(filePath);
}

function getSheetMetadata(filePath) {
  try {
    const workbook = readWorkbook(filePath);
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
      return {
        name,
        rows: range.e.r + 1,
        cols: range.e.c + 1,
      };
    });
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e.message);
    return [];
  }
}

function extractAllFormulas(sheet) {
  const formulas = [];
  for (const cellRef in sheet) {
    if (cellRef.startsWith("!")) continue;
    const cell = sheet[cellRef];
    if (cell && cell.f) {
      formulas.push({
        address: cellRef,
        formula: cell.f,
        value: cell.v,
        type: cell.t,
      });
    }
  }
  return formulas;
}

function getRange(sheet, startRef, endRef) {
  const start = XLSX.utils.decode_cell(startRef);
  const end = XLSX.utils.decode_cell(endRef);
  const result = {};
  for (let r = start.r; r <= end.r; r++) {
    for (let c = start.c; c <= end.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellRef];
      if (cell) {
        result[cellRef] = {
          value: cell.v,
          formula: cell.f,
          type: cell.t,
        };
      }
    }
  }
  return result;
}

async function inspect() {
  console.log("Inspecting PSB workbooks...\n");

  const southWb = readWorkbook(southPath);
  const northWb = readWorkbook(northPath);

  const result = {
    south: {
      path: southPath,
      sheets: [],
      engineeringAnalysis: {},
    },
    north: {
      path: northPath,
      sheets: [],
      engineeringAnalysis: {},
    },
  };

  // Sheet inventory
  console.log("=== SOUTH REGION SHEETS ===");
  const southSheets = getSheetMetadata(southPath);
  for (const meta of southSheets) {
    console.log(`  ${meta.name.padEnd(35)} ${meta.rows} rows × ${meta.cols} cols`);
    result.south.sheets.push(meta);
  }

  console.log("\n=== NORTH REGION SHEETS ===");
  const northSheets = getSheetMetadata(northPath);
  for (const meta of northSheets) {
    console.log(`  ${meta.name.padEnd(35)} ${meta.rows} rows × ${meta.cols} cols`);
    result.north.sheets.push(meta);
  }

  // Process engineering sheets
  const engineeringSheets = [
    "Snow - Changers",
    "Snow - Math Calculations",
    "Snow - Truss Spacing",
    "Snow - Trusses",
    "Snow - Hat Channels",
    "Snow - Verticals",
    "Snow - Girts",
    "Snow Load Breakdown",
    "Pricing - Changers",
  ];

  // South deep-dives
  console.log("\n\n=== SOUTH ENGINEERING SHEETS ANALYSIS ===\n");
  for (const sheetName of engineeringSheets) {
    const sheet = southWb.Sheets[sheetName];
    if (!sheet) {
      console.log(`  ${sheetName}: NOT FOUND`);
      continue;
    }

    const formulas = extractAllFormulas(sheet);
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    console.log(
      `  ${sheetName}: ${range.e.r + 1} rows, ${range.e.c + 1} cols, ${formulas.length} formulas`
    );

    if (sheetName === "Snow - Changers") {
      const snowLoads = getRange(sheet, "B9", "P10");
      const legHeight = getRange(sheet, "B26", "V28");
      const stateConsts = getRange(sheet, "B58", "R70");

      result.south.engineeringAnalysis["Snow - Changers"] = {
        formulasCount: formulas.length,
        snowLoadsRange: snowLoads,
        legHeightAxisRange: legHeight,
        stateConstantsRange: stateConsts,
        sampleFormulas: formulas.slice(0, 20),
      };
    } else if (sheetName === "Snow - Math Calculations") {
      const keyFormulas = [
        "P13", "P19", "P22", "P25", "P29", "T25", "T30",
        "U13", "U20", "H12", "H22", "H23", "I35", "C102",
      ];
      const filtered = formulas.filter((f) =>
        keyFormulas.includes(f.address)
      );

      result.south.engineeringAnalysis["Snow - Math Calculations"] = {
        formulasCount: formulas.length,
        keyFormulas: filtered,
        sampleFormulas: formulas.slice(0, 25),
      };
    } else if (sheetName === "Snow - Truss Spacing") {
      result.south.engineeringAnalysis["Snow - Truss Spacing"] = {
        rows: range.e.r + 1,
        cols: range.e.c + 1,
        sampleCell: {
          A2: sheet["A2"]?.v,
          B1: sheet["B1"]?.v,
        },
      };
    } else if (sheetName === "Pricing - Changers") {
      result.south.engineeringAnalysis["Pricing - Changers"] = {
        formulasCount: formulas.length,
        sampleFormulas: formulas.slice(0, 20),
      };
    } else {
      result.south.engineeringAnalysis[sheetName] = {
        formulasCount: formulas.length,
        sampleFormulas: formulas.slice(0, 10),
      };
    }
  }

  // North deep-dives (abbreviated)
  console.log("\n=== NORTH ENGINEERING SHEETS (Abbreviated) ===\n");
  for (const sheetName of engineeringSheets) {
    const sheet = northWb.Sheets[sheetName];
    if (!sheet) continue;

    const formulas = extractAllFormulas(sheet);
    const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
    console.log(
      `  ${sheetName}: ${range.e.r + 1} rows, ${range.e.c + 1} cols, ${formulas.length} formulas`
    );

    result.north.engineeringAnalysis[sheetName] = {
      formulasCount: formulas.length,
      dimensions: { rows: range.e.r + 1, cols: range.e.c + 1 },
    };
  }

  // Write output
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\n\nInspection complete. Output: ${outPath}`);
}

inspect().catch(console.error);
