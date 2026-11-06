const $ = id => document.getElementById(id);
const steps = ['conteudo','midias','revisao'];
let current = 0;
function summary() {
  const news = document.querySelector('[data-tipo][aria-pressed="true"]').dataset.tipo === 'noticias';
  $('revisao-titulo').textContent = $(news ? 'titulo':'nome').value.trim() || 'Título ainda não informado';
  let photos = []; try { photos = JSON.parse($('fotos').value || '[]'); } catch {}
  $('revisao-fotos').textContent = news ? (photos.length ? `${photos.length} de 10 fotos · ${photos.some(photo=>photo.capa) ? 'capa escolhida':'escolha uma capa'}`:'Nenhuma foto adicionada') : ($('imagem').value ? 'Imagem registrada':'Sem imagem');
  $('revisao-video').textContent = news && $('video').value.trim() ? 'Link adicionado · conferir na prévia':'Sem vídeo';
}
function show(step, focus = true) {
  current = steps.indexOf(step);
  if(current < 0) current = 0;
  document.querySelectorAll('[data-etapa]').forEach(section=>{section.hidden=section.dataset.etapa!==steps[current];});
  document.querySelectorAll('[data-abrir-etapa]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.abrirEtapa===steps[current]));});
  $('etapa-anterior').hidden=current===0;
  $('proxima-etapa').hidden=current===2;
  $('proxima-etapa').textContent=current===0 ? 'Continuar para fotos':'Continuar para revisão';
  $('guardar-rascunho').classList.toggle('botao-secundario',current!==2);
  $('guardar-rascunho').textContent=current===2 ? 'Guardar e conferir rascunho':'Guardar e atualizar prévia';
  summary();
  if(focus) document.querySelector(`[data-etapa="${steps[current]}"]>h3`).focus();
}
document.querySelectorAll('[data-abrir-etapa]').forEach(button=>button.addEventListener('click',()=>show(button.dataset.abrirEtapa)));
$('etapa-anterior').addEventListener('click',()=>show(steps[current-1]));
$('proxima-etapa').addEventListener('click',()=>show(steps[current+1]));
$('ver-previa').addEventListener('click',()=>{$('titulo-previa').focus();$('titulo-previa').scrollIntoView({block:'start'});});
document.addEventListener('editorial-field-error',event=>{
  const target = event.detail;
  const section=target.closest('[data-etapa]');
  if(section) show(section.dataset.etapa,false);
  let details=target.closest('details');
  while(details){details.open=true;details=details.parentElement.closest('details');}
});
document.addEventListener('editorial-record-loaded',()=>{
  const news=document.querySelector('[data-tipo][aria-pressed="true"]').dataset.tipo==='noticias';
  $('titulo-edicao').textContent=news ? 'Preparar reportagem':'Preparar evento';
  $('titulo-previa').textContent=news ? 'Prévia da reportagem':'Prévia do evento';
  show('conteudo',false);
});
$('editorial-form').addEventListener('input',summary);
show('conteudo',false);
