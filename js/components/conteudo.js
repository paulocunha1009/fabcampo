const caminhoDados = new URL('../../data/site.json', import.meta.url);

export async function carregarConteudo() {
  try {
    const resposta = await fetch(caminhoDados);
    if (!resposta.ok) throw new Error('Conteúdo não encontrado.');

    const dados = await resposta.json();
    renderizarNoticias(dados.noticias ?? []);
    renderizarEventos(dados.eventos ?? []);
    renderizarLista('[data-render="dicas-agricolas"]', dados.dicasAgricolas ?? []);
    renderizarCardsDados('[data-render="plantas-nativas"]', dados.plantasNativas ?? []);
    renderizarCardsDados('[data-render="plantas-medicinais"]', dados.plantasMedicinais ?? []);
  } catch (erro) {
    console.warn('Não foi possível carregar data/site.json:', erro);
  }
}

function renderizarNoticias(noticias) {
  const destino = document.querySelector('[data-render="noticias"]');
  if (!destino) return;
  // A página inicial tem seu próprio carregador, com cache e atualização remota.
  if (destino.hasAttribute('data-noticias-auto')) return;

  destino.innerHTML = noticias.map((noticia, indice) => {
    const padroes = [
      { categoria: 'Portal', icone: '📌', classe: 'badge--portal', link: 'pages/reportagem-educacao.html' },
      { categoria: 'Tecnologia', icone: '🤖', classe: 'badge--tech', link: 'pages/materia_ia_educacao_v2.html' },
      { categoria: 'Agroecologia', icone: '🌱', classe: 'badge--agro', link: 'pages/agricola.html' }
    ];
    const padrao = padroes[indice % padroes.length];
    const categoria = noticia.categoria ?? padrao.categoria;
    const icone = noticia.icone ?? padrao.icone;
    const classe = noticia.classe ?? padrao.classe;
    const link = noticia.link ?? padrao.link;
    const fonte = noticia.fonte ?? 'Campo Digital';
    const externo = /^https?:\/\//i.test(link);
    const destino = externo ? ' target="_blank" rel="noopener noreferrer"' : '';

    return `
    <article class="card-noticia">
      <div class="card-noticia__meta">
        <span class="card-noticia__badge ${escapar(classe)}">${escapar(`${icone} ${categoria}`)}</span>
        <span class="card-noticia__fonte">${escapar(fonte)}</span>
        <time datetime="${escapar(noticia.data)}">${formatarData(noticia.data)}</time>
      </div>
      <h3 class="card-noticia__titulo">
        <a href="${escapar(link)}"${destino}>${escapar(noticia.titulo)}</a>
      </h3>
      <p class="card-noticia__resumo">${escapar(noticia.resumo)}</p>
    </article>
  `;
  }).join('');
}

function renderizarEventos(eventos) {
  const destino = document.querySelector('[data-render="eventos"]');
  if (!destino) return;

  destino.innerHTML = eventos.map((evento) => `
    <div class="evento">
      <strong>${escapar(evento.nome)}</strong>
      <time datetime="${evento.data}">${formatarData(evento.data)}</time>
      <p>${escapar(evento.descricao)}</p>
    </div>
  `).join('');
}

function renderizarLista(seletor, itens) {
  const destino = document.querySelector(seletor);
  if (!destino || !itens.length) return;
  destino.innerHTML = itens.map((item) => `<li>${escapar(item)}</li>`).join('');
}

function renderizarCardsDados(seletor, itens) {
  const destino = document.querySelector(seletor);
  if (!destino) return;

  destino.innerHTML = itens.map((item) => `
    <article>
      <h3>${escapar(item.nome)}</h3>
      <p>${escapar(item.descricao)}</p>
    </article>
  `).join('');
}

function formatarData(dataISO) {
  const data = new Date(`${dataISO}T12:00:00`);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(data);
}

function escapar(texto) {
  return String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
