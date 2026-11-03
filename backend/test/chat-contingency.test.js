import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

for(const client of ['standalone','module']){
  for(const failure of ['timeout','rate-limit']){
    test(`${client} usa resposta local quando ocorre ${failure}`,async()=>{
      let timeout;
      const sandbox={
        window:{PORTAL_AI_ENDPOINT:'https://api.example.test/api/assistente',location:{pathname:'/',href:'https://fabcampo.com.br/',origin:'https://fabcampo.com.br'}},
        document:{readyState:'loading',addEventListener(){}},
        AbortSignal:{timeout(ms){timeout=ms;return {aborted:failure==='timeout'};}},
        fetch:async(_url,options)=>{
          assert.ok(options.signal);
          if(failure==='timeout') throw new Error('Timeout simulado');
          return {ok:false,status:429,json:async()=>({error:'Limite atingido.'})};
        }
      };
      let source=readFileSync(new URL(client==='standalone'?'../../js/chat-standalone.js':'../../js/services/ai-service.js',import.meta.url),'utf8');
      source=client==='standalone'?source.replace('  // ── Inicia quando o DOM estiver pronto','  globalThis.ask = perguntarAssistente;\n  // ── Inicia quando o DOM estiver pronto'):source.replace('export async function','async function')+'\nglobalThis.ask = perguntarAssistente;';
      const context=vm.createContext(sandbox);vm.runInContext(source,context);
      const answer=await context.ask('história',[]);
      assert.equal(timeout,25000);
      assert.equal(answer.local,true);
      assert.equal(answer.type,'recommendations');
      assert.ok(answer.pages.length);
    });
  }
}
