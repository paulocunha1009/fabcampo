import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { validarFotos, validarVideo, videoEmbed } from '../../painel/midias-core.js';
import { validarRegistro, pendenciasPublicacao, montarRascunho } from '../../painel/editorial-core.js';
import { normalizeEditorialImage } from '../lib/editorial-images.js';
const photo = (index=0) => ({id:'foto-'+index,imagem:'img/foto-'+index+'.webp',capaImagem:index===0 ? 'img/capa.webp':'',capa:index===0,legenda:'Legenda de teste',credito:'Crédito de teste',textoAlternativo:'Descrição de teste'});
const news = {titulo:'Título de teste',resumo:'Resumo de teste',categoria:'Portal',fonte:'Autoria de teste',local:'Local de teste',texto:'Texto de teste',fotos:[photo()]};
test('reportagem aceita uma a dez fotos, mas rascunho incompleto continua possível',()=>{
  assert.deepEqual(pendenciasPublicacao('noticias',news),[]);
  assert.equal(validarRegistro('noticias',{...news,fotos:Array.from({length:10},(_,i)=>photo(i))}).fotos.length,10);
  assert.throws(()=>validarFotos(Array.from({length:11},(_,i)=>photo(i))));
  assert.ok(pendenciasPublicacao('noticias',{...news,fotos:[]}).includes('fotos'));
  assert.ok(pendenciasPublicacao('noticias',{...news,fotos:[{...photo(),imagem:''}]}).includes('fotos'));
});
test('galeria preserva ordem, capa, metadados e rejeita duplicações e URLs executáveis',()=>{
  const fotos=[photo(2),photo(0),photo(1)];
  assert.deepEqual(validarFotos(fotos).map(p=>p.id),['foto-2','foto-0','foto-1']);
  const result=montarRascunho({noticias:[{...news,fotos}],eventos:[]});
  assert.equal(result.noticias[0].imagem,'img/capa.webp');
  assert.equal(result.noticias[0].fotos[1].credito,'Crédito de teste');
  for(const invalid of [[photo(),photo()], [photo(),{...photo(1),capa:true}], [{...photo(),imagem:'javascript:alert(1)'}]]) assert.throws(()=>validarFotos(invalid));
});
test('vídeo opcional normaliza um único YouTube e jamais ativa autoplay',()=>{
  const id='abcdefghijk';
  for(const value of [`https://youtu.be/${id}`,`https://www.youtube.com/watch?v=${id}&autoplay=1`,`https://youtube.com/shorts/${id}`]){
    assert.equal(validarVideo(value),`https://www.youtube.com/watch?v=${id}`);
    assert.equal(videoEmbed(value),`https://www.youtube-nocookie.com/embed/${id}?autoplay=0`);
  }
  assert.equal(validarVideo(''),'');
  for(const value of [['https://youtu.be/'+id],`https://youtube.com.evil.test/watch?v=${id}`,`http://youtu.be/${id}`,'javascript:alert(1)','https://youtube.com/playlist?list=test'])assert.throws(()=>validarVideo(value));
});
test('foto interna preserva proporção e metadados são removidos no servidor',async()=>{
  const original=await sharp({create:{width:600,height:1000,channels:3,background:'#246b3a'}}).withMetadata().webp().toBuffer();
  const output=await normalizeEditorialImage(original,'galeria');
  const meta=await sharp(output).metadata();
  assert.equal(meta.width,600);assert.equal(meta.height,1000);assert.equal(meta.exif,undefined);
  await assert.rejects(normalizeEditorialImage(original,'capa'),{status:400});
  await assert.rejects(normalizeEditorialImage(original,'outro'),{status:400});
});
