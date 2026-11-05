import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../js/components/formulario.js', import.meta.url), 'utf8')
  .replace('export function', 'function');
function ambiente(provider = async () => ({ type:'opaque', status:0 })){
  const nomes = ['nome','email','assunto','mensagem','link-arquivos','autorizacao'];
  const erros = Object.fromEntries(nomes.map(id => ['erro-'+id, { textContent:'' }]));
  let foco;
  const campos = Object.fromEntries(nomes.map(id => [id, { id, value:'', checked:false, type:id === 'autorizacao' ? 'checkbox' : 'text', required:id !== 'link-arquivos', attrs:{}, events:{},
    setAttribute(k,v){ this.attrs[k] = v; }, removeAttribute(k){ delete this.attrs[k]; },
    addEventListener(t, fn){ this.events[t] = fn; }, focus(){ foco = id; }
  }]));
  Object.assign(campos.nome, { value:'Teste de formulário' });
  campos.email.value = 'aluno@example.test'; campos.assunto.value = 'Sugestão para o portal';
  campos.mensagem.value = 'Mensagem usada somente nos testes.'; campos.autorizacao.checked = true;
  const botao = { disabled:false, textContent:'Enviar mensagem' };
  const status = { textContent:'' };
  const formulario = { dataset:{ googleFormEndpoint:'https://docs.google.com/forms/d/e/teste/formResponse' }, events:{}, attrs:{},
    querySelector:s => s === '[type="submit"]' ? botao : s === '[aria-invalid="true"]' ? Object.values(campos).find(c => c.attrs['aria-invalid'] === 'true') : campos[s.slice(1)] || erros[s.slice(1)],
    querySelectorAll:() => Object.values(campos), addEventListener(t, fn){ this.events[t] = fn; },
    setAttribute(k,v){ this.attrs[k] = v; }, reset(){ assert.fail('Não deve apagar texto sem confirmar recebimento'); }
  };
  const chamadas = [];
  const ui = vm.createContext({ URL,
    window:{ open(){ assert.fail('Não deve abrir abas automaticamente'); } },
    document:{ querySelector:s => s === '#formContato' ? formulario : s === '#estado-envio' ? status : erros[s.slice(1)] },
    FormData:class { constructor(form){ assert.equal(form, formulario); } },
    AbortSignal:{ timeout:ms => ({ prazo:ms }) },
    fetch:(url, options) => { chamadas.push({ url, options }); return provider(); }
  });
  vm.runInContext(source, ui);
  vm.runInContext('iniciarFormularioContato()', ui);
  return { campos, botao, status, formulario, erros, chamadas, foco:() => foco,
    enviar:() => formulario.events.submit({ preventDefault(){} }) };
}

test('campos inválidos são indicados e primeiro campo recebe foco sem enviar dados', async () => {
  const ui = ambiente();
  ui.campos.nome.value = ''; ui.campos.email.value = 'contato inválido';
  await ui.enviar();
  assert.equal(ui.chamadas.length, 0);
  assert.equal(ui.foco(), 'nome');
  assert.equal(ui.campos.nome.attrs['aria-invalid'], 'true');
  assert.match(ui.erros['erro-nome'].textContent, /Informe seu nome/);
  assert.match(ui.status.textContent, /Revise os campos/);
  ui.campos.nome.events.input();
  assert.equal(ui.erros['erro-nome'].textContent, '');
});

test('tentativa com resposta opaca não declara sucesso nem apaga o texto; envios simultâneos são evitados', async () => {
  let liberar;
  const ui = ambiente(() => new Promise(resolve => { liberar = resolve; }));
  const primeiro = ui.enviar();
  assert.equal(ui.botao.disabled, true);
  assert.equal(ui.formulario.attrs['aria-busy'], 'true');
  await ui.enviar();
  assert.equal(ui.chamadas.length, 1);
  assert.equal(ui.chamadas[0].options.mode, 'no-cors');
  assert.equal(ui.chamadas[0].options.signal.prazo, 15000);
  liberar({ type:'opaque', status:0 });
  await primeiro;
  assert.equal(ui.campos.mensagem.value, 'Mensagem usada somente nos testes.');
  assert.match(ui.status.textContent, /não consegue confirmar/);
  assert.equal(ui.botao.disabled, false);
  assert.equal(ui.botao.textContent, 'Enviar mensagem');
  assert.equal(ui.formulario.attrs['aria-busy'], 'false');
});

test('falha de rede preserva a contribuição e permite nova tentativa sem abrir outra aba', async () => {
  const ui = ambiente(async () => { throw new Error('Falha de rede simulada'); });
  await ui.enviar();
  assert.match(ui.status.textContent, /Não foi possível confirmar/);
  assert.equal(ui.campos.email.value, 'aluno@example.test');
  assert.equal(ui.campos.mensagem.value, 'Mensagem usada somente nos testes.');
  assert.equal(ui.botao.disabled, false);
});

test('telefone com letras ou dígitos excessivos e links inválidos são recusados', async () => {
  for(const contato of ['abc1234567890', '1'.repeat(40)]){
    const ui = ambiente(); ui.campos.email.value = contato;
    await ui.enviar();
    assert.equal(ui.chamadas.length, 0);
    assert.equal(ui.campos.email.attrs['aria-invalid'], 'true');
  }
  for(const link of ['javascript:alert(1)', 'https://dominio..teste{', 'https://usuario:senha@example.test']){
    const ui = ambiente(); ui.campos['link-arquivos'].value = link;
    await ui.enviar(); assert.equal(ui.chamadas.length, 0);
    assert.equal(ui.campos['link-arquivos'].attrs['aria-invalid'], 'true');
  }
});

test('telefone formatado e link público válido continuam aceitos', async () => {
  const ui = ambiente();
  ui.campos.email.value = '+55 (88) 90000-0000';
  ui.campos['link-arquivos'].value = 'https://example.test/documento';
  await ui.enviar();
  assert.equal(ui.chamadas.length, 1);
  assert.equal(ui.campos.email.attrs['aria-invalid'], 'false');
});
