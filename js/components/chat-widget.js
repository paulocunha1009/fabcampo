/**
 * Assistente Educacional — Widget de Chat
 * Portal da Comunidade · EEMPC Francisco Araújo Barros · Ceará Científico 2026
 *
 * Modos:
 *   💬 Chat      — dúvidas livres
 *   🧠 Quiz      — quizzes interativos por tema
 *   🔍 Explorar  — recomendações de páginas
 */

import { perguntarAssistente } from '../services/ai-service.js';

// ── Estado global ────────────────────────────────────────────────────────────
let historico    = [];   // [{ role: 'user'|'assistant', content: string }]
let modoAtivo    = 'chat';
let aguardando   = false;

function escaparHTML(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

function urlInternaSegura(valor) {
  try {
    const url = new URL(String(valor || ''), window.location.href);
    return url.origin === window.location.origin && /\.html$/i.test(url.pathname)
      ? url.href
      : window.location.href;
  } catch {
    return window.location.href;
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
export function iniciarChatEducacional() {
  if (document.querySelector('.ai-chat')) return;

  const chat = criarElemento();
  document.body.appendChild(chat);
  vincularEventos(chat);
}

// ── HTML do widget ───────────────────────────────────────────────────────────
function criarElemento() {
  const secao = document.createElement('section');
  secao.className = 'ai-chat';
  secao.dataset.open = 'false';
  secao.setAttribute('aria-label', 'Assistente educacional com IA');

  secao.innerHTML = `
    <!-- Botão flutuante -->
    <button class="ai-chat__toggle" type="button"
            aria-label="Abrir assistente educacional" aria-expanded="false" aria-controls="ai-chat-painel">
      <span aria-hidden="true">🤖</span>
      <span>Assistente IA</span>
    </button>

    <!-- Painel principal -->
    <div class="ai-chat__painel" id="ai-chat-painel"
         role="dialog" aria-labelledby="ai-chat-titulo" aria-modal="true">

      <!-- Cabeçalho -->
      <div class="ai-chat__cabecalho">
        <div>
          <strong id="ai-chat-titulo">Assistente Educacional</strong>
          <small>Portal da Comunidade · Ceará Científico</small>
        </div>
        <button class="ai-chat__fechar" type="button" aria-label="Fechar assistente">✕</button>
      </div>

      <!-- Abas de modo -->
      <div class="ai-chat__tabs" role="tablist" aria-label="Modos do assistente">
        <button class="ai-chat__tab ai-chat__tab--ativo" type="button"
                data-modo="chat" role="tab" aria-selected="true">💬 Chat</button>
        <button class="ai-chat__tab" type="button"
                data-modo="quiz" role="tab" aria-selected="false">🧠 Quiz</button>
        <button class="ai-chat__tab" type="button"
                data-modo="explorar" role="tab" aria-selected="false">🔍 Explorar</button>
      </div>

      <!-- Tópicos rápidos de quiz (visível só no modo quiz) -->
      <div class="ai-topicos" data-topicos style="display:none;"
           aria-label="Temas de quiz rápido">
        <button class="ai-topico" type="button" data-tema="a história do assentamento e Reforma Agrária">História</button>
        <button class="ai-topico" type="button" data-tema="plantas medicinais da Caatinga">Medicinais</button>
        <button class="ai-topico" type="button" data-tema="produção agrícola e práticas sustentáveis">Agrícola</button>
        <button class="ai-topico" type="button" data-tema="educação do campo, místicas e alternância">Educação</button>
        <button class="ai-topico" type="button" data-tema="plantas nativas da Caatinga e Restinga">Nativas</button>
      </div>

      <!-- Área de mensagens -->
      <div class="ai-chat__mensagens" id="ai-chat-msgs"
           aria-live="polite" aria-label="Conversa com o assistente">
        <div class="ai-msg ai-msg--bot">
          Olá! Sou o assistente educacional do Portal da Comunidade.<br>
          Posso responder dúvidas, gerar quizzes e recomendar páginas. 🌱<br>
          <small style="color:var(--cor-texto-suave);font-size:0.75rem;">
            Use as abas acima para mudar de modo.
          </small>
        </div>
      </div>

      <!-- Formulário de entrada -->
      <form class="ai-chat__form" aria-label="Enviar mensagem para o assistente">
        <label class="oculto" for="ai-chat-pergunta">Digite sua mensagem</label>
        <input id="ai-chat-pergunta" name="pergunta" type="text"
               autocomplete="off" placeholder="Digite sua dúvida..." required>
        <button class="botao" type="submit" aria-label="Enviar mensagem">↑</button>
      </form>
      <p class="ai-chat__privacidade">Não informe nome, endereço, telefone ou outros dados pessoais. As conversas não são armazenadas pelo portal.</p>
    </div>
  `;

  return secao;
}

// ── Eventos ──────────────────────────────────────────────────────────────────
function vincularEventos(chat) {
  const toggle    = chat.querySelector('.ai-chat__toggle');
  const fechar    = chat.querySelector('.ai-chat__fechar');
  const tabs      = chat.querySelectorAll('.ai-chat__tab');
  const topicos   = chat.querySelectorAll('.ai-topico');
  const areaTop   = chat.querySelector('[data-topicos]');
  const mensagens = chat.querySelector('.ai-chat__mensagens');
  const formulario= chat.querySelector('.ai-chat__form');
  const campo     = chat.querySelector('#ai-chat-pergunta');

  // Abrir / fechar painel
  toggle.addEventListener('click', () => alternarPainel(chat, campo));
  fechar.addEventListener('click', () => fecharPainel(chat));

  // Fechar com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && chat.dataset.open === 'true') fecharPainel(chat);
  });

  // Trocar de aba
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modoAtivo = tab.dataset.modo;
      tabs.forEach(t => {
        t.classList.toggle('ai-chat__tab--ativo', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });

      areaTop.style.display  = modoAtivo === 'quiz'     ? 'flex'  : 'none';
      campo.placeholder      = modoAtivo === 'quiz'     ? 'Ex: quiz sobre plantas medicinais...'
                             : modoAtivo === 'explorar' ? 'Ex: onde leio sobre a história?'
                             :                            'Digite sua dúvida...';
      campo.focus();
    });
  });

  // Tópicos rápidos (quiz)
  topicos.forEach(t => {
    t.addEventListener('click', () => {
      const tema = t.dataset.tema;
      enviar(`Gere 4 perguntas de quiz sobre ${tema}`, mensagens, campo, `Quiz: ${t.textContent}`);
    });
  });

  // Envio do formulário
  formulario.addEventListener('submit', async e => {
    e.preventDefault();
    const texto = campo.value.trim();
    if (!texto) return;
    campo.value = '';

    let mensagemReal = texto;
    if (modoAtivo === 'quiz' && !texto.toLowerCase().includes('quiz') && !texto.toLowerCase().includes('pergunta')) {
      mensagemReal = `Gere 3 perguntas de quiz sobre: ${texto}`;
    } else if (modoAtivo === 'explorar') {
      mensagemReal = `Recomende páginas do portal sobre: ${texto}`;
    }

    await enviar(mensagemReal, mensagens, campo, texto);
  });
}

