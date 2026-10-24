---
schema: ultra-plan/v1
plan_id: 2026-10-24-dawnbook-voice-pass-six-books
status: Draft
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
  - id: G1
    depends_on: []
    impacts: ["shared voice guard used by every book test - bun test tests/scripts/check-voice.test.ts"]
    files: { create: [scripts/check-voice.ts, tests/scripts/check-voice.test.ts], modify: [], test: [tests/scripts/check-voice.test.ts] }
    idempotency_key: "G1:check-voice"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/check-voice.test.ts"
        expect_exit: 0
        retry: 0
  - id: B1
    depends_on: [G1]
    impacts: ["book soft-power-jepang-lewat-manga-dan-anime - bun run scripts/check-voice.ts soft-power-jepang-lewat-manga-dan-anime"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "B1:soft-power"
    skip_if: "false"
    verify_exit: 0
  - id: B2
    depends_on: [G1]
    impacts: ["book psikologi-di-balik-keputusan-finansial-kita - bun run scripts/check-voice.ts psikologi-di-balik-keputusan-finansial-kita"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "B2:keputusan-finansial"
    skip_if: "false"
    verify_exit: 0
  - id: B3
    depends_on: [G1]
    impacts: ["book kenapa-kebiasaan-susah-diubah - bun run scripts/check-voice.ts kenapa-kebiasaan-susah-diubah"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "B3:kebiasaan"
    skip_if: "false"
    verify_exit: 0
  - id: B4
    depends_on: [G1]
    impacts: ["book pengaruh-uang-terhadap-kebahagiaan - bun run scripts/check-voice.ts pengaruh-uang-terhadap-kebahagiaan"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "B4:uang"
    skip_if: "false"
    verify_exit: 0
  - id: B5
    depends_on: [G1]
    impacts: ["book kenapa-kita-suka-menunda-nunda - bun run scripts/check-voice.ts kenapa-kita-suka-menunda-nunda"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "B5:menunda"
    skip_if: "false"
    verify_exit: 0
  - id: B6
    depends_on: [G1]
    impacts: ["book saat-dia-suka-tapi-kamu-tidak - bun run scripts/check-voice.ts saat-dia-suka-tapi-kamu-tidak"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "B6:menolak"
    skip_if: "false"
    verify_exit: 0
  - id: V1
    depends_on: [B1, B2, B3, B4, B5, B6]
    impacts: ["build and deploy gate for all books - bun run build"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "V1:gates"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/check-voice.test.ts tests/books/ tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts"
        expect_exit: 0
        retry: 0
      - cmd: "bun run check:headings"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/check-repeated-headings.ts"
        expect_exit: 0
        retry: 0
      - cmd: "bun run check:diagrams"
        expect_exit: 0
        retry: 0
      - cmd: "bun run build"
        expect_exit: 0
        retry: 0
  - id: D1
    depends_on: [V1]
    impacts: ["merge order in pr.registry.json - bun ~/vivera/scripts/pr-registry.mjs order"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "D1:pull-requests"
    skip_if: "false"
    verify_exit: 0
---

# Plan: section 29 voice pass for six pipeline-written books

Status: Draft (plan only; no book text changes until the owner approves)
Author: Iwan Kurniawan <iwan@belajarcarabelajar.com>, no trailer
Classification: Architectural by size (about 70 chapters in six books plus a shared checker), Bounded in kind (the same flow as plan 2026-10-24-dawnbook-harvest-moon-voice).
Trigger: the same-class sweep after the Harvest Moon voice fix (owner selected follow-up V-N1, 2026-10-24).

## Checklist

- [x] Measure: per-chapter scaffold score for all 60 books (patterns: "Kalau dipikir-pikir", "menurut studi/penelitian/riset/data/laporan/survei", a study or report as the subject of "menunjukkan/menemukan/mencatat/menyebut", "bab berikutnya", "Menariknya", "Perhatikan"). Evidence: one-off scan 2026-10-24, median 0.25 per chapter; the six books below score 1.3 to 2.8.
- [ ] Plan gate: owner approves this plan (one PR per book, or one PR for all six).
- [ ] G1: shared checker `scripts/check-voice.ts` with tests (RED first), caps from GEMINI.md section 29.
- [ ] B1-B6: one book per task; each fans out to chapter rewriters under the section 29 dispatch paragraph and the rewriting-never-adds rule, then a parent audit and two reviewers (facts old versus new, and voice).
- [ ] V1: gates and build.
- [ ] D1: PRs; merge, deploy and D1 seed asked separately per PR.

## 1. Books in scope

| Task | Book | Content chapters | Score per chapter | Dominant pattern |
|---|---|---|---|---|
| B1 | soft-power-jepang-lewat-manga-dan-anime | 12 | 2.8 | "menurut ..." 18, "bab berikutnya" 10 |
| B2 | psikologi-di-balik-keputusan-finansial-kita | 12 | 2.1 | "bab berikutnya" 16, "Perhatikan" 9 |
| B3 | kenapa-kebiasaan-susah-diubah | 11 | 2.0 | "bab berikutnya" 16 |
| B4 | pengaruh-uang-terhadap-kebahagiaan | 11 | 1.6 | "bab berikutnya" 10 |
| B5 | kenapa-kita-suka-menunda-nunda | 11 | 1.5 | "bab berikutnya" 11 |
| B6 | saat-dia-suka-tapi-kamu-tidak | 12 | 1.3 | mixed |

The scan counts surface scaffolds only. Each book is also read by the parent before its rewrite starts, and a book that already reads as the author's own essay gets a light pass (bridges and stock connectors only) instead of a full rewrite. That decision is recorded per book.

## 2. Visual Implementation Map

```mermaid
flowchart TD
    accTitle: Voice pass plan for six books
    accDescr: A shared voice checker is built test-first, six book rewrites run on disjoint books, then the gates and the pull requests follow.
    G{{"Plan gate: owner approval"}}
    G1["G1: shared voice checker"] --> B1["B1: soft-power"]
    G1 --> B2["B2: keputusan finansial"]
    G1 --> B3["B3: kebiasaan"]
    G1 --> B4["B4: uang dan kebahagiaan"]
    G1 --> B5["B5: menunda-nunda"]
    G1 --> B6["B6: saat dia suka"]
    B1 --> V1["V1: gates and build"]
    B2 --> V1
    B3 --> V1
    B4 --> V1
    B5 --> V1
    B6 --> V1
    V1 --> D1["D1: pull requests"]
    D1 --> DONE(["Verify tail: merge, deploy, seed asked per PR"])
```

## 3. Tasks

### Task G1
Move the Harvest Moon book test's caps into `scripts/check-voice.ts` (CLI: one slug or all books, exit 1 on a violation, report counts per chapter) with `tests/scripts/check-voice.test.ts` (fixture positive and negative controls for every cap; RED before the script exists). The Harvest Moon test then imports it. Not wired into `bun run build` until every book passes (backlog V-L1 of plan 2026-10-24-dawnbook-harvest-moon-voice).

### Task B1
Voice pass for soft-power-jepang-lewat-manga-dan-anime: parent read, rewrite decision, chapter rewriters, parent audit against the pre-rewrite copy, two reviewers, `bun run scripts/check-voice.ts <slug>` exit 0, book test exit 0.

### Task B2
Same as B1 for psikologi-di-balik-keputusan-finansial-kita.

### Task B3
Same as B1 for kenapa-kebiasaan-susah-diubah.

### Task B4
Same as B1 for pengaruh-uang-terhadap-kebahagiaan.

### Task B5
Same as B1 for kenapa-kita-suka-menunda-nunda.

### Task B6
Same as B1 for saat-dia-suka-tapi-kamu-tidak (author Kania Salsabila: commits follow GEMINI.md section 18, Kania as author with the Iwan co-author trailer).

### Task V1
Gates in run[].

### Task D1
PRs through pr-registry; merge, deploy, D1 seed and GSC asked separately.

## Assumptions and risks

- Fan-out stays at about 7 subagents at a time; a subagent session limit was hit once on 2026-10-23.
- Rewrites may drop facts but never add them (GEMINI.md section 29 rule 6); the parent audit and reviewers compare old and new text.
- Rollback per book: revert that book's PR.
