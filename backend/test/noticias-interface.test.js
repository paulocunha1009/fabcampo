import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/noticias.js', import.meta.url), 'utf8')
  .replace('// Inicia após o DOM estar pronto', 'globalThis.newsTest = { formatarData, renderizar, carregarRemoto, obterCache };\n// Inicia após o DOM estar pronto');
function ambiente(fetch, saved = null) {
  const cards = { innerHTML:'' };
  const status = { textContent:'' };
  const context = vm.createContext({
    window:{ PORTAL_AI_ENDPOINT:'https://api.example.org/api/assistente' },
    document:{ readyState:'loading', addEventListener(){}, querySelector:selector => selector.includes('status') ? status : cards },
    localStorage:{ getItem:() => saved, setItem(){} }, fetch, AbortSignal, setTimeout, clearTimeout
  });
  vm.runInContext(source, context);
  return { ...context.newsTest, cards, status };
}

test('datas ausentes ou inválidas não viram data atual nem HTML time inválido', () => {
  const ui = ambiente();
  for(const value of ['', null, 'inválida', '2026-02-30', '2026-13-01']) assert.equal(ui.formatarData(value), '');
  assert.match(ui.formatarData('2026-02-28'), /2026/);
  ui.renderizar([{ titulo:'Pesquisa', data:'' }]);
  assert.match(ui.cards.innerHTML, /Data não informada/);
  assert.ok(!ui.cards.innerHTML.includes('<time'));
});

test('falhas HTTP e dados inesperados preservam notícias já visíveis', async () => {
  for(const response of [{ ok:false, json:async () => ({ noticias:[{ titulo:'Erro' }] }) },
    { ok:true, json:async () => ({ noticias:{ length:1 } }) }]){
    const ui = ambiente(async () => response);
    ui.cards.innerHTML = 'Conteúdo existente';
    await ui.carregarRemoto();
    assert.equal(ui.cards.innerHTML, 'Conteúdo existente');
    assert.match(ui.status.textContent, /Sem atualização externa/);
  }
});

test('última consulta disponível é identificada e links de script não são renderizados', async () => {
  const ui = ambiente(async () => ({ ok:true, json:async () => ({ stale:true, noticias:[
    { titulo:'Educação <script>', link:'javascript:alert(1)', data:'' }
  ] }) }));
  await ui.carregarRemoto();
  assert.match(ui.status.textContent, /última consulta disponível/);
  assert.ok(!ui.cards.innerHTML.includes('javascript:'));
  assert.match(ui.cards.innerHTML, /&lt;script&gt;/);
});

test('cache inválido ou com data futura é ignorado', () => {
  for(const saved of ['{', JSON.stringify({ ts:Date.now()+60000, dados:[{}] }),
    JSON.stringify({ ts:Date.now(), dados:{ length:1 } })]) assert.equal(ambiente(null, saved).obterCache(), null);
});
