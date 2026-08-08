# Security Audit Report — 2026

**Audit Date:** 2026-08-08
**Auditor:** Automated security audit (static analysis + git-history scan + test validation)
**Repository:** `belajarcarabelajar/dawnbook` (public, open source)

## 1. Executive Summary

This report documents the 2026 security posture of the Dawnbook platform. It
covers the D1-backed authentication subsystem (Google OAuth + opaque sessions),
edge gating middleware, all Pages Functions API endpoints, build scripts, header
configuration, and secret hygiene across the working tree and git history. It
also tracks the remediation status of every finding from the prior audits
(`SECURITY_AUDIT_REPORT.md`, `SECRET_AUDIT_REPORT.md`, `CORS_AUDIT_REPORT.md`).

**Finding Counts by Severity (new findings this cycle):**
- **Critical:** 0
- **High:** 0
- **Medium:** 2
- **Low/Info:** 3
- **Total new findings:** 5

**Resolution status:** All previously-reported Critical/High findings (F-001 … F-004,
SECRET F-001, CORS F01/F02) are **verified remediated** in the current tree. **All six
new findings are now resolved** (F-101 … F-106).

**Validation:** Full test suite passes — **216 pass / 0 fail / 13 skip** across 229
tests in 31 files. `bun install --frozen-lockfile` resolves with **no changes**
(lockfile fully consistent with pinned dependencies).

---

## 2. Scope & Methodology

### 2.1 In-Scope

- `functions/` — Pages Functions middleware, auth (login/callback/logout/me),
  gating policy, progress, books CRUD, view counting, donation badges.
- `functions/lib/` — auth, oauth, db, turnstile, i18n, rate-limit helpers.
- `scripts/` — build pipeline (`builder/template-engine.ts`), deploy script,
  GSC/SEO tooling (TS + Python), gating injection.
- Configuration — `wrangler.toml`, `_headers`, `.gitignore`, `package.json`,
  `bun.lock`, `.env.example`, `db/migrations/`.
- Git history — secret-pattern scan across all reachable commits.

### 2.2 Methodology

1. **Static analysis** of every edge handler and middleware for authN/authZ
   bypasses, injection, XSS, open redirects, CSRF, and error handling.
2. **Secret scan** of the working tree and git history for credential patterns
   (`GOCSPX-`, `sk_live_`, `AKIA`, `AIza`, `ghp_`, `-----BEGIN … PRIVATE`,
   hardcoded `CLOUDFLARE_*`).
3. **Config review** of `_headers`, `.gitignore`, `wrangler.toml`, package manifests.
4. **Automated validation** via the Bun test suite and frozen-lockfile install.
5. **Prior-audit reconciliation** — every finding from earlier reports was
   re-checked against the current tree.

### 2.3 Out-of-Scope

- Client-side SPA code in `apps/` (the admin SPA was removed; `apps/hub` is static).
- Content in `books/` and `db/seed*.sql` (markdown/educational content).
- Live penetration testing against deployed infrastructure (static analysis only).
- Denial-of-service scenarios requiring massive traffic rates.

---

## 3. Findings

### F-101: Draft-status books exposed via public API — **RESOLVED**
- **Severity (original):** Medium
- **Category:** AuthZ / Information Disclosure
- **Affected File(s):** `functions/api/books/index.ts`, `functions/api/books/[slug].ts`
- **Evidence:** `GET /api/books?content=true` returned full `content_md` for all
  books — including `status='draft'` — with no authentication. The list endpoint
  only filtered drafts when `status=published` was explicitly requested. A draft
  slug was retrievable via `GET /api/books/:slug` without auth.
- **Impact:** Unpublished content could be read and enumerated by anyone.
- **Remediation (applied):**
  - `GET /api/books` now calls `verifySession`; non-admin callers (anonymous or
    reader) always receive a forced `status = 'published'` SQL constraint and the
    `status=draft` query parameter is ignored for them.
  - `GET /api/books/:slug` adds `AND status = 'published'` for non-admins; a draft
    requested by anyone but an admin returns `404` (indistinguishable from a
    missing book, preventing enumeration).
  - Admins query without the constraint and may use the `status` filter.
