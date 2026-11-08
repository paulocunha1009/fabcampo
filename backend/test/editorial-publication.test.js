import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import express from 'express';
import sharp from 'sharp';
import {createPublicationService,createPublicationRouter,validatePublicArticle} from '../lib/editorial-publication.js';
const id='12345678-1234-4234-8234-123456789abc';
const bytes=await sharp({create:{width:1200,height:675,channels:3,background:'#285e3e'}}).webp().toBuffer();
const hash=createHash('sha256').update(bytes).digest('hex'),path='img/editorial/'+hash+'.webp';
const article={titulo:'Matéria de teste',resumo:'Resumo de teste',texto:'Texto de teste conferido.',local:'Local de teste',fonte:'Equipe de teste',categoria:'Educação',fotos:[{id:'foto-1',imagem:path,capaImagem:path,capa:true,legenda:'Legenda de teste',credito:'Crédito de teste',textoAlternativo:'Descrição de teste'}],pesquisa:'PESQUISA_PRIVADA',pesquisaArquivo:{texto:'ARQUIVO_PRIVADO'}};
function fixture({enabled=true}={}){
  const state={head:'1'.repeat(40),revision:1,writes:[],tree:null,blobs:new Map(),files:new Map([['data/site.json',Buffer.from(JSON.stringify({noticias:[{titulo:'Notícia manual',link:'pages/original.html'}],eventos:[{nome:'Evento manual'}],outro:'preservar'}))]]),race:false,tamper:false};
  let next=10;
  const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});
  const request=async(url,options)=>{
    const api=new URL(url),route=api.pathname.replace('/repos/paulocunha1009/fabcampo',''),method=options.method;
    assert.equal(options.headers.Authorization,'Bearer test-only');
    if(method==='GET'){
      if(route==='/git/ref/heads/master')return response({object:{sha:state.head}});
      if(route==='/git/ref/heads/editorial-rascunhos')return response({object:{sha:'2'.repeat(40)}});
      if(route.startsWith('/git/commits/'))return response({tree:{sha:'3'.repeat(40)}});
      if(route.startsWith('/contents/')){
        const name=route.slice('/contents/'.length),content=name===path?(state.tamper?Buffer.from('alterada'):bytes):state.files.get(name);
        if(!content)return response({},404);
        return response({type:'file',encoding:'base64',content:content.toString('base64'),size:content.length,sha:'4'.repeat(40)});
      }
    }
    const body=JSON.parse(options.body);state.writes.push({route,method,body});
    if(route==='/git/blobs'){const sha=(next++).toString(16).padStart(40,'0');state.blobs.set(sha,Buffer.from(body.content));return response({sha});}
    if(route==='/git/trees'){assert.equal(body.base_tree,'3'.repeat(40));state.tree=body.tree;return response({sha:'5'.repeat(40)});}
    if(route==='/git/commits'){assert.deepEqual(body.parents,[state.head]);return response({sha:'6'.repeat(40)});}
    if(route==='/git/refs/heads/master'){
      assert.equal(body.force,false);if(state.race)return response({},422);
      for(const item of state.tree)if(state.blobs.has(item.sha))state.files.set(item.path,state.blobs.get(item.sha));
      state.head=body.sha;return response({});
    }
    throw new Error('Chamada inesperada: '+method+' '+route);
  };
  const service=createPublicationService({token:'test-only',staging:'editorial-rascunhos',enabled,request,drafts:{get:async()=>({tipo:'noticias',revisao:state.revision,registro:article})},siteRequest:async url=>{
    const file=state.files.get(new URL(url).pathname.slice(1));return {ok:!!file,text:async()=>file.toString(),json:async()=>JSON.parse(file.toString())};
  }});
  return {service,state};
}
test('publicação recusa rascunhos incompletos e nunca inclui a pesquisa privada',()=>{
  assert.ok(!JSON.stringify(validatePublicArticle(article)).includes('PRIVAD'));
  for(const value of [{...article,local:''},{...article,fotos:[]},{...article,fotos:[{...article.fotos[0],credito:''}]},{...article,video:'https://evil.test/x'}])assert.throws(()=>validatePublicArticle(value));
});
test('preparação é somente leitura e flag desligada impede toda escrita',async()=>{
  const {service,state}=fixture({enabled:false});const plan=await service.prepare({id,revisao:1});assert.equal(plan.habilitada,false);assert.equal(state.writes.length,0);
  await assert.rejects(()=>service.publish({...plan,confirmado:true}),error=>error.status===503);assert.equal(state.writes.length,0);
});
test('uma transação Git inclui fotos, página e listas, preserva conteúdo manual e permite repetição segura',async()=>{
  const {service,state}=fixture(),plan=await service.prepare({id,revisao:1});
  const result=await service.publish({...plan,confirmado:true});assert.equal(result.status,'enviada');
  assert.deepEqual(state.tree.map(item=>item.path).sort(),[path,'pages/reportagem-'+id+'.html','data/site.json','data/editorial-publicacoes.json'].sort());
  const site=JSON.parse(state.files.get('data/site.json'));assert.equal(site.noticias[1].titulo,'Notícia manual');assert.equal(site.eventos[0].nome,'Evento manual');assert.equal(site.outro,'preservar');
  for(const file of state.files.values())assert.ok(!file.toString().includes('PESQUISA_PRIVADA')&&!file.toString().includes('ARQUIVO_PRIVADO'));
  const writes=state.writes.length;assert.equal((await service.publish({...plan,confirmado:true})).reutilizada,true);assert.equal(state.writes.length,writes);
  assert.equal((await service.status(id)).status,'publicada');
  const currentSite=state.files.get('data/site.json');const oldNews=JSON.parse(currentSite);oldNews.noticias[0].resumo='Resumo anterior';state.files.set('data/site.json',Buffer.from(JSON.stringify(oldNews)));
  assert.equal((await service.status(id)).status,'aguardando');state.files.set('data/site.json',currentSite);
  state.files.set('pages/reportagem-'+id+'.html',Buffer.from('Outra versão'));assert.equal((await service.status(id)).status,'aguardando');
  await assert.rejects(()=>service.prepare({id,revisao:1}),error=>error.status===409);
});
test('revisão, portal e foto alterados são recusados antes de gravar',async()=>{
  for(const change of ['revision','head','tamper']){
    const {service,state}=fixture(),plan=await service.prepare({id,revisao:1});
    if(change==='revision')state.revision=2;if(change==='head')state.head='7'.repeat(40);if(change==='tamper')state.tamper=true;
    await assert.rejects(()=>service.publish({...plan,confirmado:true}),error=>error.status===409);assert.equal(state.writes.length,0);
  }
});
test('concorrência na atualização da referência não força nem altera a branch',async()=>{
  const {service,state}=fixture(),plan=await service.prepare({id,revisao:1});state.race=true;
  await assert.rejects(()=>service.publish({...plan,confirmado:true}),error=>error.status===409);assert.equal(state.head,'1'.repeat(40));assert.equal(state.files.has('pages/reportagem-'+id+'.html'),false);
});
test('todas as rotas de publicação exigem conta autorizada',async()=>{
  let called=0;const app=express();app.use(createPublicationRouter({auth:{authenticate:async()=>{throw Object.assign(new Error(),{status:403});}},service:{prepare:async()=>called++,publish:async()=>called++,status:async()=>called++}}));
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  try{for(const [method,path] of [['POST','preparar'],['POST','confirmar'],['GET',id]])assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/editorial/publicacoes/${path}`,{method})).status,403);assert.equal(called,0);}finally{await new Promise(resolve=>server.close(resolve));}
});
