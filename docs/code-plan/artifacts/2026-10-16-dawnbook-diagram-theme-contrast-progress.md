# Progress Log: diagram theme contrast and per-chapter theme instability

## Task Identity

- Plan: `docs/code-plan/plans/2026-10-16-dawnbook-diagram-theme-contrast.md`
- Session: `dawnbook-diagram-theme-contrast`, branch `2026-10-16-dawnbook-diagram-theme-contrast/dawnbook-diagram-theme-contrast`, worktree `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-diagram-theme-contrast`, base `origin/main` at `7ffe0f9`
- Skill: `/home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md`; `sucp-rules` and `sucp-tdd-debug` loaded through the skill tool
- Classification: Bounded, systematic debugging

## Acceptance Criteria

- A red-capable command reproduces the reported symptom on the real delivery path.
- The root cause names the violated invariant and why it was violated, backed by a differential measurement.
- No production code changes before the owner approves the RCA.

## Current Focus

- Current: gather the C1 to C10 hypothesis chunks.
- Next: synthesize, write the RCA log, ask the Root cause gate.

## Decisions & Rejected Options

- Static SVG theming is not the primary cause: `probe.ts` shows 6568 of 6570 labels at or above 3:1 across 158 SVGs and five themes when the theme class is set before measuring.

## Blockers

- TinyFish MCP is not signed in for this session (C4 report, 2026-10-16). External web evidence cannot be fetched until the owner completes the sign-in. Local measurements do not depend on it.

## Error Ledger

| # | Failure | Classification | Status |
|---|---|---|---|
| E1 | Live pages paint first with the default theme, not the stored one (F2) | infrastructure (Cloudflare Rocket Loader on the zone) interacting with code (mdBook theme scripts carry no `data-cfasync="false"`) | fixed in the build output (`markThemeScriptsCfAsync`); live check pending deploy |
| E2 | quadrantChart labels "Arousal" and "Boredom" at 1.2 to 1.7:1 in light and rust (F3) | test (probe counted a `<line>` fill as background) | closed: paint-aware probe 0 of 6570 |
| E5 | `tests/scrape-shield.test.ts` fails in a fresh worktree (ENOENT `output/contribute.html`) | environment, pre-existing | open, debt |
| E6 | `tests/scripts/gsc-batch-indexing-ping.test.ts` wall-clock flake (`assertLess(par_time, seq_time)`) | test, pre-existing | open, debt |
| E7 | mdBook fails with "Permission denied" on the optional `dawnbook` preprocessor on this VPS because `/etc/profile.d/snipset-android.sh` puts `/root/Android/Sdk/platform-tools` on PATH | environment (root-owned, outside the repo) | open, debt; workaround: drop `/root/*` PATH entries for the build |
| E8 | `probe-theme-paint.ts` false green when no class change precedes FCP (V1) | test | fixed in the spike (`childList: true`) |
| E3 | C4 and C5 research chunks could not fetch any page: TinyFish not authenticated | environment | open, needs owner sign-in |
| E4 | `plan-issue-sync.mjs` exit 1: `~/vivera/plan.issues.json` missing on the VPS (machine-local, gitignored); not created here, because an issue number recorded only on the VPS would let a later laptop sync open a duplicate | environment | open; plan valid, vault mirror published (`plan-publish.mjs` exit 0, vault commit `68c5f516` pushed) |

## Evidence Trail

| Id | Command | Exit | Result |
|---|---|---|---|
| F1 | `cf zones settings get rocket_loader -z <zone>` | 0 | `value on`, `modified_on 2026-06-21T20:00:33Z` |
| F1b | live `GET /books/state-of-flow/` script tags | 0 | theme bootstrap delivered as `type="6028af01d7458a3d27015781-text/javascript"`; only MathJax scripts carry `data-cfasync="false"` |
| F2 | `bun probe-theme-paint.ts https://dawnbook.belajarcarabelajar.com/books/state-of-flow/ --theme navy --runs 4` | 1 | 4/4 runs: theme at FCP `light (no js class)`, final `navy`; class log `1205ms:light sidebar-visible, 1208ms:navy js` with FCP 756 ms |
| F2c | same probe against `http://localhost:8791/books/state-of-flow/` (old local mdBook build, no Rocket Loader) | 0 | 4/4 runs: theme at FCP `navy` |
| F3 | `bun probe.ts <variables.css>` over 158 SVGs x 5 themes | 1 | labels per theme 1314; below 3:1: light 2, rust 2, coal 0, navy 0, ayu 0 (all quadrantChart `state-of-flow/89fdb4768425.svg`) |
| F4 | live `GET /books/state-of-flow/content/04_...` | n/a | HTTP 401 (gated); index pages HTTP 200 |

## Chunk Results (gathered 2026-10-16)

| Chunk | Verdict | Parent check |
|---|---|---|
| C1 Rocket Loader replay | H1 confirmed; two scripts (default themes in head, bootstrap in body) must bypass together | re-ran A/B/C: exit 1, 1, 0 |
| C2 Chromium late switch | H3 disproven, 0 of 768 comparisons differ | report read; harness kept in `C2/` |
| C3 WebKit late switch | H2 disproven for WPE WebKit 27.2; iOS compositor untested. Used a /tmp-only libevent symlink and `PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1`, no root, no install | report read |
| C4 browser bug research | blocked: TinyFish not signed in | n/a |
| C5 Rocket Loader docs | blocked: TinyFish not signed in; repo facts only (MathJax fix `992bfbb`) | n/a |
| C6 theme writer audit | H4 disproven | report read |
| C7 real chapter cascade | H8 disproven, 0 fill and ratio differences over 6570 labels | report read |
| C8 unthemed elements | H7 disproven; F3 failures were a probe defect (line fill) | re-ran `--paint-aware`: exit 0 |
| C9 timeline | nothing theme-related shipped with Mermaid; the release made a pre-existing flash visible | commits spot-checked |
| C10 fix surfaces | A head.hbs early script, B data-cfasync in the post-build pass, C Cloudflare rule, D index.hbs override | `build.ts:37` and the three markers confirmed |

## Fix Verification (fan-out, 2026-10-16)

| Chunk | Verdict | Evidence |
|---|---|---|
| V1 end to end with the real Rocket Loader | green | FIXED 0 of 100 loads mismatched (3 modes x index and chapter); CONTROL red in every mode; no new errors |
| V2 sibling-caller audit | safe | callers, markup parsers, CSP, script order, const redeclaration; follow-ups F1 to F4 |
| V3 standards review | correct | no qualifying finding; copy rules clean; design note: divergent change in `inject-gating.ts` |
| V4 spec review | correct | one P2 (stale plan status and log headings), fixed |
| V5 full build, mdBook 0.5.3 | green | build exit 0, 853/853 toggle pages marked, byte-identical otherwise; check:headings and check:diagrams exit 0 |
| V6 suite re-run and mutation | green | new test 7/7 on 4 runs; neighbours 32/32; identity mutant fails 4/7 |

## Follow-Up Backlog (Session-Close Debt Sweep)

- (filled at Step 6)

## Session Log

- 2026-10-16: claimed session, created worktree, wrote plan checklist, built `probe.ts` and `probe-theme-paint.ts`, ran F1 to F4, wrote the subagent contracts, dispatched C1 to C10 in one batch.
