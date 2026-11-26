const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');

function client(kind,pathname){
 let calls=0;
 const context=vm.createContext({window:{PORTAL_AI_ENDPOINT:'https://api.example.test',location:{pathname,href:'https://fabcampo.com.br'+pathname,origin:'https://fabcampo.com.br'}},document:{readyState:'loading',addEventListener(){}},AbortSignal,fetch:async()=>{calls++;return {ok:true,json:async()=>({answer:{type:'message',content:'Resposta simulada da API'}})};}});
 let source=fs.readFileSync(kind==='standalone'?'js/chat-standalone.js':'js/services/ai-service.js','utf8');
 source=kind==='standalone'?source.replace('  // ── Inicia quando o DOM estiver pronto','  globalThis.ask=perguntarAssistente;\n  // ── Inicia quando o DOM estiver pronto'):source.replace('export async function','async function')+'\nglobalThis.ask=perguntarAssistente;';
 vm.runInContext(source,context);
 return {ask:(q)=>context.ask(q,[]),calls:()=>calls};
}
for(const kind of ['standalone','module'])for(const path of ['/','/pages/historia.html']){
 test(`${kind} ${path}: números históricos e marcos com atribuição, sem API`,async()=>{
  const c=client(kind,path);
  for(const question of ['Quantos alunos tem a escola?','Quantos alunos há na escola?','QUANTOS ALUNOS TEM A ESCOLA HOJE?!','Os 249 alunos são de 2025 ou 2026?']){
   const r=await c.ask(question);assert.equal(r.localReason,'verified');assert.match(r.content,/Não há matrícula atual confirmada/);assert.match(r.content,/página 3/);assert.match(r.content,/não comprova matrícula de 2025 ou 2026/);
  }
  for(const question of ['Quando foi criado o assentamento Lagoa do Mineiro?','Em que ano foi criado o assentamento?']){
   const r=await c.ask(question);assert.match(r.content,/26\/06\/1986/);assert.match(r.content,/13\/07\/1987/);assert.match(r.content,/DOU/);
  }
  for(const question of ['Quando foi a posse do assentamento?','Qual é a data da posse do assentamento Lagoa do Mineiro?']){
   const r=await c.ask(question);assert.match(r.content,/25\/07\/1986/);assert.match(r.content,/19\/09\/1986/);assert.match(r.content,/páginas 12 e 15/);assert.match(r.content,/Não escolhemos uma versão/);assert.equal(r.pages[0].url,path==='/'?'pages/historia.html':'historia.html');
  }
  assert.equal(c.calls(),0);
 });
 test(`${kind} ${path}: 32 consultas documentais e pedidos compostos separados`,async()=>{
  const c=client(kind,path),qs=['Quantos alunos tem a escola?','Quando foi a posse do assentamento?','Quando foi criado o assentamento Lagoa do Mineiro?'];
  const results=await Promise.all(Array.from({length:32},(_,i)=>c.ask(qs[i%3])));
  assert.equal(c.calls(),0);for(const r of results)assert.equal(r.local,true);
  for(const q of ['Quando foi a posse do assentamento Maceió?','Quantos alunos tem a escola? Compare com outras escolas.','Quando foi criado o assentamento? Gere um quiz.','A posse foi em 2014?','Qual é a matrícula atual de outra escola?']){
   const r=await c.ask(q);assert.equal(r.content,'Resposta simulada da API');
  }
  assert.equal(c.calls(),5);
 });
}

for(const kind of ['standalone','module'])for(const path of ['/','/pages/historia.html']){
 test(`${kind} ${path}: apresentação do projeto sem depender da API`,async()=>{
  const c=client(kind,path);
  for(const q of ['fale sobre o projeto deste portal','Fale sobre o projeto desse portal!','O que é o Campo Digital?','Qual o objetivo do projeto Campo Digital?']){
   const r=await c.ask(q);assert.equal(r.localReason,'verified');assert.match(r.content,/pesquisa documental/);assert.match(r.content,/Gemini/);assert.match(r.pages[0].url,/index.html#titulo-campo-digital$/);
  }
  assert.equal(c.calls(),0);
  for(const q of ['Fale sobre o projeto deste portal e compare com outro','Fale sobre o projeto de outro portal'])assert.equal((await c.ask(q)).content,'Resposta simulada da API');
  assert.equal(c.calls(),2);
 });
}
