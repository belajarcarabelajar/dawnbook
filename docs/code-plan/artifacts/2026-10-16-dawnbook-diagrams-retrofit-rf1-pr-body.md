## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-diagrams-retrofit-1` (roadmap item RF1 of `2026-10-16-dawnbook-mermaid-diagrams.md`, pipeline merged in #148) |
| Plan | `docs/code-plan/plans/2026-10-16-dawnbook-diagrams-retrofit-rf1.md` |
| Base branch | `main` |
| Head branch | `2026-10-16-dawnbook-diagrams-retrofit-rf1/dawnbook-diagrams-retrofit-1` |
| Type of change | book content (ten books), cached SVGs, `db/seed.sql`, one gate rule with tests, docs |
| Reviewer | three independent `staid` reviewers (standards x2, spec x1), each verdict `correct` |

## 2. What This Changes

Retrofits build-time Mermaid diagrams into the ten books of inventory group g1 (`docs/code-plan/artifacts/2026-10-16-mermaid-inventory/g1.md`): 27 diagrams in 26 chapters, each with its cached SVG under `books/<slug>/diagrams/`.

- aerodinamika-dan-desain-airfoil: lift stages, flow separation, and the validation flow that replaces the chapter 12 ASCII-art fence.
- analisis-ekspresif-9-summers-10-autumns: the mixed plot loop, a 1969/1976/1980 family timeline, a chain of motivation.
- analisis-wacana-kritis-awk-dalam-kriminologi: Fairclough's three dimensions as nested layers, moral panic stages.
- arsitektur-kernel-linux: a system call sequence, the `write()` path through user space, kernel space and hardware, the boot order.
- bias-kognitif: Dunning-Kruger stages, the sunk cost decision, the five debiasing steps.
- digital-minimalisme: the hook cycle, the declutter decision flow.
- ekonomi-laissez-faire: the price signal, the Matthew effect, the two recession responses.
- eksistensialisme-dan-kehendak-bebas: Camus' three responses to the absurd, Nietzsche's three metamorphoses.
- eksistensialisme-dan-makna-hidup: Kierkegaard's three stages, the roots-of-existentialism tree that replaces the chapter 02 ASCII tree, Camus' three paths.
- elastisitas-harga-permintaan-dan-penawaran: demand elasticity classes, TR curve regions, the supply analysis flow.

Every node, edge label and number is taken from the same chapter (GEMINI.md section 25). Four inventory candidates were skipped with a recorded reason (plan, Execution record). Chapter text outside each inserted block and its one introducing sentence is unchanged, except the two ASCII-art fences the diagrams replace.

During the diff audit the parent found that `flowchart.wrappingWidth: 110` in the locked render config makes Mermaid split a word wider than 110 px across two lines ("menyeimbangk/an"). Nine labels were reworded so no word is split (commit `cc5ec8b`, whose subject says eight); the pilots of #148 had no split. The gate does not detect this yet; see section 7.

`db/seed.sql` is regenerated, and the D1 seed already ran from this tree (exit 0, 58 books), so D1 `content_md` holds the diagrams before the site does.

Follow-ups selected in the session's debt sweep, also in this PR:

- **F1, gate rule `split-word`** (`e8c840a`): `scripts/check-diagrams.ts` compares the rows of each cached flowchart label with the source label words and fails when two rows join into one source word. Written test first (RED 4 fail, GREEN 77 pass). Run on an archive of the pre-fix tree `b013535`, it reports exactly the seven diagrams and eight words found by hand, and not a normal break at a space.
- **F2, section 25 contract** (`05f817e`): the dispatch paragraph now asks to keep the text's hedges and examples, to vary the intro sentence within a book, and to reword what `split-word` reports; the Width bullet names the rule.
- **F3, reported content defects** (`1f2972e`): arsitektur-kernel-linux chapter 12 display math (quadruple backslashes) and the typo "tumpang dian dalam"; bias-kognitif chapter 07 math escaping (`\text{Biaya Masa Depan}`); digital-minimalisme chapter 02 "or" to "atau"; two punctuation slips in the same files.

**Non-goals:** inventory groups g2 to g6 (RF2 to RF6), changing the render config, and the pre-existing problems listed in section 7.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Each g1 book gets its grounded diagrams or a recorded reason to skip | B1-B10 | parent diff audit; three reviews | 27 diagrams; 4 skips with reasons; reviews `correct` |
| AC-2 | Every diagram passes the gate and is cached | B1-B10 | `bun run check:diagrams`; `render-diagrams.ts --book <slug> --check` | 0 violations, 0 orphans; 0 missing for all ten books |
| AC-3 | No new structural problem | B1-B10 | `check-book-structure.ts <slug>` against the committed baseline | identical output for all ten books |
| AC-4 | ASCII-art fences named in g1 are converted and deleted | B1, B9 | spec review | both converted; the only deleted lines in the diff |
| AC-5 | Build and tests clean, diagrams inline in the built pages | V1 | `bun run build`, `bun test`, build output scan | exit 0; 658 pass, 13 skip, 0 fail; 27 inline diagrams, 0 raw fences, 0 `foreignObject` |

