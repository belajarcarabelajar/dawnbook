# Merge and deploy evidence: PR #166 (Saat Dia Suka, tapi Kamu Tidak)

| Step | Evidence |
|---|---|
| Merge gate | Owner answered `Merge PR #166` (AskUserQuestion, 2026-10-19) with facts: head f31b022, MERGEABLE, merge state UNSTABLE because remote `test` was pending, all local gates exit 0 |
| Pre-merge check | origin/main 254088f was an ancestor of the head (no rebase needed); focused tests exit 0 (70 pass, 0 fail); `check-book-structure` exit 0 |
| Merge | `gh pr merge 166 --merge --match-head-commit f31b02243c555bfa7e235d6f4504e3ab4a8c2d23` exit 0 -> MERGED, merge commit f1986ba, 2026-10-19T16:43:12Z |
| Registry | `pr-registry.mjs reconcile` recorded dawnbook-menolak-perasaan merged |
| Post-merge check | on main f1986ba: focused tests exit 0 (70 pass, 0 fail); `check-book-structure` exit 0 (13 chapters, 0 problems) |
| Plan issue | `plan-issue-sync.mjs` exit 0, created belajarcarabelajar/dawnbook#167 (plan open at that time) |
| Graphify | `graphify-sync.mjs --root` exit 0 (953 eligible docs), `--check` CURRENT; `graphify update .` had refused to overwrite earlier (code graph smaller than the graph with document nodes), not forced |
| Deploy gate | Owner answered `Deploy, seed, reindex` (AskUserQuestion, 2026-10-19) |
| Deploy | `bash scripts/deploy-website.sh` from main f1986ba with `~/cloudflare/.env` sourced: exit 0, `Successfully built: saat-dia-suka-tapi-kamu-tidak`, SEO R1-R7 passed, `No migrations to apply!`, `Uploaded 30 files (2762 already uploaded)`, `Deployment complete! D1 binding 'DB' is active.`, deployment e44910fd |
| Live check | book index 200, meta equals the book.toml description (154 chars); chapter 01 (public preview, extensionless URL) 200 with a 126-char meta; Referensi 401 for an anonymous visitor (gated, expected); `/sitemap.xml` lists 14 URLs of the book; the Hub page shows the title |
| D1 seed | `bun run scripts/migrate-to-d1.ts` with credentials sourced: exit 0, `All seeds applied successfully.`, 0 failure lines; remote query on `books` returns slug `saat-dia-suka-tapi-kamu-tidak`, subject `Hubungan`, content_md 98660 chars; the seeder regenerated db/seed.sql (+1097/-116), committed here |
| GSC reindex | Owner OAuth token (scope webmasters) from `GSC_OAUTH_*`; `PUT .../sites/sc-domain%3Adawnbook.belajarcarabelajar.com/sitemaps/<sitemap.xml>` HTTP 204; GET lastSubmitted 2026-10-19T16:46:45Z, 0 errors, 0 warnings |
