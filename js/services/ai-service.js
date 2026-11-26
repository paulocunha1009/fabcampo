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
  const documental=respostaPesquisaConferida(mensagem);
  if(documental)return documental;
  if (perguntaDiretaEscola(mensagem)) {
    const resposta = respostaEscolaPPP(mensagem);
    if (resposta) return { ...resposta, local:true, localReason:'verified' };
  }
  // Fallback local quando o backend não está configurado
  if (!endpoint || endpoint.includes('seu-backend')) {
    return { ...respostaLocal(mensagem), local:true };
  }

  try {
    const resposta = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: mensagem, history: historico }),
      signal: AbortSignal.timeout(25000),
    });

    if (!resposta.ok) throw new Error(`API indisponível (${resposta.status})`);
    const dados = await resposta.json();

    if (typeof dados.answer === 'string') {
      return { type: 'message', content: dados.answer };
    }
    return dados.answer || { ...respostaLocal(mensagem), local:true };
  } catch {
    return { ...respostaLocal(mensagem), local:true };
  }
}

// ── Fallback local (sem backend) ─────────────────────────────────────────────

function respostaPesquisaConferida(pergunta) {
  const t=pergunta.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[?.!]+$/,'').trim();
  if(/^(?:(?:fale|me fale|conte|me conte)(?: um pouco)? sobre|explique|o que e|qual (?:e )?o objetivo d[oe]) (?:o )?(?:projeto (?:deste|desse|do) portal|projeto campo digital|campo digital|portal campo digital)$/.test(t)) {
    const home=window.location.pathname.includes('/pages/')?'../index.html#titulo-campo-digital':'index.html#titulo-campo-digital';
    return {type:'recommendations',content:'O Campo Digital é um projeto desenvolvido por estudantes da Escola Francisco Araújo Barros, em Itarema (CE), para valorizar a memória, a história e os saberes do Assentamento Lagoa do Mineiro e da comunidade escolar. O trabalho reúne pesquisa documental, escuta da comunidade e organização dos registros em páginas, reportagens e materiais de estudo. O portal também oferece a SábIA como apoio à consulta; ela utiliza o Gemini e informações documentais, e suas respostas precisam ser conferidas. A equipe autorizada usa um painel para preparar reportagens e eventos. O objetivo é aproximar território, tecnologia e aprendizagem. Este resumo vem da apresentação do próprio portal, sem geração por IA.',pages:[{title:'Conheça o projeto Campo Digital',url:home,reason:'Objetivos e etapas do projeto apresentados no portal.'}],local:true,localReason:'verified'};
  }
  let text='';
  if(/^(quantos alunos (?:tem|ha na) a? ?escola|quantos alunos tem a escola hoje|os 249 alunos sao de 2025 ou 2026)$/.test(t)) {
    text='Não há matrícula atual confirmada nesta base. Nascimento e Diniz registram cerca de 249 estudantes em oito turmas, de 25 comunidades, na página 3 do PDF de seu estudo. O trabalho reúne entrevistas de 2016; isso não comprova matrícula de 2025 ou 2026. Para o número atual, consulte a escola.';
  } else if(/^(?:em que ano foi criado|quando foi criado) o assentamento(?: lagoa do mineiro)?$/.test(t)) {
    text='É preciso distinguir os marcos: o Decreto 92.826, de 26/06/1986, declara o imóvel de interesse social para fins de desapropriação; a Portaria 573, de 13/07/1987, é citada na criação administrativa do projeto pelo Ipea (2016, p. 29 impressa/31 do PDF) e pela Resolução Incra 21/2002 (DOU de 27/12/2002, p. 373). Esses marcos não são a mesma coisa que o início da luta ou a posse. Sobre a posse há divergência: PPP 2025, pp. 12 e 15 do PDF, menciona 25/07/1986; Ipea registra 19/09/1986. As duas atribuições permanecem em conferência.';
  } else if(/^(quando foi a posse do assentamento(?: lagoa do mineiro)?|qual (?:e )?a data da posse do assentamento(?: lagoa do mineiro)?)$/.test(t)) {
    text='Há divergência entre as fontes: o PPP da escola, edição 2025, menciona 25/07/1986 nas páginas 12 e 15 do PDF; o relatório Ipea de 2016 registra imissão na posse pelo Incra em 19/09/1986, na página 29 impressa (31 do PDF). Não escolhemos uma versão por suposição. É necessário confrontar os atos originais com a escola. Posse, declaração para desapropriação e criação administrativa são marcos distintos.';
  }
  if(!text)return null;
  const url=window.location.pathname.includes('/pages/')?'historia.html':'pages/historia.html';
  return {type:'recommendations',content:text+' Resposta documental do acervo conferido, sem geração por IA.',pages:[{title:'História: fontes e conferência documental',url,reason:'Consultar a atribuição das fontes, os dados históricos e as divergências registradas.'}],local:true,localReason:'verified'};
}

