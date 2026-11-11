import {montarCopiaAcervo,lerCopiaAcervo,LIMITE_COPIA_ACERVO} from './acervo-copia.mjs?v=20261111-7';
import {obterCapaAcervo,definirCapaAcervo,exportarCapaAcervo} from './acervo-capa.js?v=20261111-7';
import {validarOpcoesAcervo} from '../backend/lib/editorial-acervo-opcoes.mjs?v=20261111-5';
import {requestAuthorizedAction} from './login.js';
import {EDITORIAL_API} from './auth-config.js';
import {montarPreviaVisual,obterCardsVisuais,tituloVisualAcervo} from './acervo-visual.js?v=20261111-5';
const $=id=>document.getElementById(id),endpoint=EDITORIAL_API.replace(/\/me$/,'/publicacoes');
const paths=['pages/reportagem-educacao.html','pages/reportagem-clima.html','pages/materia_ia_educacao_v2.html'];
let draft=null,fields=[],dirty=false,busy=false,writing=false,plan=null,epoch=0,selected=null,nonce="",savedFields=[],hiddenMarks=false,cards=[],selectedCard=null;let savedOptions='';let backupPending=null,backupRead=0;
const message=text=>{$('estado-editor-acervo').textContent=text;};
function resetPlan(){if(backupPending){$('confirmar-copia-acervo').checked=false;$('aplicar-copia-acervo').disabled=true;}plan=null;$('confirmacao-acervo').checked=false;$('publicar-acervo').disabled=true;}
async function call(path,credential,body){
  const response=await fetch(endpoint+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+credential,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),credentials:'omit',cache:'no-store',redirect:'error',signal:AbortSignal.timeout(120000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'A operação não foi confirmada.');return result;
}
function refreshButtons(){
  for(const id of ['salvar-acervo','preparar-acervo','confirmacao-acervo'])$(id).disabled=busy;
  $('aplicar-copia-acervo').disabled=busy||!backupPending||!$('confirmar-copia-acervo').checked;$('arquivo-copia-acervo').disabled=busy;$('fechar-acervo').disabled=writing;$('editor-acervo').setAttribute('aria-busy',String(busy));
  $('publicar-acervo').disabled=busy||dirty||!plan?.habilitada||!$('confirmacao-acervo').checked;
}
function authorized(action,{text='',write=false}={}){
  if(busy)return;const version=epoch;
  requestAuthorizedAction(async credential=>{if(busy||version!==epoch)return;busy=true;writing=write;refreshButtons();if(text)message(text);try{await action(credential,version);}catch(error){if(version===epoch)message(error.message);}finally{busy=false;writing=false;refreshButtons();}});
}

