# Review report: books/memahami-algoritma-x-untuk-pembaca

- Date: 2026-10-12
- Scope: working tree of branch `2026-10-12-dawnbook-mengatur-bacaan-x/dawnbook-mengatur-bacaan-x` against `origin/main` 7b8d41a, before the first commit
- Reviewer: independent read-only reviewer subagent (did not write any chapter), rubric `templates/code-review-template.md` (vivera)
- Verdict: **correct** (0 P0, 0 P1, 2 P3)

## 1. Inputs consulted

| Input | Status |
|---|---|
| Review rubric (8-point filter, P0-P3, binary verdict) | consulted in full |
| GEMINI.md sections 1, 8, 9, 14, 15, 16, 18, 21, 24 | consulted |
| Research notes `docs/code-plan/plans/research-memahami-algoritma-x-untuk-pembaca.md` sections 0-3 | consulted in full |
| Plan acceptance criteria AC-1..AC-4 and the opener/closer table | consulted |
| All 12 chapters, SUMMARY.md, book.toml, icon.txt, theme/ | consulted line by line; theme/ byte-identical to books/_template/theme |
| `git status`, `git diff` | consulted |
| `scripts/inject-gating.ts` lines 40-159 (SERP description, maxLen 155) | consulted |
| Local repository copy of twitter/the-algorithm (September 2025 snapshot) | consulted: FeedbackFatigueScorer.scala, home-mixer/README.md, README.md |
| Built `output/` (meta tags, rendered math) | consulted |
| Live web sources, Notion source file, MDBOOK_SYSTEM_RULES.md | not consulted: read-only review against the research notes, which were built from live fetches on the same day |

## 2. Findings

| ID | Priority | Location | Defect | Remedy | Confidence | Resolution |
|---|---|---|---|---|---|---|
| F1 | P3 | `src/content/12_referensi.md:47` | Says production configuration is not in any repository, while the same page and ch06 say `param.rs` values are copied from production config | Narrow the claim to configuration beyond the defaults copied into `param.rs` | 60% | Fixed: sentence now reads "Konfigurasi produksi di luar nilai bawaan yang disalin ke `param.rs` ... tidak tercakup" |
| F2 | P3 | `docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md:349` | Literal em dash character in an added line (copy-rule scan blocks the PR) | Write "em dash (U+2014)" | 55% | Fixed |

## 3. Non-blocking observations and what was done

- ch03:54, ch05:3, ch09:22 described experiments as fully out of reach; the new repository aims to show experiments on roughly 10% or more of traffic. Fixed: "banyak eksperimen" and, in ch03, one sentence on copied defaults and the 10% target.
- ch03:62 "kandidat dibatasi usia 48 jam" named no repository. Fixed: "Di repositori baru, ...".
- ch04 heading "Hanya Interaksi dari Home yang Dihitung" read as absolute. Fixed: "Catatan Kode tentang Interaksi di Home".
- ch03:22 UTEG description is not in the research notes but matches the repository README. Kept.
- ch07:12, ch08:19, ch08:25 contain hedged UI details from the source document that the notes do not list (show-fewer option "jika tersedia", three-dot menu, text inside images escaping muted words). Kept as reader guidance.
- ch02:3 "kebanyakan orang" is an unsourced generalisation inside a rhetorical question. Kept.

## 4. Test reversal

No automated test goes red if the change is reverted. The observable checks that change are AC-3 (`output/manifest.json` contains the slug, books[0]) and the regenerated `functions/lib/built-stats.ts` counts. Recorded as a debt-sweep candidate, not a blocker for a content-only change.

## 5. Verification after the fixes (parent, fresh run)

| Check | Exit | Result |
|---|---|---|
| Session audit script on the book | 0 | PROBLEMS none |
| Em dash in new files | 0 | none |
| `bun run check:headings` | 0 | 0 violations, 57 books |
| `bun run scripts/check-repeated-headings.ts` | 0 | 0 repeated |
| `bun run build` | 0 | SEO R1-R7 passed, sitemap 788 URLs, books[0] = memahami-algoritma-x-untuk-pembaca |

Not read: live URLs during the review itself (resolved by the research wave on 2026-10-12); the old repository's Phoenix and RerankerUtil sources beyond the research notes.
