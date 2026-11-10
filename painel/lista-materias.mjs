// Só descreve como publicado o estado confirmado pelo backend no site público.
export function descreverPublicacao(draft,result){
  if(!result||result.id!==draft.id)throw new Error('Estado não conferido.');
  if(result.status==='nao-enviada')return {rotulo:'Rascunho',detalhe:'Nenhuma publicação foi enviada.',link:''};
  if(!Number.isInteger(result.revisao)||result.revisao<1||result.revisao>draft.revisao)throw new Error('Revisão não conferida. Atualize a lista.');
  if(result.status==='retirada')return {rotulo:'Retirado do ar',detalhe:'O rascunho está disponível para revisão e republicação.',link:''};
  if(result.status==='aguardando')return {rotulo:'Atualização em andamento',detalhe:'A versão enviada ainda não foi confirmada no site.',link:''};
  const path='pages/reportagem-'+draft.id+'.html';
  if(result.status!=='publicada'||result.link!==path)throw new Error('Endereço não conferido.');
  return {rotulo:draft.revisao===result.revisao?'Publicado':'Alterações pendentes',detalhe:'No site: revisão '+result.revisao+'. No painel: revisão '+draft.revisao+'.',link:'https://fabcampo.com.br/'+path};
}
