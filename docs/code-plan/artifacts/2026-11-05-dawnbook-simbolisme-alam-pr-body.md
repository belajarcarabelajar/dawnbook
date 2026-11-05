## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-simbolisme-alam` |
| Plan | `docs/code-plan/plans/2026-11-05-dawnbook-simbolisme-alam.md` (Refs #262) |
| Base branch | `main` |
| Head branch | `2026-11-05-dawnbook-simbolisme-alam/dawnbook-simbolisme-alam` |
| Worktree | `/mnt/belajarcarabelajar/dawnbook-wt/dawnbook-simbolisme-alam` |
| Type of change | feature (new book) and test (book test) |
| Author | Kania Salsabila, with `Co-authored-by: Iwan Kurniawan` (GEMINI.md section 18) |
| Reviewer | three independent reviewer subagents (chapters 01-07, chapters 08-14, test, scaffold, cover and notes) |

## 2. What This Changes

Adds the book "Simbolisme Alam dalam Sastra" by Kania Salsabila: 13 content chapters plus a Referensi page, built from the owner's 13-module study notes on how writers use nature to voice a character's inner life. Chapters cover nature as an inner language, the pathetic fallacy (Ruskin), the four seasons and Frye's mythoi, the sun, the moon, water, trees and forests, storms, mountains and valleys, flowers, inner landscapes and Eliot's objective correlative, three novels (Wuthering Heights, Ronggeng Dukuh Paruk, The Old Man and the Sea), and the shift from the Romantic sublime to ecological anxiety. Subject label `Sastra`, three build-time Mermaid diagrams (chapters 01, 03, 05), a hand-written cover for the share cards.

Improvements over the notes: chapter titles follow the real content of each module (the notes' module titles did not match their content); every literary claim was checked with TinyFish (45 items, 21 corrected or hedged, 65-row source table); the notes' pseudo-math formulas and pseudocode were dropped; the prose follows the house rules (kamu, no em dash, no colon headings, no contrast framing, cooked voice per GEMINI.md section 29). Corrected facts are stated directly, with no trace of the earlier wording.

The book test pins the structure, the byte budget, the meta length the build computes, a URL allowlist (every link is a source-table URL), banned scaffolds, the corrected facts, and a guard that no chapter shares a 16-word run with the owner's notes. The notes stay outside the repository; that scan reads them at run time and is skipped with a printed reason where they are absent.

**Non-goals:** no change to the template, CSS, the build scripts, or any other book. No deploy (owner-gated, after merge).

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | 14 SUMMARY entries equal 14 files; each first heading equals its SUMMARY title | C1-C15 | `bun run scripts/check-book-structure.ts simbolisme-alam-dalam-sastra` | exit 0, `14 chapters, 0 problems` |
| AC-2 | 0 em dash, 0 emoji outside icon.txt, 0 "Anda", 0 colon headings, no repeated headings, metas 110-155, 0 contrast framing | V1 | book test; `bun run check:headings`; `bun run check:voice` | exit 0; 0 violations (61 books); voice 0 problems |
| AC-3 | No 16-word run copied from the owner's notes | T0, V1 | book test shared-run case | pass with the notes present; controls at 16 and 15 words |
| AC-4 | Every link is a source-table URL, every Referensi entry a link, no archive.org | V1, V3 | book test; `tests/books/referensi-links.test.ts`; `tests/books/referensi-presence.test.ts` | exit 0 (68 pass, 0 fail in the focused run) |
| AC-5 | Cover gate, build with SEO validation and diagrams inlined | CV, V2 | `bun run check:covers --book <slug>`; `bun run build`; `bun run check:diagrams` | exit 0; `SEO Validation passed! All rules (R1-R7)`; `Inlined 3 diagram(s)`; 0 diagram violations |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Focused tests | `bun test tests/books/simbolisme-alam-dalam-sastra.test.ts tests/books/referensi-links.test.ts tests/books/referensi-presence.test.ts tests/books/known-misattributions.test.ts tests/scripts/check-book-structure.test.ts` | 0 | 68 pass, 0 fail |
| Book checker | `bun run scripts/check-book-structure.ts simbolisme-alam-dalam-sastra` | 0 | 14 chapters, 0 problems |
| Heading gates | `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | 0; 0 | 0 violations; 0 repeated |
| Voice | `bun run check:voice` | 0 | 0 problems |
| Diagrams | `bun run check:diagrams` | 0 | 0 violations (13 orphan SVGs belong to other books, pre-existing) |
| Cover | `bun run check:covers --book simbolisme-alam-dalam-sastra` | 0 | 0 cover violations; index card read |
| Typecheck | `bun run typecheck` | 0 | clean |
| Build | `bun run build` | 0 | 59 s; SEO R1-R7 passed; 14 built metas 117-154 chars, complete sentences |
| Copy rules | `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` | 1 | one hit: the icon.txt emoji, which GEMINI.md section 14 permits |

The build ran in a detached scratch worktree on the NVMe with identical book files: two runs on the external NTFS disk hit their timeout while another session kept the disk saturated. `functions/lib/built-stats.ts` in this branch is byte-identical to that build's output.

## 5. Review

Three independent reviewers. Chapters 01-07: 0 P1, 14 P2. Chapters 08-14 and Referensi: 1 P1, 11 P2. Test, scaffold, cover, diagrams and notes: correct. The P1 (a closing line in chapter 13 overstated The Road) and the P2 (mostly readings stated as fact, unsourced generalisations, intent or cause added) were fixed by three fixers on disjoint chapter groups; the parent read every changed sentence against pre-edit copies. Six findings were kept with reasons. Full table: `docs/code-plan/artifacts/2026-11-05-dawnbook-simbolisme-alam-review-report.md`.

## 6. After Merge (owner-gated)

Deploy per GEMINI.md section 19 (posts the Telegram announcement, section 28), `bun run scripts/migrate-to-d1.ts`, then the GSC sitemap resubmission.
