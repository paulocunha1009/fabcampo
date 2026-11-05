export function iniciarMenu() {
  const botao = document.querySelector('.botao-menu');
  const menu = document.querySelector('#menu-principal');

  if (!botao || !menu) return;
  if(menu.dataset.preparado === 'true') return;
  menu.dataset.preparado = 'true';
  menu.querySelectorAll('.menu__botao-submenu').forEach((controle, indice) => {
    const submenu = controle.closest('.menu__grupo')?.querySelector('.submenu');
    if(!submenu) return;
    if(!submenu.id) submenu.id = `submenu-principal-${indice+1}`;
    controle.setAttribute('aria-controls', submenu.id);
  });
  fecharSubmenus(menu);
  marcarPaginaAtual(menu);

  const fecharMenu = (devolverFoco = false) => {
    botao.setAttribute('aria-expanded', 'false');
    menu.dataset.open = 'false';
    document.body.classList.remove('menu-aberto');
    fecharSubmenus(menu);
    if(devolverFoco) botao.focus();
  };

  botao.addEventListener('click', () => {
    const aberto = botao.getAttribute('aria-expanded') === 'true';
    if(aberto){ fecharMenu(); return; }
    botao.setAttribute('aria-expanded', String(!aberto));
    menu.dataset.open = String(!aberto);
    document.body.classList.toggle('menu-aberto', !aberto);
  });

  menu.addEventListener('click', (evento) => {
    const botaoSubmenu = evento.target.closest('.menu__botao-submenu');

    if (botaoSubmenu) {
      const aberto = botaoSubmenu.getAttribute('aria-expanded') === 'true';
      fecharSubmenus(menu);
      botaoSubmenu.setAttribute('aria-expanded', String(!aberto));
      botaoSubmenu.closest('.menu__grupo')?.classList.toggle('menu__grupo--aberto', !aberto);
      const submenu = botaoSubmenu.closest('.menu__grupo')?.querySelector('.submenu');
      if(submenu) submenu.hidden = aberto;
      return;
    }

    if (evento.target.closest('a')) fecharMenu();
  });

  window.addEventListener('keydown', (evento) => {
    const foco = document.activeElement;
    if(evento.key !== 'Escape' || (!menu.contains(foco) && foco !== botao)) return;
    const controle = foco.closest('.menu__grupo')?.querySelector('.menu__botao-submenu');
    if(controle?.getAttribute('aria-expanded') === 'true'){
      evento.preventDefault(); fecharSubmenus(menu); controle.focus();
    }else if(botao.getAttribute('aria-expanded') === 'true'){
      evento.preventDefault(); fecharMenu(true);
    }
  });

  menu.addEventListener('focusout', (evento) => {
    const grupo = evento.target.closest('.menu__grupo');
    if(grupo && !grupo.contains(evento.relatedTarget)) fecharSubmenus(menu);
    if(!menu.contains(evento.relatedTarget) && evento.relatedTarget !== botao) fecharMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1180) {
      const foco = document.activeElement;
      const controle = menu.contains(foco) ? foco.closest('.menu__grupo')?.querySelector('.menu__botao-submenu') : null;
      const expandido = controle?.getAttribute('aria-expanded') === 'true';
      fecharMenu();
      if(expandido) controle.focus();
    }
  });
}

function fecharSubmenus(menu) {
  menu.querySelectorAll('.menu__botao-submenu').forEach((botao) => {
    botao.setAttribute('aria-expanded', 'false');
  });

  menu.querySelectorAll('.menu__grupo--aberto').forEach((grupo) => {
    grupo.classList.remove('menu__grupo--aberto');
  });
  menu.querySelectorAll('.submenu').forEach(submenu => { submenu.hidden = true; });
}

function marcarPaginaAtual(menu) {
  const caminhoAtual = normalizarCaminho(window.location.pathname);
  const pageAtual = document.body.dataset.page;

  menu.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href');
    const pageLink = link.dataset.pageLink;
    const correspondePage = pageAtual && pageLink === pageAtual;
    const correspondeHref = href && caminhoAtual.endsWith(normalizarCaminho(href));

    if (correspondePage || correspondeHref) {
      link.setAttribute('aria-current', 'page');
      link.closest('.menu__grupo')?.classList.add('menu__grupo--ativo');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function normalizarCaminho(caminho) {
  return decodeURIComponent(caminho)
    .replaceAll('\\', '/')
    .replace('../', '')
    .replace('./', '')
    .toLowerCase();
}