- **Verification:** New tests in `tests/functions/api/books.test.ts` and
  `tests/functions/api/books/[slug].test.ts` (anon coercion, reader coercion,
  admin filter respected, 404 on drafts). All pass.

### F-102: Missing rate limiting on auth and mutation endpoints — **RESOLVED**
- **Severity (original):** Medium
- **Category:** Abuse / DoS hardening
- **Affected File(s):** `functions/api/auth/*`, `functions/api/progress.ts`,
  `functions/api/books/*`, `functions/api/users/[id]/donation-badge.ts`
- **Evidence:** No throttling existed on OAuth endpoints or any mutation handler;
  Turnstile only protected `/api/auth/login` when `TURNSTILE_SECRET` was configured.
- **Impact:** Brute-force/abuse of the OAuth exchange, session-store deletes,
  progress writes, and view-count inflation.
- **Remediation (applied):**
  - New `functions/lib/rate-limit.ts` — fixed-window limiter backed by D1 using a
    single atomic `INSERT … ON CONFLICT … RETURNING` statement (expired windows
    reset inline; safe under concurrency). Keys on `CF-Connecting-IP` for anonymous
    endpoints and on the verified user id for authenticated ones. **Fails open** on
    D1 errors (logs a warning) so the limiter cannot take the site down. 429
    responses carry `Retry-After` + `X-RateLimit-Limit/Remaining/Reset`.
  - New migration `db/migrations/0007_rate_limit.sql` (`rate_limits` table +
    `expires_at` index).
  - Enforcement (per 10-minute window):

    | Endpoint | Quota | Key |
    |---|---|---|
    | `/api/auth/login` | 60 | IP (redirects to `error=rate_limited`) |
    | `/api/auth/callback` | 60 | IP (redirects to `error=rate_limited`) |
    | `/api/auth/logout` | 60 | IP |
    | `/api/progress` POST | 120 | user |
    | `/api/books` POST | 60 | user (admin) |
    | `/api/books/:slug` DELETE | 60 | user (admin) |
    | `/api/books/:slug/view` POST | 120 | IP |
    | `/api/users/:id/donation-badge` PATCH | 60 | user (admin) |

  - Design note: Durable Objects are Cloudflare's canonical rate-limiting store,
    but this codebase has no DO binding; D1 is the correct fit for these
    low-frequency mutation endpoints (documented in the helper).
- **Verification:** `tests/functions/lib/rate-limit.test.ts` (quota, 429 headers,
  user/IP keying, fail-open, SQL-shape guard for the reset logic) plus end-to-end
  429 wiring tests in `progress.test.ts`, `books/[slug]/view.test.ts`, and
  `auth.test.ts`. All pass.
- **Deployment requirement:** the `rate_limits` migration must be applied.
  `scripts/deploy-website.sh` runs `wrangler d1 migrations apply` before deploy.

### F-103: Unpinned dependency ranges (prior F-005) — **RESOLVED**
- **Severity (original):** Medium
- **Category:** Supply-Chain
- **Affected File(s):** `package.json`
- **Evidence:** `wrangler: "^4.112.0"`, `katex: "^0.17.0"`, `lighthouse: "^13.4.0"`
  allowed minor/patch drift.
- **Impact:** A compromised upstream package could be pulled in on minor/patch
  updates during CI builds.
- **Remediation (applied):** Pinned to the exact versions already resolved in
  `bun.lock` — `wrangler 4.112.0`, `katex 0.17.0`, `lighthouse 13.4.0`
  (`@types/bun` was already exact). No `^`/`~` modifiers remain.
- **Verification:** `bun install --frozen-lockfile` → "no changes"; `bun.lock`
  untouched; full test suite passes.

