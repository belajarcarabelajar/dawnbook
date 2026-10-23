# Learning ledger: dawnbook-harvest-moon (2026-10-23)

Plan: docs/code-plan/plans/2026-10-23-dawnbook-harvest-moon.md. PR #184.

## Mistake log

| # | What happened | Cost | Caught by |
|---|---|---|---|
| M1 | The research notes kept the three game-fact reports verbatim; they quoted the copyrighted Prima guide line by line (17 % of its words in 12-word runs) in a public repository. The plan already said "line numbers and short quotes only". | One P1, a test-first fix round, a private notes file | Reviewer R3 |
| M2 | Chapter authors added first names from memory (Julianne Holt-Lunstad, Ashley Whillans; two more removed by the authors themselves). The contract said "facts from the notes" but did not name people's names. | Two parent edits | Parent audit V1 |
| M3 | The Referensi author rebuilt six page titles from URL slugs because the notes did not record exact titles. | Six parent edits after curl and TinyFish lookups | Parent audit V1 |
| M4 | The contract capped the first sentence at 155 characters but set no floor; three openers (79, 83, 92 chars) gave built metas below the 110-160 SERP range of GEMINI.md section 8. Only a manual look at the built metas caught them. | Three edits, one extra build | Parent inspection of the built HTML |
| M5 | Authors turned hedged findings into universals in recaps and bridges (Weick "often", Lally single misses, Hall association, a heart-meter "never jumps" mechanic). | 6 P1 and about 55 P2 | Reviewers R1, R2 |
| M6 | Two fixer subagents ran a read-only `git diff --no-index` although the contract said never run git. | None (read-only) | Their own reports |

## Candidate rules

| ID | Rule | Minimum-signal | 30-day | Class | Verdict |
|---|---|---|---|---|---|
| K1 | WHEN research notes are built from a copyrighted source → DO commit only paraphrase, item IDs and line numbers, keep the verbatim extraction in `~/.config/dawnbook/private-notes/`, and put the public-docs overlap test in T0, NOT researcher reports kept verbatim in docs/code-plan. | yes | yes | judgement (the per-book test is the mechanical part) | KEEP |
| K2 | WHEN dispatching chapter authors → DO state "people's names exactly as the notes give them, no first names from memory" and a first-sentence window of 110 to 155 characters, NOT only "facts from the notes" and a 155 cap. | yes | yes | judgement for names; mechanical for the length (follow-up candidate N4) | KEEP |
| K3 | WHEN the research wave reads web pages for a Referensi → DO record each page's exact title in the notes, NOT leave the Referensi author to rebuild titles from URLs. | yes | yes | judgement | KEEP |
| K4 | WHEN fixer subagents edit untracked files → DO have each save pre-edit copies to scratch so the parent can diff every changed line, NOT trust their summaries (worked well here). | yes | yes | judgement | KEEP (folded into K1's memory entry as a positive pattern) |
| K5 | M6, read-only git by subagents | no (no harm, the hook allows it) | no | n/a | NO-OP |

## Environment improvements

- Information access: the guide OCR lives in ~/Unduhan; the book test reads it from there by default, overridable with `DAWNBOOK_HM_GUIDE`. Recorded in the test file; no change needed.

## Where the KEEP rules went

Project memory file `new-book-authoring-traps.md` (items 6 to 9) in the dawnbook auto-memory directory, indexed in its MEMORY.md line.
