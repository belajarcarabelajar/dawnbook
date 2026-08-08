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
SECRET F-001, CORS F01/F02) are **verified remediated** in the current tree. Three of
the five new medium/low findings were fixed during this audit cycle (F-101, F-102,
F-103); two remain open (F-104, F-105) and one is a hardening recommendation (F-106).

**Validation:** Full test suite passes — **199 pass / 0 fail / 13 skip** across 212
tests in 30 files. `bun install --frozen-lockfile` resolves with **no changes**
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

### F-104: Search-engine-bot gating bypass via User-Agent spoofing — **OPEN**
- **Severity:** Medium
- **Category:** AuthZ
- **Affected File(s):** `functions/_middleware.ts`, `functions/lib/gating.ts`
- **Evidence:** `isSearchEngineBot()` matches the `User-Agent` header only. Any
  client can set `User-Agent: Googlebot` and receive gated (non-first-chapter)
  content without a session, because the middleware passes bot requests through
  unchanged.
- **Impact:** If any content must remain premium/paid, gating is trivially
  bypassed. Note this is *consistent* with the current product decision — the
  GSC indexing strategy intentionally exposes 100% of content to search engines
  — so it may be acceptable by design.
- **Recommendation:** Decide explicitly whether gated content is truly premium.
  If yes, require real bot verification (reverse-DNS lookup of the connecting IP
  against Google's published bot ranges, plus `X-Forwarded-For` checks) before
  honoring the bot bypass. If content is meant to be public, simplify the gating
  policy to avoid a false sense of protection.

### F-105: No Content-Security-Policy header — **OPEN**
- **Severity:** Low
- **Category:** Hardening
- **Affected File(s):** `_headers`, `functions/_middleware.ts`
- **Evidence:** Responses carry `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy`, but no CSP.
- **Impact:** Reduced defense-in-depth against XSS (no inline-script/styling
  restrictions). mdBook pages use inline scripts/styles, so a strict CSP requires
  nonces or hashes.
- **Recommendation:** Add a CSP (e.g. `default-src 'self'` with allowlists for
  Turnstile, GA, and Google Fonts; `script-src 'self' 'unsafe-inline'` initially,
  tightened later with hashes) in `_headers` / middleware.

### F-106: Hardcoded public identifiers as build fallbacks — **OPEN (Low)**
- **Severity:** Low
- **Category:** Hygiene
- **Affected File(s):** `scripts/builder/template-engine.ts:78,412`,
  `scripts/inject-gating.ts:66`
- **Evidence:** Turnstile site key `0x4AAAAAAEBDHm_F3WkNRSpN` and GA measurement
  ID `G-V619M5H4YW` are hardcoded as fallbacks when env vars are absent.
- **Impact:** Minimal — both values are public by design (client-side). Risk is
  that a *secret* gets added to such a fallback in the future.
- **Recommendation:** Replace with placeholders and require the env var; keep
  real values in `.env`/Cloudflare Pages env vars.

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
| F-104 | Medium | `functions/_middleware.ts`, `lib/gating.ts` | ⬜ Open | Requires product decision (bot access policy) |
| F-105 | Low | `_headers`, `functions/_middleware.ts` | ⬜ Open | Needs CSP with nonce/hash plan |
| F-106 | Low | `scripts/builder/template-engine.ts`, `inject-gating.ts` | ⬜ Open | Requires placeholder swap |

---

## 6. Repository Hardening Checklist

- [x] `.gitignore` covers `.env*`, `*.key`, `*.pem`, `service-account.json`, build artifacts
- [x] `SECURITY.md` disclosure policy published
- [x] All prior Critical/High findings remediated
- [x] Dependencies pinned to exact versions (F-005 / F-103)
- [x] Rate limiting on auth + all mutation endpoints (F-102)
- [x] Draft content hidden from non-admin API callers (F-101)
- [x] No secrets in working tree or git history (fresh scan)
- [x] Full test suite green (199 pass / 0 fail)
- [ ] Enable GitHub Secret Scanning and Push Protection
- [ ] Configure Branch Protection rules on `main`
- [ ] Enable automated dependency vulnerability scanning (e.g. Dependabot)
- [ ] Add CSP header (F-105)
- [ ] Replace hardcoded public identifier fallbacks (F-106)
- [ ] Decide bot-gating policy for gated content (F-104)
- [ ] Consider `__Host-` session cookie prefix and sliding session renewal (hardening)

---

## 7. Validation Runbook

```bash
bun test                     # 199 pass / 0 fail / 13 skip (212 tests, 30 files)
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
- The bot-bypass finding (F-104) is consistent with the product's SEO strategy
  and may be intentional; the recommendation is an explicit decision, not a
  mandatory change.
