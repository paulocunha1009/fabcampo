import {createScheduleRouter} from './lib/editorial-schedules.js';
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
import { readFileSync } from 'node:fs';
import { createRateLimiter } from './lib/rate-limit.js';
import { validateRequest } from './lib/validate-request.js';
import { buildAcervoContext } from './lib/acervo.js';
import { normalizeAnswer } from './lib/assistant-answer.js';
import { createEditorialAuth } from './lib/editorial-auth.js';
import {createTeamRouter} from './lib/editorial-team.js';
import { createEditorialImageRouter } from './lib/editorial-images.js';
import { CARD_PROMPT, validateCardSource, cardSelectionSource, validateCardSelection } from './lib/editorial-cards.js';
import { createReportRouter } from './lib/editorial-report.js';
import { createPublicationRouter } from './lib/editorial-publication.js';
import { createDraftRouter } from './lib/editorial-drafts.js';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '.env' });

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

O acervo é fornecido a cada pergunta em trechos identificados pela página de origem.

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
export function createApp({ aiClient = ai, rateLimiter = limiter, newsFetch = fetch, clock = Date.now, editorialAuth = createEditorialAuth(), previewHost = process.env.VERCEL_ENV === 'preview' ? process.env.VERCEL_URL : null } = {}) {
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
        (previewHost && origin === `https://${previewHost}`) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`Origem bloqueada: ${origin}`));
    }
  },
  methods: ['POST', 'GET'],
}));

app.use(createEditorialImageRouter({ auth: editorialAuth }));
app.use(createDraftRouter({ auth: editorialAuth }));
app.use(createReportRouter({auth:editorialAuth,aiClient,rateLimiter,model:GEMINI_MODEL,maxTokens:MAX_TOKENS}));
app.use(createPublicationRouter({auth:editorialAuth}));
app.use(createTeamRouter({auth:editorialAuth}));
app.use(createScheduleRouter({auth:editorialAuth}));
app.use('/api/editorial/cards', express.json({ limit: '64kb' }));
app.use(express.json({ limit: '20kb' }));

app.post('/api/editorial/cards', async (req, res, next) => {
  try { await editorialAuth.authenticate(req.headers.authorization); next(); }
  catch(error) { return res.status([401,403,503].includes(error.status) ? error.status : 503)
    .json({ error:'Entre com uma conta autorizada para preparar os cards.' }); }
}, (req, res, next) => {
  try { req.editorialSource = validateCardSource(req.body); next(); }
  catch(error) { res.status(400).json({ error:error.message }); }
}, rateLimiter.middleware, async (req, res) => {
  if(!aiClient) return res.status(503).json({ error:'A IA ainda não está disponível.' });
  let phase = 'provider';
  let finishReason = null;
  try {
    const result = await aiClient.models.generateContent({ model:GEMINI_MODEL,
      contents:JSON.stringify(cardSelectionSource(req.editorialSource)), config:{ systemInstruction:CARD_PROMPT,
        responseMimeType:'application/json', maxOutputTokens:MAX_TOKENS, temperature:0.2,
        responseJsonSchema:{type:'object',required:['resumoId','cards'],properties:{
          resumoId:{type:'integer',minimum:0}, cards:{type:'array',minItems:1,maxItems:3,
            items:{type:'object',required:['titulo','trechoId'],properties:{titulo:{type:'string',maxLength:90},trechoId:{type:'integer',minimum:0}}}}}},
        httpOptions:{ timeout:20000 } } });
    finishReason = result.candidates?.[0]?.finishReason || null;
    phase = 'validation';
    return res.json(validateCardSelection(result.text || '', req.editorialSource));
  } catch(error) {
    // Diagnóstico sem texto da reportagem, resposta do modelo ou credenciais.
    console.warn('editorial_cards_failed', { phase,
      reason:phase==='validation' ? (error instanceof SyntaxError ? 'invalid-json' : 'invalid-selection') : null,
      finishReason,
      status:Number.isInteger(error.status) ? error.status : null });
    return res.status(error.status === 429 ? 429 : 502).json({
      error:'Não foi possível preparar sugestões conferidas. O texto original foi preservado.' });
  }
});

// Preparação do acesso editorial: não cria sessão nem publica conteúdo.
app.get('/api/editorial/identidade', async (req, res) => {
  try {
    const account = await editorialAuth.identify(req.headers.authorization);
    return res.json({account:{id:account.id,email:account.email},role:'pending'});
  } catch(error) {
    return res.status(error.status === 401 ? 401 : 503).json({error:'Não foi possível confirmar sua conta Google.'});
  }
});
app.get('/api/editorial/me', async (req, res) => {
  try {
    const account = await editorialAuth.authenticate(req.headers.authorization);
    return res.json({ account, role: 'editor', permissions:{...editorialAuth.permissions(account),gerenciarEquipe:editorialAuth.isManager?.(account)===true} });
  } catch (error) {
    const status = [401, 403, 503].includes(error.status) ? error.status : 503;
    const messages = { 401: 'Entre novamente com sua conta Google.',
      403: 'Esta conta não está autorizada para o painel.',
      503: 'O acesso editorial ainda não está disponível.' };
    if (status === 401) res.setHeader('WWW-Authenticate', 'Bearer');
    return res.status(status).json({ error: messages[status] });
  }
});

