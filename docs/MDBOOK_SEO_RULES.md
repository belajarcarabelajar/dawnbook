# MDBOOK_SEO_RULES.md

## 1. Scope and Terminology

### 1.1 Scope
These rules govern the complete lifecycle of a book in the Dawnbook monorepo specifically concerning Search Engine Optimization (SEO) correctness, indexability, and crawler behavior. They apply to AI subagents, human contributors, and CI/CD systems.

### 1.2 Terminology
The following terms are canonical. Do not introduce synonyms:
- **phase**: A discrete, ordered step in the A–Z pipeline (labelled A through H).
- **subagent**: An autonomous AI process with a single responsibility, bounded scope, and a defined success gate.
- **success gate**: The specific, verifiable condition that must be true for a phase to be considered complete and for the next phase to begin.
- **OrchestratorAgent**: The top-level subagent that sequences all other subagents and enforces success gates.
- **ScaffoldAgent**: Subagent responsible for Phase A (scaffold).
- **MetadataAgent**: Subagent responsible for Phase B (author content and SEO metadata).
- **BuildAgent**: Subagent responsible for Phase C (compile HTML and SEO tags).
- **SitemapAgent**: Subagent responsible for Phase D (generate sitemap.xml and robots.txt).
- **SeoValidationAgent**: Subagent responsible for Phase E (validate SEO).
- **HeadersAgent**: Subagent responsible for Phase F (configure _headers and _redirects).
- **DeployAgent**: Subagent responsible for Phase G (deploy).
- **SeoVerifyAgent**: Subagent responsible for Phase H (post-deploy verification).

## 2. Tech Stack and Fixed Commands

- **Runtime**: Bun v1.2+
- **Generator**: mdBook
- **Hosting**: Cloudflare Pages + Pages Functions (TypeScript)
- **Database**: Cloudflare D1 SQLite (`dawnbook-db`)
- **Auth**: Self-hosted (Cloudflare D1 `users` + `sessions` tables, Google OAuth via `/api/auth/*` endpoints, `session_id` HttpOnly cookie)
- **Build Entrypoint**: `scripts/build.ts` (`bun run build`)
- **Deploy Entrypoint**: `scripts/deploy-website.sh`

## 3. Indexing Policy (100% SEO Indexability & GEO Strategy)

Dawnbook's architecture employs a 100% SEO Indexability & Generative Engine Optimization (GEO) policy to maximize search engine reach and AI discovery:

- **Public Content Paths**: Hub pages (`/`, `about.html`, `contribute.html`), all book roots, and ALL 440+ book chapters (`/books/<slug>/*`) MUST be fully indexable by search engines (HTTP 200 at the edge, no 302 redirects, no `noindex` headers) and MUST be included in `sitemap.xml` and `/llms.txt`.
- **Confidential / Admin Paths**: `/admin` and `/admin/*` SPA routes are strictly confidential, excluded from `sitemap.xml`, and carry `X-Robots-Tag: noindex, nofollow` with `Cache-Control: private, no-store`.
- **AI Search & GEO Support**: AI crawlers (`GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`) are explicitly allowed in `robots.txt`, and an automated Markdown catalog is generated at `/llms.txt`.
- **Policy Enforcement**: `functions/lib/gating.ts` is the single source of truth for resolving edge public paths.

## 4. New Book A–Z SEO Pipeline (Phases A–H)

### Phase A: Scaffold from Template
**Trigger command:** `cp -r books/_template books/<slug>`
Creates the base structure.

### Phase B: Author Content & Metadata
**Trigger command:** (Executed via MetadataAgent)
Populate `book.toml`, `SUMMARY.md`, and chapters. Ensure all chapters have unique titles, descriptions, and correctly formatted content.

### Phase C: Generate Per-Page SEO Tags
**Trigger command:** `bun run build`
Executes `scripts/build.ts` which must be updated to inject `<title>`, `<meta name="description">`, `<link rel="canonical">`, `<link rel="alternate" hreflang="...">`, OpenGraph, Twitter Cards, and JSON-LD structured data into the generated HTML.

### Phase D: Generate Sitemap and Robots
**Trigger command:** `bun run scripts/generate-sitemap.ts` (Assumption: script to be created)
Generates `output/sitemap.xml` containing only public URLs, and `output/robots.txt`.

### Phase E: Validate SEO
**Trigger command:** `bun run scripts/check-seo.ts` (Assumption: script to be created)
Scans `output/**/*.html` and `output/sitemap.xml` for missing tags, broken links, and SEO violations.

### Phase F: Configure Headers and Redirects
**Trigger command:** (Executed via HeadersAgent during build pipeline)
Writes `output/_headers` to append `X-Robots-Tag: noindex` to gated paths.

