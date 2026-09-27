# Design Spec: Dawnbook "Kenapa Kita Gampang Percaya Hoax?"

> Brainstorming / design artifact (Gate 1). Produced before the implementation plan.
> Authoring language of the book: **Indonesian** (`language = "id"`), matching every other
> book under `books/`. This spec and the plan are written in English to match the existing
> `docs/` convention (audit reports). No book files are created until the plan is approved.

## 0. Request

Create a new Dawnbook titled **"Kenapa Kita Gampang Percaya Hoax?"**, author **Kania Salsabila**,
with **12 systematically ordered modules**. No source material was supplied, so the module
structure and the theoretical spine were derived from a focused literature scan (see §4).

## 1. Classification

**Bounded (with subagent fan-out).** It is one new book that follows the already-documented
Dawnbook A–Z pipeline (`MDBOOK_SYSTEM_RULES.md`, Phases A–E) with no new architecture,
interface, or dependency. It outgrows a single checklist (16 tasks, one subagent per chapter
per Rule R16), so it requires a real `ultra-plan/v1` plan file validated by the runner.

The formal **deep-research report workflow is skipped**: the implementation choice does not
depend on selecting a library, framework, or RFC. The *topical* research needed to compose
the modules is captured in this spec, and every citation in the Referensi chapter will be
re-verified via web search during authoring per Rule R23 / R7.7.5.

## 2. Active Project Profile

| Field | Value |
|---|---|
| Repository root | `/home/belajarcarabelajar/dawnbook` |
| Target scope | `books/kenapa-kita-gampang-percaya-hoax/**` (new dir only) + build output |
| Slug | `kenapa-kita-gampang-percaya-hoax` (matches `/^[a-zA-Z0-9_-]+$/`, no leading `_`) |
| Runtime | Bun (`bun run build`), mdBook static generator |
| Pre-flight checks | `scripts/check-latex-support.ts`, `scripts/check-media-support.ts` |
| Build command | `bun run build` |
| Template | `books/_template/` (clone `book.toml`, keep `additional-css`/`additional-js`) |
| Subject label | `Psikologi` (verified present in `data/subject-labels.json`) |
| Protected paths | Clerk auth (S7), deploy scripts, D1 migrations, other books |
| Reference book | `books/bias-kognitif/` (nearest topical + structural sibling) |

Derived from the repository, not asked from the user.

## 3. Global Constraints (from MDBOOK_SYSTEM_RULES.md)

- `book.toml` cloned from template; `language = "id"`, `mathjax-support = true`,
  `subject_label = "Psikologi"`, `additional-css`/`additional-js` preserved (R8).
- First chapter filename begins with `01` (public preview gating); last is `referensi`.
- All chapter files live in `src/content/`, named `/^\d{2}_[a-z0-9][a-z0-9-]*\.md$/`.
- Every chapter opens with `##` (H2), never `#` (H1) (Phase B, header rule).
- `SUMMARY.md`: plain text, no emoji, one `- [` entry per module (R7, R9).
- Zero emoji in any `src/content/*.md` and `SUMMARY.md`; only `icon.txt` may hold an emoji (R22).
- Zero em-dash (`—`) anywhere in chapter text (R7.7.7).
- Inline math `\\( ... \\)`, block math single-line `\\[ ... \\]`, multi-letter vars in `\text{}` (R10, R15).
- Pronoun "kamu", not "Anda"; avoid AI cliches; rich markdown (tables, blockquotes, lists) (R7.7).
- `src/introduction.md` and any raw/temporary files deleted after authoring.
- Referensi chapter: APA 7, every entry a real, web-verified deep link / DOI, no bare homepages (R23).
- **Out of scope for this plan:** Phase F (D1 seed), Phase H (deploy), Phase I (post-deploy).
  These touch production and credentials and require separate explicit approval.

## 4. Researched Module Spine (theoretical basis)

The 12 modules follow a deliberate learning arc: phenomenon → anatomy → cognitive machinery
→ amplifiers → persistence → defenses → references. Each module's core theory and anchor
sources (to be re-verified during authoring):

1. **Pengantar: Fenomena Hoaks di Era Digital** — scope, why the topic matters, how false
   news spreads faster than truth online (Vosoughi, Roy & Aral, 2018, *Science*).
2. **Anatomi Hoaks: Definisi, Jenis, dan Siklus Penyebaran** — misinformation vs
   disinformation vs malinformation; the information disorder framing (Wardle & Derakhshan, 2017).
3. **Dua Sistem Berpikir: Otak Cepat vs Otak Lambat** — dual-process theory, System 1 / System 2
   (Kahneman, 2011; Evans & Stanovich, 2013).
4. **Heuristik dan Bias Kognitif Pemicu Percaya Hoaks** — confirmation bias, availability
   heuristic, source/familiarity heuristics (Tversky & Kahneman, 1974; Pennycook & Rand, 2021, *TiCS*).
5. **Efek Kebenaran Ilusi: Kekuatan Pengulangan** — illusory truth effect and processing
   fluency (Hasher, Goldstein & Toppino, 1977; Dechêne et al., 2010; Fazio et al., 2015).
6. **Emosi, Kemarahan Moral, dan Mesin Viralitas** — emotion and moral outrage drive sharing
   (Brady et al., 2017; McLoughlin, Brady et al., 2024, *Science*).
7. **Penalaran Termotivasi dan Identitas Kelompok** — motivated reasoning, identity-protective
   cognition, myside sharing (Kahan, 2013; Van Bavel & Pereira, 2018).
8. **Ekosistem Digital: Algoritma, Ruang Gema, dan Filter Bubble** — recommender systems,
   selective exposure, echo chambers (Pariser, 2011; Bakshy, Messing & Adamic, 2015, *Science*).
9. **Efek Pengaruh Berkelanjutan: Kenapa Koreksi Sering Gagal** — continued influence effect,
   backfire concerns, effective debunking (Lewandowsky et al., 2012; Lewandowsky et al., 2020).
10. **Literasi Digital dan Berpikir Kritis** — lateral reading, SIFT, analytic reasoning as a
    shield (Wineburg & McGrew, 2019; Pennycook & Rand, 2019).
11. **Verifikasi Fakta dan Inokulasi: Membangun Ketahanan** — fact-checking, accuracy nudges,
    prebunking / inoculation theory (Pennycook et al., 2021, *Nature*; Roozenbeek & van der Linden, 2022).
12. **Referensi** — APA 7, web-verified deep links / DOIs for every source above.

## 5. Acceptance Criteria

- AC-1: `books/kenapa-kita-gampang-percaya-hoax/` scaffolded from template.
- AC-2: `book.toml` has `language = "id"`, `mathjax-support = true`, `subject_label = "Psikologi"`,
  title, author `Kania Salsabila`, and preserved CSS/JS directives.
- AC-3: `SUMMARY.md` lists exactly 12 modules, plain text, first targets `01_...`, last is Referensi.
- AC-4: 12 chapter files in `src/content/` matching the naming regex, each opening with `##`,
  zero emoji, zero em-dash, valid LaTeX delimiters.
- AC-5: `introduction.md` and any temporary files removed.
- AC-6: `bun run scripts/check-latex-support.ts` and `check-media-support.ts` both exit 0.
- AC-7: `bun run build` exits 0 and produces `output/books/kenapa-kita-gampang-percaya-hoax/index.html`.
