## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-menolak-perasaan` |
| Plan | `docs/code-plan/plans/2026-10-19-dawnbook-menolak-perasaan.md` |
| Base branch | `main` |
| Head branch | `2026-10-19-dawnbook-menolak-perasaan/dawnbook-menolak-perasaan` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-menolak-perasaan` |
| Type of change | feature (new book) and test (book test) |
| Reviewer | three independent reviewer subagents (chapters 01-06, chapters 07-13, test and scaffold) |

## 2. What This Changes

Adds the book "Saat Dia Suka, tapi Kamu Tidak" by Kania Salsabila: 12 content chapters plus a Referensi page on handling romantic interest you do not return (indirect signals, friendliness versus interest, compliments, online-only acquaintances, why refusing is hard, refusing clearly and kindly, ghosting, the side not chosen, school-age romance, harassment treated as normal, people who share your values). Researched from zero: every fact traces to a 52-row source table in the research notes, with H or M confidence per item. Subject label `Hubungan`, two build-time Mermaid diagrams (chapters 05 and 09).

The book test pins the structure, byte budget, a URL allowlist (plain URLs, markdown link targets and `href` must be exact source-table URLs), and an identity denylist. The denylist lives in a local file outside the repository and the scan is skipped with a printed reason where that file is absent, so no denylisted phrase, plain or hashed, is committed.

Follow-ups selected in the session-close debt sweep are in the same PR: a second fact review of all chapters (0 P1, its P2 and P3 fixed), varied example settings in chapters 01, 03, 05, 07, 08, a test-first hardening of `scripts/check-book-structure.ts` (case-insensitive URL scheme, new `extractLinkTargets`, and a problem for any chapter link that is not an absolute URL, an anchor, an existing chapter file, or a site-root link to an existing book; no book gains a problem), and shared book-test helpers in `tests/helpers/book-test.ts` used by both book tests.

**Non-goals:** no change to the shared template, CSS, the build, or any other book's content.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | 13 SUMMARY entries equal 13 files; each first heading equals its SUMMARY title | C1-C14 | `bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak` | exit 0, `13 chapters, 0 problems` |
| AC-2 | 0 em dash, 0 emoji, 0 "Anda", 0 colon headings, distinct closers, openers not truncated | V1 | same checker; `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | exit 0; 0 violations (59 books); 0 repeated |
| AC-3 | 0 identity terms in any chapter, SUMMARY.md or diagram | T0, V1 | book test case "no chapter or SUMMARY.md contains a denylisted identity term" | passes with the local list present; a scratch list holding an ordinary chapter word makes it fail (exit 1) |
| AC-4 | Every link in the book is a source-table URL; facts trace to notes items | V1, V3 | `bun test tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts`; three review reads | 112 link targets, all allowed; 2 P1 fixed (see section 5) |
| AC-6 | Shared checker sees link targets it missed, with no new problem in any existing book | F3 | `bun test tests/scripts/check-book-structure.test.ts`; checker loop over all books | exit 0, 40 pass (RED 32 pass 7 fail, then 39 pass 1 fail for cross-book links); 47 failing books before and after, identical lists and counts |
| AC-5 | Build passes with SEO validation and diagrams inlined | V2 | `bun run build`; `bun run check:diagrams` | exit 0, `Successfully built: saat-dia-suka-tapi-kamu-tidak`, `Inlined 2 diagram(s)`, `SEO Validation passed! All rules (R1-R7)`; 0 diagram violations |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Focused tests | `bun test tests/scripts/check-book-structure.test.ts tests/books/ tests/serp-description.test.ts tests/functions/api/stats.test.ts` | 0 | 70 pass, 0 fail |
| Book checker | `bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak` | 0 | 13 chapters, 0 problems |
| Heading gates | `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | 0; 0 | 0 violations; 0 repeated |
| Diagram gate | `bun run check:diagrams` | 0 | 0 violations, 0 orphaned SVGs |
| Copy rules | `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` | 1 | one hit: the `Co-authored-by: Iwan Kurniawan` trailer on the Kania-authored book commit, which GEMINI.md section 18 requires; content lines clean |
| Build | `bun run build` | 0 | SEO R1-R7 passed |
| Built meta | description of the 14 built pages of this book | n/a | 105-154 characters, all complete sentences |

- **Before:** the book test failed with the book absent (exit 1, 5 pass, 4 fail: structure, byte budget, URL allowlist, identity scan).
- **After:** all tests above pass.

## 5. Independent Review

- [x] Four reviewers that did not write the work read it: chapters 01-06 (correct, 7 P2), chapters 07-13 (not correct, 1 P1), test and scaffold (not correct, 1 P1), and a second round on all chapters after the fixes (correct, 5 P2).
- [x] Parent diff audit ran: every chapter read line by line, the test read and its denylist independence checked (0 digests, 0 denylisted phrases, 0 non-ASCII characters in the file), gates re-run in the parent.
- [x] Both P1 findings fixed before any commit: a recap stated a 2019 sample year where 2019 is the publication year; the first denylist design stored SHA-256 digests of short phrases, which a dictionary attack reversed, so it was replaced by the local-file design. All P2 and most P3 findings fixed; details in `docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-review-report.md`.

**Reviewer verdict:** `correct` after fixes. No P0/P1 remains; it would change if a chapter fact is found that is absent from the research notes, or if any identifying detail is found in the diff.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | The new book's pages and Hub card; `functions/lib/built-stats.ts` (737 to 750 chapters, author book count 10 to 11); `release-dates.json` (one added key) |
| Door | two-way (a revert removes the book) |
| Rollout | default; deploy, D1 seed and GSC reindex are separate owner-gated steps after merge |
| Health signal | the book URL returns 200 and its index meta equals the book.toml description |
| Rollback | `git revert -m 1 <merge commit>`, then redeploy |
| Compatibility | N/A, no shared interface changes |

## 7. Pre-Existing Issues and Deferred Debt

- `bun run typecheck` does not exist in this repository, so the TypeScript changes were checked by `bun test` only. `defer: repository tooling session, when a typecheck script is added`
- Plans 2026-10-16-dawnbook-diagrams-retrofit-rf3, rf4 and rf6 are still at Verification although their sessions merged. `defer: next dawnbook session closeout`
- The identity scan runs only on machines that hold the local denylist file; CI skips it with a printed reason. `defer: owner decision, if the repository gains a CI secret store`

## 8. Checklist

- [x] Branch and worktree came from `pr-registry claim`.
- [x] Nothing was committed directly to the base branch.
- [x] Title is imperative and the body is in English, the codebase's language.
- [x] No em dash in this body, the commit message, or any user-visible string in the diff.
- [x] Commits follow GEMINI.md section 18: book content under Kania Salsabila with the trailer `Co-authored-by: Iwan Kurniawan`; tooling and docs under Iwan Kurniawan without a trailer; no other attribution line.
- [x] No secrets, tokens, `.env` content, or unrelated cleanup in the diff.
- [x] Every acceptance criterion maps to a check and to evidence.
- [x] PR body written to a file and posted with `--body-file`.
