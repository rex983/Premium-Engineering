import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/MI WI PA MN 1_26_26.xlsx");

// Deep scan of Snow Load Breakdown
console.log("\n=== Snow Load Breakdown - FULL SCAN ROWS 1-35 ===");
const slsheet = wb.getWorksheet("Snow Load Breakdown");
if (slsheet) {
  for (let r = 1; r <= 35; r++) {
    const row = slsheet.getRow(r);
    let hasCellData = false;
    const rowData = [];
    
    // Check columns A through Y
    for (let c = 1; c <= 25; c++) {
      const cell = row.getCell(c);
      if (cell.value || cell.formula) {
        hasCellData = true;
        const colLetter = String.fromCharCode(64 + c);
        rowData.push(
          `${colLetter}${r}: val="${cell.value}" | formula="${cell.formula || ""}"`
        );
      }
    }
    
    if (hasCellData) {
      console.log(`\nRow ${r}:`);
      rowData.forEach((item) => console.log(`  ${item}`));
    }
  }
}
