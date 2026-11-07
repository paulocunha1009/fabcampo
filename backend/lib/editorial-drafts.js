import express from 'express';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';
import {validarPesquisaArquivo} from './editorial-research-file.js';

const fail = (status, message) => Object.assign(new Error(message), {status});
const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
function environmentRedis() {
  if(process.env.EDITORIAL_DRAFTS_ENABLED !== 'true') return null;
  const url=process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token=process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  return url && token ? new Redis({url,token}) : null;
}
export function validateDraftInput(value) {
  if(!value || !['noticias','eventos'].includes(value.tipo) || !value.registro ||
    typeof value.registro !== 'object' || Array.isArray(value.registro) ||
    !Number.isInteger(value.revisao) || value.revisao < 0 || (value.id !== undefined && !validId(value.id)))
    throw fail(400,'Rascunho inválido. Confira o registro antes de salvar.');
  const title=value.registro[value.tipo === 'noticias' ? 'titulo':'nome'];
  if(typeof title !== 'string' || !title.trim() || title.length>160)
    throw fail(400,'Informe o título do rascunho.');
  if(Buffer.byteLength(JSON.stringify(value.registro),'utf8')>256*1024)
    throw fail(413,'Este rascunho ultrapassa 256 KB. As fotos devem ser enviadas separadamente.');
  if(value.registro.fotos !== undefined && (!Array.isArray(value.registro.fotos) || value.registro.fotos.length>10))
    throw fail(400,'Use no máximo dez fotos no rascunho.');
  // Drafts are private editorial data, not approved/publishable HTML. Full
  // publication validation is a separate step; no route here publishes content.
  const allowed=['titulo','subtitulo','pesquisa','pesquisaArquivo','nome','resumo','texto','descricao','categoria','fonte','link','data','local','horario',
    'publico','participacao','responsavel','contato','imagem','legenda','credito','textoAlternativo','modelo','cards','fotos','video','icone','classe'];
  const registro=Object.fromEntries(allowed.filter(key=>Object.hasOwn(value.registro,key)).map(key=>[key,value.registro[key]]));
  if(registro.pesquisaArquivo){try{registro.pesquisaArquivo=validarPesquisaArquivo(registro.pesquisaArquivo);}catch{throw fail(400,'Confira o arquivo de pesquisa e seus limites.');}}
  return {id:value.id,tipo:value.tipo,revisao:value.revisao,registro};
}

// Single atomic compare-and-set: stale revisions never overwrite another editor.
// Five previous revisions are retained. No TTL silently expires editorial work.
export const SAVE_DRAFT_SCRIPT = `
local raw=redis.call('HGET',KEYS[1],ARGV[1])
local old=nil
if raw then old=cjson.decode(raw) end
local expected=tonumber(ARGV[2])
if (old and old.revisao~=expected) or (not old and expected~=0) then return -1 end
if not old and redis.call('HLEN',KEYS[1])>=50 then return -2 end
local next=cjson.decode(ARGV[3])
next.revisao=expected+1
next.historico={}
if old then
  table.insert(next.historico,{revisao=old.revisao,atualizadoEm=old.atualizadoEm,tipo=old.tipo,registro=old.registro})
  if old.historico then for i=1,math.min(4,#old.historico) do table.insert(next.historico,old.historico[i]) end end
end
redis.call('HSET',KEYS[1],ARGV[1],cjson.encode(next))
redis.call('HSET',KEYS[2],ARGV[1],cjson.encode({id=next.id,tipo=next.tipo,revisao=next.revisao,titulo=ARGV[4],atualizadoEm=next.atualizadoEm}))
return next.revisao`;

export function createDraftStore({redis=environmentRedis(),clock=Date.now}={}) {
  const namespace=process.env.VERCEL_ENV || 'local';
  const keys=[`campo-digital:${namespace}:{editorial-drafts}:items`,`campo-digital:${namespace}:{editorial-drafts}:index`];
  const requireStore=()=>{if(!redis)throw fail(503,'O salvamento no painel ainda não está ativado. Baixe o rascunho para preservar o texto.');};
  const decode=value=>typeof value==='string' ? JSON.parse(value):value;
  async function list() {
    requireStore();const items=await redis.hgetall(keys[1]);
    return Object.values(items || {}).map(decode).sort((a,b)=>b.atualizadoEm.localeCompare(a.atualizadoEm));
  }
  async function get(id) {
    requireStore();if(!validId(id))throw fail(400,'Identificação de rascunho inválida.');
    const value=await redis.hget(keys[0],id);if(!value)throw fail(404,'Rascunho não encontrado.');const result=decode(value);return {...result,historico:Array.isArray(result.historico)?result.historico:[]};
  }
  async function save(input) {
    requireStore();const value=validateDraftInput(input);const id=value.id || randomUUID();
    const document={id,tipo:value.tipo,revisao:value.revisao,registro:value.registro,atualizadoEm:new Date(clock()).toISOString(),status:'rascunho'};
    const title=value.registro[value.tipo === 'noticias' ? 'titulo':'nome'].trim();
    const revision=Number(await redis.eval(SAVE_DRAFT_SCRIPT,keys,[id,value.revisao,JSON.stringify(document),title]));
    if(revision===-1)throw fail(409,'Existe uma versão mais recente. Seu texto foi preservado: baixe-o antes de abrir a versão do painel.');
    if(revision===-2)throw fail(409,'O painel atingiu o limite de 50 rascunhos. Baixe o arquivo e procure a equipe responsável.');
    if(!Number.isInteger(revision) || revision!==value.revisao+1)throw fail(502,'O armazenamento não confirmou o salvamento.');
    return {...document,revisao:revision};
  }
  return {configured:Boolean(redis),list,get,save};
}

export function createDraftRouter({auth,store=createDraftStore()}) {
  const router=express.Router();
  router.use('/api/editorial/rascunhos',async(req,res,next)=>{
    try {await auth.authenticate(req.headers.authorization);next();}
    catch(error){res.status([401,403,503].includes(error.status)?error.status:503).json({error:'Entre com uma conta autorizada para acessar os rascunhos.'});}
  });
  const execute=action=>async(req,res)=>{try{res.json(await action(req));}catch(error){res.status([400,404,409,413,502,503].includes(error.status)?error.status:503).json({error:error.status?error.message:'Não foi possível confirmar o acesso ao rascunho. Tente novamente.'});}};
  router.get('/api/editorial/rascunhos',execute(async()=>({rascunhos:await store.list()})));
  router.get('/api/editorial/rascunhos/:id',execute(req=>store.get(req.params.id)));
  router.post('/api/editorial/rascunhos',express.json({limit:'320kb'}),execute(req=>store.save(req.body)));
  return router;
}
