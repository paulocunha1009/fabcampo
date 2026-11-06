import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCardSource, validateCardSuggestions } from '../lib/editorial-cards.js';
const source = { titulo:'Título de teste', texto:'Texto de teste para validar o processamento editorial. Este trecho deve ser preservado sem criar informações externas.' };
test('cards exigem conteúdo suficiente e tratam título/texto como dados', () => {
  assert.deepEqual(validateCardSource(source),source);
  for(const value of [null,{}, { ...source,texto:'curto' }, { ...source,texto:'x'.repeat(12001) }])
    assert.throws(()=>validateCardSource(value));
});
test('cards preservam trechos da reportagem e sempre exigem revisão', () => {
  const value = { resumo:'Texto de teste para validar o processamento editorial.',
    cards:[{titulo:'Destaque',trecho:'Este trecho deve ser preservado sem criar informações externas.'}] };
  const result = validateCardSuggestions(JSON.stringify(value),source);
  assert.equal(result.requiresReview,true);
  assert.equal(result.cards[0].texto,value.cards[0].trecho);
});
test('cards recusam conteúdo acrescentado, saída malformada e excesso de cards', () => {
  const value = { resumo:source.texto,cards:[{titulo:'Destaque',trecho:source.texto}] };
  for(const raw of ['não é JSON', JSON.stringify({...value,resumo:'Uma data e um fato inventados.'}),
    JSON.stringify({...value,cards:[{titulo:'Destaque',trecho:'Outro fato que não está no texto original.'}]}),
    JSON.stringify({...value,cards:Array(4).fill(value.cards[0])})])
    assert.throws(()=>validateCardSuggestions(raw,source));
});
