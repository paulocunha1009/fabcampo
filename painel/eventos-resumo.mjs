export function resumirAcaoEvento({acao,nome,revisao,registro={}}){
 if(!['publicar','retirar'].includes(acao)||typeof nome!=='string'||!nome.trim()||!Number.isInteger(revisao)||revisao<1)throw new Error('Confira a ação e a revisão do evento.');
 if(acao==='retirar')return `Retirar da agenda: ${nome}\nRevisão do rascunho conferida: ${revisao}.\nO evento deixará a agenda pública. O rascunho será preservado.`;
 const linhas=[`Publicar ou atualizar na agenda: ${nome}`,`Revisão salva conferida: ${revisao}.`];
 for(const [key,label] of [['data','Data'],['horario','Horário de Fortaleza'],['local','Local'],['descricao','Descrição'],['publico','Público'],['participacao','Como participar'],['responsavel','Equipe responsável'],['contato','Contato institucional']]){
  let valor=typeof registro[key]==='string'&&registro[key].trim()?registro[key].trim():'Não informado';
  if(key==='data'&&/^\d{4}-\d{2}-\d{2}$/.test(valor))valor=valor.split('-').reverse().join('/');
  linhas.push(`${label}: ${valor}`);
 }
 linhas.push(registro.imagem?'Imagem: foto enviada no painel.\nLegenda: '+(registro.legenda||'Não informada')+'\nCrédito: '+(registro.credito||'Não informado')+'\nDescrição acessível: '+(registro.textoAlternativo||'Não informada'):'Imagem: sem foto.');
 linhas.push('Confirme somente se esses dados já foram verificados pela escola.');return linhas.join('\n\n');
}
