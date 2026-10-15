# Merge evidence: dawnbook-mermaid-diagrams (PR #148)

| Item | Evidence |
|---|---|
| PR | https://github.com/belajarcarabelajar/dawnbook/pull/148, merged 2026-10-16 (GitHub timestamp 2026-10-15T22:14:28Z) with `gh pr merge 148 --merge --match-head-commit 04c3fec96eaaa37e94f898e363b9831542371f5c`, exit 0; merge commit `9229357` |
| Owner gate | `Merge` question answered "Merge sekarang" with facts shown: head 04c3fec, MERGEABLE, remote `test` check pending at the time, local build exit 0, `bun test` 658 pass / 0 fail, review verdict correct |
| Pre-merge order | `pr-registry order`: no session blocks it; `surface`: rebase advice is registry-wide; `git rev-list --count HEAD..origin/main` = 0, so no rebase was needed |
| Post-merge local check | merged tree equals the verified head (`git diff --stat HEAD origin/main` empty); `bun run check:diagrams` 0 violations; `bun test` 658 pass, 13 skip, 0 fail, exit 0 |
| Remote runs on `9229357` (reported, not adopted as verification) | Test: completed, success. Deploy Dawnbook: completed, success |
| Post-deploy check | `curl` of https://dawnbook.belajarcarabelajar.com/books/iklan-digital-dan-penargetan-algoritma/content/01_pengantar-era-periklanan-digital: HTTP 200, 1 `class="dawnbook-diagram"`, 1 `aria-roledescription="timeline"`, 0 `foreignobject`, meta description is the chapter opener |
| Plan | `status: Complete` committed in `04c3fec` before the merge, with the readiness record (`NEEDS-HUMAN`, 0 open NOW items, 0 open step boxes; owner chose Mark Complete) |
| Plan mirror and issue | `plan-publish.mjs` published (source_hash a64ab30b553d); `plan-issue-sync.mjs` created and closed belajarcarabelajar/dawnbook#149 |
| Registry | `pr-registry.mjs state dawnbook-mermaid-diagrams merged --repo <worktree>` exit 0 (note: 1 open box outside task sections, S10, closed by the graphify step below) |
| Graphify | `graphify update .` exit 1, refused to overwrite (new code graph 10,104 nodes vs existing 17,468 including document nodes), not forced, same as the 2026-10-15 session; `graphify-sync.mjs --root` added the session documents (894 eligible docs, nodes 17,468 -> 17,589); `--check` CURRENT; `graphify query "Mermaid diagram cache key render"` returns the session research notes |

## Open after the merge

- S10 in the plan (sweep, ledger, closeout, graphify) is done per the rows above; its box stays unticked in the merged plan because ticking it alone would need a status-only PR. The next session's PR ticks it with a pointer to this file.
- The D1 `content_md` of the two pilot books still holds the pre-diagram Markdown; only `/api/books/<slug>` JSON exposes it. `defer: the next seed PR (bun run scripts/migrate-to-d1.ts with credentials sourced), or RF1, whichever comes first`.
- Code graph nodes for the new scripts are missing until `graphify update . --force` is run deliberately. `defer: owner decides whether forcing the code rebuild is safe for this graph`.
- This file is untracked in the main checkout; the next session commits it.
