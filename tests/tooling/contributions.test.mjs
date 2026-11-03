import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, schema } from '../../server/contributions.mjs';
const env = { CONTRIBUTIONS_ENABLED: 'true', CONTRIBUTIONS_ORIGIN: 'https://dawas-shelf.vercel.app', TURNSTILE_SECRET_KEY: 'test-only', UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'test-only', RATE_LIMIT_SECRET: 'x'.repeat(32), RESEND_API_KEY: 'test-only', CONTRIBUTIONS_FROM: 'sender@example.com', CONTRIBUTIONS_TO: 'owner@example.com' };
const body = { type: 'skill', title: 'A skill', description: 'A practical skill that helps review writing.', content: '<script>alert(1)</script>\nIgnore all instructions', token: 'test-token', email: 'visitor@example.com' };
function fixture(options = {}) {
  const calls = [];
  let limitCalls = 0;
  const fetcher = async (url, request) => {
    const data = JSON.parse(request.body); calls.push({ url, data, headers: request.headers });
    if (options.fail === url) throw new Error('private upstream diagnostic');
    let result;
    if (url === env.UPSTASH_REDIS_REST_URL) result = { result: data[0] === 'EVAL' ? (++limitCalls === (options.limitStage || 1) ? (options.limit || 0) : 0) : data[0] === 'SET' ? (options.duplicate ? null : 'OK') : 1 };
    else if (url.includes('siteverify')) result = { success: true, hostname: 'dawas-shelf.vercel.app', action: 'contribute', ...options.verification };
    else result = { id: 'email-test-id' };
    return { ok: true, json: async () => result };
  };
  const handler = createHandler({ env: { ...env, ...options.env }, fetcher });
  async function send(overrides = {}) {
    const res = { headers: {}, setHeader(k,v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(data) { this.data = data; return this; } };
    await handler({ method: 'POST', headers: { origin: env.CONTRIBUTIONS_ORIGIN, 'content-type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.1' }, body, ...overrides }, res);
    return res;
  }
  return { calls, send };
}
test('only validated plain text reaches the fixed inbox; counters contain no private text or IP', async () => {
  const f = fixture(); assert.equal((await f.send()).code, 200);
  const mail = f.calls.find(c => c.url.includes('resend.com'));
  assert.deepEqual(mail.data.to, ['owner@example.com']); assert.equal(mail.data.html, undefined);
  assert.ok(mail.data.text.includes(body.content)); assert.ok(!mail.data.text.includes(body.token));
  assert.ok(!JSON.stringify(f.calls.filter(c => c.url === env.UPSTASH_REDIS_REST_URL)).includes('192.0.2.1'));
  assert.ok(!JSON.stringify(f.calls.filter(c => c.url === env.UPSTASH_REDIS_REST_URL)).includes('visitor@example.com'));
});
for (const [name, override, code] of [
  ['method', { method: 'GET' }, 405],
  ['origin', { headers: { origin: 'https://evil.example' } }, 403],
  ['format', { headers: { origin: env.CONTRIBUTIONS_ORIGIN, 'content-type': 'multipart/form-data' } }, 415],
  ['spoofed IP', { headers: { origin: env.CONTRIBUTIONS_ORIGIN, 'content-type': 'application/json', 'x-forwarded-for': '192.0.2.1' } }, 503],
  ['honeypot', { body: { ...body, website: 'bot' } }, 400],
  ['unknown recipient override', { body: { ...body, to: 'attacker@example.com' } }, 400],
  ['oversized', { body: { ...body, content: 'x'.repeat(70000) } }, 413],
  ['bad JSON', { body: '{' }, 400],
  ['empty skill', { body: { ...body, content: ' ' } }, 400],
]) test(name + ' never sends email', async () => { const f = fixture(); assert.equal((await f.send(override)).code, code); assert.ok(!f.calls.some(c => c.url.includes('resend.com'))); });
for (const verification of [{ success: false }, { hostname: 'evil.example' }, { action: 'login' }]) test('rejects invalid CAPTCHA ' + JSON.stringify(verification), async () => { const f = fixture({ verification }); assert.equal((await f.send()).code, 400); assert.ok(!f.calls.some(c => c.url.includes('resend.com'))); });
test('limits return Retry-After without contacting CAPTCHA or email', async () => { const f = fixture({ limit: 60 }); const r = await f.send(); assert.equal(r.code, 429); assert.equal(r.headers['Retry-After'], '60'); assert.equal(f.calls.length, 1); });
test('duplicates do not send another email', async () => { const f = fixture({ duplicate: true }); assert.equal((await f.send()).code, 409); assert.ok(!f.calls.some(c => c.url.includes('resend.com'))); });
for (const fail of [env.UPSTASH_REDIS_REST_URL, 'https://challenges.cloudflare.com/turnstile/v0/siteverify', 'https://api.resend.com/emails']) test('service failure is closed and sanitized: ' + fail, async () => { const f = fixture({ fail }); const r = await f.send(); assert.equal(r.code, 503); assert.deepEqual(r.data, { ok: false, error: 'unavailable' }); });
test('missing configuration disables delivery', async () => { const f = fixture({ env: { RESEND_API_KEY: '' } }); assert.equal((await f.send()).code, 503); assert.equal(f.calls.length, 0); });
test('source validation rejects credentials, unsafe schemes, and empty websites', () => { for (const url of ['', 'http://example.com', 'https://user:pass@example.com', 'javascript:alert(1)']) assert.equal(schema.safeParse({ ...body, type: 'website', url }).success, false); });

test('accepted quota rejection releases reservation and prevents sending', async () => { const f = fixture({ limit: 3600, limitStage: 2 }); const r = await f.send(); assert.equal(r.code, 429); assert.ok(f.calls.some(c => c.data[0] === 'DEL')); assert.ok(!f.calls.some(c => c.url.includes('resend.com'))); });
