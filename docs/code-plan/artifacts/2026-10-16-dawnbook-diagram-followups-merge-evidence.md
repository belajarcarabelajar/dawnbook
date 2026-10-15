# Merge evidence: dawnbook-diagram-followups (PR #150) and the D1 seed

| Item | Evidence |
|---|---|
| Owner gate | `Merge` question answered "Merge setelah CI hijau" with facts shown (head ad4ff46, MERGEABLE, remote `test` pending, local build exit 0, `bun test` 658 pass / 0 fail, fact review `correct`) |
| Remote check before the merge (reported, not adopted) | `gh pr checks 150 --watch`: `test` pass in 23 s |
| Merge | `gh pr merge 150 --merge --match-head-commit ad4ff46...`, exit 0; merge commit `0300e07`; merged tree identical to the verified head (`git diff --stat HEAD origin/main` empty) |
| Remote runs on `0300e07` | Test: completed, success. Deploy Dawnbook: completed, success |
| Live check | the four changed chapters are gated: `curl` with an anonymous client and with a spoofed Googlebot user agent both return HTTP 401 (the middleware verifies real crawlers, so a spoofed agent is refused); the content was verified in the build output of the identical tree instead: tonsilektomi ch08 contains "hari ke-5 hingga ke-8", EWS ch04 "rantai komando empat tahap", ikigai ch08 "hal yang kamu cintai dan apa yang dibutuhkan dunia", pedagogy ch05 no "72%" |
| D1 seed | `bun run scripts/migrate-to-d1.ts` with `~/cloudflare/.env` sourced, from the tree of `0300e07`: exit 0, "Wrote seed SQL ... (58 book(s))", "All seeds applied successfully.", no failure lines (log 5,840 lines, not committed) |
| D1 remote check | `cf d1 query <dawnbook-db> --sql ...`: tonsilektomi `content_md` contains "hari ke-5 hingga ke-8" (1); EWS no "rantai komando empat jam" (0); pedagogy no "72% dari total" (0); `nudge-theory` and `iklan-digital-dan-penargetan-algoritma` each hold 3 ```mermaid blocks |
| Seed file | regenerated `db/seed.sql` (247 insertions, 151 deletions) committed in this seed PR |
| Debt-sweep follow-ups | owner selected both NOW items; F1-F4 shortened 15 chapter openers and renamed two repeated headings (`fba39db`, `36bc721`, `ab8738c`, `ed8af99`); `check-book-structure.ts` reports 0 problems for all four books; `bun run build` exit 0; `bun test` 658 pass, 13 skip, 0 fail |
| D1 seed, second run | rerun from the seed branch tree so `db/seed.sql` matches the shortened openers: exit 0, 58 books, "All seeds applied successfully.", 0 failure lines; `cf d1 query` confirms the new pedagogy ch09 opener and the new tonsillectomy ch05 heading (D1 runs ahead of the site until this seed PR merges and deploys) |
