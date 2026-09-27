/**
 * Serviço de comunicação com o SabIA — Inteligência do Território
 * O endpoint é configurado via window.PORTAL_AI_ENDPOINT.
 * Se não configurado, aponta para localhost:3001 (desenvolvimento local).
 */

const endpoint = window.PORTAL_AI_ENDPOINT || 'http://localhost:3001/api/assistente';

/**
 * Envia uma mensagem ao assistente e retorna a resposta estruturada.
 * @param {string} mensagem - Mensagem do usuário
 * @param {Array}  historico - Histórico da conversa [{ role, content }]
 * @returns {Promise<{type: string, content?: string, questions?: Array, pages?: Array}>}
 */
export async function perguntarAssistente(mensagem, historico = []) {
  // Fallback local quando o backend não está configurado
  if (!endpoint || endpoint.includes('seu-backend')) {
    return respostaLocal(mensagem);
  }

  try {
    const resposta = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: mensagem, history: historico }),
    });

    if (!resposta.ok) throw new Error(`API indisponível (${resposta.status})`);
    const dados = await resposta.json();

    if (typeof dados.answer === 'string') {
      return { type: 'message', content: dados.answer };
    }
    return dados.answer || respostaLocal(mensagem);
  } catch {
    return respostaLocal(mensagem);
  }
}

// ── Fallback local (sem backend) ─────────────────────────────────────────────
function respostaLocal(pergunta) {
  const t = pergunta.toLowerCase();

  if (t.includes('quiz') || t.includes('me test') || t.includes('pergunta sobre')) {
    return {
      type: 'message',
      content: 'O SabIA está usando o acervo local enquanto recupera a conexão. Escolha História, Plantas Medicinais, Produção Agrícola, Educação ou Plantas Nativas. 🧠',
    };
  }

  if (t.includes('planta medicinal') || t.includes('chanana') || t.includes('pata de vaca') || t.includes('janaguba') || t.includes('alecrim')) {
    return {
      type: 'recommendations',
      content: 'Veja as 12 plantas medicinais documentadas pelos estudantes da turma Manoel Louvado:',
      pages: [{ title: 'Plantas Medicinais', url: 'pages/Plantas-Medicinaisv2.html', reason: '12 espécies da Caatinga com receitas tradicionais, usos e alertas de saúde' }],
    };
  }

  if (t.includes('nativa') || t.includes('carnaúba') || t.includes('mangue') || t.includes('caatinga') || t.includes('restinga')) {
    return {
      type: 'recommendations',
      content: 'Conheça o inventário de espécies nativas do assentamento:',
      pages: [{ title: 'Plantação Nativa', url: 'pages/Plantação-Nativa.html', reason: '17 espécies dos biomas Caatinga, Restinga e Manguezal' }],
    };
  }

  if (t.includes('história') || t.includes('assentamento') || t.includes('ducoco') || t.includes('mártir') || t.includes('reforma agrária')) {
    return {
      type: 'recommendations',
      content: 'Saiba mais sobre a história do Assentamento Lagoa do Mineiro:',
      pages: [
        { title: 'História do Assentamento', url: 'pages/historia.html', reason: 'Origem, mártires, linha do tempo e personagens históricos reais' },
        { title: 'Educação do Campo', url: 'pages/reportagem-educacao.html', reason: 'A escola que nasceu junto com a comunidade' },
      ],
    };
  }

  if (t.includes('agricultur') || t.includes('plantio') || t.includes('colheita') || t.includes('copaglam') || t.includes('açude')) {
    return {
      type: 'recommendations',
      content: 'Explore a produção agrícola e os impactos climáticos:',
      pages: [
        { title: 'Produção Agrícola', url: 'pages/agricola.html', reason: 'Cultivos, COPAGLAM, Açude Corrente e práticas sustentáveis' },
        { title: 'Mudanças Climáticas', url: 'pages/reportagem-clima.html', reason: 'Impactos econômicos das emergências climáticas — pesquisa com 15 famílias' },
      ],
    };
  }

  if (t.includes('educação') || t.includes('escola') || t.includes('alternância') || t.includes('mística') || t.includes('tempo comunidade')) {
    return {
      type: 'recommendations',
      content: 'Conheça a proposta pedagógica da EEMPC Francisco Araújo Barros:',
      pages: [{ title: 'Educação do Campo', url: 'pages/reportagem-educacao.html', reason: 'Pedagogia da Alternância, Místicas, Tempo Comunidade e formação profissional' }],
    };
  }

  return {
    type: 'message',
    content: 'A IA está temporariamente indisponível, mas o portal continua funcionando. Posso orientar localmente sobre História, Plantas Medicinais, Plantas Nativas, Produção Agrícola e Educação do Campo. O que você gostaria de explorar? 🌱',
  };
}
