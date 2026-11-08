import { requestAuthorizedAction } from './login.js';
import { EDITORIAL_API } from './auth-config.js';
import { obterRegistroAtual, abrirRascunhoRemoto } from './painel.js';
const $=id=>document.getElementById(id);
const endpoint=EDITORIAL_API.replace(/\/me$/,'/rascunhos');
const bindings=new Map();let busy=false;
export function obterVinculoPublicacao(){
  const binding=bindings.get(key());
  if(!binding?.revisao)throw new Error('Salve esta edição no painel e aguarde a confirmação da revisão antes de preparar a publicação.');
  const current=obterRegistroAtual();
  if(current.tipo!=='noticias')throw new Error('A publicação está disponível para reportagens.');
  if(!binding?.revisao||binding.snapshot!==JSON.stringify(current))throw new Error('Salve esta edição no painel e aguarde a confirmação da revisão antes de preparar a publicação.');
  return {id:binding.id,revisao:binding.revisao};
}
const key=()=>document.querySelector('[data-tipo][aria-pressed="true"]').dataset.tipo+':'+$('registro-editorial').value;
const status=text=>{$('estado-salvamento').textContent=text;};
async function call(url,credential,body) {
  const response=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${credential}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(typeof error.error==='string'?error.error:'O servidor não confirmou a operação. O texto local foi preservado.');}
  return response.json();
}
function authorized(action) {
  if(busy)return;
  status('Confirme sua conta Google para continuar.');
  requestAuthorizedAction(async credential=>{
    if(busy)return;busy=true;$('salvar-no-painel').disabled=true;
    try{await action(credential);}catch(error){status(error.message || 'Não foi possível confirmar a operação. Baixe o rascunho para preservar o texto.');}
    finally{busy=false;$('salvar-no-painel').disabled=false;}
  });
}
$('salvar-no-painel').addEventListener('click',()=>{
  let draft;
  try{draft=obterRegistroAtual();}catch{$('guardar-rascunho').click();return;}
  $('guardar-rascunho').click();
  const originalKey=key();
  const binding=bindings.get(originalKey) || {id:crypto.randomUUID(),revisao:0};
  bindings.set(originalKey,binding);
  const original=JSON.stringify(draft);
  authorized(async credential=>{
    if(originalKey!==key() || original!==JSON.stringify(obterRegistroAtual())){status('A edição mudou. Confira e solicite o salvamento novamente.');return;}
    status('Salvando rascunho no painel...');
    const result=await call(endpoint,credential,{...draft,...binding});
    if(result.id!==binding.id || !Number.isInteger(result.revisao) || result.revisao!==binding.revisao+1 || result.status!=='rascunho')throw new Error('O servidor não confirmou a revisão esperada. Confira antes de tentar novamente.');
    bindings.set(originalKey,{id:result.id,revisao:result.revisao,snapshot:original});
    const mudou=originalKey!==key() || original!==JSON.stringify(obterRegistroAtual());
    status(`Rascunho salvo no painel — revisão ${result.revisao}.${mudou?' Há alterações locais posteriores que ainda precisam ser salvas.':' Nenhuma publicação foi feita.'}`);
  });
});
$('listar-rascunhos').addEventListener('click',()=>authorized(async credential=>{
  const result=await call(endpoint,credential);
  if(!Array.isArray(result.rascunhos))throw new Error('A lista de rascunhos não foi confirmada.');
  const select=$('rascunho-remoto');select.replaceChildren(new Option('Escolha um rascunho',''));
  for(const draft of result.rascunhos){if(typeof draft.id==='string' && /^[a-f0-9-]{36}$/.test(draft.id) && typeof draft.titulo==='string')select.append(new Option(`${draft.titulo} — revisão ${draft.revisao}`,draft.id));}
  $('abrir-rascunho-remoto').disabled=true;
  status(result.rascunhos.length?'Rascunhos encontrados. Escolha qual deseja abrir.':'Nenhum rascunho salvo no painel ainda.');
}));
$('rascunho-remoto').addEventListener('change',()=>{$('abrir-rascunho-remoto').disabled=!$('rascunho-remoto').value;});
$('abrir-rascunho-remoto').addEventListener('click',()=>{
  if(!$('cancelar-edicao').hidden){status('Guarde a edição local antes de abrir outro rascunho.');return;}
  const id=$('rascunho-remoto').value;if(!id)return;
  authorized(async credential=>{
    const draft=await call(endpoint+'/'+encodeURIComponent(id),credential);
    if(draft.id!==id || !Number.isInteger(draft.revisao) || draft.revisao<1)throw new Error('Rascunho recebido em formato inesperado.');
    abrirRascunhoRemoto(draft);bindings.set(key(),{id:draft.id,revisao:draft.revisao,snapshot:JSON.stringify(obterRegistroAtual())});
    status(`Rascunho aberto — revisão ${draft.revisao}. Os arquivos de foto ainda não enviados não podem ser recuperados do servidor.`);
  });
});
