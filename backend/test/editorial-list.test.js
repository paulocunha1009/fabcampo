import {test} from 'node:test';
import assert from 'node:assert/strict';
import {descreverPublicacao} from '../../painel/lista-materias.mjs';
const id='12345678-1234-4234-8234-123456789abc',draft={id,revisao:3},link='pages/reportagem-'+id+'.html';
test('lista separa rascunho, versão publicada e alterações pendentes',()=>{
 assert.equal(descreverPublicacao(draft,{id,status:'nao-enviada'}).rotulo,'Rascunho');
 assert.equal(descreverPublicacao(draft,{id,status:'publicada',revisao:3,link}).rotulo,'Publicado');
 const pending=descreverPublicacao(draft,{id,status:'publicada',revisao:2,link});assert.equal(pending.rotulo,'Alterações pendentes');assert.equal(pending.link,'https://fabcampo.com.br/'+link);
 for(const status of ['aguardando','retirada'])assert.equal(descreverPublicacao(draft,{id,status,revisao:2}).link,'');
});
test('lista não apresenta como publicado estado ou link não verificado',()=>{
 for(const result of [null,{id:'outro',status:'publicada'},{id,status:'publicada',revisao:3,link:'https://evil.test/'},{id,status:'publicada',link},{id,status:'publicada',revisao:4,link},{id,status:'desconhecido',revisao:2}])assert.throws(()=>descreverPublicacao(draft,result));
});
