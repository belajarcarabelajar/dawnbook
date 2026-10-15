## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-diagram-followups` (depends on `dawnbook-mermaid-diagrams`, merged in #148) |
| Plan | `docs/code-plan/plans/2026-10-16-dawnbook-diagram-followups.md` |
| Base branch | `main` |
| Head branch | `2026-10-16-dawnbook-diagram-followups/dawnbook-diagram-followups` |
| Type of change | content fix (four books), docs |
| Reviewer | independent fact review (staid), verdict `correct` after two fix rounds |

## 2. What This Changes

The diagram inventory of #148 found four books whose chapters contradict each other, so no diagram could be drawn there. Each contradiction is now resolved against primary sources fetched on 2026-10-16, with line-level edits only:

- **Ikigai:** chapters 02 and 08 now use the zone definitions that chapter 03 already used (Winn 2014, reproduced by Garcia and Miralles): Mission = love + world needs, Profession = skill + paid; pillar headings no longer carry zone names. Winn (2014) added to the references.
- **Tonsillectomy:** the pain course is stated per source: young children often hurt most in days 1-3 (Lavy 1997), pain can rise again around days 5-8 when the eschar separates, also in children (Medikondu 2025), adults can be worst around days 3-7 (NHS Bedfordshire leaflet), patients over ten tend to stay sore until about day 9 (Lavy). Two DOIs and the NHS leaflet added; typo "menyaikkan" removed.
- **InaTEWS (EWS book):** the "four-hour command chain" becomes a four-stage chain; the 5-minute target applies to BMKG's first warning (BMKG 2012 manual), dissemination and response belong to other institutions; the end message comes at the earliest 2 hours after the first; Awas/Siaga thresholds no longer overlap at 3 m; issue time is no longer called lead time; a dead BMKG link (404) replaced.
- **Pedagogy:** the "72% total" row (100 minus 28 in the source, contradicting its own 31%) is removed and the text states 31% versus 28%; the Marliana reference gets its printed pages (80-103) and a working link.

The parent plan's FU1-FU4 are marked resolved and its S10 ticked; the merge evidence of #148 is committed.

**Non-goals:** the D1 `content_md` refresh and `db/seed.sql` (done after this merge deploys, in the seed PR); other pre-existing problems of these books (openers over 155 characters, two repeated closers), recorded as follow-ups.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Each changed sentence is supported by a cited source | C1-C4 | independent fact review | verdict `correct` (two rounds; all P1 and P2 findings fixed) |
| AC-2 | No new structural problem in the four books | C1-C4 | `bun run scripts/check-book-structure.ts <slug>` | identical to the pre-edit baseline for all four books |
| AC-3 | House rules hold | C1-C4 | `bun run check:headings`; scan of added lines | 0 violations; no em dash, no "Anda" |
| AC-4 | Build and tests clean | C5 | `bun run build`, `bun test` | exit 0; 658 pass, 13 skip, 0 fail |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Headings | `bun run check:headings` | 0 | 0 violations, 58 books |
| Book structure | `bun run scripts/check-book-structure.ts <slug>` x4 | 1 (baseline) | same problem list as before the edits |
| Build | `bun run build` | 0 | diagram gate 0 violations; SEO validation passed |
| Tests | `bun test` | 0 | 658 pass, 13 skip, 0 fail |

- **Before:** ikigai chapter 08 defined Mission as skill + world needs while chapter 03 said love + world needs; tonsillectomy chapter 08 said days 1-2 are mild while chapter 10 said days 1-3 are the worst; EWS chapter 04 described a four-hour chain against a 5-minute target; pedagogy chapter 05 listed 72% as the total of a 31% row.
- **After:** each pair agrees and cites its source.

## 5. Independent Review

- [x] A reviewer that did not write the edits re-fetched the sources and checked every changed sentence; report in `docs/code-plan/artifacts/2026-10-16-dawnbook-diagram-followups-review-report.md`.
- [x] The parent audited every diff and re-ran the gates.
- [x] Every P1 and P2 finding is fixed in this PR; remaining P3 items are listed in section 7.

**Reviewer verdict:** `correct`. It changes to `not correct` if a cited source does not contain the clause attributed to it.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Eleven chapter files and four reference lists in four books; no code. |
| Door | Two-way: a revert restores the previous text. |
| Rollout | Merge deploys through CI; D1 `content_md` refreshed afterwards with `migrate-to-d1.ts`. |
| Health signal | The changed public chapters render; `bun run check:headings` stays at 0. |
| Rollback | `git revert` of the merge commit, then the normal deploy and a D1 refresh. |
| Compatibility | N/A: Markdown content only. |

## 7. Pre-Existing Issues and Deferred Debt

- Chapter openers longer than 155 characters in all four books (ikigai 03, 07, 08; tonsilektomi 02, 13, 14; EWS 01, 02, 07, 08, 09; pedagogy 03, 07, 09, 12) and two repeated closing headings. `defer: a content-hygiene session per GEMINI.md sections 8 and 21`
- EWS chapter 12 column header "Target Sendai" covers rows whose targets come from BMKG, and "4 menit rata-rata" is unsourced. `defer: EWS retrofit session RF5`
- Marliana's DOI is registered with a doubled prefix (`10.21009/10.21009/AKSIS.010105`); the entry links the article page instead. `defer: publisher fixes the DOI`
- The subject of commit 58c36bf says "four-message chain" while the diff names four stages. `defer: none, history is not rewritten`

## 8. Checklist

- [x] Branch and worktree came from `pr-registry claim`.
- [x] Nothing was committed directly to the base branch.
- [x] Title is imperative; the body is in English.
- [x] No em dash in this body, the commit messages, or the added book lines.
- [x] No attribution footer, watermark, badge, or co-author line.
- [x] No secrets in the diff.
- [x] PR body written to a file and posted with `--body-file`.
- [ ] Registered in the registry after the PR opens.
- [ ] Plan closeout decided before the merge.
