import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = path.resolve("materiais/organizacao-financeira/Planilha_Organizacao_Financeira_Rural_Campo_Digital_2026.xlsx");
const outputDir = path.resolve("tmp/finance-workbook-preview");
await fs.mkdir(outputDir, { recursive: true });

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const renders = [
  ["Painel", "A1:P70"],
  ["Comece aqui", "A1:J47"],
  ["Lançamentos", "A1:M24"],
  ["Safra e clima", "A1:K25"],
  ["Metas e reserva", "A1:H33"],
  ["Sobre o projeto", "A1:H34"],
];

for (const [sheetName, range] of renders) {
  const blob = await workbook.render({ sheetName, range, scale: 1 });
  const safe = sheetName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase();
  await fs.writeFile(path.join(outputDir, `${safe}.png`), new Uint8Array(await blob.arrayBuffer()));
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);
