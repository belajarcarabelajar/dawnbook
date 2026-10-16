---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-diagrams-retrofit-rf2
status: Approved
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-diagrams-retrofit-2 (branch 2026-10-16-dawnbook-diagrams-retrofit-rf2/dawnbook-diagrams-retrofit-2)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-diagrams-retrofit-2
parent_plan: docs/code-plan/plans/2026-10-16-dawnbook-mermaid-diagrams.md
inventory: docs/code-plan/artifacts/2026-10-16-mermaid-inventory/g2.md
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
    impacts: ["chapter pages of filosofi-stoikisme and their meta descriptions - bun run build"]
    files: { create: [books/filosofi-stoikisme/diagrams], modify: [], test: [] }
    idempotency_key: "B1:filosofi-stoikisme"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book filosofi-stoikisme"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book filosofi-stoikisme --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts filosofi-stoikisme | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/filosofi-stoikisme.txt -'"
        expect_exit: 0
        retry: 0
  - id: B2
    depends_on: []
    impacts: ["chapter pages of fungsi-manajemen-poac and their meta descriptions - bun run build"]
    files: { create: [books/fungsi-manajemen-poac/diagrams], modify: [], test: [] }
    idempotency_key: "B2:fungsi-manajemen-poac"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book fungsi-manajemen-poac"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book fungsi-manajemen-poac --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts fungsi-manajemen-poac | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/fungsi-manajemen-poac.txt -'"
        expect_exit: 0
        retry: 0
  - id: B3
    depends_on: []
    impacts: ["chapter pages of gegar-budaya and their meta descriptions - bun run build"]
    files: { create: [books/gegar-budaya/diagrams], modify: [], test: [] }
    idempotency_key: "B3:gegar-budaya"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book gegar-budaya"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book gegar-budaya --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts gegar-budaya | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/gegar-budaya.txt -'"
        expect_exit: 0
        retry: 0
  - id: B4
    depends_on: []
    impacts: ["chapter pages of geopolitik-dalam-sejarah-piala-dunia and their meta descriptions - bun run build"]
    files: { create: [books/geopolitik-dalam-sejarah-piala-dunia/diagrams], modify: [], test: [] }
    idempotency_key: "B4:geopolitik-dalam-sejarah-piala-dunia"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book geopolitik-dalam-sejarah-piala-dunia"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book geopolitik-dalam-sejarah-piala-dunia --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts geopolitik-dalam-sejarah-piala-dunia | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/geopolitik-dalam-sejarah-piala-dunia.txt -'"
        expect_exit: 0
        retry: 0
  - id: B5
    depends_on: []
    impacts: ["chapter pages of human-capital-theory and their meta descriptions - bun run build"]
    files: { create: [books/human-capital-theory/diagrams], modify: [], test: [] }
    idempotency_key: "B5:human-capital-theory"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book human-capital-theory"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book human-capital-theory --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts human-capital-theory | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/human-capital-theory.txt -'"
        expect_exit: 0
        retry: 0
  - id: B6
    depends_on: []
    impacts: ["chapter pages of kecerdasan-interpersonal and their meta descriptions - bun run build"]
    files: { create: [books/kecerdasan-interpersonal/diagrams], modify: [], test: [] }
    idempotency_key: "B6:kecerdasan-interpersonal"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book kecerdasan-interpersonal"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book kecerdasan-interpersonal --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts kecerdasan-interpersonal | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kecerdasan-interpersonal.txt -'"
        expect_exit: 0
        retry: 0
  - id: B7
    depends_on: []
    impacts: ["chapter pages of kenapa-kebiasaan-susah-diubah and their meta descriptions - bun run build"]
    files: { create: [books/kenapa-kebiasaan-susah-diubah/diagrams], modify: [], test: [] }
    idempotency_key: "B7:kenapa-kebiasaan-susah-diubah"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book kenapa-kebiasaan-susah-diubah"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book kenapa-kebiasaan-susah-diubah --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts kenapa-kebiasaan-susah-diubah | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kenapa-kebiasaan-susah-diubah.txt -'"
        expect_exit: 0
        retry: 0
  - id: B8
    depends_on: []
    impacts: ["chapter pages of kenapa-kita-gampang-percaya-hoax and their meta descriptions - bun run build"]
    files: { create: [books/kenapa-kita-gampang-percaya-hoax/diagrams], modify: [], test: [] }
    idempotency_key: "B8:kenapa-kita-gampang-percaya-hoax"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book kenapa-kita-gampang-percaya-hoax"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book kenapa-kita-gampang-percaya-hoax --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts kenapa-kita-gampang-percaya-hoax | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kenapa-kita-gampang-percaya-hoax.txt -'"
        expect_exit: 0
        retry: 0
  - id: B9
    depends_on: []
    impacts: ["chapter pages of kenapa-kita-suka-menunda-nunda and their meta descriptions - bun run build"]
    files: { create: [books/kenapa-kita-suka-menunda-nunda/diagrams], modify: [], test: [] }
    idempotency_key: "B9:kenapa-kita-suka-menunda-nunda"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun run scripts/check-diagrams.ts --book kenapa-kita-suka-menunda-nunda"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/render-diagrams.ts --book kenapa-kita-suka-menunda-nunda --check"
        expect_exit: 0
        retry: 0
      - cmd: "bash -c 'bun run scripts/check-book-structure.ts kenapa-kita-suka-menunda-nunda | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kenapa-kita-suka-menunda-nunda.txt -'"
        expect_exit: 0
        retry: 0
  - id: X1
    depends_on: []
    impacts: ["the diagram gate inside bun run build for every book with diagrams - bun run check:diagrams"]
    files: { create: [], modify: [scripts/check-diagrams.ts], test: [tests/scripts/check-diagrams.test.ts] }
    idempotency_key: "X1:split-word-coverage"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/check-diagrams.test.ts"
        expect_exit: 0
        retry: 0
      - cmd: "bun run check:diagrams"
        expect_exit: 0
        retry: 0
  - id: V1
    depends_on: [B1, B2, B3, B4, B5, B6, B7, B8, B9, X1]
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

