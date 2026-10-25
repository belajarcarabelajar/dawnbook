---
schema: ultra-plan/v1
plan_id: 2026-10-25-dawnbook-audit-fixes
status: Approved
version: 1
runner_contract: true
skill: "super-ultra-code-plan (loaded through the Skill tool from ~/.claude/skills/super-ultra-code-plan/SKILL.md)"
author: Iwan Kurniawan <iwan@belajarcarabelajar.com>
coauthor_trailer: ""
defaults:
  retry_transient_max: 1
  step_timeout_s: 300
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
  require_impacts: true
  allow_no_impacts: []
  retry_if: any
tasks:
  - id: T1
    depends_on: []
    impacts: ["the decision files of all 40 triage units - python3 -I $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/validate_all.py"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T1:decisions-valid"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "python3 -I $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/validate_all.py"
        expect_exit: 0
        retry: 0
  - id: T2
    depends_on: [T1]
    impacts: ["the repository gates on a simulated tree with every valid decision applied - bash $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/sim_gates.sh"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T2:review-fixes-and-simulated-gates"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "python3 -I $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/validate_all.py"
        expect_exit: 0
        retry: 0
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bash $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/sim_gates.sh"
        expect_exit: 0
        retry: 0
        timeout_s: 600
  - id: T3
    depends_on: [T2]
    impacts: ["the chapter files and SUMMARY.md entries of 60 books in the session worktree - python3 -I $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/verify_applied.py $HOME/Proyek/dawnbook-wt/audit-fixes"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T3:apply-and-exact-diff"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "python3 -I $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/verify_applied.py $HOME/Proyek/dawnbook-wt/audit-fixes"
        expect_exit: 0
        retry: 0
        timeout_s: 600
  - id: T4
    depends_on: [T3]
    impacts: ["the diagram cache of every book whose Mermaid text changed - cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run check:diagrams"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T4:diagrams-rendered"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run diagrams:render"
        expect_exit: 0
        retry: 0
        timeout_s: 900
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run check:diagrams"
        expect_exit: 0
        retry: 0
  - id: T5
    depends_on: [T3]
    impacts: ["tests/books/neuroplastisitas-dalam-belajar.test.ts finds a section by its heading text - cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun test tests/books/neuroplastisitas-dalam-belajar.test.ts"]
    files: { create: [], modify: ["tests/books/neuroplastisitas-dalam-belajar.test.ts"], test: [] }
    idempotency_key: "T5:neuroplastisitas-test-heading"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && timeout 120 bun test tests/books/neuroplastisitas-dalam-belajar.test.ts"
        expect_exit: 0
        retry: 0
  - id: T6
    depends_on: [T4, T5]
    impacts: ["git history of 60 books, one commit each, author from book.toml - cd $HOME/Proyek/dawnbook-wt/audit-fixes && git log --format=%an%x09%s origin/2026-10-25-dawnbook-batch-audit-archive..HEAD"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T6:commit-per-book"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && git diff --quiet && git diff --cached --quiet"
        expect_exit: 0
        retry: 0
  - id: T7
    depends_on: [T6]
    impacts: ["build output, share cards and every book gate after the edits - cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run build"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T7:build-and-show"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run check:structure"
        expect_exit: 0
        retry: 0
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run check:headings"
        expect_exit: 0
        retry: 0
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run check:voice"
        expect_exit: 0
        retry: 0
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun run build"
        expect_exit: 0
        retry: 0
        timeout_s: 900
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && git diff --quiet"
        expect_exit: 0
        retry: 0
  - id: T8
    depends_on: [T7]
    impacts: ["none: the owner's judgement of the shown chapters, nothing downstream - cd $HOME/Proyek/dawnbook-wt/audit-fixes && git diff --stat origin/2026-10-25-dawnbook-batch-audit-archive...HEAD"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T8:manual-check"
    skip_if: "false"
    verify_exit: 0
  - id: T9
    depends_on: [T8]
    impacts: ["tests/books and the audit ledger in docs/audits - cd $HOME/Proyek/dawnbook-wt/audit-fixes && bun test tests/books/audit-fixes-2026-10-24.test.ts"]
    files: { create: ["tests/books/audit-fixes-2026-10-24.test.ts", "tests/books/audit-fixes-2026-10-24.data.json", "docs/audits/2026-10-24-batch-naskah/ledger.jsonl", "docs/audits/2026-10-24-batch-naskah/LEDGER.md"], modify: [], test: [] }
    idempotency_key: "T9:ledger-regression-test-red-proof"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && timeout 120 bun test tests/books/audit-fixes-2026-10-24.test.ts"
        expect_exit: 0
        retry: 0
      - cmd: "cd $HOME/Proyek/dawnbook-wt/audit-fixes && bash $HOME/.cache/tmp/dawnbook-audit-fix-scratch/tools/red_vs_base.sh"
        expect_exit: 0
        retry: 0
        timeout_s: 300
  - id: T10
    depends_on: [T9]
    impacts: ["one pull request stacked on PR 212 in the PR registry - bun ~/vivera/scripts/pr-registry.mjs order"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "T10:pull-request"
    skip_if: "false"
    verify_exit: 0
---

# Plan: apply the fixable findings of the 2026-10-24 batch audit

Status: Approved (Plan gate answered Approve and execute, 2026-10-25; Intent, Section and Spec gates earlier the same day)
Mode: test-later
Author: Iwan Kurniawan <iwan@belajarcarabelajar.com>, no trailer. Books whose `book.toml` names Kania Salsabila (psikologi-di-balik-keputusan-finansial-kita, kenapa-kebiasaan-susah-diubah, sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar and any other the file names) are committed with her identity and the `Co-authored-by: Iwan Kurniawan` trailer (GEMINI.md section 18).
Spec: `docs/code-plan/specs/2026-10-25-dawnbook-audit-fixes-design.md` (approved 2026-10-25).
Trigger: owner request 2026-10-25, "memperbaiki yang bisa diperbaiki berdasarkan hasil temuannya, mode cepat saja test diakhir".
Scope: the 4,170 findings of `docs/audits/2026-10-24-batch-naskah/`; 60 books; one stacked pull request (base: the audit archive branch of PR #212).
Non-Goals: merge, deploy, D1 seed (`db/seed.sql` embeds chapter text and stays stale until a deploy seeds it), Search Console, math fixes, code-fence edits, glossary-wide term choices, citation corrections that no record proves, new content. The DOI repair already has its own backlog entry in `2026-10-25-dawnbook-later-backlog.md`.

## Manual check

Filled at the `Manual check` gate: each note the owner makes about the shown chapters becomes `MC1`, `MC2`, ... in the owner's words, and `T9` writes one test per item.

## Checklist

- [x] T1: all 40 units have a valid decision file for every book. Evidence: `validate_all.py` exit 0, 60 books, 4,170 decisions, 3,728 edits, 0 problems (after the last unit, U38, reported).
- [ ] T2: reviewer problems resolved in the decision files (P1 and P2 fixed or the edit rejected), and the repository gates pass on the simulated tree. Evidence: reviewer reports, `sim_gates.sh` exit 0.
- [ ] T3: the same triage agents apply their decisions with the Edit tool; the exact-diff guard finds the worktree equal to the prediction. Evidence: `verify_applied.py` exit 0.
- [ ] T4: Mermaid text that changed is re-rendered; the diagram gate passes. Evidence: `check:diagrams` exit 0.
- [ ] T5: the neuroplastisitas test finds its renamed heading. Evidence: `bun test` exit 0.
- [ ] T6: one commit per book, author from `book.toml`; tree clean.
- [ ] T7: build and gates on the final tree; sample before and after pairs shown to the owner.
- [ ] T8: owner manual check; notes recorded as MC items.
- [ ] T9: ledger, regression test, RED proof against the base commit. Evidence: test exit 0 at HEAD and exit non-zero at the base.
- [ ] T10: branch pushed, one pull request opened; merge, deploy, seed and reindex asked separately.

## Visual Implementation Map

```mermaid
flowchart TD
    accTitle: Audit fixes pipeline
    accDescr: After the plan gate the decision files are validated, reviewer problems are fixed and the gates run on a simulated tree, then the decisions are applied and checked byte for byte, diagrams are re-rendered and one test is fixed in parallel, books are committed, built and shown, the owner checks by hand, tests and the ledger are written with a RED proof, and one pull request is opened.
    Gate{{"Plan gate"}} --> T1["T1: decisions valid"]
    T1 --> T2["T2: review fixes, simulated gates"]
    T2 --> T3["T3: apply, exact-diff guard"]
    T3 --> T4["T4: re-render diagrams"]
    T3 --> T5["T5: fix the quoting test"]
    T4 --> T6["T6: commit per book"]
    T5 --> T6
    T6 --> T7["T7: build and show"]
    T7 --> T8["T8: manual check"]
    T8 --> T9["T9: ledger, regression test, RED proof"]
    T9 --> T10["T10: push and open PR"]
```

## Tasks

### Task T1
Fresh run of `validate_all.py`: every decision file complete (one line per finding), every edit's `old` unique, no rule break. Triage itself (40 read-only units, 4,170 decisions, 3,728 edits) is already done and recorded in the scratch decision files.

### Task T2
Independent reviewers read the flagged decisions (adapted language, facts with outside evidence, headings, citations, removed hedges, added numbers, diagram edits) as old and new pairs and report P1, P2 and P3 problems; each P1 and P2 is fixed in the decision file by editing the line or turning it into `reject` or `backlog`. Then `sim_gates.sh` applies all valid decisions to a scratch copy and runs `check-book-structure`, `check-voice`, `check-repeated-headings` and `check-heading-colons` on it.

### Task T3
The session worktree is `~/Proyek/dawnbook-wt/audit-fixes` (branch `2026-10-25-dawnbook-audit-fixes/audit-fixes`, on top of the audit archive branch). Each triage agent applies its own `apply` and `adapt` lines in file order with the Edit tool only (GEMINI.md section 16), in the worktree, nothing else. The parent never stages or commits during this task. `verify_applied.py` compares every file with the prediction and lists any unexpected change.

### Task T4
`bun run diagrams:render` renders only the diagrams whose text changed (local Chromium; check `free -m` first), `bun run check:diagrams` must exit 0. Orphaned SVGs are pruned only with the owner's say in the PR.

### Task T5
The test `tests/books/neuroplastisitas-dalam-belajar.test.ts` finds a section with `indexOf("### Studi Supir Taksi London")`; the decision that renames that heading ("Sopir") fails 3 of its 4 tests, so the string changes in this task, in the same commit series.

### Task T6
One commit per book, `books/<slug>/src` plus `books/<slug>/diagrams` where changed, author from the book's `authors`, message `content(books): apply the audit fixes to <slug>`. No co-author trailer except for Kania Salsabila's books.

### Task T7
`check:structure`, `check:headings`, `check:voice`, then `bun run build` on the final tree; a tracked file the build rewrites (`functions/lib/built-stats.ts`, `db/seed.sql`) is restored. The owner is shown ten to fifteen before and after pairs and the gate outputs, not only the commands.

### Task T8
`Manual check` gate (`sucp-tdd-debug` 4.2). Every note becomes an MC item in the owner's words; a wrong result loops back to T3 for the affected book.

### Task T9
Tests from the notes: the ledger (`ledger.jsonl`, one line per finding with its outcome, and `LEDGER.md` with counts and the backlog), the data-driven regression test (an applied `old` string must not come back), and the RED proof: the test runs in a detached scratch worktree at the base commit and must fail there, then pass at HEAD.

### Task T10
Push with an explicit refspec (the local branch tracks nothing), open one PR with base `2026-10-25-dawnbook-batch-audit-archive` (stacked on PR #212), record it with `pr-registry pr`. Merge is asked alone; deploy, D1 seed and Search Console reindex are asked separately.

## Backlog (LATER)

Decisions marked `backlog` in the ledger: glossary-wide choices (for example "namun" or "tetapi", "Sistem 2" or "System 2"), claims that need a source, formulas, code fences, and the observations in the session notes. The DOI findings that agents noticed outside the audit belong to the existing DOI-repair backlog entry.
