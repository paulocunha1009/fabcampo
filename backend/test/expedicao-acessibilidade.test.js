import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pages/expedicao.html', import.meta.url), 'utf8');
function ambiente(){
  let foco;
  const elementos = new Map();
  function element(id){ return { value:'', innerHTML:'', disabled:false, atributos:{}, listeners:{},
    classList:{ add(){} }, setAttribute(k,v){ this.atributos[k] = v; },
    addEventListener(t, fn){ this.listeners[t] = fn; }, focus(){ foco = id; }
  }; }
  const alternativas = [0,1,2,3].map(i => ({ ...element('alternativa-'+i), dataset:{ i:String(i) } }));
  const document = { getElementById(id){
    if(!elementos.has(id)) elementos.set(id, element(id));
    return elementos.get(id);
  }, querySelectorAll:() => alternativas };
  const ui = vm.createContext({ document, atual:{ id:'m1986', local:'1986' }, indice:0,
    respondida:false, operacao:0, estado:{ respostas:{}, perguntas:{} },
    ExpedicaoCore:{ premiar(){} }, salvar(){}, pintarPainel(){}, voltarTrilha(){},
    escaparHTML:v => v, desafio:{ local:true, aberta:'O que você aprendeu?', questoes:[0,1,2].map(() => ({
      pergunta:'Pergunta de teste', opcoes:['Um','Dois','Três','Quatro'], correta:0, porque:'Explicação de teste'
    })) }
  });
  for(const [inicio,fim] of [['function pintarQuestao(){','function concluirEstacao('],
    ['async function avaliarAberta(){','/* =====================================================================']]){
    const start = html.indexOf(inicio);
    vm.runInContext(html.slice(start, html.indexOf(fim,start)), ui);
  }
  return { ui, document, alternativas, foco:() => foco };
}

test('navegação do quiz move foco da pergunta para continuar e depois para a próxima pergunta', () => {
  const { ui, document, alternativas, foco } = ambiente();
  vm.runInContext('pintarQuestao()', ui);
  assert.equal(foco(), 'pergunta-atual');
  assert.match(document.getElementById('tela-desafio').innerHTML, /role="group" aria-labelledby="pergunta-atual"/);
  alternativas[0].listeners.click();
  assert.ok(alternativas.every(a => a.disabled));
  assert.equal(foco(), 'seguir');
  document.getElementById('seguir').listeners.click();
  assert.equal(ui.indice, 1);
  assert.equal(foco(), 'pergunta-atual');
});

test('resposta aberta informa limites, associa pergunta e orientação e indica erros no campo', async () => {
  const { ui, document, foco } = ambiente();
  vm.runInContext('pintarAberta()', ui);
  const markup = document.getElementById('tela-desafio').innerHTML;
  assert.match(markup, /label for="resp-aberta"/);
  assert.match(markup, /aria-describedby="orientacao-resposta"/);
  assert.match(markup, /id="retorno" role="status" aria-live="polite"/);
  const campo = document.getElementById('resp-aberta');
  campo.value = 'Curta';
  await vm.runInContext('avaliarAberta()', ui);
  assert.equal(foco(), 'resp-aberta');
  assert.equal(campo.atributos['aria-invalid'], 'true');
  assert.match(document.getElementById('retorno').innerHTML, /15 caracteres/);
  let concluida = false;
  ui.concluirEstacao = () => { concluida = true; };
  campo.value = 'Resposta com mais de quinze caracteres.';
  await vm.runInContext('avaliarAberta()', ui);
  assert.equal(campo.atributos['aria-invalid'], 'false');
  assert.equal(concluida, true);
});
