# Merge evidence: dawnbook-diagrams-retrofit-1 (PR #153)

| Item | Evidence |
|---|---|
| Owner gate | `Merge` question answered "Merge after CI green" with facts shown (head 39f79ac, MERGEABLE, remote `test` pending, local build exit 0, `bun test` 665 pass / 0 fail, check:diagrams 0 violations, three reviews `correct`, plan Complete, D1 already seeded) |
| Remote check before the merge (reported, not adopted) | `gh pr checks 153 --watch`: `test` pass in 31 s |
| Merge | `gh pr merge 153 --merge --match-head-commit 39f79ac243d0...`, exit 0; merge commit `bf8a9a4` (GitHub timestamp 2026-10-16T00:09:14Z); `git diff --stat 39f79ac origin/main` empty, so the merged tree is the verified head |
| Remote runs on `bf8a9a4` | Test: completed, success. Deploy Dawnbook: completed, success |
| Live check | `curl` of `/books/aerodinamika-dan-desain-airfoil/content/01_pengantar-aerodinamika-pesawat-terbang` (a free chapter): HTTP 200, 1 `class="dawnbook-diagram"`, 0 `foreignObject`, the reworded label "mengimbangi" present and no "menyeimbangk" row; the digital-minimalisme ch02 and arsitektur-kernel-linux ch12 pages answer 401 to an anonymous client (gated), so their content was verified in the build output of the identical tree |
| D1 | seeded twice from the session tree before the merge (exit 0 each, 58 books); `cf d1 query` per book: mermaid block count equals the source (27), "Sering kali terjebak dalam upah rendah", "tumpang tindih di dalam RAM" and "Biaya Masa Depan" present |
| Plan | `status: Complete` committed in `39f79ac` before the merge, with the readiness record (`NEEDS-HUMAN`, 0 open NOW items, 0 open step boxes; owner chose Mark Complete) |
| Plan mirror and issue | `plan-publish.mjs` current (SKIPPED-IDEMPOTENT after the merge); `plan-issue-sync.mjs` created and closed belajarcarabelajar/dawnbook#154 |
| Registry | `pr-registry.mjs state dawnbook-diagrams-retrofit-1 merged` exit 0 (note: S5 and S6 are open boxes outside task sections; this file is their evidence) |
| Main checkout | fast-forwarded to `bf8a9a4` |
| Graphify | `graphify update .` exit 1, refused to overwrite (code graph 10,185 nodes vs existing 17,646 including document nodes), not forced, same as the earlier diagram sessions; `graphify-sync.mjs --root` then `--check`: CURRENT, 905 eligible docs, 905 document nodes |

## Open after the merge

- S5 and S6 in the merged plan stay unticked because ticking them alone would need a status-only PR; the next session's PR ticks them with a pointer to this file.
- Code graph nodes for `scripts/check-diagrams.ts` changes are missing until `graphify update . --force` is run deliberately. `defer: owner decides whether forcing the code rebuild is safe for this graph`
- This file is untracked in the main checkout; the next session commits it.
