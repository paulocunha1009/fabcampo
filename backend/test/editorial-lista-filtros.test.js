import test from 'node:test';
import assert from 'node:assert/strict';
import {correspondeFiltroMateria} from '../../painel/lista-materias.mjs';
test('busca por título ignora acentos e combina grupo com estado confirmado',()=>{
 const item={titulo:'Educação do Campo',lixeira:false,estado:'pendente'};
 assert.equal(correspondeFiltroMateria(item,{busca:' EDUCacao ',estado:'pendente'}),true);
 assert.equal(correspondeFiltroMateria(item,{estado:'publicada'}),false);
 assert.equal(correspondeFiltroMateria({...item,estado:'desconhecida'},{estado:'publicada'}),false);
 assert.equal(correspondeFiltroMateria({...item,lixeira:true}),false);
 assert.equal(correspondeFiltroMateria({...item,lixeira:true},{grupo:'lixeira'}),true);
 assert.equal(correspondeFiltroMateria(item,{busca:'clima'}),false);
});
