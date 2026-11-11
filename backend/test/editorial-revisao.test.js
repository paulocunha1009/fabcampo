import test from 'node:test';
import assert from 'node:assert/strict';
import {listarPendenciasRevisao} from '../../painel/revisao-core.mjs';
test('revisão aponta básicos e capa, mantendo blocos extras opcionais',()=>{
 const campos=listarPendenciasRevisao('noticias',{}).map(x=>x.campo);
 for(const campo of ['titulo','resumo','fonte','local','texto','fotos'])assert.ok(campos.includes(campo));
 for(const campo of ['video','subtitulo','citacao','dadosTexto','cards'])assert.equal(campos.includes(campo),false);
});
test('revisão inclui erro de formato e pendências do evento',()=>{
 const itens=listarPendenciasRevisao('noticias',{titulo:'Título',resumo:'Resumo',fonte:'Equipe',categoria:'Portal',local:'Local',texto:'Texto',video:'javascript:alert(1)'});
 assert.ok(itens.some(x=>x.campo==='video'));
 const campos=listarPendenciasRevisao('eventos',{}).map(x=>x.campo);
 for(const campo of ['nome','data','horario','contato'])assert.ok(campos.includes(campo));
 assert.equal(campos.includes('fotos'),false);
});