function perguntaDiretaEscola(pergunta) {
  const t=pergunta.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[?.!]+$/,'').trim();
  return /^(como surgiu a escola|qual (?:e )?a origem da escola|resuma a historia da escola|em que ano foi criada a escola|quando a escola comecou a funcionar|quem (?:e|foi) a (?:primeira )?diretora(?: da escola)?|quem fundou a escola)$/.test(t);
}

function respostaEscolaPPP(pergunta) {
  const t=pergunta.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(/^(gere|recomende)|quiz|perguntas de quiz/.test(t)||!/escola|ppp|ivaniza|diretora/.test(t))return null;
  let text='';
  if(/diretor|direcao/.test(t))text='Segundo o PPP de 2025, a diretora geral indicada é Maria Ivaniza Martins de Sousa Nascimento (páginas 7 e 80 do PDF, gestão 2025–2027). O documento consultado não identifica quem foi a primeira diretora nem comprova alterações posteriores de gestão.';
  else if(/quem/.test(t)&&/fund|criou|cria|criacao/.test(t))text='O PPP apresenta a escola como conquista coletiva das comunidades do Assentamento Lagoa do Mineiro, do MST e do poder público estadual/SEDUC (páginas 2–4 do PDF). Não identifica uma única pessoa como fundadora. Francisco Araújo Barros é a liderança homenageada no nome da escola, não seu fundador (páginas 16–17).';
  else if(/quando|ano|data|funcion/.test(t)&&/cria|fund|inicio|comec|funcion|nasceu/.test(t))text='Segundo o PPP de 2025, a escola iniciou seu funcionamento em 3 de março de 2011 (páginas 3 e 7 do PDF). Início de funcionamento, autorização e inauguração são marcos diferentes. O campo de fundação em 15/02/2012, no bloco da mantenedora, exige esclarecimento com a gestão antes de ser tratado como a mesma data.';
  else if(/origem|historia|como.*(?:surgiu|nasceu|criada)|resum/.test(t))text='A Escola Francisco Araújo Barros nasceu de uma conquista coletiva das comunidades do Assentamento Lagoa do Mineiro, articulada ao MST e ao poder público estadual/SEDUC. Segundo o PPP de 2025, começou a funcionar em 3 de março de 2011 (páginas 2–4 e 7 do PDF). Seu nome homenageia Francisco Araújo Barros, agricultor e liderança da luta pela terra; o documento não o apresenta como fundador da escola (páginas 16–17). Início das aulas, autorização e inauguração são marcos diferentes; consulte os detalhes e as ressalvas na página História.';
  if(!text)return null;
  const url=window.location.pathname.includes('/pages/')?'historia.html':'pages/historia.html';
  return {type:'recommendations',content:text+' Fonte: PPP da Escola Francisco Araújo Barros, edição 2025, fornecido pelo professor e conferido pela turma. Resposta do acervo local, sem geração por IA.',pages:[{title:'Nossa escola: informações do PPP',url,reason:'Fonte, páginas consultadas e limites das informações na página História.'}]};
}

function respostaLocal(pergunta) {
  const t = pergunta.toLowerCase();
    const escola=respostaEscolaPPP(pergunta);if(escola)return escola;

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
