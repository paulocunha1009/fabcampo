import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { createImageStore, normalizeEditorialImage } from '../lib/editorial-images.js';

const image = () => sharp({ create:{ width:1200,height:675,channels:3,background:'#206f3b' } });
test('upload confere WebP real, tamanho e dimensões, removendo metadados', async () => {
  const original = await image().withMetadata().webp().toBuffer();
  const normalized = await normalizeEditorialImage(original);
  const metadata = await sharp(normalized).metadata();
  assert.equal(metadata.width,1200); assert.equal(metadata.height,675);
  assert.equal(metadata.format,'webp'); assert.equal(metadata.exif,undefined);
  for(const bytes of [Buffer.from('não é imagem'), Buffer.alloc(1024*1024+1),
    await image().jpeg().toBuffer(), await image().resize(600,338).webp().toBuffer()]) {
    await assert.rejects(normalizeEditorialImage(bytes), { status:400 });
  }
});
test('upload nunca aceita branches de publicação ou configuração ausente', async () => {
  for(const branch of ['', 'main', 'master', '../editorial-test', 'editorial-test/fora']) {
    const store = createImageStore({ token:'test-only',branch,request:()=>assert.fail('sem rede') });
    assert.equal(store.configured,false);
    await assert.rejects(store.save(Buffer.from('test')), { status:503 });
  }
});
test('upload grava só imagem identificada pelo conteúdo, no repositório e branch fixados', async () => {
  const bytes = await image().webp().toBuffer();
  const calls = [];
  const store = createImageStore({ token:'test-only',branch:'editorial-rascunhos',request:async (url, options) => {
    calls.push({url, options}); return { ok:options.method === 'PUT',status:options.method === 'PUT' ? 201:404 };
  } });
  const result = await store.save(bytes);
  assert.match(result.path,/^img\/editorial\/[a-f0-9]{64}\.webp$/);
  assert.equal(result.status,'rascunho'); assert.equal(calls.length,2);
  const body = JSON.parse(calls[1].options.body);
  assert.equal(body.branch,'editorial-rascunhos');
  assert.equal(body.content,bytes.toString('base64'));
  assert.match(calls[1].url,/repos\/paulocunha1009\/fabcampo\/contents\/img\/editorial\//);
  assert.ok(!('sha' in body));
});
test('upload reutiliza a mesma imagem e recusa sobrescrever conteúdo diferente', async () => {
  const bytes = Buffer.from('test image');
  const sha = createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex');
  for(const [existingSha, expected] of [[sha,true],['different',false]]) {
    let calls = 0;
    const store = createImageStore({ token:'test-only', branch:'editorial-rascunhos', request:async () => {
      calls++; return { ok:true,json:async()=>({sha:existingSha}) };
    } });
    if(expected) assert.equal((await store.save(bytes)).status,'rascunho');
    else await assert.rejects(store.save(bytes), {status:409});
    assert.equal(calls,1);
  }
});
