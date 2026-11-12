import express from 'express';
import {Redis} from '@upstash/redis';
const fail=(status,code)=>Object.assign(new Error(code),{status,code});
export const TEAM_CAS=`
local raw=redis.call('GET',KEYS[1])
local revision=0
if raw then revision=cjson.decode(raw).revisao end
if revision~=tonumber(ARGV[1]) then return 0 end
redis.call('SET',KEYS[1],ARGV[2])
return 1`;
const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@*]+@[^\s@*]+\.[^\s@*]+$/.test(value);
function environmentRedis(){const url=process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;return url&&token?new Redis({url,token}):null;}
export function createEditorialTeam({redis=environmentRedis(),namespace=process.env.VERCEL_ENV||'local',clock=Date.now}={}){
 const key=`campo-digital:${namespace}:{editorial-access}:team`;
 async function read(){
  if(!redis)throw fail(503,'EDITORIAL_TEAM_UNAVAILABLE');
  let value;try{value=await redis.get(key);}catch{throw fail(503,'EDITORIAL_TEAM_UNAVAILABLE');}
  if(value===null)return {revisao:0,membros:[]};
  try{if(typeof value==='string')value=JSON.parse(value);if(!Number.isSafeInteger(value?.revisao)||value.revisao<1||!Array.isArray(value.membros)||value.membros.length>100||value.membros.some(m=>!validEmail(m.email)||!['rascunhos','publicador','inativo'].includes(m.papel))||new Set(value.membros.map(m=>m.email)).size!==value.membros.length)throw Error();return value;}catch{throw fail(503,'EDITORIAL_TEAM_UNAVAILABLE');}
 }
 return {read,async find(email){return (await read()).membros.find(m=>m.email===email.toLowerCase());},async save({email,papel,revisao},actor){
  if(!validEmail(email)||!['rascunhos','publicador','inativo'].includes(papel)||!Number.isSafeInteger(revisao)||revisao<0)throw fail(400,'EDITORIAL_TEAM_INVALID');
  email=email.trim().toLowerCase();const current=await read();if(current.revisao!==revisao)throw fail(409,'EDITORIAL_TEAM_CONFLICT');
  const membros=current.membros.filter(m=>m.email!==email);if(membros.length>=100)throw fail(400,'EDITORIAL_TEAM_LIMIT');
  membros.push({email,papel,atualizadoEm:new Date(clock()).toISOString(),alteradoPor:actor.email});
  const next={revisao:revisao+1,membros};let result;
  try{result=await redis.eval(TEAM_CAS,[key],[String(revisao),JSON.stringify(next)]);}catch{throw fail(503,'EDITORIAL_TEAM_UNAVAILABLE');}
  if(Number(result)!==1)throw fail(409,'EDITORIAL_TEAM_CONFLICT');return next;
 }};
}
export function createTeamRouter({auth,team=auth.team}={}){
 const router=express.Router();
 router.use('/api/editorial/equipe',async(req,res,next)=>{res.set('Cache-Control','no-store');try{const account=await auth.authenticate(req.headers.authorization);if(!auth.isManager?.(account))throw fail(403,'EDITORIAL_TEAM_DENIED');req.teamActor=account;next();}catch(error){res.status([401,403,503].includes(error.status)?error.status:503).json({error:'Somente o professor responsável pode gerenciar a equipe.'});}});
 router.get('/api/editorial/equipe',async(req,res)=>{try{const data=await team.read();const entries=new Map(auth.approvedEmails.map(email=>[email,{email,papel:'publicador',origem:'configuracao'}]));for(const m of data.membros)entries.set(m.email,{email:m.email,papel:m.papel,origem:'painel',atualizadoEm:m.atualizadoEm});res.json({revisao:data.revisao,responsavel:req.teamActor.email,membros:[...entries.values()].sort((a,b)=>a.email.localeCompare(b.email))});}catch{res.status(503).json({error:'Não foi possível consultar a equipe. Nenhum acesso foi alterado.'});}});
 router.post('/api/editorial/equipe',express.json({limit:'2kb'}),async(req,res)=>{try{if(req.body?.confirmado!==true)throw fail(400,'EDITORIAL_TEAM_CONFIRM_REQUIRED');const email=typeof req.body.email==='string'?req.body.email.trim().toLowerCase():'';if(auth.isProtectedEmail(email))throw fail(400,'EDITORIAL_TEAM_OWNER_PROTECTED');const next=await team.save({...req.body,email},req.teamActor);res.json({revisao:next.revisao,email,papel:req.body.papel});}catch(error){const status=[400,409,503].includes(error.status)?error.status:503;res.status(status).json({error:status===409?'A equipe foi alterada em outra aba. Consulte a lista novamente.':status===400?'Confira o e-mail, a permissão e a confirmação. A conta do professor é protegida.':'Não foi possível confirmar a alteração. Consulte a lista antes de tentar novamente.'});}});
 return router;
}