### F-104: Search-engine-bot gating bypass via User-Agent spoofing — **RESOLVED**
- **Severity (original):** Medium
- **Category:** AuthZ
- **Affected File(s):** `functions/_middleware.ts`, `functions/lib/gating.ts`,
  `functions/lib/bot-verify.ts` (new)
- **Evidence:** `isSearchEngineBot()` matched the `User-Agent` header only. Any
  client could set `User-Agent: Googlebot` and receive gated (non-first-chapter)
  content without a session, because the middleware passed bot requests through
  unchanged.
- **Impact:** Gated content was trivially bypassable by spoofing a bot User-Agent.
- **Policy decision:** Only **verified** crawlers get the SEO pass-through for
  gated content. A bot-like User-Agent is a precondition but never sufficient;
  unverifiable bot claims are treated as regular visitors and must authenticate.
- **Remediation (applied):**
  - New `functions/lib/bot-verify.ts` implements Google's published verification
    method: (1) UA must match `isSearchEngineBot()`; (2) reverse-DNS (PTR) of the
    connecting IP via Cloudflare's DNS-over-HTTPS JSON API must resolve to a
    hostname under a known crawler domain (`.googlebot.com`, `.search.msn.com`,
    `.yandex.*`, `.baidu.*`, `.duckduckgo.com`, `.openai.com`, `.anthropic.com`,
    etc.); (3) forward DNS (A/AAAA) of that hostname must resolve back to the
    same IP. Verdicts are cached per IP (24h verified / 1h unverified) so
    repeated crawls are cheap.
  - **Fail closed:** DNS errors/timeouts resolve to "not verified" — the spoofing
    hole stays closed even during a DoH outage.
  - `functions/_middleware.ts` now requires `isVerifiedBotRequest(request)`
    (async) before the crawler pass-through branch.
- **Accepted trade-offs:**
  - **SEO blast radius:** if Cloudflare's DoH endpoint were unreachable,
    legitimate crawlers would receive 302 → `/sign-in` for gated pages until
    verification recovers. This is the intended security-first posture.
  - **Admin shell:** verified crawlers may fetch the `/admin` SPA shell without a
    session (unchanged from before); admin data remains protected server-side via
    `/api/auth/me` and D1 role checks.
  - **AI crawlers:** crawlers that do not publish verifiable PTR hostnames fall to
    session-gated (blocked) by default. Adding a new crawler is a one-line
    addition to the suffix allowlist.
- **Verification:** `tests/functions/lib/bot-verify.test.ts` (verified
  Google/Bing, IPv6 nibble path, domain mismatch, forward-mismatch spoof guard,
  non-bot no-DNS, fail-closed on outage, missing-IP, per-IP caching) and
  `tests/functions/edge-gating-integration.test.ts` (verified bot pass-through,
  spoofed-bot 302). All pass.

### F-105: No Content-Security-Policy header — **RESOLVED**
- **Severity (original):** Low
- **Category:** Hardening
- **Affected File(s):** `_headers`, `functions/_middleware.ts`,
  `functions/lib/security-headers.ts` (new), `scripts/builder/template-engine.ts`
- **Evidence:** Responses carried `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy`, but no CSP.
- **Impact:** Reduced defense-in-depth against XSS (no inline-script/styling
  restrictions). mdBook pages use inline scripts/styles, so a strict CSP requires
  nonces or hashes.
