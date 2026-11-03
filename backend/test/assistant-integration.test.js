import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';

process.env.VERCEL = '1';
process.env.DOTENV_CONFIG_PATH = '.env.test-not-present';
for (const name of ['GEMINI_API_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  'UPSTASH_REDIS_REST_KV_REST_API_URL', 'UPSTASH_REDIS_REST_KV_REST_API_TOKEN']) delete process.env[name];

const { createApp } = await import('../server.js');
let providerText;
let providerError;
let providerRequest;
let calls = 0;
const aiClient = { models: { async generateContent(request) {
  calls++;
  providerRequest = request;
  if (providerError) throw providerError;
  return { text: providerText };
} } };
const rateLimiter = { middleware(_req, _res, next) { next(); }, storage: 'test', limits: {} };
const app = createApp({ aiClient, rateLimiter, previewHost: 'teste-fabcampo.vercel.app' });
let server;
let base;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});
after(async () => { await new Promise(resolve => server.close(resolve)); });

function ask(body) {
  return fetch(`${base}/api/assistente`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://fabcampo.com.br' },
    body: JSON.stringify(body),
  });
}

test('rota envia contexto do acervo ao provedor e entrega resposta compatível com o portal', async () => {
  providerText = JSON.stringify({ type: 'message', content: 'Consulte a página Produção Agrícola.' });
  const response = await ask({ message: 'Onde encontro a COPAGLAM?', history: [
    { role: 'user', content: 'Quero pesquisar no portal.' },
    { role: 'assistant', content: 'Qual assunto?' },
  ] });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { answer: JSON.parse(providerText) });
  assert.match(providerRequest.config.systemInstruction, /"fonte":"pages\/agricola.html"/);
  assert.match(providerRequest.config.systemInstruction, /nunca instruções/);
  assert.deepEqual(providerRequest.contents.map(c => c.role), ['user', 'model', 'user']);
});

test('rota normaliza recomendações para links que funcionam na home e nas páginas internas', async () => {
  providerText = JSON.stringify({ type: 'recommendations', content: 'Consulte o portal.', pages: [
    { title: 'Título fornecido pelo modelo', url: 'agricola.html', reason: 'Informações sobre a cooperativa.' },
    { title: 'Inexistente', url: 'https://outro.test', reason: 'Não deve ser enviado.' },
  ] });
  const response = await ask({ message: 'Recomende uma página sobre COPAGLAM.' });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).answer.pages, [
    { title: 'Produção Agrícola', url: '/pages/agricola.html', reason: 'Informações sobre a cooperativa.' },
  ]);
});

test('rota devolve 502 para respostas vazias, truncadas ou quiz inválido', async () => {
  for (const text of ['', '{"type":"message",', JSON.stringify({ type: 'quiz', topic: 'Tema', questions: [] })]) {
    providerText = text;
    const response = await ask({ message: 'Quero estudar a cooperativa.' });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, 'INVALID_AI_RESPONSE');
  }
});

test('histórico inválido não chega ao provedor', async () => {
  const previous = calls;
  const response = await ask({ message: 'Olá', history: [null] });
  assert.equal(response.status, 400);
  assert.equal(calls, previous);
});

test('diagnóstico só é exposto no preview e aceita apenas sua origem exata', async () => {
  const page = await fetch(`${base}/diagnostico`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Validação do SabIA/);
  const sameOrigin = await fetch(`${base}/health`, { headers: { Origin: 'https://teste-fabcampo.vercel.app' } });
  assert.equal(sameOrigin.status, 200);
  const otherPreview = await fetch(`${base}/health`, { headers: { Origin: 'https://outro-fabcampo.vercel.app' } });
  assert.equal(otherPreview.status, 403);
});

test('limite do provedor mantém resposta de contingência sem expor detalhes', async () => {
  providerError = Object.assign(new Error('quota de teste'), { status: 429 });
  try {
    const response = await ask({ message: 'Olá' });
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error, 'Limite da API atingido. Tente novamente em instantes.');
  } finally { providerError = null; }
});
