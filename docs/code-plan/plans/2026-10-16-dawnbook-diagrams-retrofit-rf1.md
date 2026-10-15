---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-diagrams-retrofit-rf1
status: Approved
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
---

# Diagram retrofit RF1 (inventory group g1, 10 books)

## Session checklist

- [x] S1 Plan: tasks B1-B10 and V1 written, runner `Validation: OK`, `Plan` gate approved. Evidence: runner `Validation: OK`; `Plan` gate approved 2026-10-16; baseline `check-book-structure.ts` problem counts 3, 3, 5, 6, 10, 2, 4, 6, 4, 8 (books in task order), saved per book under `/tmp/rf1-base-<slug>.txt`
- [ ] S2 Execute: one subagent per book adds 0-3 grounded diagrams per chapter from `g1.md`, renders them, gate exit 0; parent diff audit and commit per book
- [ ] S3 Review: independent grounding review of every diagram against its chapter lines; findings fixed
- [ ] S4 Verify: `bun run build`, `bun test`, `bun run check:diagrams`, `check-book-structure.ts` for the ten books (no new problem beyond baseline)
- [ ] S5 Deliver: D1 seed rerun and `db/seed.sql` committed; PR from body file, registered; `Merge` gate
- [ ] S6 Close: readiness and `Close plan` gate before the merge; after the merge issue sync, publish, registry `merged`, graphify sync

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
```

## Global Constraints

- GEMINI.md section 25 governs every diagram (allowed types, accTitle/accDescr in Indonesian, grounding, placement, width at most 1000 px, at most 3 per chapter, never required, no repeated scaffolding shape).
- Candidates come from `g1.md`; the book subagent may skip a weak candidate and must report any it rejects. ASCII-art diagrams named in `g1.md` are converted and the ASCII version deleted.
- Each dispatch carries the section 25 contract paragraph verbatim and requires, for every node and number, the exact source sentence (lesson from the follow-up session).
- Chapter text outside the inserted block and its one introducing sentence stays byte-identical, except a deleted ASCII-art fence that the diagram replaces.

### Task B1: aerodinamika-dan-desain-airfoil

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book aerodinamika-dan-desain-airfoil` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book aerodinamika-dan-desain-airfoil --check` | expect: exit 0 | retry: 0

### Task B2: analisis-ekspresif-9-summers-10-autumns

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book analisis-ekspresif-9-summers-10-autumns` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book analisis-ekspresif-9-summers-10-autumns --check` | expect: exit 0 | retry: 0

### Task B3: analisis-wacana-kritis-awk-dalam-kriminologi

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book analisis-wacana-kritis-awk-dalam-kriminologi` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book analisis-wacana-kritis-awk-dalam-kriminologi --check` | expect: exit 0 | retry: 0

### Task B4: arsitektur-kernel-linux

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book arsitektur-kernel-linux` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book arsitektur-kernel-linux --check` | expect: exit 0 | retry: 0

### Task B5: bias-kognitif

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book bias-kognitif` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book bias-kognitif --check` | expect: exit 0 | retry: 0

### Task B6: digital-minimalisme

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book digital-minimalisme` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book digital-minimalisme --check` | expect: exit 0 | retry: 0

### Task B7: ekonomi-laissez-faire

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book ekonomi-laissez-faire` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book ekonomi-laissez-faire --check` | expect: exit 0 | retry: 0

### Task B8: eksistensialisme-dan-kehendak-bebas

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book eksistensialisme-dan-kehendak-bebas` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book eksistensialisme-dan-kehendak-bebas --check` | expect: exit 0 | retry: 0

### Task B9: eksistensialisme-dan-makna-hidup

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book eksistensialisme-dan-makna-hidup` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book eksistensialisme-dan-makna-hidup --check` | expect: exit 0 | retry: 0

### Task B10: elastisitas-harga-permintaan-dan-penawaran

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book elastisitas-harga-permintaan-dan-penawaran` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book elastisitas-harga-permintaan-dan-penawaran --check` | expect: exit 0 | retry: 0

### Task V1: Integration verify

- [ ] Step 1: Run | cmd: `bun run build` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun test` | expect: exit 0 | retry: 1

## Status

- Status: Approved (`Plan` gate answered "Setujui dan eksekusi" on 2026-10-16)
- Resume: worktree above, `bun install` done; next is the `Plan` gate, then dispatch B1-B10.