- **Remediation (applied):**
  - New single-source-of-truth module `functions/lib/security-headers.ts`
    (`CONTENT_SECURITY_POLICY`) consumed by all three surfaces: the generated
    `output/_headers` (via `buildHeaders()` in `template-engine.ts`), the edge
    middleware (`applySecurityHeaders`), and the tracked root `_headers` file.
  - Policy: `default-src 'self'`; `script-src`/`style-src` allow `'unsafe-inline'`
    (inline mdBook/hub scripts and style attributes are unavoidable without
    hashing — tightened later); allowlists cover every origin the generated
    pages actually load — MathJax/KaTeX CDNs (`cdnjs.cloudflare.com`,
    `cdn.jsdelivr.net`), GA (`googletagmanager.com`, `google-analytics.com`,
    `region1.google-analytics.com`, `stats.g.doubleclick.net`), Turnstile
    (`challenges.cloudflare.com`), Google Fonts (`fonts.googleapis.com` /
    `fonts.gstatic.com` in style/font/connect-src for preconnect), YouTube
    embeds (`youtube-nocookie.com`, `youtube.com`), OAuth (`accounts.google.com`,
    `*.googleusercontent.com`); `img-src`/`media-src` allow `https:` (book
    content embeds third-party images/video); `object-src 'none'`,
    `base-uri 'self'`, `frame-ancestors 'none'`, `worker-src 'self' blob:`.
  - The middleware skips setting CSP when a response already carries one, so
    function responses that set their own policy are respected.
