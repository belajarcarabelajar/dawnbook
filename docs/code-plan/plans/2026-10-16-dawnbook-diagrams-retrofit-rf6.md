---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-diagrams-retrofit-rf6
status: Approved
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-diagrams-retrofit-6 (branch 2026-10-16-dawnbook-diagrams-retrofit-rf6/dawnbook-diagrams-retrofit-6)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-diagrams-retrofit-6
parent_plan: docs/code-plan/plans/2026-10-16-dawnbook-mermaid-diagrams.md
inventory: docs/code-plan/artifacts/2026-10-16-mermaid-inventory/g6.md
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
    impacts: ["chapter pages of soft-power-jepang-lewat-manga-dan-anime and their meta descriptions - bun run build"]
    files: { create: [books/soft-power-jepang-lewat-manga-dan-anime/diagrams], modify: [], test: [] }
    idempotency_key: "B1:soft-power-jepang-lewat-manga-dan-anime"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book soft-power-jepang-lewat-manga-dan-anime"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book soft-power-jepang-lewat-manga-dan-anime --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts soft-power-jepang-lewat-manga-dan-anime | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/soft-power-jepang-lewat-manga-dan-anime.txt -'"
        expect_exit: 0
        retry: 0
  - id: B2
    depends_on: []
    impacts: ["chapter pages of state-of-flow and their meta descriptions - bun run build"]
    files: { create: [books/state-of-flow/diagrams], modify: [], test: [] }
    idempotency_key: "B2:state-of-flow"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book state-of-flow"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book state-of-flow --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts state-of-flow | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/state-of-flow.txt -'"
        expect_exit: 0
        retry: 0
  - id: B3
    depends_on: []
    impacts: ["chapter pages of strategi-manajemen-kelas-proaktif and their meta descriptions - bun run build"]
    files: { create: [books/strategi-manajemen-kelas-proaktif/diagrams], modify: [], test: [] }
    idempotency_key: "B3:strategi-manajemen-kelas-proaktif"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book strategi-manajemen-kelas-proaktif"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book strategi-manajemen-kelas-proaktif --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts strategi-manajemen-kelas-proaktif | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/strategi-manajemen-kelas-proaktif.txt -'"
        expect_exit: 0
        retry: 0
  - id: B4
    depends_on: []
    impacts: ["chapter pages of struktur-pasar-dan-persaingan and their meta descriptions - bun run build"]
    files: { create: [books/struktur-pasar-dan-persaingan/diagrams], modify: [], test: [] }
    idempotency_key: "B4:struktur-pasar-dan-persaingan"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book struktur-pasar-dan-persaingan"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book struktur-pasar-dan-persaingan --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts struktur-pasar-dan-persaingan | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/struktur-pasar-dan-persaingan.txt -'"
        expect_exit: 0
        retry: 0
  - id: B5
    depends_on: []
    impacts: ["chapter pages of teori-gaya-kelekatan and their meta descriptions - bun run build"]
    files: { create: [books/teori-gaya-kelekatan/diagrams], modify: [], test: [] }
    idempotency_key: "B5:teori-gaya-kelekatan"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book teori-gaya-kelekatan"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book teori-gaya-kelekatan --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts teori-gaya-kelekatan | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/teori-gaya-kelekatan.txt -'"
        expect_exit: 0
        retry: 0
  - id: B6
    depends_on: []
    impacts: ["chapter pages of teori-permainan-game-theory and their meta descriptions - bun run build"]
    files: { create: [books/teori-permainan-game-theory/diagrams], modify: [], test: [] }
    idempotency_key: "B6:teori-permainan-game-theory"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book teori-permainan-game-theory"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book teori-permainan-game-theory --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts teori-permainan-game-theory | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/teori-permainan-game-theory.txt -'"
        expect_exit: 0
        retry: 0
  - id: B7
    depends_on: []
    impacts: ["chapter pages of teori-teori-kepribadian and their meta descriptions - bun run build"]
    files: { create: [books/teori-teori-kepribadian/diagrams], modify: [], test: [] }
    idempotency_key: "B7:teori-teori-kepribadian"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book teori-teori-kepribadian"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book teori-teori-kepribadian --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts teori-teori-kepribadian | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/teori-teori-kepribadian.txt -'"
        expect_exit: 0
        retry: 0
  - id: B8
    depends_on: []
    impacts: ["chapter pages of tonsilektomi and their meta descriptions - bun run build"]
    files: { create: [books/tonsilektomi/diagrams], modify: [], test: [] }
    idempotency_key: "B8:tonsilektomi"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book tonsilektomi"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book tonsilektomi --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts tonsilektomi | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/tonsilektomi.txt -'"
        expect_exit: 0
        retry: 0
  - id: B9
    depends_on: []
    impacts: ["chapter pages of virtue-ethics-aristoteles and their meta descriptions - bun run build"]
    files: { create: [books/virtue-ethics-aristoteles/diagrams], modify: [], test: [] }
    idempotency_key: "B9:virtue-ethics-aristoteles"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book virtue-ethics-aristoteles"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book virtue-ethics-aristoteles --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts virtue-ethics-aristoteles | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/virtue-ethics-aristoteles.txt -'"
        expect_exit: 0
        retry: 0
  - id: V1
    depends_on: [B1, B2, B3, B4, B5, B6, B7, B8, B9]
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

