## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-diagrams-retrofit-2` (roadmap RF2 of `2026-10-16-dawnbook-mermaid-diagrams.md`) |
| Plan | `docs/code-plan/plans/2026-10-16-dawnbook-diagrams-retrofit-rf2.md` |
| Base branch | `main` |
| Type of change | book content (nine books), cached SVGs, `db/seed.sql`, gate rule extension with tests, docs |
| Reviewer | three independent `staid` reviewers, each verdict `correct` |

## 2. What This Changes

- 23 grounded Mermaid diagrams in 22 chapters of the nine g2 books (filosofi-stoikisme, fungsi-manajemen-poac, gegar-budaya, geopolitik-dalam-sejarah-piala-dunia, human-capital-theory, kecerdasan-interpersonal, kenapa-kebiasaan-susah-diubah, kenapa-kita-gampang-percaya-hoax, kenapa-kita-suka-menunda-nunda), with cached SVGs. Both ASCII-art fences in human-capital-theory chapter 07 are converted.
- `split-word` (X1, from the RF1 backlog) now also checks sequence and timeline lines, reports a cut piece that ends in punctuation, and reads the flowchart wrap width from `render-config.json`. Test first; a parent-found false positive (a normal break after a standalone "-") has its own test.
- Carry-over: the RF1 merge evidence and the RF1 plan's S5 and S6 ticks.
- `db/seed.sql` regenerated; the D1 seed already ran from this tree (exit 0; 23 mermaid blocks in D1 for these books).

## 3. Acceptance and Evidence

| Check | Result |
|---|---|
| `bun run build` | exit 0 |
| `bun test` | 674 pass, 13 skip, 0 fail |
| `bun run check:diagrams` | 0 violations, 0 orphans |
| Structure vs committed baselines | equal for all nine books |
| Build output | 23 inline diagrams equal 23 source blocks |
| Reviews | `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2-review.md`, all `correct` |

## 4. Risk and Rollback

Two-way door: Markdown, static SVG, one gate rule. Merge deploys through CI (CI only inlines committed SVGs). Rollback: revert the merge commit, deploy, rerun `migrate-to-d1.ts`.

## 5. Deferred

- Pre-existing LaTeX doubled backslashes and display-math blank lines reported in geopolitik ch01/ch04/ch12, kecerdasan-interpersonal ch05/ch10, fungsi-manajemen-poac ch08, kenapa-kita-gampang-percaya-hoax ch05. `defer: a manual LaTeX audit session per GEMINI.md section 9`
- Bold sub-titles with a colon inside blockquotes (geopolitik ch05 and ch12) are not caught by `check:headings`. `defer: a detector follow-up`

## 6. Checklist

- [x] Branch and worktree from `pr-registry claim`; nothing committed to main.
- [x] English body, no em dash, no attribution or co-author line, no secrets.
- [x] Body posted with `--body-file`.