# Diagram retrofit RF2 (inventory group g2, 9 books)

## Session checklist

- [ ] S0 Carry-over from RF1: commit `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf1-merge-evidence.md` and tick S5 and S6 of the RF1 plan with a pointer to it
- [x] S1 Plan: tasks written, runner `Validation: OK`, `Plan` gate approved; structure baselines committed under `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/`. Evidence: runner `Validation: OK`; `Plan` gate answered "Approve all five" for RF2-RF6 on 2026-10-16; baseline problem counts in book order 0, 6, 5, 3, 16, 6, 1, 1, 0
- [ ] S2 Execute: one subagent per task adds 0-3 grounded diagrams per chapter from `g2.md`, renders them, gate exit 0; parent diff audit (every block against its source lines, intro sentences listed per book) and one commit per book
- [ ] S3 Review: two standards reviewers (grounding) and one spec reviewer; findings fixed
- [ ] S4 Verify: `bun run build`, `bun test`, `bun run check:diagrams`, structure output equal to the baseline for every book
- [ ] S5 Deliver: D1 seed rerun and `db/seed.sql` committed; PR from body file, registered; `Merge` gate
- [ ] S6 Close: readiness and `Close plan` gate before the merge; after the merge issue sync, publish, registry `merged`, graphify sync

## Visual Map

```mermaid
flowchart TD
    accTitle: Task graph for diagram retrofit RF2
    accDescr: After plan approval the book tasks run in parallel, one subagent each, and an integration check closes the graph before review, seed and the pull request.
    G2{{"Gate 2: plan approved"}}
    G2 --> B1["B1 filosofi-stoikisme"]
    G2 --> B2["B2 fungsi-manajemen-poac"]
    G2 --> B3["B3 gegar-budaya"]
    G2 --> B4["B4 geopolitik-dalam-sejarah"]
    G2 --> B5["B5 human-capital-theory"]
    G2 --> B6["B6 kecerdasan-interpersonal"]
    G2 --> B7["B7 kenapa-kebiasaan-susah"]
    G2 --> B8["B8 kenapa-kita-gampang"]
    G2 --> B9["B9 kenapa-kita-suka"]
    G2 --> X1["X1 split-word coverage"]
    B1 --> V1["V1 integration verify"]
    B2 --> V1["V1 integration verify"]
    B3 --> V1["V1 integration verify"]
    B4 --> V1["V1 integration verify"]
    B5 --> V1["V1 integration verify"]
    B6 --> V1["V1 integration verify"]
    B7 --> V1["V1 integration verify"]
    B8 --> V1["V1 integration verify"]
    B9 --> V1["V1 integration verify"]
    X1 --> V1["V1 integration verify"]
    V1 --> PR{{"Review, seed, PR, merge gate"}}
```

## Global Constraints

