# Review report: Etimologi dan Derivasi Anthropos (V3)

Three independent read-only reviewers (staid crew) audited the book on 2026-11-15 after the V1 parent audit: facts against the research notes, voice and structure rules (GEMINI.md sections 21, 24, 29), and technical and public-repo safety. No blocker was found. Every finding below is listed with its resolution; pre-edit copies of the chapters are in the session scratch directory (pre-v3/).

## Facts reviewer (0 blockers, 6 should-fix, 13 nits)

| # | Finding | Resolution |
|---|---|---|
| 1 | Referensi missed 30 sources the chapters link | Fixed: all 30 rows added under their chapter, titles from the section 9 table; Referensi budget raised from 11 KB to 16 KB in the test and plan (now 13590 B) |
| 2 | ch04: Alceste's widening withdrawal had no note item | Fixed: replaced by B7's "tidak tahan pada sanjungan kosong dan kemunafikan pergaulan" |
| 3 | ch04: experience-then-withdrawal sequence claimed for Alceste | Fixed: kept for Schopenhauer only (B6) |
| 4 | ch07: genome figures presented as inputs to paleoanthropology | Fixed: sentence removed |
| 5 | ch13 states anthropology = anthrōpos + -logia via New Latin, not stated in ch02 | Fixed: ch02 now states it (A5, S7) |
| 6 | ch08: the 2019 vote framed as choosing the start date | Fixed: vote and its result stated on their own (C16) |
| 7-19 | Nits (ch02 "two umbrellas", ch13 "sebelas kata", ch01 "man" gloss and bab 8 pointer, ch06 livestock goad and "umurnya muda", ch05 "gerak pikirannya sama", ch07 title wording reason and "bisa meniru", ch09 forensic as anthropometry, ch10 generation change and "garis orang tua", ch12 fragment) | Fixed with the reviewer's or an equivalent narrower wording |

## Voice reviewer (0 blockers, 4 should-fix, nits)

| # | Finding | Resolution |
|---|---|---|
| 1 | ch12 sentence fragment about films and the full moon | Fixed |
| 2 | ch10 lead repeated ch09's closing question | Fixed: ch10 reworded |
| 3 | Source-as-subject paragraph openers | Fixed where sharpest: ch02 (AAA, WHO Afrika), ch03 (Bishop), ch06 (Ryder, White), ch10 (Library of Congress twice), ch11 (Encyclopedia.com second mention). Other openers kept: each names the source once where the claim is made |
| 4 | Data-dense paragraphs in ch03, ch07, ch08 | Kept: every number is a CONFIRMED note item and dropping one changes the chapter's point; noted for the owner |
| 5 | Repeated formulas ("di bab 1", "Coba ...", "Bahasa Yunani menyimpan") | Fixed: three "di bab 1" pointers removed (ch03, ch06, ch08), two "Coba" openers removed (ch11, ch12), ch07 Greek-word line reworded |
| 6 | Recap and bridge shapes | Fixed: ch11 recap is now a short paragraph; ch05 bridge no longer names "bab 6" |
| 7 | ch05 never says "kamu" | Fixed |
| 8 | Contrast near-misses (ch04 "padahal", ch06 "Yang berubah adalah") | Fixed; ch11 opener kept (hedged paradox, no "bukan") |
| 9 | ch13 wording slips | Fixed (antropoid second sense, "Gilang juga perlu", question marks); the eleven "di bab N" pointers kept, since the closing chapter is a map of the book |

## Technical reviewer (0 blockers, 1 should-fix, 4 nits)

| # | Finding | Resolution |
|---|---|---|
| 1 | Test default path to the private notes | Kept: same pattern as tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts (env override, slug-only path, no source name); the path names no person or title |
| 2 | Banned phrases quote the notes' wording | Kept: the notes are the owner's own text, not a third-party work |
| 3 | Numeric banned phrases matched by substring | Fixed: phraseRe() with a digit boundary, plus a detector test (positive and negative controls) |
| 4 | Plan stated two Referensi budgets | Fixed: 3 to 16 KB in both places |
| 5 | ch13 "makna keduanya" ambiguity | Fixed (same as voice 9) |

## Gates after the fixes

- `HEAVY_LOCAL=book-test timeout 120 bun test tests/books/etimologi-dan-derivasi-anthropos.test.ts` exit 0, 19 pass, 0 fail
- `check-voice` exit 0; `check-book-structure` exit 0 (14 chapters, 0 problems); `check-heading-colons` exit 0; `check-repeated-headings` exit 0; `check:diagrams --book` exit 0; `bun run typecheck` exit 0