// ── Envio de mensagem ────────────────────────────────────────────────────────
async function enviar(mensagemReal, container, campo, textoExibido) {
  if (aguardando) return;
  aguardando = true;

  // Exibe mensagem do usuário
  adicionarMensagem(container, textoExibido || mensagemReal, 'user');

  // Indicador de digitação
  const typing = mostrarTyping(container);

  try {
    const resposta = await perguntarAssistente(mensagemReal, historico);
    historico.push({ role: 'user', content: mensagemReal });

    container.removeChild(typing);

    if (resposta.type === 'quiz') {
      renderizarQuiz(container, resposta);
      historico.push({ role: 'assistant', content: `[Quiz sobre "${resposta.topic}" gerado com ${resposta.questions?.length} questões]` });
    } else if (resposta.type === 'recommendations') {
      renderizarRecomendacoes(container, resposta);
      historico.push({ role: 'assistant', content: resposta.content || '[Recomendações de páginas]' });
    } else {
      const texto = resposta.content || String(resposta);
      adicionarMensagem(container, texto, 'bot');
      historico.push({ role: 'assistant', content: texto });
    }

    // Limita o histórico para não crescer indefinidamente
    if (historico.length > 30) historico = historico.slice(-30);

  } catch (erro) {
    container.removeChild(typing);
    adicionarMensagem(container, `⚠️ ${erro.message || 'Não consegui responder. Verifique se o backend está rodando.'}`, 'bot');
  }

  aguardando = false;
}

// ── Renderizadores ───────────────────────────────────────────────────────────

