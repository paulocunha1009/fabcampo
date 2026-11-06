import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.VERCEL = '1';
// Os testes nunca devem carregar credenciais locais ou acessar serviços pagos.
process.env.DOTENV_CONFIG_PATH = '.env.test-not-present';
delete process.env.GEMINI_API_KEY;
delete process.env.EDITORIAL_GOOGLE_CLIENT_ID;
delete process.env.EDITORIAL_GOOGLE_SUBJECTS;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
process.env.RATE_LIMIT_GLOBAL_MIN = '50';
process.env.RATE_LIMIT_GLOBAL_DAY = '200';
process.env.REQUIRE_PERSISTENT_RATE_LIMIT = 'false';

const { default: app, createApp } = await import('../server.js');
const { createRateLimiter } = await import('../lib/rate-limit.js');
let server;
let baseUrl;

before(async () => {
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
});

test('acesso editorial sem configuração fica fechado e não expõe contas', async () => {
  const response = await fetch(`${baseUrl}/api/editorial/me`);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'O acesso editorial ainda não está disponível.' });
});

test('upload sem acesso configurado não recebe autorização de escrita', async () => {
  const response = await fetch(`${baseUrl}/api/editorial/imagens`, {
    method:'POST',headers:{'Content-Type':'image/webp'},body:Buffer.from('test-only'),
  });
  assert.equal(response.status,503);
});

test('cards verificam acesso antes de consumir a cota Gemini e usam o limitador compartilhado', async () => {
  let allowed = false, calls = 0, limits = 0;
  const texto = 'Trecho de teste para conferir o processamento da reportagem sem acrescentar informações. Este texto será preservado.';
  const editorialApp = createApp({
    editorialAuth:{ authenticate:async()=>{ if(!allowed) throw Object.assign(new Error(),{status:403}); return {id:'test-only'}; } },
    aiClient:{ models:{ generateContent:async options=>{
      calls++; assert.equal(options.config.responseMimeType,'application/json');
      return {text:JSON.stringify({resumo:texto,cards:[{titulo:'Destaque de teste',trecho:texto}]})};
    } } },
    rateLimiter:{ middleware:(_req,_res,next)=>{limits++;next();} },
  });
  const instance = await new Promise(resolve=>{const current=editorialApp.listen(0,'127.0.0.1',()=>resolve(current));});
  try {
    const url = `http://127.0.0.1:${instance.address().port}/api/editorial/cards`;
    const send = ()=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({titulo:'Teste',texto})});
    assert.equal((await send()).status,403); assert.equal(calls,0); assert.equal(limits,0);
    allowed = true;
    const response = await send();
    assert.equal(response.status,200); assert.equal((await response.json()).requiresReview,true);
    assert.equal(calls,1); assert.equal(limits,1);
  } finally { await new Promise(resolve=>instance.close(resolve)); }
});

test('health informa serviço, modelo e limites sem expor segredos', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://fabcampo.com.br' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://fabcampo.com.br');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'fabcampo-api');
  assert.equal(body.assistant.name, 'SabIA');
  assert.match(body.assistant.tagline, /território/);
  assert.equal(body.limits.globalDay, 200);
  assert.equal('apiKey' in body, false);
});

test('CORS bloqueia origem não autorizada', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://origem-invalida.test' },
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, 'ORIGIN_BLOCKED');
});

test('diagnóstico não fica disponível na API padrão de produção', async () => {
  const response = await fetch(`${baseUrl}/diagnostico`);
  assert.equal(response.status, 404);
});

test('rota de IA orienta contingência quando não há chave', async () => {
  const response = await fetch(`${baseUrl}/api/assistente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://fabcampo.com.br' },
    body: JSON.stringify({ message: 'Olá', history: [] }),
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'AI_NOT_CONFIGURED');
});

test('corpo acima do limite é rejeitado', async () => {
  const response = await fetch(`${baseUrl}/api/assistente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'x'.repeat(25_000) }),
  });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).code, 'PAYLOAD_TOO_LARGE');
});

test('pedidos inválidos são rejeitados antes da cota e da geração', async () => {
  for (const path of ['/api/assistente', '/api/atividade']) {
    for (const body of [undefined, 'null', '[]', '{', JSON.stringify({ message: '  ', system: ' ' }),
      JSON.stringify({ message: 'Olá', history: [null], system: ' ' })]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      });
      assert.equal(response.status, 400);
      assert.equal(response.headers.get('x-ratelimit-limit'), null);
    }
  }
  for (const history of [[null], [{ role: 'system', content: 'instrução' }], 'inválido']) {
    const response = await fetch(`${baseUrl}/api/assistente`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Olá', history }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, 'INVALID_REQUEST');
  }
});

test('turma com 40 acessos simultâneos respeita a cota de apresentação e recebe contingência', async () => {
  const previous = {
    perIp: process.env.RATE_LIMIT_PER_IP_MIN,
    globalMinute: process.env.RATE_LIMIT_GLOBAL_MIN,
    globalDay: process.env.RATE_LIMIT_GLOBAL_DAY,
    prefix: process.env.RATE_LIMIT_PREFIX,
  };

  process.env.RATE_LIMIT_PER_IP_MIN = '30';
  process.env.RATE_LIMIT_GLOBAL_MIN = '15';
  process.env.RATE_LIMIT_GLOBAL_DAY = '200';
  process.env.RATE_LIMIT_PREFIX = `fabcampo-test-${Date.now()}`;

  const testLimiter = createRateLimiter();
  let allowed = 0;
  const responses = await Promise.all(Array.from({ length: 40 }, async () => {
    const result = { statusCode: 200, body: null, headers: {} };
    const req = {
      headers: { 'x-forwarded-for': '192.0.2.10' },
      ip: '192.0.2.10',
      socket: { remoteAddress: '192.0.2.10' },
    };
    const res = {
      setHeader(name, value) { result.headers[name] = value; },
      status(code) { result.statusCode = code; return this; },
      json(body) { result.body = body; return this; },
    };
    await testLimiter.middleware(req, res, () => { allowed += 1; });
    return result;
  }));

  assert.equal(allowed, 15);
  assert.equal(responses.filter(item => item.statusCode === 429).length, 25);
  assert.ok(responses.filter(item => item.statusCode === 429)
    .every(item => item.body?.code === 'RATE_LIMITED' && item.headers['Retry-After'] === '60'));

  if (previous.perIp === undefined) delete process.env.RATE_LIMIT_PER_IP_MIN;
  else process.env.RATE_LIMIT_PER_IP_MIN = previous.perIp;
  if (previous.globalMinute === undefined) delete process.env.RATE_LIMIT_GLOBAL_MIN;
  else process.env.RATE_LIMIT_GLOBAL_MIN = previous.globalMinute;
  if (previous.globalDay === undefined) delete process.env.RATE_LIMIT_GLOBAL_DAY;
  else process.env.RATE_LIMIT_GLOBAL_DAY = previous.globalDay;
  if (previous.prefix === undefined) delete process.env.RATE_LIMIT_PREFIX;
  else process.env.RATE_LIMIT_PREFIX = previous.prefix;
});
