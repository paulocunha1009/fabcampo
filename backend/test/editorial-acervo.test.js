import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {acervoCatalogo,analisarAcervo,aplicarAcervo} from '../lib/editorial-acervo.js';
test('importação integral preserva byte a byte as três reportagens reais sem cortar textos, imagens ou tabelas',async()=>{
 for(const item of acervoCatalogo){const original=await readFile(new URL('../../'+item.path,import.meta.url),'utf8');const baseHash=createHash('sha256').update(original).digest('hex');const fields=analisarAcervo(original);assert.ok(fields.length>20);const result=aplicarAcervo({path:item.path,original,baseHash,edicoes:[]});assert.equal(result.html,original);assert.equal(result.campos.length,fields.length);}
});
test('edição troca somente texto permitido e escapa HTML sem atingir cabeçalho ou scripts',()=>{
 const original='<html><head><script>const secreto="fixo";</script></head><body><header>Cabeçalho</header><main><p>Texto <b>forte</b>.</p><aside>Fixo</aside></main><footer>Rodapé</footer></body></html>',baseHash=createHash('sha256').update(original).digest('hex');
 const result=aplicarAcervo({path:acervoCatalogo[0].path,original,baseHash,edicoes:[{indice:0,texto:'<script>alert(1)</script>'}]});assert.match(result.html,/&lt;script&gt;alert/);assert.match(result.html,/<header>Cabeçalho<\/header>/);assert.match(result.html,/<b>forte<\/b>/);assert.match(result.html,/<aside>Fixo<\/aside>/);
 assert.throws(()=>aplicarAcervo({path:'pages/index.html',original,baseHash,edicoes:[]}));assert.throws(()=>aplicarAcervo({path:acervoCatalogo[0].path,original,baseHash,edicoes:[{indice:999,texto:'x'}]}));
});

test('mudança de h1 sincroniza títulos de aba e compartilhamento sem mudar outros metadados',()=>{
 const original=`<html><head><title>Antigo | Escola</title><meta property="og:title" content="Antigo | Escola"><meta name='twitter:title' content='Antigo'><meta name="description" content="Descrição original"><script>const titulo="fixo";</script></head><body><header>Menu</header><main><h1>Título <span>antigo</span></h1><p>Texto original</p></main><footer>Rodapé</footer></body></html>`;
 const baseHash=createHash('sha256').update(original).digest('hex'),fields=analisarAcervo(original);
 const result=aplicarAcervo({path:acervoCatalogo[0].path,original,baseHash,edicoes:[{indice:fields.find(field=>field.texto==='antigo').indice,texto:'novo & seguro'}]});
 assert.match(result.html,/<title>Título novo &amp; seguro \| Escola<\/title>/);
 assert.match(result.html,/property="og:title" content="Título novo &amp; seguro \| Escola"/);
 assert.match(result.html,/name='twitter:title' content="Título novo &amp; seguro"/);
 assert.ok(result.html.includes('<meta name="description" content="Descrição original">'));
 assert.ok(result.html.includes('<script>const titulo="fixo";</script>'));
 assert.ok(result.html.includes('<header>Menu</header>'));
 assert.ok(result.html.includes('<footer>Rodapé</footer>'));
 const unchanged=aplicarAcervo({path:acervoCatalogo[0].path,original,baseHash,edicoes:[{indice:fields.find(field=>field.texto==='Texto original').indice,texto:'Texto revisado'}]});
 assert.ok(unchanged.html.includes('<title>Antigo | Escola</title>'));
});

test('resumo e capa atualizam apenas chamada, cabeçalho e compartilhamento dos três modelos',async()=>{
 const capa={imagem:'img/editorial/'+'a'.repeat(64)+'.webp',legenda:'Legenda & informação',credito:'Equipe autorizada',textoAlternativo:'Descrição acessível'};
 for(const item of acervoCatalogo){const original=await readFile(new URL('../../'+item.path,import.meta.url),'utf8'),baseHash=createHash('sha256').update(original).digest('hex');const record={path:item.path,original,baseHash,edicoes:[],resumo:'Resumo conferido & revisado',capa};
 const result=aplicarAcervo(record);assert.ok(result.html.includes('../'+capa.imagem));assert.ok(result.html.includes('https://fabcampo.com.br/'+capa.imagem));assert.ok(result.html.includes('Legenda &amp; informação'));assert.ok(result.html.includes('Crédito: Equipe autorizada'));assert.ok(result.html.includes('Resumo conferido &amp; revisado'));assert.equal(result.campos.length,analisarAcervo(original).length);
 const img=original.match(/<img[^>]+src="[^"]*(?:placeholder|galeria)[^"]*"[^>]*>/)?.[0];if(img)assert.ok(result.html.includes(img));
 assert.equal(aplicarAcervo({...record,resumo:undefined,capa:null}).html,original);
 }
});
test('capa exige arquivo canônico e identificação real; resumo recusa vazio e excesso',()=>{
 const original='<main><h1>Título</h1></main>',baseHash=createHash('sha256').update(original).digest('hex'),base={path:acervoCatalogo[0].path,original,baseHash,edicoes:[]};
 for(const resumo of ['', 'a'.repeat(1201),42])assert.throws(()=>aplicarAcervo({...base,resumo}));
 for(const capa of [{imagem:'https://example.test/foto.jpg'},{imagem:'img/editorial/'+'a'.repeat(64)+'.webp',legenda:'Foto',credito:'',textoAlternativo:'Foto'}])assert.throws(()=>aplicarAcervo({...base,capa}));
});