# Diagram retrofit RF6 (inventory group g6, 9 books)

## Session checklist

- [x] S1 Plan: tasks written, runner `Validation: OK`, `Plan` gate approved; structure baselines committed under `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/`. Evidence: runner `Validation: OK`; `Plan` gate answered "Approve all five" for RF2-RF6 on 2026-10-16; baseline problem counts in book order 0, 5, 15, 4, 1, 3, 3, 0, 3
- [ ] S2 Execute: one subagent per task adds 0-3 grounded diagrams per chapter from `g6.md`, renders them, gate exit 0; parent diff audit (every block against its source lines, intro sentences listed per book) and one commit per book
- [ ] S3 Review: two standards reviewers (grounding) and one spec reviewer; findings fixed
- [ ] S4 Verify: `bun run build`, `bun test`, `bun run check:diagrams`, structure output equal to the baseline for every book
- [ ] S5 Deliver: D1 seed rerun and `db/seed.sql` committed; PR from body file, registered; `Merge` gate
- [ ] S6 Close: readiness and `Close plan` gate before the merge; after the merge issue sync, publish, registry `merged`, graphify sync

## Visual Map

```mermaid
flowchart TD
    accTitle: Task graph for diagram retrofit RF6
    accDescr: After plan approval the book tasks run in parallel, one subagent each, and an integration check closes the graph before review, seed and the pull request.
    G2{{"Gate 2: plan approved"}}
    G2 --> B1["B1 soft-power-jepang"]
    G2 --> B2["B2 state-of-flow"]
    G2 --> B3["B3 strategi-manajemen-kelas"]
    G2 --> B4["B4 struktur-pasar-dan"]
    G2 --> B5["B5 teori-gaya-kelekatan"]
    G2 --> B6["B6 teori-permainan-game"]
    G2 --> B7["B7 teori-teori-kepribadian"]
    G2 --> B8["B8 tonsilektomi"]
    G2 --> B9["B9 virtue-ethics-aristoteles"]
    B1 --> V1["V1 integration verify"]
    B2 --> V1["V1 integration verify"]
    B3 --> V1["V1 integration verify"]
    B4 --> V1["V1 integration verify"]
    B5 --> V1["V1 integration verify"]
    B6 --> V1["V1 integration verify"]
    B7 --> V1["V1 integration verify"]
    B8 --> V1["V1 integration verify"]
    B9 --> V1["V1 integration verify"]
    V1 --> PR{{"Review, seed, PR, merge gate"}}
```

