# Merge evidence: dawnbook-diagrams-retrofit-2 (PR #155)

| Item | Evidence |
|---|---|
| Owner gate | `Merge` answered "Merge now" with facts shown (head 0627e34, local build exit 0, `bun test` 674 pass / 0 fail, check:diagrams 0, three reviews `correct`, plan Complete, D1 seeded) |
| Merge | `gh pr merge 155 --merge --match-head-commit 0627e340f928...` exit 0; merge commit `741ea78` (2026-10-16T00:54:54Z); `git diff --stat 0627e34 origin/main` empty |
| Remote runs on `741ea78` | Test: completed, success. Deploy Dawnbook: completed, success |
| Live check | hub HTTP 200; filosofi-stoikisme ch02 answers 401 to an anonymous client (gated), so its content was verified in the build output of the identical tree (23 inline diagrams) |
| D1 | seeded from the session tree before the merge: exit 0, 58 books, 0 failure lines; `cf d1 query`: 23 mermaid blocks across the nine books |
| Plan and issue | `status: Complete` committed in `0627e34`; `plan-issue-sync.mjs` created and closed #156 |
| Registry | `pr-registry state dawnbook-diagrams-retrofit-2 merged` exit 0 |
| Graphify | synced once at the end of the retrofit series (RF6) |

S5 and S6 of the RF2 plan are ticked in this PR with a pointer to this file.