- GEMINI.md section 25 governs every diagram, and its dispatch contract paragraph is pasted verbatim into every dispatch (allowed types, accTitle and accDescr in Indonesian, grounding with hedges and examples kept, placement after the paragraph with an intro sentence that differs from the book's other intros, width at most 1000 px, at most 3 per chapter, never required, no repeated scaffolding shape, `split-word` reworded).
- Candidates come from `g2.md`; a subagent may skip a weak candidate and reports why. ASCII-art diagrams named in `g2.md` are converted and the ASCII version deleted.
- Each dispatch requires, for every node and number, the exact source line, and gives a tool-call budget.
- Chapter text outside the inserted block and its one introducing sentence stays byte-identical, except a deleted ASCII-art fence that the diagram replaces.
- Structure check command: `bun run scripts/check-book-structure.ts <slug> | diff docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/<slug>.txt -` (empty diff; the script itself exits 1 on pre-existing problems).
- The branch is never pushed before the session runs; at its start it is rebased onto the current `origin/main` (no force push needed), and its D1 seed runs from that tree.

### Task B1: filosofi-stoikisme

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book filosofi-stoikisme` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book filosofi-stoikisme --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of filosofi-stoikisme equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/filosofi-stoikisme.txt` | expect: exit 0 | retry: 0

### Task B2: fungsi-manajemen-poac

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book fungsi-manajemen-poac` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book fungsi-manajemen-poac --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of fungsi-manajemen-poac equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/fungsi-manajemen-poac.txt` | expect: exit 0 | retry: 0

### Task B3: gegar-budaya

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book gegar-budaya` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book gegar-budaya --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of gegar-budaya equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/gegar-budaya.txt` | expect: exit 0 | retry: 0

### Task B4: geopolitik-dalam-sejarah-piala-dunia

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book geopolitik-dalam-sejarah-piala-dunia` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book geopolitik-dalam-sejarah-piala-dunia --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of geopolitik-dalam-sejarah-piala-dunia equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/geopolitik-dalam-sejarah-piala-dunia.txt` | expect: exit 0 | retry: 0

### Task B5: human-capital-theory

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book human-capital-theory` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book human-capital-theory --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of human-capital-theory equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/human-capital-theory.txt` | expect: exit 0 | retry: 0

### Task B6: kecerdasan-interpersonal

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book kecerdasan-interpersonal` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book kecerdasan-interpersonal --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of kecerdasan-interpersonal equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kecerdasan-interpersonal.txt` | expect: exit 0 | retry: 0

### Task B7: kenapa-kebiasaan-susah-diubah

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book kenapa-kebiasaan-susah-diubah` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book kenapa-kebiasaan-susah-diubah --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of kenapa-kebiasaan-susah-diubah equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kenapa-kebiasaan-susah-diubah.txt` | expect: exit 0 | retry: 0

### Task B8: kenapa-kita-gampang-percaya-hoax

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book kenapa-kita-gampang-percaya-hoax` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book kenapa-kita-gampang-percaya-hoax --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of kenapa-kita-gampang-percaya-hoax equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kenapa-kita-gampang-percaya-hoax.txt` | expect: exit 0 | retry: 0

### Task B9: kenapa-kita-suka-menunda-nunda

- [ ] Step 1: Run | cmd: `bun run scripts/check-diagrams.ts --book kenapa-kita-suka-menunda-nunda` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run scripts/render-diagrams.ts --book kenapa-kita-suka-menunda-nunda --check` | expect: exit 0 | retry: 0
- [ ] Step 3: Run | cmd: structure output of kenapa-kita-suka-menunda-nunda equals `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf2/structure-baseline/kenapa-kita-suka-menunda-nunda.txt` | expect: exit 0 | retry: 0

### Task X1: split-word coverage (RF1 backlog)

Acceptance: `split-word` also checks label text that sequence diagrams and timelines wrap into several lines, reports a cut piece that ends in punctuation ("/media/usb/" then "data.txt"), and reads the wrap width for its message from `scripts/diagrams/render-config.json` instead of a constant; test first, the real books stay at 0 violations.

- [ ] Step 1: Run | cmd: `bun test tests/scripts/check-diagrams.test.ts` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun run check:diagrams` | expect: exit 0 | retry: 0

### Task V1: Integration verify

- [ ] Step 1: Run | cmd: `bun run build` | expect: exit 0 | retry: 0
- [ ] Step 2: Run | cmd: `bun test` | expect: exit 0 | retry: 1

## Status

- Status: Approved (`Plan` gate, 2026-10-16, together with the other retrofit plans)
- Resume: worktree above; the `Plan` gate decides whether the session runs.