## 4. Local Verification Evidence

After the follow-ups (tree `e8c840a`): `bun run build` exit 0; `bun test` 665 pass, 13 skip, 0 fail; `check:diagrams` and `check:headings` 0 violations; the D1 seed rerun exit 0 and `cf d1 query` finds the F3 fixes in D1; the plan runner reports every task `PASSED` (F1 `SKIPPED-IDEMPOTENT` on its own passing test). The table below is the run on the content tree `e145754` before the follow-ups:

| Gate | Command | Exit | Result |
|---|---|---|---|
| Diagram gate | `bun run check:diagrams` | 0 | 0 diagram violations, 0 orphaned SVGs |
| Cache | `bun run scripts/render-diagrams.ts --book <slug> --check` x10 | 0 | 0 missing |
| Headings | `bun run check:headings` | 0 | 0 violations, 58 books |
| Book structure | `check-book-structure.ts <slug>` vs `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1/structure-baseline/` | 1 (baseline) | empty diff for all ten books |
| Build | `bun run build` | 0 | SEO validation passed |
| Tests | `bun test` | 0 | 658 pass, 13 skip, 0 fail |
| Copy rules | `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` (run by the spec reviewer) | 0 | 704 lines, 54 files, 12 commit messages |
| D1 | `migrate-to-d1.ts` (credentials sourced), then `cf d1 query` per book | 0 | "All seeds applied successfully."; mermaid block count in D1 equals the source for all ten books (27) |

- **Before:** none of the ten books had a diagram; two chapters carried ASCII-art drawings in code fences.
- **After:** 27 inline SVG diagrams that follow the five mdBook themes; widths 196 to 962 px.

## 5. Independent Review

- [x] Two standards reviewers checked every node and edge of all 27 diagrams against the chapter lines; one spec reviewer checked the diff against the plan and `g1.md`. Report: `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1-review.md`.
- [x] The parent audited every diff before each per-book commit and re-ran the gates after each fix.
- [x] All P3 findings with a content effect are fixed in `e145754` (two source hedges, one decision label, four varied intro sentences); one was declined with a reason.

**Reviewer verdict:** `correct` on both axes. It changes to `not correct` if a diagram states something its chapter does not.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | 26 chapter files in ten books, 27 new SVGs, `db/seed.sql`; `scripts/check-diagrams.ts` (new `split-word` rule, also run by `bun run build`) and its tests; GEMINI.md section 25. No render config change. |
| Door | Two-way: a revert removes the blocks and SVGs. |
| Rollout | Merge deploys through CI; CI never renders, it inlines the committed SVGs. D1 is already seeded from this tree. |
| Health signal | Built chapter pages carry `class="dawnbook-diagram"`; gated pages answer 401 to anonymous clients, so the content is verified in the build output of the identical tree. |
| Rollback | `git revert` of the merge commit, the normal deploy, then `migrate-to-d1.ts` to refresh D1. |
| Compatibility | N/A: Markdown content and static SVG only. |

## 7. Pre-Existing Issues and Deferred Debt

- `split-word` reads only flowchart-style label rows (not sequence, timeline, pie or xychart text) and skips a cut piece that ends in punctuation; its message hardcodes 110 px. `defer: see the plan backlog`
- analisis-wacana-kritis chapters 05 and 07 write arrow chains as display math; they could become diagrams. `defer: a later retrofit`
- Existing opener and structure problems of the ten books (the committed baselines). `defer: a content-hygiene session per GEMINI.md sections 8 and 21`

## 8. Checklist

- [x] Branch and worktree came from `pr-registry claim`.
- [x] Nothing was committed directly to the base branch.
- [x] Title is imperative; the body is in English.
- [x] No em dash in this body, the commit messages, or the added book lines.
- [x] No attribution footer, watermark, badge, or co-author line.
- [x] No secrets in the diff.
- [x] PR body written to a file and posted with `--body-file`.
- [x] Registered in the registry after the PR opens.
- [x] Plan closeout decided before the merge (`Close plan`: Mark Complete on readiness `NEEDS-HUMAN`, 0 open NOW items, 0 open step boxes).
