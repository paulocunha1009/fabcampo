import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const script=(await readFile(new URL('../../painel/reportagem.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'');
class Element {
  value='';hidden=false;disabled=false;textContent='';children=[];listeners={};
  addEventListener(type,fn){this.listeners[type]=fn;}
  dispatchEvent(event){this.listeners[event.type]?.(event);}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  click(){return this.listeners.click?.();}
}
function setup(request){
  const nodes=new Map(),doc=new Element();doc.getElementById=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};doc.createElement=()=>new Element();
  const actions=[];vm.runInNewContext(script,{document:doc,window:new Element(),requestAuthorizedAction:action=>actions.push(action),EDITORIAL_API:'https://api.example.test/me',fetch:request,AbortController,setTimeout,clearTimeout,Event});
  return {get:doc.getElementById,actions,doc};
}
const part=texto=>({texto,fontes:[{id:0,texto:'Trecho original da pesquisa.'}]});
const proposal={titulo:part('Título proposto'),subtitulo:part('Subtítulo proposto'),abertura:part('Abertura proposta'),secoes:[{intertitulo:'Seção',...part('Corpo proposto')}],cards:[],lacunas:['quando'],requiresReview:true};
test('proposta só altera a edição após aplicar e conserva a pesquisa original',async()=>{
  const {get,actions}=setup(async()=>({ok:true,json:async()=>proposal}));
  const pesquisa='Pesquisa original. '.repeat(10);get('pesquisa').value=pesquisa;get('titulo').value='Título anterior';
  get('estruturar-reportagem').click();await actions[0]('test-only');
  assert.equal(get('titulo').value,'Título anterior');assert.equal(get('proposta-reportagem').hidden,false);
  get('aplicar-reportagem').click();assert.equal(get('titulo').value,'Título proposto');assert.equal(get('pesquisa').value,pesquisa);assert.ok(get('texto').value.includes('## Seção'));
});
test('mudança durante a geração e saída da conta impedem aplicação atrasada',async()=>{
  for(const change of ['edit','signout']){
    let finish;const {get,actions,doc}=setup(()=>new Promise(resolve=>{finish=resolve;}));
    get('pesquisa').value='Pesquisa original. '.repeat(10);get('titulo').value='Meu título';
    get('estruturar-reportagem').click();const pending=actions[0]('test-only');
    if(change==='edit')get('titulo').value='Título editado';else doc.dispatchEvent(new Event('editorial-access-cleared'));
    finish({ok:true,json:async()=>proposal});await pending;get('aplicar-reportagem').click();
    assert.equal(get('titulo').value,change==='edit'?'Título editado':'Meu título');assert.equal(get('proposta-reportagem').hidden,true);
  }
});
