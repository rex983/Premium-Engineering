import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx");
const md = ["# Pricing - Changers D66 chain"];
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
dump("Pricing - Changers", ["D66", "B70", "U64", "U65", "U66", "U67", "U68", "U69", "T64", "T65", "T66", "T67", "T68"]);
dump("Pricing - Changers", ["D64", "E64", "H65", "H66", "G65", "G66"]);
// dump rows 60-70
const s = wb.getWorksheet("Pricing - Changers");
md.push(`## Pricing - Changers rows 60-72 (dense)`);
md.push("| Cell | Formula | Value |");
md.push("|---|---|---|");
const toLetter = (n) => { let s2 = ""; while (n > 0) { const r = (n - 1) % 26; s2 = String.fromCharCode(65 + r) + s2; n = Math.floor((n - 1) / 26); } return s2; };
for (let r = 60; r <= 72; r++) {
  for (let c = 1; c <= 25; c++) {
    const cell = s.getRow(r).getCell(c);
    if (cell && (cell.formula || (cell.value != null && cell.value !== ""))) {
      let f = "", v = "";
      if (typeof cell.value === "object" && cell.value?.formula) { f = "=" + cell.value.formula; v = cell.value.result ?? ""; }
      else if (cell.formula) { f = "=" + cell.formula; v = cell.result ?? cell.value; }
      else v = typeof cell.value === "object" ? JSON.stringify(cell.value) : String(cell.value);
      md.push(`| ${toLetter(c)}${r} | \`${String(f).replaceAll("|", "\\|")}\` | ${String(v).replaceAll("|", "\\|")} |`);
    }
  }
}
writeFileSync("C:/Users/Redir/premium-engineering/scripts/dump9.md", md.join("\n"));
console.log("wrote");
