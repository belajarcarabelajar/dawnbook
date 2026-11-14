# Mermaid diagrams: full rules

Moved verbatim from `GEMINI.md` on 2026-11-15, when the always-loaded instruction files were compacted under the 150k-character limit. `GEMINI.md` keeps the binding summary of each rule and points here; each heading below names the `GEMINI.md` section the text belongs to. Read this file before the work its pointer in `GEMINI.md` names. In the moved text, "this section" and "this file" mean the `GEMINI.md` section named in the heading.

## From section 25 (Mermaid Diagrams (Build-Time SVG))

- **Width:** keep the natural width (the third number of the cached SVG's root `viewBox`) at or under 1000 px (gate rule `too-wide`), because the SVG never shrinks below 0.75 of it and the reading column is 750 px. Write chains longer than four nodes as `flowchart TD`, keep sequence diagrams to the participants the text needs, and never use `<br/>` inside a label (sequence diagrams wrap their own text). Flowchart labels wrap at 110 px, and a single word wider than that is split across two lines (gate rule `split-word`); reword the label, for example with a shorter synonym or by dropping a suffix, never with `<br/>`.
- **Accessibility:** every block declares `accTitle:` and `accDescr:` in Indonesian (`missing-acc-title`, `missing-acc-descr`). The renderer injects them into `timeline`, which Mermaid otherwise drops silently.
- **Flowchart labels:** quote any node label that contains brackets or punctuation (`A["Biaya (Rp)"]`) and quote every edge label (`A -->|"ya"| B`).
- **xychart strings and numbers:** quote every title, axis title and category (`xychart-unquoted`). Numbers use a dot decimal and no thousands separator: `2170.2`, never `2.170,2`, which renders wrong values with no error (`xychart-decimal`). A number with a dot and exactly three digits after it (`1.500`) is refused as a thousands separator (`xychart-thousands`). Each series has one value per category (`xychart-count`).
- **Forbidden inside a block:** `{{` (mdBook processes it even inside the SVG, `double-brace`), a straight double quote inside a label (use curly quotes “ ”; the gate enforces this as `straight-quote` in quoted flowchart labels and in the text after `:` in sequence and timeline lines), a Mermaid directive `%%{...}%%` or a front-matter `config:` key, which would override the locked render config (`config-override`), emoji (`emoji`), em dash (`em-dash`), the word "Anda" (`anda`), and `$` (`dollar`).
- **Example** (assuming the chapter describes these four steps as a repeating cycle):
  ````markdown
  ```mermaid
  flowchart LR
      accTitle: Siklus PDCA
      accDescr: Empat tahap PDCA berjalan berurutan dari rencanakan, kerjakan, periksa, sampai tindak lanjuti, lalu kembali ke rencanakan.
      A["Rencanakan (Plan)"] --> B["Kerjakan (Do)"]
      B --> C["Periksa (Check)"]
      C --> D["Tindak lanjuti (Act)"]
      D -->|"siklus berikutnya"| A
  ```
  ````
- **Locked render config:** `scripts/diagrams/render-config.json` and `scripts/diagrams/theme.css` are part of every cache key, together with the diagram source, the pinned `@mermaid-js/mermaid-cli` version, the installed `mermaid` version (read from `bun.lock`) and the source of `scripts/diagrams/postprocess.ts`. Changing either file, upgrading Mermaid, or changing the post-processor renames every cached SVG, so the same change needs a full `bun run diagrams:render` followed by `--prune`. Never edit them for one book's sake.
- **One SVG for all themes:** text, lines, shapes and backgrounds take their colours from mdBook CSS variables (`--fg`, `--bg`, `--quote-bg`, `--links`), so one SVG follows light, rust, coal, navy and ayu. The first xychart series follows `--links`; pie slices and further xychart series use a fixed 8-colour palette chosen to keep at least 3:1 contrast in all five themes, so avoid a pie with more than 8 slices.
- **Revert:** remove section 25 from this file. The rule is enforced by `scripts/check-diagrams.ts` (gate) and fed by `scripts/render-diagrams.ts` (renderer); a full revert also removes them, their `package.json` scripts and the build step.
