// Só descreve como publicado o estado confirmado pelo backend no site público.
export function descreverPublicacao(draft,result){
  if(!result||result.id!==draft.id)throw new Error('Estado não conferido.');
  if(result.status==='nao-enviada')return {rotulo:'Rascunho',detalhe:'Nenhuma publicação foi enviada.',link:''};
  const oldPaths=['pages/reportagem-educacao.html','pages/reportagem-clima.html','pages/materia_ia_educacao_v2.html'];
  if(result.status==='existente'&&oldPaths.includes(draft.origem)&&result.link===draft.origem)return {rotulo:'Publicado · edição importada',detalhe:'A página original está no site. As edições do rascunho ainda não foram publicadas.',link:'https://fabcampo.com.br/'+result.link};
  if(!Number.isInteger(result.revisao)||result.revisao<1||result.revisao>draft.revisao)throw new Error('Revisão não conferida. Atualize a lista.');
  if(result.status==='retirada')return {rotulo:'Retirado do ar',detalhe:'O rascunho está disponível para revisão e republicação.',link:''};
  if(result.status==='aguardando')return {rotulo:'Atualização em andamento',detalhe:'A versão enviada ainda não foi confirmada no site.',link:''};
  if(draft.tipo==='eventos'){if(result.status!=='publicada'||result.link!=='https://fabcampo.com.br/#agenda-escola')throw new Error('Agenda não conferida.');return {rotulo:'Evento publicado',detalhe:'Revisão '+result.revisao+' confirmada na agenda.',link:result.link};}
  const path=oldPaths.includes(draft.origem)?draft.origem:'pages/reportagem-'+draft.id+'.html';
  if(result.status!=='publicada'||result.link!==path)throw new Error('Endereço não conferido.');
  return {rotulo:draft.revisao===result.revisao?'Publicado':'Alterações pendentes',detalhe:'No site: revisão '+result.revisao+'. No painel: revisão '+draft.revisao+'.',link:'https://fabcampo.com.br/'+path};
}

export function correspondeFiltroMateria(item,{busca='',grupo='ativas',estado='todos',tipo='todos'}={}){
  const normalizar=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  return (grupo==='lixeira'?item.lixeira:!item.lixeira)&&normalizar(item.titulo).includes(normalizar(busca).trim())&&(estado==='todos'||item.estado===estado)&&(tipo==='todos'||item.tipo===tipo);
}

export function resumirFiltroMaterias(items,filtros={}){
  const grupo=filtros.grupo||'ativas';
  const total=items.filter(item=>grupo==='lixeira'?item.lixeira:!item.lixeira).length;
  const encontrados=items.filter(item=>correspondeFiltroMateria(item,filtros)).length;
  if(!total)return {encontrados,total,texto:grupo==='lixeira'?'A lixeira está vazia.':'Nenhuma matéria ou rascunho nesta lista.'};
  if(!encontrados)return {encontrados,total,texto:'Nenhum título corresponde aos filtros. Use “Limpar filtros” para ver todos os registros desta lista.'};
  return {encontrados,total,texto:`${encontrados} de ${total} ${total===1?'registro':'registros'} ${grupo==='lixeira'?'na lixeira':'na lista de matérias'}.`};
}
