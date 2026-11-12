import {acompanharPublicacao} from './publicacao-acompanhamento.mjs?v=20261111-10';
import {requestAuthorizedAction} from './login.js';
import {EDITORIAL_API} from './auth-config.js';
import {obterVinculoPublicacao} from './rascunhos.js?v=20261112-20';
const $=id=>document.getElementById(id),endpoint=EDITORIAL_API.replace(/\/me$/,'/publicacoes');
let plan=null,busy=false,tracking=null,autoController=null,autoVersion=0,contextVersion=0;
const info=text=>{$('estado-publicacao').textContent=text;};
function reset(){plan=null;$('confirmar-publicacao').disabled=true;$('revisao-publicacao').checked=false;$('resumo-publicacao').textContent='';$('link-publicacao').hidden=true;$('confirmar-retirada').disabled=true;$('revisao-retirada').checked=false;}
function sameBinding(binding){try{return JSON.stringify(obterVinculoPublicacao())===JSON.stringify(binding);}catch{return false;}}
async function call(path,credential,body,signal){
  const response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credential,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):AbortSignal.timeout(120000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'O servidor não confirmou a publicação. Consulte o estado antes de tentar novamente.');
  return result;
}
function stopAuto(){autoVersion++;autoController?.abort();autoController=null;$('consultar-publicacao').disabled=busy;}
async function followPublicacao(expected,credential){
 stopAuto();const controller=new AbortController(),version=autoVersion;autoController=controller;$('consultar-publicacao').disabled=true;
 const active=()=>autoVersion===version&&tracking===expected.id;
 try{
  const result=await acompanharPublicacao({expected,signal:controller.signal,ativo:active,consultar:()=>call('/'+encodeURIComponent(expected.id),credential,undefined,controller.signal),onUpdate:update=>{
   if(update.status==='confirmada'){info('Revisão '+expected.revisao+' confirmada no portal: página e lista de notícias atualizadas.'+(!sameBinding({id:expected.id,revisao:expected.revisao})?' Há alterações na edição aberta que não foram publicadas.':''));const link=$('link-publicacao');link.href='https://fabcampo.com.br/'+expected.path;link.hidden=false;}
   else if(update.status==='outra-revisao')info('O portal está na revisão '+update.publicacao.revisao+'. A revisão '+expected.revisao+' acompanhada não é a atual. Confira a lista de matérias.');
   else if(update.status==='retirada')info('Esta reportagem está retirada do ar. O rascunho permanece salvo.');
   else info('Revisão '+expected.revisao+' enviada. Conferindo a atualização no site: '+update.tentativa+' de '+update.total+'. Não é necessário enviar novamente.');
  }});
  if(!active()||result.status==='cancelada')return;
  if(result.status==='confirmada')document.dispatchEvent(new Event('editorial-publication-changed'));
  if(result.status==='aguardando')info('A revisão '+expected.revisao+' ainda não foi confirmada no portal. Use “Conferir publicação no site” depois; não é necessário publicar novamente.');
 }catch(error){if(active())info(error.message+' A conferência automática parou. Use “Conferir publicação no site” para tentar novamente.');}
 finally{if(autoController===controller){autoController=null;$('consultar-publicacao').disabled=busy;}}
}
$('ir-publicacao').addEventListener('click',()=>{$('area-publicacao').open=true;$('area-publicacao').scrollIntoView({block:'start'});});
$('preparar-publicacao').addEventListener('click',()=>{
  if(busy)return;let binding;try{binding=obterVinculoPublicacao();}catch(error){info(error.message);return;}
  stopAuto();reset();info('Confirme sua conta Google para conferir a publicação.');
  requestAuthorizedAction(async credential=>{
    if(!sameBinding(binding))return;busy=true;$('preparar-publicacao').disabled=true;
    try{
      info('Conferindo revisão, fotos e versão do portal...');const result=await call('/preparar',credential,binding);
      if(!sameBinding(binding))throw new Error('A edição mudou. Salve e prepare novamente.');
      if(result.id!==binding.id||result.revisao!==binding.revisao||typeof result.confirmacao!=='string')throw new Error('Preparação não confirmada.');
      plan=result;$('resumo-publicacao').textContent=result.titulo+' · revisão '+result.revisao+' · '+result.fotos+' foto(s) · '+(result.operacao==='republicar'?'Republicar página retirada':result.operacao==='atualizar'?'Atualizar página existente':'Criar nova página');
      info(result.habilitada?'Preparação conferida. Revise a página completa e marque a confirmação para enviar.':'Preparação conferida. O envio ainda depende da ativação pelo responsável. Nenhuma matéria foi publicada.');
    }catch(error){reset();info(error.message);}finally{busy=false;$('preparar-publicacao').disabled=false;}
  });
});
$('revisao-publicacao').addEventListener('change',()=>{$('confirmar-publicacao').disabled=busy||!plan?.habilitada||plan.operacao==='retirar'||!$('revisao-publicacao').checked;});
$('confirmar-publicacao').addEventListener('click',()=>{
  if(busy||!plan?.habilitada||plan.operacao==='retirar'||!$('revisao-publicacao').checked)return;
  const prepared=plan,binding={id:prepared.id,revisao:prepared.revisao},version=contextVersion;
  if(!sameBinding(binding)){reset();info('A edição mudou. Salve e prepare novamente.');return;}
  requestAuthorizedAction(async credential=>{
    if(version!==contextVersion||!sameBinding(binding)||plan!==prepared)return;stopAuto();busy=true;$('confirmar-publicacao').disabled=true;
    try{
      info('Enviando página, fotos e notícia ao GitHub...');
      const result=await call('/confirmar',credential,{...binding,head:prepared.head,confirmacao:prepared.confirmacao,confirmado:true});
      if(version!==contextVersion)return;
      if(result.status!=='enviada'||result.id!==binding.id)throw new Error('Envio não confirmado. Consulte o estado antes de tentar novamente.');
      tracking=binding.id;$('consultar-publicacao').disabled=false;reset();document.dispatchEvent(new Event('editorial-publication-changed'));
      info('Revisão '+binding.revisao+' enviada. A atualização será conferida automaticamente no site.');void followPublicacao({...binding,path:prepared.path||'pages/reportagem-'+binding.id+'.html'},credential);
    }catch(error){if(version!==contextVersion)return;tracking=binding.id;$('consultar-publicacao').disabled=false;reset();document.dispatchEvent(new Event('editorial-publication-changed'));info(error.message+' Use a conferência do site antes de reenviar.');}
    finally{busy=false;$('consultar-publicacao').disabled=Boolean(autoController);}
  });
});
$('consultar-publicacao').addEventListener('click',()=>{
  if(busy)return;stopAuto();let id=tracking;try{id=id||obterVinculoPublicacao().id;}catch{}if(!id){info('Abra o rascunho salvo para consultar a publicação.');return;}
  requestAuthorizedAction(async credential=>{
    busy=true;try{
      const result=await call('/'+encodeURIComponent(id),credential);
      if(result.id!==id||(result.link&&result.link!=='pages/reportagem-'+id+'.html'))throw new Error('Estado de publicação não conferido.');
      info(result.status==='retirada'?'Retirada conferida no site: o texto está indisponível e saiu das notícias, da busca e do mapa do site. O rascunho permanece salvo.':result.status==='publicada'?'Publicação conferida no site: página e lista de notícias atualizadas.':result.status==='nao-enviada'?'Nenhum envio desse rascunho foi encontrado no GitHub.':'A atualização ainda não foi confirmada no site. Aguarde e consulte novamente.');
      const link=$('link-publicacao');link.hidden=result.status!=='publicada';if(result.status==='publicada'&&result.link==='pages/reportagem-'+id+'.html')link.href='https://fabcampo.com.br/'+result.link;
    }catch(error){info(error.message);}finally{busy=false;}
  });
});
$('preparar-retirada').addEventListener('click',()=>{
  if(busy)return;let binding;try{binding=obterVinculoPublicacao();}catch(error){info(error.message);return;}
  stopAuto();reset();info('Confirme sua conta para conferir a retirada.');
  requestAuthorizedAction(async credential=>{
    if(!sameBinding(binding))return;busy=true;$('preparar-retirada').disabled=true;
    try{
      const result=await call('/preparar-retirada',credential,binding);
      if(!sameBinding(binding)||result.id!==binding.id||result.revisao!==binding.revisao||result.operacao!=='retirar'||typeof result.confirmacao!=='string')throw new Error('A revisão mudou ou a retirada não foi conferida. Prepare novamente.');
      if(result.retirada){info('A retirada já foi enviada. Confira a atualização no site.');tracking=binding.id;return;}
      plan=result;$('resumo-publicacao').textContent='Retirar do ar: '+result.titulo+' · rascunho revisão '+result.revisao;
      info(result.habilitada?'Confira o título e marque a confirmação de retirada. O texto sairá do portal; o rascunho e as fotos serão preservados.':'O envio de alterações públicas está desativado.');
    }catch(error){reset();info(error.message);}finally{busy=false;$('preparar-retirada').disabled=false;}
  });
});
$('revisao-retirada').addEventListener('change',()=>{$('confirmar-retirada').disabled=busy||!plan?.habilitada||plan.operacao!=='retirar'||!$('revisao-retirada').checked;});
$('confirmar-retirada').addEventListener('click',()=>{
  if(busy||!plan?.habilitada||plan.operacao!=='retirar'||!$('revisao-retirada').checked)return;
  const prepared=plan,binding={id:plan.id,revisao:plan.revisao};
  if(!sameBinding(binding)){reset();info('A edição mudou. Prepare a retirada novamente.');return;}
  requestAuthorizedAction(async credential=>{
    if(!sameBinding(binding)||plan!==prepared)return;busy=true;$('confirmar-retirada').disabled=true;
    try{
      const result=await call('/retirar',credential,{...binding,head:prepared.head,confirmacao:prepared.confirmacao,confirmado:true});
      if(result.id!==binding.id||result.status!=='retirada-enviada')throw new Error('Retirada não confirmada.');
      tracking=binding.id;reset();document.dispatchEvent(new Event('editorial-publication-changed'));info('Retirada enviada ao GitHub. Aguarde e use “Conferir publicação no site”. O rascunho continua salvo.');
    }catch(error){tracking=binding.id;reset();info(error.message+' Confira o site antes de tentar novamente.');}finally{busy=false;}
  });
});
document.addEventListener('editorial-record-loaded',()=>{contextVersion++;stopAuto();reset();tracking=null;$('consultar-publicacao').disabled=false;$('link-publicacao').hidden=true;});
document.addEventListener('editorial-access-cleared',()=>{contextVersion++;stopAuto();tracking=null;reset();info('Entre com a conta autorizada para conferir ou publicar.');});
document.addEventListener('editorial-open-acervo',()=>{contextVersion++;stopAuto();});
document.getElementById('editorial-form').addEventListener('input',reset);
