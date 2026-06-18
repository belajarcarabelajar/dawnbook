# Navigation Audit Report

## 1. Scope and Method
This report evaluates the website navigation architecture, link integrity, and WCAG accessibility of the Dawnbook platform across three primary surfaces. The audit was conducted using the following methods:
- **HUB Surface:** Audited via the source HTML templates in `scripts/build.ts` and the generated outputs in `output/index.html`.
- **BOOK Surface:** Audited via the generated static HTML in `output/books/piaget/index.html` and the table-of-contents definition in `books/piaget/src/SUMMARY.md`.
- **ADMIN Surface:** Audited via the `react-router-dom` routing definitions in `apps/admin/src/App.tsx` and the SPA fallback routing in `scripts/build.ts`.

## 2. Navigation Link Inventory
The following table details every identified internal and external navigation route across the surfaces:

| Label | Destination | Source Path | Line | Scope |
|-------|-------------|-------------|------|-------|
| Dawnbook (Logo) | `/` | `scripts/build.ts` | 126 | Intra-surface |
| Home | `/` | `scripts/build.ts` | 129 | Intra-surface |
| About | `/about.html` | `scripts/build.ts` | 130 | Intra-surface |
| Contribute | `/contribute.html` | `scripts/build.ts` | 131 | Intra-surface |
| Admin Portal | `/admin` | `scripts/build.ts` | 132 | Cross-surface |
| Book Title | `/books/<slug>/` | `scripts/build.ts` | 151 | Cross-surface |
| View on GitHub | `https://github.com/belajarcarabelajar/dawnbook` | `scripts/build.ts` | 172 | External |
| Chapter links | `.md` files | `books/piaget/src/SUMMARY.md` | 3-14 | Intra-surface |
| Dashboard | `/` (resolved to `/admin/`) | `apps/admin/src/App.tsx` | 55 | Intra-surface |
| Manage Books | `/books` (resolved to `/admin/books`) | `apps/admin/src/App.tsx` | 56 | Intra-surface |
| Markdown Editor | `/editor` (resolved to `/admin/editor`) | `apps/admin/src/App.tsx` | 57 | Intra-surface |

## 3. Findings

### HUB Surface

**ID:** F-HUB-001
**Surface:** HUB
**Criterion:** N8 (Keyboard and accessibility)
**Severity:** Medium
**Evidence:** `scripts/build.ts:128`
**Description:** The primary navigation uses a generic `<div>` container instead of a semantic `<nav>` landmark role, and there is no skip-to-content link provided for keyboard accessibility.
**Recommendation:** Change `<div class="nav-links">` to `<nav class="nav-links" aria-label="Main Navigation">` and implement a skip-to-content link pointing to the main content area.

**ID:** F-HUB-002
**Surface:** HUB
**Criterion:** N4 (Wayfinding and current-state indication)
**Severity:** Medium
**Evidence:** `scripts/build.ts:129`
**Description:** Active navigation links are highlighted visually using the `active` CSS class but lack the semantic `aria-current="page"` attribute, failing to communicate the current state to assistive technologies.
**Recommendation:** Conditionally inject `aria-current="page"` into the `<a>` tag when the route matches the currently active page.

### BOOK Surface

**ID:** F-BOOK-001
**Surface:** BOOK
**Criterion:** N5 (Cross-surface navigation)
**Severity:** High
**Evidence:** `output/books/piaget/index.html:121`
**Description:** The generated mdBook surface lacks a cross-surface 'Back to Hub' link, trapping users within the book reading experience with no obvious way to return to the primary Dawnbook directory.
**Recommendation:** Inject a standard 'Back to Hub' hyperlink pointing to `/` within the mdBook header menu bar via custom theme templates or JS injection.

### ADMIN Surface

**ID:** F-ADMIN-001
**Surface:** ADMIN
**Criterion:** N5 (Cross-surface navigation)
**Severity:** High
**Evidence:** `apps/admin/src/App.tsx:55`
**Description:** All navigation links within the Admin sidebar are scoped to the React Router basename (`/admin`). There is no mechanism or standard link to return to the public HUB site.
**Recommendation:** Add a native HTML `<a>` element (e.g., `<a href="/">Return to Hub</a>`) in the Admin sidebar to facilitate seamless cross-surface navigation.

**ID:** F-ADMIN-002
**Surface:** ADMIN
**Criterion:** N4 (Wayfinding and current-state indication)
**Severity:** Medium
**Evidence:** `apps/admin/src/App.tsx:55-57`
**Description:** The React Router `<Link>` components in the Admin sidebar do not display an active state. Users cannot easily identify which sub-page they are currently viewing.
**Recommendation:** Replace `<Link>` with the `<NavLink>` component from `react-router-dom` to automatically apply the `active` class and `aria-current` attribute based on the active route.

**ID:** F-ADMIN-003
**Surface:** ADMIN
**Criterion:** N6 (SPA routing and deep-linking)
**Severity:** Medium
**Evidence:** `apps/admin/src/App.tsx:195-200`
**Description:** The `<Routes>` configuration does not include a fallback route for unmatched URL paths, causing unknown routes to render a blank main area instead of a defined 404 Not Found state.
**Recommendation:** Add a wildcard route `<Route path="*" element={<NotFound />} />` at the end of the `<Routes>` block.

## 4. Broken-Link and Routing Report
- **N1 Failures (Broken Links):** No failures. All internal links identified in the navigation inventory resolve to existing valid endpoints within the codebase.
- **N6 Failures (SPA Routing):** 
  - **Unknown Route Fallback:** Unmatched SPA routes inside `/admin/*` fallback to a blank component display due to the absence of a `path="*"` wildcard route in React Router.
  - **Cloudflare Redirects:** The `_redirects` rule correctly passes all `/admin/*` traffic to `/admin/index.html` preventing 404 server errors on refresh.

## 5. Prioritized Remediation List
1. **F-BOOK-001 (High):** Inject a "Back to Hub" link into the BOOK surface.
2. **F-ADMIN-001 (High):** Provide a native `href="/"` link in the ADMIN portal to return to the HUB.
3. **F-HUB-001 (Medium):** Add `<nav>` landmarks and a skip-to-content link to the HUB.
4. **F-HUB-002 (Medium):** Apply `aria-current="page"` to active links in the HUB.
5. **F-ADMIN-002 (Medium):** Refactor `<Link>` to `<NavLink>` in ADMIN for active state indication.
6. **F-ADMIN-003 (Medium):** Add a 404 wildcard route to the React Router configuration in ADMIN.

## 6. Coverage Statement
The following matrix confirms that every surface has been thoroughly evaluated against the nine navigation criteria:

| Criterion | HUB | BOOK | ADMIN |
|-----------|-----|------|-------|
| N1 Link integrity | PASS | PASS | PASS |
| N2 Information architecture | PASS | PASS | PASS |
| N3 Primary-navigation | PASS | PASS | PASS |
| N4 Wayfinding | FAIL (F-HUB-002) | PASS | FAIL (F-ADMIN-002) |
| N5 Cross-surface | PASS | FAIL (F-BOOK-001) | FAIL (F-ADMIN-001) |
| N6 SPA routing | N/A | N/A | FAIL (F-ADMIN-003) |
| N7 Responsive (Assumption: 360/768/1280px) | PASS | PASS | PASS |
| N8 Keyboard/Accessibility | FAIL (F-HUB-001) | PASS | PASS |
| N9 Terminology consistency | PASS | PASS | PASS |
