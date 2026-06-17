## 1. Scope and Method
- **HUB**: Evaluated using **built output** logic and templates inspected via source `scripts/build.ts` and styling via `apps/hub/src/styles/tokens.css`.
- **BOOK**: Evaluated using **built output** and source inference via `books/shared-header.css`.
- **ADMIN**: Evaluated using **source inference** of the React/Vite implementation in `apps/admin/src/App.tsx`.

## 2. Implementation Map
- **localStorage Key**: `theme` (primary), `mdbook-theme` (secondary sync). Found at `scripts/build.ts:73` and `apps/admin/src/App.tsx:11`.
- **Value Schema**: `'light'` or `'dark'` (for `theme`), `'light'` or `'coal'` (for `mdbook-theme`).
- **Applied DOM Attribute**: `data-theme` set on `document.documentElement` (`<html>`). Found at `scripts/build.ts:85` and `apps/admin/src/App.tsx:22`.
- **Event Handling**: `window.addEventListener('storage', ...)` used to capture cross-tab changes to `mdbook-theme`. Found at `scripts/build.ts:92` and `apps/admin/src/App.tsx:26`. *(Assumption: prefers-color-scheme event handling is completely absent).*

## 3. Per-Theme Token Table
*(All color tokens defined in `tokens.css`)*

| Token | Light Value | Dark Value | Status |
|---|---|---|---|
| `--color-background` | `#ffffff` | `#000000` | Defined |
| `--color-surface` | `#f5f5f5` | `#111111` | Defined |
| `--color-primary` | `#000000` | `#ffffff` | Defined |
| `--color-secondary` | `#333333` | `#e5e5e5` | Defined |
| `--color-accent` | `#000000` | `#ffffff` | Defined |
| `--color-text` | `#000000` | `#ffffff` | Defined |
| `--color-text-muted` | `#666666` | `#9e9e9e` | Defined |
| `--color-state-success` | `#000000` | `#ffffff` | Defined |
| `--color-state-warning` | `#666666` | `#a3a3a3` | Defined |
| `--color-state-error` | `#333333` | `#888888` | Defined |
| `--color-state-info` | `#111111` | `#d4d4d4` | Defined |

## 4. Findings

### HUB
**ID:** F-HUB-001
**Surface:** HUB
**Criterion:** T6
**Severity:** Low
**Evidence:** `scripts/build.ts:83`
**Expected:** The system preference (`prefers-color-scheme`) should serve as the default theme if no value is stored in `localStorage`.
**Actual:** The theme aggressively defaults to `'dark'` if `localStorage` is empty, completely ignoring the user's OS-level preferences.
**Recommendation:** Add a check for `window.matchMedia('(prefers-color-scheme: light)').matches` when establishing the fallback default theme.

**ID:** F-HUB-002
**Surface:** HUB
**Criterion:** T8
**Severity:** Medium
**Evidence:** `scripts/build.ts:111`
**Expected:** The toggle control should communicate its current state to assistive technologies.
**Actual:** The `<button>` lacks any ARIA state attributes (like `aria-pressed`), leaving screen reader users unaware of the toggle's current status.
**Recommendation:** Dynamically toggle `aria-pressed="true/false"` on the button via JavaScript whenever the theme state changes.

**ID:** F-HUB-003
**Surface:** HUB
**Criterion:** T9
**Severity:** High
**Evidence:** `scripts/build.ts:72`
**Expected:** Accessing `localStorage` should be wrapped in a `try/catch` block to handle environments where storage access is blocked or denied.
**Actual:** Unprotected calls to `localStorage.getItem` will throw a synchronous `SecurityError` if storage is denied, halting further script execution.
**Recommendation:** Wrap all `localStorage` reads and writes in `try/catch` blocks and fallback gracefully to default behaviors without throwing.

### BOOK
**ID:** F-BOOK-001
**Surface:** BOOK
**Criterion:** T2
**Severity:** High
**Evidence:** `books/shared-header.css:48`
**Expected:** Activating the mdBook theme toggle should change the visual theme variables by resolving the correct Dawnbook design tokens.
**Actual:** mdBook's built-in toggle applies a class to `<html>` (e.g., `class="light"`), but Dawnbook's `tokens.css` relies strictly on `[data-theme='light']`. Thus, `var(--color-background)` and other tokens remain stuck in Dark mode.
**Recommendation:** Update `apps/hub/src/styles/tokens.css` to also match mdBook's specific classes (e.g., `:root.light`) alongside `[data-theme='light']`.

### ADMIN
**ID:** F-ADMIN-001
**Surface:** ADMIN
**Criterion:** T5
**Severity:** Medium
**Evidence:** `apps/admin/src/App.tsx:10`
**Expected:** The saved theme should be applied before the first paint to prevent a Flash of Incorrect Theme (FOIT/FOUC).
**Actual:** The theme retrieval logic is inside a React `useEffect` hook, which runs after the initial render. This causes a visible flash of the default Dark theme before switching to Light theme.
**Recommendation:** Move the initial `localStorage` read and `data-theme` application to an inline synchronous script in `apps/admin/index.html` before the React root mounts.

## 5. Prioritized Remediation List
1. **F-HUB-003** (High) - Wrap localStorage interactions in `try/catch` to prevent fatal blocking errors.
2. **F-BOOK-001** (High) - Map mdBook classes (`.light`) to Dawnbook tokens to fix broken visual synchronization in the Book surface.
3. **F-ADMIN-001** (Medium) - Mitigate FOUC in Admin by lifting theme initialization out of React hooks and into `<head>`.
4. **F-HUB-002** (Medium) - Implement `aria-pressed` state updates for the toggle buttons.
5. **F-HUB-001** (Low) - Respect OS `prefers-color-scheme` preferences for first-time visitors.

## 6. Coverage Statement
*(Assumption: Evaluation covered all defined surfaces and criteria using the prompt constraints).*

| Surface | T1 Presence | T2 Switch | T3 Persistence | T4 Sync | T5 FOIT | T6 Prefs | T7 Tokens | T8 A11y | T9 Robustness |
|---|---|---|---|---|---|---|---|---|---|
| **HUB** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **BOOK** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
| **ADMIN** | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated | Evaluated |
