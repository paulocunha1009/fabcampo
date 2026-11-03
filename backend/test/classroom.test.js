import assert from 'node:assert/strict';
import { test } from 'node:test';
process.env.VERCEL = '1';
process.env.DOTENV_CONFIG_PATH = '.env.test-not-present';
for(const key of ['GEMINI_API_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','UPSTASH_REDIS_REST_KV_REST_API_URL','UPSTASH_REDIS_REST_KV_REST_API_TOKEN']) delete process.env[key];
process.env.RATE_LIMIT_PER_IP_MIN = '30';
process.env.RATE_LIMIT_GLOBAL_MIN = '15';
process.env.RATE_LIMIT_GLOBAL_DAY = '200';
process.env.REQUIRE_PERSISTENT_RATE_LIMIT = 'true';
const { createApp } = await import('../server.js');
const { createRateLimiter } = await import('../lib/rate-limit.js');
const clock = () => Date.UTC(2026,10,3,12,0,10);

async function listen(app){
  const server = await new Promise(resolve => { const s = app.listen(0,'127.0.0.1',()=>resolve(s)); });
  return { url:`http://127.0.0.1:${server.address().port}`, close:()=>new Promise(resolve=>server.close(resolve)) };
}
function post(url, ip){
  return fetch(`${url}/api/assistente`,{ method:'POST',headers:{'Content-Type':'application/json',Origin:'https://fabcampo.com.br','X-Forwarded-For':ip},body:JSON.stringify({message:'Quero consultar o acervo.',history:[]}) });
}

for(const network of ['mesma rede','redes diferentes']){
  test(`40 acessos HTTP em duas instâncias na ${network} compartilham a cota`, async () => {
    const counters = new Map();
    const redis = { async incr(key){const n=(counters.get(key)||0)+1;counters.set(key,n);return n;},async expire(){return 1;} };
    let generated=0;
    const aiClient={models:{async generateContent(){generated++;return {text:'{"type":"message","content":"Consulte o acervo do portal."}'};}}};
    const servers = await Promise.all([1,2].map(()=>listen(createApp({aiClient,rateLimiter:createRateLimiter({redis,clock})}))));
    try{
      const results = await Promise.all(Array.from({length:40},async(_,i)=>{
        const response=await post(servers[i%2].url,network==='mesma rede'?'192.0.2.10':`192.0.2.${i+1}`);
        return {status:response.status,retry:response.headers.get('retry-after'),body:await response.json()};
      }));
      assert.equal(results.filter(r=>r.status===200).length,15);
      assert.equal(results.filter(r=>r.status===429).length,25);
      assert.equal(generated,15);
      assert.ok(results.filter(r=>r.status===429).every(r=>r.body.code==='RATE_LIMITED' && r.retry==='60'));
    }finally{await Promise.all(servers.map(s=>s.close()));}
  });
}

test('falha ou ausência do contador persistente impede chamadas à IA',async()=>{
  for(const redis of [null,{async incr(){throw new Error('Falha simulada do contador');}}]){
    let calls=0;
    const server=await listen(createApp({aiClient:{models:{async generateContent(){calls++;}}},rateLimiter:createRateLimiter({redis,clock})}));
    try{
      const response=await post(server.url,'192.0.2.10');
      assert.equal(response.status,503);
      assert.match((await response.json()).code,/RATE_LIMIT_(UNAVAILABLE|ERROR)/);
      assert.equal(calls,0);
    }finally{await server.close();}
  }
});
