import {criarPublicacaoEventos} from './editorial-events.js';
import express from 'express';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {createDraftStore} from './editorial-drafts.js';
import {renderEditorialPage} from './editorial-page.mjs';
import {acervoCatalogo,acervoPath,validarAcervo,analisarAcervo,aplicarAcervo,tituloAcervo,resumoOriginalAcervo} from './editorial-acervo.js';
import {validarBlocos} from './editorial-blocks.mjs';

const repo='paulocunha1009/fabcampo',branch='master';
const fail=(status,message)=>Object.assign(new Error(message),{status});
const digest=value=>createHash('sha256').update(value).digest('hex');
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const idPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const photoPattern=/^img\/editorial\/[a-f0-9]{64}\.webp$/;
const categories={Portal:{icone:'📌',classe:'badge--portal'},Tecnologia:{icone:'🤖',classe:'badge--tech'},Agroecologia:{icone:'🌱',classe:'badge--agro'},Educação:{icone:'🎓',classe:'badge--educacao'},Cultura:{icone:'🎭',classe:'badge--portal'}};
function text(value,max,required=true){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw fail(400,'Confira os textos obrigatórios da reportagem.');return value.trim();}
export function validatePublicArticle(value){
  if(!value||!Object.hasOwn(categories,value.categoria))throw fail(400,'Confira a categoria.');
  const record={titulo:text(value.titulo,160),subtitulo:text(value.subtitulo||'',240,false),resumo:text(value.resumo,1200),texto:text(value.texto,12000),local:text(value.local,240),fonte:text(value.fonte,160),categoria:value.categoria,modelo:value.modelo||'destaques',data:value.data||'',link:value.link||'',video:value.video||''};
  if(typeof record.data!=='string')throw fail(400,'Confira a data.');
  if(!['destaques','dados'].includes(record.modelo))throw fail(400,'Confira o modelo da reportagem.');
  if(!Array.isArray(value.fotos)||!value.fotos.length||value.fotos.length>10||value.fotos.filter(photo=>photo?.capa===true).length!==1)throw fail(400,'Use de uma a dez fotos enviadas, com uma capa.');
  const ids=new Set();record.fotos=value.fotos.map(photo=>{
    if(typeof photo?.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(photo.id)||ids.has(photo.id)||!photoPattern.test(photo.imagem)|| (photo.capa===true&&!photoPattern.test(photo.capaImagem)))throw fail(400,'Confira os arquivos das fotos enviadas.');
    ids.add(photo.id);return {id:photo.id,capa:photo.capa===true,imagem:photo.imagem,capaImagem:photo.capa===true?photo.capaImagem:'',legenda:text(photo.legenda,400),credito:text(photo.credito,240),textoAlternativo:text(photo.textoAlternativo,400)};
  });
  if(!Array.isArray(value.cards||[])||(value.cards||[]).length>3)throw fail(400,'Use até três cards.');
  record.cards=(value.cards||[]).map(card=>({titulo:text(card?.titulo,90),texto:text(card?.texto,500)}));
  Object.assign(record,validarBlocos(value));
  // O renderizador valida data, vídeo e endereço de referência sem aceitar HTML.
  try{renderEditorialPage(record,{preview:false});}catch{throw fail(400,'Confira a data, o vídeo e o endereço da fonte.');}
  return record;
}
export function createPublicationService({drafts=createDraftStore(),token=process.env.EDITORIAL_GITHUB_TOKEN||'',staging=process.env.EDITORIAL_UPLOAD_BRANCH||'',enabled=process.env.EDITORIAL_PUBLISH_ENABLED==='true',request=fetch,siteRequest=fetch}={}){
  const configured=Boolean(token&&/^editorial-[a-z0-9-]+$/.test(staging));
  async function github(path,method='GET',body,allowMissing=false){
    const response=await request('https://api.github.com/repos/'+repo+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(15000)});
    if(allowMissing&&response.status===404)return null;
    if(!response.ok)throw fail([409,422].includes(response.status)?409:502,'O GitHub não confirmou a operação. Confira a versão antes de tentar novamente.');
    return response.json();
  }
  async function content(path,ref,optional=false){
    const file=await github('/contents/'+path+'?ref='+encodeURIComponent(ref),'GET',undefined,optional);
    if(!file)return null;
    if(file.type!=='file'||file.encoding!=='base64'||typeof file.content!=='string'||file.size>1024*1024)throw fail(502,'Arquivo do repositório fora do formato esperado.');
    const bytes=Buffer.from(file.content.replace(/\s/g,''),'base64');
    if(!/^[a-f0-9]{40}$/.test(file.sha||'')||bytes.length!==file.size)throw fail(502,'Arquivo do repositório não conferido.');
    return {...file,bytes};
  }
  async function repositoryState(){
    if(!configured)throw fail(503,'A publicação ainda não está configurada.');
    const ref=await github('/git/ref/heads/'+branch),head=ref.object?.sha;
    if(!/^[a-f0-9]{40}$/.test(head||''))throw fail(502,'Versão do repositório inválida.');
    const siteFile=await content('data/site.json',head),manifestFile=await content('data/editorial-publicacoes.json',head,true),searchFile=await content('data/busca.json',head),mapFile=await content('sitemap.xml',head);
    let site,manifest,search;
    try{site=JSON.parse(siteFile.bytes.toString('utf8'));manifest=manifestFile?JSON.parse(manifestFile.bytes.toString('utf8')):{version:1,publicacoes:[]};search=JSON.parse(searchFile.bytes.toString('utf8'));}catch{throw fail(502,'Não foi possível conferir as listas do portal.');}
    const sitemap=mapFile.bytes.toString('utf8');
    if(!Array.isArray(site.noticias)||!Array.isArray(site.eventos)||manifest.version!==1||!Array.isArray(manifest.publicacoes)||search.version!==1||!Array.isArray(search.pages)||!sitemap.includes('</urlset>'))throw fail(502,'Formato das listas do portal inválido.');
    return {head,site,manifest,search,sitemap};
  }
  async function draftArticle(input){
    if(!idPattern.test(input?.id||'')||!Number.isInteger(input.revisao)||input.revisao<1)throw fail(400,'Escolha um rascunho salvo com revisão confirmada.');
    const draft=await drafts.get(input.id);
    if(draft.lixeira)throw fail(409,'Restaure o rascunho da lixeira antes de publicar.');
    if(draft.revisao!==input.revisao)throw fail(409,'Existe uma revisão mais recente. Reabra o rascunho antes de publicar.');
    if(draft.tipo!=='noticias')throw fail(400,'Esta etapa publica somente reportagens.');
    return draft.registro.acervo?{titulo:draft.registro.titulo,acervo:validarAcervo(draft.registro.acervo)}:validatePublicArticle(draft.registro);
  }
  async function images(record){
    const usages=new Map();for(const photo of record.fotos){usages.set(photo.imagem,usages.get(photo.imagem)||'galeria');if(photo.capa)usages.set(photo.capaImagem,'capa');}
    const entries=[];
    // Pinar o commit da branch de imagens evita misturar versões durante a leitura.
    const stageRef=await github('/git/ref/heads/'+staging),stageHead=stageRef.object?.sha;
    if(!/^[a-f0-9]{40}$/.test(stageHead||''))throw fail(502,'Branch de fotos inválida.');
    for(const [path,usage] of usages){
      const file=await content(path,stageHead);
      if(digest(file.bytes)!==path.split('/').at(-1).slice(0,-5))throw fail(409,'A foto mudou no repositório. Reenvie pelo painel.');
      const meta=await sharp(file.bytes,{limitInputPixels:40000000}).metadata();
      if(meta.format!=='webp'||(meta.pages||1)!==1||meta.exif||meta.xmp||!meta.width||!meta.height||meta.width>1600||meta.height>1600||(usage==='capa'&&(meta.width!==1200||meta.height!==675)))throw fail(400,'Uma foto está fora do padrão. Prepare-a novamente no painel.');
      entries.push({path,mode:'100644',type:'blob',sha:file.sha});
    }
    return entries;
  }
  const acervoId=path=>{const value=digest('acervo:'+path).slice(0,32);return [value.slice(0,8),value.slice(8,12),value.slice(12,16),value.slice(16,20),value.slice(20)].join('-');};
  async function openArchive(input){
    const entry=acervoCatalogo.find(item=>item.path===input?.path);if(!entry)throw fail(400,'Escolha uma reportagem do acervo.');
    const id=acervoId(entry.path);let draft;
    try{draft=await drafts.get(id);}catch(error){if(error.status!==404)throw error;}
    if(!draft){
      const state=await repositoryState(),file=await content(entry.path,state.head),original=file.bytes.toString('utf8');
      analisarAcervo(original);
      draft=await drafts.save({id,revisao:0,tipo:'noticias',registro:{titulo:entry.titulo,acervo:{path:entry.path,original,baseHash:digest(original),edicoes:[]}}});
    }
    if(draft.registro?.acervo?.path!==entry.path)throw fail(409,'O rascunho do acervo precisa ser conferido pela equipe.');
    if(draft.lixeira)throw fail(409,'Esta reportagem está na lixeira. Restaure pela lista de matérias.');
    const state=await repositoryState(),resumo=draft.registro.acervo.resumo??state.site.noticias.find(item=>item.link===entry.path)?.resumo??resumoOriginalAcervo(draft.registro.acervo.original);
    return {draft,resumo,campos:aplicarAcervo(draft.registro.acervo).campos};
  }
  async function saveArchive(input){
    if(!acervoPath(input?.path)||input.id!==acervoId(input.path)||!Number.isInteger(input.revisao))throw fail(400,'Registro de acervo inválido.');
    const draft=await drafts.get(input.id);
    if(draft.revisao!==input.revisao||draft.registro?.acervo?.path!==input.path)throw fail(409,'Existe uma revisão mais recente. Reabra a matéria antes de editar.');
    const acervo=validarAcervo({...draft.registro.acervo,...(Object.hasOwn(input,'resumo')?{resumo:input.resumo}:{}),...(Object.hasOwn(input,'capa')?{capa:input.capa}:{}),edicoes:input.edicoes}),titulo=tituloAcervo(aplicarAcervo(acervo).html);
    return drafts.save({id:input.id,revisao:input.revisao,tipo:'noticias',registro:{titulo,acervo}});
  }
  async function previewArchive(input){
    if(!acervoPath(input?.path)||input.id!==acervoId(input.path))throw fail(400,'Registro de acervo inválido.');
    const draft=await drafts.get(input.id);
    if(draft.revisao!==input.revisao||draft.registro?.acervo?.path!==input.path)throw fail(409,'A revisão mudou. Reabra a matéria.');
    return {html:aplicarAcervo({...draft.registro.acervo,...(Object.hasOwn(input,'resumo')?{resumo:input.resumo}:{}),...(Object.hasOwn(input,'capa')?{capa:input.capa}:{}),edicoes:input.edicoes}).html};
  }
  async function prepare(input){
    const record=await draftArticle(input),state=await repositoryState(),entries=record.acervo?(record.acervo.capa?await images({fotos:[{...record.acervo.capa,capa:true,capaImagem:record.acervo.capa.imagem}]}):[]):await images(record);
    const path=record.acervo?.path||'pages/reportagem-'+input.id+'.html',hash=digest(JSON.stringify(record));
    if(record.acervo&&input.id!==acervoId(path))throw fail(400,'Importe esta reportagem pelo acervo para preservar seu vínculo.');
    const old=state.manifest.publicacoes.find(item=>item.id===input.id);
    // Nunca sobrescrever páginas manuais ou arquivos que não pertencem ao manifesto.
    const existing=await content(path,state.head,true);
    const imported=record.acervo&&existing&&digest(existing.bytes.toString('utf8'))===record.acervo.baseHash;
    if(record.acervo&&(!existing||(!imported&&old?.baseHash!==record.acervo.baseHash)))throw fail(409,'A página original mudou. Procure a equipe antes de publicar a edição.');
    if(existing&&(!old||old.path!==path)&&!imported)throw fail(409,'O endereço já existe fora das publicações gerenciadas. Procure a equipe.');
    if(existing&&old&&old.htmlHash!==digest(existing.bytes.toString('utf8').replace(/\r\n/g,'\n')))throw fail(409,'A página foi alterada fora do painel. Confira a alteração antes de atualizar.');
    if(record.acervo)aplicarAcervo(record.acervo);
    const plan={id:input.id,revisao:input.revisao,head:state.head,path,hash,fotos:record.acervo?.capa?1:record.fotos?.length||0,titulo:record.titulo,operacao:old?.retirada?'republicar':old||record.acervo?'atualizar':'publicar',habilitada:enabled};
    plan.confirmacao=digest(JSON.stringify({id:plan.id,revisao:plan.revisao,head:plan.head,path,hash,entries}));
    return {plan,record,state,entries};
  }
  async function publish(input){
    if(!enabled)throw fail(503,'A publicação está preparada, mas ainda não foi ativada pelo responsável.');
    if(input?.confirmado!==true||!/^[a-f0-9]{64}$/.test(input.confirmacao||''))throw fail(400,'Prepare e confira a publicação antes de confirmar.');
    const {plan,record,state,entries}=await prepare(input);
    const previous=state.manifest.publicacoes.find(item=>item.id===input.id);
    if(!previous?.retirada&&previous?.hash===plan.hash&&previous.revisao===input.revisao)return {status:'enviada',id:plan.id,link:plan.path,commit:state.head,reutilizada:true};
    if(input.head!==plan.head||input.confirmacao!==plan.confirmacao)throw fail(409,'O rascunho, as fotos ou o portal mudaram. Prepare a publicação novamente.');
    let html=record.acervo?aplicarAcervo(record.acervo).html:renderEditorialPage(record,{preview:false});
    const cover=record.fotos?.find(photo=>photo.capa),canonical='https://fabcampo.com.br/'+plan.path;
    if(!record.acervo)html=html.replace('</head>','<meta name="editorial-publication" content="'+plan.hash+'"><link rel="canonical" href="'+canonical+'"><meta property="og:type" content="article"><meta property="og:site_name" content="Campo Digital"><meta property="og:title" content="'+escapeHTML(record.titulo)+'"><meta property="og:description" content="'+escapeHTML(record.resumo)+'"><meta property="og:url" content="'+canonical+'"><meta property="og:image" content="https://fabcampo.com.br/'+cover.capaImagem+'"></head>');
    const htmlHash=digest(html.replace(/\r\n/g,'\n'));
    const priorNews=record.acervo?state.site.noticias.find(item=>item.link===plan.path):null;
    const news=record.acervo?{...priorNews,editorialId:plan.id,link:plan.path,titulo:record.titulo,resumo:record.acervo.resumo??priorNews?.resumo??record.titulo,categoria:priorNews?.categoria||'Educação'}:{editorialId:plan.id,data:record.data,titulo:record.titulo,resumo:record.resumo,categoria:record.categoria,...categories[record.categoria],link:plan.path,fonte:record.fonte};
    const index=state.site.noticias.findIndex(item=>item.editorialId===plan.id||(record.acervo&&item.link===plan.path));
    if(index<0)state.site.noticias.unshift(news);else state.site.noticias[index]=news;
    const publication={id:plan.id,revisao:input.revisao,path:plan.path,hash:plan.hash,htmlHash,newsHash:digest(JSON.stringify(news)),titulo:record.titulo,...(record.acervo?{baseHash:record.acervo.baseHash}:{})};
    state.manifest.publicacoes=state.manifest.publicacoes.filter(item=>item.id!==plan.id).concat(publication);
    const chunks=[{section:'',text:news.resumo}];let section='';
    for(let block of (record.acervo?aplicarAcervo(record.acervo).campos.map(field=>field.texto).join('\n\n'):record.texto).split(/\n\s*\n/)){
      const heading=/^##\s+([^\n]+)(?:\n|$)/.exec(block);if(heading){section=heading[1];block=block.slice(heading[0].length);}
      let paragraph=block.trim();while(paragraph.length>1000){const space=paragraph.lastIndexOf(' ',1000),end=space>0?space:1000;chunks.push({section,text:paragraph.slice(0,end)});paragraph=paragraph.slice(end).trim();}if(paragraph)chunks.push({section,text:paragraph});
    }
    state.search.pages=state.search.pages.filter(page=>page.url!==plan.path).concat({title:record.titulo,url:plan.path,sha256:htmlHash,chunks});
    const searchJSON=JSON.stringify(state.search)+'\n';if(Buffer.byteLength(searchJSON)>1024*1024)throw fail(400,'O índice de busca atingiu o limite. Procure a equipe antes de publicar.');
    state.sitemap=state.sitemap.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g,entry=>entry.includes('<loc>'+canonical+'</loc>')?'':entry);
    state.sitemap=state.sitemap.replace('</urlset>','  <url><loc>'+canonical+'</loc><lastmod>'+new Date().toISOString().slice(0,10)+'</lastmod></url>\n</urlset>');
    const files=[[plan.path,html],['data/site.json',JSON.stringify(state.site,null,2)+'\n'],['data/busca.json',searchJSON],['sitemap.xml',state.sitemap],['data/editorial-publicacoes.json',JSON.stringify(state.manifest,null,2)+'\n']];
    for(const [path,content] of files){const blob=await github('/git/blobs','POST',{content,encoding:'utf-8'});entries.push({path,mode:'100644',type:'blob',sha:blob.sha});}
    const parent=await github('/git/commits/'+state.head);
    const tree=await github('/git/trees','POST',{base_tree:parent.tree.sha,tree:entries});
    const commit=await github('/git/commits','POST',{message:'Publicar reportagem editorial '+plan.id,tree:tree.sha,parents:[state.head]});
    // Sem force: avanço concorrente de master impede a atualização, sem sobrescrita.
    await github('/git/refs/heads/'+branch,'PATCH',{sha:commit.sha,force:false});
    return {status:'enviada',id:plan.id,link:plan.path,commit:commit.sha};
  }
  async function prepareWithdrawal(input){
    if(!idPattern.test(input?.id||'')||!Number.isInteger(input.revisao)||input.revisao<1)throw fail(400,'Abra um rascunho salvo antes de retirar a matéria.');
    const draft=await drafts.get(input.id);
    if(draft.tipo!=='noticias'||draft.revisao!==input.revisao)throw fail(409,'O rascunho mudou. Reabra a revisão salva.');
    const state=await repositoryState();let item=state.manifest.publicacoes.find(item=>item.id===input.id);
    if(!item&&draft.registro?.acervo){
      const imported=validarAcervo(draft.registro.acervo);
      if(input.id!==acervoId(imported.path))throw fail(400,'Vínculo do acervo inválido.');
      const source=await content(imported.path,state.head);
      if(digest(source.bytes.toString('utf8'))!==imported.baseHash)throw fail(409,'A página original mudou. Confira a edição antes de inativar.');
      item={id:input.id,revisao:draft.revisao,path:imported.path,titulo:draft.registro.titulo,baseHash:imported.baseHash,hash:digest(JSON.stringify(imported)),htmlHash:digest(source.bytes.toString('utf8').replace(/\r\n/g,'\n'))};
    }
    const path=item?.path;
    if(!item)throw fail(404,'Nenhuma publicação gerenciada foi encontrada para este rascunho.');
    if((path!=='pages/reportagem-'+input.id+'.html'&&!acervoPath(path))||!/^[a-f0-9]{64}$/.test(item.htmlHash||''))throw fail(502,'Registro de publicação inválido.');
    const existing=await content(path,state.head,true);
    if(!existing||digest(existing.bytes.toString('utf8').replace(/\r\n/g,'\n'))!==item.htmlHash)throw fail(409,'A página foi alterada fora do painel. Procure a equipe antes de retirar.');
    const plan={id:input.id,revisao:input.revisao,head:state.head,path,titulo:item.titulo,operacao:'retirar',habilitada:enabled,retirada:!!item.retirada};
    plan.confirmacao=digest(JSON.stringify({operacao:'retirar',id:plan.id,revisao:plan.revisao,head:plan.head,item}));
    return {plan,state,item};
  }
  async function withdraw(input){
    if(!enabled)throw fail(503,'O envio de alterações públicas está desativado.');
    if(input?.confirmado!==true||!/^[a-f0-9]{64}$/.test(input.confirmacao||''))throw fail(400,'Prepare e confirme a retirada antes de enviar.');
    const {plan,state,item}=await prepareWithdrawal(input);
    if(plan.retirada)return {status:'retirada-enviada',id:plan.id,reutilizada:true};
    if(input.head!==plan.head||input.confirmacao!==plan.confirmacao)throw fail(409,'O portal ou o rascunho mudou. Confira a retirada novamente.');
    // Aviso público reversível: não apaga o rascunho, fotos ou histórico Git.
    const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Reportagem indisponível | Campo Digital</title></head><body><main><h1>Reportagem indisponível</h1><p>Esta reportagem foi retirada do portal pela equipe responsável.</p><p><a href="https://fabcampo.com.br/">Voltar ao Campo Digital</a></p></main></body></html>';
    const canonical='https://fabcampo.com.br/'+plan.path;
    state.site.noticias=state.site.noticias.filter(news=>news.editorialId!==plan.id&&news.link!==plan.path);
    state.search.pages=state.search.pages.filter(page=>page.url!==plan.path);
    state.sitemap=state.sitemap.replace(/<url\b[^>]*>[\s\S]*?<\/url>/g,entry=>entry.includes('<loc>'+canonical+'</loc>')?'':entry);
    state.manifest.publicacoes=state.manifest.publicacoes.filter(entry=>entry.id!==plan.id).concat({...item,retirada:true,htmlHash:digest(html)});
    const files=[[plan.path,html],['data/site.json',JSON.stringify(state.site,null,2)+'\n'],['data/busca.json',JSON.stringify(state.search)+'\n'],['sitemap.xml',state.sitemap],['data/editorial-publicacoes.json',JSON.stringify(state.manifest,null,2)+'\n']],entries=[];
    for(const [path,content] of files){const blob=await github('/git/blobs','POST',{content,encoding:'utf-8'});entries.push({path,mode:'100644',type:'blob',sha:blob.sha});}
    const parent=await github('/git/commits/'+state.head);
    const tree=await github('/git/trees','POST',{base_tree:parent.tree.sha,tree:entries});
    const commit=await github('/git/commits','POST',{message:'Retirar reportagem editorial '+plan.id,tree:tree.sha,parents:[state.head]});
    await github('/git/refs/heads/'+branch,'PATCH',{sha:commit.sha,force:false});
    return {status:'retirada-enviada',id:plan.id,commit:commit.sha};
  }
  async function status(id){
    if(!idPattern.test(id||''))throw fail(400,'Identificação inválida.');
    const state=await repositoryState(),item=state.manifest.publicacoes.find(item=>item.id===id);
    if(!item){
      const original=acervoCatalogo.find(entry=>acervoId(entry.path)===id);
      if(!original)return {status:'nao-enviada',id};
      try{
        const file=await content(original.path,state.head),response=await siteRequest('https://fabcampo.com.br/'+original.path+'?editorial='+state.head,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
        if(response.ok&&digest((await response.text()).replace(/\r\n/g,'\n'))===digest(file.bytes.toString('utf8').replace(/\r\n/g,'\n')))return {status:'existente',id,link:original.path};
      }catch{}
      return {status:'aguardando',id,revisao:1};
    }
    const path=item.path;
    if((path!=='pages/reportagem-'+id+'.html'&&!acervoPath(path))||!/^[a-f0-9]{64}$/.test(item.htmlHash||''))throw fail(502,'Registro de publicação inválido.');
    try{
      const response=await siteRequest('https://fabcampo.com.br/'+path+'?editorial='+item.hash,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
      if(!response.ok)return {status:'aguardando',id,link:path,revisao:item.revisao};
      const html=await response.text();if(html.length>256*1024||digest(html.replace(/\r\n/g,'\n'))!==item.htmlHash)return {status:'aguardando',id,link:path,revisao:item.revisao};
      const listing=await siteRequest('https://fabcampo.com.br/data/site.json?editorial='+item.hash,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
      const listingText=listing.ok?await listing.text():'';
      const data=listingText.length<=1024*1024?JSON.parse(listingText):null;
      if(item.retirada){
        const searchResponse=await siteRequest('https://fabcampo.com.br/data/busca.json?editorial='+item.htmlHash,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
        const mapResponse=await siteRequest('https://fabcampo.com.br/sitemap.xml?editorial='+item.htmlHash,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
        const searchText=searchResponse.ok?await searchResponse.text():'',mapText=mapResponse.ok?await mapResponse.text():'';
        const search=searchText.length<=1024*1024?JSON.parse(searchText):null;
        const absent=Array.isArray(data?.noticias)&&!data.noticias.some(news=>news.editorialId===id||news.link===path)&&Array.isArray(search?.pages)&&!search.pages.some(page=>page.url===path)&&mapText.length<=1024*1024&&mapText.includes('</urlset>')&&!mapText.includes('<loc>https://fabcampo.com.br/'+path+'</loc>');
        return {status:absent?'retirada':'aguardando',id,revisao:item.revisao};
      }
      const active=Array.isArray(data?.noticias)&&data.noticias.some(news=>news.editorialId===id&&news.link===path&&digest(JSON.stringify(news))===item.newsHash);
      return {status:active?'publicada':'aguardando',id,link:path,revisao:item.revisao};
    }catch{return {status:'aguardando',id,link:path,revisao:item.revisao};}
  }
  const eventos=criarPublicacaoEventos({github,content,drafts,images,configured,enabled,siteRequest});
  async function trash(input,restore=false){
    if(!idPattern.test(input?.id||'')||input.confirmado!==true||!Number.isInteger(input.revisao)||input.revisao<1)throw fail(400,'Confira a matéria e confirme a operação.');
    const draft=await drafts.get(input.id);
    if(draft.revisao!==input.revisao)throw fail(409,'A revisão mudou. Atualize a lista.');
    if(!restore&&draft.tipo==='noticias'){
      const publication=await status(input.id);
      if(!['nao-enviada','retirada'].includes(publication.status))throw fail(409,'Inative a reportagem e aguarde a confirmação no site antes de mover para a lixeira.');
    }
    if(!restore&&draft.tipo==='eventos'){const evento=await eventos.status(input.id);if(!['nao-enviada','retirada'].includes(evento.status))throw fail(409,'Retire o evento da agenda e confira o estado antes de mover para a lixeira.');}
    return drafts.setTrash(input,!restore);
  }
  return {enabled,eventos,prepare:async input=>(await prepare(input)).plan,publish,status,prepareWithdrawal:async input=>(await prepareWithdrawal(input)).plan,withdraw,openArchive,saveArchive,previewArchive,trash:input=>trash(input),restore:input=>trash(input,true)};
}
export function createPublicationRouter({auth,service=createPublicationService()}){
  const router=express.Router();
  router.use('/api/editorial/publicacoes',async(req,res,next)=>{try{await auth.authenticate(req.headers.authorization);next();}catch(error){res.status([401,403,503].includes(error.status)?error.status:503).json({error:'Entre com uma conta autorizada para preparar publicações.'});}});
  const execute=action=>async(req,res)=>{try{res.json(await action(req));}catch(error){res.status([400,404,409,503].includes(error.status)?error.status:502).json({error:error.status?error.message:'Não foi possível confirmar a publicação. Confira o estado antes de tentar novamente.'});}};
  router.post('/api/editorial/publicacoes/preparar',express.json({limit:'4kb'}),execute(req=>service.prepare(req.body)));
  router.post('/api/editorial/publicacoes/confirmar',express.json({limit:'4kb'}),execute(req=>service.publish(req.body)));
  router.post('/api/editorial/publicacoes/preparar-retirada',express.json({limit:'4kb'}),execute(req=>service.prepareWithdrawal(req.body)));
  router.post('/api/editorial/publicacoes/retirar',express.json({limit:'4kb'}),execute(req=>service.withdraw(req.body)));
  router.post('/api/editorial/publicacoes/lixeira',express.json({limit:'4kb'}),execute(req=>service.trash(req.body)));
  router.post('/api/editorial/publicacoes/restaurar',express.json({limit:'4kb'}),execute(req=>service.restore(req.body)));
  router.get('/api/editorial/publicacoes/acervo/catalogo',execute(()=>acervoCatalogo));
  router.post('/api/editorial/publicacoes/acervo/abrir',express.json({limit:'4kb'}),execute(req=>service.openArchive(req.body)));
  router.post('/api/editorial/publicacoes/acervo/salvar',express.json({limit:'256kb'}),execute(req=>service.saveArchive(req.body)));
  router.post('/api/editorial/publicacoes/acervo/previa',express.json({limit:'256kb'}),execute(req=>service.previewArchive(req.body)));
  router.post('/api/editorial/publicacoes/eventos/preparar',express.json({limit:'4kb'}),execute(req=>service.eventos.prepare(req.body)));
  router.post('/api/editorial/publicacoes/eventos/confirmar',express.json({limit:'4kb'}),execute(req=>service.eventos.publish(req.body)));
  router.get('/api/editorial/publicacoes/eventos/:id',execute(req=>service.eventos.status(req.params.id)));
  router.get('/api/editorial/publicacoes/:id',execute(req=>service.status(req.params.id)));
  return router;
}
