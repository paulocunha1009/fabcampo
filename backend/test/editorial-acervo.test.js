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
