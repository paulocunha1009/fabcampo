import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildResearchContext} from '../lib/research-context.js';
import {buildAcervoContext} from '../lib/acervo.js';
import {researchSource,validateReport} from '../lib/editorial-report.js';

test('pesquisa mantém números históricos e marcos distintos com fontes',()=>{
 const c=buildAcervoContext('Quantos alunos tem a escola e quando foi criado o assentamento?');
 assert.match(c,/não confirma matrícula de 2025 ou 2026/);
 assert.match(c,/26\/06\/1986/);assert.match(c,/13\/07\/1987/);
 assert.match(c,/PDF p\. 3/);assert.match(c,/DOU 27\/12\/2002/);
 assert.doesNotMatch(c,/8 turmas em 2025/);
});
test('estudos acadêmicos não são apresentados como avaliação da IA',()=>{
 const c=buildResearchContext('A pesquisa de geografia prova que a IA melhorou as notas?');
 assert.match(c,/nem comprova impacto de sua IA/);assert.match(c,/pesquisa em andamento/);
 assert.equal(buildResearchContext('Quanto é dois mais dois?'),'');
});
test('divergências de posse sobrevivem à seleção de contexto de uma pergunta ampla',()=>{
 const c=buildResearchContext('Explique a pesquisa de educação do campo, PPP, escola, assentamento Lagoa do Mineiro, alunos, território e geografia.');
 assert.match(c,/25\/07\/1986/);assert.match(c,/19\/09\/1986/);
 assert.match(c,/não escolha uma data/);assert.match(c,/páginas 12 e 15/);
 assert.match(c,/03\/03\/2011/);assert.match(c,/não identifica a primeira diretora/);
 assert.equal((c.match(/"id":/g)||[]).length,5);
});
test('reportagem não pode apoiar número ou citação em outro trecho não citado',()=>{
 const source={pesquisa:'O estudo histórico registrou 249 alunos.\nO registro atual da turma menciona 2026.\nA pessoa entrevistada disse: “Aprendemos juntos”.'};
 assert.equal(researchSource(source).trechos.length,3);
 const part=(texto,fontes=[0])=>({texto,fontes});
 const value={titulo:part('Estudo sobre a escola'),subtitulo:part('Registro histórico'),abertura:part('O estudo registrou 249 alunos.'),secoes:[{intertitulo:'Contexto',...part('Registro escolar.')}],cards:[],lacunas:[]};
 assert.doesNotThrow(()=>validateReport(JSON.stringify(value),source));
 value.abertura=part('Em 2026 havia 249 alunos.');
 assert.throws(()=>validateReport(JSON.stringify(value),source),/trechos citados/);
 value.abertura=part('A pessoa disse “Aprendemos juntos”.');
 assert.throws(()=>validateReport(JSON.stringify(value),source),/trechos citados/);
 value.abertura=part('A pessoa disse “Aprendemos juntos”.',[2]);
 assert.doesNotThrow(()=>validateReport(JSON.stringify(value),source));
});
