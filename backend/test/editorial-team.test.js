import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {once} from 'node:events';
import {createEditorialTeam,createTeamRouter} from '../lib/editorial-team.js';
import {createEditorialAuth} from '../lib/editorial-auth.js';
function fixture(){
 let value=null;const bindings=new Map();const redis={get:async()=>value,eval:async(_script,_keys,args)=>{const revision=value?.revisao||0;if(revision!==Number(args[0]))return 0;value=JSON.parse(args[1]);return 1;}};
 const team=createEditorialTeam({redis,namespace:'test',clock:()=>1800000000000});
 const payload={aud:'fixture',iss:'https://accounts.google.com',exp:1800000600,email_verified:true,sub:'owner',email:'paulo.cunha1@prof.ce.gov.br'};
 const auth=createEditorialAuth({clientId:'fixture',allowedSubjects:'owner',approvedPublisherEmails:'student@example.test',teamEnabled:true,team,clock:()=>1800000000000,verifyIdToken:async()=>({getPayload:()=>({...payload})}),enrollment:{bind:async account=>{const old=bindings.get(account.email);if(old&&old!==account.id)return false;bindings.set(account.email,account.id);return true;}}});
 return{team,auth,payload,redis};
}
const token='Bearer a.b.c';
test('somente o sub original e o e-mail do professor gerenciam; publicador não administra',async()=>{
 const f=fixture();assert.equal(f.auth.isManager(await f.auth.authenticate(token)),true);
 f.payload.sub='student';f.payload.email='student@example.test';assert.equal(f.auth.isManager(await f.auth.authenticate(token)),false);
 f.payload.email='paulo.cunha1@prof.ce.gov.br';await assert.rejects(()=>f.auth.authenticate(token),{status:403});
});
test('permissão dinâmica prevalece sobre configuração: rebaixamento e retirada valem na próxima operação',async()=>{
 const f=fixture(),actor={email:'paulo.cunha1@prof.ce.gov.br'};f.payload.sub='student';f.payload.email='student@example.test';await f.auth.authenticate(token,{publicar:true});
 await f.team.save({email:f.payload.email,papel:'rascunhos',revisao:0},actor);
 assert.deepEqual(f.auth.permissions(await f.auth.authenticate(token)),{rascunhos:true,publicar:false});await assert.rejects(()=>f.auth.authenticate(token,{publicar:true}),{status:403});
 await f.team.save({email:f.payload.email,papel:'inativo',revisao:1},actor);await assert.rejects(()=>f.auth.authenticate(token),{status:403});
 await f.team.save({email:f.payload.email,papel:'publicador',revisao:2},actor);await f.auth.authenticate(token,{publicar:true});
 f.payload.sub='different-sub';await assert.rejects(()=>f.auth.authenticate(token),{status:403,code:'EDITORIAL_ACCOUNT_BINDING_MISMATCH'});
});
test('equipe falha fechada para integrantes e preserva acesso do responsável',async()=>{
 const f=fixture();f.redis.get=async()=>{throw Error('provider-secret');};await f.auth.authenticate(token);f.payload.sub='student';f.payload.email='student@example.test';await assert.rejects(()=>f.auth.authenticate(token),{status:503,message:'EDITORIAL_TEAM_UNAVAILABLE'});
});
test('CAS impede sobrescrita entre abas e rejeita permissões, curingas e revisões inválidas',async()=>{
 const f=fixture(),actor={email:'owner@example.test'};const results=await Promise.allSettled([f.team.save({email:'a@example.test',papel:'rascunhos',revisao:0},actor),f.team.save({email:'b@example.test',papel:'publicador',revisao:0},actor)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
 for(const patch of [{email:'*@example.test'},{papel:'admin'},{revisao:-1}])await assert.rejects(()=>f.team.save({email:'a@example.test',papel:'rascunhos',revisao:1,...patch},actor),{status:400});
 assert.equal((await f.team.read()).membros.length,1);
});
test('rotas exigem administrador, confirmação e protegem a própria conta; lista une configuração e alterações',async()=>{
 const f=fixture(),app=express();app.use(createTeamRouter({auth:f.auth}));const server=app.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}/api/editorial/equipe`;
 async function request(body){const response=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
 try{
  let response=await request();assert.equal(response.status,200);assert.equal(response.data.membros[0].email,'student@example.test');
  assert.equal((await request({email:'other@example.test',papel:'rascunhos',revisao:0})).status,400);
  assert.equal((await request({email:'PAULO.CUNHA1@PROF.CE.GOV.BR',papel:'inativo',revisao:0,confirmado:true})).status,400);
  assert.equal((await request({email:'student@example.test',papel:'rascunhos',revisao:0,confirmado:true})).status,200);
  response=await request();assert.equal(response.data.membros.length,1);assert.equal(response.data.membros[0].papel,'rascunhos');
  f.payload.sub='student';f.payload.email='student@example.test';assert.equal((await request()).status,403);assert.equal((await request({email:'intruder@example.test',papel:'publicador',revisao:1,confirmado:true})).status,403);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
