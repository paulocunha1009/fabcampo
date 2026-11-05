import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('índice público acompanha as páginas de origem e reutiliza os trechos do acervo sem reescrevê-los', () => {
  const indice = JSON.parse(readFileSync(new URL('../../data/busca.json', import.meta.url), 'utf8'));
  const acervo = JSON.parse(readFileSync(new URL('../data/acervo.json', import.meta.url), 'utf8'));
  assert.equal(indice.version, 1);
  assert.equal(indice.pages.length, acervo.pages.length + 1);
  assert.equal(new Set(indice.pages.map(p => p.url)).size, indice.pages.length);
  for(const pagina of indice.pages){
    assert.match(pagina.url, /^pages\/[^/]+\.html$/);
    const texto = readFileSync(new URL('../../'+pagina.url, import.meta.url), 'utf8').replace(/\r\n/g,'\n');
    assert.equal(pagina.sha256, createHash('sha256').update(texto).digest('hex'), pagina.url+' precisa ser reindexada');
    assert.ok(pagina.chunks.length > 0);
    for(const trecho of pagina.chunks){
      assert.equal(typeof trecho.text, 'string');
      assert.equal(typeof trecho.section, 'string');
    }
    const original = acervo.pages.find(p => p.url === pagina.url);
    if(original) assert.deepEqual(pagina, original);
    else assert.equal(pagina.url, 'pages/mudas.html');
  }
});
