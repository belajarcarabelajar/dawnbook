# Rocket Loader: measurement detail

Moved verbatim from `GEMINI.md` on 2026-11-15, when the always-loaded instruction files were compacted under the 150k-character limit. `GEMINI.md` keeps the binding summary of each rule and points here; each heading below names the `GEMINI.md` section the text belongs to. Read this file before the work its pointer in `GEMINI.md` names. In the moved text, "this section" and "this file" mean the `GEMINI.md` section named in the heading.

## From section 26 (Cloudflare Rocket Loader and First-Paint Scripts (Measured 2026-10-16))

- **What production does:** Rocket Loader is on for the zone. It rewrites every `<script>` that lacks `data-cfasync="false"` into a deferred type and runs it after the page has painted. A local mdBook build never passes through it, so a local check cannot show this.
- **The failure it caused:** mdBook's theme bootstrap ran 450 to 1000 ms after first paint, so every book page painted the fallback theme (light, or coal on a dark OS) and then switched to the reader's theme. Readers saw it as Mermaid diagrams that did not match the theme, different on each chapter.
- **Verification:** check first-paint behaviour (theme, paywall hide and reveal, sidebar) on the live page or on a replay with the real `rocket-loader.min.js`, never only on `output/`. Judge the painted theme by the resolved `--bg` colour, not the `<html>` class: the dark-OS fallback (`html:not(.js)`) has no theme class. Harnesses: `docs/code-plan/spikes/2026-10-16-diagram-theme-contrast/` (colour probe `C10/probe-paint-bg.ts`).
