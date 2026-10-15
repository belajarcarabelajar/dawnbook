# Research notes: build-time Mermaid diagrams for Dawnbook

Session `dawnbook-mermaid-diagrams`, gathered 2026-10-16 by chunks R1-R10 (read-only subagents) and re-checked by the parent where marked. Web facts were retrieved with TinyFish `search` and `fetch_content` on 2026-10-16.

## Build pipeline (R1, repository facts)

- `bun run build` runs `scripts/build.ts`. `buildAllBooks` (`scripts/builder/mdbook-runner.ts`) runs `sync-template.ts`, then `check-media-support.ts`, then per book copies `books/<slug>/*` to `.build-tmp/<slug>/` (`prepareBookForMdbook`, lines 6-24) and runs `mdbook build .build-tmp/<slug> -d output/books/<slug>` (line 70). Parent re-read these lines on 2026-10-16.
- `.build-tmp/` is gitignored (`.gitignore:10`), so a Markdown rewrite inside the copy step never touches the source tree. The removed `$ ... $` pre-pass (commit `a8dbd19`, removed in `b3476ee` on 2026-07-31) used exactly this spot. GEMINI.md section 9 item 1 still describes that removed pre-pass.
- After all books: hub pages, `copyAssets`, `inject-gating.ts` (rewrites every built HTML file), `_headers`, the heading gate (`check-heading-colons`, `check-repeated-headings`, exit 1 on failure), sitemap, `llms.txt`, `check-seo`.
- `[preprocessor.dawnbook]` has no implementation anywhere (no binary, not on crates.io). It only carries `subject_label`, read by `migrate-to-d1.ts:36`. It sits in the per-book part of `book.toml` that sync never touches, so it is not a usable hook.
- `sync-template.ts` replaces everything from `[output.html.print]` to the end of each `book.toml`, and copies `head.hbs`, `favicon.png`, `favicon.svg` into each `books/<slug>/theme/`. Shared CSS and JS reach every book through `books/shared-header.css` and `books/shared-script.js`.
- CI runs the full build: `.github/workflows/deploy.yml` on every push to `main` (ubuntu-latest, mdBook v0.5.3 pinned, then `bun run build`, then Pages deploy), and `.github/workflows/test.yml` on pull requests (`bun run build`, then `bun test`). Parent re-read `deploy.yml` on 2026-10-16. A renderer that needs Chromium at build time would therefore need Chromium on the CI runner too.
- mdBook theme classes on `<html>`: `light`, `rust` (light backgrounds) and `coal`, `navy`, `ayu` (dark). No-JS readers follow `prefers-color-scheme` through `html:not(.js)` rules in mdBook's `variables.css`.
- No book has any image, any non-`.md` file under `src/`, or any ```mermaid block today.

## Content gates and consumers (R3, repository facts)

- `check-heading-colons.ts` and `check-repeated-headings.ts` (build gates) skip fenced lines, so a ```mermaid block causes no false positive.
- `check-book-structure.ts` (run by per-book tests) scans every line, fenced or not, for em dash, emoji and `\bAnda\b`. Mermaid labels reach the reader, so that behaviour is wanted.
- `detect-emojis.ts` has no fence handling and its clean mode rewrites lines inside fences.
- `check-latex-support.ts` scans math delimiters across fences, so a label with two `$` signs on one line could be parsed as math.
- `inject-gating.ts` `extractLeadText` (lines 87-112) builds the chapter meta description from `<p>` elements inside `<main>`. Mermaid's default HTML labels are `<p>` elements inside `<foreignObject>`: the parent rendered a 4-node flowchart on 2026-10-16 and found `<p>Ya</p>`, `<p>Mulai</p>` and others in the SVG. An inlined SVG with HTML labels would therefore leak label text into the meta description.
- Gating: chapters other than `01_*` redirect anonymous visitors (`functions/_middleware.ts:136-155`). `.svg` is in `PUBLIC_ASSET_EXTENSIONS` (`functions/lib/gating.ts:33-45`), so a diagram shipped as a separate `.svg` file would be public. Inline SVG stays behind the gate.
- mdBook search is on by default and indexes code-block text (`hitung_koefisien_angkat` from a Python fence appears in `searchindex-*.js`).
- D1 `content_md` stores raw chapter Markdown; it is only returned as JSON by `/api/books/<slug>`. No Markdown renderer exists under `apps/`.
- Tests: `bun test`, files in `tests/scripts/*.test.ts`; fixture-tree pattern in `tests/scripts/check-repeated-headings.test.ts`, pure-transform pattern in `tests/scripts/inject-gating-utils.test.ts`.
- Rule surfaces for future authoring: `GEMINI.md` (CLAUDE.md and AGENTS.md are symlinks; section 24 line 203 is the only explicit "Dispatch requirement" clause), `MDBOOK_SYSTEM_RULES.md` rule 7.7.8 "Rich Markdown and Layout" (lines 824-830) and the AuthoringAgent spec (lines 300-312), and the per-chunk contract each new-book plan writes into authoring prompts (pattern: `docs/code-plan/plans/2026-10-15-dawnbook-soft-power-manga-anime.md:362`).

## Mermaid CLI (R2, measured on this machine and read from primary sources)

