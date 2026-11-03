# Where to look

Work through every group. Search with the terms listed, then open the files and read what the code does with the value. A control counts only when a request path reaches it in production.

Search the whole repo, including infrastructure folders, and skip `node_modules`, `vendor`, build output and lockfiles.

## Edge and infrastructure

Controls here often sit outside the app code.

- **Platform and proxy config:** `vercel.json`, `netlify.toml`, `fly.toml`, `render.yaml`, `.do/app.yaml`, `app.yaml`, `Procfile`, `docker-compose*.yml`, `Dockerfile`, `nginx.conf`, `Caddyfile`, `haproxy.cfg`, `traefik*.yml`, `wrangler.toml`
- **Infrastructure as code:** `*.tf`, `*.tfvars`, `cdk.json`, `serverless.yml`, `pulumi`, `helm` charts, Kubernetes ingress manifests
- **Managed WAFs:** `aws_wafv2_web_acl`, `rate_based_statement`, `managed_rule_group`, `cloudflare_ruleset`, `cloudflare_rate_limit`, `google_compute_security_policy`, `azurerm_web_application_firewall_policy`
- **Server limits:** `limit_req`, `limit_conn`, `client_max_body_size`, `rate_limit`, `deny`, `allow`, `geoip`

If a control lives only in a dashboard (Cloudflare rules, platform firewall) and not in the repo, say so to the user and leave it out, or ask them for the exact values. Never guess them.

## Firewall and attack filtering

- **Terms:** `waf`, `firewall`, `inspect`, `sqli`, `xss`, `traversal`, `injection`, `malicious`, `attack`, `block`, `deny`
- **Libraries:** `helmet`, `xss-clean`, `express-mongo-sanitize`, `hpp`, `lusca`, `django-defender`, `rack-attack`, `coraza`, `modsecurity`, `naxsi`
- **Read:** which request parts are scanned (path, query, headers, body), what decoding runs first, size limits on the scan, what is skipped, the response code on a match

## Rate limits

- **Terms:** `rateLimit`, `rate-limit`, `ratelimit`, `throttle`, `limiter`, `slowDown`, `429`, `Retry-After`, `tooManyRequests`, `bucket`, `window`
- **Libraries:** `express-rate-limit`, `rate-limiter-flexible`, `@upstash/ratelimit`, `@nestjs/throttler`, `hono/rate-limiter`, `django-ratelimit`, `rack-attack`, `slowapi`, `throttled`
- **Read:** the key (IP, user, email), the window, the limit, the response, whether counters are shared (Redis, database) or per instance

## Automatic blocks and bans

- **Terms:** `ban`, `blocklist`, `denylist`, `autoBlock`, `jail`, `fail2ban`, `lockout`, `strike`, `threshold`, `expires`
- **Read:** each trigger with its count and window, block length, whether repeats escalate, what is never blocked (allow lists, crawlers, proxies)

## Probing and scanners

- **Terms:** `wp-login`, `xmlrpc`, `.env`, `.git`, `phpmyadmin`, `probe`, `scanner`, `honeypot`, `tarpit`
- **Read:** which path groups are trapped and what the response is

## Block lists and reputation

- **Terms:** `spamhaus`, `drop`, `tor`, `exit node`, `abuseipdb`, `firehol`, `reputation`, `asn`, `geo`, `country`
- **Read:** list source, what it applies to, refresh interval, behaviour when the refresh fails

## Request and API limits

- **Terms:** `bodyParser`, `limit:`, `maxBodySize`, `bodySizeLimit`, `client_max_body_size`, `MAX_UPLOAD`, `fileSize`, `depth`, `maxDepth`, `complexity`, `pagination`, `cors`, `csrf`, `origin`
- **Read:** body caps, upload caps and who may upload, query depth and list size for anonymous users, GraphQL introspection and playground, fields that are never readable, closed internal endpoints, allowed origins

## Sign-in, sessions and admin access

- **Terms:** `login`, `signin`, `maxLoginAttempts`, `lockTime`, `lockout`, `totp`, `otp`, `2fa`, `mfa`, `webauthn`, `passkey`, `session`, `maxAge`, `expiresIn`, `tokenExpiration`, `cookie`, `httpOnly`, `sameSite`, `secure`, `trusted device`, `remember`
- **Libraries:** `next-auth`, `@auth/*`, `lucia`, `better-auth`, `passport`, `devise`, `django-otp`, `payload` auth config, `supabase` auth, `clerk`
- **Read:** whether 2FA is required or optional, lockout tiers, session length, cookie flags, how errors avoid revealing which accounts exist, re-auth for sensitive changes, admin IP or country locks

## Forms and bots

- **Terms:** `recaptcha`, `hcaptcha`, `turnstile`, `captcha`, `score`, `honeypot`, `spam`
- **Read:** minimum score, honeypot fields, per IP and per email limits, how the server checks the token, origin checks

## Security headers

- **Terms:** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-*`, `helmet(`, `headers()` in `next.config.*`, `_headers` files
- **Read:** the final value per environment. A header set only in development does not count

## Client IP

- **Terms:** `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`, `true-client-ip`, `forwarded`, `trust proxy`, `trustProxy`, `remoteAddress`, `getClientIp`
- **Read:** which header is trusted and under what condition. An app that trusts `x-forwarded-for` from anyone has spoofable limits, which belongs in Known limits

## Logging, alerts and retention

- **Terms:** `audit`, `security log`, `event`, `alert`, `webhook`, `slack`, `telegram`, `discord`, `pagerduty`, `sentry`, `retention`, `ttl`, `cleanup`
- **Read:** what is logged, how long it is kept, what triggers an alert and where it goes

## Build, deploy and secrets

- **Files:** `.github/workflows/*`, `.gitlab-ci.yml`, `bitbucket-pipelines.yml`, `.circleci/*`, `Jenkinsfile`, `renovate.json`, `.github/dependabot.yml`
- **Terms:** `audit`, `npm audit`, `bun audit`, `pip-audit`, `snyk`, `trivy`, `codeql`, `semgrep`, `gitleaks`, `frozen-lockfile`, `--ci`, `environment:`, `needs:`
- **Read:** checks on every change, which ones block a deploy, how secrets reach the app, whether the app refuses to start with missing or weak secrets

## Gaps to look for

These belong in Known limits when you find them:

- Counters held in memory, so each instance counts on its own
- A limit or check that fails open when a dependency is down
- Paths or methods that skip the guard
- Trusting a forwarded IP header from any source
- A control that exists but defaults to off
- Protection that depends on a dashboard setting the repo cannot prove
