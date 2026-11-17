import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildAcervoContext} from '../lib/acervo.js';

test('perguntas da turma recuperam os marcos da escola com fonte e limites documentais',()=>{
 const year=buildAcervoContext('Em que ano foi criada a escola?');
 assert.match(year,/3 de março de 2011/);assert.match(year,/pages\/historia.html/);
 const principal=buildAcervoContext('Quem é a diretora da escola?');
 assert.match(principal,/Maria Ivaniza Martins de Sousa Nascimento/);assert.match(principal,/2025–2027/);
 const founder=buildAcervoContext('Quem fundou a escola?');
 assert.match(founder,/conquista coletiva/);assert.match(founder,/Não apresenta uma única pessoa como fundadora/);
 const first=buildAcervoContext('Quem foi a primeira diretora?');
 assert.match(first,/não identifica quem foi a primeira diretora/);
});

test('consulta longa preserva o trecho específico da direção entre os primeiros resultados',()=>{
 const c=buildAcervoContext('Segundo o PPP de 2025, quem é a diretora da Escola Francisco Araújo Barros? Informe a fonte e não confunda com a primeira diretora.');
 const start=c.indexOf('Trechos selecionados para a pergunta atual:');
 const excerpts=c.slice(start).split('\n').slice(1,4).join('\n');
 assert.match(excerpts,/Maria Ivaniza Martins de Sousa Nascimento/);
 assert.match(excerpts,/não identifica quem foi a primeira diretora/);
});
