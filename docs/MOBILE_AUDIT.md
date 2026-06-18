# Mobile Friendliness Audit

## Surfaces

| Surface | Files Inspected |
|---|---|
| 1. Hub UI | `scripts/build.ts` |
| 2. mdBook | `books/piaget/book.toml`, default theme output (`output/books/piaget/index.html`) |
| 3. Admin Dashboard | `apps/admin/index.html`, `apps/admin/src/App.tsx`, `apps/admin/src/App.css`, `apps/admin/src/index.css` |

## Findings

| Surface | File | Viewport Width | Category | Defect | Severity |
|---|---|---|---|---|---|
| Hub UI | `scripts/build.ts` | 360px | Horizontal overflow | `.book-grid` uses `minmax(320px, 1fr)` inside a container with 64px padding, causing x-axis scroll at 360px. | High |
| Hub UI | `scripts/build.ts` | 360px, 768px, 1024px | Touch ergonomics | `nav a` and `.read-btn` have `< 44px` height and lack adequate padding for mobile touch. | Medium |
| Hub UI | `scripts/build.ts` | 360px, 768px, 1024px | Readability | `nav a` and `.book-card p` have `font-size: 0.95rem` (< 16px). | Low |
| mdBook | `book.toml` | 360px, 768px, 1024px | All | No defects found. Default theme handles mobile wrapping, touch targets, and typography correctly. | N/A |
| Admin | `App.tsx` | 360px | Horizontal overflow | Input field has fixed inline `width: 300px`, main container has `padding: 2rem` (64px), resulting in 364px required space. | High |
| Admin | `App.tsx` | 360px, 768px | Horizontal overflow / Grid | `header` uses `display: flex` without wrapping, causing overflow when navigation items exceed viewport width. | High |
| Admin | `App.tsx` | 360px, 768px, 1024px | Touch ergonomics | Navigation links, buttons, select, and inputs lack adequate padding/min-height, resulting in touch targets `< 44px`. | Medium |

## Fixes

### `scripts/build.ts`
- Changed `.book-grid` to `grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));` to prevent overflow on very small viewports.
- Updated `nav a` to `font-size: 1rem; padding: 12px; display: inline-block;` to fix font size and touch targets.
- Updated `.book-card p` to `font-size: 1rem;`.
- Updated `.read-btn` to `font-size: 1rem; padding: 10px 0;`.
- Updated `@media (max-width: 768px)` queries to reduce padding on `header`, `<main>`, and `.content-section` for better readability and spacing.

### `apps/admin/src/index.css`
- Appended responsive overrides to address `header` flex wrapping (`flex-wrap: wrap; gap: 16px;`).
- Added `@media (max-width: 768px)` to change `header` to `flex-direction: column` and reduce `<main>` padding.
- Added `max-width: 100% !important;` to `input[type="text"]` and `select` to override inline fixed widths and prevent horizontal scrolling.
- Added `min-height: 44px; padding: 12px;` (or similar suitable padding/display box properties) to interactive elements (inputs, selects, buttons, header links) to ensure adequate >44px touch targets.

## Verification

- **Hub UI - Horizontal overflow**: 360px (Before: overflow, After: no overflow, Resolved: yes). 768px (Resolved: yes). 1024px (Resolved: yes).
- **Hub UI - Touch ergonomics**: 360px (Before: <44px, After: >=44px, Resolved: yes). 768px (Resolved: yes). 1024px (Resolved: yes).
- **Hub UI - Readability**: 360px (Before: <16px, After: 16px, Resolved: yes). 768px (Resolved: yes). 1024px (Resolved: yes).
- **mdBook**: 360px, 768px, 1024px (Before: No defects, After: No defects, Resolved: yes).
- **Admin - Horizontal overflow**: 360px (Before: overflow, After: no overflow, Resolved: yes). 768px (Resolved: yes). 1024px (Resolved: yes).
- **Admin - Touch ergonomics**: 360px (Before: <44px, After: >=44px, Resolved: yes). 768px (Resolved: yes). 1024px (Resolved: yes).

## Assumptions

- Assumption: Target breakpoints are 360px, 768px, 1024px.
- Assumption: Minimum touch target is 44x44 CSS pixels.
- Assumption: Minimum body font size is 16px.
- Assumption: No custom `theme/` override currently exists for mdBook; the default theme behaves responsibly on mobile without modification.
- Assumption: `apps/admin/index.html` already has a valid viewport meta tag.
- Assumption: `scripts/build.ts` already has a valid viewport meta tag.