- Installed: `@mermaid-js/mermaid-cli` 12.0.0 (latest release, 2026-09-24, https://github.com/mermaid-js/mermaid-cli/releases read 2026-10-16), bundled `mermaid` 12.1.0, Puppeteer 25.13.0, installed with `bun add -g`.
- A plain `mmdc -i flow.mmd -o flow.svg` exits 1: Puppeteer pins chrome-headless-shell 155, the cache only holds 153. Parent reproduced the exit 1 on 2026-10-16. A `-p` Puppeteer config pointing `executablePath` at the cached 153 binary exits 0 (parent reproduced, 32,173 bytes with `--no-font-embed -b transparent`). Likely cause: Bun skips Puppeteer's postinstall download (https://pptr.dev/troubleshooting, read 2026-10-16).
- v12 changes: new default themes and layouts, fonts embedded into the SVG by default (199,237 bytes for a 4-node flowchart; `--no-font-embed` turns it off), `--cssFile` feeds `themeCSS`.
- Cost: 1.1-1.5 s per CLI call; about 0.7 s per diagram with one shared browser through the JS API `renderMermaid(browser, definition, "svg", opts)` from Bun. The JS API is outside semver per the README.
- Determinism: repeat renders of flowchart, sequence, pie, state and block diagrams were byte-identical. Ids are prefixed by the `svgId` (`-I`, default `my-svg`), which collides when two SVGs are inlined on one page, so each diagram needs a unique stable id. `block` uses `Math.random()` for some ids.
- Markdown mode (`-i x.md -o y.md`) numbers SVGs by position, so inserting a diagram renames every later file. Not suitable.
- Default output bakes hex colours into a scoped `<style>`, uses `<foreignObject>` labels, and names the font "Recursive Variable".

## Mermaid syntax and theming (R4, primary sources read 2026-10-16)

- Current release mermaid 12.1.0 (https://github.com/mermaid-js/mermaid/releases). Since 12.0.0 the default theme is `redux-color` with look `neo`, and the docs disagree on the default layout (ELK vs dagre), so the renderer config must pin `layout`.
- Keywords: `xychart`, `sankey`, `block` without `-beta` are documented; parsers accept both forms. `timeline`, `mindmap`, `sankey` are marked experimental (https://mermaid.js.org/syntax/timeline.html, .../mindmap.html, .../sankey.html).
- Accessibility: `accTitle: ...` and `accDescr: ...` produce `<title>`, `<desc>`, `aria-labelledby`, `aria-describedby` and `aria-roledescription` in the SVG (https://mermaid.js.org/config/accessibility.html).
- Theming: only `base` accepts `themeVariables`, and only hex colours (https://mermaid.js.org/config/theming.html). No documented support for CSS variables or `prefers-color-scheme`. `themeCSS` (fed by `--cssFile`) is raw CSS inlined into the SVG; whether `var(--fg)` in it resolves once the SVG is inlined into an mdBook page is untested and is the spike's first question.
- `htmlLabels: false` (root level) renders labels as SVG `<text>`/`<tspan>` instead of `<foreignObject>` (https://github.com/mermaid-js/mermaid/issues/58, read 2026-10-16). This removes the `<p>` leak into the meta description.
- `securityLevel: strict` is the default and cannot be changed by diagram directives. A parse error renders an error SVG instead of failing, so the build must check for errors itself.
- Client-side alternative `mdbook-mermaid` 0.17.1 supports mdBook 0.5 but ships `mermaid.min.js` of 2,667,011 bytes; upstream mermaid 12.1.0 `mermaid.min.js` is 5,493,176 bytes (https://data.jsdelivr.com, read 2026-10-16). With `no-store` caching (GEMINI.md section 3) every page view would download it again.
- mdBook 0.5 preprocessor protocol: `<cmd> supports <renderer>`, then `[context, book]` JSON on stdin and the book JSON on stdout (https://rust-lang.github.io/mdBook/for_developers/preprocessors.html).

## Diagram inventory (R5-R10)

About 154 grounded candidates across the 58 books, stored per group in `docs/code-plan/artifacts/2026-10-16-mermaid-inventory/g1.md` to `g6.md`. Every book has at least one candidate; several books hold ASCII-art diagrams in code fences that a Mermaid block would replace (`aerodinamika-dan-desain-airfoil` ch12, `eksistensialisme-dan-makna-hidup` ch02, `human-capital-theory` ch07, `metakognisi` ch06, `psikologi-bencana-dan-manajemen-panik` (about 15 blocks), `sistem-modul-rust` ch01, `sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar` ch07). Parent spot-checked three candidates against the source lines on 2026-10-16 (`nudge-theory` 11:11-17, `human-capital-theory` 07:117-129, `soft-power-jepang-lewat-manga-dan-anime` 08:18-24); all three match.

Candidates blocked by contradictions in the text itself (fix the text before drawing):
- `menemukan-tujuan-hidup-ikigai`: zone definitions differ between ch02, ch03 and ch08.
- `tonsilektomi`: pain peak is days 1-3 in ch10:11 but days 4-7 in ch08:48-49.
- `sistem-peringatan-dini-early-warning-system`: ch04:33-42 "rantai komando empat jam" against a target under 5 minutes, and stage timings that differ from ch07:21.
- `sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar`: ch05:15-19 percentages do not add up.

Not read: mermaid.js.org flowchart, sequence, state, pie and journey syntax pages; `migrate-to-d1.ts` lines 1-145; Referensi chapters and chapter prose outside the cited ranges (inventory agents read headings plus promising ranges only).