### Phase G: Deploy
**Trigger command:** `bash scripts/deploy-website.sh`
Pushes the output to Cloudflare Pages.

### Phase H: Post-Deploy SEO Verification
**Trigger command:** `bash scripts/check-seo-live.sh https://dawnbook.belajarcarabelajar.com`
Verifies live HTTP headers, `noindex` presence, and canonical tags against the production URL.

## 5. Subagent Orchestration Model

### OrchestratorAgent
**Inputs:** Book slug, content, metadata.
**Scope:** Orchestrates phases A–H sequentially. Enforces success gates.
**Success gate:** Phase H completes successfully.
**Failure/rollback:** Halts pipeline immediately upon any subagent failure and requests human intervention.

### ScaffoldAgent
**Inputs:** Validated slug string.
**Scope:** Read `books/_template/**`. Write `books/<slug>/**`.
**Output:** Scaffolded book directory.
**Success gate:** `book.toml` contains `title`, `authors`, and mandatory `description` (100–160 chars), and `SUMMARY.md` exists.
**Failure/rollback:** Delete `books/<slug>` and halt.

### MetadataAgent
**Inputs:** Book slug, chapter text, author details.
**Scope:** Write `books/<slug>/**`.
**Output:** Populated `.md` files and `book.toml`.
**Success gate:** All chapters have H1 titles and SEO metadata definitions.
**Failure/rollback:** Halt and request content fixes.

### BuildAgent
**Inputs:** All book files.
**Scope:** Execute `bun run build`. Write `output/**`.
**Output:** Generated HTML with injected SEO tags.
**Success gate:** Exit code 0, HTML files exist.
**Failure/rollback:** Halt and print build error.

### SitemapAgent
**Inputs:** `output/books/` and `functions/lib/gating.ts`.
**Scope:** Read `output/**`. Write `output/sitemap.xml`, `output/robots.txt`.
**Output:** Valid `sitemap.xml` and `robots.txt`.
**Success gate:** Files exist in `output/` and `sitemap.xml` contains >0 URLs.
**Failure/rollback:** Halt and log error.

### SeoValidationAgent
**Inputs:** `output/**`.
**Scope:** Execute `bun run scripts/check-seo.ts`.
**Output:** Validation report.
**Success gate:** Exit code 0.
**Failure/rollback:** Halt and print SEO violations.

### HeadersAgent
**Inputs:** `functions/lib/gating.ts`.
**Scope:** Write `output/_headers`, `output/_redirects`.
**Output:** Configured Cloudflare routing and header rules.
**Success gate:** `X-Robots-Tag: noindex` correctly mapped to gated paths in `_headers`.
**Failure/rollback:** Halt and log error.

### DeployAgent
**Inputs:** `output/**`.
**Scope:** Execute `bash scripts/deploy-website.sh`.
**Output:** Deployment URL.
**Success gate:** Exit code 0.
**Failure/rollback:** Rollback via Cloudflare Pages dashboard.

### SeoVerifyAgent
**Inputs:** Production deployment URL.
**Scope:** Execute `bash scripts/check-seo-live.sh <URL>`.
**Output:** Live verification report.
**Success gate:** Exit code 0 (live headers match expectations).
**Failure/rollback:** Triage before next deploy; rollback via Cloudflare dashboard if catastrophic.

## 6. SEO Automation Rules

**R1 — Required Title and Meta Description**
- **Statement:** Every public HTML page MUST have a unique non-empty `<title>` and `<meta name="description">`.
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Exits code 0; script verifies no public HTML lacks these tags.

**R2 — Canonical and Hreflang Tags**
- **Statement:** Every public page MUST emit a self-referencing canonical link and reciprocal `hreflang` for `en` and `id` locales.
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Exits code 0; script verifies `<link rel="canonical">` and `<link rel="alternate" hreflang="...">` exist on all public pages.

**R3 — Sitemap & LLMs.txt Generation**
- **Statement:** `sitemap.xml` MUST list 100% of public content URLs and book chapters, while excluding confidential admin paths (`/admin`). An `/llms.txt` file MUST be generated to provide AI crawlers with a Markdown catalog.
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Exits code 0; script verifies `sitemap.xml` contains all content paths and `/llms.txt` is present.

**R4 — Confidential Path Exclusion & Content Indexability**
- **Statement:** Confidential paths (`/admin`, `/admin/*`) MUST carry `X-Robots-Tag: noindex, nofollow` in `_headers` and MUST NOT appear in `sitemap.xml`. Conversely, NO book content page may carry a `noindex` signal.
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Exits code 0; script verifies `/admin/*` is noindexed while all book content paths are indexable.

**R5 — SEO Build Validation**
- **Statement:** A runnable SEO check script MUST scan `output/**/*.html` and exit non-zero on any violation of rules R1-R4.
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Script exits 0 when valid, exits >0 when an SEO violation is introduced.