// Ferramenta de teste disponível apenas na URL única do preview protegido pela Vercel.
app.get('/diagnostico', (_req, res) => {
  if (!previewHost) return res.status(404).json({ error: 'Página não encontrada.' });
  return res.type('html').send(readFileSync(new URL('./diagnostico.html', import.meta.url), 'utf8'));
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(aiClient),
    service: 'fabcampo-api',
    assistant: {
      name: ASSISTANT_NAME,
      tagline: ASSISTANT_TAGLINE,
    },
    model: GEMINI_MODEL,
    limiter: rateLimiter.storage,
    limits: rateLimiter.limits,
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
let noticiasEmAndamento = null;
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
  if (!pub) return '';
  const data = new Date(pub);
  if (Number.isNaN(data.getTime())) return '';
  return data.toISOString().slice(0, 10);
}

async function fetchFeed(feed) {
  const resp = await newsFetch(feed.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 PortalComunidade/1.0' },
    signal: AbortSignal.timeout(2500),
  });
  if (!resp.ok) throw new Error(`Fonte indisponível (${resp.status})`);
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
    .filter(item => item.titulo && /^https?:\/\//i.test(item.link) && ehTemaDoPortal(item))
    .slice(0, 2);
}

async function atualizarNoticias() {
    const resultados = await Promise.allSettled(FEEDS.map(fetchFeed));
    const todas = resultados.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const vistas = new Set();
    const topNoticias = todas
      .sort((a, b) => (Date.parse(b.data) || 0) - (Date.parse(a.data) || 0))
      .filter(noticia => {
        if (vistas.has(noticia.link)) return false;
        vistas.add(noticia.link);
        return true;
      })
      .slice(0, NOTICIAS_MAX);
    if (topNoticias.length > 0) {
      noticiasCache = topNoticias;
      noticiasTs = clock();
    }
    return {
      noticias: noticiasCache || [],
      fontes: FEEDS.map(feed => feed.nome),
      cached: topNoticias.length === 0 && Boolean(noticiasCache),
      stale: topNoticias.length === 0 && Boolean(noticiasCache),
    };
}

app.get('/api/noticias', async (_req, res) => {
  // Serve do cache se ainda válido
  if (noticiasCache && clock() - noticiasTs < NOTICIAS_TTL) {
    return res.json({ noticias: noticiasCache, cached: true, stale: false });
  }
  try {
    if (!noticiasEmAndamento) {
      noticiasEmAndamento = atualizarNoticias().finally(() => { noticiasEmAndamento = null; });
    }
    res.json(await noticiasEmAndamento);
  } catch (e) {
    console.error('Erro noticias:', e.message);
    res.json({ noticias: noticiasCache || [], cached: Boolean(noticiasCache) });
  }
});

// ── Atividades pedagógicas ancoradas no acervo ───────────────────────────────
// Usado pela Expedição e pelo Catálogo. O navegador envia apenas instruções e
// trechos públicos do próprio portal; a chave do Gemini continua no servidor.
app.post('/api/atividade', validateRequest('activity'), rateLimiter.middleware, async (req, res) => {
  const { system, message } = req.body;

  if (!system || typeof system !== 'string' || system.length > 5000) {
    return res.status(400).json({ error: 'Campo "system" obrigatório (máximo de 5.000 caracteres).' });
  }
  if (!message || typeof message !== 'string' || message.length > 16000) {
    return res.status(400).json({ error: 'Campo "message" obrigatório (máximo de 16.000 caracteres).' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'A IA ainda não foi configurada. Use a atividade local disponível no portal.',
      code: 'AI_NOT_CONFIGURED',
    });
  }

  try {
    const result = await aiClient.models.generateContent({
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
app.post('/api/assistente', validateRequest('assistant'), rateLimiter.middleware, async (req, res) => {
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

  if (!aiClient) {
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
    const result = await aiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\n${buildAcervoContext(message)}`,
        maxOutputTokens: MAX_TOKENS,
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });
    const rawText = result.text || '';

    // Só entrega estruturas compatíveis com o portal; respostas inválidas ativam contingência.
    let parsed;
    try {
      parsed = normalizeAnswer(rawText);
    } catch {
      return res.status(502).json({
        error: 'O assistente não concluiu uma resposta válida. Tente novamente ou use o acervo local.',
        code: 'INVALID_AI_RESPONSE',
      });
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
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido.', code: 'INVALID_JSON' });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Solicitação muito grande.', code: 'PAYLOAD_TOO_LARGE' });
  }
  if (error?.message?.startsWith('Origem bloqueada:')) {
    return res.status(403).json({ error: 'Origem não autorizada.', code: 'ORIGIN_BLOCKED' });
  }
  console.error('Erro não tratado:', error?.message || 'erro desconhecido');
  return res.status(500).json({ error: 'Erro interno. Tente novamente.', code: 'INTERNAL_ERROR' });
});

return app;
}

const app = createApp();

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

