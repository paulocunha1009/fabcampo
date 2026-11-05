import assert from 'node:assert/strict';
import { test } from 'node:test';

process.env.VERCEL = '1';
process.env.DOTENV_CONFIG_PATH = '.env.test-not-present';
delete process.env.GEMINI_API_KEY;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
const { createApp } = await import('../server.js');

const item = (link, date = '') => `<item><title>Educação na escola</title><link>${link}</link><pubDate>${date}</pubDate><description>Pesquisa e ensino</description></item>`;
const resposta = xml => ({ ok: true, text: async () => `<rss><channel>${xml}</channel></rss>` });
async function comServidor(options, run) {
  const app = createApp({ aiClient: null, ...options });
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/noticias`;
    await run(async () => {
      const response = await fetch(url);
      assert.equal(response.status, 200);
      return response.json();
    });
  } finally { await new Promise(resolve => server.close(resolve)); }
}

test('notícias sem data não ganham data de hoje; links inseguros e duplicados são descartados', async () => {
  await comServidor({ newsFetch: async () => resposta(
    item('javascript:alert(1)') + item('https://example.org/educacao', 'inválida')
  ) }, async obter => {
    const data = await obter();
    assert.equal(data.noticias.length, 1);
    assert.equal(data.noticias[0].data, '');
    assert.equal(data.noticias[0].link, 'https://example.org/educacao');
    assert.equal(data.stale, false);
  });
});

test('requisições simultâneas compartilham uma consulta por fonte e reutilizam o cache', async () => {
  let chamadas = 0;
  let liberar;
  const espera = new Promise(resolve => { liberar = resolve; });
  await comServidor({ newsFetch: async (_url, options) => {
    chamadas++;
    assert.ok(options.signal);
    await espera;
    return resposta(item('https://example.org/escola', '2026-10-01'));
  } }, async obter => {
    const requests = Array.from({ length: 12 }, () => obter());
    setTimeout(liberar, 100);
    const data = await Promise.all(requests);
    assert.equal(chamadas, 5);
    assert.ok(data.every(x => x.noticias.length === 1));
    assert.equal((await obter()).cached, true);
    assert.equal(chamadas, 5);
  });
});

test('falha das fontes preserva cache vencido e respostas HTTP de erro não viram notícias', async () => {
  let agora = 1000;
  let falhar = true;
  await comServidor({ clock: () => agora, newsFetch: async () => falhar
    ? { ok: false, status: 503, text: async () => { throw new Error('Não deve ler erro como RSS'); } }
    : resposta(item('https://example.org/pesquisa', '2026-10-01'))
  }, async obter => {
    assert.deepEqual((await obter()).noticias, []);
    falhar = false;
    assert.equal((await obter()).noticias.length, 1);
    agora += 31 * 60 * 1000;
    falhar = true;
    const data = await obter();
    assert.equal(data.noticias.length, 1);
    assert.equal(data.cached, true);
    assert.equal(data.stale, true);
  });
});
