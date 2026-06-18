# CORS Audit Report

## Summary
- Critical: 0
- High: 2
- Medium: 2
- Info: 2

**Critical Misconfiguration Check:** Every emitter was explicitly evaluated for the critical misconfiguration (setting `Access-Control-Allow-Origin: *` or an unvalidated reflected origin combined with `Access-Control-Allow-Credentials: true`). **All emitters PASS this check** as none of them emit `Access-Control-Allow-Origin` or `Access-Control-Allow-Credentials` headers.

**Endpoints & Emitters Reviewed:**
- `functions/api/books/index.ts` (API endpoint)
- `functions/api/books/[slug].ts` (API endpoint)
- `functions/api/books/[slug]/view.ts` (API endpoint)
- `functions/api/progress.ts` (API endpoint)
- `functions/_middleware.ts` (Edge middleware)
- `output/_headers` (Cloudflare Pages headers config)

## CORS Surface
- `functions/api/books/index.ts` (OPTIONS):
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- `functions/api/progress.ts` (OPTIONS):
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- `functions/api/books/[slug].ts` (OPTIONS):
  - `Access-Control-Allow-Methods: GET, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- `functions/api/books/[slug]/view.ts` (OPTIONS):
  - `Access-Control-Allow-Methods: POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`
- `functions/_middleware.ts`: Sets NO permissive `Access-Control-*` or `Vary: Origin` headers.
- `output/_headers`: Sets NO permissive `Access-Control-*` or `Vary: Origin` headers.

## Endpoint Matrix

| Endpoint | Methods | Uses Credentials (Bearer / Cookie) | Current ACAO | Allow-Credentials | Preflight Present |
|----------|---------|-----------------------------------|--------------|-------------------|-------------------|
| `functions/api/books/index.ts` | GET, POST | Both (`Authorization: Bearer` and `__session` cookie) | None | None | Yes (Incomplete) |
| `functions/api/progress.ts` | GET, POST | Both (`Authorization: Bearer` and `__session` cookie) | None | None | Yes (Incomplete) |
| `functions/api/books/[slug].ts` | GET | None (Public) | None | None | Yes (Incomplete) |
| `functions/api/books/[slug]/view.ts` | POST | None (Public) | None | None | Yes (Incomplete) |

*Note: All endpoints PASS the critical check for Wildcard / Reflected Origin combined with Credentials.*

## Findings

| ID | Location (file:line) | Issue | Severity | Evidence | Corrected Header(s) |
|----|----------------------|-------|----------|----------|---------------------|
| F01 | `functions/api/books/index.ts:199` | Incorrect preflight on credentialed endpoint (emits permissive CORS methods/headers without ACAO, ACAC, or Max-Age) without a stated cross-origin need. | High | `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` present; missing `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Max-Age` | `{}` |
| F02 | `functions/api/progress.ts:158` | Incorrect preflight on credentialed endpoint (emits permissive CORS methods/headers without ACAO, ACAC, or Max-Age) without a stated cross-origin need. | High | `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` present; missing `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Max-Age` | `{}` |
| F03 | `functions/api/books/[slug].ts:45` | Missing `Access-Control-Max-Age` and permissive CORS headers emitted without stated cross-origin need. | Medium | `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` present; missing `Access-Control-Max-Age` | `{}` |
| F04 | `functions/api/books/[slug]/view.ts:33` | Missing `Access-Control-Max-Age` and permissive CORS headers emitted without stated cross-origin need. | Medium | `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers` present; missing `Access-Control-Max-Age` | `{}` |
| I01 | `functions/_middleware.ts:88` | Confirmed endpoint correctly emits no CORS headers on non-200 responses (401/302). | Info | Response returns 401/302 without `Access-Control-*` headers. | `{ "Content-Type": "application/json", "Cache-Control": "private, no-store", "Vary": "Cookie" }` |
| I02 | `output/_headers:6` | CSP is not relied upon as a CORS control. | Info | `Content-Security-Policy` exists without CORS `Access-Control-*` headers. | *(No change to CORS)* |

## Remediation

### High Severity
**F01 & F02: `functions/api/books/index.ts` and `functions/api/progress.ts`**
Remove the `OPTIONS` preflight handlers entirely to rely on the secure same-origin policy, since no intended cross-origin consumers are stated.
Exact final CORS header values:
```json
{}
```

### Medium Severity
**F03 & F04: `functions/api/books/[slug].ts` and `functions/api/books/[slug]/view.ts`**
Remove the `OPTIONS` handlers entirely.
Exact final CORS header values:
```json
{}
```

## CSP Note (Informational)
The `output/_headers` file contains a robust Content-Security-Policy (CSP) that allowlists external domains for scripts, styles, fonts, and connects (e.g., `https://clerk.dev`, `https://fonts.gstatic.com`, `https://cdnjs.cloudflare.com`, `https://cdn.jsdelivr.net`). This CSP effectively controls resource loading and connection targets within the browser, but it is distinctly separate from CORS. The application correctly does not attempt to use this CSP allowlist as a substitute for `Access-Control-Allow-Origin` controls on its own endpoints.

## Limitations
- Unless a local dev server (`wrangler` / `bun run` Pages dev) is available, the audit is based on static analysis of source and config rather than live cross-origin requests.
- Git history was not rewritten.
- No automatic commits or pushes were made.
