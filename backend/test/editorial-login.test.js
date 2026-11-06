import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGoogleAccess } from '../../painel/google-access.js';

test('entrada envia token somente no cabeçalho, sem cookies ou cache', async () => {
  const states = [];
  const gate = createGoogleAccess({ endpoint: 'https://api.example.test/me', onState: s => states.push(s),
    request: async (url, options) => {
      assert.equal(url, 'https://api.example.test/me');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      assert.equal(options.credentials, 'omit');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.redirect, 'error');
      return { ok: true, json: async () => ({ role: 'editor', account: { id: 'one', email: 'editor@example.test' } }) };
    } });
  await gate.signIn('test-token');
  assert.deepEqual(states.at(-1), { status: 'authorized', email: 'editor@example.test' });
  assert.ok(!JSON.stringify(states).includes('test-token'));
  gate.clear();
  assert.equal(states.at(-1).status, 'signed-out');
});

test('entrada distingue recusas, configuração ausente e falhas', async () => {
  for (const [code, expected] of [[401, 'invalid'], [403, 'denied'], [503, 'unavailable'], [500, 'error']]) {
    let last;
    const gate = createGoogleAccess({ onState: s => { last = s; },
      request: async () => ({ ok: false, status: code }) });
    await gate.signIn('token');
    assert.equal(last.status, expected);
  }
});

test('limpar identificação ignora resposta atrasada e cancela a requisição', async () => {
  let resolve, signal;
  const states = [];
  const gate = createGoogleAccess({ onState: s => states.push(s), request: async (_url, options) => {
    signal = options.signal;
    return new Promise(r => { resolve = r; });
  } });
  const pending = gate.signIn('token');
  gate.clear();
  assert.equal(signal.aborted, true);
  resolve({ ok: true, json: async () => ({ role: 'editor', account: { id: 'one', email: 'editor@example.test' } }) });
  await pending;
  assert.equal(states.at(-1).status, 'signed-out');
  assert.ok(!states.some(s => s.status === 'authorized'));
});

test('entrada nunca considera resposta malformada ou falha de rede como autorização', async () => {
  for (const request of [async () => { throw new Error('network'); },
    async () => ({ ok: true, json: async () => ({ role: 'editor', account: {} }) })]) {
    let last;
    const gate = createGoogleAccess({ request, onState: s => { last = s; } });
    await gate.signIn('token');
    assert.equal(last.status, 'error');
  }
});
