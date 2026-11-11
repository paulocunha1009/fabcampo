const foto=/^img\/editorial\/[a-f0-9]{64}\.webp$/;
const fail=mensagem=>Object.assign(new Error(mensagem),{status:400});
function texto(value,max,nome){if(typeof value!=='string'||!value.trim()||value.length>max)throw fail('Confira '+nome+'.');return value.trim();}
export function validarOpcoesAcervo(value){
 const result={};
 if(value.resumo!==undefined)result.resumo=texto(value.resumo,1200,'o resumo da chamada (até 1.200 caracteres)');
 if(value.capa!==undefined){
  if(value.capa===null)result.capa=null;
  else{const capa=value.capa;if(!capa||!foto.test(capa.imagem))throw fail('Envie a capa pelo painel antes de salvar.');result.capa={imagem:capa.imagem,legenda:texto(capa.legenda,400,'a legenda da capa'),credito:texto(capa.credito,240,'o crédito da capa'),textoAlternativo:texto(capa.textoAlternativo,400,'a descrição acessível da capa')};}
 }
 return result;
}
