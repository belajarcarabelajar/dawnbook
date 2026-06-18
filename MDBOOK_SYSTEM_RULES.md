# MDBOOK_SYSTEM_RULES.md — Dawnbook Authoritative Autopilot Rules (End-to-End)

> **Status:** Revised and audited 2026-06-17. Single source of truth for every AI agent and human contributor. Every claim is grounded in actual repository files; unverifiable claims are labelled `Assumption:`.
>
> **No application source code, build scripts, deploy scripts, SQL migrations, or book content may be modified as a result of following these rules.** Code-level changes are recommendations only.

---

## 1. Scope and Terminology

### 1.1 Scope

These rules govern the complete lifecycle of a book in the Dawnbook monorepo, from initial scaffold through production deployment. They apply to:

- AI subagents operating in automated pipelines.
- Human contributors authoring or reviewing content.
- CI/CD systems executing automated workflows.

### 1.2 Fixed Terminology

The following terms are canonical. **Do not introduce synonyms.**

| Term | Definition |
|---|---|
| **phase** | A discrete, ordered step in the A–Z pipeline (labelled A through I). |
| **subagent** | An autonomous AI process with a single responsibility, bounded scope, and a defined success gate. |
| **success gate** | The specific, verifiable condition that must be true for a phase to be considered complete and for the next phase to begin. |
| **OrchestratorAgent** | The top-level subagent that sequences all other subagents and enforces success gates. |
| **ScaffoldAgent** | Subagent responsible for Phase A: scaffold from template. |
| **AuthoringAgent** | Subagent responsible for Phase B: author book files. |
| **ValidationAgent** | Subagent responsible for Phases C and D: slug validation and content checks. |
| **BuildAgent** | Subagent responsible for Phase E: `bun run build`. |
| **DataAgent** | Subagent responsible for Phase F: D1 seed and migration. |
| **TestAgent** | Subagent responsible for Phase G: gating and i18n tests. |
| **DeployAgent** | Subagent responsible for Phase H: deploy via `scripts/deploy-website.sh`. |
| **VerifyAgent** | Subagent responsible for Phase I: post-deploy verification. |

### 1.3 Out-of-Scope Items

- Dead code (`functions/lib/interstitial.ts`, `apps/admin/src/components/Dashboard.tsx`) — noted only in the audit report.
- Direct mutation of the live `dawnbook-db` D1 database outside of approved migration scripts.
- Execution of `scripts/deploy-website.sh` against production without CI approval.
- Modification of application source code, build scripts, deploy scripts, SQL migrations, or book content as a result of following these rules.

---

## 2. Tech Stack and Fixed Commands

### 2.1 Runtime and Tooling

| Component | Name / Version | Role |
|---|---|---|
| JavaScript Runtime | **Bun v1.2+** | All JS/TS execution, package manager |
| Static Site Generator | **mdBook** | Compiles `books/<slug>/` into HTML |
| Edge Platform | **Cloudflare Pages + Pages Functions (TypeScript)** | Hosts static site and serverless API |
| Edge Database | **Cloudflare D1 SQLite** (`dawnbook-db`) | Stores book metadata and content |
| Authentication | **Clerk** | Session-based gating at edge and client |
| Linting / Type Check | **ESLint + TypeScript** | Admin SPA only (`apps/admin/`) |

### 2.2 Fixed Entry Points and Paths

| Path | Role |
|---|---|
| `scripts/build.ts` | Build orchestration entrypoint (`bun run build`) |
| `scripts/deploy-website.sh` | Deployment entrypoint |
| `books/_template/` | Book template source |
| `output/` | Generated build output (do not edit manually) |
| `db/migrations/0001_init.sql` | D1 schema |
| `scripts/migrate-to-d1.ts` | D1 seeder |
| `functions/_middleware.ts` | Edge middleware |
| `functions/lib/gating.ts` | Gating policy |
| `functions/api/books/index.ts` | Books API (list + create) |
| `functions/api/books/[slug].ts` | Books API (single read) |
| `apps/hub/src/` | Hub UI assets |
| `apps/admin/src/` | Admin SPA |
| `i18n/en.json`, `i18n/id.json` | i18n catalogs |

### 2.3 Environment Variable Names

