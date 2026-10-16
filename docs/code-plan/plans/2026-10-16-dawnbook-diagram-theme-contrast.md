---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-diagram-theme-contrast
status: Complete
version: 4
runner_contract: false
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-diagram-theme-contrast (pr-registry branch 2026-10-16-dawnbook-diagram-theme-contrast/dawnbook-diagram-theme-contrast)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-diagram-theme-contrast
author: Iwan Kurniawan <iwan@belajarcarabelajar.com>
coauthor_trailer: none
---

# Diagram theme contrast and per-chapter theme instability

## Report (owner, 2026-10-16)

Since the Mermaid diagrams were added, diagrams often do not contrast with the reader's selected mdBook theme, and the look is unstable across chapters (for example chapter 1 looks like a light theme and chapter 2 like a dark theme).

Classification: Bounded, systematic debugging path. Upgrades to Architectural if the cause spans the render pipeline and the page theme bootstrap.

## Checklist

- [x] P0 Feedback loop: one headless Chromium command that injects every cached SVG into an mdBook-styled page per theme and fails on low text contrast; run once with output shown (evidence: `bun docs/code-plan/spikes/2026-10-16-diagram-theme-contrast/probe.ts <variables.css>` exit 1, 1314 labels per theme, 2 below 3:1 in light and rust only, all in quadrantChart `state-of-flow/89fdb4768425.svg`; static theming holds for the rest)
- [x] P0 Feedback loop for the instability symptom: a command that shows whether the page theme or only the diagram colors change between chapters (evidence: `probe-theme-paint.ts` on the live book page with stored `navy`, exit 1, 4/4 runs painted `light` first and switched to `navy` 450 to 1000 ms later; same command on the local mdBook build without Rocket Loader, exit 0, 4/4 painted `navy` first)
- [x] P1 Minimise the repro to the load-bearing elements (evidence: live-page replay variants A/B/C/D, parent re-run: A exit 1 3/3 light-first, B exit 1 stays light, C exit 0 0/3; `diff index.html c.html` touches only lines 70 and 163, the two mdBook theme scripts)
- [x] P2 Ranked hypotheses written with predictions (evidence: H1 to H8 with predictions in `docs/code-plan/artifacts/2026-10-16-dawnbook-diagram-theme-contrast-subagent-contracts.md`, batch manifest table)
- [x] P2 Batch manifest and subagent contracts written; hypothesis chunks dispatched in one batch (evidence: same file; C1 to C10 dispatched in one message, 10 agents)
- [x] P2 Gather and synthesize; parent re-verifies each surviving claim (evidence: 10/10 reports gathered; H1 confirmed, H2 H3 H4 H7 H8 disproven, C4 C5 blocked on TinyFish sign-in; parent re-ran C1 replay A/B/C and C8 `probe-paint-aware.ts --paint-aware` exit 0, 0 of 6570 labels below 3:1)
- [x] P2 RCA log written (evidence: `docs/code-plan/artifacts/2026-10-16-dawnbook-diagram-theme-contrast-debugging-log.md`, stateDiagram-v2 loop with accTitle and accDescr, violated invariant and execution trace in section 3)
- [x] Gate: owner approves the RCA (Root cause question) (evidence: AskUserQuestion 2026-10-16: Root cause = "Approve the fix", Fix surface = "Post-build attribute", Web evidence = "Skip, measurements suffice")
- [x] P3 Regression test RED at the real seam before the fix (evidence: `bun test tests/scripts/inject-gating-theme-scripts.test.ts` exit 1 twice: first `Export named 'markThemeScriptsCfAsync' not found`, then with a no-op stub 3 pass 4 fail, `Expected "<script data-cfasync="false">" Received "<script>"`; fixture `tests/fixtures/mdbook-0.5.3-chapter.html` is an unchanged page built by mdBook v0.5.3)
- [x] P3 Smallest safe fix applied (evidence: parent diff audit, `git diff --stat` = `scripts/inject-gating.ts` +39 -1 only; `markThemeScriptsCfAsync` marks the three scripts by content, throws when a toggle page lacks one, first step of `injectSeoAndGating`)
- [x] P4 Repro GREEN, targeted suite 0 failures, check:diagrams exit 0 (evidence: new test exit 0 7/7, neighbours exit 0 32/32, V1 end to end FIXED 0/100 with CONTROL red, V5 build exit 0 with check:headings and check:diagrams exit 0; full suite's only failures are pre-existing E5 and E6, outside the changed surface)
- [x] P4 Verification fan-out: repro rerun, neighbor suite, sibling callers, 8-criteria diff review (evidence: V1 to V6 in one batch; V3 and V4 `correct`; V4's P2 fixed; table in the progress log)
- [x] Deliver: commit on the session branch, PR opened (evidence: commits `7b7e36b` fix and `dd06f90` docs by Iwan Kurniawan, copy rules clean on 2 commit messages; `gh pr create --body-file` returned PR #165, mergeable; `pr-registry pr dawnbook-diagram-theme-contrast --number 165` state open)
- [x] Sweep: session-close debt sweep, learning ledger, graphify sync (evidence: 13 debts ranked in the progress log; owner selected D1 to D4, all closed with evidence below; 9 LATER items carry `defer:` lines; ledger `docs/code-plan/artifacts/2026-10-16-dawnbook-diagram-theme-contrast-learning-ledger.md`; KEEP rules in project memory; graphify sync runs on the main checkout after the merge, because the graph is built from `main`)
- [x] FU-D1: `scripts/inject-gating.ts` guard also keys on `<!-- Book generated using mdBook -->`; tests for that page shape and for a missing quote workaround alone; RED first, then green (evidence: RED exit 1, 8 pass 1 fail "Received function did not throw"; GREEN exit 0, 9 pass; scan of 911 built pages: 853 changed by +3, 0 threw, toc.html unchanged; error text reworded to fit both guards, still 9 pass)
- [x] FU-D2: `GEMINI.md` section on Rocket Loader and first-paint checks; AGENTS.md and CLAUDE.md symlinks intact (evidence: section 26 added, +8 lines; `ls -la` shows both symlinks to GEMINI.md; `rg -c` finds the section through all three names; 0 em dashes in added lines)
- [x] FU-D3: `tests/scrape-shield.test.ts` skips with a message when `output/contribute.html` is missing; passes where the build exists (evidence: worktree exit 0, 2 pass 1 skip; same file run from the main checkout exit 0, 3 pass, 6 expect calls)
- [x] FU-D4: `tests/scripts/test_gsc_batch_indexing_ping.py` deterministic concurrency check; 5 concurrent runs pass and a sequential implementation still fails it (evidence: 5 and 20 concurrent runs all exit 0, peak 10; two sequential mutants exit 1 "1 not greater than 1"; flake cause found: mock server listen backlog 5, raised to 64; parent re-run 6 tests OK; full `bun test` exit 0, 681 pass, 27 skip, 0 fail)

## Closeout

- Readiness (2026-10-16): `bun ~/vivera/scripts/plan-closeout.mjs --readiness docs/code-plan/plans/2026-10-16-dawnbook-diagram-theme-contrast.md` exit 3, `NEEDS-HUMAN`: open NOW follow-ups 0, open step boxes 0, other open boxes 1 (the Sweep line, graphify sync pending).
- Owner decision (Close plan gate, 2026-10-16): Mark Complete. The remaining items stay in the progress-log backlog with `defer:` lines: D7 live first-paint probe after the deploy, D8 iOS Safari check, D10 issue sync from the laptop.

## State

- Status: Complete (version 4: closed by the owner on 2026-10-16; version 3 added the debt-sweep follow-ups D1 to D4; version 2 was Verification; version 1 was the Draft investigation plan before the root cause gate)
- Approved scope (owner, 2026-10-16, Root cause gate): mark mdBook's three theme scripts with `data-cfasync="false"` in the post-build pass `scripts/inject-gating.ts`, with a loud build failure when the markers are missing; regression test on a real mdBook 0.5.3 page. Rejected: early script in `head.hbs` (duplicates mdBook logic), Cloudflare rule (outside version control; owner's separate call), `index.hbs` override (GEMINI.md section 1). TinyFish web evidence skipped by owner choice.
- Completed: P0 loops, P1 minimisation, P2 hypotheses, dispatch, synthesis, RCA log, gate, P3 RED test, P3 fix
- Current: none (merge of PR #165 waits for the owner's Merge gate)
- Next: after the merge and CI deploy, D7 live probe, `plan-publish.mjs`, graphify update and sync on the main checkout
- Blockers: none
- Evidence: see docs/code-plan/artifacts/2026-10-16-dawnbook-diagram-theme-contrast-progress.md
