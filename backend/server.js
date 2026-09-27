/**
 * Campo Digital — Backend do SabIA, Inteligência do Território
 * EEMPC Francisco Araújo Barros · Ceará Científico 2026
 *
 * Proxy seguro entre o frontend e a API Google Gemini.
 * A chave de API NUNCA é exposta ao navegador.
 *
 * Uso local:
 *   npm install
 *   cp .env.example .env  → preencha GEMINI_API_KEY
 *   npm start
 *
 * Deploy (Render.com):
 *   → Configure a variável de ambiente GEMINI_API_KEY no painel do Render
 */

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createRateLimiter } from './lib/rate-limit.js';

dotenv.config();

// ── Configuração ─────────────────────────────────────────────────────────────
const PORT         = parseInt(process.env.PORT        || '3001', 10);
const GEMINI_MODEL = process.env.GEMINI_MODEL         || 'gemini-2.5-flash-lite';
const MAX_TOKENS   = parseInt(process.env.MAX_TOKENS  || '1000', 10);
const ASSISTANT_NAME = 'SabIA';
const ASSISTANT_TAGLINE = 'Uma inteligência que aprende com o território para ajudar a aprender, pesquisar e transformar.';

// Origens permitidas: localhost (dev) + domínio público do site
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'https://fabcampo.com.br,https://www.fabcampo.com.br,http://localhost,http://127.0.0.1,null'
).split(',').map(s => s.trim());

const hasGeminiKey = Boolean(
  process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('COLOQUE')
);
const ai = hasGeminiKey ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
const limiter = createRateLimiter();

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Você é o SabIA — Inteligência do Território, assistente educacional do Campo Digital, projeto da EEMPC Francisco Araújo Barros, Ceará Científico 2026, que documenta a história, biodiversidade e saberes do Assentamento Lagoa do Mineiro, em Itarema, CE.

IDENTIDADE E PERSONALIDADE
- SabIA é um personagem masculino. Ao falar de si mesmo, use formas masculinas, como "estou pronto para ajudar".
- Seu lema é: "Uma inteligência que aprende com o território para ajudar a aprender, pesquisar e transformar."
- Seja acolhedor, curioso, respeitoso e encorajador, como um jovem pesquisador e educador do campo.
- Use linguagem simples, frases diretas e parágrafos curtos. Explique palavras difíceis quando forem necessárias.
- Ajude o estudante a compreender e pesquisar; não faça passar como autor de um trabalho que ele não produziu.
- Não diga que guarda, conhece ou aprende dados pessoais do visitante. O território é sua fonte de contexto, não os dados privados do usuário.
- Quando a informação estiver no acervo abaixo, responda com segurança. Quando não estiver, deixe claro que é conhecimento geral ou que não encontrou a informação no acervo.
- Nunca invente fatos, pessoas, datas, números, fontes ou páginas do portal.

══════════════════════════════════════
FORMATO DE RESPOSTA — OBRIGATÓRIO
══════════════════════════════════════
Responda SEMPRE em JSON puro e válido. NENHUM texto fora do JSON. Sem markdown. Sem blocos de código.

▸ Mensagem normal — o campo "content" deve ser TEXTO SIMPLES, nunca outro JSON:
{"type":"message","content":"Texto da resposta aqui, direto e sem aspas extras."}

ERRADO (não faça isso):
{"type":"message","content":"{\"type\":\"message\",\"content\":\"...\"}"}

▸ Quiz (quando usuário pedir quiz, quiser ser testado):
{"type":"quiz","topic":"Nome do Tema","questions":[{"q":"Pergunta?","opts":["A) opção","B) opção","C) opção","D) opção"],"correct":0,"explanation":"Explicação do gabarito."}]}
— correct = índice 0–3 da resposta correta
— Padrão: 3 questões. Mínimo 2, máximo 5.

▸ Recomendações de páginas (quando usuário pedir orientação de navegação):
{"type":"recommendations","content":"Texto explicativo simples","pages":[{"title":"Nome da Página","url":"pages/nome.html","reason":"por que recomendo"}]}

══════════════════════════════════════
CONTEÚDO DO PORTAL
══════════════════════════════════════

## HISTÓRIA DO ASSENTAMENTO LAGOA DO MINEIRO
Localização: Itarema, litoral oeste do Ceará
Famílias: 214, em 7 comunidades — Saguim, Lagoa do Mineiro, Mineiro Velho, Corrente, Barbosa, Cedro, Córrego das Moças

