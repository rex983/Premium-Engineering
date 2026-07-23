import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx");
const md = [];
md.push("# Snow - Trusses  probe");
md.push("");
const s = wb.getWorksheet("Snow - Trusses ");
if (!s) { md.push("Sheet 'Snow - Trusses ' not found."); }
else {
  const cols = ["BE", "BF", "BG", "BH", "BI"];
  md.push("| Cell | Formula | Value |");
  md.push("|---|---|---|");
  for (let r = 1; r <= 20; r++) {
    for (const col of cols) {
      const c = s.getCell(col + r);
      let f = "", v = "";
      if (c.value === null || c.value === undefined) continue;
      if (typeof c.value === "object" && c.value.formula) { f = "=" + c.value.formula; v = c.value.result ?? ""; }
      else if (c.formula) { f = "=" + c.formula; v = c.result ?? c.value; }
      else v = typeof c.value === "object" ? JSON.stringify(c.value) : String(c.value);
      md.push(`| ${col}${r} | \`${f}\` | ${v} |`);
    }
  }
  md.push("");
  md.push("## Range headers around BH");
  for (let c = 55; c <= 65; c++) {
    let s2 = "";
    let n = c;
    while (n > 0) { const r = (n - 1) % 26; s2 = String.fromCharCode(65 + r) + s2; n = Math.floor((n - 1) / 26); }
    const cell = s.getCell(s2 + "1");
    md.push(`- ${s2}1: ${JSON.stringify(cell.value)}`);
  }
}
writeFileSync("C:/Users/Redir/premium-engineering/scripts/dump6.md", md.join("\n"));
console.log("Wrote dump6.md");
