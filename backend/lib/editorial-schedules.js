import express from 'express';
import {Redis} from '@upstash/redis';
const fail=(status,message)=>Object.assign(new Error(message),{status});
export const catalogoAgendavel=[{id:'caravana-afro',titulo:'Caravana Afro',caminho:'/pages/caravana-afro.html'}];
export const agendamentoInicial={revisao:0,itens:[{id:'caravana-afro',inicio:'2026-12-07T15:30:00-03:00',ativo:true}]};
export const SCHEDULE_CAS=`local raw=redis.call('GET',KEYS[1]);local revision=0;if raw then revision=cjson.decode(raw).revisao end;if revision~=tonumber(ARGV[1]) then return 0 end;redis.call('SET',KEYS[1],ARGV[2]);return 1`;
function environmentRedis(){const url=process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;return url&&token?new Redis({url,token}):null;}
export function validarAgendamento(value){
 if(!catalogoAgendavel.some(p=>p.id===value?.id)||typeof value.ativo!=='boolean'||!Number.isSafeInteger(value.revisao)||value.revisao<0||typeof value.inicio!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00-03:00$/.test(value.inicio))throw fail(400,'Confira a página, a data e o horário.');
 const time=Date.parse(value.inicio);if(!Number.isFinite(time)||time<Date.parse('2026-01-01')||time>Date.parse('2100-01-01')||new Date(time-3*3600000).toISOString().slice(0,19)!==value.inicio.slice(0,19))throw fail(400,'Informe uma data e um horário válidos.');
 return {id:value.id,inicio:value.inicio,ativo:value.ativo};
}
export function estadoAgendamento(item,now){return !item.ativo?'cancelado':Date.parse(item.inicio)<=now?'visivel':'agendado';}
export function criarAgendamentos({redis=environmentRedis(),namespace=process.env.VERCEL_ENV||'local',clock=Date.now}={}){
 const key=`campo-digital:${namespace}:{editorial-schedules}:menu`;
 async function read(){if(!redis)throw fail(503,'O armazenamento de agendamentos não está disponível.');let value=await redis.get(key);if(value===null)return structuredClone(agendamentoInicial);if(typeof value==='string')value=JSON.parse(value);if(!Number.isSafeInteger(value?.revisao)||value.revisao<1||!Array.isArray(value.itens)||value.itens.length>catalogoAgendavel.length||new Set(value.itens.map(i=>i.id)).size!==value.itens.length)throw fail(503,'Não foi possível conferir a programação.');for(const item of value.itens)validarAgendamento({...item,revisao:value.revisao});return value;}
 return {read,async list(){const data=await read(),agora=clock();return {...data,agora:new Date(agora).toISOString(),fuso:'America/Fortaleza',catalogo:catalogoAgendavel,itens:data.itens.map(item=>({...item,...catalogoAgendavel.find(p=>p.id===item.id),estado:estadoAgendamento(item,agora)}))};},async publicMenu(){const data=await read(),now=clock();return {agora:new Date(now).toISOString(),itens:data.itens.filter(item=>estadoAgendamento(item,now)==='visivel').map(item=>catalogoAgendavel.find(p=>p.id===item.id))};},async save(input,actor){if(input?.confirmado!==true)throw fail(400,'Confira e confirme a programação.');const item=validarAgendamento(input),current=await read();if(current.revisao!==input.revisao)throw fail(409,'A programação mudou em outra aba. Consulte novamente.');if(item.ativo&&Date.parse(item.inicio)<=clock())throw fail(400,'Para agendar, escolha um horário futuro.');const next={revisao:input.revisao+1,itens:[...current.itens.filter(i=>i.id!==item.id),{...item,alteradoEm:new Date(clock()).toISOString(),alteradoPor:actor.email}]};if(Number(await redis.eval(SCHEDULE_CAS,[key],[String(input.revisao),JSON.stringify(next)]))!==1)throw fail(409,'A programação mudou. Consulte novamente.');return this.list();}};
}
export function createScheduleRouter({auth,store=criarAgendamentos()}={}){
 const router=express.Router();
 router.get('/api/menu-agendado',async(_req,res)=>{res.set('Cache-Control','no-store');try{res.json(await store.publicMenu());}catch{res.status(503).json({error:'Menu programado temporariamente indisponível.'});}});
 router.use('/api/editorial/agendamentos',async(req,res,next)=>{res.set('Cache-Control','no-store');try{const account=await auth.authenticate(req.headers.authorization);if(!auth.isManager?.(account))throw fail(403,'Somente o professor responsável pode administrar agendamentos.');req.scheduleActor=account;next();}catch(error){res.status([401,403,503].includes(error.status)?error.status:503).json({error:'Entre com a conta do professor responsável para administrar agendamentos.'});}});
 router.get('/api/editorial/agendamentos',async(_req,res)=>{try{res.json(await store.list());}catch{res.status(503).json({error:'Não foi possível consultar os agendamentos.'});}});
 router.post('/api/editorial/agendamentos',express.json({limit:'3kb'}),async(req,res)=>{try{res.json(await store.save(req.body,req.scheduleActor));}catch(error){const status=[400,409].includes(error.status)?error.status:503;res.status(status).json({error:status===503?'Não foi possível confirmar o salvamento. Consulte novamente antes de repetir.':error.message});}});
 return router;
}
