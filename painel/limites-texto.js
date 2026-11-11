const campos = ['titulo', 'subtitulo', 'resumo', 'texto'];
function atualizarContadores() {
  for (const id of campos) {
    const campo = document.getElementById(id);
    const contador = document.getElementById('limite-' + id);
    if (!campo || !contador) continue;
    const total = campo.value.length, limite = campo.maxLength;
    contador.textContent = `${total.toLocaleString('pt-BR')} de ${limite.toLocaleString('pt-BR')} caracteres, incluindo espaços.${total >= limite ? (total > limite ? ' Acima do limite: revise o texto.' : ' Limite atingido.') : ''}`;
    contador.dataset.estado = total >= limite ? 'limite' : 'normal';
    const descricoes = new Set((campo.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
    descricoes.add(contador.id);
    campo.setAttribute('aria-describedby', [...descricoes].join(' '));
  }
}
const formulario = document.getElementById('editorial-form');
for (const evento of ['input', 'change', 'submit']) formulario.addEventListener(evento, () => queueMicrotask(atualizarContadores));
for (const evento of ['editorial-record-loaded', 'editorial-cards-updated']) document.addEventListener(evento, () => queueMicrotask(atualizarContadores));
atualizarContadores();
