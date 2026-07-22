import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

// List all sheet names
console.log("\n=== SHEET NAMES ===");
wb.worksheets.forEach((sheet) => {
  console.log(`- ${sheet.name}`);
});

// Check the likely candidate sheets
const sheetNames = [
  "Snow Load Breakdown",
  "PSB-Quote Sheet",
  "Snow - Verticals",
  "Snow - Math Calculations",
  "Snow - Changers",
];

for (const sheetName of sheetNames) {
  const sheet = wb.getWorksheet(sheetName);
  if (!sheet) {
    console.log(`\n[${sheetName}] - NOT FOUND`);
    continue;
  }

  console.log(`\n=== ${sheetName} ===`);
  console.log(`Dimensions: ${sheet.dimensions}`);
  
  // Scan for "Verticals" text
  let found = false;
  sheet.eachRow((row, rowNum) => {
    row.eachCell((cell, colNum) => {
      if (cell.value && typeof cell.value === "string" && cell.value.toLowerCase().includes("vertical")) {
        found = true;
        const cellRef = `${cell.address}`;
        console.log(`  Row ${rowNum}, Col ${colNum} (${cellRef}): "${cell.value}" (formula: ${cell.formula || "none"})`);
      }
    });
  });
  
  if (!found) {
    console.log("  (no 'Verticals' text found)");
  }
}

// Now scan for actual verticals cost formula around row 28-55
console.log("\n=== SCANNING PSB-Quote Sheet ROWS 25-35 ===");
const qsheet = wb.getWorksheet("PSB-Quote Sheet");
if (qsheet) {
  for (let r = 25; r <= 35; r++) {
    const row = qsheet.getRow(r);
    let hasCellData = false;
    const rowData = [];
    row.eachCell({ sparse: false }, (cell, colNum) => {
      if (cell.value || cell.formula) {
        hasCellData = true;
        rowData.push(
          `Col${colNum}(${cell.address}): val="${cell.value}" formula="${cell.formula || "none"}"`
        );
      }
    });
    if (hasCellData) {
      console.log(`Row ${r}:`);
      rowData.forEach((item) => console.log(`  ${item}`));
    }
  }
}

// Scan Snow Load Breakdown for key cells
console.log("\n=== SCANNING Snow Load Breakdown ROWS 25-35 ===");
const slsheet = wb.getWorksheet("Snow Load Breakdown");
if (slsheet) {
  for (let r = 25; r <= 35; r++) {
    const row = slsheet.getRow(r);
    let hasCellData = false;
    const rowData = [];
    row.eachCell({ sparse: false }, (cell, colNum) => {
      if (cell.value || cell.formula) {
        hasCellData = true;
        rowData.push(
          `Col${colNum}(${cell.address}): val="${cell.value}" formula="${cell.formula || "none"}"`
        );
      }
    });
    if (hasCellData) {
      console.log(`Row ${r}:`);
      rowData.forEach((item) => console.log(`  ${item}`));
    }
  }
}

// Check Snow - Verticals
console.log("\n=== SCANNING Snow - Verticals ===");
const svsheet = wb.getWorksheet("Snow - Verticals");
if (svsheet) {
  console.log(`Dimensions: ${svsheet.dimensions}`);
  for (let r = 1; r <= Math.min(20, svsheet.actualRowCount); r++) {
    const row = svsheet.getRow(r);
    let hasCellData = false;
    const rowData = [];
    row.eachCell({ sparse: false }, (cell, colNum) => {
      if (cell.value || cell.formula) {
        hasCellData = true;
        rowData.push(
          `${cell.address}: "${cell.value}" (formula: ${cell.formula || "none"})`
        );
      }
    });
    if (hasCellData) {
      console.log(`Row ${r}: ${rowData.join(" | ")}`);
    }
  }
}

console.log("\n=== DONE ===");
