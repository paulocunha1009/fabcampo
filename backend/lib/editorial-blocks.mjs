export function validarBlocos(value){
  const result={};
  for(const [campo,max] of [['citacao',2000],['citacaoFonte',400],['dadosTitulo',160],['dadosTexto',6000]]){
    const text=value[campo]??'';
    if(typeof text!=='string'||text.length>max)throw Object.assign(new Error('Confira o limite de texto deste bloco opcional.'),{campo,status:400});
    if(text.trim())result[campo]=text.trim();
  }
  if(Boolean(result.citacao)!==Boolean(result.citacaoFonte))throw Object.assign(new Error('Para incluir uma citação, informe a fala e sua fonte. Deixe ambos vazios para omitir.'),{campo:'citacao',status:400});
  if(result.dadosTitulo&&!result.dadosTexto)throw Object.assign(new Error('Preencha os dados ou remova o título da tabela.'),{campo:'dadosTexto',status:400});
  if(result.dadosTexto){const rows=result.dadosTexto.split(/\r?\n/).filter(row=>row.trim());if(rows.length>20||rows.some(row=>row.split('|').length!==2||row.split('|').some(cell=>!cell.trim()||cell.trim().length>240)))throw Object.assign(new Error('Use até 20 linhas no formato Indicador | Informação, com até 240 caracteres em cada coluna.'),{campo:'dadosTexto',status:400});}
  return result;
}
