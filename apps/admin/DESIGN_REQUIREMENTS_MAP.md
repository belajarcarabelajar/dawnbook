# Design Requirements Map

This document maps each of the six source requirements to the specific file paths and code identifiers that satisfy it in this implementation.

## Requirement 1: Do not use overused font families (Inter, Roboto, Arial, or system/default font stacks)
* **File(s)**: 
  * `src/styles/typography.css`
  * `src/index.css`
* **Code Identifiers**: 
  * In `typography.css`: Explicit definitions `--font-family-display: 'Syne', sans-serif;` and `--font-family-body: 'Epilogue', sans-serif;`.
  * In `index.css`: `body` font explicitly reset to `var(--font-family-body)` and headings `h1, h2, h3...` reset to `var(--font-family-display)`, completely removing all prior references to `Roboto` or system-ui stacks.

## Requirement 2: Do not use cliched color schemes (specifically purple gradients on white or dark backgrounds)
* **File(s)**:
  * `src/styles/tokens.css`
  * `src/App.css` and `src/index.css`
* **Code Identifiers**:
  * In `tokens.css`: Definition of an Earthy Forest theme (`--color-background: #0f1714;`, `--color-primary: #4ade80;`, etc.) avoiding all purple gradients.
  * In `index.css` and `App.css`: Former purple boilerplate colors (`--accent: #aa3bff`, `--accent-bg: rgba(170, 59, 255, 0.1)`) were entirely removed and replaced with explicit CSS token references (`var(--color-background)`, etc.).

## Requirement 3: Do not use predictable layouts and component patterns or cookie-cutter design
* **File(s)**:
  * `src/components/Dashboard.css`
  * `src/App.tsx`
* **Code Identifiers**:
  * In `Dashboard.css`: `.dashboard-container` utilizing an asymmetrical column split (`grid-template-columns: 280px 1fr`), and `.main-content` layout utilizing a distinct split (`grid-template-columns: 2fr 1fr`) to avoid typical three-column hero default layouts.
  * In `App.tsx`: The `Layout` component explicitly constructs a `.floating-sidebar` beside a `.main-content` well rather than a standard top-navigation container structure.

## Requirement 4: Use unique fonts
* **File(s)**:
  * `src/styles/typography.css`
* **Code Identifiers**:
  * `@import url('https://cdn.jsdelivr.net/npm/@fontsource/syne@5.0.8/index.css');`
  * `@import url('https://cdn.jsdelivr.net/npm/@fontsource/epilogue@5.0.8/index.css');`
  * Selection of distinctive `Syne` for display and `Epilogue` for body, loaded safely and explicitly versioned via fontsource.

## Requirement 5: Use cohesive colors and themes
* **File(s)**:
  * `src/styles/tokens.css`
* **Code Identifiers**:
  * Centralized cohesive naming structure matching functional use cases: `--color-background`, `--color-surface`, `--color-primary`, `--color-secondary`, `--color-accent`, alongside standardized `--color-state-*` properties in a unified location.

## Requirement 6: Use animations for effects and micro-interactions
* **File(s)**:
  * `src/styles/tokens.css`
  * `src/components/Dashboard.css`
* **Code Identifiers**:
  * In `tokens.css`: Timing tokens defined (`--duration-fast`, `--easing-bounce`, etc.).
  * In `Dashboard.css`:
    * **Effect Animation**: `@keyframes slideUpFade` with `.main-content > *` staggered entry.
    * **Micro-interaction 1 (Button Press)**: `.btn:active { transform: scale(0.92); }`
    * **Micro-interaction 2 (Input Focus)**: `.input-field:focus { border-color: var(--color-secondary); background-color: var(--color-surface); }`
    * **Micro-interaction 3 (Card Hover)**: `.card:hover { transform: translateY(-4px) rotate(-1.5deg); }`
    * **Accessibility**: Respects users with a dedicated `@media (prefers-reduced-motion: reduce)` block nullifying all animations/transitions.
