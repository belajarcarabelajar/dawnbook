---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-diagrams-retrofit-rf1
status: Complete
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-diagrams-retrofit-1 (branch 2026-10-16-dawnbook-diagrams-retrofit-rf1/dawnbook-diagrams-retrofit-1)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-diagrams-retrofit-1
parent_plan: docs/code-plan/plans/2026-10-16-dawnbook-mermaid-diagrams.md
inventory: docs/code-plan/artifacts/2026-10-16-mermaid-inventory/g1.md
defaults:
  retry_transient_max: 1
  step_timeout_s: 300
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
  require_impacts: true
  allow_no_impacts: []
  retry_if: any
tasks:
  - id: B1
    depends_on: []
    impacts: ["chapter pages of aerodinamika-dan-desain-airfoil and their meta descriptions - bun run build"]
    files: { create: [books/aerodinamika-dan-desain-airfoil/diagrams], modify: [], test: [] }
    idempotency_key: "B1:aerodinamika-dan-desain-airfoil"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book aerodinamika-dan-desain-airfoil"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book aerodinamika-dan-desain-airfoil --check"
        expect_exit: 0
        retry: 0
  - id: B2
    depends_on: []
    impacts: ["chapter pages of analisis-ekspresif-9-summers-10-autumns and their meta descriptions - bun run build"]
    files: { create: [books/analisis-ekspresif-9-summers-10-autumns/diagrams], modify: [], test: [] }
    idempotency_key: "B2:analisis-ekspresif-9-summers-10-autumns"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book analisis-ekspresif-9-summers-10-autumns"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book analisis-ekspresif-9-summers-10-autumns --check"
        expect_exit: 0
        retry: 0
  - id: B3
    depends_on: []
    impacts: ["chapter pages of analisis-wacana-kritis-awk-dalam-kriminologi and their meta descriptions - bun run build"]
    files: { create: [books/analisis-wacana-kritis-awk-dalam-kriminologi/diagrams], modify: [], test: [] }
    idempotency_key: "B3:analisis-wacana-kritis-awk-dalam-kriminologi"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book analisis-wacana-kritis-awk-dalam-kriminologi"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book analisis-wacana-kritis-awk-dalam-kriminologi --check"
        expect_exit: 0
        retry: 0
  - id: B4
    depends_on: []
    impacts: ["chapter pages of arsitektur-kernel-linux and their meta descriptions - bun run build"]
    files: { create: [books/arsitektur-kernel-linux/diagrams], modify: [], test: [] }
    idempotency_key: "B4:arsitektur-kernel-linux"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book arsitektur-kernel-linux"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book arsitektur-kernel-linux --check"
        expect_exit: 0
        retry: 0
  - id: B5
    depends_on: []
    impacts: ["chapter pages of bias-kognitif and their meta descriptions - bun run build"]
    files: { create: [books/bias-kognitif/diagrams], modify: [], test: [] }
    idempotency_key: "B5:bias-kognitif"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book bias-kognitif"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book bias-kognitif --check"
        expect_exit: 0
        retry: 0
  - id: B6
    depends_on: []
    impacts: ["chapter pages of digital-minimalisme and their meta descriptions - bun run build"]
    files: { create: [books/digital-minimalisme/diagrams], modify: [], test: [] }
    idempotency_key: "B6:digital-minimalisme"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book digital-minimalisme"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book digital-minimalisme --check"
        expect_exit: 0
        retry: 0
  - id: B7
    depends_on: []
    impacts: ["chapter pages of ekonomi-laissez-faire and their meta descriptions - bun run build"]
    files: { create: [books/ekonomi-laissez-faire/diagrams], modify: [], test: [] }
    idempotency_key: "B7:ekonomi-laissez-faire"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book ekonomi-laissez-faire"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book ekonomi-laissez-faire --check"
        expect_exit: 0
        retry: 0
  - id: B8
    depends_on: []
    impacts: ["chapter pages of eksistensialisme-dan-kehendak-bebas and their meta descriptions - bun run build"]
    files: { create: [books/eksistensialisme-dan-kehendak-bebas/diagrams], modify: [], test: [] }
    idempotency_key: "B8:eksistensialisme-dan-kehendak-bebas"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book eksistensialisme-dan-kehendak-bebas"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book eksistensialisme-dan-kehendak-bebas --check"
        expect_exit: 0
        retry: 0
  - id: B9
    depends_on: []
    impacts: ["chapter pages of eksistensialisme-dan-makna-hidup and their meta descriptions - bun run build"]
    files: { create: [books/eksistensialisme-dan-makna-hidup/diagrams], modify: [], test: [] }
    idempotency_key: "B9:eksistensialisme-dan-makna-hidup"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book eksistensialisme-dan-makna-hidup"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book eksistensialisme-dan-makna-hidup --check"
        expect_exit: 0
        retry: 0
  - id: B10
    depends_on: []
    impacts: ["chapter pages of elastisitas-harga-permintaan-dan-penawaran and their meta descriptions - bun run build"]
    files: { create: [books/elastisitas-harga-permintaan-dan-penawaran/diagrams], modify: [], test: [] }
    idempotency_key: "B10:elastisitas-harga-permintaan-dan-penawaran"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book elastisitas-harga-permintaan-dan-penawaran"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book elastisitas-harga-permintaan-dan-penawaran --check"
        expect_exit: 0
        retry: 0
  - id: V1
    depends_on: [B1, B2, B3, B4, B5, B6, B7, B8, B9, B10]
    impacts: ["build and suite run by CI and deploy - bun run build"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "V1:integration"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run build"
        expect_exit: 0
        retry: 0
      - cmd: "bun test"
        expect_exit: 0
        retry: 1
  - id: F1
    depends_on: [V1]
    impacts: ["the diagram gate inside bun run build for every book with diagrams - bun run check:diagrams"]
    files: { create: [], modify: [scripts/check-diagrams.ts], test: [tests/scripts/check-diagrams.test.ts] }
    idempotency_key: "F1:split-word-rule"
    skip_if: "bun test tests/scripts/check-diagrams.test.ts -t split-word 2>&1 | grep -q ' [1-9][0-9]* pass'"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/check-diagrams.test.ts"
        expect_exit: 0
        retry: 0
      - cmd: "bun run check:diagrams"
        expect_exit: 0
        retry: 0
  - id: F2
    depends_on: [V1]
    impacts: ["every future diagram dispatch that pastes the section 25 contract paragraph - rg -n 'Paste this contract paragraph' GEMINI.md"]
    files: { create: [], modify: [GEMINI.md], test: [] }
    idempotency_key: "F2:section-25-contract"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run check:headings"
        expect_exit: 0
        retry: 0
  - id: F3
    depends_on: [V1]
    impacts: ["chapter pages arsitektur-kernel-linux ch12, bias-kognitif ch07, digital-minimalisme ch02 - bun run build"]
    files: { create: [], modify: [books/arsitektur-kernel-linux/src/content/12_proses-booting-dan-inisialisasi-sistem.md, books/bias-kognitif/src/content/07_kekeliruan-biaya-tertanam-sunk-cost-fallacy.md, books/digital-minimalisme/src/content/02_psikologi-di-balik-ekonomi-perhatian-mengapa-layar.md], test: [] }
    idempotency_key: "F3:reported-defects"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bash -c 'for b in arsitektur-kernel-linux bias-kognitif digital-minimalisme; do bun run scripts/check-book-structure.ts $b | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1/structure-baseline/$b.txt - || exit 1; done'"
        expect_exit: 0
        retry: 0
---

# Diagram retrofit RF1 (inventory group g1, 10 books)

## Session checklist

- [x] S1 Plan: tasks B1-B10 and V1 written, runner `Validation: OK`, `Plan` gate approved. Evidence: runner `Validation: OK`; `Plan` gate approved 2026-10-16; baseline `check-book-structure.ts` problem counts 3, 3, 5, 6, 10, 2, 4, 6, 4, 8 (books in task order), saved per book under `/tmp/rf1-base-<slug>.txt`
- [x] S2 Execute: one subagent per book adds 0-3 grounded diagrams per chapter from `g1.md`, renders them, gate exit 0; parent diff audit and commit per book. Evidence: 10 subagents (chef, nappy, hoggy) dispatched in one message; parent read every inserted block against its source lines and committed one book per commit (`c579ad7`, `167d018`, `c3ec4ed`, `f891a31`, `cdfea6a`, `6a5047e`, `d2efb6c`, `4675354`, `e19de10`, `b013535`); 27 diagrams in 26 chapters, see Execution record; label fix `cc5ec8b`
- [x] S3 Review: independent grounding review of every diagram against its chapter lines; findings fixed. Evidence: three `staid` reviewers (standards books 1-5, standards books 6-10, spec axis), each verdict `correct`, 0 P0/P1/P2; the P3 findings are fixed in `e145754` (two source hedges restored, one decision label, four varied intro sentences); report `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1-review.md`
- [x] S4 Verify: `bun run build`, `bun test`, `bun run check:diagrams`, `check-book-structure.ts` for the ten books (no new problem beyond baseline; command form: `bun run scripts/check-book-structure.ts <slug> | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1/structure-baseline/<slug>.txt -`, empty diff expected, the script itself exits 1 on the pre-existing problems). Evidence first run on tree `cc5ec8b`, rerun on the final content tree `e145754` with the same results (build exit 0, 658 pass, 13 skip, 0 fail, 27 inline diagrams, the reworded labels present in the built page): `bun run build` exit 0 ("SEO Validation passed", "Premium Hub site generated successfully"); `bun test` 658 pass, 13 skip, 0 fail, exit 0; `bun run check:diagrams` "0 diagram violations, 0 orphaned SVGs"; `check-book-structure.ts` output byte-identical to the baseline for all ten books (3, 3, 5, 6, 10, 2, 4, 6, 4, 8); `bun run check:headings` 0 violations; build output `output/books/<slug>/content/*.html` holds 27 `class="dawnbook-diagram"` (equal to the 27 source blocks), 0 `language-mermaid` fences, 0 `foreignObject`, and no `diagrams/` folder
- [x] S5 Deliver: D1 seed rerun and `db/seed.sql` committed; PR from body file, registered; `Merge` gate. Progress: seed run twice (after the review fixes and after F3), each exit 0, D1 mermaid block counts equal the source (27); PR #153 opened with `--body-file` and registered (`pr-registry pr ... --number 153`, state `open`); the `Merge` gate was answered "Merge after CI green" and PR #153 merged as `bf8a9a4`; evidence `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1-merge-evidence.md`
- [x] S6 Close: readiness and `Close plan` gate before the merge; after the merge issue sync, publish, registry `merged`, graphify sync. Evidence: `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1-merge-evidence.md` (issue #154 created and closed, registry `merged`, graphify sync CURRENT)

## Visual Map

```mermaid
flowchart TD
    accTitle: Task graph for diagram retrofit RF1
    accDescr: After plan approval ten book tasks run in parallel, one per book, and an integration check closes the graph before review, seed and the pull request.
    G2{{"Gate 2: plan approved"}}
    G2 --> B1["B1 aerodinamika"]
    G2 --> B2["B2 analisis-ekspresif"]
    G2 --> B3["B3 analisis-wacana-kritis"]
    G2 --> B4["B4 arsitektur-kernel-linux"]
    G2 --> B5["B5 bias-kognitif"]
    G2 --> B6["B6 digital-minimalisme"]
    G2 --> B7["B7 ekonomi-laissez-faire"]
    G2 --> B8["B8 kehendak-bebas"]
    G2 --> B9["B9 makna-hidup"]
    G2 --> B10["B10 elastisitas"]
    B1 --> V1["V1 integration verify"]
    B2 --> V1
    B3 --> V1
    B4 --> V1
    B5 --> V1
    B6 --> V1
    B7 --> V1
    B8 --> V1
    B9 --> V1
    B10 --> V1
    V1 --> PR{{"Review, seed, PR, merge gate"}}
    V1 --> F1["F1 split-word gate rule"]
    V1 --> F2["F2 section 25 contract wording"]
    V1 --> F3["F3 three reported defects"]
```

## Global Constraints

- GEMINI.md section 25 governs every diagram (allowed types, accTitle/accDescr in Indonesian, grounding, placement, width at most 1000 px, at most 3 per chapter, never required, no repeated scaffolding shape).
- Candidates come from `g1.md`; the book subagent may skip a weak candidate and must report any it rejects. ASCII-art diagrams named in `g1.md` are converted and the ASCII version deleted.
- Each dispatch carries the section 25 contract paragraph verbatim and requires, for every node and number, the exact source sentence (lesson from the follow-up session).
- Chapter text outside the inserted block and its one introducing sentence stays byte-identical, except a deleted ASCII-art fence that the diagram replaces.

### Task B1: aerodinamika-dan-desain-airfoil

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book aerodinamika-dan-desain-airfoil` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book aerodinamika-dan-desain-airfoil --check` | expect: exit 0 | retry: 0

### Task B2: analisis-ekspresif-9-summers-10-autumns

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book analisis-ekspresif-9-summers-10-autumns` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book analisis-ekspresif-9-summers-10-autumns --check` | expect: exit 0 | retry: 0

### Task B3: analisis-wacana-kritis-awk-dalam-kriminologi

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book analisis-wacana-kritis-awk-dalam-kriminologi` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book analisis-wacana-kritis-awk-dalam-kriminologi --check` | expect: exit 0 | retry: 0

### Task B4: arsitektur-kernel-linux

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book arsitektur-kernel-linux` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book arsitektur-kernel-linux --check` | expect: exit 0 | retry: 0

### Task B5: bias-kognitif

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book bias-kognitif` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book bias-kognitif --check` | expect: exit 0 | retry: 0

### Task B6: digital-minimalisme

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book digital-minimalisme` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book digital-minimalisme --check` | expect: exit 0 | retry: 0

### Task B7: ekonomi-laissez-faire

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book ekonomi-laissez-faire` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book ekonomi-laissez-faire --check` | expect: exit 0 | retry: 0

### Task B8: eksistensialisme-dan-kehendak-bebas

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book eksistensialisme-dan-kehendak-bebas` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book eksistensialisme-dan-kehendak-bebas --check` | expect: exit 0 | retry: 0

### Task B9: eksistensialisme-dan-makna-hidup

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book eksistensialisme-dan-makna-hidup` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book eksistensialisme-dan-makna-hidup --check` | expect: exit 0 | retry: 0

### Task B10: elastisitas-harga-permintaan-dan-penawaran

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book elastisitas-harga-permintaan-dan-penawaran` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book elastisitas-harga-permintaan-dan-penawaran --check` | expect: exit 0 | retry: 0

### Task V1: Integration verify

- [x] Step 1: Run | cmd: `bun run build` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun test` | expect: exit 0 | retry: 1

## Follow-up tasks (debt sweep, owner selected all three on 2026-10-16)

Acceptance: F1 a cached SVG whose label row splits a source word fails `check:diagrams` with rule `split-word`, an unsplit label and a normal break at a space pass, and the real books stay at 0 violations. F2 the section 25 contract paragraph tells authors to keep hedges and examples, vary the intro sentence within a book, and reword a label `split-word` reports. F3 the three defects reported by B4, B5 and B6 are fixed line by line, with no new structural problem.

### Task F1: split-word gate rule

- [x] Step 1: Run | cmd: `bun test tests/scripts/check-diagrams.test.ts` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run check:diagrams` | expect: exit 0 | retry: 0

### Task F2: section 25 contract wording

- [x] Step 1: Run | cmd: `bun run check:headings` | expect: exit 0 | retry: 0

### Task F3: three reported defects

- [x] Step 1: Run | cmd: structure diff for the three books against the committed baseline | expect: exit 0 | retry: 0

### Follow-up evidence

- F1 (`e8c840a`, chef): RED `bun test tests/scripts/check-diagrams.test.ts` exit 1, 73 pass, 4 fail (`Expected ["split-word"]`, `Received []`); GREEN 77 pass, 0 fail. Regression proof: the new checker run with `--root` on an archive of the pre-fix tree `b013535` reports exactly the seven diagrams and eight words of the parent finding below, and not the normal break "Loncatan Iman" / "= Solusi"; on the current tree it reports 0 violations.
- F2 (`05f817e`, nappy): the section 25 contract paragraph gains three sentences (hedges and examples kept, intro sentence varied within a book, reword what `split-word` reports) and the Width bullet names `split-word`; `AGENTS.md` and `CLAUDE.md` are still symlinks to `GEMINI.md`; em dash count unchanged.
- F3 (`1f2972e`, hoggy plus two parent punctuation fixes in the same files): kernel ch12 display math uses single backslashes inside `<div>` and the typo reads "tumpang tindih di dalam"; bias-kognitif ch07 math is `\text{Biaya Masa Depan}` with no escaped underscore; digital-minimalisme ch02 "atau"; bias ch07 line 23 gains its full stop and digital-minimalisme ch02 line 59 loses the space before a comma. The built pages show the formulas with single backslashes and no `<em>`; structure output equals the baseline for the three books.
- Integration after F1-F3 (tree `e8c840a`): `bun run build` exit 0; `bun test` 665 pass, 13 skip, 0 fail; `check:diagrams` 0 violations; `check:headings` 0 violations. D1 seed rerun exit 0 (58 books, 0 failure lines); `cf d1 query` finds "tumpang tindih di dalam RAM" and "Biaya Masa Depan" in D1; `db/seed.sql` regenerated.

### Backlog (LATER)

- `split-word` reads only `text-outer-tspan` rows, so sequence, timeline, pie and xychart text is not checked. `defer: a retrofit that adds a long-label sequence or timeline, or a reported split in one`
- `split-word` skips a cut piece that ends in punctuation ("/media/usb/" then "data.txt"). `defer: the first such split seen in review`
- The `split-word` message hardcodes 110 px (the detection itself does not depend on it). `defer: any change to flowchart.wrappingWidth in render-config.json`
- analisis-wacana-kritis ch05 and ch07 write arrow chains as display math that could become diagrams. `defer: a later retrofit of that book`
- Existing opener and structure problems of the ten books (the committed baselines). `defer: a content-hygiene session per GEMINI.md sections 8 and 21`

## Execution record

| Task | Book | Diagrams (chapter: type) | Skipped candidate and reason |
|---|---|---|---|
| B1 | aerodinamika-dan-desain-airfoil | ch01 lift stages (flowchart TD, Bernoulli and Newton branches meet), ch09 flow separation (flowchart TD, two subgraphs), ch12 validation flow (flowchart TD, replaces the ASCII-art fence) | none |
| B2 | analisis-ekspresif-9-summers-10-autumns | ch04 mixed plot (flowchart LR loop), ch12 family milestones 1969, 1976, 1980 (timeline), ch13 motivation chain (flowchart TD) | none; the ch12 timeline the inventory called weak has three dated events in the text |
| B3 | analisis-wacana-kritis-awk-dalam-kriminologi | ch04 Fairclough's three dimensions (flowchart TD, nested subgraphs, no edges), ch08 moral panic stages (flowchart LR) | none |
| B4 | arsitektur-kernel-linux | ch05 system call (sequenceDiagram), ch08 write() path (flowchart TD, three subgraphs), ch12 boot order (flowchart TD) | ch03 process states: the text describes five states but states no transition |
| B5 | bias-kognitif | ch06 Dunning-Kruger stages (flowchart TD), ch07 sunk cost decision (flowchart TD), ch12 five-step debiasing (flowchart TD with a side branch) | none |
| B6 | digital-minimalisme | ch02 hook cycle (flowchart TD), ch04 declutter decision flow (flowchart TD) | ch04 week timeline: repeats the 30-day step already in the flowchart |
| B7 | ekonomi-laissez-faire | ch03 price signal (flowchart TD), ch07 Matthew effect (flowchart TD), ch09 recession responses (flowchart TD, two subgraphs) | none |
| B8 | eksistensialisme-dan-kehendak-bebas | ch04 responses to the absurd (flowchart TD), ch08 three metamorphoses (flowchart TD) | ch10 three stages: no transition stated, and a chain would repeat the ch08 shape |
| B9 | eksistensialisme-dan-makna-hidup | ch02 Kierkegaard stages (flowchart LR), ch02 roots of existentialism (flowchart TD, replaces the ASCII tree; root label moved to accTitle), ch03 Camus responses (flowchart LR) | none |
| B10 | elastisitas-harga-permintaan-dan-penawaran | ch04 elasticity classes (flowchart LR decision), ch06 TR curve regions (flowchart LR), ch08 supply analysis flow (flowchart TD) | ch09 supply table: same five-class shape as the ch04 demand diagram |

Parent finding during the diff audit: `scripts/diagrams/render-config.json` sets `flowchart.wrappingWidth` to 110, and Mermaid breaks a word wider than that into character chunks on separate lines. A scratch scan of every cached SVG against the source labels found eight such splits in seven diagrams ("menyeimbangk/an", "menguntungka/n,", "/media/usb/dat/a.txt", "pengetahuann/ya", "menggunakan/nya?", a lone "?", a lone ",", "Pemberontaka/n"); the pilots `nudge-theory` and `iklan-digital-dan-penargetan-algoritma` had none. Commit `cc5ec8b` rewords nine labels for those eight splits (the ninth, "Adverse pressure gradient", keeps the aerodinamika ch09 pair parallel; meaning kept, accDescr unchanged) and prunes the stale SVGs; the rescan finds 0 splits. The commit subject says "eight labels"; nine is the correct count. The gate now detects this (`split-word`, task F1).

## Closeout record

- Runner: `bun ~/vivera/scripts/ultra-plan-runner.mjs <plan> --execute > runner.log` exit 0 on tree `eb52574`: B1-B10, V1, F2, F3 `PASSED`; F1 `SKIPPED-IDEMPOTENT` (its `split-word` test passes). `plan-mark-done.mjs --from runner.log`: 14 considered, 14 ticked, 0 not ticked.
- Readiness: `bun ~/vivera/scripts/plan-closeout.mjs --readiness <plan>` on 2026-10-16, verdict `NEEDS-HUMAN` (exit 3): open NOW follow-ups 0, open step boxes 0; B1-B10, V1, F2 and F3 `UNPROVEN` (the `"false"` sentinel), F1 `DONE`; other open boxes 2 (S5 and S6, which close with the merge evidence).
- `Close plan` gate: the owner chose "Mark Complete" on that evidence (2026-10-16).
- S5 and S6 close after the merge: the `Merge` gate answer, the post-merge deploy check, `plan-issue-sync.mjs`, the mirror publish, registry `merged` and the graphify sync go into `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1-merge-evidence.md`, committed by the next session, as in the earlier diagram sessions.

## Status

- Status: Complete (`Close plan` gate, 2026-10-16)
- Resume: PR #153 waits for the `Merge` gate; after the merge only the steps in the Closeout record remain.
