const PAGINAS = [
  ['Início', '', 'campo digital portal comunidade'],
  ['História', 'historia.html', 'terra reforma agrária assentamento mártires'],
  ['Memória', 'memoria.html', 'relatos depoimentos vídeo tradições'],
  ['Produção Agrícola', 'agricola.html', 'agricultura cultivos copaglam práticas sustentáveis'],
  ['Catálogo do Território', 'catalogo.html', 'plantas biodiversidade espécies fichas'],
  ['Expedição', 'expedicao.html', 'trilha desafios marcos quiz'],
  ['Plantação Nativa', 'Plantação-Nativa.html', 'caatinga restinga árvores flora'],
  ['Plantas Medicinais', 'Plantas-Medicinaisv2.html', 'ervas saúde saber popular'],
  ['Cultivando Vida', 'mudas.html', 'mudas viveiro plantio'],
  ['Educação do Campo', 'reportagem-educacao.html', 'escola pedagogia alternância'],
  ['Clima e Campo', 'reportagem-clima.html', 'seca chuva clima agricultura'],
  ['IA na Educação', 'materia_ia_educacao_v2.html', 'inteligência artificial tecnologia escola'],
  ['Contato', '../contato.html', 'contribuição mensagem documentos'],
  ['Privacidade e uso da IA', '../privacidade.html', 'dados segurança gemini upstash']
];

