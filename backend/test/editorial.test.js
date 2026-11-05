import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { validarRegistro, montarRascunho } from '../../painel/editorial-core.js';

const atual = JSON.parse(readFileSync(new URL('../../data/site.json', import.meta.url), 'utf8'));
const noticia = atual.noticias[0];
const evento = atual.eventos[0];

test('rascunho usa conteúdo existente, preserva a origem e não inclui outras seções do portal', () => {
  const antes = JSON.stringify(atual);
  const result = montarRascunho(atual);
  assert.equal(result.status, 'rascunho');
  assert.equal(result.version, 1);
  assert.equal(result.noticias.length, atual.noticias.length);
  assert.equal(result.eventos.length, atual.eventos.length);
  assert.deepEqual(result.noticias[0], noticia);
  assert.deepEqual(result.eventos[0], evento);
  assert.equal('plantasNativas' in result, false);
  assert.equal(JSON.stringify(atual), antes);
});

test('datas inexistentes e evento sem data são recusados, sem substituir por hoje', () => {
  for(const data of ['2026-02-30', '2026-13-01', 'texto', '2026-1-1']){
    assert.throws(() => validarRegistro('noticias', { ...noticia, data }), error => error.campo === 'data');
  }
  assert.throws(() => validarRegistro('eventos', { ...evento, data:'' }), error => error.campo === 'data');
  assert.equal(validarRegistro('noticias', { ...noticia, data:'' }).data, '');
});

test('links executáveis, com credenciais ou ambíguos não entram no rascunho', () => {
  for(const link of ['javascript:alert(1)', 'data:text/html,x', '//example.test/fora', 'https://usuario:senha@example.test/', 'pages/pagina com espaço.html']){
    assert.throws(() => validarRegistro('noticias', { ...noticia, link }), error => error.campo === 'link');
  }
  assert.equal(validarRegistro('noticias', { ...noticia, link:'pages/historia.html' }).link, 'pages/historia.html');
  assert.equal(validarRegistro('noticias', { ...noticia, link:'https://example.test/fonte' }).link, 'https://example.test/fonte');
});

test('campos ausentes, tipos inesperados e textos excessivos identificam o erro para o editor', () => {
  for(const [campo, valor] of [['titulo',''], ['resumo',{}], ['fonte',''], ['titulo','x'.repeat(161)]]){
    assert.throws(() => validarRegistro('noticias', { ...noticia, [campo]:valor }), error => error.campo === campo);
  }
  for(const value of [null, [], {}, { noticias:[], eventos:{} }]) assert.throws(() => montarRascunho(value));
  assert.throws(() => validarRegistro('outro', noticia));
});

test('categoria controla apresentação e não aceita propriedades herdadas como categorias', () => {
  assert.throws(() => validarRegistro('noticias', { ...noticia, categoria:'__proto__' }));
  const result = validarRegistro('noticias', { ...noticia, categoria:'Tecnologia', classe:'classe-arbitraria', icone:'outro' });
  assert.equal(result.classe, 'badge--tech');
  assert.equal(result.icone, '🤖');
});
