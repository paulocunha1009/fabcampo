import {requestAuthorizedAction} from './login.js';
import {EDITORIAL_API} from './auth-config.js';
import {obterVinculoPublicacao} from './rascunhos.js?v=20261108-2';
const $=id=>document.getElementById(id),endpoint=EDITORIAL_API.replace(/\/me$/,'/publicacoes');
let plan=null,busy=false,tracking=null;
const info=text=>{$('estado-publicacao').textContent=text;};
function reset(){plan=null;$('confirmar-publicacao').disabled=true;$('revisao-publicacao').checked=false;$('resumo-publicacao').textContent='';$('link-publicacao').hidden=true;$('confirmar-retirada').disabled=true;$('revisao-retirada').checked=false;}
function sameBinding(binding){try{return JSON.stringify(obterVinculoPublicacao())===JSON.stringify(binding);}catch{return false;}}
async function call(path,credential,body){
  const response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credential,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(120000)});
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'O servidor não confirmou a publicação. Consulte o estado antes de tentar novamente.');
  return result;
}
$('ir-publicacao').addEventListener('click',()=>{$('area-publicacao').open=true;$('area-publicacao').scrollIntoView({block:'start'});});
$('preparar-publicacao').addEventListener('click',()=>{
  if(busy)return;let binding;try{binding=obterVinculoPublicacao();}catch(error){info(error.message);return;}
  reset();info('Confirme sua conta Google para conferir a publicação.');
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
  const prepared=plan,binding={id:prepared.id,revisao:prepared.revisao};
  if(!sameBinding(binding)){reset();info('A edição mudou. Salve e prepare novamente.');return;}
  requestAuthorizedAction(async credential=>{
    if(!sameBinding(binding)||plan!==prepared)return;busy=true;$('confirmar-publicacao').disabled=true;
    try{
      info('Enviando página, fotos e notícia ao GitHub...');
      const result=await call('/confirmar',credential,{...binding,head:prepared.head,confirmacao:prepared.confirmacao,confirmado:true});
      if(result.status!=='enviada'||result.id!==binding.id)throw new Error('Envio não confirmado. Consulte o estado antes de tentar novamente.');
      tracking=binding.id;$('consultar-publicacao').disabled=false;reset();
      info('Revisão '+binding.revisao+' de “'+prepared.titulo+'” enviada ao GitHub. '+(!sameBinding(binding)?'Há edições locais posteriores que não foram enviadas. ':'')+'Aguarde a atualização do site e use “Conferir publicação no site”.');
    }catch(error){tracking=binding.id;$('consultar-publicacao').disabled=false;reset();info(error.message+' Use a conferência do site antes de reenviar.');}
    finally{busy=false;}
  });
});
$('consultar-publicacao').addEventListener('click',()=>{
  if(busy)return;let id=tracking;try{id=id||obterVinculoPublicacao().id;}catch{}if(!id){info('Abra o rascunho salvo para consultar a publicação.');return;}
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
  reset();info('Confirme sua conta para conferir a retirada.');
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
      tracking=binding.id;reset();info('Retirada enviada ao GitHub. Aguarde e use “Conferir publicação no site”. O rascunho continua salvo.');
    }catch(error){tracking=binding.id;reset();info(error.message+' Confira o site antes de tentar novamente.');}finally{busy=false;}
  });
});
document.addEventListener('editorial-record-loaded',()=>{reset();tracking=null;$('consultar-publicacao').disabled=false;$('link-publicacao').hidden=true;});
document.addEventListener('editorial-access-cleared',reset);
document.getElementById('editorial-form').addEventListener('input',reset);
