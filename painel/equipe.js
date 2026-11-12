import {requestAuthorizedAction} from './login.js';
import {EDITORIAL_API} from './auth-config.js';
const $=id=>document.getElementById(id),dialog=$('equipe-dialog'),endpoint=EDITORIAL_API.replace(/\/me$/,'/equipe');
let epoch=0,writing=false,revision=null,manager=false;
function status(text){$('equipe-status').textContent=text;}
function controls(){for(const id of ['equipe-email','equipe-papel','equipe-confirmar','equipe-atualizar','equipe-fechar'])$(id).disabled=writing;$('equipe-salvar').disabled=writing||revision===null||!$('equipe-confirmar').checked;}
async function call(credential,body){const response=await fetch(endpoint,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credential,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Não foi possível conferir a equipe.');return data;}
const labels={rascunhos:'Somente rascunhos',publicador:'Acesso editorial completo',inativo:'Acesso inativo'};
function load(){if(writing||!manager)return;const version=++epoch;revision=null;controls();status('Consultando a equipe…');$('equipe-lista').replaceChildren();$('equipe-confirmar').checked=false;
 requestAuthorizedAction(async credential=>{if(version!==epoch)return;try{const data=await call(credential);if(version!==epoch||!manager)return;revision=data.revisao;$('equipe-responsavel').textContent=`Responsável protegido: ${data.responsavel}. Somente esta conta pode gerenciar a equipe.`;for(const member of data.membros){const li=document.createElement('li'),text=document.createElement('p'),button=document.createElement('button');text.textContent=`${member.email} — ${labels[member.papel]||'Estado não reconhecido'}`;button.type='button';button.className='botao-secundario';button.textContent='Alterar acesso';button.setAttribute('aria-label','Alterar acesso de '+member.email);button.addEventListener('click',()=>{if(writing)return;$('equipe-email').value=member.email;$('equipe-papel').value=member.papel;$('equipe-confirmar').checked=false;controls();$('equipe-papel').focus();});li.append(text,button);$('equipe-lista').append(li);}status(data.membros.length?'Equipe conferida. Selecione um integrante ou informe outro e-mail.':'Nenhum integrante adicional cadastrado.');controls();}catch(error){if(version===epoch){status(error.message);controls();}}});
}
$('abrir-equipe').addEventListener('click',()=>{if(!manager)return;dialog.showModal();load();});
$('equipe-atualizar').addEventListener('click',load);
for(const id of ['equipe-email','equipe-papel'])$(id).addEventListener('input',()=>{$('equipe-confirmar').checked=false;controls();});
$('equipe-confirmar').addEventListener('change',controls);
$('equipe-form').addEventListener('submit',event=>{event.preventDefault();if(writing||revision===null||!manager||!$('equipe-confirmar').checked)return;const body={email:$('equipe-email').value.trim().toLowerCase(),papel:$('equipe-papel').value,revisao:revision,confirmado:true},version=epoch;
 requestAuthorizedAction(async credential=>{if(version!==epoch||writing||!manager||!$('equipe-confirmar').checked||body.email!==$('equipe-email').value.trim().toLowerCase()||body.papel!==$('equipe-papel').value)return;writing=true;controls();status('Salvando a permissão…');try{const data=await call(credential,body);if(version!==epoch)return;if(data.revisao!==body.revisao+1||data.email!==body.email||data.papel!==body.papel)throw Error('Resposta diferente da alteração solicitada.');status(`Permissão salva: ${data.email} — ${labels[data.papel]}. Consulte a lista para continuar.`);revision=null;}catch(error){if(version===epoch){revision=null;status(error.message+' Consulte a lista antes de outra alteração.');}}finally{writing=false;$('equipe-confirmar').checked=false;controls();}});
});
$('equipe-fechar').addEventListener('click',()=>{if(!writing)dialog.close();});
dialog.addEventListener('cancel',event=>{if(writing)event.preventDefault();});
dialog.addEventListener('close',()=>{epoch++;revision=null;$('equipe-lista').replaceChildren();$('equipe-responsavel').textContent='';$('equipe-email').value='';$('equipe-confirmar').checked=false;});
function clear(){manager=false;$('cartao-equipe').hidden=true;epoch++;revision=null;if(dialog.open)dialog.close();}
document.addEventListener('editorial-permissions',event=>{manager=event.detail?.gerenciarEquipe===true;$('cartao-equipe').hidden=!manager;if(!manager)clear();});
new MutationObserver(()=>{if($('situacao-acesso').dataset.estado!=='conectada')clear();}).observe($('situacao-acesso'),{attributes:true,attributeFilter:['data-estado']});
globalThis.addEventListener?.('beforeunload',event=>{if(writing){event.preventDefault();event.returnValue='';}});
