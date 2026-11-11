import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {descreverEstadoEdicao} from '../../painel/estado-edicao.mjs';
const source=(await readFile(new URL('../../painel/rascunhos.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export function obterVinculoPublicacao','function obterVinculoPublicacao');
class Element{
 listeners={};dataset={};children=[];value='';hidden=true;disabled=false;textContent='';
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
 emit(type){for(const fn of this.listeners[type]||[])fn();}
 click(){this.emit('click');}replaceChildren(...children){this.children=children;}focus(){}
}
test('salvamento confirmado, nova edição e atualização da prévia mantêm estados corretos',async()=>{
 const nodes=new Map(),doc=new Element(),type={dataset:{tipo:'noticias'}};
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 doc.getElementById=get;doc.querySelector=()=>type;
 let registro={titulo:'Texto inicial'},revision=0;
 const context={document:doc,EDITORIAL_API:'https://example.test/me',descreverEstadoEdicao,AbortSignal,crypto,Option:class{},queueMicrotask,requestAuthorizedAction:fn=>fn('fixture-only'),obterRegistroAtual:()=>({tipo:'noticias',registro}),fetch:async()=>({ok:true,json:async()=>({id:'12345678-1234-4234-8234-123456789abc',revisao:++revision,status:'rascunho'})})};
 // O UUID é fixo só neste teste e nenhuma chamada externa é executada.
 context.crypto={randomUUID:()=> '12345678-1234-4234-8234-123456789abc'};
 vm.runInNewContext(source,context);
 assert.equal(get('estado-edicao-atual').dataset.estado,'novo');
 get('salvar-no-painel').click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(get('estado-edicao-atual').dataset.estado,'salvo');
 registro={titulo:'Texto revisado'};get('editorial-form').emit('input');
 assert.equal(get('estado-edicao-atual').dataset.estado,'pendente');
 get('editorial-form').emit('submit');await new Promise(resolve=>setImmediate(resolve));
 assert.equal(get('estado-edicao-atual').dataset.estado,'pendente');
 get('salvar-no-painel').click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(get('estado-edicao-atual').dataset.estado,'salvo');
 assert.match(get('estado-edicao-atual').textContent,/Revisão 2/);
});
