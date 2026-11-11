export const LIMITE_COPIA_ACERVO=512*1024;
const fail=()=>new Error('Esta cópia não corresponde à reportagem aberta ou está fora do formato esperado.');
function texto(value,max){if(typeof value!=='string'||value.length>max)throw fail();return value;}
export function validarCopiaAcervo(value,{draft,fields}){
 const acervo=draft?.registro?.acervo;
 if(!value||value.formato!=='fabcampo-acervo-copia'||value.versao!==1||!acervo||!/^[a-f0-9]{64}$/.test(acervo.baseHash||'')||value.id!==draft.id||value.path!==acervo.path||value.baseHash!==acervo.baseHash||!Number.isInteger(value.revisaoOrigem)||value.revisaoOrigem<1||!Array.isArray(value.edicoes)||value.edicoes.length!==fields.length||fields.length>1500)throw fail();
 const indices=new Set(fields.map(field=>field.indice)),edicoes=new Map();
 for(const item of value.edicoes){if(!indices.has(item?.indice)||edicoes.has(item.indice))throw fail();edicoes.set(item.indice,{indice:item.indice,texto:texto(item.texto,12000)});}
 let capa=null;
 if(value.capa!==null&&value.capa!==undefined){if(!/^img\/editorial\/[a-f0-9]{64}\.webp$/.test(value.capa.imagem))throw fail();capa={imagem:value.capa.imagem,legenda:texto(value.capa.legenda,400),credito:texto(value.capa.credito,240),textoAlternativo:texto(value.capa.textoAlternativo,400)};}
 const result={formato:'fabcampo-acervo-copia',versao:1,id:draft.id,path:acervo.path,baseHash:acervo.baseHash,revisaoOrigem:value.revisaoOrigem,titulo:texto(value.titulo,160),resumo:texto(value.resumo,1200),capa,imagemPendente:value.imagemPendente===true,edicoes:fields.map(field=>edicoes.get(field.indice))};
 if(new TextEncoder().encode(JSON.stringify(result)).length>LIMITE_COPIA_ACERVO)throw new Error('A cópia ultrapassa 512 KB. Confira os textos desta edição.');
 return result;
}
export function montarCopiaAcervo({draft,fields,resumo,capa,imagemPendente=false}){return validarCopiaAcervo({formato:'fabcampo-acervo-copia',versao:1,id:draft.id,path:draft.registro.acervo.path,baseHash:draft.registro.acervo.baseHash,revisaoOrigem:draft.revisao,titulo:draft.registro.titulo,resumo,capa,imagemPendente,edicoes:fields.map(({indice,texto})=>({indice,texto}))},{draft,fields});}
export function lerCopiaAcervo(text,context){if(typeof text!=='string'||new TextEncoder().encode(text).length>LIMITE_COPIA_ACERVO)throw new Error('Use uma cópia JSON do acervo de até 512 KB.');let value;try{value=JSON.parse(text);}catch{throw new Error('Não foi possível ler a cópia JSON. Escolha o arquivo baixado pelo editor.');}return validarCopiaAcervo(value,context);}
