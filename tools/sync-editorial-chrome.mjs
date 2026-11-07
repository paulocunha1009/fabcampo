import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile(new URL('../pages/reportagem-educacao.html',import.meta.url),'utf8');
const header=source.match(/<header class="cabecalho">[\s\S]*?<\/header>/)?.[0];
let footer=source.match(/<footer class="rodape">[\s\S]*?<\/footer>/)?.[0];
if(!header || !footer)throw new Error('Cabeçalho ou rodapé de referência não encontrado.');
if(!footer.includes('privacidade.html'))footer=footer.replace('</nav>','<a href="../privacidade.html">Privacidade e uso da IA</a></nav>');
await writeFile(new URL('../backend/lib/editorial-chrome.mjs',import.meta.url),
  '// Gerado por tools/sync-editorial-chrome.mjs a partir da reportagem Educação.\n'+
  'export const header='+JSON.stringify(header)+';\nexport const footer='+JSON.stringify(footer)+';\n');
