export function iniciarAltoContraste(){
  const principal = document.querySelector('main');
  if(!principal || document.getElementById('alternar-contraste')) return;

  const estilo = document.createElement('link');
  estilo.rel = 'stylesheet';
  estilo.href = new URL('../../css/alto-contraste.css?v=20261105-1', import.meta.url).href;
  document.head.appendChild(estilo);

  const barra = document.createElement('div');
  barra.className = 'acessibilidade container';
  const botao = document.createElement('button');
  botao.type = 'button';
  botao.id = 'alternar-contraste';
  botao.className = 'acessibilidade__contraste';
  botao.textContent = 'Alto contraste';
  const aviso = document.createElement('span');
  aviso.className = 'sr-only';
  aviso.setAttribute('role', 'status');
  aviso.setAttribute('aria-live', 'polite');
  barra.appendChild(botao);
  barra.appendChild(aviso);
  principal.before(barra);

  const preferencia = window.matchMedia ? window.matchMedia('(prefers-contrast: more)') : null;
  let manual = false;
  function aplicar(ativo, anunciar){
    document.documentElement.toggleAttribute('data-alto-contraste', ativo);
    botao.setAttribute('aria-pressed', String(ativo));
    botao.title = ativo ? 'Desativar alto contraste nesta página' : 'Ativar alto contraste nesta página';
    if(anunciar) aviso.textContent = ativo ? 'Alto contraste ativado nesta página.' : 'Alto contraste desativado nesta página.';
  }
  aplicar(Boolean(preferencia?.matches), false);
  botao.addEventListener('click', function(){
    manual = true;
    aplicar(botao.getAttribute('aria-pressed') !== 'true', true);
  });
  preferencia?.addEventListener?.('change', function(event){
    if(!manual) aplicar(event.matches, true);
  });
}
