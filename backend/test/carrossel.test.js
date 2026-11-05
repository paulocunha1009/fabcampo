import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/components/carrossel.js', import.meta.url), 'utf8').replace('export function', 'function');
function ambiente(reduzido, quantidade = 1){
  function node(){
    return { id:'', attrs:{}, dataset:{}, children:[], events:{}, classes:new Set(),
      setAttribute(k,v){ this.attrs[k] = v; }, getAttribute(k){ return this.attrs[k]; },
      removeAttribute(k){ delete this.attrs[k]; if(k === 'id') this.id = ''; },
      appendChild(child){ this.children.push(child); }, addEventListener(t, fn){ this.events[t] = fn; },
      querySelectorAll:()=>[], before(el){ this.controles = el; },
      cloneNode(){
        const copia = node(); copia.id = this.id;
        copia.children = this.children.map(c => c.cloneNode());
        copia.querySelectorAll = () => copia.children.filter(c => c.id);
        return copia;
      }, get classList(){ return { add:k => this.classes.add(k) }; }
    };
  }
  const galerias = Array.from({ length:quantidade }, () => {
    const galeria = node(), trilha = node(), foto = node(), filho = node();
    foto.id = 'foto-original'; filho.id = 'legenda-original'; foto.children.push(filho);
    trilha.children.push(foto); trilha.closest = () => galeria;
    return { galeria, trilha, foto };
  });
  const media = { matches:reduzido, addEventListener(_t, fn){ this.change = fn; } };
  const ui = vm.createContext({ document:{ querySelectorAll:() => galerias.map(g => g.trilha), createElement:node },
    window:reduzido === undefined ? {} : { matchMedia:() => media } });
  vm.runInContext(source, ui); vm.runInContext('iniciarCarrosseis()', ui);
  return { ui, galerias, media };
}

test('cópias para animação não repetem IDs nem conteúdo para leitor de tela e inicialização é única', () => {
  const { ui, galerias } = ambiente(false);
  const { trilha, foto } = galerias[0];
  const copia = trilha.children[1];
  assert.equal(copia.id, '');
  assert.equal(copia.children[0].id, '');
  assert.equal(copia.attrs['aria-hidden'], 'true');
  assert.equal(copia.attrs.inert, '');
  assert.equal(foto.id, 'foto-original');
  vm.runInContext('iniciarCarrosseis()', ui);
  assert.equal(trilha.children.length, 2);
});

test('botão alterna modo estático e foco na galeria interrompe movimento para navegação por teclado', () => {
  const { galerias } = ambiente(false);
  const galeria = galerias[0].galeria;
  const [botao, aviso] = galeria.controles.children;
  assert.equal(botao.attrs['aria-controls'], galeria.id);
  assert.equal(galeria.attrs.tabindex, '0');
  assert.equal(galeria.dataset.pausado, 'false');
  botao.events.click();
  assert.equal(galeria.dataset.pausado, 'true');
  assert.equal(botao.attrs['aria-pressed'], 'true');
  assert.match(aviso.textContent, /barra de rolagem/);
  botao.events.click();
  assert.equal(galeria.dataset.pausado, 'false');
  galeria.events.focus();
  assert.equal(galeria.dataset.pausado, 'true');
});

test('preferência de movimento reduzido interrompe a galeria e acompanha mudanças do sistema', () => {
  const { galerias, media } = ambiente(true);
  const galeria = galerias[0].galeria;
  const botao = galeria.controles.children[0];
  assert.equal(galeria.dataset.pausado, 'true');
  assert.equal(botao.disabled, true);
  media.change({ matches:false });
  assert.equal(botao.disabled, false);
  assert.equal(galeria.dataset.pausado, 'false');
  galeria.events.focus();
  media.change({ matches:true }); media.change({ matches:false });
  assert.equal(galeria.dataset.pausado, 'true');
});

test('galerias têm controles distintos e funcionam sem detecção de preferência do sistema', () => {
  const { galerias } = ambiente(undefined, 2);
  assert.notEqual(galerias[0].galeria.id, galerias[1].galeria.id);
  galerias[0].galeria.controles.children[0].events.click();
  assert.equal(galerias[0].galeria.dataset.pausado, 'true');
  assert.equal(galerias[1].galeria.dataset.pausado, 'false');
});
