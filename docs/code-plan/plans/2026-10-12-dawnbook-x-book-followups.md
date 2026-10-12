---
schema: ultra-plan/v1
plan_id: 2026-10-12-dawnbook-x-book-followups
status: Approved
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
parent_plan: docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md
sessions: "dawnbook-seed-after-x-book (A), dawnbook-ci-deploy-fix (B, depends on A)"
author: Iwan Kurniawan <iwan@belajarcarabelajar.com>
coauthor_trailer: none
defaults:
  retry_transient_max: 1
  step_timeout_s: 600
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
  require_impacts: true
  allow_no_impacts: []
  retry_if: any
tasks:
  - id: A1
    depends_on: []
    impacts: ["db/seed.sql consumers (fresh D1 bootstrap) - bun test", "build output - bun run build"]
    files: { create: [], modify: [db/seed.sql], test: [] }
    idempotency_key: "A1:seed-sql"
    skip_if: "false"
    verify_exit: 0
  - id: A2
    depends_on: [A1]
    impacts: ["session record of PR #140 - docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md checklist and backlog"]
    files: { create: [docs/code-plan/artifacts/2026-10-12-dawnbook-memahami-algoritma-x-merge-evidence.md], modify: [docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md], test: [] }
    idempotency_key: "A2:merge-evidence"
    skip_if: "false"
    verify_exit: 0
  - id: B1
    depends_on: [A2]
    impacts: ["every push to main runs Deploy Dawnbook - gh run list --workflow deploy.yml"]
    files: { create: [], modify: [.github/workflows/deploy.yml], test: [] }
    idempotency_key: "B1:deploy-workflow"
    skip_if: "false"
    verify_exit: 0
---

# Plan: follow-ups after PR #140 (Memahami Algoritma X untuk Pembaca)

Status: Approved (owner selected these follow-ups in the debt sweep of session dawnbook-mengatur-bacaan-x, 2026-10-12)

## Checklist

- [x] A1: regenerated db/seed.sql from the 2026-10-12 D1 seed committed on session A's branch, byte-identical to the seeder output. Evidence: sha256 main checkout = worktree = f0ae9cfac7d06215...; main checkout restored with `git checkout -- db/seed.sql` after the copy (status clean).
- [x] A2: merge evidence of PR #140 committed; parent plan M1 ticked with evidence; two post-merge debts recorded in the parent backlog. Evidence: evidence file moved into the worktree; parent plan M1 `[x]` with pointer; backlog L8 and L9 added.
- [x] A-verify: bun test 0 fail and bun run build exit 0 on session A's branch. Evidence: `bun install --frozen-lockfile` exit 0; `bun test` 427 pass 0 fail on two consecutive runs (a first run showed 1 unidentified failure that did not reproduce; recorded in the PR body); `bun run check:headings` exit 0; `bun run build` exit 0, SEO R1-R7 passed; runner `Validation: OK`.
- [ ] A-deliver: PR opened with --body-file, registered, merged after the owner's merge gate
- [ ] B1: .github/workflows/deploy.yml no longer uses the unresolvable cloudflare/pages-action and deploys with the same command as scripts/deploy-website.sh
- [ ] B-verify: workflow YAML parses, the replacement action version exists upstream, required secret names exist
- [ ] B-deliver: PR opened, registered, merged after the owner's merge gate; first Deploy Dawnbook run on main observed

## Visual Implementation Map

```mermaid
flowchart LR
    accTitle: Follow-ups after PR 140
    accDescr: Session A commits the seed file and merge evidence; session B, which depends on A, fixes the deploy workflow and closes this plan before its merge.
    A1["A1: seed.sql"] --> A2["A2: merge evidence"]
    A2 --> B1["B1: deploy workflow"]
```

## Tasks

### Task A1
Copy db/seed.sql from the main checkout (written by `bun run scripts/migrate-to-d1.ts` on 2026-10-12) into session A's worktree; verify sha256 equality; then restore the main checkout's copy so it can fast-forward.

### Task A2
Move the merge evidence file into the worktree, tick M1 in the parent plan with a pointer to it, and add the two post-merge debts (plan issue mapping for dawnbook, broken deploy workflow) to the parent backlog with the sessions that address them.

### Task B1
Replace the `cloudflare/pages-action@v1` step with the official Wrangler action running `pages deploy output --project-name=dawnbook --branch=main --commit-dirty=true`, matching scripts/deploy-website.sh. Verify inputs against the action's own documentation before editing.
