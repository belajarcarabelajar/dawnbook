# Merge evidence: dawnbook-diagrams-retrofit-5 (PR #159)

| Item | Evidence |
|---|---|
| Owner gate | `Merge` answered "Merge now" with facts shown (head d9c5a5b, local build exit 0, `bun test` 676 pass / 0 fail, check:diagrams 0, check:headings 0 under the new lead-in rule, three reviews `correct`, plan Complete, D1 seeded) |
| Merge | `gh pr merge 159 --merge --match-head-commit d9c5a5b0e91a...` exit 0; merge commit `f4ca4f6` (2026-10-16T01:36:08Z); `git diff --stat d9c5a5b origin/main` empty |
| Remote runs on `f4ca4f6` | Test: completed, success (01:36:38Z). Deploy Dawnbook: completed, success (01:36:51Z) |
| Live check | hub HTTP 200; aerodinamika ch01 (free chapter) HTTP 200 with its diagram; RF5 chapters are gated, so content was verified in the build output of the identical tree (23 inline diagrams) |
| D1 | seeded from the session tree before the merge: exit 0, 0 failure lines; `cf d1 query` finds the EWS 2008 launch sentence |
| Plan and issue | `status: Complete` committed in `d9c5a5b`; `plan-issue-sync.mjs` created and closed #160 |
| Registry | `pr-registry state dawnbook-diagrams-retrofit-5 merged` exit 0 |
