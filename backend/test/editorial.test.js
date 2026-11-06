import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { validarRegistro, montarRascunho, pendenciasPublicacao } from '../../painel/editorial-core.js';

const atual = JSON.parse(readFileSync(new URL('../../data/site.json', import.meta.url), 'utf8'));
const noticia = atual.noticias[0];
const evento = atual.eventos[0];

test('rascunho usa conteúdo existente, preserva a origem e não inclui outras seções do portal', () => {
  const antes = JSON.stringify(atual);
  const result = montarRascunho(atual);
  assert.equal(result.status, 'rascunho');
  assert.equal(result.version, 2);
  assert.equal(result.noticias.length, atual.noticias.length);
  assert.equal(result.eventos.length, atual.eventos.length);
  for(const [campo, valor] of Object.entries(noticia)) assert.deepEqual(result.noticias[0][campo], valor);
  for(const [campo, valor] of Object.entries(evento)) assert.deepEqual(result.eventos[0][campo], valor);
  assert.equal('plantasNativas' in result, false);
  assert.equal(JSON.stringify(atual), antes);
});

test('datas inexistentes são recusadas e datas não confirmadas permanecem em branco no rascunho', () => {
  for(const data of ['2026-02-30', '2026-13-01', 'texto', '2026-1-1']){
    assert.throws(() => validarRegistro('noticias', { ...noticia, data }), error => error.campo === 'data');
  }
  assert.equal(validarRegistro('eventos', { ...evento, data:'' }).data, '');
  assert.ok(pendenciasPublicacao('eventos', { ...evento, data:'' }).includes('data'));
  assert.equal(validarRegistro('noticias', { ...noticia, data:'' }).data, '');
});

test('modelo preserva texto completo e metadados no arquivo, sem preencher informações desconhecidas', () => {
  const texto = 'Primeiro parágrafo.\n\nSegundo parágrafo.';
  const result = montarRascunho({ noticias:[{ ...noticia, texto, local:'Local informado pela equipe', link:'' }], eventos:[] });
  assert.equal(result.noticias[0].texto, texto);
  assert.equal(result.noticias[0].local, 'Local informado pela equipe');
  assert.equal(result.noticias[0].imagem, '');
  assert.deepEqual(pendenciasPublicacao('noticias', result.noticias[0]), []);
});

test('imagem opcional exige crédito, legenda e descrição para seguir à revisão', () => {
  const registro = { ...noticia, texto:'Texto registrado.', local:'Local registrado.', imagem:'img/foto.jpg' };
  assert.deepEqual(pendenciasPublicacao('noticias', registro), ['legenda','credito','textoAlternativo']);
  for(const imagem of ['javascript:alert(1)', '//outro.test/foto.jpg']) {
    assert.throws(() => validarRegistro('noticias', { ...registro, imagem }), e => e.campo === 'imagem');
  }
});

test('evento confere horário e informações práticas sem converter rascunho em publicação', () => {
  assert.throws(() => validarRegistro('eventos', { ...evento, horario:'24:00' }), e => e.campo === 'horario');
  const registro = { ...evento, horario:'09:30', local:'Local informado', publico:'Público informado',
    participacao:'Orientação informada', responsavel:'Equipe informada', contato:'Contato institucional informado' };
  assert.deepEqual(pendenciasPublicacao('eventos', registro), []);
  assert.equal(montarRascunho({ noticias:[], eventos:[registro] }).status, 'rascunho');
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
