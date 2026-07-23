import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx");
const md = ["# F6 wind chain"];
const dump = (sheet, addrs) => {
  const s = wb.getWorksheet(sheet);
  md.push(`## ${sheet}`);
  md.push("| Cell | Formula | Value |");
  md.push("|---|---|---|");
  for (const a of addrs) {
    const c = s.getCell(a);
    let f = "", v = "";
    if (typeof c.value === "object" && c.value?.formula) { f = "=" + c.value.formula; v = c.value.result ?? ""; }
    else if (c.formula) { f = "=" + c.formula; v = c.result ?? c.value; }
    else v = typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value ?? "");
    md.push(`| ${a} | \`${f}\` | ${v} |`);
  }
  md.push("");
};
dump("Snow - Changers", ["F6", "F5", "F4", "D6", "D5", "D4", "D3", "F3", "F2", "F1", "E6", "G6"]);
dump("Snow - Changers", ["B99", "C99", "B100", "C100", "C101", "C102"]);
// Row 2 might contain wind axis
dump("Snow - Changers", ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2", "I2"]);
dump("PSB-Quote Sheet", ["J55", "N55"]);
writeFileSync("C:/Users/Redir/premium-engineering/scripts/dump7.md", md.join("\n"));
console.log("wrote dump7.md");
