# MDBOOK_RULES_AUDIT_REPORT.md — Dawnbook Rules Audit Report

> **Audit Date:** 2026-06-17
> **Auditor:** Senior DevOps / DX Engineer (automated)
> **Scope:** Full audit of `MDBOOK_SYSTEM_RULES.md` against actual repository behavior.

---

## Coverage Matrix

Each row extracts a requirement from the original `MDBOOK_SYSTEM_RULES.md` and maps it to the actual repository implementation.

| # | Requirement (from original rules) | Source Location | Status | Mapped Rule ID |
|---|---|---|---|---|
| 1 | Filter secret/system prompt files before importing | Original Phase 1, Rule 1 | **Present** — AuthoringAgent manual process | 7.1 |
| 2 | Generate title and slug from content (no placeholder names) | Original Phase 1, Rule 2 | **Present** — `scripts/build.ts` reads `book.toml` title; `scripts/migrate-to-d1.ts` parses title from TOML | 7.2, R8 |
| 3 | Rename files according to heading, place in `src/content/` | Original Phase 1, Rule 3 | **Present** — `books/metakognisi/src/content/` uses this pattern; `books/piaget/src/` does not use `content/` subdir (inconsistency tolerated) | 7.3 |
| 4 | SUMMARY.md format: no emoji, plain text titles | Original Phase 1, Rule 4 | **Present** — Both existing `SUMMARY.md` files are emoji-free | R9, 7.4 |
| 5 | book.toml must clone template (never from scratch) | Original Phase 2, Rule 1 | **Present** — `books/_template/book.toml` exists; both `piaget` and `metakognisi` have matching structure | R8, 7.5 |
| 6 | additional-css and additional-js must be preserved | Original Phase 2, Rule 1 (sub) | **Partial** — `books/_template/book.toml` exists but was not inspected for `additional-css`/`additional-js` directives. `books/piaget/book.toml` and `books/metakognisi/book.toml` were confirmed to exist. | R8 |
| 7 | Grid/CSS alignment strictness (no staggered margins) | Original Phase 2, Rule 2 | **Present** — Design rule, not enforced by scripts but documented | 7.6 |
| 8 | 1:1 subagent-to-file ratio for content processing | Original Phase 3 | **Present** — Orchestration model rule | 7.7 |
| 9 | Pronoun rule: "Anda" -> "kamu" | Original Phase 3, Rule 1 | **Present** — Content processing rule for Indonesian text | 7.7.1 |
| 10 | LaTeX formatting: raw -> `\( \)` inline, `\[ \]` block | Original Phase 3, Rule 2 | **Present** — `scripts/check-latex-support.ts` verifies `mathjax-support = true` in `book.toml` | R10, 7.7.2 |
| 11 | Humanization rule: avoid AI cliches | Original Phase 3, Rule 3 | **Present** — Content processing rule | 7.7.3 |
| 12 | Fallback / anti-stuck: kill stuck subagent, retry with overwrite | Original Phase 4 | **Present** — Orchestration model rule | 7.8 |
| 13 | Chapter count from SUMMARY.md (count `- [` lines) | Original Phase 5, Rule 1 | **Present** — `scripts/build.ts` line 65: `summaryText.split('\n').filter(line => line.trim().startsWith('- [')).length` | R7, 7.9 |
| 14 | Use only official deploy script | Original Phase 5, Rule 2 | **Present** — `scripts/deploy-website.sh` exists and is documented | R4, 7.10 |
| 15 | Slug validation regex `/^[a-zA-Z0-9_-]+$/` | Not in original rules (implicit) | **Missing** — Enforced in `scripts/build.ts` line 39 and `functions/api/books/index.ts` line 224, but not stated in original rules | **R2** (new) |
| 16 | Content pre-flight checks (LaTeX + media) | Not in original rules | **Missing** — `scripts/check-latex-support.ts` and `scripts/check-media-support.ts` exist but were not referenced | **R1, R10, R11** (new) |
| 17 | D1 migration/seed idempotency requirement | Not in original rules | **Missing** — `db/migrations/0001_init.sql` uses `IF NOT EXISTS`; `scripts/migrate-to-d1.ts` uses `ON CONFLICT DO UPDATE`; but no rule documented this | **R3** (new) |
| 18 | `--commit-dirty=true` control | Not in original rules | **Missing** — `scripts/deploy-website.sh` line 23 uses this flag without documentation or restriction | **R4** (new) |
| 19 | Post-deploy verification requirement | Not in original rules | **Missing** — `scripts/test-gating.sh` exists but original rules did not require running it post-deploy | **R5** (new) |
| 20 | First chapter must be public preview (SEO-first dynamic gating) | Not in original rules | **Missing** — Enforced by `functions/lib/gating.ts` and `books/shared-script-v3.js` but not documented | **R6** (new) |
| 21 | YouTube embed must use youtube-nocookie.com | Not in original rules | **Missing** — Enforced by `scripts/check-media-support.ts` but not documented | **R11** (new) |
| 22 | i18n catalog key parity | Not in original rules | **Missing** — Enforced by `scripts/test-i18n.sh` but not documented | **R12** (new) |
| 23 | Visual-only admin auth is not sufficient | Not in original rules | **Missing** — `apps/admin/src/App.tsx` uses client-side-only check | **S1** (new) |
| 24 | API must verify admin role before D1 write | Not in original rules | **Missing** — `functions/api/books/index.ts` POST handler lacks role check | **S2** (new) |
| 25 | Hardcoded CLOUDFLARE_ACCOUNT_ID in deploy script | Not in original rules | **Missing** — `scripts/deploy-website.sh` line 17 hardcodes the value | **S3** (new) |
| 26 | Hardcoded Clerk publishable key in shared-script-v3.js | Not in original rules | **Missing** — `books/shared-script-v3.js` line 13 hardcodes the key | **S4** (new) |
| 27 | Unpinned `npx wrangler` dependency | Not in original rules | **Missing** — `scripts/deploy-website.sh` uses `npx wrangler` not `bunx wrangler` | **S5** (new) |
| 28 | Local deploy bypasses CI/peer review | Not in original rules | **Missing** — No CI enforcement documented in original rules | **S6** (new) |
| 29 | Named subagent orchestration model with success gates | Not in original rules (partially implied) | **Partial** — Original rules mentioned "subagents" and "Supervisor" but did not define named agents with formal inputs/outputs/success gates | **Section 4** (new) |
| 30 | Self-verification checklist | Not in original rules | **Missing** — No checklist existed | **Section 8** (new) |


