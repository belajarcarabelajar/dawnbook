## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-diagrams-retrofit-6` (roadmap RF6, last of the series) |
| Plan | `docs/code-plan/plans/2026-10-16-dawnbook-diagrams-retrofit-rf6.md` |
| Base branch | `main` (rebased onto `f4ca4f6` before the first push) |
| Type of change | book content (nine books), cached SVGs, heading guard and tests, EWS ch12 sourcing, `db/seed.sql`, docs |
| Reviewer | three independent `staid` reviewers, each verdict `correct` |

## 2. What This Changes

- 23 grounded Mermaid diagrams in the nine g6 books. The tonsilektomi diagrams carry no pain curve: a recovery-phase timeline and the dehydration loop exactly as chapter 11 states it.
- Debt-sweep follow-ups selected after RF5:
  - `check-heading-colons.ts --diff-guard` accepts a lead-in rewrite that changes only the bold part (test first). On the real RF5 rewrite commit the old guard rejected 48 lines, the new one only the 2 lines of a genuine body edit.
  - EWS ch12: the "Target Sendai" column is now "Target kinerja" with a note that its thresholds are illustrative and not Sendai targets; the unsourced "4 menit rata-rata" is replaced by BMKG's own figures (5 minutes, tested at a maximum of 3 minutes since IDRIP, 2025), with a Referensi entry.
- Carry-over: RF5 merge evidence and the RF5 plan's S5 and S6 ticks.
- `db/seed.sql` regenerated; the D1 seed already ran from this tree (23 mermaid blocks for these books).

## 3. Acceptance and Evidence

| Check | Result |
|---|---|
| `bun run build` | exit 0 |
| `bun test` | 685 pass, 13 skip, 0 fail |
| `bun run check:diagrams` / `check:headings` | 0 / 0 violations |
| Structure vs committed baselines | equal for all touched books |
| Build output | 23 inline diagrams equal 23 source blocks |
| Reviews | `docs/code-plan/artifacts/2026-10-16-dawnbook-diagrams-retrofit-rf6-review.md`, all `correct` |

## 4. Risk and Rollback

Two-way door. Merge deploys through CI. Rollback: revert the merge commit, deploy, rerun `migrate-to-d1.ts`.

## 5. Deferred

- EWS ch12 "Realita" values 0.98, 0.35 and 0.72 have no source. `defer: a source check with BMKG reports`
- teori-permainan ch03 names the incumbent's options two ways (Perang Harga or Lawan); tonsilektomi ch11 table gives "Nyeri Hebat Hari 1-7" without a source split; tonsilektomi ch06 step durations do not add up to the stated 45-60 minutes. `defer: a content-consistency pass`

## 6. Checklist

- [x] Branch and worktree from `pr-registry claim`; never force-pushed; nothing committed to main.
- [x] English body, no em dash, no attribution or co-author line, no secrets.
- [x] Body posted with `--body-file`.
