const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const acervo=['pages/reportagem-educacao.html','pages/reportagem-clima.html','pages/materia_ia_educacao_v2.html'];
export function conferirEstadoRevisao(result,expected){
 if(!idPattern.test(expected?.id||'')||!Number.isInteger(expected.revisao)||expected.revisao<1||!(expected.path==='pages/reportagem-'+expected.id+'.html'||acervo.includes(expected.path)))throw new Error('Revisão de destino inválida.');
 if(result?.id!==expected.id||!['publicada','aguardando','retirada','nao-enviada','existente'].includes(result.status)||(result.link&&result.link!==expected.path))throw new Error('O servidor não confirmou o estado desta reportagem.');
 if(result.status==='publicada'){
  if(!Number.isInteger(result.revisao)||result.revisao<1||result.link!==expected.path)throw new Error('Revisão publicada não conferida.');
  return result.revisao===expected.revisao?'confirmada':'outra-revisao';
 }
 return result.status==='retirada'?'retirada':'aguardando';
}
function pausa(ms,signal){return new Promise((resolve,reject)=>{if(signal?.aborted){reject(new Error('Consulta interrompida.'));return;}const finish=()=>{signal?.removeEventListener('abort',cancel);resolve();},timer=setTimeout(finish,ms),cancel=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);reject(new Error('Consulta interrompida.'));};signal?.addEventListener('abort',cancel,{once:true});});}
export async function acompanharPublicacao({expected,consultar,onUpdate=()=>{},signal,ativo=()=>true,esperar=pausa,intervalos=[0,4000,8000,12000]}){
 let ultimo=null;
 for(let index=0;index<intervalos.length;index++){
  if(signal?.aborted||!ativo())return {status:'cancelada'};
  try{if(intervalos[index])await esperar(intervalos[index],signal);if(signal?.aborted||!ativo())return {status:'cancelada'};ultimo=await consultar();if(signal?.aborted||!ativo())return {status:'cancelada'};const status=conferirEstadoRevisao(ultimo,expected);onUpdate({status,tentativa:index+1,total:intervalos.length,publicacao:ultimo});if(status!=='aguardando')return {status,publicacao:ultimo};}
  catch(error){if(signal?.aborted||!ativo())return {status:'cancelada'};throw error;}
 }
 return {status:'aguardando',publicacao:ultimo};
}
