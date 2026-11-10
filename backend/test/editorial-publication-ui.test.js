import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=(await readFile(new URL('../../painel/publicacao.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
class Element{listeners={};disabled=false;checked=false;hidden=false;textContent='';addEventListener(type,fn){this.listeners[type]=fn;}click(){return this.listeners.click?.();}scrollIntoView(){}}
function setup({enabled=false,saved=true}={}){
  const nodes=new Map(),actions=[],requests=[],doc=new Element();
  doc.getElementById=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
  const context={document:doc,EDITORIAL_API:'https://api.example.test/api/editorial/me',AbortSignal,requestAuthorizedAction:action=>actions.push(action),obterVinculoPublicacao:()=>{if(!saved)throw new Error('Salve a revisão primeiro.');return {id:'12345678-1234-4234-8234-123456789abc',revisao:1};},fetch:async(url,options)=>{requests.push({url,options});return {ok:true,json:async()=>({id:'12345678-1234-4234-8234-123456789abc',revisao:1,confirmacao:'a'.repeat(64),head:'b'.repeat(40),habilitada:enabled,titulo:'Teste',fotos:1,operacao:url.endsWith('/preparar-retirada')?'retirar':'publicar'})};}};
  vm.runInNewContext(source,context);return {get:doc.getElementById,doc,actions,requests};
}
test('edição sem revisão salva não inicia preparação nem acesso externo',()=>{
  const {get,actions,requests}=setup({saved:false});get('preparar-publicacao').click();assert.equal(actions.length,0);assert.equal(requests.length,0);assert.match(get('estado-publicacao').textContent,/Salve/);
});
test('preparação desativada não libera envio mesmo com confirmação marcada',async()=>{
  const {get,actions,requests}=setup();get('preparar-publicacao').click();await actions[0]('test-only');
  get('revisao-publicacao').checked=true;get('revisao-publicacao').listeners.change();assert.equal(get('confirmar-publicacao').disabled,true);
  get('confirmar-publicacao').click();assert.equal(actions.length,1);assert.equal(requests.length,1);assert.ok(requests[0].url.endsWith('/preparar'));
});
test('nova edição invalida o plano e a confirmação anterior',async()=>{
  const {get,doc,actions,requests}=setup({enabled:true});get('preparar-publicacao').click();await actions[0]('test-only');
  get('revisao-publicacao').checked=true;get('revisao-publicacao').listeners.change();assert.equal(get('confirmar-publicacao').disabled,false);
  get('editorial-form').listeners.input();assert.equal(get('confirmar-publicacao').disabled,true);assert.equal(get('revisao-publicacao').checked,false);
  get('confirmar-publicacao').click();assert.equal(requests.length,1);
});

test('retirada exige preparação própria e confirmação, edição posterior invalida envio',async()=>{
  const {get,actions,requests}=setup({enabled:true});get('preparar-retirada').click();await actions[0]('test-only');
  get('revisao-publicacao').checked=true;get('revisao-publicacao').listeners.change();assert.equal(get('confirmar-publicacao').disabled,true);
  get('confirmar-retirada').click();assert.equal(actions.length,1);
  get('revisao-retirada').checked=true;get('revisao-retirada').listeners.change();assert.equal(get('confirmar-retirada').disabled,false);
  get('editorial-form').listeners.input();assert.equal(get('confirmar-retirada').disabled,true);assert.equal(get('revisao-retirada').checked,false);
  get('confirmar-retirada').click();assert.equal(requests.length,1);assert.ok(requests[0].url.endsWith('/preparar-retirada'));
});
