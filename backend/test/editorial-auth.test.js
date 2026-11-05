import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEditorialAuth } from '../lib/editorial-auth.js';
import { generateKeyPairSync, sign } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

const now = 1800000000000;
const token = 'Bearer a.b.c';
const claims = { sub: 'google-account-1', email: 'editor@example.test',
  email_verified: true, aud: 'portal-client', iss: 'https://accounts.google.com', exp: now / 1000 + 60 };
function auth(payload = claims, extra = {}) {
  return createEditorialAuth({ clientId: 'portal-client', allowedSubjects: 'google-account-1',
    clock: () => now, verifyIdToken: async options => {
      assert.equal(options.audience, 'portal-client');
      assert.equal(options.idToken, 'a.b.c');
      return { getPayload: () => payload };
    }, ...extra });
}

test('editorial nega tudo sem configuração completa, sem consultar Google', async () => {
  for (const config of [{ clientId: '', allowedSubjects: 'one' }, { clientId: 'client', allowedSubjects: ' , ' }]) {
    const gate = createEditorialAuth({ ...config, verifyIdToken: () => assert.fail('não consultar') });
    assert.equal(gate.configured, false);
    await assert.rejects(gate.authenticate(token), { status: 503 });
  }
});

test('editorial exige Bearer válido e nunca aceita e-mail digitado como prova', async () => {
  for (const header of [undefined, '', 'editor@example.test', 'Bearer a.b', 'Basic a.b.c', `${token} extra`]) {
    await assert.rejects(auth().authenticate(header), { status: 401 });
  }
});

test('editorial autoriza somente sub validado, independentemente do nome/e-mail', async () => {
  assert.deepEqual(await auth().authenticate(token), { id: claims.sub, email: claims.email });
  await assert.rejects(auth({ ...claims, sub: 'outro', email: claims.email }).authenticate(token), { status: 403 });
  assert.equal((await auth({ ...claims, email: 'novo@example.test' }).authenticate(token)).id, claims.sub);
});

test('editorial rejeita expiração, emissor, audiência e identidade inválidos', async () => {
  for (const patch of [{ exp: now / 1000 }, { exp: 'future' }, { aud: 'outro-client' },
    { iss: 'https://evil.test' }, { email_verified: false }, { sub: '' }, { email: null }]) {
    await assert.rejects(auth({ ...claims, ...patch }).authenticate(token), { status: 401 });
  }
});

test('editorial não vaza falhas do provedor nem autentica quando verificação falha', async () => {
  await assert.rejects(auth(claims, { verifyIdToken: async () => { throw new Error('segredo-do-provedor'); } })
    .authenticate(token), { status: 401, message: 'EDITORIAL_SIGN_IN_REQUIRED' });
});

test('biblioteca Google valida assinatura real e rejeita token adulterado sem rede', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const client = new OAuth2Client();
  client.getFederatedSignonCertsAsync = async () => ({ certs: {
    teste: publicKey.export({ type: 'spki', format: 'pem' }),
  } });
  const seconds = Math.floor(Date.now() / 1000);
  const payload = { ...claims, iat: seconds, exp: seconds + 300 };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const header = encode({ alg: 'RS256', kid: 'teste' });
  const content = `${header}.${encode(payload)}`;
  const signature = sign('RSA-SHA256', Buffer.from(content), privateKey).toString('base64url');
  const gate = auth(payload, { clock: Date.now, verifyIdToken: options => client.verifyIdToken(options) });
  assert.equal((await gate.authenticate(`Bearer ${content}.${signature}`)).id, claims.sub);
  const forged = `${header}.${encode({ ...payload, sub: 'intruso' })}.${signature}`;
  await assert.rejects(gate.authenticate(`Bearer ${forged}`), { status: 401 });
});
