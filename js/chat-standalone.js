/**
 * Assistente Educacional — Widget Standalone
 * Portal da Comunidade · EEMPC Francisco Araújo Barros · Ceará Científico 2026
 *
 * Script auto-contido: não usa import/export, funciona via file:// e http://
 * Inclui fallback local completo + integração com backend Node.js
 */
(function () {
  'use strict';

  // ── Configuração ────────────────────────────────────────────────────────────
  var ENDPOINT = (window.PORTAL_AI_ENDPOINT) || 'http://localhost:3001/api/assistente';

  // ── Estado ──────────────────────────────────────────────────────────────────
  var historico  = [];
  var modoAtivo  = 'chat';
  var aguardando = false;

  function escaparHTML(valor) {
    return String(valor == null ? '' : valor).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function urlInternaSegura(valor) {
    try {
      var url = new URL(String(valor || ''), window.location.href);
      return url.origin === window.location.origin && /\.html$/i.test(url.pathname)
        ? url.href
        : window.location.href;
    } catch (_) {
      return window.location.href;
    }
  }

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  function iniciar() {
    if (document.querySelector('.ai-chat')) return;
    var chat = criarElemento();
    document.body.appendChild(chat);
    vincularEventos(chat);
  }

  // ── HTML do widget ───────────────────────────────────────────────────────────
  function criarElemento() {
    var secao = document.createElement('section');
    secao.className = 'ai-chat';
    secao.dataset.open = 'false';
    secao.setAttribute('aria-label', 'Assistente educacional com IA');

    secao.innerHTML = [
      '<button class="ai-chat__toggle" type="button" aria-label="Abrir assistente educacional" aria-expanded="false" aria-controls="ai-chat-painel">',
      '  <span aria-hidden="true">🤖</span>',
      '  <span>Assistente IA</span>',
      '</button>',

      '<div class="ai-chat__painel" id="ai-chat-painel"',
      '     role="dialog" aria-labelledby="ai-chat-titulo" aria-modal="true">',

      '  <div class="ai-chat__cabecalho">',
      '    <div>',
      '      <strong id="ai-chat-titulo">Assistente Educacional</strong>',
      '      <small>Portal da Comunidade · Ceará Científico</small>',
      '    </div>',
      '    <button class="ai-chat__fechar" type="button" aria-label="Fechar assistente">✕</button>',
      '  </div>',

      '  <div class="ai-chat__tabs" role="tablist" aria-label="Modos do assistente">',
      '    <button class="ai-chat__tab ai-chat__tab--ativo" type="button" data-modo="chat" role="tab" aria-selected="true">💬 Chat</button>',
      '    <button class="ai-chat__tab" type="button" data-modo="quiz" role="tab" aria-selected="false">🧠 Quiz</button>',
      '    <button class="ai-chat__tab" type="button" data-modo="explorar" role="tab" aria-selected="false">🔍 Explorar</button>',
      '  </div>',

      '  <div class="ai-topicos" data-topicos style="display:none;" aria-label="Temas de quiz rápido">',
      '    <button class="ai-topico" type="button" data-tema="a história do assentamento e Reforma Agrária">História</button>',
      '    <button class="ai-topico" type="button" data-tema="plantas medicinais da Caatinga">Medicinais</button>',
      '    <button class="ai-topico" type="button" data-tema="produção agrícola e práticas sustentáveis">Agrícola</button>',
      '    <button class="ai-topico" type="button" data-tema="educação do campo, místicas e alternância">Educação</button>',
      '    <button class="ai-topico" type="button" data-tema="plantas nativas da Caatinga e Restinga">Nativas</button>',
      '  </div>',

      '  <div class="ai-chat__mensagens" id="ai-chat-msgs" aria-live="polite" aria-label="Conversa com o assistente">',
      '    <div class="ai-msg ai-msg--bot">',
      '      Olá! Sou o assistente educacional do Portal da Comunidade.<br>',
      '      Posso responder dúvidas, gerar quizzes e recomendar páginas. 🌱<br>',
      '      <small style="color:var(--cor-texto-suave,#6b7280);font-size:0.75rem;">',
      '        Use as abas acima para mudar de modo.',
      '      </small>',
      '    </div>',
      '  </div>',

      '  <form class="ai-chat__form" aria-label="Enviar mensagem para o assistente">',
      '    <label class="oculto" for="ai-chat-pergunta">Digite sua mensagem</label>',
      '    <input id="ai-chat-pergunta" name="pergunta" type="text"',
      '           autocomplete="off" placeholder="Digite sua dúvida..." required>',
      '    <button class="botao" type="submit" aria-label="Enviar mensagem">↑</button>',
      '  </form>',
      '  <p class="ai-chat__privacidade">Não informe nome, endereço, telefone ou outros dados pessoais. As conversas não são armazenadas pelo portal.</p>',
      '</div>'
    ].join('\n');

    return secao;
  }

  // ── Eventos ──────────────────────────────────────────────────────────────────
  function vincularEventos(chat) {
    var toggle    = chat.querySelector('.ai-chat__toggle');
    var fechar    = chat.querySelector('.ai-chat__fechar');
    var tabs      = chat.querySelectorAll('.ai-chat__tab');
    var topicos   = chat.querySelectorAll('.ai-topico');
    var areaTop   = chat.querySelector('[data-topicos]');
    var mensagens = chat.querySelector('.ai-chat__mensagens');
    var formulario= chat.querySelector('.ai-chat__form');
    var campo     = chat.querySelector('#ai-chat-pergunta');

    toggle.addEventListener('click', function () { alternarPainel(chat, campo); });
    fechar.addEventListener('click', function () { fecharPainel(chat); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && chat.dataset.open === 'true') fecharPainel(chat);
    });

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        modoAtivo = tab.dataset.modo;
        tabs.forEach(function (t) {
          t.classList.toggle('ai-chat__tab--ativo', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        areaTop.style.display = modoAtivo === 'quiz' ? 'flex' : 'none';
        campo.placeholder = modoAtivo === 'quiz'     ? 'Ex: quiz sobre plantas medicinais...'
                          : modoAtivo === 'explorar' ? 'Ex: onde leio sobre a história?'
                          :                            'Digite sua dúvida...';
        campo.focus();
      });
    });

    topicos.forEach(function (t) {
      t.addEventListener('click', function () {
        enviar('Gere 4 perguntas de quiz sobre ' + t.dataset.tema, mensagens, campo, 'Quiz: ' + t.textContent.trim());
      });
    });

    formulario.addEventListener('submit', function (e) {
      e.preventDefault();
      var texto = campo.value.trim();
      if (!texto) return;
      campo.value = '';

      var mensagemReal = texto;
      if (modoAtivo === 'quiz' && !texto.toLowerCase().includes('quiz') && !texto.toLowerCase().includes('pergunta')) {
        mensagemReal = 'Gere 3 perguntas de quiz sobre: ' + texto;
      } else if (modoAtivo === 'explorar') {
        mensagemReal = 'Recomende páginas do portal sobre: ' + texto;
      }

      enviar(mensagemReal, mensagens, campo, texto);
    });
  }

  // ── Envio de mensagem ────────────────────────────────────────────────────────
  function enviar(mensagemReal, container, campo, textoExibido) {
    if (aguardando) return;
    aguardando = true;

    adicionarMensagem(container, textoExibido || mensagemReal, 'user');
    var typing = mostrarTyping(container);

    perguntarAssistente(mensagemReal, historico).then(function (resposta) {
      historico.push({ role: 'user', content: mensagemReal });
      container.removeChild(typing);

      if (resposta.type === 'quiz') {
        renderizarQuiz(container, resposta);
        historico.push({ role: 'assistant', content: '[Quiz sobre "' + (resposta.topic || '') + '" gerado]' });
      } else if (resposta.type === 'recommendations') {
        renderizarRecomendacoes(container, resposta);
        historico.push({ role: 'assistant', content: resposta.content || '[Recomendações]' });
      } else {
        var texto = resposta.content || String(resposta);
        adicionarMensagem(container, texto, 'bot');
        historico.push({ role: 'assistant', content: texto });
      }

      if (historico.length > 30) historico = historico.slice(-30);
      aguardando = false;
    }).catch(function (erro) {
      container.removeChild(typing);
      adicionarMensagem(container, '⚠️ ' + (erro.message || 'Não consegui responder. Verifique se o backend está rodando.'), 'bot');
      aguardando = false;
    });
  }

  // ── Comunicação com o backend / fallback local ───────────────────────────────
  function perguntarAssistente(mensagem, hist) {
    // Se não tiver endpoint real configurado, usa fallback local imediatamente
    if (!ENDPOINT || ENDPOINT.includes('seu-backend')) {
      return Promise.resolve(respostaLocal(mensagem));
    }

    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: mensagem, history: hist })
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.error || ('Erro ' + r.status)); });
      return r.json();
    }).then(function (dados) {
      if (typeof dados.answer === 'string') return { type: 'message', content: dados.answer };
      return dados.answer || { type: 'message', content: 'Resposta não reconhecida.' };
    }).catch(function () {
      // Backend indisponível → fallback local
      return respostaLocal(mensagem);
    });
  }

  // ── Fallback local (sem backend) ─────────────────────────────────────────────
  // Chamado quando o backend não está disponível.
  // Recebe a mensagem já transformada pelo modo ativo.
  function respostaLocal(pergunta) {
    var t = pergunta.toLowerCase();

    // ── 1. MODO QUIZ ──────────────────────────────────────────────────────────
    // Detecta se é pedido de quiz (vem prefixado com "Gere" pelo modo quiz)
    var ehPedidoQuiz = t.startsWith('gere') || t.includes(' quiz ') || t.includes('quiz sobre') || t.includes('perguntas de quiz');

    if (ehPedidoQuiz) {
      if (isHistoria(t))   return quizHistoria();
      if (isMedicinais(t)) return quizMedicinais();
      if (isAgricola(t))   return quizAgricola();
      if (isEducacao(t))   return quizEducacao();
      if (isNativas(t))    return quizNativas();

      // Tema não reconhecido como conteúdo do portal
      return {
        type: 'message',
        content: '🧠 **Quiz offline disponível para 5 temas do portal:**\n\n• **História** — luta pela Reforma Agrária, mártires, 1986\n• **Plantas Medicinais** — 12 espécies da Caatinga\n• **Plantas Nativas** — Caatinga, Restinga, Manguezal\n• **Produção Agrícola** — COPAGLAM, cultivos, sustentabilidade\n• **Educação do Campo** — Alternância, Místicas, EEMPC\n\nPara quizzes sobre outros assuntos (informática, matemática, etc.), inicie o backend com IA completa: abra a pasta **/backend**, rode `npm install` e `npm start`. 🚀'
      };
    }

    // ── 2. MODO EXPLORAR ──────────────────────────────────────────────────────
    // Vem prefixado com "Recomende páginas do portal sobre:"
    var ehExplorar = t.startsWith('recomende páginas');

    if (ehExplorar) {
      if (isHistoria(t))   return recHistoria();
      if (isMedicinais(t)) return recMedicinais();
      if (isNativas(t))    return recNativas();
      if (isAgricola(t))   return recAgricola();
      if (isEducacao(t))   return recEducacao();
      if (t.includes('memória') || t.includes('depoimento') || t.includes('morador')) return recMemoria();
      if (t.includes('contato') || t.includes('contribu'))  return recContato();
      if (t.includes('clima') || t.includes('seca') || t.includes('chuva')) return recClima();

      // Tema fora do portal
      return {
        type: 'message',
        content: '🔍 **Páginas disponíveis no portal:**\n\n📜 **História** — luta pela Reforma Agrária e linha do tempo\n🌿 **Plantas Medicinais** — 12 espécies com receitas\n🌳 **Plantação Nativa** — 17 espécies da Caatinga\n🌾 **Produção Agrícola** — COPAGLAM e práticas sustentáveis\n🌡️ **Mudanças Climáticas** — pesquisa com 15 famílias\n📚 **Educação do Campo** — Alternância e Místicas\n💭 **Memória** — depoimentos e galeria\n\nSobre qual desses temas você gostaria de encontrar páginas?'
      };
    }

    // ── 3. MODO CHAT — temas do portal ────────────────────────────────────────
    if (isHistoria(t))   return recHistoria();
    if (isMedicinais(t)) return recMedicinais();
    if (isNativas(t))    return recNativas();
    if (isAgricola(t))   return recAgricola();
    if (isEducacao(t))   return recEducacao();
    if (t.includes('memória') || t.includes('depoimento') || t.includes('morador')) return recMemoria();
    if (t.includes('clima') || t.includes('seca') || t.includes('chuva') || t.includes('emergência climática')) return recClima();
    if (t.includes('contato') || t.includes('contribu') || t.includes('enviar')) return recContato();

    // ── 4. MODO CHAT — perguntas gerais (sem backend disponível) ─────────────
    return {
      type: 'message',
      content: '⏳ Estou reconectando com o assistente de IA... Tente novamente em alguns segundos!\n\n**Enquanto isso, posso te ajudar com:**\n• 📜 História do Assentamento Lagoa do Mineiro\n• 🌿 Plantas Medicinais da Caatinga\n• 🌳 Plantas Nativas (Caatinga, Restinga, Manguezal)\n• 🌾 Produção Agrícola e COPAGLAM\n• 📚 Educação do Campo e Alternância\n\nOu clique em **🔍 Explorar** para navegar pelas páginas do portal!'
    };
  }

  // ── Detecção de tema ─────────────────────────────────────────────────────────
  function isHistoria(t)   { return t.includes('histór') || t.includes('assentamento') || t.includes('reforma agrária') || t.includes('ducoco') || t.includes('mártir') || t.includes('1986') || t.includes('lagoa do mineiro') || t.includes('itarema'); }
  function isMedicinais(t) { return t.includes('medicin') || t.includes('chanana') || t.includes('pata de vaca') || t.includes('janaguba') || t.includes('alecrim') || t.includes('quebra-pedra') || t.includes('batiputá') || t.includes('mussambê') || t.includes('torém') || t.includes('bredo') || t.includes('aroeira') || t.includes('pepaconha'); }
  function isNativas(t)    { return t.includes('nativa') || t.includes('carnaúba') || t.includes('mangue') || t.includes('caatinga') || t.includes('restinga') || t.includes('manguezal'); }
  function isAgricola(t)   { return t.includes('agricultur') || t.includes('plantio') || t.includes('colheita') || t.includes('copaglam') || t.includes('açude') || t.includes('milho') || t.includes('feijão') || t.includes('mandioca') || t.includes('caju') || t.includes('sustentáv'); }
  function isEducacao(t)   { return t.includes('educaç') || t.includes('escola') || t.includes('alternância') || t.includes('mística') || t.includes('tempo comunidade') || t.includes('eempc') || t.includes('pedagog') || t.includes('alternancia') || t.includes('informática') || t.includes('agropecuár'); }

  // ── Respostas de recomendação ─────────────────────────────────────────────────
  function recHistoria() {
    return {
      type: 'recommendations',
      content: 'Saiba mais sobre a história do Assentamento Lagoa do Mineiro:',
      pages: [
        { title: 'História do Assentamento', url: resolverUrl('historia.html'), reason: 'Origem, mártires, Reforma Agrária e linha do tempo histórica' },
        { title: 'Educação do Campo', url: resolverUrl('reportagem-educacao.html'), reason: 'A escola que nasceu junto com a comunidade' }
      ]
    };
  }
  function recMedicinais() {
    return {
      type: 'recommendations',
      content: 'Veja as 12 plantas medicinais documentadas pela Turma Manoel Louvado:',
      pages: [{ title: 'Plantas Medicinais', url: resolverUrl('Plantas-Medicinaisv2.html'), reason: '12 espécies da Caatinga com receitas, usos e alertas de saúde' }]
    };
  }
  function recNativas() {
    return {
      type: 'recommendations',
      content: 'Conheça o inventário de espécies nativas do assentamento:',
      pages: [{ title: 'Plantação Nativa', url: resolverUrl('Plantação-Nativa.html'), reason: '17 espécies dos biomas Caatinga, Restinga e Manguezal' }]
    };
  }
  function recAgricola() {
    return {
      type: 'recommendations',
      content: 'Explore a produção agrícola sustentável do assentamento:',
      pages: [
        { title: 'Produção Agrícola', url: resolverUrl('agricola.html'), reason: 'Cultivos, COPAGLAM, Açude Corrente e práticas agroecológicas' },
        { title: 'Mudanças Climáticas', url: resolverUrl('reportagem-clima.html'), reason: 'Impacto das secas e chuvas irregulares em 15 famílias' }
      ]
    };
  }
  function recEducacao() {
    return {
      type: 'recommendations',
      content: 'Conheça a proposta pedagógica da EEMPC Francisco Araújo Barros:',
      pages: [{ title: 'Educação do Campo', url: resolverUrl('reportagem-educacao.html'), reason: 'Alternância, Místicas, Tempo Comunidade e cursos técnicos' }]
    };
  }
  function recMemoria() {
    return {
      type: 'recommendations',
      content: 'Acesse o espaço de memória e depoimentos da comunidade:',
      pages: [{ title: 'Memória', url: resolverUrl('memoria.html'), reason: 'Depoimentos, galeria fotográfica e registros culturais' }]
    };
  }
  function recClima() {
    return {
      type: 'recommendations',
      content: 'Pesquisa sobre os impactos climáticos no assentamento:',
      pages: [{ title: 'Mudanças Climáticas', url: resolverUrl('reportagem-clima.html'), reason: 'Queimadas, secas e chuvas irregulares afetando 15 famílias' }]
    };
  }
  function recContato() {
    return {
      type: 'recommendations',
      content: 'Envie sua contribuição para o portal:',
      pages: [{ title: 'Contato', url: resolverUrl('contato.html'), reason: 'Formulário para histórias, fotos, dados e sugestões' }]
    };
  }

  // ── Quizzes locais ───────────────────────────────────────────────────────────
  function quizHistoria() {
    return {
      type: 'quiz',
      topic: 'História do Assentamento',
      questions: [
        {
          q: 'Em que ano ocorreu a posse formal do Assentamento Lagoa do Mineiro?',
          opts: ['A) 1985', 'B) 1986', 'C) 1987', 'D) 1991'],
          correct: 1,
          explanation: 'A posse formal ocorreu em 19/09/1986, pelo Decreto nº 92.826. A criação oficial (Portaria 573/MIRAD) foi em 1987.'
        },
        {
          q: 'Qual empresa tentou tomar as terras do assentamento em 1985?',
          opts: ['A) COPAGLAM', 'B) INCRA', 'C) DUCOCO', 'D) Diocese de Itapipoca'],
          correct: 2,
          explanation: 'A empresa DUCOCO (produção de coco) anunciou a compra das terras em 1985, iniciando o conflito com as famílias assentadas.'
        },
        {
          q: 'Quantas famílias vivem atualmente no Assentamento Lagoa do Mineiro?',
          opts: ['A) 90 famílias', 'B) 150 famílias', 'C) 204 famílias', 'D) 214 famílias'],
          correct: 3,
          explanation: 'São 214 famílias distribuídas em 7 comunidades: Saguim, Lagoa do Mineiro, Mineiro Velho, Corrente, Barbosa, Cedro e Córrego das Moças.'
        },
        {
          q: 'O nome da escola EEMPC Francisco Araújo Barros homenageia:',
          opts: ['A) Um professor fundador', 'B) Um mártir da Reforma Agrária', 'C) O primeiro prefeito de Itarema', 'D) Um líder da COPAGLAM'],
          correct: 1,
          explanation: 'Francisco Araújo Barros foi um dos mártires assassinados durante a resistência contra a DUCOCO em 1986 — baleado e degolado durante trabalho de broca.'
        }
      ]
    };
  }

  function quizMedicinais() {
    return {
      type: 'quiz',
      topic: 'Plantas Medicinais da Caatinga',
      questions: [
        {
          q: 'Qual planta medicinal é conhecida como "A Flor da Resiliência" e tem uso para inflamações e infecções urinárias?',
          opts: ['A) Pata de Vaca', 'B) Chanana', 'C) Quebra-Pedra', 'D) Alecrim-Pimenta'],
          correct: 1,
          explanation: 'A Chanana (Turnera subulata) é chamada "A Flor da Resiliência". Seu chá é feito com flores e folhas (10g/litro, infusão 10 min). Deve ser evitada na gravidez.'
        },
        {
          q: 'Qual planta é indicada para controle do diabetes tipo 2 e controle glicêmico?',
          opts: ['A) Janaguba', 'B) Mussambê', 'C) Pata de Vaca', 'D) Torém'],
          correct: 2,
          explanation: 'A Pata de Vaca (Bauhinia forficata) é conhecida como "O Controle do Açúcar". Atenção: não substitui medicação e é preciso monitorar a glicemia.'
        },
        {
          q: 'A Janaguba (Himatanthus drasticus) é chamada de:',
          opts: ['A) A Cicatrizante Marinha', 'B) A Leiteira Sagrada', 'C) O Óleo Sagrado Tremembé', 'D) A Pequena Guerreira'],
          correct: 1,
          explanation: 'A Janaguba é "A Leiteira Sagrada" — seu látex diluído é usado com cautela, pois é tóxico em dose elevada. Tem estudos iniciais sobre propriedades anticancerígenas.'
        },
        {
          q: 'Quantas espécies de plantas medicinais foram documentadas pela Turma Manoel Louvado?',
          opts: ['A) 8 espécies', 'B) 10 espécies', 'C) 12 espécies', 'D) 17 espécies'],
          correct: 2,
          explanation: 'A Turma Manoel Louvado (2º Ano A Técnico) documentou 12 espécies medicinais nativas da Caatinga cearense para o Ceará Científico 2025.'
        }
      ]
    };
  }

  function quizAgricola() {
    return {
      type: 'quiz',
      topic: 'Produção Agrícola e COPAGLAM',
      questions: [
        {
          q: 'Em que ano foi fundada a COPAGLAM e com quantos membros?',
          opts: ['A) 1986, com 90 membros', 'B) 1991, com 204 membros', 'C) 1998, com 150 membros', 'D) 2011, com 214 membros'],
          correct: 1,
          explanation: 'A COPAGLAM foi fundada em 14/04/1991 com 204 membros fundadores, sendo a cooperativa central de organização da produção no assentamento.'
        },
        {
          q: 'Qual é a capacidade do Açude Corrente, construído em 1998?',
          opts: ['A) 150.000 m³', 'B) 500.000 m³', 'C) 731.250 m³', 'D) 1.000.000 m³'],
          correct: 2,
          explanation: 'O Açude Corrente tem capacidade de 731.250 m³ e foi construído em 1998, sendo fundamental para a irrigação e abastecimento do assentamento.'
        },
        {
          q: 'Qual porcentagem da renda das famílias vem da agricultura?',
          opts: ['A) 20%', 'B) 30%', 'C) 40%', 'D) 50%'],
          correct: 3,
          explanation: 'A agricultura representa 50% da renda familiar no assentamento. Os demais 50% vêm de Bolsa Família (20%), extrativismo (10%) e outras fontes (20%).'
        },
        {
          q: 'Qual prática sustentável NÃO é utilizada no assentamento?',
          opts: ['A) Sementes crioulas', 'B) Uso de agrotóxicos intensivos', 'C) Cobertura morta', 'D) Consórcio milho + feijão'],
          correct: 1,
          explanation: 'O assentamento usa práticas agroecológicas: sementes crioulas, cobertura morta, consórcio de culturas, adubação orgânica e plantio conforme fases da lua — sem agrotóxicos intensivos.'
        }
      ]
    };
  }

  function quizEducacao() {
    return {
      type: 'quiz',
      topic: 'Educação do Campo e Alternância',
      questions: [
        {
          q: 'Em que data foi criada a EEMPC Francisco Araújo Barros?',
          opts: ['A) 19/09/1986', 'B) 14/04/1991', 'C) 03/03/2011', 'D) 15/08/2022'],
          correct: 2,
          explanation: 'A escola foi criada pelo Decreto CE 30.493 em 03/03/2011, funcionando em regime de Educação Profissional em Tempo Integral com Pedagogia da Alternância.'
        },
        {
          q: 'A Pedagogia da Alternância divide o ano letivo entre:',
          opts: ['A) Teoria e prática', 'B) Tempo Escola (TE) e Tempo Comunidade (TC)', 'C) Ensino básico e técnico', 'D) Aula presencial e EAD'],
          correct: 1,
          explanation: 'A alternância divide-se em Tempo Escola (TE — aulas, místicas, assembleias) e Tempo Comunidade (TC — pesquisa na família, Caderno da Realidade, Plano de Estudo).'
        },
        {
          q: 'As Místicas da escola são:',
          opts: ['A) Cerimônias religiosas obrigatórias', 'B) Rituais artístico-políticos de identidade e pertencimento', 'C) Festividades do calendário regional', 'D) Aulas práticas de agricultura'],
          correct: 1,
          explanation: 'As Místicas NÃO são cerimônias religiosas — são rituais coletivos de expressão artístico-política com símbolos do campo, de origem no MST, organizadas pelas turmas em rodízio.'
        },
        {
          q: 'Quantos estudantes a EEMPC Francisco Araújo Barros tinha em 2025?',
          opts: ['A) 90 estudantes', 'B) 130 estudantes', 'C) 179 estudantes', 'D) 214 estudantes'],
          correct: 2,
          explanation: '179 estudantes matriculados em 2025, atendendo 7 comunidades do assentamento com cursos técnicos em Informática e Agropecuária.'
        }
      ]
    };
  }

  function quizNativas() {
    return {
      type: 'quiz',
      topic: 'Plantas Nativas da Caatinga',
      questions: [
        {
          q: 'A Carnaúba (Copernicia prunifera) é símbolo de qual estado?',
          opts: ['A) Piauí', 'B) Maranhão', 'C) Rio Grande do Norte', 'D) Ceará'],
          correct: 3,
          explanation: 'A Carnaúba é o símbolo do Ceará — "A Árvore da Vida". Além de medicinal, sua cera tem uso industrial e seus frutos servem como alimento e ração.'
        },
        {
          q: 'Quantas espécies nativas foram inventariadas no assentamento?',
          opts: ['A) 8 espécies', 'B) 12 espécies', 'C) 17 espécies', 'D) 24 espécies'],
          correct: 2,
          explanation: 'O inventário registrou 17 espécies nativas dos biomas Caatinga, Restinga e Manguezal nas áreas de Morro dos Patos, Patos, Mineiro Velho e entorno.'
        },
        {
          q: 'O Mangue-Vermelho (Rhizophora mangle) pertence a qual bioma presente no assentamento?',
          opts: ['A) Caatinga', 'B) Cerrado', 'C) Manguezal', 'D) Restinga'],
          correct: 2,
          explanation: 'O Mangue-Vermelho pertence ao bioma Manguezal. Sua presença no assentamento de Itarema, no litoral oeste do Ceará, reflete a diversidade de ecossistemas da região.'
        }
      ]
    };
  }

  // ── Ajuste de URL conforme a página atual ────────────────────────────────────
  function resolverUrl(pagina) {
    var emPastaPages = window.location.pathname.replace(/\\/g, '/').includes('/pages/');
    if (emPastaPages) {
      // Já estamos em /pages/ — link direto
      return pagina;
    } else {
      // Estamos na raiz — prefixar com pages/
      if (pagina === 'contato.html' || pagina === 'index.html') return pagina;
      return 'pages/' + pagina;
    }
  }

  // ── Renderizadores ───────────────────────────────────────────────────────────
  function adicionarMensagem(container, texto, tipo) {
    var el = document.createElement('div');
    el.className = 'ai-msg ai-msg--' + tipo;
    el.textContent = texto;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function mostrarTyping(container) {
    var el = document.createElement('div');
    el.className = 'ai-typing';
    el.setAttribute('aria-label', 'Assistente digitando');
    el.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function renderizarQuiz(container, quiz) {
    if (!quiz.questions || !quiz.questions.length) {
      adicionarMensagem(container, 'Não consegui gerar o quiz. Tente novamente.', 'bot');
      return;
    }

    var total      = quiz.questions.length;
    var respondidas = 0;
    var acertos     = 0;

    var cabecalho = document.createElement('div');
    cabecalho.className = 'ai-msg ai-msg--bot ai-quiz__cabecalho';
    var tituloQuiz = document.createElement('strong');
    tituloQuiz.textContent = '🧠 Quiz: ' + (quiz.topic || 'Conhecimentos do Portal');
    var ajudaQuiz = document.createElement('small');
    ajudaQuiz.textContent = total + ' ' + (total === 1 ? 'questão' : 'questões') + ' — clique na resposta correta';
    cabecalho.appendChild(tituloQuiz);
    cabecalho.appendChild(document.createElement('br'));
    cabecalho.appendChild(ajudaQuiz);
    container.appendChild(cabecalho);

    quiz.questions.forEach(function (q, idx) {
      var card = document.createElement('div');
      card.className = 'ai-quiz__card';
      card.innerHTML = '<p class="ai-quiz__numero">Questão ' + (idx + 1) + ' de ' + total + '</p>'
        + '<p class="ai-quiz__pergunta">' + escaparHTML(q.q) + '</p>'
        + '<div class="ai-quiz__opcoes">'
        + (q.opts || []).map(function (opt, i) {
            return '<button class="ai-quiz__opcao" type="button" data-i="' + i + '">' + escaparHTML(opt) + '</button>';
          }).join('')
        + '</div>'
        + '<p class="ai-quiz__explicacao">💡 ' + escaparHTML(q.explanation || '') + '</p>';

      var botoes     = card.querySelectorAll('.ai-quiz__opcao');
      var explicacao = card.querySelector('.ai-quiz__explicacao');

      botoes.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var escolha = parseInt(btn.dataset.i, 10);
          var correta = (typeof q.correct === 'number') ? q.correct : 0;

          botoes.forEach(function (b) {
            b.disabled = true;
            var i = parseInt(b.dataset.i, 10);
            if (i === correta)  b.classList.add('ai-quiz__opcao--correta');
            else if (b === btn) b.classList.add('ai-quiz__opcao--errada');
          });

          explicacao.classList.add('ai-quiz__explicacao--visivel');
          if (escolha === correta) acertos++;
          respondidas++;

          if (respondidas === total) {
            var placar = document.createElement('div');
            placar.className = 'ai-quiz__score';
            var emoji = acertos === total ? '🎉' : acertos >= Math.ceil(total / 2) ? '👍' : '📚';
            placar.innerHTML = emoji + ' Você acertou <strong>' + acertos + '</strong> de <strong>' + total + '</strong>!'
              + (acertos < total ? '<br><small>Revise as explicações e tente novamente.</small>' : '<br><small>Excelente! Você domina o conteúdo!</small>');
            container.appendChild(placar);
            container.scrollTop = container.scrollHeight;
          }
        });
      });

      container.appendChild(card);
    });

    container.scrollTop = container.scrollHeight;
  }

  function renderizarRecomendacoes(container, rec) {
    var wrapper = document.createElement('div');
    wrapper.className = 'ai-msg ai-msg--bot ai-recomendacoes';

    if (rec.content) {
      var intro = document.createElement('p');
      intro.style.cssText = 'margin:0 0 8px;font-size:0.85rem;line-height:1.5;';
      intro.textContent = rec.content;
      wrapper.appendChild(intro);
    }

    (rec.pages || []).forEach(function (page) {
      var a = document.createElement('a');
      a.className = 'ai-rec-card';
      a.href = urlInternaSegura(page.url);
      a.innerHTML = '<span class="ai-rec-card__titulo">📄 ' + escaparHTML(page.title) + '</span>'
        + '<span class="ai-rec-card__motivo">' + escaparHTML(page.reason) + '</span>';
      wrapper.appendChild(a);
    });

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  }

  // ── Helpers do painel ────────────────────────────────────────────────────────
  function alternarPainel(chat, campo) {
    var aberto = chat.dataset.open === 'true';
    chat.dataset.open = String(!aberto);
    chat.querySelector('.ai-chat__toggle').setAttribute('aria-expanded', String(!aberto));
    if (!aberto && campo) campo.focus();
  }

  function fecharPainel(chat) {
    chat.dataset.open = 'false';
    chat.querySelector('.ai-chat__toggle').setAttribute('aria-expanded', 'false');
  }

  // ── Inicia quando o DOM estiver pronto ───────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

})();
