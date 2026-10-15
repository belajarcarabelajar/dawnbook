## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-soft-power-manga-anime` |
| Plan | `docs/code-plan/plans/2026-10-15-dawnbook-soft-power-manga-anime.md` |
| Base branch | `main` |
| Head branch | `2026-10-15-dawnbook-soft-power-manga-anime/dawnbook-soft-power-manga-anime` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-soft-power-manga-anime` |
| Type of change | feature (new book) and test (book structure checker) |
| Reviewer | three independent reviewer subagents (code, chapters 01-06, chapters 07-13) |

## 2. What This Changes

Adds the book "Soft Power Jepang Lewat Manga dan Anime" by Iwan Kurniawan: 12 content chapters plus a Referensi page, researched from zero (research notes with a 71-row source table, every fact marked verified or attributed), subject label `Anime`, icon 🎌. It also adds `scripts/check-book-structure.ts`, a per-book checker (SUMMARY vs disk, title level and text, stray files, em dash, emoji, "Anda", openers and book.toml descriptions that the site's 155/145 meta cut would truncate, repeated section headings), with unit tests and a test that pins this book to it.

**Non-goals:** no change to any other book, the shared template, CSS, `scripts/inject-gating.ts`, or the build. The checker is not wired into `bun run build`, because 57 existing books currently fail it (section 7).

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | 13 SUMMARY entries equal 13 files; each first heading equals its SUMMARY title | C1-C14 | `bun run scripts/check-book-structure.ts soft-power-jepang-lewat-manga-dan-anime` | exit 0, `13 chapters, 0 problems` |
| AC-2 | 0 em dash, 0 emoji, 0 "Anda", 0 colon headings, distinct closers, openers not truncated | V1 | same checker; `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | exit 0, 0 problems; 0 violations (58 books); 0 repeated |
| AC-3 | Build passes with SEO validation and the book in the manifest | V2 | `bun run build` | exit 0, `Successfully built: soft-power-jepang-lewat-manga-dan-anime`, `SEO Validation passed! All rules (R1-R7)` |
| AC-4 | Every URL in the book comes from the research notes; facts trace to notes items | V1, V3 | `bun test tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts`; fact-check reviewers | 3 pass; 2 P1 found and fixed, re-gated |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Focused tests | `bun test tests/scripts/check-book-structure.test.ts tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts tests/serp-description.test.ts` | 0 | 40 pass, 0 fail |
| Full suite | `bun test` | 0 | 461 pass, 0 fail (474 tests, 52 files) |
| Heading gates | `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | 0; 0 | 0 violations; 0 repeated |
| Build | `bun run build` | 0 | SEO R1-R7 passed; only warnings are the 58 pre-existing optional `mdbook-dawnbook` notices |
| Built meta | description of the 14 built pages of this book | n/a | 98-154 characters, none truncated |

- **Before:** the book test failed (`0 pass, 3 fail`, book absent), and the first build produced a root page meta cut to "...dan harga di balik..." because the book.toml description was 156 characters; the new checker test for that case failed (`15 pass, 1 fail`).
- **After:** the description is 154 characters, the root meta is the full description, and all tests above pass.

## 5. Independent Review

- [x] Three reviewers that did not write the work read it: code (verdict correct, 3 P2), chapters 01-06 (verdict not correct, 2 P1), chapters 07-13 (verdict correct, 13 P2).
- [x] Parent diff audit ran: every chapter read line by line, the checker read in full, tests re-run in the parent.
- [x] Both P1 findings (an unverified scanlation claim, a 1976-1993 finding stated as current) and all P2/P3 findings were fixed in this PR; details in `docs/code-plan/artifacts/2026-10-15-dawnbook-soft-power-manga-anime-review-report.md`.

**Reviewer verdict:** `correct` after fixes. No P0/P1 remains; it would change if a chapter fact is found that is absent from the research notes or marked unverified there.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | The new book's pages and the Hub card; `functions/lib/built-stats.ts` (author book count 47 to 48); `release-dates.json` (one added key) |
| Door | two-way (a revert removes the book) |
| Rollout | default; deploy, D1 seed and GSC reindex are separate, owner-gated steps after merge |
| Health signal | the book URL returns 200 and its index meta equals the book.toml description |
| Rollback | `git revert <merge commit>` then redeploy, by the repository owner |
| Compatibility | N/A, no shared interface changed; the checker is a new standalone script |

## 7. Pre-Existing Issues and Deferred Debt

- `scripts/inject-gating.ts:91` `extractLeadText` matches `<p[^>]*>`, which also matches `<pre>`, so code placed before the first paragraph leaks into a live meta description. `defer: separate fix session, when a chapter opens with a code block`
- 57 existing books fail the new checker: 259 truncated chapter openers, 58 chapter titles differing from SUMMARY, 29 section headings repeated in two chapters. `defer: per-book cleanup sessions, before wiring the checker into the build`
- 58 optional `mdbook-dawnbook` preprocessor warnings during build (environment). `defer: environment setup, when the preprocessor output is needed`

## 8. Checklist

- [x] Branch and worktree came from `pr-registry claim`.
- [x] Nothing was committed directly to the base branch.
- [x] Title is imperative and the body is in English, the codebase's language.
- [x] No em dash in this body, the commit messages, or any user-visible string in the diff.
- [x] No attribution footer, watermark, badge, or co-author line.
- [x] No secrets, tokens, `.env` content, or unrelated cleanup in the diff.
- [x] Every acceptance criterion maps to a check and to evidence.
- [x] PR body written to a file and posted with `--body-file`.
