# Design Requirements Map

This document maps each of the six source requirements to the specific file paths and code identifiers that satisfy it across both the Admin App and the Hub Site.

## Requirement 1: Do not use overused font families (Inter, Roboto, Arial, or system/default font stacks)
* **File(s)**: 
  * `apps/admin/src/styles/typography.css` & `apps/admin/src/index.css`
  * `apps/hub/src/styles/typography.css` & `scripts/build.ts`
* **Code Identifiers**: 
  * In Admin: Explicit definitions `--font-family-display: 'Syne', sans-serif;` and `--font-family-body: 'Epilogue', sans-serif;`.
  * In Hub: `--font-family-display: 'Cinzel', serif;` and `--font-family-body: 'Chivo', sans-serif;`.
  * In `scripts/build.ts`: Removed all `<link>` tags and inline CSS referencing `Inter` or `Outfit` from the Hub HTML generation.

## Requirement 2: Do not use cliched color schemes (specifically purple gradients on white or dark backgrounds)
* **File(s)**:
  * `apps/admin/src/styles/tokens.css` & `apps/admin/src/App.css`
  * `apps/hub/src/styles/tokens.css` & `scripts/build.ts`
* **Code Identifiers**:
  * In Admin `tokens.css`: Definition of an Earthy Forest theme (`--color-background: #0f1714;`, `--color-primary: #4ade80;`, etc.) avoiding all purple gradients.
  * In Hub `tokens.css`: Definition of an Ocean Midnight theme (`--color-background: #020617;`, `--color-primary: #38bdf8;`) avoiding glow effects and standard cliches.
  * In `scripts/build.ts`: Removed all inline blue/purple glow logic (`--accent-glow`).

## Requirement 3: Do not use predictable layouts and component patterns or cookie-cutter design
* **File(s)**:
  * `apps/admin/src/components/Dashboard.css` & `apps/admin/src/App.tsx`
  * `apps/hub/src/components/HubLayout.css` & `scripts/build.ts`
* **Code Identifiers**:
  * In Admin `Dashboard.css`: `.dashboard-container` utilizing an asymmetrical column split (`grid-template-columns: 280px 1fr`).
  * In Hub `HubLayout.css`: The `.hub-layout` forces an asymmetrical sticky left-side navigation (`grid-template-columns: 350px 1fr`) contrasting with the previous centered `.hero` template.
  * In `scripts/build.ts`: The HTML shell was fully rewritten to mount `<aside class="side-nav">` alongside `<main class="hub-main">`.

## Requirement 4: Use unique fonts
* **File(s)**:
  * `apps/admin/src/styles/typography.css`
  * `apps/hub/src/styles/typography.css`
* **Code Identifiers**:
  * `@import url('https://cdn.jsdelivr.net/npm/@fontsource/syne@5.0.8/index.css');`
  * `@import url('https://cdn.jsdelivr.net/npm/@fontsource/epilogue@5.0.8/index.css');`
  * `@import url('https://cdn.jsdelivr.net/npm/@fontsource/cinzel@5.0.8/index.css');`
  * `@import url('https://cdn.jsdelivr.net/npm/@fontsource/chivo@5.0.8/index.css');`

## Requirement 5: Use cohesive colors and themes
* **File(s)**:
  * `apps/admin/src/styles/tokens.css`
  * `apps/hub/src/styles/tokens.css`
* **Code Identifiers**:
  * Centralized cohesive naming structure matching functional use cases: `--color-background`, `--color-surface`, `--color-primary`, `--color-secondary`, `--color-accent`, alongside standardized `--color-state-*` properties in unified, independent locations for both zones.

## Requirement 6: Use animations for effects and micro-interactions
* **File(s)**:
  * `apps/admin/src/styles/tokens.css` & `apps/admin/src/components/Dashboard.css`
  * `apps/hub/src/styles/tokens.css` & `apps/hub/src/components/HubLayout.css`
* **Code Identifiers**:
  * **Effect Animation (Hub)**: `@keyframes fadeSlideRight` generating a staggered horizontal entry for the main titles, and `@keyframes fadeSlideUp` for the `.book-card` elements.
  * **Micro-interaction 1 (Link Hover)**: `.nav-links a:hover { transform: translateX(10px); }`
  * **Micro-interaction 2 (Button Press)**: `.btn-primary:active { transform: scale(0.92); }`
  * **Micro-interaction 3 (Card Hover)**: `.book-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 15px 30px rgba(0,0,0,0.4); border-color: var(--color-primary); }`
  * **Accessibility**: Both Admin and Hub systems respect users with a dedicated `@media (prefers-reduced-motion: reduce)` block nullifying all animations/transitions.
