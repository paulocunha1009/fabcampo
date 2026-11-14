import express from 'express';
import sharp from 'sharp';
import {Redis} from '@upstash/redis';
import {createHash,createHmac} from 'node:crypto';
export const MURAL_CONSENT_VERSION='caravana-2026-v1';
export const MURAL_LIMIT=200,RETENTION_SECONDS=90*86400;
const masks=new Set(['punu','dan','baule','kanaga','mwana-pwo','bwa','chokwe','dogon','yoruba']);
const idOK=id=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const decode=value=>typeof value==='string'?JSON.parse(value):value;
function environmentRedis(){const url=process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;return url&&token?new Redis({url,token}):null;}
export async function prepararFotoMural(input){
 if(!idOK(input?.id)||!masks.has(input.mascara)||input.consentimento?.versao!==MURAL_CONSENT_VERSION||input.consentimento?.mural!==true||typeof input.consentimento?.reportagem!=='boolean'||typeof input.imagem!=='string'||input.imagem.length>1000000||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.imagem))throw fail(400,'Confira a foto e a autorização para enviar ao mural.');
 const bytes=Buffer.from(input.imagem,'base64');if(!bytes.length||bytes.length>700000)throw fail(413,'A foto está muito grande. Tire outra foto pelo filtro.');
 try{const image=sharp(bytes,{limitInputPixels:12000000,animated:false}),meta=await image.metadata();if(!['jpeg','webp','png'].includes(meta.format)||(meta.pages||1)!==1||!meta.width||!meta.height||meta.width<100||meta.height<100)throw Error();
 let full;for(const quality of [82,70,58]){full=await sharp(bytes).rotate().resize({width:1200,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality}).toBuffer();if(full.length<=120000)break;}if(full.length>120000)full=await sharp(bytes).rotate().resize({width:850,height:1000,fit:'inside',withoutEnlargement:true}).webp({quality:60}).toBuffer();if(full.length>120000)throw Error();
 const thumb=await sharp(full).resize({width:440,height:520,fit:'inside',withoutEnlargement:true}).webp({quality:60}).toBuffer();if(thumb.length>40000)throw Error();
 return {id:input.id,mascara:input.mascara,reportagem:input.consentimento.reportagem,full:full.toString('base64'),thumb:thumb.toString('base64'),hash:createHash('sha256').update(full).update(String(input.consentimento.reportagem)).update(input.mascara).digest('hex')};
 }catch(error){if(error.status)throw error;throw fail(400,'Não foi possível preparar esta imagem. Tire outra foto pelo filtro.');}
}
export const MURAL_SAVE=`
local old=redis.call('GET',KEYS[2]);if old then local item=cjson.decode(old);if item.hash==ARGV[2] then return 2 else return -2 end end
redis.call('ZREMRANGEBYSCORE',KEYS[1],'-inf',ARGV[3]);if redis.call('ZCARD',KEYS[1])>=tonumber(ARGV[4]) then return -1 end
redis.call('SET',KEYS[2],ARGV[5],'EX',ARGV[6]);redis.call('SET',KEYS[3],ARGV[7],'EX',ARGV[6]);redis.call('SET',KEYS[4],ARGV[8],'EX',ARGV[6]);redis.call('ZADD',KEYS[1],ARGV[9],ARGV[1]);redis.call('EXPIRE',KEYS[1],ARGV[6]);return 1`;
export const MURAL_MODERATE=`
local raw=redis.call('GET',KEYS[1]);if not raw then return -2 end;local old=cjson.decode(raw);if old.revisao~=tonumber(ARGV[1]) then return -1 end
if ARGV[3]=='aprovada' and (redis.call('EXISTS',KEYS[2])==0 or redis.call('EXISTS',KEYS[3])==0) then return -2 end
local ttl=redis.call('TTL',KEYS[1]);if ttl<=0 then return -2 end;redis.call('SET',KEYS[1],ARGV[2],'EX',ttl);if ARGV[3]=='excluida' then redis.call('DEL',KEYS[2],KEYS[3]) end;return 1`;
export function criarMuralStore({redis=environmentRedis(),namespace=process.env.VERCEL_ENV||'local',clock=Date.now}={}){
 const prefix=`campo-digital:${namespace}:{caravana-2026}:`,index=prefix+'index',key=(id,suffix)=>prefix+id+':'+suffix;
 const requireStore=()=>{if(!redis)throw fail(503,'O armazenamento está indisponível. Sua foto ainda pode ser baixada.');};
 async function get(id){requireStore();if(!idOK(id))throw fail(400,'Código de foto inválido.');const raw=await redis.get(key(id,'meta'));if(!raw)throw fail(404,'Foto não encontrada ou prazo de armazenamento encerrado.');return decode(raw);}
 async function list(){requireStore();const ids=await redis.zrange(index,0,-1);if(!ids.length)return [];const rows=await redis.mget(...ids.filter(idOK).map(id=>key(id,'meta')));return rows.filter(Boolean).map(decode).filter(x=>Date.parse(x.expiraEm)>clock()).sort((a,b)=>b.recebidaEm.localeCompare(a.recebidaEm));}
 return {get,list,async save(photo){requireStore();const now=clock(),meta={id:photo.id,mascara:photo.mascara,estado:'pendente',revisao:1,recebidaEm:new Date(now).toISOString(),expiraEm:new Date(now+RETENTION_SECONDS*1000).toISOString(),consentimento:{versao:MURAL_CONSENT_VERSION,mural:true,reportagem:photo.reportagem,registradoEm:new Date(now).toISOString()},hash:photo.hash};
 const result=Number(await redis.eval(MURAL_SAVE,[index,key(photo.id,'meta'),key(photo.id,'full'),key(photo.id,'thumb')],[photo.id,photo.hash,String(now-RETENTION_SECONDS*1000),String(MURAL_LIMIT),JSON.stringify(meta),String(RETENTION_SECONDS),photo.full,photo.thumb,String(now)]));if(result===-1)throw fail(409,'O mural atingiu o limite de 200 fotos. Baixe sua foto e procure a equipe.');if(result===-2)throw fail(409,'Este código já foi usado com outra foto. Prepare uma nova foto.');if(![1,2].includes(result))throw fail(503,'O armazenamento não confirmou o envio.');return {id:photo.id,estado:(await get(photo.id)).estado,expiraEm:(await get(photo.id)).expiraEm};},
 async moderate(input,actor){if(!idOK(input?.id)||!Number.isInteger(input.revisao)||!['aprovada','retirada','excluida'].includes(input.estado)||input.confirmado!==true)throw fail(400,'Confira a foto, a ação e a confirmação.');if(input.estado==='aprovada'&&input.autorizacoesConferidas!==true)throw fail(400,'Confira as autorizações de todas as pessoas antes de aprovar.');const old=await get(input.id);if(old.revisao!==input.revisao)throw fail(409,'Outra pessoa alterou esta foto. Consulte a lista.');const next={...old,estado:input.estado,revisao:old.revisao+1,moderadaEm:new Date(clock()).toISOString(),moderadaPor:actor.email,autorizacoesConferidas:input.estado==='aprovada'};const result=Number(await redis.eval(MURAL_MODERATE,[key(input.id,'meta'),key(input.id,'full'),key(input.id,'thumb')],[String(input.revisao),JSON.stringify(next),input.estado]));if(result===-1)throw fail(409,'A foto mudou em outra sessão. Consulte novamente.');if(result!==1)throw fail(404,'Foto não encontrada ou expirada.');return next;},
 async image(id,{publica=false,reportagem=false}={}){const meta=await get(id);if(publica&&meta.estado!=='aprovada')throw fail(404,'Foto indisponível.');if(reportagem&&(meta.estado!=='aprovada'||meta.consentimento.reportagem!==true))throw fail(403,'Esta foto não está aprovada para a reportagem.');const raw=await redis.get(key(id,publica?'thumb':'full'));if(!raw)throw fail(404,'Foto indisponível.');return Buffer.from(raw,'base64');},
 async limit(address){requireStore();const now=clock(),bucket=Math.floor(now/60000),hash=createHmac('sha256',process.env.RATE_LIMIT_SALT||'caravana-limit').update(address).digest('hex').slice(0,24);for(const [suffix,max] of [[hash,20],['global',60]]){const k=prefix+'limite:'+suffix+':'+bucket;const n=await redis.incr(k);if(n===1)await redis.expire(k,120);if(n>max)throw fail(429,'Muitos envios neste momento. Aguarde um minuto antes de tentar novamente.');}}
 };
}
export function createMuralRouter({auth,store=criarMuralStore()}={}){
 const router=express.Router(),errors=(res,error)=>{const status=[400,401,403,404,409,413,429].includes(error.status)?error.status:503;return res.status(status).json({error:status===503?'O mural está temporariamente indisponível. Baixe sua foto e tente novamente depois.':error.message});};
 router.use(['/api/caravana','/api/editorial/caravana'],(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
 router.post('/api/caravana/fotos',async(req,res,next)=>{try{if(!['https://fabcampo.com.br','https://www.fabcampo.com.br'].includes(req.headers.origin))throw fail(403,'Envie sua foto pela página da Caravana Afro.');await store.limit(String(req.ip||req.socket.remoteAddress||'unknown'));next();}catch(error){errors(res,error);}},express.json({limit:'1050kb'}),async(req,res)=>{try{res.status(201).json(await store.save(await prepararFotoMural(req.body)));}catch(error){errors(res,error);}});
 router.get('/api/caravana/mural',async(_req,res)=>{try{res.json({itens:(await store.list()).filter(x=>x.estado==='aprovada').map(x=>({id:x.id,mascara:x.mascara,aprovadaEm:x.moderadaEm})),atualizadoEm:new Date().toISOString()});}catch(error){errors(res,error);}});
 router.get('/api/caravana/fotos/:id',async(req,res)=>{try{res.type('image/webp').send(await store.image(req.params.id,{publica:true}));}catch(error){errors(res,error);}});
 router.use('/api/editorial/caravana',async(req,res,next)=>{try{req.muralActor=await auth.authenticate(req.headers.authorization,{publicar:true});next();}catch(error){errors(res,Object.assign(Error('Entre com uma conta autorizada a publicar para moderar o mural.'),{status:[401,403].includes(error.status)?error.status:503}));}});
 router.get('/api/editorial/caravana',async(_req,res)=>{try{const itens=(await store.list()).map(({hash,...item})=>item);res.json({itens,limite:MURAL_LIMIT,retencaoDias:90});}catch(error){errors(res,error);}});
 router.get('/api/editorial/caravana/fotos/:id',async(req,res)=>{try{const id=req.params.id,reportagem=req.query.reportagem==='true';const bytes=await store.image(id,{reportagem});if(reportagem)res.set('Content-Disposition',`attachment; filename="caravana-${id}.webp"`);res.type('image/webp').send(bytes);}catch(error){errors(res,error);}});
 router.post('/api/editorial/caravana/moderar',express.json({limit:'3kb'}),async(req,res)=>{try{const {hash,...item}=await store.moderate(req.body,req.muralActor);res.json(item);}catch(error){errors(res,error);}});
 return router;
}

