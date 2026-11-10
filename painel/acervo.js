import {requestAuthorizedAction} from './login.js';
import {EDITORIAL_API} from './auth-config.js';
const $=id=>document.getElementById(id),endpoint=EDITORIAL_API.replace(/\/me$/,'/publicacoes');
const paths=['pages/reportagem-educacao.html','pages/reportagem-clima.html','pages/materia_ia_educacao_v2.html'];
let draft=null,fields=[],dirty=false,busy=false,plan=null,epoch=0;
const message=text=>{$('estado-editor-acervo').textContent=text;};
function resetPlan(){plan=null;$('confirmacao-acervo').checked=false;$('publicar-acervo').disabled=true;}
async function call(path,credential,body){
  const response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credential,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(120000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'A operação não foi confirmada.');return result;
}
function authorized(action){
  if(busy)return;const version=epoch;
  requestAuthorizedAction(async credential=>{if(busy||version!==epoch)return;busy=true;try{await action(credential,version);}catch(error){if(version===epoch)message(error.message);}finally{busy=false;}});
}
const edits=()=>fields.map(field=>({indice:field.indice,texto:$('acervo-texto-'+field.indice).value}));
function render(){
  $('campos-acervo').replaceChildren();let group=null,details;
  for(const field of fields){
    if(group!==field.grupo){group=field.grupo;details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=group;details.append(summary);$('campos-acervo').append(details);}
    const label=document.createElement('label'),area=document.createElement('textarea');area.id='acervo-texto-'+field.indice;label.htmlFor=area.id;label.textContent='Trecho '+(field.indice+1)+' · '+field.tipo;area.value=field.texto;details.append(label,area);
  }
  $('resumo-acervo').textContent=draft.registro.titulo+' · revisão '+draft.revisao+' · '+fields.length+' trechos · endereço preservado: '+draft.registro.acervo.path;
}
function open(path){
  if(!paths.includes(path))return;
  if(dirty){$('editor-acervo').showModal();message('Há uma edição em andamento. Salve os textos antes de abrir outra matéria.');return;}
  authorized(async(credential,version)=>{
    const result=await call('/acervo/abrir',credential,{path});if(version!==epoch)return;
    draft=result.draft;fields=result.campos;if(!draft?.registro?.acervo||!Array.isArray(fields))throw new Error('A importação não foi confirmada.');
    resetPlan();dirty=false;render();$('previa-acervo-frame').hidden=true;$('previa-acervo-frame').srcdoc='';$('editor-acervo').showModal();message('Rascunho importado e salvo. A página publicada permanece igual.');
  });
}
$('listar-acervo').addEventListener('click',()=>authorized(async(credential,version)=>{
  const result=await call('/acervo/catalogo',credential);if(version!==epoch)return;
  $('catalogo-acervo').replaceChildren();
  for(const item of result){if(!paths.includes(item.path))continue;const li=document.createElement('li'),title=document.createElement('strong'),link=document.createElement('a'),button=document.createElement('button');title.textContent=item.titulo;link.href='https://fabcampo.com.br/'+item.path;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ver página original';button.type='button';button.textContent='Importar ou continuar edição';button.addEventListener('click',()=>open(item.path));li.append(title,document.createElement('br'),link,button);$('catalogo-acervo').append(li);}
  $('estado-acervo').textContent='Acervo encontrado. A importação preserva a página inteira e cria um rascunho privado.';
}));
document.addEventListener('editorial-open-acervo',event=>open(event.detail?.path));
$('fechar-acervo').addEventListener('click',()=>$('editor-acervo').close());
$('campos-acervo').addEventListener('input',()=>{dirty=true;resetPlan();$('previa-acervo-frame').hidden=true;message('Textos alterados nesta página. Salve a edição antes de preparar a atualização.');});
$('salvar-acervo').addEventListener('click',()=>{
  if(!draft)return;const input={id:draft.id,revisao:draft.revisao,path:draft.registro.acervo.path,edicoes:edits()},snapshot=JSON.stringify(edits());
  authorized(async(credential,version)=>{
    const result=await call('/acervo/salvar',credential,input);if(version!==epoch)return;
    if(result.id!==draft.id||result.revisao!==input.revisao+1)throw new Error('Revisão salva não confirmada.');
    draft=result;dirty=snapshot!==JSON.stringify(edits());resetPlan();$('resumo-acervo').textContent=draft.registro.titulo+' · revisão '+draft.revisao+' · '+draft.registro.acervo.path;document.dispatchEvent(new Event('editorial-publication-changed'));message('Rascunho salvo — revisão '+draft.revisao+'. '+(dirty?'Há alterações posteriores ainda não salvas.':'Nenhuma alteração foi publicada.'));
  });
});
$('previa-acervo').addEventListener('click',()=>{
  if(!draft)return;const input={id:draft.id,revisao:draft.revisao,path:draft.registro.acervo.path,edicoes:edits()};
  authorized(async(credential,version)=>{
    const result=await call('/acervo/previa',credential,input);if(version!==epoch)return;
    const frame=$('previa-acervo-frame');frame.hidden=false;frame.srcdoc=result.html.replace(/<head\b[^>]*>/i,match=>match+'<base href="https://fabcampo.com.br/pages/">');message('Prévia dos textos editados. Os scripts ficam desativados nesta conferência. Nada foi publicado.');
  });
});
$('preparar-acervo').addEventListener('click',()=>{
  if(!draft||dirty){message('Salve os textos antes de preparar a atualização.');return;}
  resetPlan();authorized(async(credential,version)=>{const result=await call('/preparar',credential,{id:draft.id,revisao:draft.revisao});if(version!==epoch||dirty)return;if(result.id!==draft.id||result.path!==draft.registro.acervo.path)throw new Error('Página de destino não confirmada.');plan=result;message('Atualização conferida para '+result.path+'. Revise a prévia e marque a confirmação para enviar.');});
});
$('confirmacao-acervo').addEventListener('change',()=>{$('publicar-acervo').disabled=busy||dirty||!plan?.habilitada||!$('confirmacao-acervo').checked;});
$('publicar-acervo').addEventListener('click',()=>{
  if(busy||dirty||!plan?.habilitada||!$('confirmacao-acervo').checked)return;const prepared=plan;
  authorized(async(credential,version)=>{
    if(plan!==prepared||dirty)return;$('publicar-acervo').disabled=true;
    const result=await call('/confirmar',credential,{id:prepared.id,revisao:prepared.revisao,head:prepared.head,confirmacao:prepared.confirmacao,confirmado:true});if(version!==epoch)return;
    resetPlan();document.dispatchEvent(new Event('editorial-publication-changed'));message(result.status==='enviada'?'Atualização enviada. Aguarde o portal atualizar e busque a lista de matérias para conferir o estado.':'Envio não confirmado. Confira a lista antes de tentar novamente.');
  });
});
document.addEventListener('editorial-access-cleared',()=>{epoch++;draft=null;fields=[];dirty=false;resetPlan();$('editor-acervo').close();$('campos-acervo').replaceChildren();$('catalogo-acervo').replaceChildren();$('previa-acervo-frame').srcdoc='';});
