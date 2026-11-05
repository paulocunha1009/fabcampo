import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function ambiente(client){
  const pendentes = [];
  const eventos = {};
  function node(){
    return { textContent:'', innerHTML:'', value:'', style:{}, dataset:{}, atributos:{}, listeners:{}, children:[],
      classList:{ toggle(){} }, setAttribute(k, v){ this.atributos[k] = v; },
      addEventListener(t, fn){ this.listeners[t] = fn; }, focus(){ this.focado = true; },
      appendChild(child){ this.children.push(child); }, replaceChildren(){ this.children = []; },
      removeChild(child){ const i = this.children.indexOf(child); assert.ok(i >= 0); this.children.splice(i, 1); }
    };
  }
  const elements = new Map();
  const tabs = ['chat', 'quiz', 'explorar'].map(modo => { const tab = node(); tab.dataset.modo = modo; return tab; });
  const chat = { dataset:{ open:'true' }, querySelector:selector => {
    if(!elements.has(selector)) elements.set(selector, node());
    return elements.get(selector);
  }, querySelectorAll:selector => selector.includes('tab') ? tabs : [] };
  const provider = (_message, history) => new Promise((resolve, reject) => {
    pendentes.push({ resolve, reject, history:JSON.stringify(history) });
  });
  const sandbox = { provider, perguntarAssistente:provider,
    document:{ readyState:'loading', addEventListener(){}, createElement:node },
    window:{ addEventListener:(t, fn) => { eventos[t] = fn; }, location:{ pathname:'/', href:'https://fabcampo.com.br/', origin:'https://fabcampo.com.br' } }
  };
  let source = readFileSync(new URL(client === 'standalone' ? '../../js/chat-standalone.js' : '../../js/components/chat-widget.js', import.meta.url), 'utf8');
  const expor = 'globalThis.chatTest = { enviar, vincularEventos, estado:() => ({ historico, aguardando, modoAtivo }) };';
  if(client === 'standalone') source = source.replace('  // ── Inicia quando o DOM estiver pronto', 'perguntarAssistente = globalThis.provider;\n' + expor + '\n  // ── Inicia quando o DOM estiver pronto');
  else source = source.replace(/^import .*;\r?\n/m, '').replace('export function', 'function') + '\n' + expor;
  const context = vm.createContext(sandbox);
  vm.runInContext(source, context);
  context.chatTest.vincularEventos(chat);
  return { api:context.chatTest, chat, tabs, pendentes, eventos,
    mensagens:chat.querySelector('.ai-chat__mensagens'), campo:chat.querySelector('#ai-chat-pergunta') };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

for(const client of ['standalone', 'module']){
  for(const falha of [false, true]){
    test(`${client}: nova conversa ignora ${falha ? 'falha' : 'resposta'} antiga sem misturar históricos`, async () => {
      const { api, chat, tabs, pendentes, mensagens, campo, eventos } = ambiente(client);
      tabs[1].listeners.click();
      campo.value = 'Rascunho anterior';
      api.enviar('Pergunta do aluno anterior', mensagens, campo);
      assert.equal(pendentes.length, 1);
      chat.querySelector('.ai-chat__nova').listeners.click();
      assert.equal(api.estado().historico.length, 0);
      assert.equal(api.estado().modoAtivo, 'chat');
      assert.equal(campo.value, '');
      assert.equal(campo.focado, true);
      assert.equal(mensagens.children.length, 1);
      api.enviar('Pergunta do novo aluno', mensagens, campo);
      assert.equal(pendentes[1].history, '[]');
      if(falha) pendentes[0].reject(new Error('Falha anterior'));
      else pendentes[0].resolve({ type:'message', content:'Resposta anterior' });
      await tick();
      assert.equal(api.estado().aguardando, true);
      assert.ok(!mensagens.children.some(n => /Resposta anterior|Falha anterior|Pergunta do aluno anterior/.test(n.textContent)));
      pendentes[1].resolve({ type:'message', content:'Resposta para o novo aluno' });
      await tick();
      assert.equal(api.estado().aguardando, false);
      assert.equal(api.estado().historico.length, 2);
      assert.equal(api.estado().historico[0].content, 'Pergunta do novo aluno');
      eventos.pagehide();
      assert.equal(api.estado().historico.length, 0);
      assert.equal(chat.dataset.open, 'false');
      assert.equal(mensagens.children.length, 1);
      eventos.pageshow({ persisted:true });
      assert.ok(!mensagens.children.some(n => n.textContent.includes('novo aluno')));
    });
  }
}
