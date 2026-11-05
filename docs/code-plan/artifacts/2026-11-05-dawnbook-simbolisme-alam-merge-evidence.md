# Merge and deploy evidence: book "Simbolisme Alam dalam Sastra"

Plan: docs/code-plan/plans/2026-11-05-dawnbook-simbolisme-alam.md. PR #264. Owner request 2026-11-05: "do backlog first then do 1-4" (merge, deploy, D1 seed and GSC, mark the plan Complete).

| Step | Command or check | Result |
|---|---|---|
| Backlog L3, L4 | commit c6a95095 on the PR branch | 13 orphaned diagram SVGs pruned (`check:diagrams` 0 orphans); Referensi gains the House-Tree-Person entry |
| Backlog L2 | vivera session copy-rule-icon-file | one-emoji icon files pass the emoji rule; vivera `bun run ci:targeted` exit 0 on an NVMe copy (the HDD run timed out in an unrelated 30 s test) |
| Merge | `gh pr merge 264 --merge --match-head-commit c6a9509566c081f82cf766d7e8bc72320d4c1d46` | exit 0, merge commit ba7d99b4 |
| Post-merge gates on ba7d99b4 | `bun test tests/books/simbolisme-alam-dalam-sastra.test.ts tests/books/referensi-links.test.ts tests/books/referensi-presence.test.ts tests/scripts/check-book-structure.test.ts`; `bun run scripts/check-book-structure.ts simbolisme-alam-dalam-sastra`; `bun run check:diagrams`; `bun run check:covers --book simbolisme-alam-dalam-sastra` | exit 0 (68 pass, 0 fail); 14 chapters, 0 problems; 0 violations, 0 orphaned SVGs; 0 cover violations |
| Registry | `bun ~/vivera/scripts/pr-registry.mjs state dawnbook-simbolisme-alam merged` | exit 0 |
| Deploy | `bash scripts/deploy-website.sh` from a detached NVMe worktree at ba7d99b4, `~/cloudflare/.env` sourced, `DAWNBOOK_PREMIUM_DIR` set to the private premium checkout | exit 0 in 161 s; `No migrations to apply!`; deployment https://7a917811.dawnbook.pages.dev; `D1 binding 'DB' is active` |
| D1 seed | `bun run scripts/migrate-to-d1.ts` from the same worktree | exit 0, `All seeds applied successfully.`; `cf d1 query <dawnbook-db id>` returns slug simbolisme-alam-dalam-sastra with subject_label Sastra; the regenerated db/seed.sql ships in this closeout PR |
| Telegram | deploy step 5, `announce-new-books` | `announced simbolisme-alam-dalam-sastra.` |
| GSC | owner OAuth, `PUT .../sites/sc-domain%3Adawnbook.belajarcarabelajar.com/sitemaps/<sitemap.xml>` | first try with GSC_OAUTH_REFRESH_TOKEN: HTTP 403 (GET worked); with GSC_OAUTH_REFRESH_TOKEN_TULIS: HTTP 204, lastSubmitted 2026-11-05T09:56:19Z, errors 0, warnings 0 |
| Live check | book index, chapter 01, chapter 02, share card, sitemap | index 200 with meta equal to the book.toml description; chapter 01 (public preview) 200; chapter 02 401 for an anonymous visitor (gated, as designed); /og/simbolisme-alam-dalam-sastra/index.png 200; sitemap.xml lists 15 URLs of the book |
