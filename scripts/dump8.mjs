import { writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile("C:/Users/Redir/Downloads/IN OH KY IL TN WV MO 1_26_26.xlsx");
const s = wb.getWorksheet("Snow - Changers");

const toLetter = (n) => { let s2 = ""; while (n > 0) { const r = (n - 1) % 26; s2 = String.fromCharCode(65 + r) + s2; n = Math.floor((n - 1) / 26); } return s2; };

const md = ["# Snow - Changers rows 1 and 2 — wind bucketing axis"];
md.push("");
md.push("Sampling every column with a value.");
md.push("");
md.push("| Col | Row 1 | Row 2 |");
md.push("|---|---|---|");
let last1 = null, last2 = null;
for (let c = 1; c <= 180; c++) {
  const L = toLetter(c);
  const v1 = s.getCell(L + "1").value;
  const v2 = s.getCell(L + "2").value;
  const key = `${v1}|${v2}`;
  if (key !== `${last1}|${last2}` || c <= 5) {
    md.push(`| ${L} (${c}) | ${JSON.stringify(v1)} | ${JSON.stringify(v2)} |`);
    last1 = v1; last2 = v2;
  }
}
// PSB-Quote Sheet merged cells check
const q = wb.getWorksheet("PSB-Quote Sheet");
md.push("");
md.push("## PSB-Quote Sheet !merges");
md.push("");
const merges = q.model?.merges ?? [];
for (const m of merges) {
  if (typeof m === "string" && (m.includes("J55") || m.includes("K55") || m.includes("N55") || m.includes("Q55"))) {
    md.push(`- ${m}`);
  }
}
writeFileSync("C:/Users/Redir/premium-engineering/scripts/dump8.md", md.join("\n"));
console.log("wrote");
