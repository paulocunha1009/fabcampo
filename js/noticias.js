/**
 * Notícias do portal
 * Usa conteúdo local no GitHub Pages e atualiza pelo backend quando disponível.
 */
(function () {
  'use strict';

  var CACHE_KEY = 'portal_noticias_v3';
  var CACHE_MIN = 30;
  var BACKEND = (window.PORTAL_AI_ENDPOINT || 'http://localhost:3001/api/assistente')
    .replace('/api/assistente', '');

  var NOTICIAS_FIXAS = [
    {
      data: '2026-05-20',
      titulo: 'Campo Digital valoriza memória, território e inovação',
      resumo: 'O portal reúne história, saberes do campo, reportagens e recursos digitais criados para fortalecer a comunidade escolar.',
      categoria: 'Portal',
      icone: '📌',
      classe: 'badge--portal',
      link: 'pages/reportagem-educacao.html',
      fonte: 'Campo Digital'
    },
    {
      data: '2026-05-25',
      titulo: 'IA educacional ganha espaço como próxima etapa do projeto',
      resumo: 'A estrutura do site já prepara um assistente para apoiar pesquisas, quizzes e orientação de estudo dentro do próprio portal.',
      categoria: 'Tecnologia',
      icone: '🤖',
      classe: 'badge--tech',
      link: 'pages/materia_ia_educacao_v2.html',
      fonte: 'Campo Digital'
    },
    {
      data: '2026-06-10',
      titulo: 'Saberes locais ajudam a documentar plantas e práticas agrícolas',
      resumo: 'As páginas de agricultura, plantas nativas e plantas medicinais aproximam pesquisa escolar, cultura regional e sustentabilidade.',
      categoria: 'Agroecologia',
      icone: '🌱',
      classe: 'badge--agro',
      link: 'pages/agricola.html',
      fonte: 'Campo Digital'
    }
  ];

  // ── Utilitários ─────────────────────────────────────────────────────────────

  function formatarData(str) {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return '';
    var d = new Date(str + 'T12:00:00');
    if (isNaN(d) || d.getFullYear() !== Number(str.slice(0,4)) || d.getMonth()+1 !== Number(str.slice(5,7)) || d.getDate() !== Number(str.slice(8,10))) return '';
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function escapar(texto) {
    return String(texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizar(noticia, indice) {
    var padroes = [
      { categoria: 'Portal', icone: '📌', classe: 'badge--portal', link: 'pages/reportagem-educacao.html' },
      { categoria: 'Tecnologia', icone: '🤖', classe: 'badge--tech', link: 'pages/materia_ia_educacao_v2.html' },
      { categoria: 'Agroecologia', icone: '🌱', classe: 'badge--agro', link: 'pages/agricola.html' }
    ];
    var padrao = padroes[indice % padroes.length];

    return {
      data: noticia.data || '',
      titulo: noticia.titulo || 'Atualização do Campo Digital',
      resumo: noticia.resumo || 'Conteúdo em organização pela equipe do projeto.',
      categoria: noticia.categoria || padrao.categoria,
      icone: noticia.icone || padrao.icone,
      classe: noticia.classe || padrao.classe,
      link: typeof noticia.link === 'string' && /^(https?:\/\/|pages\/[\w%-]+\.html$)/i.test(noticia.link) ? noticia.link : padrao.link,
      fonte: noticia.fonte || 'Campo Digital'
    };
  }

  // ── Renderização ─────────────────────────────────────────────────────────────

  function informar(texto) {
    var aviso = document.querySelector('[data-noticias-status]');
    if (aviso) aviso.textContent = texto;
  }

  function renderizar(noticias) {
    var container = document.querySelector('[data-render="noticias"]');
    if (!container) return;

    if (!Array.isArray(noticias) || !noticias.length) {
      container.innerHTML =
        '<p class="noticias-erro">Notícias temporariamente indisponíveis. Tente novamente em instantes.</p>';
      return;
    }

    var lista = noticias.filter(function(n) { return n && typeof n === 'object' && !Array.isArray(n); }).map(normalizar);

    container.innerHTML = lista.map(function (n) {
      var externo = /^https?:\/\//i.test(n.link);
      var destino = externo ? ' target="_blank" rel="noopener noreferrer"' : '';
      return [
        '<article class="card-noticia">',
        '  <div class="card-noticia__meta">',
        '    <span class="card-noticia__badge ' + escapar(n.classe) + '">' + escapar(n.icone + ' ' + n.categoria) + '</span>',
        '    <span class="card-noticia__fonte">' + escapar(n.fonte) + '</span>',
        formatarData(n.data) ? '    <time datetime="' + escapar(n.data) + '">' + escapar(formatarData(n.data)) + '</time>' : '<span>Data não informada</span>',
        '  </div>',
        '  <h3 class="card-noticia__titulo">',
        '    <a href="' + escapar(n.link) + '"' + destino + '>' + escapar(n.titulo) + '</a>',
        '  </h3>',
        '  <p class="card-noticia__resumo">' + escapar(n.resumo) + '</p>',
        '</article>'
      ].join('');
    }).join('');
  }

  function renderizarSkeleton() {
    var container = document.querySelector('[data-render="noticias"]');
    if (!container) return;
    container.innerHTML = [1,2,3,4].map(function () {
      return [
        '<article class="card-noticia card-noticia--loading">',
        '  <div class="skeleton skeleton--badge"></div>',
        '  <div class="skeleton skeleton--titulo"></div>',
        '  <div class="skeleton skeleton--texto"></div>',
        '  <div class="skeleton skeleton--texto skeleton--curto"></div>',
        '</article>'
      ].join('');
    }).join('');
  }

  // ── Lógica principal ─────────────────────────────────────────────────────────

  function obterCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        var cache = JSON.parse(raw);
        if (Number.isFinite(cache.ts) && Date.now() >= cache.ts && Date.now() - cache.ts < CACHE_MIN * 60 * 1000 && Array.isArray(cache.dados) && cache.dados.length) {
          return cache.dados;
        }
      }
    } catch (e) { /* ignora */ }
    return null;
  }

  function salvarCache(noticias) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), dados: noticias }));
    } catch (e) { /* ignora */ }
  }

  function carregarLocal() {
    return fetch('data/site.json', { signal: AbortSignal.timeout(3500) })
      .then(function (r) {
        if (!r.ok) throw new Error('Conteúdo local não encontrado.');
        return r.json();
      })
      .then(function (data) {
        return Array.isArray(data.noticias) && data.noticias.length ? data.noticias : NOTICIAS_FIXAS;
      })
      .catch(function () {
        return NOTICIAS_FIXAS;
      });
  }

  function carregarRemoto() {
    var controle = window.AbortController ? new window.AbortController() : null;
    var timeout = controle ? setTimeout(function () { controle.abort(); }, 3500) : null;

    return fetch(BACKEND + '/api/noticias', controle ? { signal: controle.signal } : undefined)
      .then(function (r) {
        if (!r.ok) throw new Error('Fonte indisponível.');
        return r.json();
      })
      .then(function (data) {
        if (timeout) clearTimeout(timeout);
        var noticias = Array.isArray(data.noticias) ? data.noticias : [];
        if (noticias.length) {
          salvarCache(noticias);
          renderizar(noticias);
          informar(data.stale ? 'Exibindo a última consulta disponível. As fontes não responderam agora.' : 'Notícias consultadas nas fontes externas. Confira a data de cada publicação.');
        } else {
          informar('Sem atualização externa agora. Mantivemos o conteúdo já disponível.');
        }
      })
      .catch(function () {
        if (timeout) clearTimeout(timeout);
        /* Mantém as notícias locais já renderizadas. */
        informar('Sem atualização externa agora. Mantivemos o conteúdo já disponível.');
      });
  }

  function carregar() {
    var cache = obterCache();
    if (cache) {
      renderizar(cache);
      informar('Notícias salvas neste navegador. Tentando atualizar as fontes.');
      carregarRemoto();
      return;
    }

    renderizarSkeleton();

    carregarLocal().then(function (noticias) {
      renderizar(noticias);
      informar('Conteúdo do portal. Tentando atualizar as fontes externas.');
      carregarRemoto();
    });
  }

  // Inicia após o DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar);
  } else {
    carregar();
  }

})();
