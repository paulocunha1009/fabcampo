import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../pages/expedicao.html', import.meta.url), 'utf8');
const core = readFileSync(new URL('../../js/expedicao-core.js', import.meta.url), 'utf8');
function ambiente(){
  const elementos = new Map();
  const eventos = {};
  const removidas = [];
  const document = { getElementById(id){
    if(!elementos.has(id)) elementos.set(id, {
      textContent:'', value:'', open:false, listeners:{}, atributos:{},
      classList:{ remove(){} }, setAttribute(k, v){ this.atributos[k] = v; },
      replaceChildren(){ this.textContent = ''; }, addEventListener(t, fn){ this.listeners[t] = fn; }
    });
    return elementos.get(id);
  } };
  const ui = vm.createContext({ document, window:{ confirm:() => true, addEventListener:(t, fn) => { eventos[t] = fn; } },
    ESTACOES:[{ id:'m1986', local:'1986', titulo:'Terra' }], CHAVE:'campo-digital-expedicao-v1',
    localStorage:{ removeItem:k => removidas.push(k), getItem(){ assert.fail('Não deve ler dados de outros alunos'); }, setItem(){ assert.fail('Não deve persistir dados'); } },
    operacao:0, guiaOperacao:0, guiaOcupado:false, atual:null, desafio:null, indice:0, respondida:false,
    guia:document.getElementById('guia'), botaoGuia:document.getElementById('guia-abrir'),
    pintarPainel(){}, pintarTrilha(){}, mostrar:(tela, semFoco) => { ui.tela = tela; ui.semFoco = semFoco; }
  });
  vm.runInContext(core, ui);
  let start = html.indexOf('function carregar(){');
  vm.runInContext(html.slice(start, html.indexOf('function salvar(){', start)), ui);
  ui.estado = vm.runInContext('carregar()', ui);
  start = html.indexOf('function encerrarAtividade(');
  vm.runInContext(html.slice(start, html.indexOf('function atualizarConsultaRegistros(){', start)), ui);
  return { ui, document, eventos, removidas };
}

test('encerrar pede confirmação, limpa a atividade inteira e permite o próximo aluno começar do zero', () => {
  const { ui, document, removidas } = ambiente();
  ui.estado.respostas.m1986 = 'Resposta do primeiro aluno';
  ui.estado.perguntas.m1986 = 'Pergunta';
  ui.estado.registro = 'Registro de memória';
  ui.estado.feitas.push('m1986'); ui.estado.sementes = 25;
  ui.estado.premiadas.m1986.aberta = true;
  ui.atual = { id:'m1986' }; ui.desafio = { aberta:'Pergunta' }; ui.indice = 2; ui.respondida = true;
  ui.guiaOcupado = true;
  for(const id of ['tela-estacao', 'tela-desafio', 'lista-registros', 'guia-msgs']) document.getElementById(id).textContent = 'Texto do primeiro aluno';
  document.getElementById('guia-input').value = 'Pergunta não enviada';
  ui.window.confirm = () => false;
  const encerrar = document.getElementById('encerrar-atividade').listeners.click;
  encerrar();
  assert.equal(ui.estado.sementes, 25);
  ui.window.confirm = () => true;
  encerrar();
  assert.equal(ui.estado.sementes, 0);
  assert.equal(ui.estado.registro, '');
  assert.equal(ui.estado.feitas.length, 0);
  assert.equal(Object.keys(ui.estado.respostas).length, 0);
  assert.equal(Object.keys(ui.estado.perguntas).length, 0);
  assert.equal(ui.estado.premiadas.m1986.aberta, false);
  assert.equal(ui.atual, null); assert.equal(ui.desafio, null);
  assert.equal(ui.indice, 0); assert.equal(ui.respondida, false);
  assert.equal(ui.operacao, 1); assert.equal(ui.guiaOperacao, 1);
  assert.equal(ui.guiaOcupado, false);
  for(const id of ['tela-estacao', 'tela-desafio', 'lista-registros', 'guia-msgs']) assert.equal(document.getElementById(id).textContent, '');
  assert.equal(document.getElementById('guia-input').value, '');
  assert.equal(ui.tela, 'tela-trilha');
  assert.ok(removidas.every(k => k === 'campo-digital-expedicao-v1'));
  assert.equal(ui.ExpedicaoCore.premiar(ui.estado, 'm1986', 0, false), true);
  assert.equal(ui.estado.sementes, 5);
});

