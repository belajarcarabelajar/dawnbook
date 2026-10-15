# Review report: diagram retrofit RF1 (session dawnbook-diagrams-retrofit-1)

Diff reviewed: `f327ddd..cc5ec8b` (10 book commits and the wrap-split label fix). Three read-only `staid` reviewers ran in parallel without seeing each other's reports: two on the standards axis (GEMINI.md section 25 grounding, five books each) and one on the spec axis (the plan and `g1.md`).

## Standards axis, books 1-5 (aerodinamika, analisis-ekspresif, analisis-wacana-kritis, arsitektur-kernel-linux, bias-kognitif)

Verdict: `correct`. 14 diagrams checked node by node against their chapter lines; `bun run check:diagrams` exit 0.

| Finding | Priority | Outcome |
|---|---|---|
| analisis-ekspresif ch04 edge "salju memicu kilas balik" turns the chapter's example ("Misalnya, ketika tokoh 'Aku' menatap salju", line 17) into the general trigger | P3 | fixed in `e145754`: edge "kilas balik lewat asosiasi emosional", accDescr names the snow as an example |
| aerodinamika ch01 and ch09 intro sentences both open "Lewat diagram berikut, kamu bisa melihat" (section 21) | P3 | fixed in `e145754`: ch09 intro rewritten |
| three intro sentences do not contain "kamu" | P3 | no change: section 16 bans "Anda" only, and none uses it |

Design notes (non-blocking): the aerodinamika ch01 Bernoulli and Newton branches and the nested Fairclough layers are accepted readings of the text.

## Standards axis, books 6-10 (digital-minimalisme, ekonomi-laissez-faire, eksistensialisme-dan-kehendak-bebas, eksistensialisme-dan-makna-hidup, elastisitas)

Verdict: `correct`. 12 diagrams checked; both judgement calls accepted (digital-minimalisme "Tidak diaktifkan kembali" from line 50's three required conditions; ekonomi-laissez-faire ch07 bullets drawn into the inequality node, which line 29 introduces with a colon and line 34 calls "ketimpangan ini").

| Finding | Priority | Outcome |
|---|---|---|
| ekonomi-laissez-faire ch07 node "Terjebak dalam upah rendah" drops the source hedge "sering kali" (line 32) | P3 | fixed in `e145754`: label and accDescr say "sering kali" |
| elastisitas ch08 node "Putuskan tambah kapasitas gudang atau rekrut tenaga kerja" reads as an order; line 76 says "menentukan apakah perusahaan perlu" | P3 | fixed in `e145754`: "Putuskan perlu tidaknya menambah kapasitas gudang atau tenaga kerja" |
| intro sentences share the "... itu bisa kamu X ... pada bagan/diagram berikut" wording in ekonomi-laissez-faire (ch03, ch09) and elastisitas (ch06, ch08) | P3 | fixed in `e145754`: ekonomi ch09 and elastisitas ch08 rewritten; the parent's scan found the same pair in analisis-ekspresif (ch04, ch13) and rewrote ch13 too |

Design notes (non-blocking, not changed): a subgraph could show the Matthew effect more literally than arrows; "Dipakai lagi" and "Tidak diaktifkan kembali" use different verbs; the elastisitas ch04 diagram restates the table above it; `E_d` shows as plain text in two SVGs; two books share the accTitle "Tiga respons terhadap absurditas menurut Camus" (different books, so section 21 does not apply).

## Spec axis

Verdict: `correct`. All ten books have diagrams, both ASCII-art fences named in `g1.md` are converted, the four skipped candidates have recorded reasons, and nothing outside `books/<10 slugs>/src/content/` and `books/<10 slugs>/diagrams/` changed (no `book.toml`, `SUMMARY.md` or `scripts/` edit). About 100 node, edge and number phrases spot-checked; all 20 B1-B10 plan commands exit 0. `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` exit 0 (704 lines, 54 files, 12 commit messages).

| Finding | Priority | Outcome |
|---|---|---|
| commit `cc5ec8b` says eight labels; it edits nine (eight splits in seven diagrams, plus the parallel "Adverse pressure gradient" label) | P3 | fixed in the plan's Execution record and the PR body |
| aerodinamika ch01 and ch09 intro openers repeat | P3 | same as above, fixed in `e145754` |
| S4 baseline comparison relies on files in `/tmp`, and the 22 task step boxes are open | P3 | baselines copied to `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1/structure-baseline/`; step boxes are ticked from the runner log before the `Close plan` gate |

## After the fixes

On tree `e145754`: `bun run check:diagrams` 0 violations, 0 orphaned SVGs; the scratch split scan finds 0 mid-word splits; `check-book-structure.ts` output equals the baseline for all ten books; widths of the three re-rendered SVGs 587, 425 and 416 px.

Combined verdict: `correct` (no P0, P1 or P2 on either axis).
