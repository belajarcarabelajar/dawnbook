## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-harvest-moon` |
| Plan | `docs/code-plan/plans/2026-10-23-dawnbook-harvest-moon.md` (Refs #183) |
| Base branch | `main` |
| Head branch | `2026-10-23-dawnbook-harvest-moon/dawnbook-harvest-moon` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-harvest-moon` |
| Type of change | feature (new book) and test (book test) |
| Reviewer | three independent reviewer subagents (chapters 01-07, chapters 08-14, test, scaffold, cover and notes) |

## 2. What This Changes

Adds the book "Pelajaran Hidup dari Harvest Moon Back to Nature" by Iwan Kurniawan: 13 content chapters plus a Referensi page. Each chapter pairs one mechanic of Harvest Moon: Back to Nature (PlayStation, 1999) with one life lesson: starting small on an overgrown inheritance, stamina and rest, the order of daily chores, seasonal crops and patience, small income while waiting for a harvest, tool upgrades and opportunity cost, buying chickens before cows, daily animal care and habits, village festivals and social ties, neighbours' stories, a heart meter that changes slowly, delegating to the Harvest Sprites, and a mine you cannot climb back up. Game facts come from the official Prima strategy guide; each lesson rests on 1 to 3 verified sources (31-row source table, 14 DOIs checked with the doi.org handle API). Subject label `Self-Help`, three build-time Mermaid diagrams (chapters 02, 04, 11), a hand-written cover for the share cards.

The book test pins the structure, the byte budget, a URL allowlist in both directions (every link is a source-table URL and every table URL is used), and a copyright guard: no chapter or SUMMARY.md shares a 12-word run with the guide's OCR text, and the research notes and the plan share no 16-word run with it. The guide text stays outside the repository; the scan reads it at run time and is skipped with a printed reason where it is absent. The game-fact extraction sets that quote the guide line by line also stay in a local file outside the repository.

**Non-goals:** no change to the template, CSS, the build scripts, or any other book.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | 14 SUMMARY entries equal 14 files; each first heading equals its SUMMARY title | C1-C15 | `bun run scripts/check-book-structure.ts pelajaran-hidup-dari-harvest-moon-back-to-nature` | exit 0, `14 chapters, 0 problems` |
| AC-2 | 0 em dash, 0 emoji, 0 "Anda", 0 colon headings, distinct closers, openers not truncated | V1 | same checker; `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | exit 0; 0 violations (60 books); 0 repeated |
| AC-3 | No copied guide passage in the book, the notes or the plan | T0, V3 | book test cases for 12-word (chapters) and 16-word (notes, plan) runs | pass with the guide present; the notes case went RED (2.650 runs) before the fix |
| AC-4 | Every link is a source-table URL and every table URL is used; facts trace to notes items | V1, V3 | `bun test tests/books/pelajaran-hidup-dari-harvest-moon-back-to-nature.test.ts`; three review reads | exit 0; 6 chapter P1 and 1 notes P1 fixed (see section 5) |
| AC-5 | Cover gate, build with SEO validation and diagrams inlined | CV, V2 | `bun run check:covers --book <slug>`; `bun run build`; `bun run check:diagrams` | exit 0; `Successfully built`, `Inlined 3 diagram(s)`, `SEO Validation passed! All rules (R1-R7)`; 0 diagram violations |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Focused tests | `bun test tests/books/pelajaran-hidup-dari-harvest-moon-back-to-nature.test.ts tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts` | 0 | 57 pass, 0 fail |
| Book checker | `bun run scripts/check-book-structure.ts pelajaran-hidup-dari-harvest-moon-back-to-nature` | 0 | 14 chapters, 0 problems |
| Heading gates | `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | 0; 0 | 0 violations; 0 repeated |
| Diagrams | `bun run check:diagrams` | 0 | 0 violations, 0 orphans |
| Cover | `bun run check:covers --book pelajaran-hidup-dari-harvest-moon-back-to-nature` | 0 | 0 cover violations; index and longest-title cards read |
| Build | `bun run build` | 0 | SEO R1-R7 passed; 15 built metas 112-149 chars, complete sentences |
| Copy rules | `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` | 0 | clean, merge-base 94058ed2 |

GitHub Actions are off for this repository (GEMINI.md section 19), so these local runs are the gate.

## 5. Review

Three independent reviewers; all blocking findings fixed before commit. Report: `docs/code-plan/artifacts/2026-10-23-dawnbook-harvest-moon-review-report.md`.

- Notes: the game-fact reports had been kept verbatim and reproduced long guide passages in a public repository; moved to a local private file, guarded by a new test case.
- Chapters: a dropped hedge (Weick), invented durations and a claim beyond Lally et al., a wrong time span (Cliff), an invented heart-meter mechanic and a causal reading of Hall 2019.

## 6. After Merge (owner-gated)

Deploy by hand (GEMINI.md section 19; the deploy script also posts the Telegram announcement, section 28), then `bun run scripts/migrate-to-d1.ts`, then the GSC sitemap resubmission by the OAuth path.
