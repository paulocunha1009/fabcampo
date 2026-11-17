const assert=require('node:assert/strict'),{test}=require('node:test'),vm=require('node:vm'),fs=require('node:fs');
for(const client of ['standalone','module'])for(const item of [
 {q:'Em que ano foi criada a escola?',answer:/3 de março de 2011/},
 {q:'Quem é a diretora da escola?',answer:/Maria Ivaniza Martins de Sousa Nascimento/},
 {q:'Quem foi a primeira diretora?',answer:/não identifica quem foi a primeira diretora/},
 {q:'Quem fundou a escola?',answer:/Não identifica uma única pessoa como fundadora/}
])test(client+': PPP disponível quando a API retorna 429: '+item.q,async()=>{
 const context=vm.createContext({window:{PORTAL_AI_ENDPOINT:'https://api.example.test',location:{pathname:'/',href:'https://fabcampo.com.br/',origin:'https://fabcampo.com.br'}},document:{readyState:'loading',addEventListener(){}},AbortSignal,fetch:async()=>({ok:false,status:429,json:async()=>({error:'Limite'})})});
 let source=fs.readFileSync(client==='standalone'?'js/chat-standalone.js':'js/services/ai-service.js','utf8');source=client==='standalone'?source.replace('  // ── Inicia quando o DOM estiver pronto','  globalThis.ask=perguntarAssistente;\n  // ── Inicia quando o DOM estiver pronto'):source.replace('export async function','async function')+'\nglobalThis.ask=perguntarAssistente;';vm.runInContext(source,context);const result=await context.ask(item.q,[]);assert.equal(result.local,true);assert.match(result.content,item.answer);assert.match(result.content,/PPP/);assert.match(result.content,/sem geração por IA/);assert.equal(result.pages[0].url,'pages/historia.html');
});
