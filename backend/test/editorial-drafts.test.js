import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createDraftStore, createDraftRouter, validateDraftInput } from '../lib/editorial-drafts.js';
const id='12345678-1234-1234-1234-123456789abc';
const input={id,tipo:'noticias',revisao:0,registro:{titulo:'Rascunho de teste',texto:'Conteúdo de teste',fotos:[]}};

test('rascunho recusa dados inválidos, excesso de fotos e arquivo embutido grande',()=>{
  for(const value of [null,{}, {...input,tipo:'outro'}, {...input,revisao:-1}, {...input,id:'../fora'},
    {...input,registro:{...input.registro,fotos:Array(11).fill({})}},
    {...input,registro:{...input.registro,texto:'x'.repeat(128*1024+1)}}])assert.throws(()=>validateDraftInput(value));
  const clean=validateDraftInput({...input,registro:{...input.registro,segredo:'não armazenar'}});
  assert.ok(!('segredo' in clean.registro));
});

test('salvamento sem armazenamento configurado não informa sucesso nem usa memória como persistência',async()=>{
  const store=createDraftStore({redis:null});
  for(const operation of [()=>store.save(input),()=>store.list(),()=>store.get(id)])await assert.rejects(operation(),{status:503});
});

test('conflito de revisão e limite de rascunhos preservam documento enviado',async()=>{
  const before=JSON.stringify(input);
  for(const result of [-1,-2]){
    const store=createDraftStore({redis:{eval:async()=>result}});
    await assert.rejects(store.save(input),{status:409});
  }
  assert.equal(JSON.stringify(input),before);
});

test('confirmar salvamento exige revisão válida e retorna somente rascunho',async()=>{
  const store=createDraftStore({clock:()=>0,redis:{eval:async(_script,keys,args)=>{
    assert.equal(keys.length,2);assert.ok(keys.every(key=>key.includes('{editorial-drafts}')));
    assert.equal(args[0],id);assert.equal(args[1],0);
    assert.equal(JSON.parse(args[2]).status,'rascunho');return 1;
  }}});
  const result=await store.save(input);
  assert.equal(result.id,id);assert.equal(result.revisao,1);assert.equal(result.status,'rascunho');
  const broken=createDraftStore({redis:{eval:async()=>null}});
  await assert.rejects(broken.save(input),{status:502});
});

test('listagem e retomada retornam registros privados e normalizam histórico vazio',async()=>{
  const stored={...input,revisao:1,atualizadoEm:'2026-11-06T12:00:00.000Z',historico:{}};
  const store=createDraftStore({redis:{hget:async()=>JSON.stringify(stored),hgetall:async()=>({[id]:JSON.stringify({id,titulo:input.registro.titulo,atualizadoEm:stored.atualizadoEm})})}});
  assert.deepEqual((await store.get(id)).historico,[]);
  assert.equal((await store.list())[0].titulo,input.registro.titulo);
  await assert.rejects(store.get('outro'),{status:400});
});

test('rotas de rascunhos verificam acesso em cada operação e recusam sobrescrita antiga',async()=>{
  let authorized=false,calls=0;
  const app=express();
  app.use(createDraftRouter({auth:{authenticate:async()=>{if(!authorized)throw Object.assign(new Error(),{status:403});}},
    store:{list:async()=>{calls++;return [];},get:async()=>{calls++;return input;},save:async()=>{calls++;throw Object.assign(new Error('Conflito de revisão'),{status:409});}}}));
  const server=await new Promise(resolve=>{const value=app.listen(0,'127.0.0.1',()=>resolve(value));});
  const url=`http://127.0.0.1:${server.address().port}/api/editorial/rascunhos`;
  try{
    for(const suffix of ['', '/'+id])assert.equal((await fetch(url+suffix)).status,403);
    assert.equal((await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)})).status,403);
    assert.equal(calls,0);
    authorized=true;
    assert.deepEqual(await (await fetch(url)).json(),{rascunhos:[]});
    const conflict=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
    assert.equal(conflict.status,409);assert.equal((await conflict.json()).error,'Conflito de revisão');
  }finally{await new Promise(resolve=>server.close(resolve));}
});