test('saída e volta pelo histórico não restauram respostas; aviso de saída só ocorre com trabalho presente', () => {
  const { ui, eventos } = ambiente();
  let impedido = false;
  eventos.beforeunload({ preventDefault(){ impedido = true; } });
  assert.equal(impedido, false);
  ui.estado.respostas.m1986 = 'Rascunho';
  eventos.beforeunload({ preventDefault(){ impedido = true; } });
  assert.equal(impedido, true);
  eventos.pagehide();
  assert.equal(Object.keys(ui.estado.respostas).length, 0);
  assert.equal(ui.tela, 'tela-trilha');
  assert.equal(ui.semFoco, true);
  ui.estado.registro = 'Texto restaurado pelo histórico';
  eventos.pageshow({ persisted:true });
  assert.equal(ui.estado.registro, '');
});

test('resposta atrasada do guia não reaparece nem desbloqueia a consulta do próximo aluno', async () => {
  const { ui, document } = ambiente();
  const falas = [];
  const pendentes = [];
  const iniciadas = [];
  ui.REGRA = 'teste';
  ui.msgs = { scrollTop:0, scrollHeight:0 };
  ui.falar = (_quem, texto) => { const fala = { textContent:texto }; falas.push(fala); return fala; };
  ui.lerAcervo = async () => 'Acervo de teste';
  ui.chamarIA = () => new Promise(resolve => { pendentes.push(resolve); iniciadas.shift()?.(); });
  const start = html.indexOf('async function perguntarGuia(){');
  vm.runInContext(html.slice(start, html.indexOf('/* =====================================================================', start)), ui);
  const iniciar = async texto => {
    document.getElementById('guia-input').value = texto;
    const pronta = new Promise(resolve => iniciadas.push(resolve));
    const resultado = vm.runInContext('perguntarGuia()', ui);
    await pronta;
    return { resultado };
  };
  const antiga = await iniciar('Pergunta anterior');
  vm.runInContext('encerrarAtividade(false)', ui);
  const nova = await iniciar('Pergunta do próximo aluno');
  pendentes[0]('Resposta anterior');
  await antiga.resultado;
  assert.equal(falas[1].textContent, 'Consultando o acervo...');
  assert.equal(ui.guiaOcupado, true);
  pendentes[1]('Resposta da nova atividade');
  await nova.resultado;
  assert.equal(falas[3].textContent, 'Resposta da nova atividade');
  assert.equal(ui.guiaOcupado, false);
});

test('devolutiva atrasada de uma resposta aberta não recria registros depois de encerrar', async () => {
  const { ui, document } = ambiente();
  let liberar, avisarInicio;
  const iniciada = new Promise(resolve => { avisarInicio = resolve; });
  ui.atual = { id:'m1986', pagina:'historia.html' };
  ui.desafio = { aberta:'Qual sua reflexão?' };
  ui.REGRA = 'teste'; ui.salvar = () => {};
  ui.lerAcervo = async () => 'Texto do acervo';
  ui.chamarIA = () => new Promise(resolve => { liberar = resolve; avisarInicio(); });
  ui.concluirEstacao = () => assert.fail('Não deve concluir uma sessão encerrada');
  document.getElementById('resp-aberta').value = 'Resposta escrita pelo primeiro aluno.';
  const start = html.indexOf('async function avaliarAberta(){');
  vm.runInContext(html.slice(start, html.indexOf('/* =====================================================================', start)), ui);
  const resultado = vm.runInContext('avaliarAberta()', ui);
  await iniciada;
  vm.runInContext('encerrarAtividade(true)', ui);
  liberar('Devolutiva da atividade anterior');
  await resultado;
  assert.equal(Object.keys(ui.estado.respostas).length, 0);
  assert.equal(ui.estado.sementes, 0);
  assert.equal(ui.estado.feitas.length, 0);
});
