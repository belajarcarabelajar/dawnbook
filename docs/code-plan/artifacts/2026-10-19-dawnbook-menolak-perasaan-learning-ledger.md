# Session Learning Ledger: dawnbook-menolak-perasaan

## 1. Identity

| Field | Value |
|---|---|
| Session | dawnbook-menolak-perasaan |
| Plan | docs/code-plan/plans/2026-10-19-dawnbook-menolak-perasaan.md |
| Date | 2026-10-19 |
| PR | #166 |
| Repository | belajarcarabelajar/dawnbook (public) |

## 2. Mistake Log (raw, this session)

| # | What happened | Cost | Root cause |
|---|---|---|---|
| M1 | The first book test listed identity denylist phrases in plain text, including a control sentence that narrated personal details, in a public repository. Caught in the parent diff audit before any commit. | One re-dispatch | The test was designed before the repository's visibility was checked |
| M2 | The replacement stored SHA-256 digests of 1 to 3 token phrases. An independent reviewer reversed 6 of 23 with a dictionary built from the repository's own text. Caught before any commit. | One P1, a second re-dispatch | Hashing a low-entropy phrase hides nothing; a dictionary of plausible words recovers it |
| M3 | The plan and research notes first described the topic source in identifying terms (archive file name, a list of the personal details being hidden). | Two rewrites | The identity guard was written as a list of what to hide, which itself discloses it |
| M4 | Review fixes added descriptive notes to the Referensi page and pushed it from 11.727 to 12.234 bytes, over the 12.000 test ceiling; three trim rounds left 12.007 bytes. | Three trim rounds and a ceiling change | The Referensi budget was set at the house ceiling with no headroom for review fixes |
| M5 | About 45 chapter sentences went beyond the notes (generalisations, a theory stated as a finding, one publication year read as a sample year) despite the no-causal-claims rule in every dispatch. | One audit pass and one review fix pass | Authors restated hedged findings in recaps and opening sentences, where the hedge was dropped |

## 3. Distilled Rules (candidates)

| ID | Rule | Minimum-Signal | 30-Day | Kind | Decision |
|---|---|---|---|---|---|
| K1 | WHEN a test or check must guard against leaking private terms from a public repository, DO keep the term list in a local file outside the repository (read by path or env var, skipped with a printed reason when absent), NOT plain text in the repository and NOT hashes of short phrases | yes | yes | judgement | KEEP (memory) |
| K2 | WHEN describing a private source in plans, notes, or PR text, DO say only that the owner chose the topic and scenarios are invented, NOT a list of the categories being hidden | yes | yes | judgement | KEEP (memory, merged with K1) |
| K3 | WHEN setting a Referensi byte ceiling, DO leave at least 10% headroom above the first draft for review fixes, NOT the house maximum | medium | yes | judgement | KEEP (memory, new-book traps) |
| K4 | WHEN auditing chapters, DO read recap bullets and first sentences against the notes separately, NOT only the body, because hedges are dropped there | yes | yes | judgement | KEEP (memory, new-book traps) |
| K5 | WHEN a study's year is cited, DO call it the publication year unless the notes give the data-collection year | medium | yes | judgement | NO-OP (covered by K4 and the existing "copy every verified detail" rule) |

## Environment Improvements

| ID | Observation | Decision |
|---|---|---|
| E1 | `scripts/check-book-structure.ts` `extractUrls` is case-sensitive and scheme-bound, so link targets like `doi.org/...` without a scheme pass unseen; this book's test now checks link targets itself | Backlog (follow-up candidate N2) |
| E2 | Per-book tests copy the same helpers (`contentFiles`, `sourceTableUrls`, `sourceTableSection`) | Backlog, `defer: next new-book session, when a third book test copies them` |
