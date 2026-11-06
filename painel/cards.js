import { requestAuthorizedAction } from './login.js';
import { EDITORIAL_API } from './auth-config.js';
const $ = id => document.getElementById(id);
let suggestions, pending;
const source = () => JSON.stringify({ titulo:$('titulo').value, texto:$('texto').value });
function reset() { pending?.abort(); suggestions = null; $('sugestoes-ia').hidden = true; }
function editCards() {
  const holder = $('editar-cards'); holder.replaceChildren();
  const cards = JSON.parse($('cards').value || '[]');
  cards.forEach((card, index) => {
    const label = document.createElement('label'); label.textContent = 'Card '+(index+1)+' — título';
    const title = document.createElement('input'); title.value = card.titulo; title.maxLength = 90; label.append(title);
    const textLabel = document.createElement('label'); textLabel.textContent = 'Texto do card '+(index+1);
    const text = document.createElement('textarea'); text.value = card.texto; text.maxLength = 500; textLabel.append(text);
    const update = () => { cards[index] = { titulo:title.value, texto:text.value }; $('cards').value = JSON.stringify(cards); };
    title.addEventListener('input',update); text.addEventListener('input',update);
    holder.append(label,textLabel);
  });
}
$('sugerir-cards').addEventListener('click', () => {
  if(pending) return;
  const original = source();
  if($('texto').value.trim().length < 80) { $('estado-cards').textContent = 'Escreva pelo menos 80 caracteres de reportagem antes de pedir sugestões.'; return; }
  $('estado-cards').textContent = 'Confirme sua conta no botão Google para preparar os cards.';
  requestAuthorizedAction(async credential => {
    if(original !== source()) { $('estado-cards').textContent = 'O texto mudou. Solicite as sugestões novamente.'; return; }
    const controller = new AbortController(); pending = controller;
    const timer = setTimeout(()=>controller.abort(),25000);
    $('sugerir-cards').disabled = true;
    $('estado-cards').textContent = 'Preparando sugestões com o texto da reportagem...';
    try {
      const response = await fetch(EDITORIAL_API.replace(/\/me$/, '/cards'), { method:'POST',
        headers:{ Authorization:`Bearer ${credential}`, 'Content-Type':'application/json' },
        body:original, credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal });
      if(!response.ok) throw new Error();
      const value = await response.json();
      if(controller.signal.aborted || original !== source()) return;
      if(value.requiresReview !== true || typeof value.resumo !== 'string' || !Array.isArray(value.cards) || value.cards.length > 3 ||
        value.cards.some(card => typeof card.titulo !== 'string' || typeof card.texto !== 'string')) throw new Error();
      suggestions = { ...value, original };
      const holder = $('sugestoes-conteudo'); holder.replaceChildren();
      const summary = document.createElement('p'); summary.textContent = 'Resumo sugerido: '+value.resumo; holder.append(summary);
      value.cards.forEach(card => { const h = document.createElement('h4'); h.textContent = card.titulo; const p = document.createElement('p'); p.textContent = card.texto; holder.append(h,p); });
      $('sugestoes-ia').hidden = false;
      $('estado-cards').textContent = 'Confira as sugestões. O texto e os cards do rascunho ainda não foram alterados.';
    } catch { if(!controller.signal.aborted) $('estado-cards').textContent = 'Não foi possível preparar sugestões. O conteúdo original foi preservado.'; }
    finally { clearTimeout(timer); pending = null; $('sugerir-cards').disabled = false; }
  });
});
$('aplicar-sugestoes').addEventListener('click', () => {
  if(!suggestions || suggestions.original !== source()) { reset(); $('estado-cards').textContent = 'O texto mudou. Solicite novas sugestões.'; return; }
  $('resumo').value = suggestions.resumo;
  $('cards').value = JSON.stringify(suggestions.cards);
  editCards(); $('cards').dispatchEvent(new Event('input',{bubbles:true}));
  reset(); $('estado-cards').textContent = 'Sugestões aplicadas somente ao rascunho. Revise os textos dos cards e guarde para conferir a prévia.';
});
$('descartar-sugestoes').addEventListener('click', reset);
document.addEventListener('editorial-record-loaded', () => { reset(); editCards(); });
document.addEventListener('editorial-access-cleared', reset);
window.addEventListener('pagehide', reset);
