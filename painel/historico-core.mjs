const idValido=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
export function versoesRecuperaveis(draft,id){
 if(!draft||!idValido(id)||draft.id!==id||!Number.isInteger(draft.revisao)||draft.revisao<1||!['noticias','eventos'].includes(draft.tipo)||draft.lixeira)throw new Error('Confira o rascunho ativo antes de consultar o histórico.');
 const vistos=new Set();return (Array.isArray(draft.historico)?draft.historico:[]).filter(item=>item&&item.tipo===draft.tipo&&Number.isInteger(item.revisao)&&item.revisao>0&&item.revisao<draft.revisao&&item.registro&&typeof item.registro==='object'&&!Array.isArray(item.registro)&&!vistos.has(item.revisao)&&vistos.add(item.revisao)).sort((a,b)=>b.revisao-a.revisao).slice(0,5);
}
export function prepararRecuperacao(draft,revisao){
 const versao=versoesRecuperaveis(draft,draft.id).find(item=>item.revisao===revisao);
 if(!versao)throw new Error('Selecione uma revisão anterior disponível.');
 return {id:draft.id,tipo:draft.tipo,revisao:draft.revisao,registro:structuredClone(versao.registro)};
}
