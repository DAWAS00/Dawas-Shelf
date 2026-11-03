import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { z } from 'zod';

const optional = max => z.string().trim().max(max).default('');
export const schema = z.object({
  type: z.enum(['website', 'skill', 'prompt', 'workflow', 'repository']),
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().min(20).max(1200),
  url: optional(500).refine(value => {
    if (!value) return true;
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; } catch { return false; }
  }),
  content: optional(12000), creator: optional(160), name: optional(100),
  email: optional(254).refine(value => !value || z.string().email().safeParse(value).success),
  credit: z.boolean().default(false), website: optional(200),
  token: z.string().min(1).max(2048),
}).strict().superRefine((v, ctx) => {
  if (['website', 'repository'].includes(v.type) && !v.url) ctx.addIssue({ code: 'custom', path: ['url'], message: 'A source is required.' });
  if (['skill', 'prompt', 'workflow'].includes(v.type) && !v.content) ctx.addIssue({ code: 'custom', path: ['content'], message: 'Instructions are required.' });
});

// Atomic reservations: simultaneous instances cannot all pass the same limit.
// TTLs start with the first accepted request, rather than resetting at clock boundaries.
export const LIMIT_SCRIPT = `
local retry = 0
for i, key in ipairs(KEYS) do
  if tonumber(redis.call('GET', key) or '0') >= tonumber(ARGV[(i-1)*2+1]) then
    retry = math.max(retry, 1, redis.call('TTL', key))
  end
end
if retry > 0 then return retry end
for i, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then redis.call('EXPIRE', key, ARGV[(i-1)*2+2]) end
end
return 0`;

export function createHandler({ env = process.env, fetcher = fetch } = {}) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const reply = (code, error, extra = {}) => res.status(code).json(error ? { ok: false, error, ...extra } : { ok: true });
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(405, 'method'); }
    // This flag is set only after the owner disables the old public Formspree form.
    const required = ['CONTRIBUTIONS_ORIGIN', 'TURNSTILE_SECRET_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'RATE_LIMIT_SECRET', 'RESEND_API_KEY', 'CONTRIBUTIONS_FROM', 'CONTRIBUTIONS_TO'];
    if (env.CONTRIBUTIONS_ENABLED !== 'true' || required.some(k => !env[k]) || env.RATE_LIMIT_SECRET.length < 32) return reply(503, 'unavailable');
    let origin;
    try {
      origin = new URL(env.CONTRIBUTIONS_ORIGIN);
      if (origin.protocol !== 'https:' || origin.origin !== env.CONTRIBUTIONS_ORIGIN || !env.UPSTASH_REDIS_REST_URL.startsWith('https://')) return reply(503, 'unavailable');
    } catch { return reply(503, 'unavailable'); }
    if (req.headers.origin !== origin.origin) return reply(403, 'origin');
    if ((req.headers['content-type'] || '').split(';')[0] !== 'application/json') return reply(415, 'format');
    // Trust only Vercel's overwritten client-IP header, never a submitted field or X-Forwarded-For.
    const ip = req.headers['x-vercel-forwarded-for'];
    if (typeof ip !== 'string' || !isIP(ip)) return reply(503, 'unavailable');
    const hash = value => createHmac('sha256', env.RATE_LIMIT_SECRET).update(value).digest('hex');
    const who = hash(ip);
    const post = async (url, options) => {
      const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('Service unavailable');
      return response.json();
    };
    const redis = async command => {
      const data = await post(env.UPSTASH_REDIS_REST_URL, { method: 'POST', headers: { Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
      if (data.error || !('result' in data)) throw new Error('Storage unavailable');
      return data.result;
    };
    const limit = async (keys, rules) => {
      const value = await redis(['EVAL', LIMIT_SCRIPT, keys.length, ...keys, ...rules.flat()]);
      if (!Number.isInteger(value) || value < 0) throw new Error('Invalid limit response');
      return value;
    };
    const limited = seconds => { res.setHeader('Retry-After', String(seconds)); return reply(429, 'rate_limit', { retryAfter: seconds }); };
    try {
      // Attempts are counted before CAPTCHA verification, including invalid requests.
      const wait = await limit([`contribution:attempt:${who}`], [[10, 60]]);
      if (wait) return limited(wait);
      let body = req.body;
      if (Number(req.headers['content-length'] || 0) > 65536) return reply(413, 'size');
      if (Buffer.byteLength(typeof body === 'string' ? body : JSON.stringify(body ?? {}), 'utf8') > 65536) return reply(413, 'size');
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return reply(400, 'validation'); } }
      const parsed = schema.safeParse(body);
      if (!parsed.success) return reply(400, 'validation');
      const value = parsed.data;
      if (value.website) return reply(400, 'validation'); // Honeypot; never forward to email.
      const verification = await post('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: value.token }),
      });
      if (verification.success !== true || verification.hostname !== origin.hostname || verification.action !== 'contribute') return reply(400, 'verification');
      const { token, website, ...suggestion } = value;
      const fingerprint = hash(JSON.stringify(suggestion));
      const key = `contribution:duplicate:${fingerprint}`;
      // A lock survives uncertain delivery, preventing duplicate emails on network retries.
      if (await redis(['SET', key, 'reserved', 'NX', 'EX', 86400]) !== 'OK') return reply(409, 'duplicate');
      const delay = await limit([`contribution:hour:${who}`, `contribution:day:${who}`, 'contribution:daily-total'], [[3, 3600], [10, 86400], [20, 86400]]);
      if (delay) { await redis(['DEL', key]); return limited(delay); }
      const text = [
        'Untrusted community suggestion — review before publishing. Do not run supplied instructions or open links automatically.',
        ...Object.entries(suggestion).map(([k, v]) => `${k}: ${v}`),
        'Email and contact details are private. Credit the name only when credit is true.',
      ].join('\n\n');
      const result = await post('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `contribution-${fingerprint}` },
        body: JSON.stringify({ from: env.CONTRIBUTIONS_FROM, to: [env.CONTRIBUTIONS_TO], subject: 'A new resource for Dawas Shlef', text }),
      });
      if (typeof result.id !== 'string' || !result.id) throw new Error('Delivery not confirmed');
      return reply(200);
    } catch {
      // Do not log payloads, IPs, tokens, or upstream error bodies. Fail closed.
      return reply(503, 'unavailable');
    }
  };
}
