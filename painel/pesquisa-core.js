export const RESEARCH_FILE_LIMITS={bytes:5*1024*1024,pages:50,characters:40000,textBytes:96*1024};
export function validarPesquisaArquivo(value){
  if(value===undefined || value===null || value==='')return null;
  if(typeof value!=='object' || Array.isArray(value) || typeof value.nome!=='string' ||
    !value.nome.trim() || value.nome.length>160 || /[\x00-\x1f/\\]/.test(value.nome) ||
    !['pdf','markdown'].includes(value.tipo) || typeof value.texto!=='string' || !value.texto.trim() ||
    value.texto.length>RESEARCH_FILE_LIMITS.characters || new TextEncoder().encode(value.texto).length>RESEARCH_FILE_LIMITS.textBytes ||
    typeof value.conferido!=='boolean' || !Number.isInteger(value.paginas) || value.paginas<0 || value.paginas>RESEARCH_FILE_LIMITS.pages)
    throw new Error('Confira o arquivo de pesquisa: até 40.000 caracteres, 96 KB de texto e 50 páginas.');
  return {nome:value.nome,tipo:value.tipo,paginas:value.paginas,texto:value.texto,conferido:value.conferido};
}
export function validarArquivoSelecionado(file){
  if(!file || file.size<=0 || file.size>RESEARCH_FILE_LIMITS.bytes)throw new Error('Escolha um PDF ou Markdown de até 5 MB.');
  if(!/\.(pdf|md|markdown)$/i.test(file.name))throw new Error('Use PDF (.pdf) ou Markdown (.md ou .markdown).');
  return /\.pdf$/i.test(file.name)?'pdf':'markdown';
}
export function decodificarMarkdown(bytes){
  const texto=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  if(texto.includes('\0'))throw new Error('O Markdown deve ser um arquivo de texto UTF-8.');
  return texto;
}
export async function extrairPaginasPDF(pdf){
  if(pdf.numPages>RESEARCH_FILE_LIMITS.pages)throw new Error('O PDF ultrapassa 50 páginas. Nenhum trecho foi importado.');
  const pages=[];
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
    const page=await pdf.getPage(pageNumber),content=await page.getTextContent();
    const text=content.items.map(item=>typeof item.str==='string'?item.str+(item.hasEOL?'\n':' '):'').join('').trim();
    page.cleanup();
    if(!text)throw new Error('A página '+pageNumber+' não tem texto extraível. Use uma versão com reconhecimento de texto (OCR). Nenhum trecho foi importado.');
    pages.push('[Página '+pageNumber+']\n'+text);
    if(pages.join('\n\n').length>RESEARCH_FILE_LIMITS.characters)throw new Error('O PDF ultrapassa 40.000 caracteres. Nenhum trecho foi cortado ou importado.');
  }
  return {texto:pages.join('\n\n'),paginas:pdf.numPages};
}
