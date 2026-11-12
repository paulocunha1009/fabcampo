import {Redis} from '@upstash/redis';
export const BIND_EDITORIAL_ACCOUNT=`
local current=redis.call('HGET',KEYS[1],ARGV[1])
if current then
 if current==ARGV[2] then return 1 end
 return -1
end
redis.call('HSET',KEYS[1],ARGV[1],ARGV[2])
return 1`;
function environmentRedis(){const url=process.env.UPSTASH_REDIS_REST_URL||process.env.UPSTASH_REDIS_REST_KV_REST_API_URL,token=process.env.UPSTASH_REDIS_REST_TOKEN||process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;return url&&token?new Redis({url,token}):null;}
export function createEditorialEnrollment({redis=environmentRedis(),namespace=process.env.VERCEL_ENV||'local'}={}){
 const key=`campo-digital:${namespace}:{editorial-access}:approved-bindings`;
 return {async bind(account){
  if(!redis)throw Object.assign(new Error('EDITORIAL_ENROLLMENT_UNAVAILABLE'),{status:503});
  try{const result=Number(await redis.eval(BIND_EDITORIAL_ACCOUNT,[key],[account.email.toLowerCase(),account.id]));if(result===1)return true;if(result===-1)return false;throw Error();}catch(error){throw Object.assign(new Error('EDITORIAL_ENROLLMENT_UNAVAILABLE'),{status:503});}
 }};
}
