import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../../js/catalogo-core.js', import.meta.url),'utf8'), context);
const core = context.CatalogoCore;
const base = core.validarBase(JSON.parse(readFileSync(new URL('../../data/plantas.json', import.meta.url),'utf8')));

test('enigmas não podem revelar nomes populares ou científicos cadastrados', () => {
  for(const planta of base.especies){
    assert.throws(() => core.validarEnigma(`Sou ${planta.nome}.`, planta));
    if(planta.cientifico) for(const nome of planta.cientifico.split('/')) assert.throws(() => core.validarEnigma(`Nome ${nome.trim()}.`,planta));
    assert.doesNotThrow(() => core.validarEnigma(core.enigmaLocal(planta), planta));
  }
  const mangue = base.especies.find(p => p.id === 'mangue-vermelho');
  assert.throws(() => core.validarEnigma('Sou MANGUE VERMELHO!',mangue));
  const grupo = base.especies.find(p => p.id === 'bromelias-cactos');
  assert.throws(() => core.validarEnigma('Somos bromelias.',grupo));
  assert.throws(() => core.validarEnigma('Somos cactos.',grupo));
});
test('respostas vazias, objetos e texto excessivo acionam alternativa local', () => {
  for(const value of ['', '  ', null, {}, 'x'.repeat(1801)]) assert.throws(() => core.validarEnigma(value,base.especies[0]));
});
test('alternativas contêm quatro fichas distintas e a resposta uma única vez', () => {
  for(const planta of base.especies){
    for(const random of [()=>0,()=>0.5,()=>0.999]){
      const options = core.opcoesPara(base.especies, planta, random);
      assert.equal(options.length,4);
      assert.equal(new Set(options.map(p=>p.id)).size,4);
      assert.equal(options.filter(p=>p.id===planta.id).length,1);
    }
  }
});
test('fichas inválidas ou repetidas são recusadas antes da renderização', () => {
  for(const value of [null,{}, {especies:[{}]}, {especies:[base.especies[0],base.especies[0]]}]) assert.throws(()=>core.validarBase(value));
  assert.equal(base.especies.length,9);
  assert.equal(base.especies.filter(p=>p.nativa && p.medicinal).length,1);
});
test('busca tolera acentos e hífens sem alterar o conteúdo das fichas', () => {
  assert.equal(core.normalizar('Carnaúba'),core.normalizar('carnauba'));
  assert.equal(core.normalizar('Mangue-Vermelho'),core.normalizar('mangue vermelho'));
  for(const planta of base.especies){
    const ficha = core.fichaSemNome(planta);
    assert.equal(core.contemNome(ficha.texto,planta),false);
  }
});