Origem: Até 1985, ~150 famílias viviam como moradores de condição nas terras de Francisco Teófilo de Andrade. Em 1985, o padre Aristides anunciou a venda das terras à empresa DUCOCO (coco).

Resistência: Trabalhadores organizados pelas CEBs, apoiados pela Diocese de Itapipoca e Dom Paulo. 90 trabalhadores derrubaram a cerca da DUCOCO diante de 16 policiais. 3 mártires mortos: Francisco Araújo Barros (baleado e degolado durante trabalho de broca) e dois outros.

Marcos históricos:
- Até 1985: 150 famílias como moradores de condição
- 1986: Derrubada da cerca; 3 mártires; Decreto nº 92.826; Posse formal 19/09/1986
- 1987: Criação oficial — Portaria 573/MIRAD
- 1991: Fundação da COPAGLAM com 204 membros (14/04/1991)
- 1998: Construção do Açude Corrente — 731.250 m³
- 03/03/2011: Início da EEMPC Francisco Araújo Barros (Decreto CE 30.493)
- 2022-2023: Implantação dos cursos técnicos (Informática e Agropecuária)
- 2025: 179 estudantes matriculados

## PLANTAS MEDICINAIS (12 espécies — Turma Manoel Louvado, 2º Ano A Técnico, Ceará Científico 2025)
1. Chanana (Turnera subulata) — inflamações, infecções urinárias; chá 10g/litro; evitar na gravidez
2. Pata de Vaca (Bauhinia forficata) — diabetes tipo 2, diurético; não substituir medicação
3. Carnaúba (Copernicia prunifera) — febre, diurético, antimicrobiano (símbolo do Ceará)
4. Torém (Cecropia pachystachya) — tosse, bronquite, pressão alta; xarope com mel
5. Bredo (Amaranthus deflexus) — anti-inflamatório, nutritivo (ferro e proteínas)
6. Quebra-Pedra (Phyllanthus niruri) — cálculos renais, proteção hepática
7. Janaguba (Himatanthus drasticus) — inflamações, úlceras; látex tóxico em dose elevada
8. Alecrim-Pimenta (Lippia sidoides) — bactericida, antifúngico, garganta
9. Aroeira da Praia (Eugenia punicifolia) — cicatrização, antibacteriana
10. Batiputá (Ouratea parviflora) — óleo sagrado Tremembé, antimicrobiano
11. Pepaconha (Pombalia calceolaria) — expectorante, antifebril
12. Mussambê (Cleome spinosa) — cefaleia, repelente natural

## PLANTAÇÃO NATIVA (17 espécies)
Biomas: Caatinga, Restinga, Manguezal — Itarema, CE
Áreas: Morro dos Patos, Patos, Mineiro Velho e entorno
Destaque: Carnaúba (Copernicia prunifera), Mangue-Vermelho (Rhizophora mangle)

## PRODUÇÃO AGRÍCOLA
Agricultura: 50% da renda familiar
Cultivos: milho, feijão, mandioca, hortaliças, coco, caju, jerimum, galinhas caipiras
COPAGLAM: fundada 14/04/1991 com 204 membros
Açude Corrente: 731.250 m³ (1998)
Práticas: cobertura morta, sementes crioulas, consórcio milho+feijão, adubação orgânica, fases da lua

## MUDANÇAS CLIMÁTICAS
15 famílias do Assentamento Salgado Comprido, Itarema
Pesquisadoras: Maria Ariane Verissimo e Ana Clara Nascimento Alves
Orientadora: Priscila Santos de Sousa (abril a outubro de 2025)
Impactos: queimadas, temperaturas extremas, chuvas irregulares, pragas, acúmulo de lixo
13 de 15 famílias sem orçamento formal. Renda: 50% agricultura, 20% bolsa família

## EDUCAÇÃO DO CAMPO
EEMPC Francisco Araújo Barros: Decreto CE 30.493 (03/03/2011), Educação Profissional Integral
Cursos: Informática e Agropecuária. 179 estudantes (2025), 7 comunidades, internato no TE

Pedagogia da Alternância:
- Origem: 1935, França — Maison Familiale Rurale de Lauzun
- Brasil: 1969, EFA de Anchieta/ES
- Tempo Escola (TE): aulas, técnicos, místicas, assembleias
- Tempo Comunidade (TC): pesquisa na família, Caderno da Realidade, Plano de Estudo