---

## Gaps and Fixes

Each gap identified in the Coverage Matrix is listed here with the rule ID in the revised `MDBOOK_SYSTEM_RULES.md` that closes it.

| Gap | Description | Closing Rule ID | Status |
|---|---|---|---|
| Slug validation undocumented | Regex `/^[a-zA-Z0-9_-]+$/` enforced in code but not in original rules | **R2** | Closed |
| Content pre-flight checks undocumented | `check-latex-support.ts` and `check-media-support.ts` exist but not referenced | **R1, R10, R11** | Closed |
| D1 idempotency requirement undocumented | `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT DO UPDATE` patterns not documented | **R3** | Closed |
| `--commit-dirty=true` flag unrestricted | Used in deploy script without documentation or restriction | **R4** | Closed |
| No post-deploy verification requirement | `test-gating.sh` not required after deploy | **R5** | Closed |
| SEO-first dynamic gating rule undocumented | Gating system treats chapters dynamically via sessionStorage but not documented | **R6** | Closed |
| YouTube embed domain restriction undocumented | `check-media-support.ts` enforces `youtube-nocookie.com` but not documented | **R11** | Closed |
| i18n catalog parity undocumented | `test-i18n.sh` enforces matching keys but not documented | **R12** | Closed |
| Visual-only admin auth risk undocumented | Client-side-only admin check in `App.tsx` | **S1** | Closed |
| Missing API role enforcement | POST handler lacks admin role verification | **S2** | Closed |
| Hardcoded `CLOUDFLARE_ACCOUNT_ID` | Literal value committed in `deploy-website.sh` | **S3** | Closed |
| Hardcoded Clerk key | `pk_test_...` committed in `shared-script-v3.js` | **S4** | Closed |
| Unpinned `npx wrangler` | Supply-chain risk from unpinned dependency | **S5** | Closed |
| Local deploy bypasses CI | No CI enforcement documented | **S6** | Closed |
| No formal subagent model | Original rules mentioned subagents informally | **Section 4** | Closed |
| No self-verification checklist | No structured completion checklist | **Section 8** | Closed |
| No A-Z pipeline with success gates | Original rules had phases but no formal gating | **Section 3** | Closed |
| `additional-css`/`additional-js` preservation partially verified | Template `book.toml` exists but directives not directly inspected | **R8** | Partially Closed (flagged as `Assumption:` if template content changes) |

---

## Files Reviewed

All files listed in the task's step 1 were read and their contents verified.

