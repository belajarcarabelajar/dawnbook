# Review report: book "Saat Dia Suka, tapi Kamu Tidak"

Session: dawnbook-menolak-perasaan. Plan: docs/code-plan/plans/2026-10-19-dawnbook-menolak-perasaan.md. Base: origin/main 254088f.

## Inputs consulted

| Input | Consulted | Note |
|---|---|---|
| Working-tree diff (uncommitted) | yes | 13 chapters, SUMMARY.md, book.toml, icon.txt, theme/, 2 diagram SVGs, book test, release-dates.json, built-stats.ts, plan, research notes |
| Research notes (source of truth for facts) | yes | docs/code-plan/plans/research-dawnbook-menolak-perasaan.md, 52-row source table |
| Primary papers | no | the notes record what was read (mostly abstracts); reviewers checked chapters against the notes, one reviewer also checked Crossref for a publication date |
| Remote CI | no | no PR existed at review time; checks run locally by policy |

## Reviewers and verdicts

| Reviewer | Scope | Verdict | Findings |
|---|---|---|---|
| R1 (staid) | chapters 01-06 | correct | 0 P1, 7 P2, 14 P3 |
| R2 (staid) | chapters 07-13 incl. Referensi | not correct | 1 P1, 7 P2, 10 P3 |
| R3 (staid) | book test, scaffold, generated files, plan, notes | not correct | 1 P1, 2 P2, 3 P3 |

## Blocking findings and resolution

| ID | Finding | Resolution |
|---|---|---|
| R2-1 (P1) | Chapter 08 recap called the ghosting sample "tahun 2019"; 2019 is the print year (published online 2018-01-12), not the sample year | Rewritten as "Dalam studi yang terbit tahun 2019 dengan sampel daring di Amerika Serikat" |
| R3-F1 (P1) | The book test stored the identity denylist as SHA-256 digests of 1 to 3 token phrases; a dictionary attack over the repository's own text reversed 6 of 23, so digests conceal nothing in a public repository | Digests removed before any commit; the plaintext list moved to a local file outside the repository (mode 600, path overridable by `DAWNBOOK_IDENTITY_DENYLIST`); the book scan runs when the file exists and is skipped with a printed reason when it does not; `rg -c '[0-9a-f]{64}'` on the test prints nothing |

## Non-blocking findings and resolution

- R3-F2 (P2): matcher missed zero-width spaces, soft hyphens, accents, hyphen splits, unspaced forms and Indonesian suffixes. Fixed: NFKD plus mark stripping, zero-width and soft-hyphen removal, lookalike mapping, start-anchored phrase regex with free separators and no end boundary; a control test flags 10 evasion variants and leaves a clean sentence and a letter-prefixed form alone. Live check: a scratch list with an ordinary chapter word made the book scan fail (exit 1).
- R3-F3 (P2): research notes hinted at a real source. Rewritten to "The topic was chosen by the owner. Chapter scenarios are invented".
- R3-F4 (P3): URL allowlist missed some link forms. Fixed inside the book test: every markdown link target and `href` must be an exact URL from the source table (112 targets, all allowed).
- R3-F6 (P3): emoji in the plan text. Replaced with "Icon: see icon.txt".
- R3-F5 (P3): helpers duplicated from a sibling book test. Not changed; per-book test copies are the repository pattern (deferred, see the plan backlog).
- R1 and R2 P2 findings (claims beyond the notes): all fixed by one-sentence edits. Chapter 02 theory claims scoped to "menurut teori" and the untested hypothesis kept conditional; chapter 03 Abbey result restated with its male/female contrast; chapter 04 superlative removed and the awkwardness sentence corrected to the studies' direction; chapter 06 "rasa canggung" replaced by what the notes report and a forward promise to chapter 07 reduced to what chapter 07 delivers; chapter 09 hedge "dapat dianggap" restored, guidance labelled as the book's own; chapter 10 "keterlibatan" kept distinct from one-sided feelings; chapter 11 an unsupported ranking claim and a causal heading removed, a safety caveat on confronting added; chapter 12 the book's reading separated from the research and the "validated" translation changed to "diakui".
- R1 and R2 P3 findings: fixed where a sentence was wrong or unattributed (McAfee tip attribution, CATAHU scope sentence, Referensi full titles and the dissertation and encyclopedia notes, "prefrontal" spelling, removed specific time markers from the chapter 05 opener). Left as is: the recurring generic classmate and online-course scenarios (allowed by the identity guard; a variety pass is in the backlog).

## Re-verification after fixes

See the plan's Review (V3) checklist line for the commands and exit codes run after the fixes.

## Second review round (follow-up F2)

A fourth staid reviewer reread all 13 chapters against the notes after the first fixes and the setting changes of follow-up F1. Verdict: correct (0 P0/P1), 5 P2 and about 20 P3.

- P2 fixed: chapter 03 "dilakukan pada 1982" changed to the publication year; Referensi dissertation note no longer names a year or "first author"; chapter 12 sample claim restated as "membahas hubungan dekat"; chapter 11 recap restores the passive-coping condition; chapter 07 ORI wording changed to "pola yang mirip".
- P3 fixed: dropped hedges and attributions restored in recaps (chapters 01, 02, 03, 08, 09), the book's own views labelled (chapters 06, 08, 11, 12), small embellishments removed (chapters 04, 06, 09, 10, 12), "tiga gaya" for the three measured styles, "diakui" for "validated" in the chapter 12 heading, the remaining online-class setting in chapters 01 and 07 changed to a discussion group, a readable link title for the Jolink entry.
- Not changed: chapter 11 "terdengar kecil" (framed as how the remarks sound, not a finding) and the chapter 11 survey predicate (kept as the survey page reports it).
- Copy-rule note: `check-copy-rules --diff origin/main` flags the `Co-authored-by: Iwan Kurniawan` trailer on the Kania-authored commit. GEMINI.md section 18 requires that trailer and the owner chose that rule on 2026-10-19, so this is a rule conflict, not a defect.