Místicas: ritual coletivo artístico-político de identidade (origem MST). NÃO é cerimônia religiosa.
Tipos: Abertura, Encerramento, Luta (datas históricas), Temática (ligada ao conteúdo)

## PÁGINAS DO PORTAL
- "../index.html" — Página inicial
- "historia.html" — História: mártires, Reforma Agrária, linha do tempo
- "reportagem-educacao.html" — Educação do Campo, Alternância, Místicas
- "agricola.html" — Produção agrícola, COPAGLAM
- "reportagem-clima.html" — Mudanças climáticas e agricultura familiar
- "Plantação-Nativa.html" — 17 espécies nativas
- "Plantas-Medicinaisv2.html" — 12 plantas medicinais
- "memoria.html" — Memória e depoimentos
- "../contato.html" — Contato

══════════════════════════════════════
DIRETRIZES
══════════════════════════════════════
- Responda SEMPRE em português brasileiro
- Linguagem acessível para estudantes do Ensino Médio
- Para temas de saúde: trate os usos de plantas como saber tradicional documentado, não prescreva tratamentos e sempre recomende consultar profissional de saúde
- Quizzes: use dados reais do portal acima
- Para dúvidas fora do portal (matemática, informática, ciências, etc.): responda com conhecimento geral e, quando possível, relacione ao contexto da comunidade
- Seja encorajador — celebre o interesse dos estudantes pela própria comunidade
- Se pedirem dados pessoais, diagnóstico médico, conteúdo perigoso ou algo que possa causar dano, recuse com respeito e ofereça uma alternativa educativa segura
- Não repita seu nome em todas as respostas; apresente-se como SabIA apenas quando isso ajudar a conversa`;

// ── Express ───────────────────────────────────────────────────────────────────
const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.use(cors({
  origin(origin, cb) {
    if (!origin || origin === 'null' || ALLOWED_ORIGINS.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`Origem bloqueada: ${origin}`));
    }
  },
  methods: ['POST', 'GET'],
}));

app.use(express.json({ limit: '20kb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: hasGeminiKey,
    service: 'fabcampo-api',
    assistant: {
      name: ASSISTANT_NAME,
      tagline: ASSISTANT_TAGLINE,
    },
    model: GEMINI_MODEL,
    limiter: limiter.storage,
    limits: limiter.limits,
    timestamp: new Date().toISOString(),
  });
});

// ── Notícias externas confiáveis (proxy RSS → JSON, sem CORS) ────────────────
const FEEDS = [
  { nome: 'G1 Educação', url: 'https://g1.globo.com/dynamo/educacao/rss2.xml', categoria: 'Educação', icone: '🎓', classe: 'badge--educacao' },
  { nome: 'G1 Tecnologia', url: 'https://g1.globo.com/dynamo/tecnologia/rss2.xml', categoria: 'Tecnologia', icone: '💻', classe: 'badge--tecnologia' },
  { nome: 'Agência Brasil', url: 'https://agenciabrasil.ebc.com.br/rss/educacao/feed.xml', categoria: 'Educação', icone: '📝', classe: 'badge--educacao' },
  { nome: 'Olhar Digital', url: 'https://olhardigital.com.br/feed/', categoria: 'Tecnologia', icone: '🤖', classe: 'badge--tecnologia' },
  { nome: 'Canaltech', url: 'https://canaltech.com.br/rss/', categoria: 'Inovação', icone: '🌱', classe: 'badge--inovacao' },
];

let noticiasCache = null;
let noticiasTs    = 0;
const NOTICIAS_TTL = 30 * 60 * 1000; // 30 minutos
const NOTICIAS_MAX = 6;
const TERMOS_NOTICIAS = [
  'educação', 'ensino', 'escola', 'estudante', 'enem', 'vestibular',
  'tecnologia', 'inteligência artificial', 'chatgpt', 'inovação', 'ciência',
  'agro', 'sustentabilidade', 'pesquisa'
];

function extrairItensRSS(xml) {
  const itens = [];
  const itemRe = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml)) !== null) {
    const bloco = m[1];
    const tag = (t) => { const r = bloco.match(new RegExp(`<${t}[^>]*>(?:<\\!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${t}>`, 'i')); return r ? r[1].trim() : ''; };
    const link = tag('link') || bloco.match(/<link[^>]*href="([^"]+)"/i)?.[1] || '';
    const pub  = tag('pubDate') || tag('dc:date') || '';
    const desc = tag('description') || tag('content:encoded') || '';
    const titulo = tag('title');
    if (titulo) itens.push({ titulo, resumo: desc, link, pub });
  }
  return itens;
}

function limparHtml(html) {
  return String(html || '')
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'á').replace(/&agrave;/g, 'à').replace(/&acirc;/g, 'â').replace(/&atilde;/g, 'ã')
    .replace(/&eacute;/g, 'é').replace(/&ecirc;/g, 'ê')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó').replace(/&ocirc;/g, 'ô').replace(/&otilde;/g, 'õ')
    .replace(/&uacute;/g, 'ú').replace(/&ccedil;/g, 'ç')
    .replace(/&Aacute;/g, 'Á').replace(/&Agrave;/g, 'À').replace(/&Acirc;/g, 'Â').replace(/&Atilde;/g, 'Ã')
    .replace(/&Eacute;/g, 'É').replace(/&Ecirc;/g, 'Ê')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó').replace(/&Ocirc;/g, 'Ô').replace(/&Otilde;/g, 'Õ')
    .replace(/&Uacute;/g, 'Ú').replace(/&Ccedil;/g, 'Ç')
    .replace(/&#[0-9]+;/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resumir(texto, limite = 145) {
  const limpo = limparHtml(texto);
  if (!limpo) return 'Leia a reportagem original para entender os principais pontos dessa atualização.';
  if (limpo.length <= limite) return limpo;
  return limpo.slice(0, limite).replace(/\s+\S*$/, '') + '…';
}

function ehTemaDoPortal(item) {
  const texto = `${item.titulo} ${item.resumo}`.toLowerCase();
  return TERMOS_NOTICIAS.some(termo => texto.includes(termo));
}

function dataISO(pub) {
  const data = pub ? new Date(pub) : new Date();
  if (Number.isNaN(data.getTime())) return new Date().toISOString().slice(0, 10);
  return data.toISOString().slice(0, 10);
}

async function fetchFeed(feed) {
  const resp = await fetch(feed.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 PortalComunidade/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  const xml   = await resp.text();
  const itens = extrairItensRSS(xml).slice(0, 8);
  return itens
    .map(item => ({
      titulo:    limparHtml(item.titulo),
      resumo:    resumir(item.resumo),
      data:      dataISO(item.pub),
      link:      item.link,
      categoria: feed.categoria,
      icone:     feed.icone,
      classe:    feed.classe,
      fonte:     feed.nome,
    }))
    .filter(item => item.titulo && item.link && ehTemaDoPortal(item))
    .slice(0, 2);
}

app.get('/api/noticias', async (_req, res) => {
  // Serve do cache se ainda válido
  if (noticiasCache && Date.now() - noticiasTs < NOTICIAS_TTL) {
    return res.json({ noticias: noticiasCache, cached: true });
  }
  try {
    const resultados = await Promise.allSettled(FEEDS.map(fetchFeed));
    const todas = resultados.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const vistas = new Set();
    const topNoticias = todas
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .filter(noticia => {
        const chave = noticia.link || noticia.titulo;
        if (vistas.has(chave)) return false;
        vistas.add(chave);
        return true;
      })
      .slice(0, NOTICIAS_MAX);

    if (topNoticias.length > 0) {
      noticiasCache = topNoticias;
      noticiasTs    = Date.now();
    }
    res.json({
      noticias: topNoticias.length > 0 ? topNoticias : (noticiasCache || []),
      fontes: FEEDS.map(feed => feed.nome),
      cached: false,
    });
  } catch (e) {
    console.error('Erro noticias:', e.message);
    res.json({ noticias: noticiasCache || [], cached: Boolean(noticiasCache) });
  }
});

// ── Atividades pedagógicas ancoradas no acervo ───────────────────────────────
// Usado pela Expedição e pelo Catálogo. O navegador envia apenas instruções e
// trechos públicos do próprio portal; a chave do Gemini continua no servidor.
app.post('/api/atividade', limiter.middleware, async (req, res) => {
  const { system, message } = req.body;

  if (!system || typeof system !== 'string' || system.length > 5000) {
    return res.status(400).json({ error: 'Campo "system" obrigatório (máximo de 5.000 caracteres).' });
  }
  if (!message || typeof message !== 'string' || message.length > 16000) {
    return res.status(400).json({ error: 'Campo "message" obrigatório (máximo de 16.000 caracteres).' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'A IA ainda não foi configurada. Use a atividade local disponível no portal.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: message.trim(),
      config: {
        systemInstruction: system.trim(),
        maxOutputTokens: MAX_TOKENS,
        temperature: 0.7,
      },
    });
    const text = String(result.text || '').trim();
    if (!text) return res.status(502).json({ error: 'O assistente retornou uma resposta vazia.' });
    return res.json({ text });
  } catch (erro) {
    console.error('Erro Gemini em /api/atividade:', erro.message);
    if (erro.status === 429 || erro.message?.includes('quota')) {
      return res.status(429).json({ error: 'Limite de uso atingido. Tente novamente em alguns minutos.' });
    }
    return res.status(500).json({ error: 'Não foi possível gerar a atividade agora.' });
  }
});

// ── Endpoint principal ────────────────────────────────────────────────────────
app.post('/api/assistente', limiter.middleware, async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Campo "message" obrigatório.' });
  }
  if (message.trim().length === 0 || message.length > 2000) {
    return res.status(400).json({ error: 'Mensagem deve ter entre 1 e 2000 caracteres.' });
  }
  if (!Array.isArray(history)) {
    return res.status(400).json({ error: 'Campo "history" deve ser um array.' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'A IA ainda não foi configurada. O assistente local continuará disponível.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  try {
    // Converte histórico: Gemini usa "model" em vez de "assistant"
    const geminiHistory = history
      .slice(-20)
      .filter(h => h.role && h.content && typeof h.content === 'string')
      .map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));

    const contents = [
      ...geminiHistory,
      { role: 'user', parts: [{ text: message.trim() }] },
    ];
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: MAX_TOKENS,
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });
    const rawText = result.text || '';

    // Extrai e normaliza JSON da resposta
    let parsed;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);

      // Corrige double-wrapping: modelo às vezes retorna JSON dentro do campo content
      // Ex: {"type":"message","content":"{\"type\":\"message\",\"content\":\"...\"}"}
      if (parsed && typeof parsed.content === 'string') {
        const trimmed = parsed.content.trim();
        if (trimmed.startsWith('{"type"')) {
          // Tenta parse direto primeiro
          try {
            const inner = JSON.parse(trimmed);
            if (inner && inner.type) {
              parsed = inner;
            }
          } catch {
            // JSON interno inválido (aspas não escapadas no content)
            // Extrai o texto usando indexOf/lastIndexOf — funciona mesmo com aspas soltas
            const marker = '"content":"';
            const start = trimmed.indexOf(marker);
            if (start !== -1) {
              const textStart = start + marker.length;
              const textEnd = trimmed.lastIndexOf('"}');
              if (textEnd > textStart) {
                const extracted = trimmed.slice(textStart, textEnd)
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"');
                parsed = { type: 'message', content: extracted };
              }
            }
          }
        }
      }
    } catch {
      // Fallback: retorna como mensagem de texto simples
      parsed = { type: 'message', content: rawText.replace(/```json\n?|```/g, '').trim() };
    }

    res.json({ answer: parsed });

  } catch (erro) {
    console.error('Erro Gemini:', erro.message);

    if (erro.message?.includes('API_KEY') || erro.status === 400) {
      return res.status(500).json({ error: 'Chave da API inválida. Verifique o arquivo .env.' });
    }
    if (erro.status === 429 || erro.message?.includes('quota')) {
      return res.status(429).json({ error: 'Limite da API atingido. Tente novamente em instantes.' });
    }

    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Solicitação muito grande.', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (error?.message?.startsWith('Origem bloqueada:')) {
    return res.status(403).json({ error: 'Origem não autorizada.', code: 'ORIGIN_BLOCKED' });
  }
  console.error('Erro não tratado:', error?.message || 'erro desconhecido');
  return res.status(500).json({ error: 'Erro interno. Tente novamente.', code: 'INTERNAL_ERROR' });
});

// A Vercel importa o app; em desenvolvimento local o servidor abre a porta.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🐦 SabIA — Inteligência do Território (Gemini)`);
    console.log(`   Backend rodando em: http://localhost:${PORT}`);
    console.log(`   Modelo: ${GEMINI_MODEL} | Limites: ${JSON.stringify(limiter.limits)}`);
    console.log(`   Health check: http://localhost:${PORT}/health\n`);
  });
}

export default app;
