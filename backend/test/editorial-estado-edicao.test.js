import test from 'node:test';
import assert from 'node:assert/strict';
import {descreverEstadoEdicao} from '../../painel/estado-edicao.mjs';
test('somente o snapshot confirmado identifica a edição como salva',()=>{
 const binding={revisao:6,snapshot:'original'};
 assert.equal(descreverEstadoEdicao(undefined,'original').estado,'novo');
 assert.equal(descreverEstadoEdicao({revisao:0},'original').estado,'novo');
 assert.equal(descreverEstadoEdicao(binding,'original').estado,'salvo');
 assert.equal(descreverEstadoEdicao(binding,'editado').estado,'pendente');
 assert.equal(descreverEstadoEdicao(binding,null).estado,'pendente');
 // Edição feita durante o salvamento não pode parecer salva ao retornar a resposta.
 assert.equal(descreverEstadoEdicao({revisao:7,snapshot:'editado'},'edição posterior').estado,'pendente');
 assert.match(descreverEstadoEdicao(binding,'editado').texto,/Atualizar a prévia não salva/);
});
