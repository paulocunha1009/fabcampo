function capaComparavel(capa){return capa?{imagem:capa.imagem,legenda:(capa.legenda||'').trim(),credito:(capa.credito||'').trim(),textoAlternativo:(capa.textoAlternativo||'').trim()}:null;}
function descreverCapa(capa){return capa?'Foto enviada. Legenda: '+(capa.legenda||'(em branco)')+' · Crédito: '+(capa.credito||'(em branco)')+' · Descrição: '+(capa.textoAlternativo||'(em branco)'):'Capa original da reportagem.';}
export function trechoAlteracao(texto,max=180){const value=String(texto??'').replace(/\s+/g,' ').trim();return !value?'(em branco)':value.length>max?value.slice(0,max-1)+'…':value;}
export function listarAlteracoesAcervo(fields,savedFields,atual,referencia){
 const items=fields.filter((field,index)=>field.texto!==savedFields[index]).map(field=>({tipo:'texto',indice:field.indice,antes:savedFields[field.indice]??'',agora:field.texto}));
 if((atual.resumo||'').trim()!==(referencia.resumo||'').trim())items.push({tipo:'resumo',antes:referencia.resumo||'',agora:atual.resumo||''});
 if(atual.imagemPendente||JSON.stringify(capaComparavel(atual.capa))!==JSON.stringify(capaComparavel(referencia.capa)))items.push({tipo:'capa',antes:descreverCapa(referencia.capa),agora:(atual.imagemPendente?'Há uma foto local pendente de envio. ':'')+descreverCapa(atual.capa)});
 return items;
}
