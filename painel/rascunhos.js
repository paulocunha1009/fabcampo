import {descreverEstadoEdicao} from './estado-edicao.mjs?v=20261111-3';
import { requestAuthorizedAction } from './login.js';
import { EDITORIAL_API } from './auth-config.js';
import { obterRegistroAtual, abrirRascunhoRemoto } from './painel.js?v=20261110-4';
import {descreverPublicacao,correspondeFiltroMateria,resumirFiltroMaterias} from './lista-materias.mjs?v=20261111-3';
const $=id=>document.getElementById(id);
const endpoint=EDITORIAL_API.replace(/\/me$/,'/rascunhos');
const bindings=new Map();let busy=false;
let listVersion=0;
// Referência local apenas em memória; não é confirmação de gravação no servidor.
function camposAbertos(){return JSON.stringify(Array.from($('editorial-form').elements||[]).map(el=>[el.id,el.value,el.checked,Array.from(el.files||[]).map(file=>[file.name,file.size,file.lastModified])]));}
let camposDeReferencia=camposAbertos();
document.addEventListener('editorial-record-loaded',()=>queueMicrotask(()=>{camposDeReferencia=camposAbertos();}));
globalThis.addEventListener?.('beforeunload',event=>{
  if(!busy&&camposAbertos()===camposDeReferencia)return;
  event.preventDefault();event.returnValue='';
});
function filtrarLista(){
  const filtros={busca:$('busca-materias').value,grupo:$('filtro-materias').value,estado:$('estado-materias').value};
  const rows=Array.from($('lista-materias').children),items=rows.map(row=>({titulo:row.dataset.titulo,lixeira:row.dataset.lixeira==='true',estado:row.dataset.estado}));
  rows.forEach((row,index)=>{row.hidden=!correspondeFiltroMateria(items[index],filtros);});
  $('resultado-materias').textContent=$('lista-materias').dataset.carregada==='true'?resumirFiltroMaterias(items,filtros).texto:'Busque os rascunhos da equipe para carregar a lista.';
  $('limpar-filtros-materias').disabled=!filtros.busca&&!['rascunho','publicada','pendente','retirada','aguardando','desconhecida'].includes(filtros.estado);
  $('estado-materias').disabled=filtros.grupo==='lixeira';
}

