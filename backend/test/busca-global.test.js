import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/components/busca-global.js', import.meta.url), 'utf8').replace('export function', 'function');
const plantas = JSON.parse(readFileSync(new URL('../../data/plantas.json', import.meta.url), 'utf8'));
const tick = () => new Promise(resolve => setImmediate(resolve));
function ambiente(pathname, provider){
  let dialogo, abrir;
  const requests = [];
  function node(){ return { children:[], events:{}, value:'', open:false,
    setAttribute(){}, addEventListener(t, fn){ this.events[t] = fn; },
    replaceChildren(){ this.children = []; }, append(el){ this.children.push(el); },
    focus(){ this.focado = true; }, showModal(){ this.open = true; }, close(){ this.open = false; this.events.close?.(); }
  }; }
  const campo = node(), status = node(), resultados = node(), fechar = node();
  const header = { querySelector:selector => selector === '.busca-global__abrir' ? abrir : null,
    insertBefore:el => { abrir = el; } };
  const document = { querySelector:() => header, body:{ append(){} }, addEventListener(){},
    createElement:tag => {
      const el = node();
      if(tag === 'dialog') {
        dialogo = el;
        el.querySelector = selector => ({ '#busca-portal':campo, '.busca-global__status':status,
          '.busca-global__resultados':resultados, '.busca-global__fechar':fechar })[selector];
      }
      return el;
    }
  };
  const ui = vm.createContext({ document, window:{ location:{ pathname } },
    AbortSignal:{ timeout:ms => ({ prazo:ms }) }, fetch:(url, options) => { requests.push({ url, options }); return provider(url); } });
  vm.runInContext(source, ui);
  vm.runInContext('iniciarBuscaGlobal()', ui);
  return { requests, campo, status, resultados, dialogo, abrir, fechar,
    buscar(texto){ campo.value = texto; campo.events.input(); } };
}

for(const path of ['/index.html', '/pages/historia.html']){
  test(`busca em ${path} mantém links de páginas, início e contato no endereço correto`, async () => {
    const ui = ambiente(path, async () => ({ ok:true, json:async () => ({ especies:[] }) }));
    await tick();
    for(const [consulta, destino] of [['historia','/pages/historia.html'], ['inicio','/index.html'], ['contato','/contato.html']]){
      ui.buscar(consulta);
      assert.ok(ui.resultados.children.some(n => new URL(n.href, 'https://fabcampo.com.br'+path).pathname === destino));
    }
    assert.equal(ui.requests[0].options.signal.prazo, 5000);
  });
}

test('consulta por nome científico em outra ordem e sem acentos atualiza após carregar as fichas', async () => {
  let liberar;
  const ui = ambiente('/pages/historia.html', () => new Promise(resolve => { liberar = resolve; }));
  ui.buscar('icaco chrysobalanus');
  assert.match(ui.status.textContent, /Carregando/);
  liberar({ ok:true, json:async () => plantas });
  await tick();
  const guajiru = ui.resultados.children.find(n => n.textContent === 'Guajiru');
  assert.ok(guajiru);
  assert.equal(new URL(guajiru.href, 'https://fabcampo.com.br/pages/historia.html').pathname, '/pages/catalogo.html');
  assert.equal(new URL(guajiru.href, 'https://fabcampo.com.br/pages/historia.html').searchParams.get('busca'), 'Guajiru');
  ui.buscar('tecnologia inteligencia');
  assert.ok(ui.resultados.children.some(n => n.textContent === 'IA na Educação'));
});

test('falha do catálogo preserva busca de páginas e reabrir tenta carregar novamente sem duplicar fichas', async () => {
  let chamadas = 0;
  const ui = ambiente('/index.html', async () => {
    chamadas++;
    return chamadas === 1 ? { ok:false } : { ok:true, json:async () => plantas };
  });
  await tick();
  ui.buscar('historia');
  assert.ok(ui.resultados.children.length > 0);
  assert.match(ui.status.textContent, /não puderam ser carregadas/);
  ui.abrir.events.click();
  await tick();
  ui.buscar('Guajiru');
  assert.equal(ui.resultados.children.filter(n => n.textContent === 'Guajiru').length, 1);
  ui.fechar.events.click();
  assert.equal(ui.campo.value, '');
  assert.equal(ui.abrir.focado, true);
  ui.abrir.events.click();
  await tick();
  assert.equal(chamadas, 2);
});

test('catálogo com formato inesperado informa falha e consulta curta ou só pontuação não lista todo o portal', async () => {
  const ui = ambiente('/index.html', async () => ({ ok:true, json:async () => ({ especies:{} }) }));
  await tick();
  ui.buscar('plantas');
  assert.match(ui.status.textContent, /não puderam ser carregadas/);
  for(const texto of ['?', 'é', '---']){
    ui.buscar(texto);
    assert.equal(ui.resultados.children.length, 0);
    assert.match(ui.status.textContent, /duas letras/);
  }
});
