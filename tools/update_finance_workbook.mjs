import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";

const root = process.cwd();
const source = path.join(root, "materiais", "organizacao-financeira", "Planilha_Organizacao_Financeira_Rural_Campo_Digital_2026.xlsx");
const publicCopy = path.join(root, "downloads", "organizacao-financeira", path.basename(source));
await fs.mkdir(path.dirname(publicCopy), { recursive: true });

// Excel sheet protection uses a legacy hash. It prevents accidental edits; it
// is not file encryption. Google Sheets replaces it with account permissions.
function excelLegacyHash(password) {
  let hash = 0;
  for (let i = password.length - 1; i >= 0; i--) {
    hash = ((hash >> 14) & 1) | ((hash << 1) & 0x7fff);
    hash ^= password.charCodeAt(i);
  }
  hash = ((hash >> 14) & 1) | ((hash << 1) & 0x7fff);
  hash ^= password.length;
  hash ^= 0xce4b;
  return (hash & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

const passwordHash = excelLegacyHash("CampoDigital2026");
const zip = await JSZip.loadAsync(await fs.readFile(source));
const worksheetNames = Object.keys(zip.files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));

for (const name of worksheetNames) {
  let xml = await zip.file(name).async("string");
  const protection = `<sheetProtection password="${passwordHash}" sheet="1" objects="1" scenarios="1" formatCells="1" formatColumns="1" formatRows="1" insertColumns="1" insertRows="1" insertHyperlinks="1" deleteColumns="1" deleteRows="1" selectLockedCells="1" sort="1" autoFilter="1" pivotTables="1" selectUnlockedCells="0"/>`;
  if (/<(?:\w+:)?sheetProtection\b[^>]*\/>/.test(xml)) {
    xml = xml.replace(/<(?:\w+:)?sheetProtection\b[^>]*\/>/, protection);
  } else {
    xml = xml.replace(/(<\/(?:\w+:)?sheetViews>)/, `$1${protection}`);
  }
  zip.file(name, xml);
}

const finalBytes = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
await fs.writeFile(source, finalBytes);
await fs.writeFile(publicCopy, finalBytes);

console.log(JSON.stringify({ source, publicCopy, passwordHash, protectedSheets: worksheetNames.length }));
