# Merge evidence: PR #145 (Soft Power Jepang Lewat Manga dan Anime)

| Step | Evidence |
|---|---|
| Merge gate | Owner answered `Merge the PR` (AskUserQuestion, 2026-10-15) with facts: head 43a08b4, base main 24648ce, MERGEABLE, local build and tests green, remote `test` check pending |
| Merge | `gh pr merge 145 --merge --match-head-commit 43a08b49628490701d4480c674cfc3bd5d56332e` -> MERGED, merge commit 86fbf58, 2026-10-15T13:19:03Z |
| Post-merge tests | `bun test` on main 86fbf58: exit 0, 465 pass, 0 fail (478 tests, 52 files) |
| Post-merge build | `bun run build` on main 86fbf58: exit 0, `Successfully built: soft-power-jepang-lewat-manga-dan-anime`, `SEO Validation passed! All rules (R1-R7)`; working tree clean afterwards |
| Plan mirror and issue | `plan-publish.mjs` published the Complete plan (source_hash 3dca7d082e2f); `plan-issue-sync.mjs` created and closed belajarcarabelajar/dawnbook#146 |
| Registry | `pr-registry.mjs state dawnbook-soft-power-manga-anime merged --repo /home/belajarcarabelajar/Proyek/dawnbook` exit 0 (note: plan.issues.json is machine-local, so the issue record was not re-read by the gate) |
| Graphify | `graphify update .` exit 1, refused to overwrite (new code graph 9,732 nodes vs existing 17,282 including document nodes), not forced; `graphify-sync.mjs --root` added the session documents (875 eligible docs, graph 17,282 -> 17,468 nodes); `--check` CURRENT |
| Deploy gate | Owner answered `Deploy, seed, reindex` (AskUserQuestion, 2026-10-15) |
| Deploy | `bash scripts/deploy-website.sh` from main 86fbf58 with `~/cloudflare/.env` sourced: exit 0, `No migrations to apply!`, `Uploaded 47 files (2698 already uploaded)`, `Deployment complete! D1 binding 'DB' is active.`, deployment 77821285 |
| Live check | book index 200 with the 154-char meta; chapter 01 (public preview) 200 with its 133-char meta; Referensi 401 for an anonymous visitor (gated chapter, expected); `/sitemap.xml` lists 14 URLs of the book |
| D1 seed | `bun run scripts/migrate-to-d1.ts` with credentials sourced: exit 0, `All seeds applied successfully.`, 0 failure lines; remote query `SELECT slug, subject_label, length(content_md) FROM books WHERE slug='soft-power-jepang-lewat-manga-dan-anime'` returns subject `Anime`, 90736 chars; the seeder regenerated db/seed.sql (+896/-118) |
| GSC reindex | Owner OAuth token (scope webmasters) from `GSC_OAUTH_*` in `~/cloudflare/.env`; `PUT .../sites/sc-domain%3Adawnbook.belajarcarabelajar.com/sitemaps/<sitemap.xml>` HTTP 204; GET 200 with lastSubmitted 2026-10-15T13:24:27Z, 0 errors, 0 warnings |

This file and the regenerated db/seed.sql are committed by a follow-up session (seed after deploy), not on main directly.
