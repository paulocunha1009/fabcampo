import assert from 'node:assert/strict';
import {test} from 'node:test';
import express from 'express';
import {createReportRouter,researchSource,validateResearch,validateReport} from '../lib/editorial-report.js';
import {validarRegistro,montarRascunho} from '../../painel/editorial-core.js';
import {validateDraftInput} from '../lib/editorial-drafts.js';
const pesquisa='Registro de teste.\nAna\nEm 2026 a turma registrou uma entrevista na escola. A pessoa entrevistada disse: “A escola faz parte da comunidade”. A data da entrevista ainda precisa de confirmação.';
const source={pesquisa};
const part=texto=>({texto,fontes:[2]});
const output=()=>({titulo:part('Turma registra entrevista na escola'),subtitulo:part('Pesquisa reúne um relato sobre a comunidade'),abertura:part('A turma registrou uma entrevista na escola em 2026.'),secoes:[{intertitulo:'Relato registrado',...part('A pessoa entrevistada disse: “A escola faz parte da comunidade”.')}],cards:[{titulo:'Relato',trechoId:2}],lacunas:['quando']});
test('pesquisa preserva linhas de atribuição e exige material suficiente',()=>{
  assert.deepEqual(validateResearch(source),source);
  assert.equal(researchSource(source).trechos[1].texto,'Ana');
  for(const pesquisa of ['', 'x'.repeat(119),'x'.repeat(12001),null])assert.throws(()=>validateResearch({pesquisa}));
});
test('proposta exige evidências existentes, números e citações registrados',()=>{
  const result=validateReport(JSON.stringify(output()),source);
  assert.equal(result.requiresReview,true);assert.equal(result.abertura.fontes[0].texto,researchSource(source).trechos[2].texto);
  for(const change of [value=>value.titulo.fontes=[99],value=>value.abertura.texto='Participaram 500 alunos.',value=>value.abertura.texto='A pessoa disse “uma fala inventada”.',value=>value.lacunas=['inventar data'],value=>value.secoes=[]]){
    const value=output();change(value);assert.throws(()=>validateReport(JSON.stringify(value),source));
  }
});
test('pesquisa original e subtítulo sobrevivem ao rascunho local e privado',()=>{
  const registro={titulo:'Teste',resumo:'Resumo',categoria:'Portal',fonte:'Equipe',pesquisa,subtitulo:'Subtítulo de teste'};
  assert.equal(validarRegistro('noticias',registro).pesquisa,pesquisa);
  assert.equal(montarRascunho({noticias:[registro],eventos:[]}).noticias[0].subtitulo,registro.subtitulo);
  assert.equal(validateDraftInput({tipo:'noticias',registro,revisao:0}).registro.pesquisa,pesquisa);
});
test('rota verifica acesso e pesquisa antes de consumir a cota compartilhada',async()=>{
  let allowed=false,calls=0,limits=0;
  const app=express();app.use(createReportRouter({auth:{authenticate:async()=>{if(!allowed)throw Object.assign(new Error(),{status:403});}},aiClient:{models:{generateContent:async options=>{calls++;assert.equal(options.config.maxOutputTokens,1000);assert.equal(JSON.parse(options.contents).trechos[1].texto,'Ana');return {text:JSON.stringify(output())};}}},rateLimiter:{middleware:(_req,_res,next)=>{limits++;next();}},model:'test',maxTokens:1000}));
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const send=body=>fetch(`http://127.0.0.1:${server.address().port}/api/editorial/reportagem`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    assert.equal((await send(source)).status,403);assert.equal(calls,0);
    allowed=true;assert.equal((await send({pesquisa:'curto'})).status,400);assert.equal(limits,0);
    const response=await send(source);assert.equal(response.status,200);assert.equal((await response.json()).requiresReview,true);assert.equal(calls,1);assert.equal(limits,1);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
