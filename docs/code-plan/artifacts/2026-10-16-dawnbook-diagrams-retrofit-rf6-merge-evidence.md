# Merge evidence: dawnbook-diagrams-retrofit-6 (PR #161), end of the RF1-RF6 series

| Item | Evidence |
|---|---|
| Owner gate | `Merge` answered "Merge after CI green" with facts shown (head cbff859, local build exit 0, `bun test` 685 pass / 0 fail, check:diagrams 0, check:headings 0, four reviews `correct`, plan kept open, D1 seeded) |
| Remote check before the merge (reported, not adopted) | `gh pr checks 161 --watch`: `test` pass in 23 s |
| Merge | `gh pr merge 161 --merge --match-head-commit cbff859b3a7a...` exit 0; merge commit `94d7ebb` (2026-10-16T02:02:49Z); `git diff --stat cbff859 origin/main` empty |
| Remote runs on `94d7ebb` | Test: completed, success. Deploy Dawnbook: completed, success |
| Live check | hub HTTP 200; aerodinamika ch01 (free chapter) shows 1 inline diagram; the RF6 chapters are gated, so content was verified in the build output of the identical tree (23 inline diagrams) |
| D1 | seeded from the session tree after the last content fix: exit 0, 0 failure lines |
| Plans and issues | RF3, RF4 and RF6 kept open by the owner; `plan-issue-sync.mjs` created open issues #162, #163 and #164 so they stay visible |
| Registry | `pr-registry state dawnbook-diagrams-retrofit-6 merged --allow-open-plan` exit 0 |
| Graphify | backup of graph.json, `graphify update . --force` exit 0, `graphify-sync.mjs --root` and `--check`: CURRENT, 926 eligible docs; nodes before and after: semantic 37 to 56, concept 40 to 43, code 670 to 957, document 16983 to 17273 (nothing lost); `graphify query "split-word rule check diagrams"` returns `splitWords()` and `wrappedItems()` |

This file is untracked in the main checkout; the next session commits it and ticks S5 and S6 of the RF6 plan.
