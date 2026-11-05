import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pages/catalogo.html', import.meta.url), 'utf8');
const dados = JSON.parse(readFileSync(new URL('../../data/plantas.json', import.meta.url), 'utf8'));
function ambiente(chamarIA){
  const elements = new Map();
  let foco;
  let palpites = [];
  function element(id){
    let markup = '';
    return { textContent:'', value:'', disabled:false, listeners:{}, atributos:{}, classList:{ add(){} },
      get innerHTML(){ return markup; }, set innerHTML(v){
        markup = v;
        if(id === 'area-desafio') palpites = [...v.matchAll(/class="palpite" data-id="([^"]+)"/g)].map(m => ({ ...element('palpite'), dataset:{ id:m[1] } }));
      },
      setAttribute(k, v){ this.atributos[k] = v; }, addEventListener(t, fn){ this.listeners[t] = fn; },
      insertAdjacentHTML(_onde, v){ markup += v; }, querySelectorAll:() => palpites,
      focus(){ foco = this; }
    };
  }
  const document = { body:{}, get activeElement(){ return foco || this.body; },
    getElementById(id){ if(!elements.has(id)) elements.set(id, element(id)); return elements.get(id); },
    querySelectorAll:() => [] };
  const math = Object.create(Math); math.random = () => 0;
  const ui = vm.createContext({ document, Math:math, filtro:'todas', BASE:dados, chamarIA,
    escaparHTML:v => String(v).replace(/</g,'&lt;').replace(/>/g,'&gt;') });
  vm.runInContext(readFileSync(new URL('../../js/catalogo-core.js', import.meta.url), 'utf8'), ui);
  const start = html.indexOf('function filtrar(){');
  vm.runInContext(html.slice(start, html.indexOf('async function chamarIA(',start)), ui);
  const botao = document.getElementById('btn-desafio');
  return { ui, document, botao, area:document.getElementById('area-desafio'),
    palpites:() => palpites, iniciar:() => botao.listeners.click.call(botao) };
}

test('busca e filtros do catálogo informam quantidade e ausência de fichas', () => {
  const { ui, document } = ambiente();
  vm.runInContext('pintar()', ui);
  assert.equal(document.getElementById('status-fichas').textContent, dados.especies.length+' fichas encontradas.');
  ui.filtro = 'ambas';
  vm.runInContext('pintar()', ui);
  assert.equal(document.getElementById('status-fichas').textContent, '1 ficha encontrada.');
  document.getElementById('busca').value = 'espécie não cadastrada';
  vm.runInContext('pintar()', ui);
  assert.match(document.getElementById('status-fichas').textContent, /Nenhuma ficha encontrada/);
});

test('modo local anuncia preparo, mostra quatro alternativas e move foco à ficha após o palpite', async () => {
  const { document, botao, area, iniciar, palpites } = ambiente(async () => { throw new Error('Sem IA'); });
  botao.focus();
  const preparando = iniciar();
  assert.equal(area.atributos['aria-busy'], 'true');
  assert.match(document.getElementById('status-desafio').textContent, /Aguarde/);
  await preparando;
  assert.equal(area.atributos['aria-busy'], 'false');
  assert.equal(botao.disabled, false);
  assert.match(document.getElementById('status-desafio').textContent, /modo local/);
  assert.equal(document.activeElement, document.getElementById('enigma-planta'));
  assert.equal(palpites().length, 4);
  const errada = palpites().find(b => b.dataset.id !== dados.especies[0].id);
  errada.listeners.click.call(errada);
  assert.ok(palpites().every(b => b.disabled));
  assert.match(area.innerHTML, /A resposta correta é/);
  assert.equal(document.activeElement, document.getElementById('resultado-palpite'));
  const antes = area.innerHTML;
  errada.listeners.click.call(errada);
  assert.equal(area.innerHTML, antes);
});

test('enigma pronto não tira foco de quem voltou a usar a busca durante a espera', async () => {
  let liberar;
  const { ui, document, botao, iniciar } = ambiente(() => new Promise(resolve => { liberar = resolve; }));
  botao.focus();
  const preparando = iniciar();
  document.getElementById('busca').focus();
  liberar(ui.CatalogoCore.enigmaLocal(dados.especies[0]));
  await preparando;
  assert.equal(document.activeElement, document.getElementById('busca'));
  assert.match(document.getElementById('status-desafio').textContent, /Escolha uma das quatro plantas/);
});

test('fichas insuficientes geram aviso sem enviar consulta à IA', async () => {
  const { ui, document, iniciar } = ambiente(() => assert.fail('Não deve chamar IA'));
  ui.BASE = { especies:[] };
  await iniciar();
  assert.match(document.getElementById('status-desafio').textContent, /pelo menos 4 fichas/);
});
