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
function fixture({enabled=true,record=article}={}){
  const state={head:'1'.repeat(40),revision:1,writes:[],tree:null,blobs:new Map(),files:new Map([['data/site.json',Buffer.from(JSON.stringify({noticias:[{titulo:'Notícia manual',link:'pages/original.html'}],eventos:[{nome:'Evento manual'}],outro:'preservar'}))]]),race:false,tamper:false,trash:false};
  let next=10;
  state.files.set('data/busca.json',Buffer.from(JSON.stringify({version:1,pages:[{title:'Página manual',url:'pages/manual.html',chunks:[]}]})));
  state.files.set('sitemap.xml',Buffer.from('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://fabcampo.com.br/pages/manual.html</loc></url></urlset>'));
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
  const service=createPublicationService({token:'test-only',staging:'editorial-rascunhos',enabled,request,drafts:{get:async()=>({tipo:'noticias',revisao:state.revision,registro:record,lixeira:state.trash}),setTrash:async(input,value)=>{state.trash=value;return {id:input.id,revisao:input.revisao,lixeira:value};}},siteRequest:async url=>{
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
  assert.deepEqual(state.tree.map(item=>item.path).sort(),[path,'pages/reportagem-'+id+'.html','data/site.json','data/busca.json','sitemap.xml','data/editorial-publicacoes.json'].sort());
  const site=JSON.parse(state.files.get('data/site.json'));assert.equal(site.noticias[1].titulo,'Notícia manual');assert.equal(site.eventos[0].nome,'Evento manual');assert.equal(site.outro,'preservar');
  const search=JSON.parse(state.files.get('data/busca.json'));assert.equal(search.pages[0].title,'Página manual');assert.equal(search.pages[1].url,'pages/reportagem-'+id+'.html');assert.ok(state.files.get('sitemap.xml').toString().includes('pages/manual.html'));
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
  try{for(const [method,path] of [['POST','preparar'],['POST','confirmar'],['POST','preparar-retirada'],['POST','retirar'],['POST','lixeira'],['POST','restaurar'],['GET','acervo/catalogo'],['POST','acervo/abrir'],['POST','acervo/salvar'],['POST','acervo/previa'],['GET',id]])assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/editorial/publicacoes/${path}`,{method})).status,403);assert.equal(called,0);}finally{await new Promise(resolve=>server.close(resolve));}
});

test('retirada é reversível, preserva rascunho/fotos e remove apenas entradas próprias',async()=>{
  const {service,state}=fixture();await service.publish({...await service.prepare({id,revisao:1}),confirmado:true});
  const before=state.writes.length,plan=await service.prepareWithdrawal({id,revisao:1});assert.equal(state.writes.length,before);
  assert.equal(plan.operacao,'retirar');
  await service.withdraw({...plan,confirmado:true});
  const html=state.files.get('pages/reportagem-'+id+'.html').toString();assert.match(html,/Reportagem indisponível/);assert.ok(!html.includes(article.texto));
  const site=JSON.parse(state.files.get('data/site.json'));assert.equal(site.noticias.length,1);assert.equal(site.noticias[0].titulo,'Notícia manual');assert.equal(site.eventos[0].nome,'Evento manual');
  assert.equal(JSON.parse(state.files.get('data/busca.json')).pages.length,1);assert.ok(!state.files.get('sitemap.xml').toString().includes('reportagem-'+id));
  assert.ok(state.tree.every(item=>item.sha!==null&&!item.path.startsWith('img/')));
  assert.equal((await service.status(id)).status,'retirada');
  const writes=state.writes.length;assert.equal((await service.withdraw({...plan,confirmado:true})).reutilizada,true);assert.equal(state.writes.length,writes);
  const republish=await service.prepare({id,revisao:1});assert.equal(republish.operacao,'republicar');await service.publish({...republish,confirmado:true});assert.equal((await service.status(id)).status,'publicada');
});

test('retirada recusa alterações de revisão, portal, página e confirmação sem avançar a branch',async()=>{
  for(const change of ['revision','head','page','confirmation','race']){
    const {service,state}=fixture();await service.publish({...await service.prepare({id,revisao:1}),confirmado:true});
    const plan=await service.prepareWithdrawal({id,revisao:1}),before=state.head;
    if(change==='revision')state.revision=2;if(change==='head')state.head='7'.repeat(40);
    if(change==='page')state.files.set('pages/reportagem-'+id+'.html',Buffer.from('Edição manual'));
    if(change==='race')state.race=true;
    const writes=state.writes.length;
    await assert.rejects(()=>service.withdraw({...plan,confirmado:change!=='confirmation'}),error=>[400,409].includes(error.status));
    if(change!=='race')assert.equal(state.writes.length,writes);
    assert.equal(state.head,change==='head'?'7'.repeat(40):before);
  }
  const {service,state}=fixture({enabled:false});await assert.rejects(()=>service.withdraw({id,revisao:1}),error=>error.status===503);assert.equal(state.writes.length,0);
});

test('conferência de retirada aguarda atualização das notícias, busca e sitemap',async()=>{
  const {service,state}=fixture();await service.publish({...await service.prepare({id,revisao:1}),confirmado:true});
  const old=new Map(state.files);await service.withdraw({...await service.prepareWithdrawal({id,revisao:1}),confirmado:true});
  for(const name of ['data/site.json','data/busca.json','sitemap.xml']){
    const current=state.files.get(name);state.files.set(name,old.get(name));assert.equal((await service.status(id)).status,'aguardando');state.files.set(name,current);
  }
  assert.equal((await service.status(id)).status,'retirada');
});

test('edição do acervo preserva página original e endereço, sem copiar imagens ou duplicar notícia',async()=>{
 const source='<html><head><title>Original</title></head><body><header>Menu fixo</header><main><article><h1>Título original</h1><p>Texto original com <strong>ênfase</strong>.</p><table><tr><td>Dado</td></tr></table><img src="../img/foto.jpg"></article></main><footer>Rodapé fixo</footer></body></html>';
 const legacyPath='pages/reportagem-educacao.html',baseHash=createHash('sha256').update(source).digest('hex');
 const raw=createHash('sha256').update('acervo:'+legacyPath).digest('hex').slice(0,32),legacyId=[raw.slice(0,8),raw.slice(8,12),raw.slice(12,16),raw.slice(16,20),raw.slice(20)].join('-');
 const record={titulo:'Título original',acervo:{path:legacyPath,original:source,baseHash,edicoes:[{indice:1,texto:'Texto revisado com'}]}};
 const {service,state}=fixture({record});state.files.set(legacyPath,Buffer.from(source));
 state.files.set('data/site.json',Buffer.from(JSON.stringify({noticias:[{titulo:'Chamada antiga',resumo:'Resumo existente',link:legacyPath},{titulo:'Outra',link:'pages/outra.html'}],eventos:[]})));
 const plan=await service.prepare({id:legacyId,revisao:1});assert.equal(plan.path,legacyPath);assert.equal(plan.operacao,'atualizar');assert.equal(state.writes.length,0);
 await service.publish({...plan,confirmado:true});const html=state.files.get(legacyPath).toString();assert.match(html,/Texto revisado com <strong>ênfase/);assert.match(html,/<table>/);assert.match(html,/Rodapé fixo/);assert.match(html,/Menu fixo/);assert.ok(state.tree.every(item=>!item.path.startsWith('img/')));
 const news=JSON.parse(state.files.get('data/site.json')).noticias;assert.equal(news.length,2);assert.equal(news[0].link,legacyPath);assert.equal(news[0].resumo,'Resumo existente');assert.equal((await service.status(legacyId)).status,'publicada');
 state.files.set(legacyPath,Buffer.from(html+'<p>Edição externa</p>'));await assert.rejects(()=>service.prepare({id:legacyId,revisao:1}),error=>error.status===409);
});

test('lixeira recusa publicação ativa e restauração preserva rascunho sem republicar',async()=>{
 const {service,state}=fixture();await service.publish({...await service.prepare({id,revisao:1}),confirmado:true});
 await assert.rejects(()=>service.trash({id,revisao:1,confirmado:true}),error=>error.status===409);assert.equal(state.trash,false);
 await service.withdraw({...await service.prepareWithdrawal({id,revisao:1}),confirmado:true});
 const writes=state.writes.length;assert.equal((await service.trash({id,revisao:1,confirmado:true})).lixeira,true);assert.equal(state.trash,true);
 await assert.rejects(()=>service.prepare({id,revisao:1}),error=>error.status===409);
 assert.equal((await service.restore({id,revisao:1,confirmado:true})).lixeira,false);assert.equal(state.writes.length,writes);assert.equal((await service.status(id)).status,'retirada');
});
test('lixeira exige confirmação e revisão atual, rascunho nunca publicado pode ser restaurado',async()=>{
 const {service,state}=fixture();await assert.rejects(()=>service.trash({id,revisao:1}),error=>error.status===400);
 await assert.rejects(()=>service.trash({id,revisao:2,confirmado:true}),error=>error.status===409);
 await service.trash({id,revisao:1,confirmado:true});assert.equal(state.trash,true);await service.restore({id,revisao:1,confirmado:true});assert.equal(state.trash,false);assert.equal(state.writes.length,0);
});

test('reportagem antiga importada pode ser inativada antes de qualquer atualização pelo painel',async()=>{
 const legacyPath='pages/reportagem-educacao.html',source='<html><head><title>Original</title></head><body><main><h1>Original</h1><p>Texto original.</p></main></body></html>',baseHash=createHash('sha256').update(source).digest('hex');
 const raw=createHash('sha256').update('acervo:'+legacyPath).digest('hex').slice(0,32),legacyId=[raw.slice(0,8),raw.slice(8,12),raw.slice(12,16),raw.slice(16,20),raw.slice(20)].join('-');
 const {service,state}=fixture({record:{titulo:'Original',acervo:{path:legacyPath,original:source,baseHash,edicoes:[]}}});state.files.set(legacyPath,Buffer.from(source));state.files.set('data/site.json',Buffer.from(JSON.stringify({noticias:[{titulo:'Original',link:legacyPath}],eventos:[]})));
 assert.equal((await service.status(legacyId)).status,'existente');await assert.rejects(()=>service.trash({id:legacyId,revisao:1,confirmado:true}),error=>error.status===409);
 const plan=await service.prepareWithdrawal({id:legacyId,revisao:1});assert.equal(state.writes.length,0);await service.withdraw({...plan,confirmado:true});assert.equal((await service.status(legacyId)).status,'retirada');assert.equal(JSON.parse(state.files.get('data/site.json')).noticias.length,0);
 await service.trash({id:legacyId,revisao:1,confirmado:true});await service.restore({id:legacyId,revisao:1,confirmado:true});await service.publish({...await service.prepare({id:legacyId,revisao:1}),confirmado:true});assert.equal(state.files.get(legacyPath).toString(),source);
});

test('publicação de novo título no acervo mantém chamada, busca e metadados coerentes',async()=>{
 const path='pages/reportagem-educacao.html',original='<html><head><title>Original | Escola</title><meta property="og:title" content="Original | Escola"></head><body><main><h1>Original</h1><p>Texto preservado.</p></main></body></html>';
 const raw=createHash('sha256').update('acervo:'+path).digest('hex').slice(0,32),legacyId=[raw.slice(0,8),raw.slice(8,12),raw.slice(12,16),raw.slice(16,20),raw.slice(20)].join('-');
 const {service,state}=fixture({record:{titulo:'Título revisado',acervo:{path,original,baseHash:createHash('sha256').update(original).digest('hex'),edicoes:[{indice:0,texto:'Título revisado'}]}}});
 state.files.set(path,Buffer.from(original));state.files.set('data/site.json',Buffer.from(JSON.stringify({noticias:[{titulo:'Original',resumo:'Resumo preservado',link:path}],eventos:[]})));
 await service.publish({...await service.prepare({id:legacyId,revisao:1}),confirmado:true});
 const html=state.files.get(path).toString();assert.match(html,/<title>Título revisado \| Escola<\/title>/);assert.match(html,/content="Título revisado \| Escola"/);
 assert.equal(JSON.parse(state.files.get('data/site.json')).noticias[0].titulo,'Título revisado');
 assert.ok(state.files.get('data/busca.json').toString().includes('Título revisado'));
 assert.equal((await service.status(legacyId)).status,'publicada');
});
