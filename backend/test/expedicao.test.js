import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../../js/expedicao-core.js', import.meta.url), 'utf8'), context);
const { validarDesafio, normalizarEstado, premiar } = context.ExpedicaoCore;
const ids = ['m1986', 'm1987', 'm1991'];
const question = { pergunta:'Qual o título desta parada?', opcoes:['Terra','Escola','Cooperativa','Cultura'], correta:0, porque:'Confira o título na trilha.' };
const valid = { questoes:[question,question,question], aberta:'O que você aprendeu com o acervo?' };

test('Expedição aceita apenas três questões completas e gabaritos válidos', () => {
  assert.equal(validarDesafio(JSON.stringify(valid)).questoes.length, 3);
  assert.equal(validarDesafio('```json\n'+JSON.stringify(valid)+'\n```').questoes.length, 3);
  for(const invalid of [null, {}, { ...valid, questoes:[] }, { ...valid, aberta:'' },
    { ...valid, questoes:[question,question,{ ...question, correta:'0' }] },
    { ...valid, questoes:[question,question,{ ...question, correta:4 }] },
    { ...valid, questoes:[question,question,{ ...question, opcoes:['Terra','terra','Escola','Cultura'] }] },
    { ...valid, questoes:[question,question,{ ...question, porque:'' }] }]) {
    assert.throws(() => validarDesafio(JSON.stringify(invalid)));
  }
});

test('progresso corrompido é recuperado sem quebrar a trilha', () => {
  for(const value of [null, [], 'texto', { sementes:'10', feitas:7, registro:{} }]) {
    const state = normalizarEstado(value, ids);
    assert.equal(state.sementes, 0);
    assert.equal(state.feitas.length, 0);
    assert.equal(state.registro, '');
  }
  const state = normalizarEstado({ sementes:15, feitas:['m1986','m1986','inexistente'], registro:'registro antigo' }, ids);
  assert.equal(state.sementes, 15);
  assert.equal(state.feitas.length, 1);
  assert.equal(state.registro, 'registro antigo');
});

test('repetir questões ou conclusão não duplica sementes e memória não recebe pontuação', () => {
  let state = normalizarEstado(null, ids);
  assert.equal(premiar(state, 'm1986', 0, false), true);
  assert.equal(premiar(state, 'm1986', 0, false), false);
  assert.equal(premiar(state, 'm1986', 'aberta', false), true);
  assert.equal(premiar(state, 'm1986', 'aberta', false), false);
  state = normalizarEstado(JSON.parse(JSON.stringify(state)), ids);
  assert.equal(premiar(state, 'm1986', 0, false), false);
  state.feitas.push('m1986');
  assert.equal(premiar(state, 'm1986', 1, false), false);
  assert.equal(premiar(state, 'm1987', 0, true), false);
  assert.equal(premiar(state, 'm1987', 'aberta', true), false);
  assert.equal(state.sementes, 15);
});
