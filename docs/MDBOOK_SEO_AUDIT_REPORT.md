# MDBOOK_SEO_AUDIT_REPORT.md

## 1. Executive Summary

This SEO audit evaluates the Dawnbook static site build pipeline against standard technical SEO requirements and the strict public-vs-gated indexing boundary defined by the project. The primary findings indicate a systemic lack of advanced SEO signals (Canonical, OpenGraph, JSON-LD, Sitemap) and a conflict between the recently updated `functions/lib/gating.ts` (which classifies all book paths as public) and the intended gating policy for SEO protection.

**Overall Status**: 🔴 Needs Immediate Remediation

---

## 2. SEO Coverage Matrix

| Feature | Status | Source Verification | Rule ID |
|---------|--------|----------------------|---------|
| `<title>` & Meta Description | Partial | `scripts/build.ts` implements `<title>` generation, but no `<meta name="description">` is injected into mdBook generated pages. | R1 |
| Canonical tags | Missing | Neither `scripts/build.ts` nor mdBook injects `<link rel="canonical">`. | R2, S4 |
| `hreflang` locales | Missing | `en`/`id` translation exists in `functions/lib/i18n.ts`, but `<link rel="alternate" hreflang="...">` is missing. | R2, S4 |
| OpenGraph + Twitter Cards | Missing | No `<meta property="og:*">` logic found in the build step. | R6 |
| JSON-LD structured data | Missing | No schema.org markup present for Books or Articles. | R6 |
| `sitemap.xml` | Missing | No generation script or static file in `output/` found. | R3 |
| `robots.txt` | Missing | No static file in `output/` found. | R3 |
| Heading hierarchy (Single H1) | Partial | mdBook generates `<h1 class="menu-title">` globally, conflicting with page content H1s. | R5 |
| Image `alt` text | Missing | Unenforced during the markdown build. | R7 |
| Crawlable internal links | Present | mdBook natively uses `<a>` tags. | - |
| Gated content `noindex` | Partial | `output/_headers` lacks `X-Robots-Tag: noindex`. Gating policy in `lib/gating.ts` exposes all paths as public. | R4 |
| MathJax/CDN render-blocking | Present | `shared-header-v3.css` and scripts are loaded synchronously. | S3 |
| YouTube lazy-loading | Missing | `check-media-support.ts` enforces nocookie domains, but not `loading="lazy"`. | S3 |
| Core Web Vitals Risks | Partial | Render-blocking resources and non-lazy iframes present. | S3 |

---

## 3. The Gating vs. Indexability Conflict

### Anti-FOUC Hiding (`scripts/inject-gating.ts`)
The `inject-gating.ts` script inserts inline styles (`opacity: 0; visibility: hidden`) into `<head>` to prevent the "Flash of Unauthenticated Content". It also inserts `shared-script-v3.js` which verifies Clerk authentication and sets opacity to 1.
**Risk (S1)**: Search engines that execute JS will wait for the Clerk JS bundle to load. However, if they timeout or fail to load external scripts, the page remains invisible, heavily penalizing SEO. There is no `<noscript>` fallback to restore visibility for crawlers.

### Edge Caching and Vary Cookie (`functions/_middleware.ts`)
The edge middleware applies `Cache-Control: private, no-store` and `Vary: Cookie` to routes not approved by `isPublicPath()`.
**Risk (S2)**: These cache headers explicitly instruct search engines not to index or cache the payload. If public preview pages (like a shared chapter link) accidentally receive this header, they drop out of search indexes.

### Public Path Policy (`functions/lib/gating.ts`)
Currently, `isPublicPath()` ends with `return true;` accompanied by the comment: `// ALL book paths are public at the edge for SEO.`
**Discrepancy (R3, R4)**: The prompt specifies that only `01`-prefixed chapters, `index.html`, and structural pages are public paths, and that gated pages MUST be excluded from the sitemap and carry a `noindex` signal. The current repository state exposes *all* chapters to crawlers as public, contradicting the intended gating requirement of maintaining a paywall for search engines.

---

## 4. Remediation Steps

1. **Implement `check-seo.ts`**: Create a build script to validate output HTML against Rules R1-R7 before deployment.
2. **Implement `generate-sitemap.ts`**: Generate a `sitemap.xml` strictly referencing public paths and write a default `robots.txt`.
3. **Reconcile `functions/lib/gating.ts`**: Restore the logical strict boundary that separates true public preview pages (first chapter `01`, `index.html`) from gated paths, to allow proper generation of `noindex` headers.
4. **Update `scripts/build.ts`**:
   - Inject canonical and `hreflang` tags.
   - Inject OpenGraph and Twitter Card metadata.
   - Map gated paths into `output/_headers` appending `X-Robots-Tag: noindex`.
   - Implement `loading="lazy"` checks for iframes in `check-media-support.ts`.
5. **Add `<noscript>` fallbacks**: Inject `<noscript><style>html { opacity: 1 !important; visibility: visible !important; }</style></noscript>` to ensure crawlers without JS rendering can index public preview content.

---

**End of Audit Report**
