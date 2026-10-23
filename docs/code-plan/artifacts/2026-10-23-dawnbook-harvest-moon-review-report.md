# Review report: book "Pelajaran Hidup dari Harvest Moon Back to Nature"

Session: dawnbook-harvest-moon. Plan: docs/code-plan/plans/2026-10-23-dawnbook-harvest-moon.md. Base: origin/main 94058ed.

## Inputs consulted

| Input | Consulted | Note |
|---|---|---|
| Working-tree diff (uncommitted) | yes | 14 chapters, SUMMARY.md, book.toml, icon.txt, theme/, cover.svg, 3 diagram SVGs, book test, release-dates.json, built-stats.ts, plan, research notes |
| Research notes (source of truth for facts) | yes | docs/code-plan/plans/research-dawnbook-harvest-moon.md, 31-row source table; game-fact sets A, B, C in the owner's private local file (see the first blocking finding) |
| Guide OCR text (copyrighted, local only) | yes | reviewers spot-checked game facts against line ranges of the owner's local copy |
| Primary papers | no | the notes record what was read (mostly abstracts); reviewers checked chapters against the notes |
| Remote CI | no | GitHub Actions are off for this repository (GEMINI.md section 19); checks run locally |

## Reviewers and verdicts

| Reviewer | Scope | Verdict | Findings |
|---|---|---|---|
| R1 (staid) | chapters 01-07 | not correct | 1 P1, about 30 P2, about 25 P3 |
| R2 (staid) | chapters 08-14 incl. Referensi | not correct | 5 P1 (in 4 places), about 25 P2, about 25 P3 |
| R3 (staid) | book test, scaffold, cover, diagrams, plan, notes, generated files | not correct | 1 P1, 1 P2, 3 P3 |

## Blocking findings and resolution

| ID | Finding | Resolution |
|---|---|---|
| R3-P1 | The research notes kept the three game-fact reports verbatim; 6.713 of the guide's 38.810 words reappeared in 12-word runs, with quotes up to 79 words, in a public repository. | Sets A, B, C moved to the owner's local file `~/.config/dawnbook/private-notes/research-dawnbook-harvest-moon-guide-sets.md` (mode 600); the public notes keep sections 0 and 4 to 9 plus a pointer section; three guide quotes in L4-4 paraphrased. Test first: a new case "the research notes and the plan share no 16-word run with the strategy guide" failed with 2.650 runs (exit 1, 8 pass 1 fail), then passed (exit 0, 9 pass). |
| R1-P1 | ch01: Weick's "often precludes innovative action" was written as a universal. | Reworded to "sering kali menghalangi tindakan yang inovatif". |
| R2-P1 | ch08: invented durations ("beberapa detik") and a claim beyond Lally et al. (stopping entirely, a missed week). | Durations replaced by "sedikit waktu"; the Lally sentence now states the study tested single missed days only. |
| R2-P1 | ch10: "setahun ke depan" for a span from fall 14 to winter 30. | "sampai akhir tahun". |
| R2-P1 | ch11: invented mechanic (the heart colour "never jumps", "no button to skip a colour") and a causal reading of Hall 2019. | Four sentences reworded to the guide's colour order and the study's association. |

## Non-blocking findings

All P2 findings were applied with the reviewers' replacement text, except where the fix contract's term table took priority (one Barn wording in ch03) or where a replacement would have duplicated the next sentence (ch05 fish feeding) or dropped a sourced clause (ch12 Whillans "karena ..."). P3 findings were applied when they removed an unsupported claim, a wrong term or an invented detail, and skipped when they were style only. Four fixer subagents (chef, nappy, hoggy, chef) worked on disjoint chapter groups; the parent audited each changed line against the pre-fix copies.

Term decisions made by the parent and applied book-wide: "meningkatkan" for tool upgrades, "Barn (kandang sapi dan domba)" at first use, "Harvest Bin" for every shipping bin, Indonesian crop names with the English term in italics at first use, "Clinic", "penginapan Doug", "Hothouse" without a gloss, "Blue Feather", and "penolong" for the Harvest Sprites.

Other R3 items: `export` dropped from the in-test helper (P3); the URL test now requires every one of the 31 table URLs to be used (P3); the detector's limit to verbatim English runs is a known design limit, covered by the reviewers' reads (P3, no change).

## Re-run after fixes

| Gate | Command | Exit | Result |
|---|---|---|---|
| Focused tests | `bun test tests/books/pelajaran-hidup-dari-harvest-moon-back-to-nature.test.ts tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts` | 0 | 57 pass, 0 fail |
| Book checker | `bun run scripts/check-book-structure.ts pelajaran-hidup-dari-harvest-moon-back-to-nature` | 0 | 14 chapters, 0 problems |
| Heading gates | `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | 0; 0 | 0 violations (60 books); 0 repeated |
| Diagrams | `bun run diagrams:render --book <slug> --prune`; `bun run check:diagrams` | 0; 0 | 3 SVGs, 2 stale pruned; 0 violations, 0 orphans |
| Cover | `bun run check:covers --book <slug>` | 0 | 0 cover violations |
| Copy rules | `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` | 0 | clean, merge-base 94058ed2 = `origin/main` |