**Never print, log, or commit their values.**

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`

---

## 3. New Book A–Z Pipeline (Phases A–I)

The following pipeline is the canonical, ordered sequence for introducing a new book into production. The OrchestratorAgent enforces that no phase begins until the previous phase's success gate has been verified.

---

### Phase A — Scaffold from Template

**Trigger command:**
```bash
cp -r books/_template books/<slug>
```

**What happens:** Copies `books/_template/book.toml`, `books/_template/src/SUMMARY.md`, and `books/_template/src/introduction.md` into `books/<slug>/`. The slug must satisfy Rule R2 before this step executes.

**Success gate:** `books/<slug>/book.toml` exists. `books/<slug>/src/SUMMARY.md` exists.

---

### Phase B — Author Book Files

**Trigger:** No shell command; authoring phase executed by AuthoringAgent.

**What happens:**
1. Update `books/<slug>/book.toml` — clone of `books/_template/book.toml` with `title` and `authors` replaced. The `additional-css` and `additional-js` directives referencing `books/shared-header-v3.css` and `books/shared-script-v3.js` **must** be preserved.
2. Write `books/<slug>/icon.txt` containing a single emoji character.
3. Write chapter files as `books/<slug>/src/content/<NN>_<name>.md` — filenames begin with zero-padded two-digit number.
4. Update `books/<slug>/src/SUMMARY.md` with chapter links using real extracted headings. No emoji. Plain text only.
5. First chapter in `SUMMARY.md` **must** have a filename beginning with `01` (public preview gating).

**Success gate:** `book.toml` contains `title = "..."` and `mathjax-support = true`. `SUMMARY.md` has >= 1 `- [` entry. First entry targets a file beginning with `01`.

---

### Phase C — Slug Validation

**Trigger command:**
```bash
echo "<slug>" | grep -qE '^[a-zA-Z0-9_-]+$' && echo "VALID" || echo "INVALID"
```

**What happens:** Tests slug against `/^[a-zA-Z0-9_-]+$/` (matching `functions/api/books/index.ts` and `scripts/build.ts`). Invalid slug halts the pipeline.

**Success gate:** Slug matches regex and does not begin with `_` (underscore-prefixed dirs are skipped by `scripts/build.ts`).

**Failure/rollback:** Delete `books/<slug>/`. Report invalid slug. Request new slug before retrying Phase A.

---

### Phase D — Content Pre-Flight Checks

**Trigger commands (both must pass):**
```bash
bun run scripts/check-latex-support.ts
bun run scripts/check-media-support.ts
```

**What `check-latex-support.ts` does:** Reads every `books/*/book.toml` (verifying `mathjax-support = true`), validates CSP headers, and parses/verifies all mathematical formulas in chapter Markdown files via the KaTeX compiler (flagging raw single `$` delimiters, math syntax/rendering errors, and warning on unformatted multi-letter variables). Exits 1 on failure.

**What `check-media-support.ts` does:** Verifies `books/shared-header-v3.css` has `.embed-responsive` and responsive `img`. Scans for forbidden `no-html = true`. Fails on `youtube.com/embed` (must use `youtube-nocookie.com`). Warns on unwrapped `<iframe>`. Verifies CSP directives. Exits 1 on error.

**Success gate:** Both scripts exit code 0.

**Failure/rollback:** Phase E must not start. AuthoringAgent re-activated to fix content issues.

---

### Phase E — Build

**Trigger command:**
```bash
bun run build
```

**What `scripts/build.ts` does (in order):**
1. Creates `output/` and `output/books/`.
2. Runs `check-latex-support.ts` and `check-media-support.ts` (internal guards).
3. For each `books/<slug>/` (skipping `_`-prefixed and invalid slugs): `mdbook build books/<slug>/ -d output/books/<slug>/`.
4. Reads `book.toml` for title, `SUMMARY.md` for chapter count (`- [` lines), `icon.txt` for emoji.
5. Generates `output/index.html`, `output/about.html`, `output/contribute.html`, `output/sign-in.html`, `output/manifest.json`.
6. Copies hub CSS (`typography.css`, `tokens.css`, `HubLayout.css`) into `output/`.
7. Runs `scripts/inject-gating.ts` — injects `opacity:0; visibility:hidden` into `<head>` of non-public chapter HTML.
8. Builds admin SPA: `cd apps/admin && bun run build`, copies to `output/admin`.
9. Writes `output/_redirects` and `output/_headers` (with CSP).

**Success gate:** Exit code 0. `output/books/<slug>/index.html` exists. `output/_headers` exists.

**Failure/rollback:** Pipeline stops. BuildAgent reports failing slug and error. AuthoringAgent re-activated.

---

### Phase F — D1 Seed and Migration

**Trigger commands (in sequence):**
```bash
# Step 1: Apply schema (idempotent)
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  npx wrangler d1 execute dawnbook-db --remote \
  --file=db/migrations/0001_init.sql --yes

# Step 2: Generate and apply seed (idempotent upsert)
bun run scripts/migrate-to-d1.ts
```

**What happens:** Schema uses `CREATE TABLE IF NOT EXISTS`. Seed uses `INSERT ... ON CONFLICT(slug) DO UPDATE SET ...`. Both idempotent.

**Success gate:** Both exit code 0. New book's slug exists as a row in `dawnbook-db`.

**Failure/rollback:** Report wrangler error. Migration is idempotent so no rollback needed.

`Assumption:` Network access to `api.cloudflare.com` is available.

---

### Phase G — Test Suite

**Trigger commands (both must pass):**
```bash
bash scripts/test-gating.sh [BASE_URL]
bash scripts/test-i18n.sh
```

**`test-gating.sh`:** Verifies all chapter HTML pages return 200 OK at the edge for SEO. Verifies that the dynamic FOUC prevention script (`sessionStorage.getItem('free_chapter_viewed')`) is injected into the HTML. Defaults to `http://localhost:8788`.

**`test-i18n.sh`:** Verifies `en.json` and `id.json` have identical keys. Tests `resolveLocale()` with country/cookie combos.

**Success gate:** Both scripts exit code 0.

**Failure/rollback:** Phase H must not start. TestAgent reports failing tests.

`Assumption:` `wrangler pages dev` on port 8788 or a preview URL is available.

---

### Phase H — Deploy

**Trigger command:**
```bash
bash scripts/deploy-website.sh
```

**What happens:** `bun install` → sources `.env.local` → `bun run build` → D1 migration → `wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true`.

**Success gate:** Wrangler exits code 0 and prints deployment URL.

**Failure/rollback:** Do not retry automatically. Prior deployment remains active. Rollback via Cloudflare Pages dashboard.

`Assumption:` `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are available.

---

### Phase I — Post-Deploy Verification

**Trigger command:**
```bash
bash scripts/test-gating.sh https://dawnbook.belajarcarabelajar.com
```

**What happens:** Re-runs full gating test suite against live production URL, verifying 200 OK for all HTML and FOUC script injection.

**Success gate:** All tests pass, exit code 0.

**Failure/rollback:** Roll back via Cloudflare Pages dashboard immediately. Triage before next deploy.


---

## 4. Subagent Orchestration Model

### 4.1 OrchestratorAgent

**Responsibility:** Sequences all subagents, enforces success gates, halts pipeline on failure.

**Inputs:** New book request (slug, title, author name(s), chapter content paths or raw text).

**Scope:** Read-only access to repository state; write access only to spawn and communicate with subagents.

**Sequence:**
```
OrchestratorAgent
  -> ScaffoldAgent (Phase A)    [success gate -> proceed]
  -> AuthoringAgent (Phase B)   [success gate -> proceed]
  -> ValidationAgent (Phase C+D)[success gate -> proceed]
  -> BuildAgent (Phase E)       [success gate -> proceed]
  -> DataAgent (Phase F)        [success gate -> proceed]
  -> TestAgent (Phase G)        [success gate -> proceed]
  -> DeployAgent (Phase H)      [success gate -> proceed]
  -> VerifyAgent (Phase I)      [success gate -> DONE]
```

**Failure behavior:** On any subagent failure, OrchestratorAgent kills the failed subagent, logs the failure (subagent name, phase letter, error message), and halts. For stuck subagents, OrchestratorAgent restarts with explicit `write_to_file` `Overwrite: true` strategy.

---

### 4.2 ScaffoldAgent

| Field | Value |
|---|---|
| **Phase** | A |
| **Input** | Validated slug string |
| **Allowed file scope** | Read: `books/_template/**`. Write: `books/<slug>/**` (new directory only). |
| **Allowed commands** | `cp -r books/_template books/<slug>` |
| **Output artifact** | `books/<slug>/book.toml`, `books/<slug>/src/SUMMARY.md`, `books/<slug>/src/introduction.md` |
| **Success gate** | All three files exist on disk. |
| **Failure/rollback** | Delete `books/<slug>/` and report error to OrchestratorAgent. |

### 4.3 AuthoringAgent

| Field | Value |
|---|---|
| **Phase** | B |
| **Input** | Slug, book title, author list, chapter content (Markdown text), emoji icon |
| **Allowed file scope** | Write: `books/<slug>/book.toml`, `books/<slug>/icon.txt`, `books/<slug>/src/SUMMARY.md`, `books/<slug>/src/content/*.md` |
| **Allowed commands** | File read/write tools only. No shell execution. |
| **Output artifact** | All book source files populated with real content. |
| **Success gate** | `book.toml` contains `mathjax-support = true`. `SUMMARY.md` has >= 1 `- [` entry. First chapter filename begins with `01`. No emoji in `SUMMARY.md`. `book.toml` includes `additional-css` and `additional-js`. |
| **Failure/rollback** | Report which success gate was not met. OrchestratorAgent re-invokes with corrected inputs. |

### 4.4 ValidationAgent

| Field | Value |
|---|---|
| **Phase** | C + D |
| **Input** | Slug, paths to all `books/<slug>/` files |
| **Allowed file scope** | Read: `books/<slug>/**`, `books/*/book.toml`, `books/shared-header-v3.css`, `scripts/build.ts`, `scripts/check-latex-support.ts`, `scripts/check-media-support.ts` |
| **Allowed commands** | Slug regex check; `bun run scripts/check-latex-support.ts`; `bun run scripts/check-media-support.ts` |
| **Output artifact** | Validation report (pass/fail per check with error messages). |
| **Success gate** | Slug matches regex. Both check scripts exit code 0. |
| **Failure/rollback** | Report exact failures to OrchestratorAgent. AuthoringAgent re-activated. Pipeline halts. |

### 4.5 BuildAgent

| Field | Value |
|---|---|
| **Phase** | E |
| **Input** | All files under `books/<slug>/`, `apps/hub/src/`, `apps/admin/src/`, `i18n/`, `scripts/` |
| **Allowed file scope** | Read: entire repository (except `node_modules`, `.git`). Write: `output/**` only. |
| **Allowed commands** | `bun run build` |
| **Output artifact** | `output/books/<slug>/`, `output/index.html`, `output/admin/`, `output/_redirects`, `output/_headers` |
| **Success gate** | Exit code 0. `output/books/<slug>/index.html` exists. `output/_headers` exists. |
| **Failure/rollback** | Report failing slug and stderr. Pipeline halts. AuthoringAgent re-activated. |

### 4.6 DataAgent

| Field | Value |
|---|---|
| **Phase** | F |
| **Input** | All `books/<slug>/` source files; `db/migrations/0001_init.sql` |
| **Allowed file scope** | Read: `books/**`, `db/**`. Write: `db/seed.sql`. |
| **Allowed commands** | `PATH=... npx wrangler d1 execute dawnbook-db --remote --file=db/migrations/0001_init.sql --yes`; `bun run scripts/migrate-to-d1.ts` |
| **Output artifact** | Updated `db/seed.sql`; confirmed D1 row for the new slug. |
| **Success gate** | Both commands exit code 0. |
| **Failure/rollback** | D1 operations are idempotent. Report wrangler error, do not retry automatically. |

### 4.7 TestAgent

| Field | Value |
|---|---|
| **Phase** | G |
| **Input** | `BASE_URL` (default `http://localhost:8788` or preview URL) |
| **Allowed file scope** | Read: `scripts/test-gating.sh`, `scripts/test-i18n.sh`, `i18n/*.json`, `functions/lib/i18n.ts` |
| **Allowed commands** | `bash scripts/test-gating.sh [BASE_URL]`; `bash scripts/test-i18n.sh` |
| **Output artifact** | Test report (PASS/FAIL per test case). |
| **Success gate** | Both scripts exit code 0. |
| **Failure/rollback** | Report failing tests. Pipeline halts before Phase H. |

### 4.8 DeployAgent

| Field | Value |
|---|---|
| **Phase** | H |
| **Input** | Confirmed Phase G success gate. Deployment credentials as env vars. |
| **Allowed file scope** | Read: `output/**`, `wrangler.toml`, `apps/admin/.env.local`. Execute: `scripts/deploy-website.sh`. |
| **Allowed commands** | `bash scripts/deploy-website.sh` |
| **Output artifact** | Deployment URL from wrangler output. |
| **Success gate** | Wrangler exits code 0. Deployment URL printed. |
| **Failure/rollback** | Do not retry automatically. Report full error. Prior deployment remains active. |

### 4.9 VerifyAgent

| Field | Value |
|---|---|
| **Phase** | I |
| **Input** | Production deployment URL. |
| **Allowed file scope** | Read: `scripts/test-gating.sh`. |
| **Allowed commands** | `bash scripts/test-gating.sh <PRODUCTION_URL>` |
| **Output artifact** | Post-deploy verification report (pass/fail per test case). |
| **Success gate** | All tests pass, exit code 0. |
| **Failure/rollback** | Roll back via Cloudflare Pages dashboard immediately. Report all failing tests. |


---

## 5. Automation Rules

Each rule includes a **statement**, the **exact command or file path**, and an **acceptance check**.

---

**R1 — Build Invocation and Required Pre-Checks**

*Statement:* The canonical build command is `bun run build`. It must not be invoked unless Phases C and D have passed. The build script re-runs `scripts/check-latex-support.ts` and `scripts/check-media-support.ts` internally as guards.

*Exact command:*
```bash
bun run build
```

*Acceptance check:* Exit code 0. `output/books/<slug>/index.html` exists. `output/_headers` exists and contains `Content-Security-Policy`. `output/_redirects` exists.

---

**R2 — Slug Validation and Rejection Behavior**

*Statement:* Every book slug must match `/^[a-zA-Z0-9_-]+$/` (enforced in `functions/api/books/index.ts` and `scripts/build.ts`). Slugs must not begin with underscore (`scripts/build.ts` skips `_`-prefixed dirs). Invalid slug halts pipeline at Phase C.

*Exact check:*
```bash
echo "<slug>" | grep -qE '^[a-zA-Z0-9_-]+$' && echo "VALID" || { echo "INVALID"; exit 1; }
```

*Acceptance check:* Exits 0, prints `VALID`. Slug does not start with `_`.

---

**R3 — D1 Migration and Seed: Command Sequence and Idempotency**

*Statement:* Every deployment must apply schema migration before seeding. Both operations are idempotent: schema uses `CREATE TABLE IF NOT EXISTS`; seed uses `INSERT ... ON CONFLICT(slug) DO UPDATE SET ...`.

*Exact commands:*
```bash
# Step 1: Schema (idempotent)
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
  npx wrangler d1 execute dawnbook-db --remote \
  --file=db/migrations/0001_init.sql --yes

# Step 2: Seed (idempotent upsert)
bun run scripts/migrate-to-d1.ts
```

*Acceptance check:* Both exit code 0. Re-running produces no error. Row for new slug exists with `status = 'published'`.

---

**R4 — Deploy Command and `--commit-dirty=true` Control**

*Statement:* Deploy exclusively via `bash scripts/deploy-website.sh`. The `--commit-dirty=true` flag must not be used in CI/CD pipelines — permissible only for emergency local hotfixes with explicit documentation. Recommended: remove `--commit-dirty=true` and route all deploys through `.github/workflows/deploy.yml`.

*Exact command (current):*
```bash
bash scripts/deploy-website.sh
```

*Acceptance check:* Exits code 0. Wrangler prints deployment URL.

---

**R5 — Mandatory Post-Deploy Test Before Marking Complete**

*Statement:* Deployment is not complete until VerifyAgent (Phase I) runs `bash scripts/test-gating.sh <PRODUCTION_URL>` and all tests pass (exit code 0).

*Exact command:*
```bash
bash scripts/test-gating.sh https://dawnbook.belajarcarabelajar.com
```

*Acceptance check:* Exits 0. Output contains `All tests passed!`. Specific checks: book root -> 200, all chapter HTML -> 200 (for SEO), and HTML contains the `free_chapter_viewed` sessionStorage script.

---

**R6 — Dynamic SEO-First Gating**

*Statement:* The gating system (`functions/lib/gating.ts` and `books/shared-script-v3.js`) treats all chapter HTML files as public at the edge to ensure full SEO indexing. Gating is enforced dynamically on the client-side using `sessionStorage`: a user's first visited chapter is their free preview, and subsequent chapters require authentication. The book index (`index.html`), `toc.html`, `404.html`, and `print.html` are always public and do not consume the free preview.

*Acceptance check:* `isPublicPath` in `functions/lib/gating.ts` returns `true` for all book paths. Client-side JS (`shared-script-v3.js`) reads/writes `free_chapter_viewed` in `sessionStorage`.

---

**R7 — Chapter Count from SUMMARY.md**

*Statement:* `scripts/build.ts` counts chapters by counting `- [` lines in `SUMMARY.md`. Do not count `.md` files in directory as proxy. Prevents ghost chapter miscounts.

*Acceptance check:* Hub book card chapter count matches `- [` line count in `SUMMARY.md`.

---

**R8 — book.toml Must Be Cloned from Template**

*Statement:* Never create `book.toml` from scratch. Clone `books/_template/book.toml`, modify only `title` and `authors`. Ensures `mathjax-support = true`, `additional-css`, and `additional-js` are always present.

*Acceptance check:* `book.toml` contains `mathjax-support = true`. `bun run scripts/check-latex-support.ts` exits 0.

---

**R9 — SUMMARY.md: No Emoji, Plain Text Only**

*Statement:* Chapter titles in `SUMMARY.md` must be plain text. No emoji. Produces professional sidebar navigation.

*Acceptance check:* No emoji Unicode ranges found in `SUMMARY.md`.

---

**R10 — LaTeX Formatting Rule**

*Statement:* Raw LaTeX in chapter Markdown must use `\( ... \)` for inline and `\[ ... \]` (or `$$ ... $$`) for block math. Undelimited LaTeX will not render.

*Acceptance check:* `bun run scripts/check-latex-support.ts` exits 0.

---

**R11 — YouTube Embeds Must Use `youtube-nocookie.com`**

*Statement:* All `<iframe>` YouTube embeds must use `https://www.youtube-nocookie.com/embed/...`. `scripts/check-media-support.ts` fails on `youtube.com/embed`.

*Acceptance check:* `bun run scripts/check-media-support.ts` exits 0. No `youtube.com/embed` in chapter files.

---

**R12 — i18n Catalog Key Parity**

*Statement:* `i18n/en.json` and `i18n/id.json` must have identical top-level keys.

*Acceptance check:* `bash scripts/test-i18n.sh` exits code 0.

---

## 6. Security and Process Rules

Each rule states an **enforced constraint** and a **required end state**.

---

**S1 — Visual-Only Admin Authorization Is Not Sufficient**

*Surface:* `apps/admin/src/App.tsx` (lines 196-210).

*Current state:* Admin access gated by client-side email/role check (`user?.primaryEmailAddress?.emailAddress === 'kurniawaniwan7906@gmail.com'` or `publicMetadata.role === 'admin'`). Purely visual — JS bundle is public.

*Enforced constraint:* Frontend bundle must not contain sensitive data or logic assuming client-side auth is sufficient. Frontend is presentation only.

*Required end state:* No sensitive data in Vite bundle. All authorization affecting data integrity must be server-side. (See also S2.)

---

**S2 — API Must Verify Admin Role Before Any D1 Write**

*Surface:* `functions/api/books/index.ts` POST handler (`handlePostBook`).

*Current state:* Verifies valid Clerk JWT but does not check admin role. Any valid Clerk user can POST to `/api/books` and overwrite book records.

*Enforced constraint:* Before any D1 write, API must verify from decoded JWT: user email matches admin email, or `publicMetadata.role === "admin"`.

*Required end state (code recommendation):* `handlePostBook` extracts `sub` from JWT, verifies admin status via `publicMetadata` or Clerk Backend API call, before executing SQL. Until implemented, all D1 write endpoints are an open risk.

---

**S3 — Hardcoded `CLOUDFLARE_ACCOUNT_ID` Must Be Removed**

*Surface:* `scripts/deploy-website.sh` (line 17: `export CLOUDFLARE_ACCOUNT_ID=1ec5420a78a852fd25bc2dd915740a71`).

*Enforced constraint:* `CLOUDFLARE_ACCOUNT_ID` must not appear as a literal in any committed file. Must be injected via CI secrets or `.gitignore`-listed `.env` file.

*Required end state:* Script references `${CLOUDFLARE_ACCOUNT_ID}` as env var. `.github/workflows/deploy.yml` already uses `${{ secrets.CLOUDFLARE_ACCOUNT_ID }}` correctly.

---

**S4 — Hardcoded Clerk Publishable Key in `shared-script-v3.js`**

*Surface:* `books/shared-script-v3.js` (line 13: hardcoded `pk_test_...`).

*Current state:* Publishable key is public by design but hardcoding creates maintenance debt (key rotation requires code change).

*Enforced constraint:* No `pk_live_...` keys committed. Recommended: inject key at build time via `VITE_CLERK_PUBLISHABLE_KEY` env var and read from `<meta name="clerk-publishable-key">` tag.

*Required end state:* `shared-script-v3.js` reads key from meta tag injected by `scripts/build.ts`. Until implemented, never commit `pk_live_...` keys.

---

**S5 — Unpinned `npx wrangler` in Deploy Script**

*Surface:* `scripts/deploy-website.sh` (lines 18 and 23: `PATH=... npx wrangler ...`).

*Current state:* `npx wrangler` fetches potentially different version each run, bypassing `bun.lock`.

*Enforced constraint:* All wrangler invocations must use lockfile-pinned version (`bun run wrangler ...` or `bunx wrangler ...`).

*Required end state (code recommendation):* Replace `npx wrangler` with `bunx wrangler` in `scripts/deploy-website.sh`.

---

**S6 — Local Deploy Bypasses CI and Peer Review**

*Surface:* `scripts/deploy-website.sh` using `--commit-dirty=true`.

*Current state:* Deploys from local working directory with uncommitted changes, bypassing PR review and GitHub Actions.

*Enforced constraint:* All production deployments must go through `.github/workflows/deploy.yml` on merge to `main`. `--commit-dirty=true` must be removed. Local execution permitted only for staging.

*Required end state:* `deploy.yml` is sole production path. Direct pushes to `main` blocked by `CODEOWNERS` + required PR review.


---

## 7. Existing Content Rules

The following rules are preserved from the original `MDBOOK_SYSTEM_RULES.md`. They remain valid and are cross-referenced to automation rules where applicable.

---

**7.1 Filter Secret / System Prompt Files (Original Phase 1, Rule 1)**

Before importing `.md` files into a book, AuthoringAgent **must** read raw content of every candidate file. If a file contains system instructions, hidden prompts, or AI detection pattern discussions, it **must be excluded** from `SUMMARY.md`. Only genuine educational content may be included. *(Cross-ref: Phase B, AuthoringAgent success gate)*

**7.2 Generate Title and Slug from Content (Original Phase 1, Rule 2)**

AuthoringAgent **must** read content to infer the actual topic, then use it as `title` in `book.toml` and folder slug under `books/`. Arbitrary or placeholder names from user filesystem are forbidden. *(Cross-ref: Phase B, R8)*

**7.3 Rename Files According to Heading (Original Phase 1, Rule 3)**

All `.md` chapter files must be in `books/<slug>/src/content/`. Filenames derived from actual heading (`#` or `##`) in first line. Placeholder names like "Part 1" forbidden. Must be prefixed with zero-padded chapter number. *(Cross-ref: Phase B, AuthoringAgent)*

**7.4 SUMMARY.md Format — No Emoji (Original Phase 1, Rule 4)**

Chapter titles in `SUMMARY.md` must be plain text. Emoji forbidden. Professional text only (e.g., "Studi Kasus" not "Studi Kasus :bulb:"). *(Cross-ref: R9)*

**7.5 book.toml Must Clone Template (Original Phase 2, Rule 1)**

Never create `book.toml` from scratch. Clone `books/_template/book.toml` (or copy from `piaget`). Ensure `additional-css` and `additional-js` directives always preserved. *(Cross-ref: R8)*

**7.6 Grid and CSS Alignment Strictness (Original Phase 2, Rule 2)**

Do not introduce CSS modifications (e.g., staggered `margin-top`) that break card alignment on Hub homepage. Always use `box-sizing: border-box` when using `height: 100%` to prevent card overlap on mobile.

**7.7 1:1 Subagent-to-File Ratio for Content Processing (Original Phase 3)**

OrchestratorAgent **must** deploy subagents in 1:1 ratio with chapter files. Each subagent handles exactly one `.md` file and applies all three content rules:

- **Rule 7.7.1 — Pronoun Rule:** Formal "Anda" is forbidden. Replace all with "kamu".
- **Rule 7.7.2 — LaTeX Rule:** Raw LaTeX MUST be converted to `\\( ... \\)` for inline and `\\[ ... \\]` (or `$$ ... $$`) for block math. You MUST use double backslashes so markdown parsers don't swallow them. *(Cross-ref: R10)*
- **Rule 7.7.3 — Humanization Rule:** Avoid AI cliches ("krusial", "signifikan", "komprehensif", "bukan sekadar X melainkan Y"). Avoid symmetrical bullet lists. Avoid "Sandwich" paragraph structure.
- **Rule 7.7.4 — Read File First Rule:** AGENTS WAJIB READ FILE FIRST ALL. Agents must read and analyze the entire file completely before processing to ensure no raw LaTeX formatting (including unformatted multi-letter variables) or structural context is missed.

**7.8 Fallback / Anti-Stuck Rule (Original Phase 4)**

If a subagent fails to respond or becomes stuck on a large file, OrchestratorAgent **must** kill it immediately. Replacement subagent launched with `write_to_file` `Overwrite: true` strategy (single-operation rewrite).

**7.9 Chapter Count from SUMMARY.md Only (Original Phase 5, Rule 1)**

`scripts/build.ts` counts `- [` lines in `SUMMARY.md`. Do not count `.md` files in directory. *(Cross-ref: R7)*

**7.10 Use Only the Official Deploy Script (Original Phase 5, Rule 2)**

Use exclusively `bash scripts/deploy-website.sh` for release. Direct manual `wrangler` commands forbidden. *(Cross-ref: R4, S6)*

---

## 8. Self-Verification Checklist

Run this checklist before declaring a new book deployment "complete". Every item is verifiable from this document alone.

```
[ ] Phase A: books/<slug>/ exists. book.toml exists. src/SUMMARY.md exists.
[ ] Phase B: book.toml contains 'mathjax-support = true'.
[ ] Phase B: book.toml contains 'additional-css' and 'additional-js' referencing shared assets.
[ ] Phase B: SUMMARY.md has at least one '- [' line.
[ ] Phase B: SUMMARY.md contains no emoji characters.
[ ] Phase B: First entry in SUMMARY.md targets a file beginning with '01'.
[ ] Phase B: icon.txt exists and contains a single emoji.
[ ] Phase C: Slug matches /^[a-zA-Z0-9_-]+$/ and does not begin with '_'. (R2)
[ ] Phase D: 'bun run scripts/check-latex-support.ts' exits 0. (R1, R10)
[ ] Phase D: 'bun run scripts/check-media-support.ts' exits 0. (R1, R11)
[ ] Phase D: No 'youtube.com/embed' in any chapter file.
[ ] Phase D: All <iframe> tags wrapped in '.embed-responsive'.
[ ] Phase E: 'bun run build' exits 0. (R1)
[ ] Phase E: output/books/<slug>/index.html exists.
[ ] Phase E: output/index.html references the new book slug.
[ ] Phase E: output/_headers exists with 'Content-Security-Policy'.
[ ] Phase E: output/_redirects exists.
[ ] Phase F: 0001_init.sql applied to dawnbook-db (idempotent). (R3)
[ ] Phase F: 'bun run scripts/migrate-to-d1.ts' exits 0. (R3)
[ ] Phase F: D1 'books' table has row with slug = '<slug>' and status = 'published'.
[ ] Phase G: 'bash scripts/test-gating.sh' exits 0 with "All tests passed!" (R5)
[ ] Phase G: 'bash scripts/test-i18n.sh' exits 0. (R12)
[ ] Phase H: 'bash scripts/deploy-website.sh' exits 0. (R4)
[ ] Phase H: Wrangler prints deployment URL.
[ ] Phase I: 'bash scripts/test-gating.sh <PRODUCTION_URL>' exits 0. (R5)
[ ] Phase I: /books/<slug>/ returns HTTP 200 on production.
[ ] Phase I: All chapters return HTTP 200 on production for SEO.
[ ] Phase I: HTML contains 'free_chapter_viewed' FOUC script.
[ ] Security: No CLOUDFLARE_ACCOUNT_ID literal in any committed file. (S3)
[ ] Security: No pk_live_... Clerk key in shared-script-v3.js. (S4)
[ ] Security: All matrix requirements map to at least one rule ID (R# or S#).
[ ] Security: No sensitive data committed in apps/admin/.env.local (or file in .gitignore). (S3)
[ ] Process: Deployment triggered via CI/CD or explicitly documented exception. (S6, R4)
```

---

## 9. Assumptions

The following could not be directly verified from repository files alone.

```
Assumption: Network access to api.cloudflare.com is required during Phases F and H.
            If the agent sandbox has no network, Phases F, H, and I must be executed
            in a network-enabled context.

Assumption: 'wrangler pages dev' is running on port 8788 when test-gating.sh is
            invoked without a BASE_URL argument (Phase G). If not available, a
            deployed preview URL must be passed as the argument.

Assumption: The Clerk JWT verification in functions/api/books/index.ts correctly
            validates token expiry (exp claim). Audited and appears correct, but
            live verification against Clerk JWKS requires network access.

Assumption: The 'mdbook' binary is available in PATH during Phase E. The repo does
            not pin a specific mdBook version; the installed binary must support
            'mathjax-support = true' in book.toml.

Assumption: 'apps/admin/.env.local' is present and contains VITE_CLERK_PUBLISHABLE_KEY
            for the admin SPA build during Phase E. If absent, the build succeeds but
            the Clerk meta tag in hub HTML will be empty.

Assumption: The GitHub Actions workflow '.github/workflows/deploy.yml' has secrets
            CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID configured in repo settings.
            Without these, the CI deploy step will fail.

## 10. Core Metadata and Gating Rules
- **Subject Labels**: Hydrated from D1 `books` table (`subject_label`). The Hub pulls this dynamically via `/api/books?content=false` to support category filtering.
- **View Count**: Tracked progressively via `POST /api/books/[slug]/view` and shown dynamically on the Hub to support 'Popular' sorting.
- **Dynamic Gating**: `functions/lib/gating.ts` considers `index.html` as the ONLY free chapter by default (mdbook maps the first chapter to index.html automatically). NEVER hardcode chapter filenames in `gating.ts`.
- **Path Gating Constraints**: `isPublicPath` must NOT contain `/admin/`. The edge middleware protects `/admin` routes.
- **Input Trust Boundaries**: All `POST /api/progress` and `POST /api/books` routes MUST implement rigid length, schema, and regex bounds-checking before D1 database binding to prevent DB bloat or SQL injection.
```