/** Mensagem simples de texto */
function adicionarMensagem(container, texto, tipo) {
  const el = document.createElement('div');
  el.className = `ai-msg ai-msg--${tipo}`;
  el.textContent = texto;
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

/** Indicador de "digitando..." */
function mostrarTyping(container) {
  const el = document.createElement('div');
  el.className = 'ai-typing';
  el.setAttribute('aria-label', 'Assistente digitando');
  el.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
  return el;
}

/** Quiz interativo com questões clicáveis */
function renderizarQuiz(container, quiz) {
  if (!quiz.questions?.length) {
    adicionarMensagem(container, 'Não consegui gerar o quiz. Tente novamente.', 'bot');
    return;
  }

  const total      = quiz.questions.length;
  let  respondidas = 0;
  let  acertos     = 0;

  // Cabeçalho do quiz
  const cabecalho = document.createElement('div');
  cabecalho.className = 'ai-msg ai-msg--bot ai-quiz__cabecalho';
  cabecalho.innerHTML = `<strong>🧠 Quiz: ${escaparHTML(quiz.topic || 'Conhecimentos do Portal')}</strong><br>
    <small style="color:var(--cor-texto-suave)">${total} ${total === 1 ? 'questão' : 'questões'} — clique na resposta correta</small>`;
  container.appendChild(cabecalho);

  // Cards de questões
  quiz.questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'ai-quiz__card';

    card.innerHTML = `
      <p class="ai-quiz__numero">Questão ${idx + 1} de ${total}</p>
      <p class="ai-quiz__pergunta">${escaparHTML(q.q)}</p>
      <div class="ai-quiz__opcoes">
        ${(q.opts || []).map((opt, i) =>
          `<button class="ai-quiz__opcao" type="button" data-i="${i}">${escaparHTML(opt)}</button>`
        ).join('')}
      </div>
      <p class="ai-quiz__explicacao">💡 ${escaparHTML(q.explanation || '')}</p>
    `;

    const botoes     = card.querySelectorAll('.ai-quiz__opcao');
    const explicacao = card.querySelector('.ai-quiz__explicacao');

    botoes.forEach(btn => {
      btn.addEventListener('click', () => {
        const escolha = parseInt(btn.dataset.i, 10);
        const correta = q.correct ?? 0;

        // Bloqueia e colore
        botoes.forEach(b => {
          b.disabled = true;
          const i = parseInt(b.dataset.i, 10);
          if (i === correta)           b.classList.add('ai-quiz__opcao--correta');
          else if (b === btn)          b.classList.add('ai-quiz__opcao--errada');
        });

        explicacao.classList.add('ai-quiz__explicacao--visivel');
        if (escolha === correta) acertos++;
        respondidas++;

        // Placar final
        if (respondidas === total) {
          const placar = document.createElement('div');
          placar.className = 'ai-quiz__score';
          const emoji = acertos === total ? '🎉' : acertos >= Math.ceil(total / 2) ? '👍' : '📚';
          placar.innerHTML = `${emoji} Você acertou <strong>${acertos}</strong> de <strong>${total}</strong>!
            ${acertos < total ? '<br><small>Revise as explicações acima e tente novamente.</small>' : '<br><small>Excelente! Você domina o conteúdo!</small>'}`;
          container.appendChild(placar);
          container.scrollTop = container.scrollHeight;
        }
      });
    });

    container.appendChild(card);
  });

  container.scrollTop = container.scrollHeight;
}

/** Cards clicáveis de recomendação de páginas */
function renderizarRecomendacoes(container, rec) {
  const wrapper = document.createElement('div');
  wrapper.className = 'ai-msg ai-msg--bot ai-recomendacoes';

  if (rec.content) {
    const intro = document.createElement('p');
    intro.style.cssText = 'margin:0 0 8px;font-size:0.85rem;line-height:1.5;';
    intro.textContent = rec.content;
    wrapper.appendChild(intro);
  }

  (rec.pages || []).forEach(page => {
    const a = document.createElement('a');
    a.className = 'ai-rec-card';
    a.href      = urlInternaSegura(page.url);

    // Ajusta o caminho relativo conforme a página atual
    const emPastaPages = window.location.pathname.includes('/pages/');
    if (!emPastaPages && !page.url.startsWith('../') && page.url.startsWith('pages/')) {
      a.href = urlInternaSegura(page.url);
    } else if (emPastaPages && !page.url.startsWith('../') && !page.url.startsWith('http')) {
      a.href = urlInternaSegura(page.url.replace(/^pages\//, ''));
    }

    a.innerHTML = `
      <span class="ai-rec-card__titulo">📄 ${escaparHTML(page.title)}</span>
      <span class="ai-rec-card__motivo">${escaparHTML(page.reason)}</span>
    `;
    wrapper.appendChild(a);
  });

  container.appendChild(wrapper);
  container.scrollTop = container.scrollHeight;
}

// ── Helpers do painel ────────────────────────────────────────────────────────
function alternarPainel(chat, campo) {
  const aberto = chat.dataset.open === 'true';
  chat.dataset.open = String(!aberto);
  chat.querySelector('.ai-chat__toggle').setAttribute('aria-expanded', String(!aberto));
  if (!aberto) campo.focus();
}

function fecharPainel(chat) {
  chat.dataset.open = 'false';
  chat.querySelector('.ai-chat__toggle').setAttribute('aria-expanded', 'false');
}
