# Review report: Soft Power Jepang Lewat Manga dan Anime

Session: dawnbook-soft-power-manga-anime. Plan: docs/code-plan/plans/2026-10-15-dawnbook-soft-power-manga-anime.md. Date: 2026-10-15.

## Reviewers

Three independent `staid` reviewers ran in parallel on the uncommitted worktree (none saw another's report):

| Axis | Scope | Verdict | Findings |
|---|---|---|---|
| Standards (code) | scripts/check-book-structure.ts, tests/scripts/check-book-structure.test.ts, tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts | correct | 0 P0, 0 P1, 3 P2, 8 P3 |
| Spec and facts, chapters 01-06 | chapter text vs research notes (H/M items) and house rules | not correct | 0 P0, 2 P1, 12 P2, 12 P3 |
| Spec and facts, chapters 07-13 | chapter text and Referensi vs research notes and house rules | correct | 0 P0, 0 P1, 13 P2, 18 P3 |

## Blocking findings and resolution

| ID | File | Finding | Resolution |
|---|---|---|---|
| R1 (P1) | 05_penggemar-sebagai-duta-tak-resmi.md | Paragraph stated scanlation as fact; research item E7 marks scanlation claims as unverified | Paragraph removed |
| R2 (P1) | 05_penggemar-sebagai-duta-tak-resmi.md | "Penggemar yang menonton tanpa izin hari ini adalah calon pembeli resmi" extended Leonard's 1976-1993 finding to the present | Rewritten as "Dalam kerangka Leonard, penonton tanpa izin pada masa itu ..." |

## Non-blocking findings and resolution

- Code (P2): lead-text extraction now reads only paragraph lines (lists, tables, fences, raw HTML skipped; blockquote text kept); the title is the first heading of any level, a level-1 title is reported, and text above the title counts toward the opener; the opener rule mirrors the site's 155/145 two-step cut instead of `endsWith("...")`; the weak stripping test now fails if stripping is removed. Each change was test-first (RED then GREEN, mutation-checked); unit tests 31 pass, 0 fail.
- Code (P3): fenced code ignored in the repeated-heading check; book.toml description missing or outside 100-160 characters reported; SUMMARY.md scanned for em dash and emoji; extractUrls keeps one level of balanced parentheses and strips trailing `*`, backtick and quotes; tests added that fail when the missing-SUMMARY guard, the title exclusion, or the regional-indicator range is removed; the em dash detector is written as U+2014.
- Chapters 01-06 (P2/P3): causal claims softened or removed (Astro Boy "membentuk" industry habits, committee "mengapa ... cepat", members' intent, arthouse audience, "bertahan paling lama", "hampir setiap kelompok usia", Doraemon as Aso's second proposal, "publik lebih mengenal" the Kawaii title); chapter 04 now states that Astro Boy reached US stations in 1963 and frames Akira and Pokémon as the first mainstream wave, with chapter 01's roadmap aligned; Helen McCarthy attributed in the chapter 04 recap; "mereka" reference error in chapter 06 fixed; chapter 05 simulcast generalisation and the undefined term "cultural sinks" removed. The reviewer's "sponsor" finding was checked against the set E researcher report: the University of Minnesota Press page states Meiji Seika sponsored the show, so research item E2 was extended and chapter 02 now attributes the sponsorship to that page.
- Chapters 07-13 (P2/P3): the 34 trillion yen plan breakdown now reads "di antaranya" (parts sum to 32,4); J-LOD described by design, not outcome, and the chapter 07 lesson phrased as a hypothesis; chapter 08 opener attributed to AJA and the 2020 ScreenDaily figure reframed as an earlier one-off; "Streaming adalah mesinnya" softened; MANGA Plus presented as a legal alternative, not a proven answer to piracy, and its launch facts de-duplicated against chapter 05; chapter 10 benefit claims hedged and the 88-spot list attributed to the association's official site; chapter 11 return of Doraemon not implied, 35-year slot claim narrowed, F3 numbers attributed, grammar fixed; chapter 12 KOCCA description narrowed, "revisi ulang" fixed, closing line replaced with a sourced JAniCA figure; Referensi intro now says the three JSTOR or Taylor & Francis DOIs were cited from metadata because the publisher pages blocked retrieval; naming of the planned content body unified ("lembaga pusat komando").

## Re-verification after fixes

| Check | Command | Exit | Result |
|---|---|---|---|
| Focused tests | `bun test tests/scripts/check-book-structure.test.ts tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts tests/serp-description.test.ts` | 0 | 40 pass, 0 fail |
| Book structure | `bun run scripts/check-book-structure.ts soft-power-jepang-lewat-manga-dan-anime` | 0 | 13 chapters, 0 problems |
| Heading colons | `bun run check:headings` | 0 | 0 violations, 58 books |
| Repeated headings | `bun run scripts/check-repeated-headings.ts` | 0 | 0 repeated |
| Build | `bun run build` | 0 | book built, SEO Validation passed (R1-R7), no new warnings |
| Full suite | `bun test` | 0 | 461 pass, 0 fail (474 tests, 52 files) |
| Built meta | description of 14 built pages | n/a | 98-154 characters, none truncated |

The fixes followed the reviewers' suggested replacements; the parent re-read every edited sentence against the research notes (documented self-review of the fixes, no second reviewer round).

## Out-of-scope observations (recorded for the debt sweep)

- scripts/inject-gating.ts `extractLeadText` matches `<p[^>]*>`, which also matches `<pre>`, so code before the first paragraph leaks into a live meta description (reproduced by the checker subagent with a `bun -e` call).
- Across the 57 other books the hardened checker reports 259 truncated openers, 58 chapter titles that differ from SUMMARY, and 29 section headings repeated in two chapters (pre-existing; first measured before the review fixes).
- `scripts/check-copy-rules.mjs` referenced by the review templates does not exist in this repository.

Not read: second review round on the fixed text (not run; fixes were applied verbatim from the findings and re-gated).

## Second review round (follow-up F1, after PR #145 opened)

A fourth staid reviewer re-read all 13 chapters. Verdict before fixes: not correct (2 P1, 13 P2).

| ID | File | Finding | Resolution |
|---|---|---|---|
| S1 (P1) | 05_penggemar-sebagai-duta-tak-resmi.md | Three sentences stated that today's services absorbed the fan-built audience; no notes item links them | Clauses removed or rewritten ("layanan resmi hadir dengan skala yang jauh lebih besar"); section heading renamed to "Layanan Resmi Berskala Besar" |
| S2 (P1) | 10_dari-layar-ke-perjalanan.md | The term *seichi junrei* and its translation are not in the notes | Term removed in both places; the section now describes the visited places directly |

P2 fixes: chapter 05 opener attributed to Sean Leonard (also in the chapter 01 roadmap) and the "who translated" question no longer contradicts chapters 02 and 04; chapter 08 "pasar tambahan" history, "unggul sekali" and the Sony platform inference replaced with note-backed wording; chapter 07 Spiber amount phrased as related to the loss and the office-to-fund causal link removed; chapter 03 Pokémon introduced as a cross-media launch, not a committee title, and the diplomacy effect hedged; chapter 04 "saling mendorong" hedged; chapter 11 two soft-power claims hedged, the hijab cosplay finding narrowed to "menghindari kontak dekat", and the Studio Ubud sentence no longer implies Pierrot made One Piece; chapter 12 state role phrased as "mencoba ikut mendorong".

Re-verification: the checker caught one regression introduced by the fix (chapter 05 opener grew to 157 characters with the attribution) and it was shortened to 148; then `bun run scripts/check-book-structure.ts soft-power-jepang-lewat-manga-dan-anime` exit 0 (0 problems), `bun run check:headings` exit 0, `bun run scripts/check-repeated-headings.ts` exit 0, `bun run build` exit 0 with SEO R1-R7 passed, full `bun test` exit 0 (465 pass, 0 fail, 478 tests). No third reviewer round was run.
