import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

process.env.VERCEL = '1';
process.env.RATE_LIMIT_GLOBAL_MIN = '50';
process.env.RATE_LIMIT_GLOBAL_DAY = '200';
process.env.REQUIRE_PERSISTENT_RATE_LIMIT = 'false';

const { default: app } = await import('../server.js');
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

test('health informa serviço, modelo e limites sem expor segredos', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: 'https://fabcampo.com.br' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://fabcampo.com.br');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, 'fabcampo-api');
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

test('turma com 40 acessos simultâneos respeita a cota gratuita e recebe contingência', async () => {
  const previous = {
    perIp: process.env.RATE_LIMIT_PER_IP_MIN,
    globalMinute: process.env.RATE_LIMIT_GLOBAL_MIN,
    globalDay: process.env.RATE_LIMIT_GLOBAL_DAY,
    prefix: process.env.RATE_LIMIT_PREFIX,
  };

  process.env.RATE_LIMIT_PER_IP_MIN = '30';
  process.env.RATE_LIMIT_GLOBAL_MIN = '10';
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

  assert.equal(allowed, 10);
  assert.equal(responses.filter(item => item.statusCode === 429).length, 30);
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
