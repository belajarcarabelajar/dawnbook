---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-diagrams-retrofit-rf5
status: Verification
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-diagrams-retrofit-5 (branch 2026-10-16-dawnbook-diagrams-retrofit-rf5/dawnbook-diagrams-retrofit-5)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-diagrams-retrofit-5
parent_plan: docs/code-plan/plans/2026-10-16-dawnbook-mermaid-diagrams.md
inventory: docs/code-plan/artifacts/2026-10-16-mermaid-inventory/g5.md
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
    impacts: ["chapter pages of psikologi-positif and their meta descriptions - bun run build"]
    files: { create: [books/psikologi-positif/diagrams], modify: [], test: [] }
    idempotency_key: "B1:psikologi-positif"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book psikologi-positif"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book psikologi-positif --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts psikologi-positif | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/psikologi-positif.txt -'"
        expect_exit: 0
        retry: 0
  - id: B2
    depends_on: []
    impacts: ["chapter pages of quarter-life-crisis and their meta descriptions - bun run build"]
    files: { create: [books/quarter-life-crisis/diagrams], modify: [], test: [] }
    idempotency_key: "B2:quarter-life-crisis"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book quarter-life-crisis"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book quarter-life-crisis --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts quarter-life-crisis | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/quarter-life-crisis.txt -'"
        expect_exit: 0
        retry: 0
  - id: B3
    depends_on: []
    impacts: ["chapter pages of relief-karmawibhangga-dan-hukum-sebab-akibat and their meta descriptions - bun run build"]
    files: { create: [books/relief-karmawibhangga-dan-hukum-sebab-akibat/diagrams], modify: [], test: [] }
    idempotency_key: "B3:relief-karmawibhangga-dan-hukum-sebab-akibat"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book relief-karmawibhangga-dan-hukum-sebab-akibat"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book relief-karmawibhangga-dan-hukum-sebab-akibat --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts relief-karmawibhangga-dan-hukum-sebab-akibat | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/relief-karmawibhangga-dan-hukum-sebab-akibat.txt -'"
        expect_exit: 0
        retry: 0
  - id: B4
    depends_on: []
    impacts: ["chapter pages of resiliensi-dan-ketangguhan and their meta descriptions - bun run build"]
    files: { create: [books/resiliensi-dan-ketangguhan/diagrams], modify: [], test: [] }
    idempotency_key: "B4:resiliensi-dan-ketangguhan"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book resiliensi-dan-ketangguhan"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book resiliensi-dan-ketangguhan --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts resiliensi-dan-ketangguhan | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/resiliensi-dan-ketangguhan.txt -'"
        expect_exit: 0
        retry: 0
  - id: B5
    depends_on: []
    impacts: ["chapter pages of sejarah-evolusi-drama-korea and their meta descriptions - bun run build"]
    files: { create: [books/sejarah-evolusi-drama-korea/diagrams], modify: [], test: [] }
    idempotency_key: "B5:sejarah-evolusi-drama-korea"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book sejarah-evolusi-drama-korea"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book sejarah-evolusi-drama-korea --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts sejarah-evolusi-drama-korea | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sejarah-evolusi-drama-korea.txt -'"
        expect_exit: 0
        retry: 0
  - id: B6
    depends_on: []
    impacts: ["chapter pages of siklus-hidrologi-mikrofisika-awan and their meta descriptions - bun run build"]
    files: { create: [books/siklus-hidrologi-mikrofisika-awan/diagrams], modify: [], test: [] }
    idempotency_key: "B6:siklus-hidrologi-mikrofisika-awan"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book siklus-hidrologi-mikrofisika-awan"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book siklus-hidrologi-mikrofisika-awan --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts siklus-hidrologi-mikrofisika-awan | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/siklus-hidrologi-mikrofisika-awan.txt -'"
        expect_exit: 0
        retry: 0
  - id: B7
    depends_on: []
    impacts: ["chapter pages of sistem-modul-rust and their meta descriptions - bun run build"]
    files: { create: [books/sistem-modul-rust/diagrams], modify: [], test: [] }
    idempotency_key: "B7:sistem-modul-rust"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book sistem-modul-rust"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book sistem-modul-rust --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts sistem-modul-rust | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-modul-rust.txt -'"
        expect_exit: 0
        retry: 0
  - id: B8
    depends_on: []
    impacts: ["chapter pages of sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar and their meta descriptions - bun run build"]
    files: { create: [books/sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar/diagrams], modify: [], test: [] }
    idempotency_key: "B8:sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar.txt -'"
        expect_exit: 0
        retry: 0
  - id: B9
    depends_on: []
    impacts: ["chapter pages of sistem-peringatan-dini-early-warning-system and their meta descriptions - bun run build"]
    files: { create: [books/sistem-peringatan-dini-early-warning-system/diagrams], modify: [], test: [] }
    idempotency_key: "B9:sistem-peringatan-dini-early-warning-system"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book sistem-peringatan-dini-early-warning-system"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book sistem-peringatan-dini-early-warning-system --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts sistem-peringatan-dini-early-warning-system | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-peringatan-dini-early-warning-system.txt -'"
        expect_exit: 0
        retry: 0
  - id: Z1
    depends_on: []
    impacts: ["sistem-modul-rust ch10 and sejarah-evolusi-drama-korea ch02 pages - bun run build"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "Z1:content-slips"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts sistem-modul-rust | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-modul-rust.txt - || exit 1; bun run scripts/check-book-structure.ts sejarah-evolusi-drama-korea | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sejarah-evolusi-drama-korea.txt - || exit 1'"
        expect_exit: 0
        retry: 0
  - id: Z2
    depends_on: []
    impacts: ["relief-karmawibhangga ch02 ch12 and psikologi-positif ch05 pages - bun run build"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "Z2:relief-and-flow-inconsistencies"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts relief-karmawibhangga-dan-hukum-sebab-akibat | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/relief-karmawibhangga-dan-hukum-sebab-akibat.txt - || exit 1; bun run scripts/check-book-structure.ts psikologi-positif | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/psikologi-positif.txt - || exit 1'"
        expect_exit: 0
        retry: 0
  - id: Z3
    depends_on: []
    impacts: ["EWS book chapters 03 04 05 07 - bun run build"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "Z3:ews-inconsistencies"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts sistem-peringatan-dini-early-warning-system | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-peringatan-dini-early-warning-system.txt - || exit 1'"
        expect_exit: 0
        retry: 0
  - id: Z4
    depends_on: []
    impacts: ["the heading gate inside bun run build for all books - bun run check:headings"]
    files: { create: [], modify: [scripts/check-heading-colons.ts, GEMINI.md], test: [tests/scripts/check-heading-colons.test.ts] }
    idempotency_key: "Z4:lead-in-colon-rule"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/check-heading-colons.test.ts"
        expect_exit: 0
        retry: 0
  - id: Z5
    depends_on: []
    impacts: ["lead-in lines in eight books (first half) - bun run check:headings"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "Z5:lead-in-rewrite-1"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run check:headings"
        expect_exit: 0
        retry: 0
  - id: Z6
    depends_on: []
    impacts: ["lead-in lines in fourteen books (second half) - bun run check:headings"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "Z6:lead-in-rewrite-2"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run check:headings"
        expect_exit: 0
        retry: 0
  - id: V1
    depends_on: [B1, B2, B3, B4, B5, B6, B7, B8, B9, Z1, Z2, Z3, Z4, Z5, Z6]
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
---

# Diagram retrofit RF5 (inventory group g5, 9 books)

## Session checklist

- [x] S0 Carry-over from RF4: commit the RF4 merge evidence and tick RF4 S5 and S6. Evidence: this commit
- [x] S1 Plan: tasks written, runner `Validation: OK`, `Plan` gate approved; structure baselines committed under `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/`. Evidence: runner `Validation: OK`; `Plan` gate answered "Approve all five" for RF2-RF6 on 2026-10-16; baseline problem counts in book order 6, 6, 8, 3, 5, 11, 8, 0, 0
- [x] S2 Execute: one subagent per task adds 0-3 grounded diagrams per chapter from `g5.md`, renders them, gate exit 0; parent diff audit (every block against its source lines, intro sentences listed per book) and one commit per book. Evidence: nine book subagents in one message, then six follow-up subagents Z1-Z6 (Z4 in an isolated /tmp worktree); parent audited every block and edit; commits 98463fc, 2f15a40 (books), 9507f4b (Z1), 7afdc25 (Z2), 962c06f (Z3), f9c3bda (Z5), 2889e6f (Z6), c04808f (Z4); 23 diagrams; skips recorded in the review report
- [x] S3 Review: two standards reviewers (grounding) and one spec reviewer; findings fixed. Evidence: two standards reviewers and one spec reviewer on a frozen worktree at 2f15a40, each `correct`; fixed: siklus ch10 hail edge says the updraft keeps the particle aloft (922a53f), quarter-life ch04 accessible text keeps the code-analogy framing (9f7b92d); Z2 and Z3 content fixes each quote a primary source
- [x] S4 Verify: `bun run build`, `bun test`, `bun run check:diagrams`, structure output equal to the baseline for every book. Evidence: tree c04808f: `bun run build` exit 0; `bun test` 676 pass, 13 skip, 0 fail; `check:diagrams` 0 violations; `check:headings` 0 violations under the new lead-in rule; 23 inline diagrams equal 23 source blocks; structure output equal to the RF5 baselines; Z5 and Z6 report no new structure problem in the 22 rewritten books
- [ ] S5 Deliver: D1 seed rerun and `db/seed.sql` committed; PR from body file, registered; `Merge` gate
- [ ] S6 Close: readiness and `Close plan` gate before the merge; after the merge issue sync, publish, registry `merged`, graphify sync

## Visual Map

```mermaid
flowchart TD
    accTitle: Task graph for diagram retrofit RF5
    accDescr: After plan approval the book tasks run in parallel, one subagent each, and an integration check closes the graph before review, seed and the pull request.
    G2{{"Gate 2: plan approved"}}
    G2 --> B1["B1 psikologi-positif"]
    G2 --> B2["B2 quarter-life-crisis"]
    G2 --> B3["B3 relief-karmawibhangga-dan"]
    G2 --> B4["B4 resiliensi-dan-ketangguhan"]
    G2 --> B5["B5 sejarah-evolusi-drama"]
    G2 --> B6["B6 siklus-hidrologi-mikrofisika"]
    G2 --> B7["B7 sistem-modul-rust"]
    G2 --> B8["B8 sistem-pengendalian-topik"]
    G2 --> B9["B9 sistem-peringatan-dini"]
    B1 --> V1["V1 integration verify"]
    B2 --> V1["V1 integration verify"]
    B3 --> V1["V1 integration verify"]
    B4 --> V1["V1 integration verify"]
    B5 --> V1["V1 integration verify"]
    B6 --> V1["V1 integration verify"]
    B7 --> V1["V1 integration verify"]
    B8 --> V1["V1 integration verify"]
    B9 --> V1["V1 integration verify"]
    G2 --> Z1["Z1 content slips"]
    G2 --> Z2["Z2 relief and flow inconsistencies"]
    G2 --> Z3["Z3 EWS inconsistencies"]
    G2 --> Z4["Z4 lead-in colon rule"]
    G2 --> Z5["Z5 lead-in rewrite part 1"]
    G2 --> Z6["Z6 lead-in rewrite part 2"]
    Z1 --> V1
    Z2 --> V1
    Z3 --> V1
    Z4 --> V1
    Z5 --> V1
    Z6 --> V1
    V1 --> PR{{"Review, seed, PR, merge gate"}}
```

## Global Constraints

- GEMINI.md section 25 governs every diagram, and its dispatch contract paragraph is pasted verbatim into every dispatch (allowed types, accTitle and accDescr in Indonesian, grounding with hedges and examples kept, placement after the paragraph with an intro sentence that differs from the book's other intros, width at most 1000 px, at most 3 per chapter, never required, no repeated scaffolding shape, `split-word` reworded).
- Candidates come from `g5.md`; a subagent may skip a weak candidate and reports why. ASCII-art diagrams named in `g5.md` are converted and the ASCII version deleted.
- Each dispatch requires, for every node and number, the exact source line, and gives a tool-call budget.
- Chapter text outside the inserted block and its one introducing sentence stays byte-identical, except a deleted ASCII-art fence that the diagram replaces.
- Structure check command: `bun run scripts/check-book-structure.ts <slug> | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/<slug>.txt -` (empty diff; the script itself exits 1 on pre-existing problems).
- The branch is never pushed before the session runs; at its start it is rebased onto the current `origin/main` (no force push needed), and its D1 seed runs from that tree.
- FU3 (EWS command chain, commit 58c36bf) and FU4 (pedagogy percentages, commit 794cb4d) are resolved; the EWS chapter 04 chain and the pedagogy chart are drawn from the corrected text only. The EWS chapter 12 "Target Sendai" header and the unsourced "4 menit rata-rata" are not drawn (open debt from the follow-up session).

### Task B1: psikologi-positif

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book psikologi-positif` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book psikologi-positif --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of psikologi-positif equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/psikologi-positif.txt` | expect: exit 0 | retry: 0

### Task B2: quarter-life-crisis

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book quarter-life-crisis` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book quarter-life-crisis --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of quarter-life-crisis equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/quarter-life-crisis.txt` | expect: exit 0 | retry: 0

### Task B3: relief-karmawibhangga-dan-hukum-sebab-akibat

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book relief-karmawibhangga-dan-hukum-sebab-akibat` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book relief-karmawibhangga-dan-hukum-sebab-akibat --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of relief-karmawibhangga-dan-hukum-sebab-akibat equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/relief-karmawibhangga-dan-hukum-sebab-akibat.txt` | expect: exit 0 | retry: 0

### Task B4: resiliensi-dan-ketangguhan

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book resiliensi-dan-ketangguhan` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book resiliensi-dan-ketangguhan --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of resiliensi-dan-ketangguhan equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/resiliensi-dan-ketangguhan.txt` | expect: exit 0 | retry: 0

### Task B5: sejarah-evolusi-drama-korea

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book sejarah-evolusi-drama-korea` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book sejarah-evolusi-drama-korea --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of sejarah-evolusi-drama-korea equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sejarah-evolusi-drama-korea.txt` | expect: exit 0 | retry: 0

### Task B6: siklus-hidrologi-mikrofisika-awan

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book siklus-hidrologi-mikrofisika-awan` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book siklus-hidrologi-mikrofisika-awan --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of siklus-hidrologi-mikrofisika-awan equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/siklus-hidrologi-mikrofisika-awan.txt` | expect: exit 0 | retry: 0

### Task B7: sistem-modul-rust

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book sistem-modul-rust` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book sistem-modul-rust --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of sistem-modul-rust equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-modul-rust.txt` | expect: exit 0 | retry: 0

### Task B8: sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar.txt` | expect: exit 0 | retry: 0

### Task B9: sistem-peringatan-dini-early-warning-system

- [x] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book sistem-peringatan-dini-early-warning-system` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book sistem-peringatan-dini-early-warning-system --check` | expect: exit 0 | retry: 0
- [x] Step 3: Run | cmd: structure output of sistem-peringatan-dini-early-warning-system equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf5/structure-baseline/sistem-peringatan-dini-early-warning-system.txt` | expect: exit 0 | retry: 0

### Task Z1: content slips (RF4 debt sweep)

Acceptance: sistem-modul-rust ch10 `cases` formula renders both rows (no `\\` inside math; separate equations or the section 9 alternatives) and sejarah-evolusi-drama-korea ch02 math uses single backslashes; manual line edits per GEMINI.md section 9.

- [x] Step 1: Run | cmd: structure output of the two books equals the RF5 baselines | expect: exit 0 | retry: 0

### Task Z2: relief and flow inconsistencies (RF4 debt sweep)

Acceptance: relief-karmawibhangga ch02:58 (3 uncovered panels) and ch12 (4 panels, 156 covered) agree after a source check; psikologi-positif ch05:33 (Boredom) and ch05:40 (Relaxation) agree with one cited version of the flow channel model; every changed claim cites a verified source.

- [x] Step 1: Run | cmd: structure output of the two books equals the RF5 baselines | expect: exit 0 | retry: 0

### Task Z3: EWS inconsistencies and slips (RF4 debt sweep, earlier EWS deferrals)

Acceptance: InaTEWS founding year (ch07:15 says 2005, the ch03 table 2008), the 2-3 minute step and GPS sensor (ch04:35 vs ch07:21), and the earlier deferred Instruksi Presiden claim are checked against primary sources and made consistent; ch05 `\\,` in math and the ch07 stray ",." fixed.

- [x] Step 1: Run | cmd: structure output equals the RF5 baseline | expect: exit 0 | retry: 0

### Task Z4: lead-in colon rule (owner decision 2026-10-16)

Acceptance: `check-heading-colons.ts` reports bold text with an inner colon followed by body text on the same line (`**Analogi: X** Bayangkan...`), test first; `**Penting:** teks` (colon at the end of the bold) stays allowed; GEMINI.md section 24 states the rule.

- [x] Step 1: Run | cmd: `bun test tests/scripts/check-heading-colons.test.ts` | expect: exit 0 | retry: 0

### Task Z5: lead-in rewrite part 1

Acceptance: the lead-in lines in piaget, quarter-life-crisis, neuroplastisitas-dalam-belajar, eksistensialisme-dan-makna-hidup, bias-kognitif, metodologi-microteaching, geopolitik-dalam-sejarah-piala-dunia and gegar-budaya are rewritten by the section 24 ways (plus the neuroplastisitas ch05 "sangat sangat" slip); `check:headings` 0 after Z4.

- [x] Step 1: Run | cmd: `bun run check:headings` | expect: exit 0 | retry: 0

### Task Z6: lead-in rewrite part 2

Acceptance: the lead-in lines in the remaining fourteen books are rewritten the same way (plus the vestibular ch08 `-1{,}0` math slip); `check:headings` 0 after Z4.

- [x] Step 1: Run | cmd: `bun run check:headings` | expect: exit 0 | retry: 0

### Task V1: Integration verify

- [x] Step 1: Run | cmd: `bun run build` | expect: exit 0 | retry: 0
- [x] Step 2: Run | cmd: `bun test` | expect: exit 0 | retry: 1

## Execution record

| Task | Result |
|---|---|
| B1 psikologi-positif | ch03 upward spiral, ch05 flow quadrants, ch09 ABCDE |
| B2 quarter-life-crisis | ch04 code-analogy decision, ch07 50/30/20 pie; ch11 skipped (would invent thresholds) |
| B3 relief-karmawibhangga | ch02 discovery sequence, ch05 reading guide, ch12 timeline |
| B4 resiliensi | ch08 OODA loop, ch10 seismic shattering; ch09 box breathing skipped (no loop stated) |
| B5 sejarah-evolusi-drama-korea | ch01 and ch02 timelines (each chapter's own dates); ch05 chart skipped ("lebih dari 10") |
| B6 siklus-hidrologi | ch01 water cycle, ch09 Bergeron chain, ch10 hail loop; ch01 pie skipped ("< 0,1%") |
| B7 sistem-modul-rust | ch01 module tree (ASCII converted), ch08 self/super map, ch10 file decision |
| B8 pedagogi | ch04 discourse hierarchy, ch07 greeting choice (ASCII converted); ch05 and ch04 IRF skipped (repeat tables) |
| B9 EWS | ch05 pillar feedback, ch07 warning levels and six-stage chain; ch03 and ch04 skipped (repeat) |
| Z1 | rust ch10 cases split into two equations; drama ch02 B&W as plain text |
| Z2 | relief: four uncovered panels (Balai Konservasi Borobudur 2012); psikologi-positif ch05 quadrant model (Abuhamdeh 2020, DOI added) |
| Z3 | EWS: built from 2005, launched 11 November 2008 (Setneg; BMKG/GITEWS); location within 3 minutes, warning within 5; GPS feeds the DSS; unsourced Instruksi Presiden replaced by the sourced 20 July 2006 directive; two slips |
| Z4 | detector flags `**Label: X** text`; GEMINI.md section 24 records the owner decision; 78 tests |
| Z5, Z6 | 48 lead-in lines rewritten in 22 books; neuroplastisitas and vestibular slips |

## Status

- Status: Verification (S0-S4 done)
- Resume: D1 seed done from this tree; next the PR, Close plan and Merge gates.
