// Só descreve como publicado o estado confirmado pelo backend no site público.
export function descreverPublicacao(draft,result){
  if(!result||result.id!==draft.id)throw new Error('Estado não conferido.');
  if(result.status==='nao-enviada')return {rotulo:'Rascunho',detalhe:'Nenhuma publicação foi enviada.',link:''};
  const oldPaths=['pages/reportagem-educacao.html','pages/reportagem-clima.html','pages/materia_ia_educacao_v2.html'];
  if(result.status==='existente'&&oldPaths.includes(draft.origem)&&result.link===draft.origem)return {rotulo:'Página no ar · edição importada',detalhe:'A página original está no site. Confira o rascunho importado antes de publicar; ainda não há uma revisão publicada pelo painel para comparar.',link:'https://fabcampo.com.br/'+result.link};
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
  return (grupo==='lixeira'?item.lixeira:!item.lixeira)&&normalizar(item.titulo).includes(normalizar(busca).trim())&&(estado==='todos'||(estado==='no-ar'?['publicada','pendente','importada'].includes(item.estado):item.estado===estado))&&(tipo==='todos'||item.tipo===tipo);
}

export function resumirFiltroMaterias(items,filtros={}){
  const grupo=filtros.grupo||'ativas';
  const total=items.filter(item=>grupo==='lixeira'?item.lixeira:!item.lixeira).length;
  const encontrados=items.filter(item=>correspondeFiltroMateria(item,filtros)).length;
  if(!total)return {encontrados,total,texto:grupo==='lixeira'?'A lixeira está vazia.':'Nenhuma matéria ou rascunho nesta lista.'};
  if(!encontrados)return {encontrados,total,texto:'Nenhum título corresponde aos filtros. Use “Limpar filtros” para ver todos os registros desta lista.'};
  return {encontrados,total,texto:`${encontrados} de ${total} ${total===1?'registro':'registros'} ${grupo==='lixeira'?'na lixeira':'na lista de matérias'}.`};
}

export function estadoConfirmadoMateria(draft,result){
 descreverPublicacao(draft,result);
 return result.status==='publicada'?(draft.revisao===result.revisao?'publicada':'pendente'):({existente:'importada','nao-enviada':'rascunho',retirada:'retirada',aguardando:'aguardando'}[result.status]||'desconhecida');
}
export function dataEdicaoMateria(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value))return null;
 const date=new Date(value);return Number.isFinite(date.getTime())&&date.toISOString().replace('.000Z','Z')===value.replace('.000Z','Z')?date:null;
}
export function ordenarMaterias(items,ordem='recentes'){
 const collator=new Intl.Collator('pt-BR',{sensitivity:'base',numeric:true});
 return [...items].sort((a,b)=>{
  if(['titulo-az','titulo-za'].includes(ordem)){const title=collator.compare(a.titulo||'',b.titulo||'');if(title)return ordem==='titulo-za'?-title:title;}
  else{const da=dataEdicaoMateria(a.atualizadoEm)?.getTime(),db=dataEdicaoMateria(b.atualizadoEm)?.getTime();if(da===undefined&&db!==undefined)return 1;if(db===undefined&&da!==undefined)return -1;if(da!==undefined&&db!==undefined&&da!==db)return ordem==='antigas'?da-db:db-da;}
  return collator.compare(a.titulo||'',b.titulo||'')||String(a.id||'').localeCompare(String(b.id||''));
 });
}
export function contarMaterias(items,filtros={}){
 const counts={total:0,rascunho:0,publicada:0,pendente:0,importada:0,retirada:0,aguardando:0,desconhecida:0};
 for(const item of items.filter(item=>correspondeFiltroMateria(item,{...filtros,estado:'todos'}))){counts.total++;const state=Object.hasOwn(counts,item.estado)&&item.estado!=='total'?item.estado:'desconhecida';counts[state]++;}
 return counts;
}
