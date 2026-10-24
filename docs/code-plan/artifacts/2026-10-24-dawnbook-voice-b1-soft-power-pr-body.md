## What

Section 29 voice pass for "Soft Power Jepang lewat Manga dan Anime" (task B1 of plan `2026-10-24-dawnbook-voice-pass-six-books`), plus the shared voice checker (task G1).

- All 12 content chapters rewritten as the author's essay: sources named once, research turned into one or two sentences of insight, no stock connectors, no "bab berikutnya" bridges, varied closers. `13_referensi.md` is unchanged.
- `scripts/check-voice.ts` (new): per-chapter caps from GEMINI.md section 29, CLI `<slug>... | --all`, exit 1 on problems and on a book with no checkable chapters, exit 2 on bad arguments. The Harvest Moon test now imports it; the soft-power test asserts 12 chapters, 0 problems.
- Plan status Draft to Approved (owner, 2026-10-24) and G1 ticked.

## Review

Two independent reviewers compared old and new text in full (chapters 01-06 and 07-12) and returned "not correct" with 14 P1 findings: new facts, strengthened hedges, causal order that the sources do not state, and intervals computed by the writer. Every P1 and P2 was applied with the reviewers' replacement text, which restores the old wording. Remaining derived figures were removed (including a new chapter 06 heading "Hampir Berumur Dua Dekade", now back to the old heading). The checker review found five defects (C1-C5); each got a failing test first.

## Verification

- `bun test tests/books/soft-power-jepang-lewat-manga-dan-anime.test.ts tests/scripts/check-voice.test.ts tests/books/pelajaran-hidup-dari-harvest-moon-back-to-nature.test.ts`: exit 0, 41 pass, 0 fail.
- `bun run scripts/check-voice.ts soft-power-jepang-lewat-manga-dan-anime`: exit 0 (12 chapters, 0 problems).
- `bun run scripts/check-book-structure.ts soft-power-jepang-lewat-manga-dan-anime`: exit 0.
- `bun run scripts/check-heading-colons.ts`, `check-repeated-headings.ts`, `bun run check:diagrams`: exit 0.
- `bun ~/vivera/scripts/check-copy-rules.mjs --diff origin/main`: exit 0.
- `bun run build`: exit 0, SEO validation R1-R7 passed; no build warning names a soft-power chapter.

Links only removed, never added (URL diff against the pre-rewrite copies exits 0); every Mermaid block unchanged byte for byte.

Refs #188