## Global Constraints

- GEMINI.md section 25 governs every diagram, and its dispatch contract paragraph is pasted verbatim into every dispatch (allowed types, accTitle and accDescr in Indonesian, grounding with hedges and examples kept, placement after the paragraph with an intro sentence that differs from the book's other intros, width at most 1000 px, at most 3 per chapter, never required, no repeated scaffolding shape, `split-word` reworded).
- Candidates come from `g6.md`; a subagent may skip a weak candidate and reports why. ASCII-art diagrams named in `g6.md` are converted and the ASCII version deleted.
- Each dispatch requires, for every node and number, the exact source line, and gives a tool-call budget.
- Chapter text outside the inserted block and its one introducing sentence stays byte-identical, except a deleted ASCII-art fence that the diagram replaces.
- Structure check command: `bun run scripts/check-book-structure.ts <slug> | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/<slug>.txt -` (empty diff; the script itself exits 1 on pre-existing problems).
- The branch is never pushed before the session runs; at its start it is rebased onto the current `origin/main` (no force push needed), and its D1 seed runs from that tree.
- `tonsilektomi`: FU2 was resolved in commit 8ac278c; a pain timeline uses only the per-source statements now in chapters 08 and 10, never a merged curve.

### Task B1: soft-power-jepang-lewat-manga-dan-anime

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book soft-power-jepang-lewat-manga-dan-anime` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book soft-power-jepang-lewat-manga-dan-anime --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of soft-power-jepang-lewat-manga-dan-anime equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/soft-power-jepang-lewat-manga-dan-anime.txt` | expect: exit 0 | retry: 0

### Task B2: state-of-flow

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book state-of-flow` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book state-of-flow --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of state-of-flow equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/state-of-flow.txt` | expect: exit 0 | retry: 0

### Task B3: strategi-manajemen-kelas-proaktif

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book strategi-manajemen-kelas-proaktif` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book strategi-manajemen-kelas-proaktif --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of strategi-manajemen-kelas-proaktif equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/strategi-manajemen-kelas-proaktif.txt` | expect: exit 0 | retry: 0

### Task B4: struktur-pasar-dan-persaingan

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book struktur-pasar-dan-persaingan` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book struktur-pasar-dan-persaingan --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of struktur-pasar-dan-persaingan equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/struktur-pasar-dan-persaingan.txt` | expect: exit 0 | retry: 0

### Task B5: teori-gaya-kelekatan

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book teori-gaya-kelekatan` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book teori-gaya-kelekatan --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of teori-gaya-kelekatan equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/teori-gaya-kelekatan.txt` | expect: exit 0 | retry: 0

### Task B6: teori-permainan-game-theory

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book teori-permainan-game-theory` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book teori-permainan-game-theory --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of teori-permainan-game-theory equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/teori-permainan-game-theory.txt` | expect: exit 0 | retry: 0

### Task B7: teori-teori-kepribadian

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book teori-teori-kepribadian` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book teori-teori-kepribadian --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of teori-teori-kepribadian equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/teori-teori-kepribadian.txt` | expect: exit 0 | retry: 0

### Task B8: tonsilektomi

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book tonsilektomi` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book tonsilektomi --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of tonsilektomi equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/tonsilektomi.txt` | expect: exit 0 | retry: 0

### Task B9: virtue-ethics-aristoteles

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book virtue-ethics-aristoteles` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book virtue-ethics-aristoteles --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of virtue-ethics-aristoteles equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6/structure-baseline/virtue-ethics-aristoteles.txt` | expect: exit 0 | retry: 0

### Task V1: Integration verify

- [ ] Step 1: Run | cmd: `bun run build` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun test` | expect: exit 0 | retry: 1

## Status

- Status: Approved (`Plan` gate, 2026-10-16, together with the other retrofit plans)
- Resume: worktree above; the `Plan` gate decides whether the session runs.
