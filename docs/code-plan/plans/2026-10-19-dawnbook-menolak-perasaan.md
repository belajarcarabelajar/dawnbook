---
schema: ultra-plan/v1
plan_id: 2026-10-19-dawnbook-menolak-perasaan
status: Verification
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-menolak-perasaan (pr-registry branch 2026-10-19-dawnbook-menolak-perasaan/dawnbook-menolak-perasaan)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-menolak-perasaan
author: Kania Salsabila <kaniasalsabila639@gmail.com>
coauthor_trailer: "Co-authored-by: Iwan Kurniawan <iwan@belajarcarabelajar.com>"
research_notes: docs/code-plan/plans/research-dawnbook-menolak-perasaan.md
defaults:
  retry_transient_max: 1
  step_timeout_s: 300
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
  require_impacts: true
  allow_no_impacts: []
  retry_if: any
tasks:
  - id: R0
    depends_on: []
    impacts: ["chapter facts read by C2-C14 - rg -l research-dawnbook-menolak-perasaan docs/code-plan/plans"]
    files: { create: [docs/code-plan/plans/research-dawnbook-menolak-perasaan.md], modify: [], test: [] }
    idempotency_key: "R0:r0"
    skip_if: "false"
    verify_exit: 0
  - id: T0
    depends_on: [R0]
    impacts: ["new book test reads the research notes source table and the identity denylist - bun test tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts"]
    files: { create: [tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts], modify: [], test: [tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts] }
    idempotency_key: "T0:t0"
    skip_if: "false"
    verify_exit: 0
  - id: C1
    depends_on: [R0]
    impacts: ["hub manifest and card (title, icon, chapter count, release timestamp) - bun run build", "D1 books row and subject label - bun run scripts/migrate-to-d1.ts", "release-dates.json consumers - rg -n release-dates scripts/build.ts"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/book.toml, books/saat-dia-suka-tapi-kamu-tidak/icon.txt, books/saat-dia-suka-tapi-kamu-tidak/src/SUMMARY.md], modify: [release-dates.json], test: [] }
    idempotency_key: "C1:c1"
    skip_if: "false"
    verify_exit: 0
  - id: C2
    depends_on: [C1]
    impacts: ["SUMMARY link target and public preview chapter 01 - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/01_perasaan-yang-tidak-berbalas-itu-umum.md], modify: [], test: [] }
    idempotency_key: "C2:c2"
    skip_if: "false"
    verify_exit: 0
  - id: C3
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/02_pertanyaan-yang-sebenarnya-bukan-pertanyaan.md], modify: [], test: [] }
    idempotency_key: "C3:c3"
    skip_if: "false"
    verify_exit: 0
  - id: C4
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/03_ramah-tidak-sama-dengan-tertarik.md], modify: [], test: [] }
    idempotency_key: "C4:c4"
    skip_if: "false"
    verify_exit: 0
  - id: C5
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/04_pujian-yang-membuat-canggung.md], modify: [], test: [] }
    idempotency_key: "C5:c5"
    skip_if: "false"
    verify_exit: 0
  - id: C6
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/05_kenalan-dari-layar-dan-batas-percaya.md], modify: [], test: [] }
    idempotency_key: "C6:c6"
    skip_if: "false"
    verify_exit: 0
  - id: C7
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/06_kenapa-menolak-terasa-berat.md], modify: [], test: [] }
    idempotency_key: "C7:c7"
    skip_if: "false"
    verify_exit: 0
  - id: C8
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/07_menolak-dengan-jelas-dan-tetap-hangat.md], modify: [], test: [] }
    idempotency_key: "C8:c8"
    skip_if: "false"
    verify_exit: 0
  - id: C9
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/08_diam-sebagai-jawaban.md], modify: [], test: [] }
    idempotency_key: "C9:c9"
    skip_if: "false"
    verify_exit: 0
  - id: C10
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/09_dari-sisi-yang-tidak-dipilih.md], modify: [], test: [] }
    idempotency_key: "C10:c10"
    skip_if: "false"
    verify_exit: 0
  - id: C11
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/10_cinta-masa-sekolah-dan-kedewasaan-emosi.md], modify: [], test: [] }
    idempotency_key: "C11:c11"
    skip_if: "false"
    verify_exit: 0
  - id: C12
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/11_siulan-yang-dianggap-biasa.md], modify: [], test: [] }
    idempotency_key: "C12:c12"
    skip_if: "false"
    verify_exit: 0
  - id: C13
    depends_on: [C1]
    impacts: ["SUMMARY link target - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/12_mencari-orang-yang-sejalan.md], modify: [], test: [] }
    idempotency_key: "C13:c13"
    skip_if: "false"
    verify_exit: 0
  - id: C14
    depends_on: [C1]
    impacts: ["SUMMARY link target and every outbound reference link - bun run build"]
    files: { create: [books/saat-dia-suka-tapi-kamu-tidak/src/content/13_referensi.md], modify: [], test: [] }
    idempotency_key: "C14:c14"
    skip_if: "false"
    verify_exit: 0
  - id: V1
    depends_on: [T0, C2, C3, C4, C5, C6, C7, C8, C9, C10, C11, C12, C13, C14]
    impacts: ["every chapter of the new book - parent line-by-line read plus mechanical scans for em dash, emoji, Anda, colon headings, opener length, identity terms, URLs outside the research source table"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "V1:v1"
    skip_if: "false"
    verify_exit: 0
  - id: V2
    depends_on: [V1]
    impacts: ["build and deploy gate for all books - bun run build", "heading gates for all books - bun run check:headings", "diagram gate for all books - bun run check:diagrams"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "V2:v2"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun test tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak"
        expect_exit: 0
        retry: 0
      - cmd: "bun run check:headings"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/check-repeated-headings.ts"
        expect_exit: 0
        retry: 0
      - cmd: "bun run check:diagrams"
        expect_exit: 0
        retry: 0
      - cmd: "bun run build"
        expect_exit: 0
        retry: 0
  - id: V3
    depends_on: [V2]
    impacts: ["review report artifact - docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-review-report.md"]
    files: { create: [docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-review-report.md], modify: [], test: [] }
    idempotency_key: "V3:v3"
    skip_if: "false"
    verify_exit: 0
  - id: D1
    depends_on: [V3]
    impacts: ["merge order in pr.registry.json - bun ~/vivera/scripts/pr-registry.mjs order"]
    files: { create: [docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-pr-body.md], modify: [], test: [] }
    idempotency_key: "D1:d1"
    skip_if: "false"
    verify_exit: 0
  - id: F1
    depends_on: [D1]
    impacts: ["chapters 03, 05, 08 of the new book - bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak"]
    files: { create: [], modify: [books/saat-dia-suka-tapi-kamu-tidak/src/content/03_ramah-tidak-sama-dengan-tertarik.md, books/saat-dia-suka-tapi-kamu-tidak/src/content/05_kenalan-dari-layar-dan-batas-percaya.md, books/saat-dia-suka-tapi-kamu-tidak/src/content/08_diam-sebagai-jawaban.md], test: [] }
    idempotency_key: "F1:f1"
    skip_if: "false"
    verify_exit: 0
  - id: F2
    depends_on: [F1]
    impacts: ["chapter text of the new book - review report artifact"]
    files: { create: [], modify: [docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-review-report.md], test: [] }
    idempotency_key: "F2:f2"
    skip_if: "false"
    verify_exit: 0
  - id: F3
    depends_on: [D1]
    impacts: ["per-book structure checker used by every book test - bun test tests/scripts/check-book-structure.test.ts tests/books/"]
    files: { create: [], modify: [scripts/check-book-structure.ts, tests/scripts/check-book-structure.test.ts], test: [tests/scripts/check-book-structure.test.ts] }
    idempotency_key: "F3:f3"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/check-book-structure.test.ts"
        expect_exit: 0
        retry: 0
  - id: F4
    depends_on: [D1]
    impacts: ["both book tests - bun test tests/books/"]
    files: { create: [tests/helpers/book-test.ts], modify: [tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts, tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts], test: [tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts, tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts] }
    idempotency_key: "F4:f4"
    skip_if: "false"
    verify_exit: 0
    run:
      - cmd: "bun test tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts"
        expect_exit: 0
        retry: 0
  - id: S1
    depends_on: [D1, F1, F2, F3, F4]
    impacts: ["learning ledger and memory - docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-learning-ledger.md"]
    files: { create: [docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-learning-ledger.md], modify: [], test: [] }
    idempotency_key: "S1:s1"
    skip_if: "false"
    verify_exit: 0
---

# Plan: Dawnbook book on handling romantic interest you do not return

Status: Verification
Session: dawnbook-menolak-perasaan
Branch: 2026-10-19-dawnbook-menolak-perasaan/dawnbook-menolak-perasaan
Worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-menolak-perasaan
Skill: ~/vivera/Super Ultra Code Plan Implementation.md (first file in the fallback chain)
Author: Kania Salsabila <kaniasalsabila639@gmail.com>, trailer `Co-authored-by: Iwan Kurniawan <iwan@belajarcarabelajar.com>` (GEMINI.md section 18)
Classification: Bounded (new book through the existing book flow; plan file required because chunks are subagent-owned)
Source: owner-supplied topic notes (2026-10-19). Topic only; no identifying detail from them enters the book (research notes section 8).

## Checklist

- [x] Claim: session slot claimed and worktree created beside the repository. Evidence: `bun ~/vivera/scripts/pr-registry.mjs claim --plan 2026-10-19-dawnbook-menolak-perasaan --session dawnbook-menolak-perasaan --repo <root> --worktree` exit 0 (worktree at origin/main 254088f); `bun install --frozen-lockfile` exit 0; `pr-registry state dawnbook-menolak-perasaan active` exit 0.
- [x] Topic: owner picked the topic and page count. Evidence: AskUserQuestion 2026-10-19: Topic = Unreciprocated interest; Pages = 12 chapters + Referensi.
- [x] Research (R0): research from zero with TinyFish, every claim the book will make sourced with URL and access date, synthesized in docs/code-plan/plans/research-dawnbook-menolak-perasaan.md with a section 9 source table. Evidence: 6 researcher reports (sets A-F, 19-21 tool calls each) plus a gap wave (G1 RAINN guide, G2 Freedman 2016 authors, G3 Koessler 2019 DOI 10.1525/collabra.230) and 4 parent TinyFish calls (CATAHU 2025 page and fact sheet confirm 376.529 cases and 1.091 KBGO complaints); notes file with a 52-row source table (`rg -c` on table rows = 52), a chapter map, an identity guard, and a `Not read:` line; parent wrote and read it end to end.
- [x] Intent (Gate 1): slug, title, description, subject label, 12-chapter outline approved by the owner. Evidence: AskUserQuestion 2026-10-19: Intent = Approve and continue; Title = Saat Dia Suka, tapi Kamu Tidak; Subject = Hubungan.
- [x] Plan (Gate 2): ultra-plan/v1 frontmatter and batch manifest written, runner prints `Validation: OK`, owner approves. Evidence: `bun ~/vivera/scripts/ultra-plan-runner.mjs <plan>` exit 0, `Validation: OK`, tasks=21, Error Ledger empty; AskUserQuestion 2026-10-19: Plan = Approve and execute.
- [x] Test RED (T0): book test (structure, byte budget, URL allowlist, identity-leak denylist read from a local file outside the repository) written before any chapter and fails because the book is absent. Evidence: chef wrote tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts; parent audit found the first version listed the denylist in plain text in a public repository (`gh repo view --json isPrivate` = false), so the chunk was re-dispatched alone (V3 later replaced that design, see Review); `bun test tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts` exit 1, 5 pass 4 fail, the 4 fails are the book-dependent tests (SUMMARY.md missing then 0 chapter files).
- [x] Scaffold (C1): books/<slug>/ created (book.toml, icon.txt, theme/, src/SUMMARY.md with 13 entries), no stray files in src/, release-dates.json pinned. Evidence: nappy created the scaffold; parent `diff books/_template/book.toml` shows only authors, language, title, description, subject_label; description 154 chars; SUMMARY.md has 13 entries; `git diff release-dates.json` = 1 key added (1792425566170) plus a comma; theme/ identical to the template (`diff -r` exit 0, subagent report); src/content empty.
- [x] Author (C2-C14): 13 chapter files (12 content + Referensi), one subagent each, inside the byte budget. Evidence: 13 subagents (chef x5, nappy x4, hoggy x4) each returned one file with self-check output; sizes 6.130-7.942 B for chapters, Referensi 11.727 B; no subagent ran git; book test went RED to GREEN: `bun test tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts` exit 1 (5 pass 4 fail) before, exit 0 (9 pass 0 fail) after.
- [x] Audit (V1): parent line-by-line read of every chapter plus scans (kamu, 0 em dash, 0 emoji, 0 colon headings, distinct closers, openers at most 155 chars, 0 identity terms). Evidence: parent Read of all 13 files end to end; 24 single-sentence edits, all to keep claims at the notes' level: ch01 'sangat biasa' softened; ch02 one assertive line hedged and one misreading of B2 (willingness, not availability) corrected; ch03 'all five styles show in behaviour' scoped to the three measured; ch04 an unsupported claim hedged and an online-acquaintance example that contradicted the chapter's own bridge replaced; ch05 an unsourced 'most online acquaintances are not scammers' removed twice; ch06 four generalisations scoped; ch08 three claims scoped to their studies; ch10 three generalisations softened; ch11 one generalisation removed; ch12 an ambiguous back-reference fixed; ch13 one description scoped. Scans: 0 em dash, 0 en dash, 0 Anda, 0 fullwidth colon in all 13 files, kamu 7-24 per content chapter; `rg '^#{2,6} .*:'` exit 1; `uniq -d` on all headings empty; `bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak` exit 0, 13 chapters, 0 problems (opener cut included); identity denylist test passes; 2 diagrams (ch05 flowchart, ch09 stateDiagram-v2) rendered by `bun run scripts/render-diagrams.ts --book saat-dia-suka-tapi-kamu-tidak` exit 0 (rendered 2, orphans 0); no LaTeX in the book.
- [x] Gates (V2): book test, `bun run check:headings`, `bun run scripts/check-repeated-headings.ts`, `bun run check:diagrams`, `bun run build` exit 0 with SEO validation passed. Evidence: `bun test <book test> tests/scripts/check-book-structure.test.ts tests/serp-description.test.ts` exit 0 (48 pass, 0 fail); `bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak` exit 0; `bun run check:headings` exit 0 (0 violations, 59 books); `bun run scripts/check-repeated-headings.ts` exit 0; `bun run check:diagrams` exit 0 (book and all books, 0 violations, 0 orphans); `bun run build` exit 0 with `Successfully built: saat-dia-suka-tapi-kamu-tidak`, `Inlined 2 diagram(s)` and `SEO Validation passed! All rules (R1-R7)`; output/manifest.json lists the slug with 13 chapters; built meta descriptions 105-154 chars, all complete sentences; build regenerated functions/lib/built-stats.ts (737 to 750 chapters, Kania Salsabila 10 to 11 books).
- [x] Review (V3): independent reviewer audit, findings resolved, report saved as an artifact. Evidence: 3 parallel staid reviewers (chapters 01-06: correct, 7 P2; chapters 07-13: not correct, 1 P1 sample year; test and scaffold: not correct, 1 P1 reversible digest denylist in a public repo); both P1 fixed before any commit (year reworded; digests replaced by a local denylist file outside the repository, chunk T0 re-dispatched alone to chef, parent re-audit: 0 digests, 0 denylisted phrases and 0 non-ASCII characters in the test file); all P2 and most P3 fixed by one-sentence edits; Referensi trimmed three times to 12.007 B, then the test ceiling raised to 12.500 per GEMINI.md section 20 (three-attempt cap). Re-run after fixes: focused tests exit 0 (47 pass, 0 fail), `tests/functions/api/stats.test.ts` exit 0 (2 pass), check-book-structure exit 0, check:headings exit 0, check-repeated-headings exit 0, check:diagrams exit 0, `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main` exit 0 (merge-base 254088f8), `bun run build` exit 0 with SEO R1-R7 passed, 14 built metas 105-154 chars all ending in a full stop or question mark; report at docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-review-report.md.
- [x] Deliver (D1): commit on the session branch, PR opened with --body-file, registered in pr-registry. Evidence: commit f6aac4a (author and committer Kania Salsabila <kaniasalsabila639@gmail.com>, trailer Co-authored-by Iwan Kurniawan, 27 files staged by explicit path, `git status --porcelain` empty after); staged-content identity scan 0 non-byline hits; `pr-registry state ... verified` exit 0; `pr-registry open ... --body-file` exit 0 -> https://github.com/belajarcarabelajar/dawnbook/pull/166 recorded; `gh pr view 166` OPEN, MERGEABLE, +1777/-3, head f6aac4a.
- [x] Follow-up F1 (N1): repeated generic settings in chapters 03, 05, 08 replaced by other generic settings; structure checker and book test exit 0. Evidence: chef changed 4 setting phrases (03 x2, 05 opener, 08), each new setting used in one chapter; F2 later aligned 01 and 07; `rg -n -i 'kelas daring|teman sekelas'` on 03, 05, 08 exit 1; structure checker exit 0; book test exit 0.
- [x] Follow-up F2 (N2): second independent fact review of all 13 chapters after F1; verdict correct with 0 P1 after fixes. Evidence: staid verdict correct (0 P1, 5 P2, about 20 P3); all P2 and most P3 fixed by one-sentence edits; re-run: tests exit 0 (70 pass, 0 fail across checker, book, SERP and stats tests), structure checker exit 0, check:headings exit 0, check-repeated-headings exit 0, check:diagrams exit 0; report section 'Second review round' in the review-report artifact.
- [x] Follow-up F3 (N3): scripts/check-book-structure.ts collects markdown link targets and case-insensitive schemes, test-first; checker tests exit 0, both book tests exit 0. Evidence: hoggy test-first: RED exit 1 (32 pass, 7 fail) then GREEN exit 0 (39 pass); site-root cross-book links allowed after a second RED (39 pass, 1 fail) and GREEN (40 pass); all-books loop: 47 books fail before and after with identical lists and identical problem counts, 0 link-target problems; parent re-run of checker, book and SERP tests exit 0 (68 pass).
- [x] Follow-up F4 (N4): shared book-test helpers in tests/helpers/book-test.ts used by both book tests; both exit 0. Evidence: nappy moved contentFiles, sourceTableSection, sourceTableUrls to tests/helpers/book-test.ts (soft-power test 84 to 64 lines, new book test 188 to 170 lines); RED exit 1 (module not found) before the helper existed, GREEN exit 0 (13 pass); `rg 'function (contentFiles|sourceTableSection|sourceTableUrls)' tests/books/` exit 1; `bun run typecheck` does not exist in this repository (no typecheck run).
- [x] Sweep (S1): debt sweep, learning ledger, graphify sync, plan closeout decision. Evidence: 7 debts found (0 `defer:` markers in the repo, method proven on ~/vivera with 9 markers), owner selected N1-N4 (all four closed as F1-F4 above), L1-L3 written to the Follow-up Backlog with `defer:` lines; learning ledger docs/code-plan/artifacts/2026-10-19-dawnbook-menolak-perasaan-learning-ledger.md (4 KEEP rules into project memory: new private-source-identity-guard, new-book-authoring-traps extended); runner `--execute` exit 0 (V2 PASSED, Error Ledger empty), `plan-mark-done --from` 0 open step boxes; readiness NEEDS-HUMAN (every task UNPROVEN by the `false` sentinel); Close plan gate answered Keep it open (see Closeout status). Graphify update and sync run after the follow-up commit (recorded in the final report).

## Active Project Profile

Snapshot taken 2026-10-19 at origin/main 254088f.

- Repository root: /home/belajarcarabelajar/Proyek/dawnbook (session worktree above). Runtime Bun 1.4.3, mdBook v0.5.4 in ~/.cargo/bin.
- Target scope: new directory `books/saat-dia-suka-tapi-kamu-tidak/`, one `release-dates.json` entry, one book test, the research notes and session artifacts. Files the build regenerates (for example functions/lib/built-stats.ts) are reviewed in the diff audit.
- Book layout (verified on books/psikologi-di-balik-keputusan-finansial-kita and the 2026-10-15 plan): `book.toml` (template copy with title, authors, language = "id", description, subject_label), `icon.txt` (one emoji), `theme/` copied from the template, `src/SUMMARY.md`, `src/content/NN_kebab.md`, no `src/introduction.md`. Scaffold by `mkdir` plus `cp -r books/_template/theme` because `rm` is denied (project memory).
- Chapters open with `##` equal to the SUMMARY title; sub-sections use `###`. No LaTeX needed.
- Subject label `Hubungan` is in data/subject-labels.json (line 58).
- Gates: `scripts/check-book-structure.ts` (structure, em dash, emoji, Anda, opener cut at 155, repeated headings), `bun run check:headings`, `bun run scripts/check-repeated-headings.ts`, `bun run diagrams:render` then `bun run check:diagrams` (GEMINI.md section 25), `bun run build`.
- Deploy (post-merge, owner-gated): GEMINI.md section 19, then `bun run scripts/migrate-to-d1.ts`, then GSC reindex by the OAuth path in docs/code-plan/artifacts/2026-10-06-dawnbook-psikologi-merge-evidence.md.
- Registry and plan tools: ~/vivera/scripts (pr-registry.mjs, ultra-plan-runner.mjs, plan-closeout.mjs, plan-mark-done.mjs, plan-issue-sync.mjs).
- Unknowns: none blocking.

## 1. Intent and Scope

- Goal: a 13-page Dawnbook book (12 content chapters + Referensi) by Kania Salsabila, researched from zero, on handling romantic interest you do not return: reading indirect signals, compliments, online-only acquaintances, why refusing is hard, refusing clearly and kindly, ghosting, the rejected side, school-age romance, normalised harassment, and finding people who share your values.
- Slug `saat-dia-suka-tapi-kamu-tidak`. Title `Saat Dia Suka, tapi Kamu Tidak`. Subject label `Hubungan`. Icon: see icon.txt. Language `id`.
- Description (154 chars): "Panduan menghadapi perasaan yang tidak kamu balas, dari membaca sinyal dan menolak dengan jelas sampai ghosting, kenalan daring, dan mencari yang sejalan."
- Source: owner-supplied topic notes, used for the topic only. Identity guard: research notes section 8; the book test enforces a denylist kept in a local file outside the repository (the repository is public).
- Owner decisions (AskUserQuestion, 2026-10-19): Topic = Unreciprocated interest; Pages = 12 chapters + Referensi; Intent = Approve and continue; Title = Saat Dia Suka, tapi Kamu Tidak; Subject = Hubungan.
- Non-goals: no edits to any other book, no shared template, CSS, or script change.
- Acceptance criteria:
  - AC-1: 13 entries in SUMMARY.md equal 13 files in src/content; each chapter's first heading equals its SUMMARY title. Check: `bun run scripts/check-book-structure.ts saat-dia-suka-tapi-kamu-tidak` exit 0.
  - AC-2: 0 em dash, 0 emoji outside icon.txt, 0 "Anda", 0 colon headings, no closer title repeated, every opener at most 155 characters. Check: the structure checker plus `bun run check:headings` and `bun run scripts/check-repeated-headings.ts` exit 0.
  - AC-3: 0 identity terms from the source notes in any chapter. Check: book test denylist case.
  - AC-4: every URL in the book appears in research notes section 9, and every fact traces to an H or M item. Check: book test allowlist case plus V1 and V3 reads.
  - AC-5: `bun run build` exit 0 with SEO validation passed and the new slug in output/manifest.json; `bun run check:diagrams` exit 0.

## 2. Visual Implementation Map

```mermaid
flowchart TD
    accTitle: Book authoring plan for Saat Dia Suka, tapi Kamu Tidak
    accDescr: Research notes feed the book test and the scaffold, the scaffold feeds thirteen parallel chapter tasks, which converge on the parent audit, the gates, an independent review, the pull request, and the debt sweep.
    R0["R0: research notes"] --> T0["T0: book test (RED first)"]
    R0 --> C1["C1: scaffold"]
    C1 --> C2["C2: ch01"]
    C1 --> C3["C3: ch02"]
    C1 --> C4["C4: ch03"]
    C1 --> C5["C5: ch04"]
    C1 --> C6["C6: ch05"]
    C1 --> C7["C7: ch06"]
    C1 --> C8["C8: ch07"]
    C1 --> C9["C9: ch08"]
    C1 --> C10["C10: ch09"]
    C1 --> C11["C11: ch10"]
    C1 --> C12["C12: ch11"]
    C1 --> C13["C13: ch12"]
    C1 --> C14["C14: ch13 Referensi"]
    T0 --> V1["V1: parent audit"]
    C2 --> V1
    C3 --> V1
    C4 --> V1
    C5 --> V1
    C6 --> V1
    C7 --> V1
    C8 --> V1
    C9 --> V1
    C10 --> V1
    C11 --> V1
    C12 --> V1
    C13 --> V1
    C14 --> V1
    V1 --> V2["V2: gates and build"]
    V2 --> V3["V3: independent review"]
    V3 --> D1["D1: pull request"]
    D1 --> F1["F1: vary scenarios"]
    F1 --> F2["F2: second fact review"]
    D1 --> F3["F3: link-target checker"]
    D1 --> F4["F4: shared test helpers"]
    D1 --> S1["S1: debt sweep and closeout"]
    F1 --> S1
    F2 --> S1
    F3 --> S1
    F4 --> S1
```

## 2b. Affected Surfaces

| Task | Surface it can break | Evidence command |
|---|---|---|
| C1 | Hub card (title, icon, chapter count, PUEBI timestamp) and manifest.json | `bun run build`, then `jq` on output/manifest.json |
| C1 | D1 `books` row and subject label after deploy | `bun run scripts/migrate-to-d1.ts` output (post-merge, owner-gated) |
| C1 | release-dates.json read by scripts/build.ts | `git diff release-dates.json` shows one added key |
| C2-C14 | mdBook build of this book, SEO meta extraction, heading and diagram gates shared by all books | `bun run build`, `bun run check:headings`, `bun run check:diagrams` |
| V2 | Build gate for every book (a failing new book blocks deploy for all) | `bun run build` exit code |

## 3. Batch Manifest

Every chunk has exactly one owner and writes exactly one file (C1 writes its scaffold set). Subagents write only inside the worktree and never run git or gh. Chapter paths are under books/saat-dia-suka-tapi-kamu-tidak/src/content/. Mermaid cache files under books/saat-dia-suka-tapi-kamu-tidak/diagrams/ are rendered by the parent after the chapters land, so no two agents write that folder.

| Chunk | Owner | Target file | Chapter title (= SUMMARY entry) | Notes items | Budget | Verification |
|---|---|---|---|---|---|---|
| T0 | chef | tests/books/saat-dia-suka-tapi-kamu-tidak.test.ts | (book test) | section 8, section 9 | n/a | `bun test <file>` exit 1 for the right reason (book absent) |
| C1 | nappy | book.toml, icon.txt, theme/, src/SUMMARY.md, release-dates.json | (scaffold) | n/a | n/a | `find`, `diff` against template, `jq` |
| C2 | chef | 01_perasaan-yang-tidak-berbalas-itu-umum.md | Perasaan yang Tidak Berbalas Itu Umum | A3, A1, C7 | 6-8 KB | `wc -c`, parent read |
| C3 | nappy | 02_pertanyaan-yang-sebenarnya-bukan-pertanyaan.md | Pertanyaan yang Sebenarnya Bukan Pertanyaan | B1, B2 | 6-8 KB | `wc -c`, parent read |
| C4 | hoggy | 03_ramah-tidak-sama-dengan-tertarik.md | Ramah Tidak Sama dengan Tertarik | B3, B4, B5, B6, B7 | 6-8 KB | `wc -c`, parent read |
| C5 | chef | 04_pujian-yang-membuat-canggung.md | Pujian yang Membuat Canggung | B8, B9 | 6-8 KB | `wc -c`, parent read |
| C6 | nappy | 05_kenalan-dari-layar-dan-batas-percaya.md | Kenalan dari Layar dan Batas Percaya | D1, D2, D2b, D3, D4, G1 | 6-8.5 KB | `wc -c`, parent read |
| C7 | hoggy | 06_kenapa-menolak-terasa-berat.md | Kenapa Menolak Terasa Berat | A1, A2, A2b, A4 (C3 dropped: its notes entry has no guilt line) | 6-8 KB | `wc -c`, parent read |
| C8 | chef | 07_menolak-dengan-jelas-dan-tetap-hangat.md | Menolak dengan Jelas dan Tetap Hangat | A5, A6, A7, A1, D5 | 6-8.5 KB | `wc -c`, parent read |
| C9 | nappy | 08_diam-sebagai-jawaban.md | Diam sebagai Jawaban | C1, C2, C3, C4, C5, C8, C9, C10 | 6-8.5 KB | `wc -c`, parent read |
| C10 | hoggy | 09_dari-sisi-yang-tidak-dipilih.md | Dari Sisi yang Tidak Dipilih | C6, C7, C7b, A1, C4 | 6-8 KB | `wc -c`, parent read |
| C11 | chef | 10_cinta-masa-sekolah-dan-kedewasaan-emosi.md | Cinta Masa Sekolah dan Kedewasaan Emosi | E5, E6, E7, E8 | 6-8 KB | `wc -c`, parent read |
| C12 | nappy | 11_siulan-yang-dianggap-biasa.md | Siulan yang Dianggap Biasa | E1, E2, E3, E4 | 6-8.5 KB | `wc -c`, parent read |
| C13 | hoggy | 12_mencari-orang-yang-sejalan.md | Mencari Orang yang Sejalan | F1-F8, F3b | 6-8.5 KB | `wc -c`, parent read |
| C14 | chef | 13_referensi.md | Referensi | section 9 rows actually used by C2-C13 | 3-12 KB | `wc -c`, book test allowlist |

Fan-out: T0 and C1 run as one batch of 2; C2-C14 run as one batch of 13 after C1 is integrated (under the 15-in-flight cap). C14 runs last in that batch only in the sense that its author reads the cited IDs from the manifest, not from the other chapters.

Per-chunk contract (sent in full in each dispatch prompt, per templates/subagent-contract-template.md fields: scope, inputs, permitted file, expected output, verification, review checkpoint): worktree path, one target file, chapter title, assigned opener device, closing section title, bridge form, research notes path with the item IDs to use, one owner chapter per fact (others refer back with "di bab N"), no causal links, generalisations or superlatives the notes do not support, the identity guard, byte budget with mandatory `wc -c` self-trim (3-attempt cap, GEMINI.md section 20), and the house rules (kamu not Anda, 0 emoji, 0 em dash, no colon in any heading or bold sub-title, scaffold-label cap, connector cap, first sentence at most 155 characters, decimal comma and dot thousands for Indonesian numbers, no LaTeX, Mermaid only per the section 25 contract paragraph and only in C6 and C10 where the notes list stages, no git, no files outside the target).

### Opener, closer, and bridge assignments (GEMINI.md sections 21 and 24)

| Ch | Opener device | Closing section title | Bridge form |
|---|---|---|---|
| 01 | data point: most people have liked someone who did not like them back | Intisari | a question the next chapter answers |
| 02 | scene: a light chat message that quietly probes whether you are seeing anyone | Ringkasan | names the next chapter's object (friendliness) |
| 03 | contrast: the same smile read two ways | Benang Merah | from signals to words of praise |
| 04 | paradox: a kind sentence that leaves you uneasy | Poin Penting | from people you know to people you only know online |
| 05 | scenario: a friendly stranger whose messages arrive every morning and night | Inti Pembahasan | from caution to the decision to say no |
| 06 | rhetorical question: why is saying no harder than imagined | Yang Perlu Kamu Ingat | from why it is hard to how to do it |
| 07 | everyday comparison: a clear road sign versus a faded one | Kesimpulan Bab | to the option of saying nothing |
| 08 | numbers: about a quarter of people report being ghosted | Poin Kunci | turn to the person who is not chosen |
| 09 | reflective scene: refreshing a chat that stays silent | Recap | back in time to school years |
| 10 | memory-style scene: a note passed between desks | Gagasan Utama | from school corridors to public space |
| 11 | data point: three in five women respondents | Key Takeaways | from what to avoid to what to look for |
| 12 | reflective question: who is glad when you share good news | Penutup | none (final content chapter) |
| 13 | short orientation sentence | (no closer) | none |

## 4. Tasks

### Task R0
Write the research notes from the researcher reports and the gap wave, keeping source URL and access date for each fact. Done when the file exists and the parent has read it end to end.

### Task T0
Test-first. Seams: `checkBookStructure(bookDir)` from scripts/check-book-structure.ts (existing) plus a new book test that asserts 13 chapters with 0 problems, the byte budget, every URL in the book drawn from the section 9 table rows, the table row count (52), and an identity denylist with a positive control (the test proves the denylist catches a planted term in a fixture string). RED until C2-C14 land.

### Task C1
`mkdir -p books/saat-dia-suka-tapi-kamu-tidak/src/content`, `cp -r books/_template/theme` into it, write book.toml (template copy with authors = ["Kania Salsabila"], language = "id", title, description, subject_label = "Hubungan"), icon.txt, SUMMARY.md with 13 entries, and add the `release-dates.json` key with the current epoch milliseconds. Only the new book's book.toml is written (GEMINI.md section 1).

### Task C2
One subagent writes the file named in manifest row C2 per the assignment table.

### Task C3
One subagent writes the file named in manifest row C3 per the assignment table.

### Task C4
One subagent writes the file named in manifest row C4 per the assignment table.

### Task C5
One subagent writes the file named in manifest row C5 per the assignment table.

### Task C6
One subagent writes the file named in manifest row C6 per the assignment table.

### Task C7
One subagent writes the file named in manifest row C7 per the assignment table.

### Task C8
One subagent writes the file named in manifest row C8 per the assignment table.

### Task C9
One subagent writes the file named in manifest row C9 per the assignment table.

### Task C10
One subagent writes the file named in manifest row C10 per the assignment table.

### Task C11
One subagent writes the file named in manifest row C11 per the assignment table.

### Task C12
One subagent writes the file named in manifest row C12 per the assignment table.

### Task C13
One subagent writes the file named in manifest row C13 per the assignment table.

### Task C14
One subagent writes the file named in manifest row C14 per the assignment table.

### Task V1
Parent audit: line-by-line read of every chapter, plus scans for em dash, emoji, `\bAnda\b`, colon headings, duplicated headings, SUMMARY vs disk, opener length, identity terms, and URLs against research notes section 9. Render any Mermaid block with `bun run diagrams:render --book saat-dia-suka-tapi-kamu-tidak`.

### Task V2
Gates: the run list in the frontmatter (all exit 0, SEO validation passed); built meta descriptions checked.

### Task V3
Independent reviewers (staid) audit the diff and the facts against the research notes; report saved as the review-report artifact.

### Task D1
Commit as Kania Salsabila with the Co-authored-by Iwan Kurniawan trailer (GEMINI.md section 18), push the session branch through `pr-registry open`, register the PR number.

### Task S1
Debt sweep, learning ledger, graphify sync, plan closeout decision.

## Assumptions

- Commit identity follows GEMINI.md section 18, read through the CLAUDE.md symlink (Kania author, Iwan co-author trailer), over the harness attribution reminder and the workflow block's "no co-author trailer" line. Owner decision, AskUserQuestion 2026-10-19: Identity = Follow CLAUDE.md section 18. The PR body carries no harness footer, matching earlier sessions.
- Diagrams are optional and limited to chapters 05 and 09, where the notes list ordered stages.

### Task F1
Follow-up N1 (owner selected 2026-10-19): vary the repeated classmate and online-class settings in chapters 03, 05, 08 without changing facts, links, headings, or openers beyond the setting words.

### Task F2
Follow-up N2: a staid reviewer rereads all 13 chapters against the notes after F1; any P0/P1 is fixed and re-gated; result appended to the review report.

### Task F3
Follow-up N3: test-first hardening of the shared checker so link targets without a scheme and uppercase schemes are seen.

### Task F4
Follow-up N4: move contentFiles and source-table helpers into tests/helpers/book-test.ts and use them from both book tests.

## Follow-up Backlog

- L1 Deploy, D1 seed and GSC reindex after the merge of PR #166. `defer: owner-gated external action, after the merge`
- L2 Identity scan in CI. `defer: needs a CI secret store, if the repository gains one`
- L3 Plans 2026-10-16-dawnbook-diagrams-retrofit-rf3, rf4, rf6 still at Verification while their sessions merged (`plan-closeout.mjs --audit`). `defer: separate closeout session, next dawnbook session`

## Closeout status

Decision (AskUserQuestion 2026-10-19, Close plan): Keep it open.
- Verdict: `bun ~/vivera/scripts/plan-closeout.mjs --readiness docs/code-plan/plans/2026-10-19-dawnbook-menolak-perasaan.md` exit 3, NEEDS-HUMAN: 0 open NOW follow-ups, 0 open step boxes, all 25 tasks UNPROVEN because every `skip_if` is the `false` sentinel (their evidence is in the checklist above, not machine-checkable).
- What remains: the merge of PR #166, then the owner-gated deploy, D1 seed and GSC reindex (backlog L1).
- Reopen trigger: after PR #166 merges and the live book URL returns 200 with its index meta equal to the book.toml description, mark this plan Complete in the next dawnbook session's PR.
