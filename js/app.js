import { iniciarMenu } from './components/menu.js';
import { iniciarFormularioContato } from './components/formulario.js?v=20260913-1';
import { iniciarCarrosseis } from './components/carrossel.js';
import { prepararImagens } from './components/imagens.js';
import { carregarConteudo } from './components/conteudo.js';
import { iniciarChatEducacional } from './components/chat-widget.js';
import { iniciarBuscaGlobal } from './components/busca-global.js';

document.addEventListener('DOMContentLoaded', () => {
  prepararImagens();
  iniciarMenu();
  iniciarFormularioContato();
  iniciarCarrosseis();
  carregarConteudo();
  if (document.body.dataset.page !== 'expedicao') iniciarChatEducacional();
  iniciarBuscaGlobal();
  adicionarLinkPrivacidade();
  atualizarAno();
});

function atualizarAno() {
  document.querySelectorAll('[data-current-year]').forEach((elemento) => {
    elemento.textContent = String(new Date().getFullYear());
  });
}

function adicionarLinkPrivacidade() {
  const navegacao = document.querySelector('.rodape__nav');
  if (!navegacao || navegacao.querySelector('a[href$="privacidade.html"]')) return;

  const link = document.createElement('a');
  link.href = document.body.closest('html') && window.location.pathname.includes('/pages/')
    ? '../privacidade.html'
    : 'privacidade.html';
  link.textContent = 'Privacidade e uso da IA';
  navegacao.appendChild(link);
}