**R6 — Structured Data**
- **Statement:** Every public page MUST include JSON-LD structured data appropriate to its type (Book, Article, or BreadcrumbList).
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Script verifies `<script type="application/ld+json">` presence.

**R7 — Image Alt Text Enforcement**
- **Statement:** Every `<img>` tag in the rendered output MUST possess a descriptive `alt` attribute.
- **Command:** `bun run scripts/check-seo.ts`
- **Acceptance Check:** Script fails if `img:not([alt])` or `img[alt=""]` is found in public HTML.

**R8 — Mandatory References Chapter**
- **Statement:** Every book MUST include a dedicated references/bibliography chapter (`referensi.md`) containing academic literature and citations relevant to the book's discipline, registered in `SUMMARY.md`.
- **Command:** `bun run build`
- **Acceptance Check:** AuthoringAgent and BuildAgent verify that `SUMMARY.md` contains a link to `referensi.md`.

**R9 — Newest-First Homepage Default Sorting**
- **Statement:** `scripts/build.ts` MUST sort book cards in static HTML newest-first using creation/git-commit timestamps (`b.mtimeMs - a.mtimeMs`) and embed `data-created-at="${timestamp}"` on every `.book-card` element, ensuring newly added books appear at the top of the homepage grid by default both before and after JS hydration.
- **Command:** `bun run build`
- **Acceptance Check:** `output/index.html` renders the most recently added/updated book as the first card (`Card #1`).

## 7. SEO Risk Rules

**S1 — Anti-FOUC Crawler Invisibility**
- **Statement:** Client-only rendered content hidden by anti-FOUC may be invisible to non-executing crawlers.
- **Required End State:** Anti-FOUC scripts (`opacity: 0`) must ONLY evaluate client-side states (like `sessionStorage`) and must immediately restore visibility if JS execution halts. Public preview pages must never receive synchronous `opacity: 0` without a fallback `<noscript>` tag that restores visibility.

**S2 — Cache-Control Indexing Prevention**
- **Statement:** `no-store` and `private` headers prevent caching and indexing of gated assets by downstream CDNs and bots.
- **Required End State:** `functions/_middleware.ts` must apply `Cache-Control: private, no-store` ONLY to gated routes. Public paths must retain public cacheability to ensure crawlers index them rapidly and efficiently.

**S3 — Render-Blocking Assets Degrading CWV**
- **Statement:** Render-blocking MathJax/CDN scripts and non-lazy YouTube iframes degrade Core Web Vitals (LCP, CLS, FID).
- **Required End State:** External scripts (MathJax) must use `async` or `defer`. YouTube `<iframe>` elements must include `loading="lazy"`.

**S4 — Missing Localization Signals**
- **Statement:** Missing canonical and `hreflang` tags causes duplicate-content penalties and locale confusion across `en`/`id`.
- **Required End State:** Exact locale mappings must be declared in `<head>` so Google correctly serves `id` to Indonesian users and `en` to others without algorithmic guessing.

## 8. Self-Verification Checklist

```markdown
[ ] Phase A scaffold generated successfully.
[ ] Phase B metadata applied (H1, title, mandatory `description` in `book.toml`, referensi.md present).
[ ] Phase C build succeeded.
[ ] Phase D sitemap.xml generated and valid.
[ ] Phase E validation script exists and passes.
[ ] Phase F _headers configured.
[ ] Phase G deploy script succeeds.
[ ] Phase H post-deploy verification passes.
[ ] R1: Public pages have title and meta description.
[ ] R2: Canonical and hreflang tags present.
[ ] R3: sitemap.xml strictly excludes gated paths.
[ ] R4: Gated paths have 'noindex' signals.
[ ] R5: check-seo.ts executes and passes.
[ ] R6: JSON-LD structured data is present.
[ ] R7: All images have alt text.
[ ] R8: Book contains referensi.md in SUMMARY.md.
[ ] R9: Newest-first default sorting places newly added book at top of homepage grid.
[ ] S1: Anti-FOUC logic avoids blinding non-JS crawlers.
[ ] S2: Cache-Control differentiates public/gated cleanly.
[ ] S3: External media uses async/defer and lazy loading.
[ ] S4: Localization signals resolve duplicate content risks.
```


## 9. Assumptions

- `Assumption:` Network access to external APIs (Cloudflare) is available for deploy and live verification checks. If disabled in the sandbox, these phases are describe-only.
- `Assumption:` `bun run scripts/generate-sitemap.ts` does not yet exist and is a proposed addition.
- `Assumption:` `bun run scripts/check-seo.ts` does not yet exist and is a proposed addition.
- `Assumption:` `bash scripts/check-seo-live.sh` does not yet exist and is a proposed addition.
