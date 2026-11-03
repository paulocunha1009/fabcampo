import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeAnswer } from '../lib/assistant-answer.js';
import { buildAcervoContext, acervo } from '../lib/acervo.js';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('mensagem normal e JSON duplicado são normalizados', () => {
  const message = { type: 'message', content: 'Resposta do acervo.' };
  assert.deepEqual(normalizeAnswer(JSON.stringify(message)), message);
  assert.deepEqual(normalizeAnswer(JSON.stringify({ type: 'message', content: JSON.stringify(message) })), message);
});

test('respostas vazias, truncadas e quizzes sem gabarito válido são recusados', () => {
  for (const raw of ['', '{}', 'null', '[]', '{"type":"message","content":', '{"type":"message","content":" "}']) {
    assert.throws(() => normalizeAnswer(raw), /INVALID_ASSISTANT_ANSWER/);
  }
  const q = { q: 'Pergunta?', opts: ['a', 'b', 'c', 'd'], correct: 1, explanation: 'Explicação.' };
  assert.equal(normalizeAnswer(JSON.stringify({ type: 'quiz', topic: 'Tema', questions: [q, q] })).questions.length, 2);
  for (const bad of [{ ...q, correct: 5 }, { ...q, correct: '1' }, { ...q, opts: ['a'] }, { ...q, explanation: '' }]) {
    assert.throws(() => normalizeAnswer(JSON.stringify({ type: 'quiz', topic: 'Tema', questions: [q, bad] })));
  }
});

test('recomendações só apontam para páginas conhecidas do portal', () => {
  const raw = pages => JSON.stringify({ type: 'recommendations', content: 'Consulte:', pages });
  const answer = normalizeAnswer(raw([
    { title: 'inventado', url: 'historia.html', reason: 'História' },
    { url: 'https://outro.test/roubar', reason: 'Externo' },
    { url: 'javascript:alert(1)', reason: 'Inválido' },
    { url: 'pagina-inventada.html', reason: 'Inexistente' },
  ]));
  assert.deepEqual(answer.pages, [{ title: 'História', url: '/pages/historia.html', reason: 'História' }]);
  for (const base of ['https://fabcampo.com.br/', 'https://fabcampo.com.br/pages/memoria.html']) {
    assert.equal(new URL(answer.pages[0].url, base).href, 'https://fabcampo.com.br/pages/historia.html');
  }
  assert.throws(() => normalizeAnswer(raw([{ url: '//outro.test', reason: 'Externo' }])));
});

test('consulta seleciona trechos com origem e respeita orçamento de contexto', () => {
  const context = buildAcervoContext('COPAGLAM cooperativa produção');
  assert.match(context, /"fonte":"pages\/agricola.html"/);
  assert.match(context, /COPAGLAM/);
  assert.ok(context.length < 17000);
  assert.match(buildAcervoContext('xyzabcxyz'), /Nenhum trecho relevante/);
});

test('snapshot corresponde aos arquivos públicos atuais e não inclui scripts', () => {
  for (const page of acervo.pages) {
    const path = new URL(`../../${page.url}`, import.meta.url);
    assert.ok(existsSync(path));
    assert.equal(createHash('sha256').update(readFileSync(path, 'utf8').replace(/\r\n/g, '\n')).digest('hex'), page.sha256,
      `Atualize o acervo após editar ${page.url}`);
    assert.ok(page.chunks.length);
    assert.ok(page.chunks.every(chunk => !/<script|gtag\(/.test(chunk.text)));
  }
});