- **Verification:**
  - Middleware tests assert CSP application and non-override
    (`tests/functions/middleware.test.ts`).
  - Drift-guard tests in `tests/scripts/build.test.ts`: (1) the root `_headers`
    and the build output must carry the exact `CONTENT_SECURITY_POLICY` value;
    (2) every external host loaded by generated pages (`<script src>`, `<link
    href>`, `<img src>`, `<iframe src>` in `template-engine.ts` and every
    book's `theme/head.hbs`) must be allowed by the matching CSP directive — a
    host added to generated HTML without a CSP entry fails CI.
- **Deployment requirement:** no DB migration; a normal deploy regenerates
  `output/_headers` with the new CSP.

### F-106: Hardcoded public identifiers as build fallbacks — **RESOLVED**
- **Severity (original):** Low
- **Category:** Hygiene
- **Affected File(s):** `scripts/builder/template-engine.ts`,
  `scripts/inject-gating.ts`, `.env.example`
- **Evidence:** Turnstile site key `0x4AAAAAAEBDHm_F3WkNRSpN` and GA measurement
  ID `G-V619M5H4YW` were hardcoded as fallbacks when env vars were absent.
- **Impact:** Minimal — both values are public by design (client-side). Risk is
  that a *secret* gets added to such a fallback in the future.
- **Remediation (applied):**
  - `scripts/builder/template-engine.ts`: the GA tag is emitted only when
    `GA_MEASUREMENT_ID` is set (omitted entirely otherwise) and the Turnstile
    API script + widget are emitted only when `TURNSTILE_SITE_KEY` is set. No
    hardcoded fallback values remain. `generateSitePages` now accepts an
    optional injectable `buildEnv` (defaults to `process.env`) so tests never
    mutate the shared environment.
  - `scripts/inject-gating.ts`: the injected GA tag is gated on
    `GA_MEASUREMENT_ID`; when unset it emits an empty string (a harmless no-op
    replace, no HTML corruption).
  - `.env.example`: the real Turnstile site key was replaced with a placeholder;
    real values now live only in `.env` / Cloudflare Pages env vars.
  - **Config coupling (prevented):** `functions/api/auth/login.ts` now enforces
    Turnstile verification only when **both** `TURNSTILE_SITE_KEY` and
    `TURNSTILE_SECRET` are configured. With the hardcoded key gone, enforcing on
    the secret alone would have submitted an empty token and blocked every
    sign-in (widget never renders without the site key).
- **Verification:**
  - Source regression: neither script contains `G-V619M5H4YW` or
    `0x4AAAAAAEBDHm_F3WkNRSpN`, and both source identifiers exclusively from
    env vars (`tests/scripts/build.test.ts`).
  - Behavioral: `generateSitePages` run with and without env vars produces
    pages with/without the GA tag and Turnstile widget as expected.
  - Auth: new test asserts Turnstile verification is skipped (fail-open) when
    only the secret is configured, so sign-in cannot be locked out by partial
    configuration.

---

## 4. Prior-Audit Reconciliation

Every finding from earlier reports was re-checked against the current tree.

### 4.1 `SECURITY_AUDIT_REPORT.md` (Clerk era)

| ID | Severity | Prior Finding | Current Status |
|---|---|---|---|
| F-001 | Critical | `apps/admin/.env.local` with Clerk secret committed | **RESOLVED** — file gone; `.gitignore` covers `.env*`, `*.key`, `*.pem`, `service-account.json` |
| F-002 | High | Hardcoded admin email in `apps/admin/src/App.tsx` | **RESOLVED** — `apps/admin/` removed entirely; regression test asserts the email is absent |
| F-003 | High | Client-side gating bypass (opacity-based) | **RESOLVED** — auth enforced at the edge in `functions/_middleware.ts` via D1 session |
| F-004 | High | Debug endpoints `debug-auth.ts` / `debug-token.ts` | **RESOLVED** — files deleted |
| F-005 | Medium | Unpinned dependencies | **RESOLVED** — see F-103 above |
| F-006 | Low | Dead code `functions/lib/interstitial.ts` | **RESOLVED** — file deleted |
| F-007 | Info | Server-side JWT enforcement | Superseded — D1-session verification now used on all mutations |
| F-008 | Info | SQLi/XSS defenses | **VERIFIED** — parameterized D1 binds; slug regex; `escapeHtml`/`escapeClientHtml` |

### 4.2 `SECRET_AUDIT_REPORT.md`

| ID | Severity | Prior Finding | Current Status |
|---|---|---|---|
| F-001 | Critical | Hardcoded `CLOUDFLARE_ACCOUNT_ID` in `scripts/deploy-website.sh` | **RESOLVED** — values sourced from env (`${CLOUDFLARE_ACCOUNT_ID:-$CF_ACCOUNT_ID}`) |
| F-002..F-005 | Info | Clerk `pk_test_` publishable keys in source | **RESOLVED** — no `pk_test_` values remain in the working tree (docs/history only) |
| F-006 | Medium | `test_fix.js` build artifact | **RESOLVED** — deleted and gitignored |

**Fresh scan:** working tree and git history contain **no** `GOCSPX-`, `sk_live_`,
`AKIA`, `AIza`, `ghp_`, or private-key material — only placeholders and
documentation.

### 4.3 `CORS_AUDIT_REPORT.md`

| ID | Severity | Prior Finding | Current Status |
|---|---|---|---|
| F01/F02 | High | Permissive OPTIONS preflight on credentialed endpoints | **RESOLVED** — OPTIONS handlers removed; endpoints return 405 |
| F03/F04 | Medium | Missing `Access-Control-Max-Age` on preflight | **RESOLVED** — preflight handlers removed entirely |
| I01/I02 | Info | No permissive CORS on non-200s; CSP separate from CORS | **VERIFIED** — no `Access-Control-Allow-Origin`/`Credentials` emitted anywhere |

---

## 5. Findings-to-Remediation Matrix

| Finding | Severity | Affected Files | Status | Verification |
|---|---|---|---|---|
| F-101 | Medium → Fixed | `functions/api/books/index.ts`, `[slug].ts` | ✅ Resolved | New anon/admin visibility tests |
| F-102 | Medium → Fixed | `functions/lib/rate-limit.ts`, `db/migrations/0007`, 8 handlers | ✅ Resolved | rate-limit unit + wiring tests |
| F-103 | Medium → Fixed | `package.json` | ✅ Resolved | `bun install --frozen-lockfile` (no changes) |
| F-104 | Medium → Fixed | `functions/_middleware.ts`, `lib/bot-verify.ts` | ✅ Resolved | New bot-verify unit + edge-gating integration tests |
| F-105 | Low → Fixed | `_headers`, `functions/_middleware.ts`, `lib/security-headers.ts` | ✅ Resolved | Middleware CSP + drift-guard tests |
| F-106 | Low → Fixed | `scripts/builder/template-engine.ts`, `inject-gating.ts`, `auth/login.ts` | ✅ Resolved | Source + behavioral + auth tests |

---

## 6. Repository Hardening Checklist

- [x] `.gitignore` covers `.env*`, `*.key`, `*.pem`, `service-account.json`, build artifacts
- [x] `SECURITY.md` disclosure policy published
- [x] All prior Critical/High findings remediated
- [x] Dependencies pinned to exact versions (F-005 / F-103)
- [x] Rate limiting on auth + all mutation endpoints (F-102)
- [x] Draft content hidden from non-admin API callers (F-101)
- [x] No secrets in working tree or git history (fresh scan)
- [x] Full test suite green (216 pass / 0 fail)
- [ ] Enable GitHub Secret Scanning and Push Protection
- [ ] Configure Branch Protection rules on `main`
- [ ] Enable automated dependency vulnerability scanning (e.g. Dependabot)
- [x] Add CSP header (F-105) — single source of truth + drift-guard tests
- [x] Replace hardcoded public identifier fallbacks (F-106) — env-var-driven omission
- [x] Decide bot-gating policy: only DNS-verified crawlers bypass gated content (F-104)
- [ ] Consider `__Host-` session cookie prefix and sliding session renewal (hardening)

---

## 7. Validation Runbook

```bash
bun test                     # 216 pass / 0 fail / 13 skip (229 tests, 31 files)
bun install --frozen-lockfile # Resolved 192 installs across 240 packages (no changes)
git grep -nIE 'GOCSPX-|sk_live_|AKIA|AIza|ghp_|BEGIN (RSA|EC|OPENSSH) PRIVATE'  # no hits
```

---

## 8. Assumptions & Limitations

- The repository is public; source and git history are fully visible to
  attackers, so secret hygiene is the primary supply-chain defense.
- This audit is static analysis. No live penetration testing was performed
  against deployed infrastructure, and no Cloudflare dashboard configuration
  (WAF rate-limiting rules, bot management) was verified.
- The D1 `rate_limits` UPSERT uses `RETURNING` with `ON CONFLICT`; this SQLite
  syntax is supported by D1 but is not executed by the unit-test mock (which is
  why a SQL-shape guard test is included). A one-time integration check against
  real D1 is recommended.
- The bot-gating policy for F-104 was decided and implemented during this cycle:
  only DNS-verified crawlers (UA + reverse-DNS PTR + forward confirmation) get
  the gated-content pass-through; all other requests must authenticate. The SEO
  blast radius of the fail-closed posture (302s to legit crawlers during a DoH
  outage) is accepted by design and documented in F-104.
- The F-105 CSP intentionally keeps `script-src 'unsafe-inline'` and
  `style-src 'unsafe-inline'` because generated mdBook/hub pages use inline
  scripts and inline `style=` attributes; tightening to nonces/hashes is future
  work (tracked in the checklist). `img-src`/`media-src` deliberately allow all
  `https:` because user-authored book content embeds arbitrary third-party
  images and video; a scheme wildcard on those directives carries no script-
  execution risk.
- Because Cloudflare Pages applies the static `_headers` file after edge
  middleware runs, static assets may carry two identical CSP headers (middleware
  + `_headers`). Browsers merge multiple CSP headers by intersection, so
  identical values are harmless; the single-source-of-truth constant and the
  drift-guard test keep the two copies from ever diverging.
- Since F-106 removed the hardcoded fallbacks, GA analytics only load when
  `GA_MEASUREMENT_ID` is set in the build environment, and the Turnstile widget
  only renders when `TURNSTILE_SITE_KEY` is set. **Deployment requirement:**
  both `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET` must be configured together
  in Cloudflare Pages env vars — the login handler intentionally skips
  Turnstile verification (fail-open) unless both are present, so a partial
  configuration cannot lock out sign-ins.