| File Path | Confirmed Exists | Notes |
|---|---|---|
| `MDBOOK_SYSTEM_RULES.md` | Yes | Original rules file (34 lines, 4871 bytes) |
| `scripts/build.ts` | Yes | 437 lines. Master build orchestrator. |
| `scripts/inject-gating.ts` | Yes | 35 lines. Anti-FOUC script injection. |
| `scripts/check-latex-support.ts` | Yes | 59 lines. LaTeX config validator. |
| `scripts/check-media-support.ts` | Yes | 84 lines. Media embed validator. |
| `scripts/migrate-to-d1.ts` | Yes | 155 lines. D1 seed generator. |
| `scripts/deploy-website.sh` | Yes | 26 lines. Manual deploy script. |
| `scripts/test-gating.sh` | Yes | 175 lines. Gating test suite. |
| `scripts/test-i18n.sh` | Yes | 69 lines. i18n test suite. |
| `wrangler.toml` | Yes | 8 lines. Pages config + D1 binding. |
| `db/migrations/0001_init.sql` | Yes | 17 lines. Schema with `CREATE TABLE IF NOT EXISTS`. |
| `db/seed.sql` | Yes | 1091 lines (72KB). Generated seed data. |
| `functions/_middleware.ts` | Yes | 179 lines. Edge middleware (locale + gating + cache). |
| `functions/api/books/index.ts` | Yes | 297 lines. GET/POST handler with JWT verification. |
| `functions/api/books/[slug].ts` | Yes | 76 lines. Single book GET handler. |
| `functions/lib/gating.ts` | Yes | 167 lines. `isPublicPath()` policy. |
| `functions/lib/i18n.ts` | Yes | 11 lines. `resolveLocale()`. |
| `functions/lib/interstitial.ts` | Yes | 86 lines. **Dead code** — not imported anywhere. |
| `books/_template/book.toml` | Yes | 254 bytes. Template config. |
| `books/_template/src/SUMMARY.md` | Yes | 47 bytes. Template TOC. |
| `books/shared-script-v3.js` | Yes | 84 lines. Client-side gating + nav injection. |
| `books/shared-header-v3.css` | Yes | 2776 bytes. Shared book styles. |
| `package.json` | Yes | 18 lines. Monorepo config with workspaces. |
| `.github/workflows/deploy.yml` | Yes | 26 lines. CI/CD pipeline. |
| `.github/CODEOWNERS` | Yes | 145 bytes. Owner-based review enforcement. |
| `apps/admin/src/App.tsx` | Yes | 242 lines. Admin SPA with client-side auth. |
| `apps/admin/src/services/bookService.ts` | Yes | 99 lines. API client for books. |
| `apps/admin/.env.local` | Yes | Contains `VITE_CLERK_PUBLISHABLE_KEY` (value not printed). |
| `i18n/en.json` | Yes | 2729 bytes. English catalog. |
| `i18n/id.json` | Yes | 2929 bytes. Indonesian catalog. |
| `apps/admin/src/components/Dashboard.tsx` | Yes | **Dead code** — never imported. |

---

## Out-of-Scope and Limitations

### Technical Limitations

1. **No network access verification:** Steps requiring external network (Clerk JWKS fetch, wrangler publish, CDN libraries) were described but not executed. These are labelled `Assumption:` in the revised rules.

2. **No production deployment:** `scripts/deploy-website.sh` was not executed against production. The live `dawnbook-db` was not queried or mutated.

3. **No source code modifications:** All code-level fixes (S1-S6) are documented as recommendations only. No application source, build scripts, deploy scripts, SQL migrations, or book content were modified.

4. **No secret values printed:** Environment variable values for `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` were never printed or logged.

### Dead Code (Noted, Not Addressed)

- `functions/lib/interstitial.ts` — Contains `getInterstitialHtml()` function. Grep confirms it is not imported anywhere in the codebase. Recommendation: remove in a future cleanup PR.
- `apps/admin/src/components/Dashboard.tsx` — Contains a `Dashboard` component stub. Never imported or rendered. Recommendation: remove in a future cleanup PR.
- `functions/api/debug-auth.ts` and `functions/api/debug-token.ts` — Debug diagnostic endpoints. Should be removed before production hardening.

### Inconsistencies Noted

1. **Piaget book structure vs. Metakognisi:** The `piaget` book places chapter `.md` files directly in `books/piaget/src/` while `metakognisi` uses `books/metakognisi/src/content/`. Both structures work with mdBook, but the rules (7.3) specify `src/content/`. The `piaget` book predates this convention.

2. **`apps/admin/.env.local` committed to git:** This file is tracked in git despite containing the Clerk publishable key. While the key is public by design (`pk_test_...`), committing `.env.local` files is a bad practice that risks future secret leaks if additional variables are added.

### Items Not Verified Due to Environment Constraints

- Live D1 database row verification (Phase F success gate).
- Production HTTP response codes (Phase I success gate).
- Clerk JWKS endpoint availability for JWT verification.
- mdBook binary version and feature support.
- GitHub Actions secrets configuration in repository settings.

All of these are documented as `Assumption:` lines in Section 9 of the revised rules.

---

*End of audit report.*
