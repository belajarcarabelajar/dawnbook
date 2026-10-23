# Review report: voice rewrite of "Pelajaran Hidup dari Harvest Moon Back to Nature"

Plan: docs/code-plan/plans/2026-10-24-dawnbook-harvest-moon-voice.md. Base: origin/main f2162b2.

## Why

The owner read the live book (PR #184) and found it stiff, AI-like and not pleasant to read: the sources were served raw. The owner chose the voice "luwes tapi rapi" and asked for the rule to be written down so it never happens again (GEMINI.md section 29, MDBOOK_SYSTEM_RULES.md Phase B step 10).

## Reviewers and verdicts

| Reviewer | Scope | Verdict | Findings |
|---|---|---|---|
| R1 (staid) | chapters 01-07, facts old versus new and voice | not correct | 7 P1, about 20 P2, about 15 P3 |
| R2 (staid) | chapters 08-13, section 29, the voice-guard test | not correct | 7 P1, about 15 P2 (incl. 3 on section 29 and the test), about 10 P3 |

## Blocking findings and resolution

All 14 P1 were facts, superlatives or mechanics the rewrite had added (for example "hadiah termahal di desa", "di musim apa pun", "kapan saja", "Tidak ada latihan khusus yang bisa kamu berikan", "biaya peluang dalam bentuknya yang paling sederhana"). Three fixer subagents (chef, nappy, hoggy) restored the baseline wording under one fix contract; the parent read every changed line against the pre-fix copies and found no new fact.

Voice P2s fixed in the same round: the attribution stacks (Weick, Watts, Lally, Hall, Whillans), dense fact paragraphs (Gotz lumber, the animal catalogue), the closing bridge "bab berikutnya" that ended 12 of 13 chapters (now 0), and crutch words ("tetap" 10 times in chapter 05, "pun" 6 times in chapter 07, now at most 4).

Rules and test: section 29 gained "rewriting never adds", "vary the seams", the tone in the dispatch paragraph, a named example test, and a complete revert line. The voice-guard test gained caps for stock connectors and "bab berikutnya", positive controls for every cap, a chapter 01 boundary case, and the `DAWNBOOK_HM_BOOK` override; RED on the old chapters, GREEN after the fixes.

## Scaffold counts, chapters 01-13

| Pattern | Live version (PR #184) | After this PR |
|---|---|---|
| "Panduan" as the subject of a sentence (menyebut, mencatat, menyarankan, menulis, juga, bahkan) | 50 | 0 |
| "Menurut panduan" | 27 | 0 |
| "Kalau dipikir-pikir" | 14 | 0 |
| "mirip dengan" | 16 | 0 |
| "tokoh kita" | 51 | 1 (inside a Mermaid accDescr) |
| "bab berikutnya" | 12 | 0 |

## Re-run after fixes

| Gate | Exit | Result |
|---|---|---|
| `bun test tests/books/pelajaran-hidup-dari-harvest-moon-back-to-nature.test.ts tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts` | 0 | 61 pass, 0 fail |
| `bun run scripts/check-book-structure.ts pelajaran-hidup-dari-harvest-moon-back-to-nature` | 0 | 14 chapters, 0 problems |
| `bun run check:headings`; `bun run scripts/check-repeated-headings.ts`; `bun run check:diagrams` | 0; 0; 0 | 0 violations; 0 repeated; 0 violations, 0 orphans |
| `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` | 0 | clean |
| `bun run build` | 0 | SEO R1-R7 passed |
