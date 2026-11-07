// Validação do servidor fica dentro da raiz ESM implantada na Vercel.
// O navegador valida a mesma estrutura em painel/pesquisa-core.js.
export function validarPesquisaArquivo(value){
  if(value===undefined || value===null || value==='')return null;
  if(typeof value!=='object' || Array.isArray(value) || typeof value.nome!=='string' ||
    !value.nome.trim() || value.nome.length>160 || /[\x00-\x1f/\\]/.test(value.nome) ||
    !['pdf','markdown'].includes(value.tipo) || typeof value.texto!=='string' || !value.texto.trim() ||
    value.texto.length>40000 || Buffer.byteLength(value.texto,'utf8')>96*1024 ||
    typeof value.conferido!=='boolean' || !Number.isInteger(value.paginas) || value.paginas<0 || value.paginas>50)
    throw new Error('Confira o arquivo de pesquisa: até 40.000 caracteres, 96 KB de texto e 50 páginas.');
  return {nome:value.nome,tipo:value.tipo,paginas:value.paginas,texto:value.texto,conferido:value.conferido};
}
