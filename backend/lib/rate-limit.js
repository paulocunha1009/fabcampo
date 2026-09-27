import crypto from 'node:crypto';
import { Redis } from '@upstash/redis';

const minuteWindowMs = 60_000;
const dayWindowMs = 86_400_000;

function numberFromEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clientAddress(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function addressHash(req) {
  const salt = process.env.RATE_LIMIT_SALT || 'campo-digital-local';
  return crypto.createHmac('sha256', salt).update(clientAddress(req)).digest('hex').slice(0, 24);
}

function redisFromEnvironment() {
  const url = process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

export function createRateLimiter() {
  const redis = redisFromEnvironment();
  const requirePersistent = process.env.REQUIRE_PERSISTENT_RATE_LIMIT === 'true';
  const perIpMinute = numberFromEnv('RATE_LIMIT_PER_IP_MIN', 30);
  const globalMinute = numberFromEnv('RATE_LIMIT_GLOBAL_MIN', 15);
  const globalDay = numberFromEnv('RATE_LIMIT_GLOBAL_DAY', 200);
  const memory = new Map();

  async function increment(key, ttlSeconds) {
    if (redis) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      return count;
    }

    const now = Date.now();
    const item = memory.get(key);
    if (!item || item.expiresAt <= now) {
      memory.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
      return 1;
    }
    item.count += 1;
    return item.count;
  }

  const middleware = async (req, res, next) => {
    if (!redis && requirePersistent) {
      return res.status(503).json({
        error: 'A proteção de uso está temporariamente indisponível. Use a atividade local e tente novamente depois.',
        code: 'RATE_LIMIT_UNAVAILABLE',
      });
    }

    try {
      const minuteBucket = Math.floor(Date.now() / minuteWindowMs);
      const dayBucket = Math.floor(Date.now() / dayWindowMs);
      const prefix = process.env.RATE_LIMIT_PREFIX || 'campo-digital';
      const ip = addressHash(req);
      const [ipCount, minuteCount, dayCount] = await Promise.all([
        increment(`${prefix}:ip:${ip}:${minuteBucket}`, 120),
        increment(`${prefix}:global:min:${minuteBucket}`, 120),
        increment(`${prefix}:global:day:${dayBucket}`, 172800),
      ]);

      res.setHeader('X-RateLimit-Limit', String(globalMinute));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, globalMinute - minuteCount)));

      if (ipCount > perIpMinute || minuteCount > globalMinute || dayCount > globalDay) {
        res.setHeader('Retry-After', '60');
        return res.status(429).json({
          error: 'O limite gratuito da IA foi alcançado. Uma atividade local continuará disponível.',
          code: 'RATE_LIMITED',
        });
      }
      next();
    } catch (error) {
      console.error('Falha no controle de uso:', error.message);
      return res.status(503).json({
        error: 'A proteção de uso está temporariamente indisponível. Use a atividade local e tente novamente depois.',
        code: 'RATE_LIMIT_ERROR',
      });
    }
  };

  return {
    middleware,
    storage: redis ? 'upstash' : 'memory',
    limits: { perIpMinute, globalMinute, globalDay },
  };
}