function clearList(){listVersion++;$('lista-materias').dataset.carregada='false';$('lista-materias').replaceChildren();filtrarLista();$('rascunho-remoto').replaceChildren(new Option('Busque os rascunhos para escolher',''));$('abrir-rascunho-remoto').disabled=true;}
document.addEventListener('editorial-access-cleared',clearList);
document.addEventListener('editorial-publication-changed',clearList);
async function renderList(drafts,credential){
  const version=++listVersion,container=$('lista-materias');container.replaceChildren();container.dataset.carregada='true';
  const queue=[];
  for(const draft of drafts){
    const row=document.createElement('li'),title=document.createElement('strong'),state=document.createElement('p'),detail=document.createElement('p'),actions=document.createElement('div'),open=document.createElement('button');
    row.dataset.titulo=draft.titulo;row.dataset.lixeira=String(Boolean(draft.lixeira));row.dataset.estado=draft.tipo==='noticias'?'desconhecida':'rascunho';title.textContent=draft.titulo;state.textContent=draft.tipo==='noticias'?'Conferindo publicação…':'Rascunho de evento';detail.textContent='Revisão salva: '+draft.revisao;open.type='button';open.textContent='Editar';
    open.addEventListener('click',()=>{if(version!==listVersion)return;$('rascunho-remoto').value=draft.id;$('abrir-rascunho-remoto').disabled=false;$('abrir-rascunho-remoto').click();});
    const actionButton=(label,acao)=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.className='botao-secundario';button.addEventListener('click',()=>{if(version===listVersion)document.dispatchEvent(new CustomEvent('editorial-acao-materia',{detail:{draft,acao}}));});actions.append(button);return button;};
    row.append(title,state,detail,actions);container.append(row);
    if(draft.lixeira){state.textContent='Lixeira';detail.textContent='Rascunho preservado. Restaurar não publica a matéria.';actionButton('Restaurar','restaurar');continue;}
    actions.append(open);const trash=actionButton('Mover para a lixeira','lixeira');trash.disabled=draft.tipo==='noticias';

    if(draft.tipo!=='noticias')continue;
    queue.push(async()=>{
      try{
        const result=await call(EDITORIAL_API.replace(/\/me$/,'/publicacoes/')+encodeURIComponent(draft.id),credential);
        if(version!==listVersion)return;const description=descreverPublicacao(draft,result);
        row.dataset.estado=result.status==='publicada'?(draft.revisao===result.revisao?'publicada':'pendente'):({existente:'publicada','nao-enviada':'rascunho',retirada:'retirada',aguardando:'aguardando'}[result.status]||'desconhecida');filtrarLista();state.textContent=description.rotulo;detail.textContent=description.detalhe;trash.disabled=!['nao-enviada','retirada'].includes(result.status);if(['publicada','existente'].includes(result.status))actionButton('Inativar','inativar');
        if(description.link){const link=document.createElement('a');link.href=description.link;link.textContent='Abrir no portal';link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
      }catch{if(version===listVersion){state.textContent='Publicação não conferida';detail.textContent='Não foi possível confirmar o estado. Busque a lista novamente.';}}
    });
  }
  filtrarLista();
  // Consultas progressivas e limitadas: não dispara uma requisição por matéria de uma vez.
  async function worker(){while(queue.length&&version===listVersion)await queue.shift()();}
  await Promise.all(Array.from({length:Math.min(3,queue.length)},worker));
}
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
function atualizarEstadoEdicao(){
  let snapshot=null;try{snapshot=JSON.stringify(obterRegistroAtual());}catch{}
  const descricao=descreverEstadoEdicao(bindings.get(key()),snapshot);
  $('estado-edicao-atual').textContent=descricao.texto;$('estado-edicao-atual').dataset.estado=descricao.estado;
}
$('editorial-form').addEventListener('input',atualizarEstadoEdicao);
$('editorial-form').addEventListener('change',atualizarEstadoEdicao);
$('editorial-form').addEventListener('submit',()=>queueMicrotask(atualizarEstadoEdicao));
document.addEventListener('editorial-record-loaded',()=>queueMicrotask(atualizarEstadoEdicao));
atualizarEstadoEdicao();

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
  const original=JSON.stringify(draft),camposEnviados=camposAbertos();
  authorized(async credential=>{
    if(originalKey!==key() || original!==JSON.stringify(obterRegistroAtual())){status('A edição mudou. Confira e solicite o salvamento novamente.');return;}
    status('Salvando rascunho no painel...');
    const result=await call(endpoint,credential,{...draft,...binding});
    if(result.id!==binding.id || !Number.isInteger(result.revisao) || result.revisao!==binding.revisao+1 || result.status!=='rascunho')throw new Error('O servidor não confirmou a revisão esperada. Confira antes de tentar novamente.');
    bindings.set(originalKey,{id:result.id,revisao:result.revisao,snapshot:original});
    camposDeReferencia=camposEnviados;clearList();atualizarEstadoEdicao();
    const mudou=originalKey!==key() || original!==JSON.stringify(obterRegistroAtual());
    status(`Rascunho salvo no painel — revisão ${result.revisao}.${mudou?' Há alterações locais posteriores que ainda precisam ser salvas.':' Nenhuma publicação foi feita.'}`);
  });
});
$('listar-rascunhos').addEventListener('click',()=>authorized(async credential=>{
  const version=listVersion;
  const result=await call(endpoint,credential);
  if(version!==listVersion)return;
  if(!Array.isArray(result.rascunhos))throw new Error('A lista de rascunhos não foi confirmada.');
  const select=$('rascunho-remoto');select.replaceChildren(new Option('Escolha um rascunho',''));
  const drafts=result.rascunhos.filter(draft=>typeof draft.id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(draft.id)&&typeof draft.titulo==='string'&&Number.isInteger(draft.revisao)&&draft.revisao>0&&['noticias','eventos'].includes(draft.tipo));
  const active=drafts.filter(draft=>!draft.lixeira);
  for(const draft of active)select.append(new Option(`${draft.titulo} — revisão ${draft.revisao}`,draft.id));
  $('abrir-rascunho-remoto').disabled=true;
  status(result.rascunhos.length?'Rascunhos encontrados. Escolha qual deseja abrir.':'Nenhum rascunho salvo no painel ainda.');
  void renderList(drafts,credential).catch(()=>{if(version===listVersion)status('Busque a lista novamente para conferir o estado.');});
}));
$('rascunho-remoto').addEventListener('change',()=>{$('abrir-rascunho-remoto').disabled=!$('rascunho-remoto').value;});
$('abrir-rascunho-remoto').addEventListener('click',()=>{
  if(!$('cancelar-edicao').hidden){status('Guarde a edição local antes de abrir outro rascunho.');return;}
  const id=$('rascunho-remoto').value;if(!id)return;
  authorized(async credential=>{
    const draft=await call(endpoint+'/'+encodeURIComponent(id),credential);
    if(draft.id!==id || !Number.isInteger(draft.revisao) || draft.revisao<1)throw new Error('Rascunho recebido em formato inesperado.');
    if(draft.registro?.acervo){document.dispatchEvent(new CustomEvent('editorial-open-acervo',{detail:{path:draft.registro.acervo.path}}));status('Reportagem antiga selecionada. Continue no editor do acervo.');return;}
    abrirRascunhoRemoto(draft);bindings.set(key(),{id:draft.id,revisao:draft.revisao,snapshot:JSON.stringify(obterRegistroAtual())});
    atualizarEstadoEdicao();
    status(`Rascunho aberto — revisão ${draft.revisao}. Os arquivos de foto ainda não enviados não podem ser recuperados do servidor.`);
  });
});

$('filtro-materias').addEventListener('change',()=>{$('estado-materias').value='todos';filtrarLista();});
$('limpar-filtros-materias').addEventListener('click',()=>{$('busca-materias').value='';$('estado-materias').value='todos';filtrarLista();$('busca-materias').focus();});
$('estado-materias').addEventListener('change',filtrarLista);
$('busca-materias').addEventListener('input',filtrarLista);