const edits=()=>fields.map(field=>({indice:field.indice,texto:field.texto}));
function clearBackup(){backupRead++;backupPending=null;$('confirmar-copia-acervo').checked=false;$('aplicar-copia-acervo').disabled=true;$('conferencia-copia-acervo').hidden=true;$('arquivo-copia-acervo').value='';}
$('baixar-copia-acervo').addEventListener('click',()=>{
 if(!draft)return;let url;const link=document.createElement('a');
 try{const snapshot=montarCopiaAcervo({draft,fields,resumo:$('chamada-resumo-acervo').value,...exportarCapaAcervo()});const blob=new Blob([JSON.stringify(snapshot)],{type:'application/json;charset=utf-8'});if(blob.size>LIMITE_COPIA_ACERVO)throw new Error('A cópia ultrapassa 512 KB.');url=URL.createObjectURL(blob);link.href=url;link.download='fabcampo-'+draft.registro.acervo.path.split('/').at(-1).replace(/\.html$/,'')+'-copia.json';document.body.append(link);link.click();$('estado-copia-acervo').textContent='Download solicitado. Confira se o arquivo foi baixado. A cópia não inclui fotos locais ainda não enviadas nem salva ou publica no portal.';}
 catch(error){$('estado-copia-acervo').textContent=error.message;}finally{link.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
});
$('arquivo-copia-acervo').addEventListener('change',async event=>{
 backupPending=null;$('confirmar-copia-acervo').checked=false;$('aplicar-copia-acervo').disabled=true;$('conferencia-copia-acervo').hidden=true;const reading=++backupRead,file=event.target.files[0];if(!file||!draft)return;const id=draft.id;
 try{if(file.size>LIMITE_COPIA_ACERVO)throw new Error('Escolha uma cópia JSON de até 512 KB.');const text=await file.text();if(reading!==backupRead||draft?.id!==id)return;backupPending=lerCopiaAcervo(text,{draft,fields});$('detalhes-copia-acervo').textContent=backupPending.titulo+' · Cópia da revisão '+backupPending.revisaoOrigem+' · Revisão aberta: '+draft.revisao+'. Os campos só serão substituídos após sua confirmação.'+(backupPending.imagemPendente?' A foto local pendente não está no arquivo: selecione-a novamente depois.':'');$('conferencia-copia-acervo').hidden=false;$('estado-copia-acervo').textContent='Arquivo conferido neste computador. Nenhum dado foi enviado ao servidor.';}
 catch(error){if(reading===backupRead)$('estado-copia-acervo').textContent=error.message;}
});
$('confirmar-copia-acervo').addEventListener('change',()=>{$('aplicar-copia-acervo').disabled=busy||!backupPending||!$('confirmar-copia-acervo').checked;});
$('aplicar-copia-acervo').addEventListener('click',()=>{
 if(busy||!draft||!backupPending||!$('confirmar-copia-acervo').checked)return;
 try{const backup=lerCopiaAcervo(JSON.stringify(backupPending),{draft,fields});fields=fields.map((field,index)=>({...field,texto:backup.edicoes[index].texto}));$('chamada-resumo-acervo').value=backup.resumo;definirCapaAcervo(backup.capa,draft.id,{pendente:backup.imagemPendente});resetPlan();dirty=true;selected=null;selectedCard=null;refreshCards();$('campos-acervo').hidden=true;$('acervo-card-editor').hidden=true;$('acervo-vazio').hidden=false;nonce=crypto.randomUUID();$('previa-acervo-frame').srcdoc=montarPreviaVisual(draft.registro.acervo.original,fields,nonce,{capa:backup.capa});updateCall();clearBackup();$('estado-copia-acervo').textContent='Cópia aplicada somente à edição aberta. Confira os campos e use “Salvar rascunho” para guardar no painel.'+(backup.imagemPendente?' Selecione novamente a foto que ainda não havia sido enviada.':'');message('Cópia recuperada. Nenhuma gravação ou publicação foi feita.');}
 catch(error){$('estado-copia-acervo').textContent=error.message;}
});

function options(){return validarOpcoesAcervo({resumo:$('chamada-resumo-acervo').value,capa:obterCapaAcervo()});}
function hasChanges(){try{return fields.some((field,index)=>field.texto!==savedFields[index])||JSON.stringify(options())!==savedOptions;}catch{return true;}}
function updateCall(){if(!draft)return;$('chamada-titulo-acervo').textContent=tituloVisualAcervo(draft.registro.acervo.original,fields)||draft.registro.titulo;$('chamada-previa-resumo-acervo').textContent=$('chamada-resumo-acervo').value;try{const capa=obterCapaAcervo();$('chamada-previa-imagem-acervo').hidden=!capa;if(capa){$('chamada-previa-imagem-acervo').src='https://fabcampo.com.br/'+capa.imagem;$('chamada-previa-imagem-acervo').alt=capa.textoAlternativo;}}catch{}}
function refreshVisual(){nonce=crypto.randomUUID();$('previa-acervo-frame').srcdoc=montarPreviaVisual(draft.registro.acervo.original,fields,nonce,options());updateCall();}
function optionsChanged(){if(!draft)return;dirty=true;resetPlan();updateCall();message('Chamada ou capa alterada. Confira a prévia e salve o rascunho.');}
$('chamada-resumo-acervo').addEventListener('input',optionsChanged);
document.addEventListener('editorial-acervo-capa',optionsChanged);
$('conferir-chamada-acervo').addEventListener('click',()=>{if(!draft)return;try{refreshVisual();message('Prévia atualizada com os textos, o resumo e a capa desta edição. Salve antes de publicar.');}catch(error){message(error.message);}});

const typeLabels={h1:'Título principal',h2:'Título da seção',h3:'Subtítulo da seção',h4:'Título do bloco',h5:'Título do bloco',h6:'Título do bloco',p:'Parágrafo',strong:'Texto em destaque',b:'Texto em destaque',em:'Texto em ênfase',li:'Item de lista',td:'Informação da tabela',th:'Título da coluna',figcaption:'Legenda da imagem',a:'Texto do link'};
function send(data){$('previa-acervo-frame').contentWindow?.postMessage({...data,nonce},'*');}
function selectField(index){
  if(!draft||!Number.isInteger(index)||!fields[index])return;
  const card=cards.find(card=>card.campos.some(field=>field.indice===index));if(card){selectCard(card.id);return;}
  selectedCard=null;$('acervo-card-editor').hidden=true;selected=index;const field=fields[index];$('acervo-vazio').hidden=true;$('campos-acervo').hidden=false;
  $('acervo-contexto').textContent=field.grupo;$('acervo-tipo').textContent=typeLabels[field.tipo]||'Texto selecionado';$('texto-selecionado-acervo').value=field.texto;
}
function changed(index,text){
  fields[index].texto=text;dirty=true;resetPlan();updateCall();send({tipo:'acervo-atualizar',indice:index,texto:text});message('Alterações ainda não salvas. Use “Salvar rascunho” para guardar.');
}
function selectCard(id){
  if(!Number.isInteger(id)||!cards[id])return;const card=cards[id];selected=null;selectedCard=id;
  $('acervo-vazio').hidden=true;$('campos-acervo').hidden=true;$('acervo-card-editor').hidden=false;$('acervo-card-nome').textContent=card.titulo;$('card-acervo').value=String(id);
  const holder=$('acervo-card-campos');holder.replaceChildren();const totals={};for(const field of card.campos)totals[field.label]=(totals[field.label]||0)+1;const seen={};
  for(const part of card.campos){
    const field=fields[part.indice],label=document.createElement('label'),input=document.createElement(part.label==='Texto'?'textarea':'input');input.id='acervo-card-campo-'+part.indice;label.htmlFor=input.id;seen[part.label]=(seen[part.label]||0)+1;label.textContent=part.label+(totals[part.label]>1?' — parte '+seen[part.label]:'');input.value=field.texto;input.maxLength=12000;if(input.tagName==='TEXTAREA')input.rows=4;
    input.addEventListener('input',()=>changed(part.indice,input.value));holder.append(label,input);
  }
}
$('card-acervo').addEventListener('change',()=>{const value=$('card-acervo').value;if(value==='')return;const id=Number(value);selectCard(id);send({tipo:'acervo-focar',indice:cards[id].campos[0].indice});});
$('restaurar-card-acervo').addEventListener('click',()=>{
  if(selectedCard===null)return;for(const part of cards[selectedCard].campos){fields[part.indice].texto=savedFields[part.indice];send({tipo:'acervo-atualizar',indice:part.indice,texto:savedFields[part.indice]});}selectCard(selectedCard);dirty=hasChanges();resetPlan();updateCall();message(dirty?'Card restaurado. Há outras alterações não salvas.':'Card restaurado à revisão salva.');
});
function updateSummary(){if(draft){$('resumo-acervo').textContent=draft.registro.titulo+' · Rascunho salvo: revisão '+draft.revisao;updateCall();}}
function refreshCards(){cards=obterCardsVisuais(draft.registro.acervo.original,fields);$('acervo-card-editor').hidden=true;const cardSelect=$('card-acervo');cardSelect.replaceChildren(new Option('Escolha um card',''));for(const card of cards)cardSelect.append(new Option((card.id+1)+'. '+card.titulo,String(card.id)));cardSelect.disabled=!cards.length;}
function render(){
  updateSummary();selected=null;selectedCard=null;refreshCards();nonce=crypto.randomUUID();savedFields=fields.map(field=>field.texto);hiddenMarks=false;
  $('previa-acervo').textContent='Visualizar sem marcações';$('campos-acervo').hidden=true;$('acervo-vazio').hidden=false;
  const select=$('secao-acervo');select.replaceChildren(new Option('Escolha uma seção',''));const seen=new Set();
  for(const field of fields)if(!seen.has(field.grupo)){seen.add(field.grupo);select.append(new Option(field.grupo,String(field.indice)));}
  $('previa-acervo-frame').srcdoc=montarPreviaVisual(draft.registro.acervo.original,fields,nonce,{capa:draft.registro.acervo.capa});updateCall();
}
window.addEventListener('message',event=>{if(event.source!==$('previa-acervo-frame').contentWindow||event.data?.nonce!==nonce)return;if(event.data?.tipo==='acervo-selecao')selectField(event.data.indice);if(event.data?.tipo==='acervo-card')selectCard(event.data.cardId);});
$('secao-acervo').addEventListener('change',()=>{if(!$('secao-acervo').value)return;const index=Number($('secao-acervo').value);selectField(index);send({tipo:'acervo-focar',indice:index});});
$('texto-selecionado-acervo').addEventListener('input',()=>{
  if(selected===null)return;fields[selected].texto=$('texto-selecionado-acervo').value;dirty=true;resetPlan();updateCall();send({tipo:'acervo-atualizar',indice:selected,texto:fields[selected].texto});message('Alterações ainda não salvas. Use “Salvar rascunho” para guardar.');
});
$('restaurar-trecho-acervo').addEventListener('click',()=>{
  if(selected===null)return;fields[selected].texto=savedFields[selected];$('texto-selecionado-acervo').value=fields[selected].texto;send({tipo:'acervo-atualizar',indice:selected,texto:fields[selected].texto});dirty=hasChanges();resetPlan();updateCall();message(dirty?'Há outras alterações não salvas.':'O texto voltou à revisão salva.');
});
function open(path){
  if(!paths.includes(path))return;
  if(dirty){if(!$('editor-acervo').open)$('editor-acervo').showModal();message('Há uma edição em andamento. Salve os textos antes de abrir outra matéria.');return;}
  authorized(async(credential,version)=>{
    const result=await call('/acervo/abrir',credential,{path});if(version!==epoch)return;
    draft=result.draft;fields=result.campos;clearBackup();if(!draft?.registro?.acervo||!Array.isArray(fields))throw new Error('A importação não foi confirmada.');
    $('chamada-resumo-acervo').value=result.resumo||'';definirCapaAcervo(draft.registro.acervo.capa,draft.id);savedOptions=JSON.stringify(options());resetPlan();dirty=false;if(!$('editor-acervo').open)$('editor-acervo').showModal();render();message('Rascunho salvo. Clique em um texto da reportagem para começar.');
  });
}
$('listar-acervo').addEventListener('click',()=>authorized(async(credential,version)=>{
  const result=await call('/acervo/catalogo',credential);if(version!==epoch)return;
  $('catalogo-acervo').replaceChildren();
  for(const item of result){if(!paths.includes(item.path))continue;const li=document.createElement('li'),title=document.createElement('strong'),link=document.createElement('a'),button=document.createElement('button');title.textContent=item.titulo;link.href='https://fabcampo.com.br/'+item.path;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Ver página original';button.type='button';button.textContent='Editar reportagem';button.addEventListener('click',()=>open(item.path));li.append(title,document.createElement('br'),link,button);$('catalogo-acervo').append(li);}
  $('estado-acervo').textContent='Acervo encontrado. A importação preserva a página inteira e cria um rascunho privado.';
}));
document.addEventListener('editorial-open-acervo',event=>open(event.detail?.path));
$('fechar-acervo').addEventListener('click',()=>{if(!writing)$('editor-acervo').close();});
$('editor-acervo').addEventListener('cancel',event=>{if(writing)event.preventDefault();});
$('salvar-acervo').addEventListener('click',()=>{
  if(!draft)return;let opcoes;try{opcoes=options();}catch(error){message(error.message);return;}const input={id:draft.id,revisao:draft.revisao,path:draft.registro.acervo.path,edicoes:edits(),...opcoes},snapshot=JSON.stringify(edits()),optionSnapshot=JSON.stringify(opcoes);
  authorized(async(credential,version)=>{
    const result=await call('/acervo/salvar',credential,input);if(version!==epoch)return;
    if(result.id!==draft.id||result.revisao!==input.revisao+1)throw new Error('Revisão salva não confirmada.');
    draft=result;savedFields=input.edicoes.map(edit=>edit.texto);savedOptions=optionSnapshot;dirty=hasChanges();resetPlan();updateSummary();document.dispatchEvent(new Event('editorial-publication-changed'));message('Rascunho salvo — revisão '+draft.revisao+'. '+(dirty?'Há alterações posteriores ainda não salvas.':'Nenhuma alteração foi publicada.'));
  },{text:'Salvando a revisão no painel. Aguarde a confirmação; o conteúdo aberto foi preservado.',write:true});
});
$('previa-acervo').addEventListener('click',()=>{hiddenMarks=!hiddenMarks;send({tipo:'acervo-marcas',ocultar:hiddenMarks});$('previa-acervo').textContent=hiddenMarks?'Mostrar marcações de edição':'Visualizar sem marcações';});
$('preparar-acervo').addEventListener('click',()=>{
  if(!draft||dirty){message('Salve os textos, o resumo e a capa antes de preparar a atualização.');return;}
  resetPlan();authorized(async(credential,version)=>{const result=await call('/preparar',credential,{id:draft.id,revisao:draft.revisao});if(version!==epoch||dirty)return;if(result.id!==draft.id||result.path!==draft.registro.acervo.path)throw new Error('Página de destino não confirmada.');plan=result;message('Atualização conferida para '+result.path+'. Revise a prévia e marque a confirmação para enviar.');},{text:'Conferindo a revisão salva e a página de destino…'});
});
$('confirmacao-acervo').addEventListener('change',refreshButtons);
$('publicar-acervo').addEventListener('click',()=>{
  if(busy||dirty||!plan?.habilitada||!$('confirmacao-acervo').checked)return;const prepared=plan;
  authorized(async(credential,version)=>{
    if(plan!==prepared||dirty)return;$('publicar-acervo').disabled=true;
    const result=await call('/confirmar',credential,{id:prepared.id,revisao:prepared.revisao,head:prepared.head,confirmacao:prepared.confirmacao,confirmado:true});if(version!==epoch)return;
    resetPlan();document.dispatchEvent(new Event('editorial-publication-changed'));message(result.status==='enviada'?'Atualização enviada. Aguarde o portal atualizar e busque a lista de matérias para conferir o estado.':'Envio não confirmado. Confira a lista antes de tentar novamente.');
  },{text:'Enviando a revisão para publicação. Aguarde a confirmação; não feche esta página.',write:true});
});
document.addEventListener('editorial-access-cleared',()=>{epoch++;draft=null;fields=[];dirty=false;clearBackup();resetPlan();$('editor-acervo').close();$('texto-selecionado-acervo').value='';$('campos-acervo').hidden=true;$('catalogo-acervo').replaceChildren();$('previa-acervo-frame').srcdoc='';});
