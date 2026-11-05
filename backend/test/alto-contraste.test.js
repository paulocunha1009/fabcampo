import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/components/alto-contraste.js', import.meta.url), 'utf8')
  .replace('export function', 'function')
  .replace('import.meta.url', "'https://fabcampo.com.br/js/components/alto-contraste.js'");
function ambiente(preferencia){
  const elementos = [];
  const atributos = new Map();
  const estilos = [];
  const barras = [];
  const media = { matches:preferencia, addEventListener(_tipo, fn){ this.change = fn; } };
  const document = {
    head:{ appendChild:el => estilos.push(el) },
    documentElement:{ toggleAttribute(k, v){ if(v) atributos.set(k, ''); else atributos.delete(k); } },
    querySelector:() => ({ before:el => barras.push(el) }),
    getElementById:id => elementos.find(e => e.id === id),
    createElement:tag => {
      const el = { tag, atributos:{}, children:[], listeners:{},
        setAttribute(k, v){ this.atributos[k] = v; }, getAttribute(k){ return this.atributos[k]; },
        addEventListener(t, fn){ this.listeners[t] = fn; }, appendChild(child){ this.children.push(child); }
      };
      elementos.push(el); return el;
    }
  };
  const ui = vm.createContext({ URL, document, window:preferencia === undefined ? {} : { matchMedia:() => media },
    localStorage:{ setItem(){ assert.fail('Não deve salvar preferências de alunos'); } } });
  vm.runInContext(source, ui);
  vm.runInContext('iniciarAltoContraste()', ui);
  return { ui, document, elementos, atributos, estilos, barras, media, botao:document.getElementById('alternar-contraste') };
}

test('alto contraste alterna com botão nativo e expõe estado e aviso acessíveis sem duplicar controles', () => {
  const { ui, botao, atributos, estilos, barras } = ambiente(false);
  assert.equal(botao.tag, 'button'); assert.equal(botao.type, 'button');
  assert.equal(botao.atributos['aria-pressed'], 'false');
  botao.listeners.click();
  assert.equal(botao.atributos['aria-pressed'], 'true');
  assert.equal(atributos.has('data-alto-contraste'), true);
  assert.match(barras[0].children[1].textContent, /ativado/);
  botao.listeners.click();
  assert.equal(atributos.has('data-alto-contraste'), false);
  assert.match(barras[0].children[1].textContent, /desativado/);
  vm.runInContext('iniciarAltoContraste()', ui);
  assert.equal(barras.length, 1);
  assert.equal(estilos.length, 1);
  assert.equal(estilos[0].href, 'https://fabcampo.com.br/css/alto-contraste.css?v=20261105-1');
});

test('preferência do sistema é respeitada até o visitante escolher manualmente', () => {
  const { botao, media, atributos } = ambiente(true);
  assert.equal(atributos.has('data-alto-contraste'), true);
  media.change({ matches:false });
  assert.equal(atributos.has('data-alto-contraste'), false);
  botao.listeners.click();
  media.change({ matches:false });
  assert.equal(atributos.has('data-alto-contraste'), true);
});

test('navegador sem detecção de preferência também permite ativar alto contraste', () => {
  const { botao, atributos } = ambiente();
  assert.equal(atributos.has('data-alto-contraste'), false);
  botao.listeners.click();
  assert.equal(atributos.has('data-alto-contraste'), true);
});
