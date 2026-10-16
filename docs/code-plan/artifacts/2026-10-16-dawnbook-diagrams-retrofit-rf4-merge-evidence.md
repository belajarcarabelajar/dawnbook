# Merge evidence: dawnbook-diagrams-retrofit-4 (PR #158)

| Item | Evidence |
|---|---|
| Owner gate | `Merge` answered "Merge after CI green" with facts shown (head 755a44e, local build exit 0, `bun test` 675 pass / 0 fail, check:diagrams 0, 33 inline diagrams, four reviews `correct`, RF4 and RF3 plans kept open, D1 seeded) |
| Remote check before the merge (reported, not adopted) | `gh pr checks 158 --watch`: `test` pass in 25 s |
| Merge | `gh pr merge 158 --merge --match-head-commit 755a44e40b03...` exit 0; merge commit `8ee5def` (2026-10-16T01:23:44Z); `git diff --stat 755a44e origin/main` empty |
| Remote runs on `8ee5def` | Test: completed, success. Deploy Dawnbook: completed, success |
| Live check | hub HTTP 200; the changed chapters are gated, so content was verified in the build output of the identical tree (33 inline diagrams, 0 raw mermaid fences) |
| D1 | seeded from the session tree before the merge: exit 0, 0 failure lines; 33 mermaid blocks; the dopamin ch02 sentence fix present |
| Plan | kept open by the owner (readiness NEEDS-HUMAN from sentinel tasks only) |
| Registry | `pr-registry state dawnbook-diagrams-retrofit-4 merged --allow-open-plan` exit 0 |
