# Spike: diagram theme contrast and first-paint theme (2026-10-16)

Harnesses from the investigation in `docs/code-plan/artifacts/2026-10-16-dawnbook-diagram-theme-contrast-debugging-log.md`. All run with Bun and the Chrome headless shell under `~/.cache/puppeteer/`; none is part of the build or of `bun test`.

| Path | Measures | Known limits |
|---|---|---|
| `probe.ts` | label contrast of every cached SVG in the five themes, static page | counts the fill of `<line>` elements as background, which produced two false failures on a quadrantChart; use `C8/probe-paint-aware.ts --paint-aware` |
| `probe-theme-paint.ts` | theme class on `<html>` at first contentful paint | judges by class name only, so it cannot see the coal `html:not(.js)` fallback on a dark OS; use a colour probe for that. Before 2026-10-16 it also missed the parse-time class (fixed with `childList`) |
| `C1/probe-paint-bg.ts`, `C10/probe-paint-bg.ts` | resolved `--bg` at first paint; C10 supports `--theme none` | C1 needs `--expect-bg` |
| `C1/`, `C10/`, `V1/` | live-page replay with the real Rocket Loader, simulated Rocket Loader, fixed-vs-control end to end | replay assets live in `/tmp` and must be re-fetched |
| `C2/`, `C3/` | late theme switch versus fresh render in Chromium and WPE WebKit | software rendering; iOS Safari not covered |
| `C7/`, `C8/` | real chapter cascade; unthemed SVG elements | built on the older local `output/` build |
