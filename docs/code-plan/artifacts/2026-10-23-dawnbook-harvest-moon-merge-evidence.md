# Merge and deploy evidence: book "Pelajaran Hidup dari Harvest Moon Back to Nature"

Plan: docs/code-plan/plans/2026-10-23-dawnbook-harvest-moon.md. PR #184.

| Step | Command or check | Result |
|---|---|---|
| Merge | `gh pr merge 184 --merge --match-head-commit 303b8ed` (owner approved through AskUserQuestion) | exit 0, merge commit f2162b2 |
| Post-merge gates on main f2162b2 | `bun test tests/books/pelajaran-hidup-dari-harvest-moon-back-to-nature.test.ts tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts`; `bun run scripts/check-book-structure.ts pelajaran-hidup-dari-harvest-moon-back-to-nature`; `check:covers`; `check:diagrams` | exit 0 (59 pass, 0 fail); 14 chapters, 0 problems; 0 cover violations; 0 diagram violations |
| Registry | `bun ~/vivera/scripts/pr-registry.mjs state dawnbook-harvest-moon merged` | exit 0 |
| Deploy | `bash scripts/deploy-website.sh` from main f2162b2 with `~/cloudflare/.env` sourced (owner approved) | exit 0, deployment 298c9d75.dawnbook.pages.dev, D1 binding active |
| Telegram | deploy step 5, `announce-new-books` | "announced pelajaran-hidup-dari-harvest-moon-back-to-nature" |
| D1 seed | `bun run scripts/migrate-to-d1.ts` | exit 0, "All seeds applied successfully"; `cf d1 query` returns the slug with subject_label Self-Help |
| GSC | owner OAuth token (scope webmasters), `PUT .../sites/sc-domain%3Adawnbook.belajarcarabelajar.com/sitemaps/<sitemap.xml>` | HTTP 204; GET lastSubmitted 2026-10-23T17:24:09Z, errors 0, warnings 0 |
| Live check | book index, chapter 01, chapter 02, share card, sitemap | index 200 with meta equal to the book.toml description (149 chars); chapter 01 (public preview) 200; chapter 02 401 for an anonymous visitor (gated, as designed); /og/<slug>/index.png 200; sitemap.xml lists 15 URLs of the book |
| Graphify | `graphify-sync --root <main checkout>` after the merge | exit 0, eligible docs 962 to 982, 72 nodes from this session's plan and notes; `--check` CURRENT. `graphify update .` refused to replace 18.517 nodes with 10.963 and was not forced |
