# Session Learning Ledger: dawnbook-soft-power-manga-anime

## 1. Identity

| Field | Value |
|---|---|
| Session | dawnbook-soft-power-manga-anime |
| Plan | docs/code-plan/plans/2026-10-15-dawnbook-soft-power-manga-anime.md |
| Date | 2026-10-15 |
| PR | #145 |
| Repository | belajarcarabelajar/dawnbook |

## 2. Mistake Log (raw, this session)

| # | What happened | Cost | Root cause |
|---|---|---|---|
| M1 | The book.toml description was 156 characters; the root page meta was cut to "...di balik...". The 155 cap was known for chapter openers only. | One build round, one TDD cycle | The root book page goes through the same `formatSerpDescription(desc, 155)` as chapters; GEMINI.md section 8 says 100-160 |
| M2 | Writing a backslash-u escape for U+2014 through the Write and Edit tools produced a literal em dash in a TypeScript source and in the review report. | Two extra scans and a Python rewrite | The tools decode JSON escapes, so an escape meant for the file arrives as the character |
| M3 | Verified facts present in researcher reports (Osamu Tezuka as creator, Miyazaki credited by the Academy, Meiji Seika sponsorship) were not copied into the research notes; authors left gaps and a reviewer raised a false P2. | Three audit edits, one reviewer finding | Notes were synthesized by item instead of carrying every verified detail of each report |
| M4 | Chapters written in parallel repeated the same facts (Meiji Seika stickers, Crunchyroll purchase, MANGA Plus launch, Netflix dubbing). | About eight de-duplication edits | The manifest assigned items to several chapters without naming one owner chapter per fact |
| M5 | Authors added causal claims and embellishments not in the notes (weekly format "became the base", fans "the first ambassadors", committees explain fast export). Reviewers raised 2 P1 and about 25 P2. | One review round of fixes | The dispatch rule said "only facts from the notes" but did not ban unsupported causal links or generalisations |
| M6 | Research notes used two ID schemes that collided (section 7 `G-1` and gap wave `G1`, while the source table used `G1` for section 7). | One renaming pass | IDs were assigned per report without a global namespace |

## 3. Distilled Rules (candidates)

| ID | Rule | Minimum-Signal | 30-Day | Kind | Decision |
|---|---|---|---|---|---|
| K1 | WHEN writing a book.toml description for Dawnbook, DO keep it at most 155 characters (the root page uses the same cut as chapters), NOT 160 as GEMINI.md section 8 suggests | yes | yes | mechanical | KEEP; now enforced by scripts/check-book-structure.ts; update memory chapter-opener-155-cap |
| K2 | WHEN a file must contain a backslash-u escape (e.g. an em dash detector), DO write it with Python using a doubled backslash and verify with `rg`, NOT with the Write or Edit tool | yes | yes | judgement | KEEP (memory) |
| K3 | WHEN synthesizing research notes from researcher reports, DO copy every verified detail (creator names, credits, sponsors) into the item, NOT only the headline numbers | yes | yes | judgement | KEEP (memory) |
| K4 | WHEN dispatching parallel chapter authors, DO name one owner chapter per fact and let other chapters refer back, and ban causal links or generalisations not in the notes, NOT only "use facts from the notes" | yes | yes | judgement | KEEP (memory) |
| K5 | WHEN numbering research items from several reports, DO use one ID namespace per report set before writing the source table | low | yes | judgement | NO-OP (cheap to notice, low recurrence) |

## Environment Improvements

| ID | Observation | Decision |
|---|---|---|
| E1 | The review templates reference `scripts/check-copy-rules.mjs`, which does not exist in this repository; two reviewers lost a call on it | Backlog L6 (vivera template session) |
| E2 | The per-book checker now exists, but 56 books fail it, so it cannot gate the build yet | Backlog L1 and L2 |

## 4. Promotion Decision

No global promotion proposed: K1 to K4 are specific to the Dawnbook repository and stay in the project memory.

## 5. Carry-Forward Pointer

Project memory index: ~/.claude/projects/-home-belajarcarabelajar-Proyek-dawnbook/memory/MEMORY.md (K1 merged into chapter-opener-155-cap; K2 to K4 in a new memory, new-book-authoring-traps).
