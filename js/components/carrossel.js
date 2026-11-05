export function iniciarCarrosseis() {
  document.querySelectorAll('[data-carousel] .rolo-fotos__trilha').forEach((trilha, indice) => {
    if (trilha.dataset.preparado === 'true') return;
    const galeria = trilha.closest('[data-carousel]');
    if(!galeria) return;
    const fotos = Array.from(trilha.children);
    fotos.forEach((foto) => {
      const copia = foto.cloneNode(true);
      copia.classList.add('rolo-fotos__copia');
      copia.setAttribute('aria-hidden', 'true');
      copia.setAttribute('inert', '');
      copia.removeAttribute('id');
      copia.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      trilha.appendChild(copia);
    });
    trilha.dataset.preparado = 'true';
    if(!galeria.id) galeria.id = `galeria-fotos-${indice+1}`;
    galeria.setAttribute('role', 'region');
    galeria.setAttribute('tabindex', '0');
    if(!galeria.getAttribute('aria-label')) galeria.setAttribute('aria-label', 'Galeria de fotos');

    const controles = document.createElement('div');
    controles.className = 'rolo-fotos__controles';
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'rolo-fotos__movimento';
    botao.setAttribute('aria-controls', galeria.id);
    const aviso = document.createElement('span');
    aviso.id = `${galeria.id}-aviso`;
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    galeria.setAttribute('aria-describedby', aviso.id);
    controles.appendChild(botao); controles.appendChild(aviso);
    galeria.before(controles);

    const preferencia = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let manual = false;
    let reduzido = Boolean(preferencia?.matches);
    const atualizar = () => {
      const parado = manual || reduzido;
      galeria.dataset.pausado = String(parado);
      botao.setAttribute('aria-pressed', String(parado));
      botao.disabled = reduzido;
      botao.textContent = reduzido ? 'Fotos sem movimento (preferência do sistema)' : 'Ver fotos sem movimento';
      aviso.textContent = parado
        ? 'Galeria sem movimento. Use a barra de rolagem ou as setas do teclado com foco nas fotos para percorrer a galeria.'
        : 'Galeria com movimento automático. Ative o botão para ver as fotos sem movimento.';
    };
    atualizar();
    botao.addEventListener('click', () => { manual = !manual; atualizar(); });
    galeria.addEventListener('focus', () => { manual = true; atualizar(); });
    preferencia?.addEventListener?.('change', evento => { reduzido = evento.matches; atualizar(); });
  });
}
