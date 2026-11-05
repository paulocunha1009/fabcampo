import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/components/menu.js', import.meta.url), 'utf8').replace('export function', 'function');
function ambiente(){
  let foco;
  const events = {};
  function node(classes = []){
    const set = new Set(classes);
    return { dataset:{}, attrs:{}, events:{}, children:[], parent:null,
      classList:{ add:k => set.add(k), remove:k => set.delete(k), contains:k => set.has(k), toggle(k, v){ if(v) set.add(k); else set.delete(k); } },
      setAttribute(k,v){ this.attrs[k] = v; }, getAttribute(k){ return this.attrs[k]; }, removeAttribute(k){ delete this.attrs[k]; },
      addEventListener(t,fn){ (this.events[t] ||= []).push(fn); }, focus(){ foco = this; },
      contains(el){ return this === el || this.children.some(c => c.contains(el)); },
      closest(selector){ if(selector === 'a' && this.tag === 'a') return this; return set.has(selector.slice(1)) ? this : this.parent?.closest(selector) || null; }
    };
  }
  const botao = node(['botao-menu']); botao.attrs['aria-expanded'] = 'false';
  const menu = node();
  const grupos = ['plantas','reportagens'].map(nome => {
    const grupo = node(['menu__grupo']);
    const controle = node(['menu__botao-submenu']);
    const submenu = node(['submenu']);
    const link = node(); link.tag = 'a'; link.attrs.href = nome === 'plantas' ? 'catalogo.html' : 'historia.html';
    link.dataset.pageLink = nome === 'plantas' ? 'catalogo' : 'historia';
    controle.parent = grupo; submenu.parent = grupo; link.parent = submenu;
    submenu.children.push(link); grupo.children.push(controle, submenu); grupo.parent = menu;
    grupo.querySelector = selector => selector === '.submenu' ? submenu : controle;
    return { grupo, controle, submenu, link };
  });
  menu.children = grupos.map(g => g.grupo);
  menu.querySelectorAll = selector => selector === 'a' ? grupos.map(g => g.link)
    : selector === '.submenu' ? grupos.map(g => g.submenu)
    : selector === '.menu__botao-submenu' ? grupos.map(g => g.controle)
    : grupos.map(g => g.grupo).filter(g => g.classList.contains('menu__grupo--aberto'));
  const document = { body:{ dataset:{ page:'historia' }, classList:node().classList }, get activeElement(){ return foco; },
    querySelector:selector => selector === '.botao-menu' ? botao : menu };
  const window = { location:{ pathname:'/pages/historia.html' }, innerWidth:1000,
    addEventListener(t,fn){ events[t] = fn; } };
  const ui = vm.createContext({ document, window });
  vm.runInContext(source, ui); vm.runInContext('iniciarMenu()', ui);
  const click = el => { if(el === botao) botao.events.click[0](); else menu.events.click[0]({ target:el }); };
  const escape = () => events.keydown({ key:'Escape', preventDefault(){} });
  return { ui, document, window, botao, menu, grupos, events, click, escape, fora:node() };
}

test('menu inicializa com submenus ocultos, controles associados e página atual marcada sem eventos duplicados', () => {
  const { ui, grupos, botao } = ambiente();
  for(const { controle, submenu } of grupos){
    assert.equal(submenu.hidden, true);
    assert.equal(controle.getAttribute('aria-expanded'), 'false');
    assert.equal(controle.getAttribute('aria-controls'), submenu.id);
  }
  assert.equal(grupos[1].link.getAttribute('aria-current'), 'page');
  vm.runInContext('iniciarMenu()', ui);
  assert.equal(botao.events.click.length, 1);
});

test('Escape fecha primeiro o submenu e depois o menu móvel, devolvendo foco ao controle correspondente', () => {
  const { document, botao, menu, grupos, click, escape, fora } = ambiente();
  click(botao); click(grupos[0].controle);
  grupos[0].link.focus(); escape();
  assert.equal(grupos[0].submenu.hidden, true);
  assert.equal(document.activeElement, grupos[0].controle);
  assert.equal(menu.dataset.open, 'true');
  escape();
  assert.equal(menu.dataset.open, 'false');
  assert.equal(document.activeElement, botao);
  click(botao); fora.focus(); escape();
  assert.equal(menu.dataset.open, 'true');
});

test('sair do grupo fecha o submenu e sair da navegação fecha o menu móvel', () => {
  const { botao, menu, grupos, click, fora } = ambiente();
  click(botao); click(grupos[0].controle);
  menu.events.focusout[0]({ target:grupos[0].link, relatedTarget:grupos[1].controle });
  assert.equal(grupos[0].submenu.hidden, true);
  assert.equal(menu.dataset.open, 'true');
  menu.events.focusout[0]({ target:grupos[1].controle, relatedTarget:botao });
  assert.equal(menu.dataset.open, 'true');
  click(botao);
  assert.equal(menu.dataset.open, 'false');
  click(botao);
  menu.events.focusout[0]({ target:grupos[1].controle, relatedTarget:fora });
  assert.equal(menu.dataset.open, 'false');
});

test('limite de largura acompanha o CSS e a troca para desktop não deixa foco em link oculto', () => {
  const { window, document, botao, menu, grupos, events, click } = ambiente();
  click(botao); click(grupos[0].controle); grupos[0].link.focus();
  window.innerWidth = 1100; events.resize();
  assert.equal(menu.dataset.open, 'true');
  assert.equal(grupos[0].submenu.hidden, false);
  window.innerWidth = 1181; events.resize();
  assert.equal(menu.dataset.open, 'false');
  assert.equal(grupos[0].submenu.hidden, true);
  assert.equal(document.activeElement, grupos[0].controle);
});
