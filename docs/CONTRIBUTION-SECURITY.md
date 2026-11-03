# Protected contributions: activation and operations

Status: implementation is local. Production credentials, provider settings, and end-to-end delivery are not configured or verified. Submissions remain closed until enabled. The old Formspree form is a separate external resource: removing its URL from this site DOES NOT disable it.

## Activation

1. In Cloudflare Turnstile, create a Managed widget for `dawas-shelf.vercel.app`. Copy the public site key and private secret into Vercel's `PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. The server requires the exact hostname and action `contribute`. Do not use test keys in production.
2. Create an Upstash Redis database; add its HTTPS REST URL and REST token as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Restrict account access. Use one database for all production function instances. Preview environments should have separate credentials and counters.
3. Configure Resend with a permitted, verified sender and a sending-only API key. Set `RESEND_API_KEY`, `CONTRIBUTIONS_FROM`, and `CONTRIBUTIONS_TO` in Vercel. The destination is the owner's private review inbox; it never comes from browser input. Verify any restrictions on test senders before deployment.
4. Generate at least 32 random bytes for `RATE_LIMIT_SECRET` with a secure password manager or `node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"`. Save it directly in Vercel, never source control or chat. Set `CONTRIBUTIONS_ORIGIN` to the exact HTTPS production origin, without a trailing slash.
5. In Formspree, **disable submissions for the old form `xljjokld`**, preserving any existing messages. Do not merely remove the URL from the website or restrict its Referer header: a known direct endpoint can bypass our new limiter. Confirm it is disabled in the dashboard. No deletion of existing contributions is needed.
6. Only after those steps, set `CONTRIBUTIONS_ENABLED=true` and redeploy. This flag is used at both build time (form availability) and runtime (API). Never add PUBLIC_ to any credential other than the Turnstile site key.
7. Verify the Vercel build creates `/api/contributions`, the rendered page loads Turnstile, and one explicitly authorized submission reaches the inbox. Confirm CAPTCHA replay, wrong host/action, missing config, and rate-limit failure paths using mocks or dedicated staging services, never by flooding the production inbox.

Do not purchase a paid plan automatically. Check each service's current free allowance during account setup. Account setup and private credentials are required even when using free plans.

## Limits and recovery

The shared Redis Lua operation atomically reserves quota across instances: 10 attempts/minute per IP; 3 accepted attempts/hour per IP; 10/day per IP; 20 emails/day across the site. Windows start with the first reservation and expire after the stated interval. Shared networks share an IP quota; IPs are not verified personal identities. The global cap bounds email bursts even if an attacker changes IPs. It can also temporarily prevent legitimate contributions when exhausted.

Exact normalized submissions are reserved for 24 hours, with a matching email-provider idempotency key. Uncertain sends retain the reservation and consume quota to avoid duplicate emails. Visitors see an honest uncertainty message. If mail delivery fails, check the email provider dashboard; do not blindly clear counters or duplicate locks. A quota rejection releases the duplicate lock so a later retry remains possible.

The browser also applies a 60-second cooldown, including across tabs. This is only a convenience; removing browser storage cannot remove the server limits. Unavailable Redis, CAPTCHA, or mail services fail closed. There is no direct Formspree or native POST fallback. JavaScript and a completed CAPTCHA are required.

## Data handling

- Requests travel over HTTPS. Incoming field names, types, lengths, resource-specific requirements, source URL scheme, and total body size are checked on the server.
- No file upload, executable preview, automatic URL fetching, code execution, or automatic publication exists. Skill instructions and prompts are untrusted text, including instructions addressed to an AI reviewer.
- Email uses a fixed subject, sender, and destination, with a plain-text body. Visitor content is never inserted into HTML or executed. Email clients may still recognize URLs: review links before following them.
- Redis contains expiring counters, HMAC-derived IP identifiers, and content fingerprints, not raw IPs, emails, or contribution text. These identifiers are pseudonymous, not anonymous. Keys expire within 24 hours. Provider backups and platform metadata follow the providers' own retention policies.
- The app does not log payloads, credentials, IPs, CAPTCHA tokens, or upstream error bodies. Vercel and service providers may retain their own operational metadata; review their retention/access settings.
- The full suggestion and optional contact details pass through Resend to the configured inbox. Cloudflare processes verification signals. Restrict mailbox access, enable account MFA, and delete rejected/unneeded submissions on an owner-defined schedule (suggested: 30 days). Encryption in transit is not end-to-end mailbox encryption.
- Publish contributor names only with attribution consent. Never copy private emails into resource Markdown. The repository remains the reviewed public content store.

## Tests and local development

Run `npm run test:security`, `npm run check`, `npm run build`, and `npm test`. Security tests substitute external responses and do not contact live services; production Redis/Lua concurrency and provider delivery still require staging verification. Browser tests intercept the internal API. Ordinary Astro dev/preview serves the static pages, not the root Vercel function: use Vercel's local runtime for a configured end-to-end local test. Do not weaken production hostname/IP checks for a local preview.

Official references: [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Upstash REST](https://upstash.com/docs/redis/features/restapi), [Resend send email](https://resend.com/docs/api-reference/emails/send-email).
