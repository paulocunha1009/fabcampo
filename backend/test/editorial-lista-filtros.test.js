import test from 'node:test';
import assert from 'node:assert/strict';
import {correspondeFiltroMateria,resumirFiltroMaterias} from '../../painel/lista-materias.mjs';
test('busca por título ignora acentos e combina grupo com estado confirmado',()=>{
 const item={titulo:'Educação do Campo',lixeira:false,estado:'pendente'};
 assert.equal(correspondeFiltroMateria(item,{busca:' EDUCacao ',estado:'pendente'}),true);
 assert.equal(correspondeFiltroMateria(item,{estado:'publicada'}),false);
 assert.equal(correspondeFiltroMateria({...item,estado:'desconhecida'},{estado:'publicada'}),false);
 assert.equal(correspondeFiltroMateria({...item,lixeira:true}),false);
 assert.equal(correspondeFiltroMateria({...item,lixeira:true},{grupo:'lixeira'}),true);
 assert.equal(correspondeFiltroMateria(item,{busca:'clima'}),false);
});

test('contagem respeita o grupo e distingue lista vazia de busca sem resultados',()=>{
 const items=[{titulo:'Educação',lixeira:false,estado:'publicada'},{titulo:'Clima',lixeira:true,estado:'desconhecida'}];
 assert.deepEqual(resumirFiltroMaterias(items),{encontrados:1,total:1,texto:'1 de 1 registro na lista de matérias.'});
 assert.match(resumirFiltroMaterias(items,{busca:'inexistente'}).texto,/Limpar filtros/);
 assert.match(resumirFiltroMaterias([],{grupo:'lixeira'}).texto,/lixeira está vazia/);
 assert.equal(resumirFiltroMaterias(items,{grupo:'lixeira'}).encontrados,1);
});