const normalizar = (texto) => String(texto || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();

export function iniciarBuscaGlobal() {
  const cabecalho = document.querySelector('.cabecalho__conteudo');
  if (!cabecalho || cabecalho.querySelector('.busca-global__abrir')) return;

  const emPages = window.location.pathname.includes('/pages/');
  const raiz = emPages ? '../' : '';
  const prefixoPaginas = emPages ? '' : 'pages/';
  const itens = PAGINAS.map(([titulo, caminho, termos]) => ({
    titulo,
    pagina: caminho.startsWith('../') ? caminho.slice(3) : caminho ? 'pages/' + caminho : 'index.html',
    url: caminho.startsWith('../') ? raiz + caminho.slice(3) : prefixoPaginas + caminho,
    termos: `${titulo} ${termos}`
  }));
  itens[0].url = raiz + 'index.html';

  const dialogo = document.createElement('dialog');
  dialogo.className = 'busca-global';
  dialogo.setAttribute('aria-labelledby', 'busca-global-titulo');
  dialogo.innerHTML = `
    <div class="busca-global__painel">
      <button type="button" class="busca-global__fechar" aria-label="Fechar busca">&times;</button>
      <p class="selo">Pesquisa no portal</p>
      <h2 id="busca-global-titulo">O que você procura?</h2>
      <label for="busca-portal">Página, tema ou planta</label>
      <input id="busca-portal" type="search" placeholder="Ex.: aroeira, memória, clima" autocomplete="off">
      <p class="busca-global__status" aria-live="polite">Digite pelo menos duas letras.</p>
      <div class="busca-global__resultados"></div>
    </div>`;
  document.body.append(dialogo);

  const abrir = document.createElement('button');
  abrir.type = 'button';
  abrir.className = 'busca-global__abrir';
  abrir.setAttribute('aria-label', 'Buscar no portal');
  abrir.innerHTML = '<span aria-hidden="true">⌕</span><span class="busca-global__texto">Buscar</span>';
  cabecalho.insertBefore(abrir, cabecalho.querySelector('.botao-menu'));

  const campo = dialogo.querySelector('#busca-portal');
  const status = dialogo.querySelector('.busca-global__status');
  const resultados = dialogo.querySelector('.busca-global__resultados');
  let estadoCatalogo = 'carregando';
  let carregamento = null;
  let estadoAcervo = 'aguardando';
  let carregamentoAcervo = null;

  const renderizar = () => {
    const consulta = normalizar(campo.value.trim());
    resultados.replaceChildren();
    if (consulta.length < 2) {
      status.textContent = 'Digite pelo menos duas letras.';
      return;
    }
    const palavras = consulta.split(' ');
    const corresponde = texto => palavras.every(palavra => normalizar(texto).includes(palavra));
    const encontrados = itens.map(item => {
      const trecho = item.trechos?.find(t => corresponde(t.section + ' ' + t.text));
      if(!corresponde(item.termos) && !trecho) return null;
      return { ...item, trecho, prioridade:corresponde(item.titulo) ? 2 : corresponde(item.termos) ? 1 : 0 };
    }).filter(Boolean).sort((a,b) => b.prioridade - a.prioridade);
    const resumo = encontrados.length
      ? `${encontrados.length} resultado${encontrados.length === 1 ? '' : 's'}.`
      : 'Nenhum resultado. Tente outro termo.';
    status.textContent = resumo + (estadoCatalogo === 'carregando' ? ' Carregando as plantas do catálogo.'
      : estadoCatalogo === 'erro' ? ' As plantas não puderam ser carregadas agora. Feche e abra a busca para tentar novamente.' : '')
      + (estadoAcervo === 'carregando' ? ' Carregando os textos do acervo.'
      : estadoAcervo === 'erro' ? ' Os textos do acervo não carregaram. Feche e abra a busca para tentar novamente.' : '');
    encontrados.forEach((item) => {
      const link = document.createElement('a');
      link.className = 'busca-global__resultado';
      link.href = item.url;
      link.textContent = item.titulo;
      if(item.trecho){
        const resumo = document.createElement('span');
        resumo.className = 'busca-global__trecho';
        const texto = item.trecho.text;
        resumo.textContent = 'Trecho do acervo: ' + texto.slice(0,220) + (texto.length > 220 ? '…' : '');
        link.append(resumo);
      }
      resultados.append(link);
    });
  };

  function carregarPlantas(){
    if(carregamento || estadoCatalogo === 'pronto') return;
    estadoCatalogo = 'carregando';
    carregamento = fetch(`${raiz}data/plantas.json`, { signal:AbortSignal.timeout(5000) })
      .then((resposta) => resposta.ok ? resposta.json() : Promise.reject(new Error('Catálogo indisponível')))
      .then((dados) => {
        if(!Array.isArray(dados?.especies)) throw new Error('Catálogo inválido');
        const plantas = dados.especies.filter(planta => planta && typeof planta.nome === 'string' && planta.nome.trim());
        plantas.forEach((planta) => itens.push({
          titulo: planta.nome,
          url: `${prefixoPaginas}catalogo.html?busca=${encodeURIComponent(planta.nome)}`,
          termos: `${planta.nome} ${typeof planta.cientifico === 'string' ? planta.cientifico : ''} ${Array.isArray(planta.usos) ? planta.usos.filter(u => typeof u === 'string').join(' ') : ''}`
        }));
        estadoCatalogo = 'pronto';
      })
      .catch(() => { estadoCatalogo = 'erro'; })
      .finally(() => { carregamento = null; renderizar(); });
  }
  carregarPlantas();

  function carregarAcervo(){
    if(carregamentoAcervo || estadoAcervo === 'pronto') return;
    estadoAcervo = 'carregando';
    carregamentoAcervo = fetch(`${raiz}data/busca.json`, { signal:AbortSignal.timeout(5000) })
      .then(resposta => resposta.ok ? resposta.json() : Promise.reject(new Error('Acervo indisponível')))
      .then(dados => {
        if(dados?.version !== 1 || !Array.isArray(dados.pages)) throw new Error('Índice inválido');
        for(const pagina of dados.pages){
          const item = itens.find(i => i.pagina === pagina?.url);
          if(!item || !Array.isArray(pagina.chunks)) continue;
          item.trechos = pagina.chunks.filter(t => t && typeof t.text === 'string' && typeof t.section === 'string');
        }
        estadoAcervo = 'pronto';
      })
      .catch(() => { estadoAcervo = 'erro'; })
      .finally(() => { carregamentoAcervo = null; renderizar(); });
  }

  const mostrar = () => {
    if(!dialogo.open) dialogo.showModal();
    if(estadoCatalogo === 'erro') carregarPlantas();
    carregarAcervo();
    renderizar();
    campo.focus();
  };
  abrir.addEventListener('click', mostrar);
  campo.addEventListener('input', renderizar);
  dialogo.querySelector('.busca-global__fechar').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('close', () => {
    campo.value = ''; renderizar(); abrir.focus();
  });
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo) dialogo.close();
  });
  document.addEventListener('keydown', (evento) => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
      evento.preventDefault();
      mostrar();
    }
  });
}
