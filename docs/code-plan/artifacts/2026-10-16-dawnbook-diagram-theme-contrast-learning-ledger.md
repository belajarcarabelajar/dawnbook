# Session Learning Ledger: diagram theme contrast (2026-10-16)

## 1. Identity

- Plan: `docs/code-plan/plans/2026-10-16-dawnbook-diagram-theme-contrast.md`, PR #165
- Host: vps-bcb (Debian 13, non-root user)

## 2. Mistake Log

| # | Category | Trigger | Signal | Cost | Correct move |
|---|---|---|---|---|---|
| 1 | `premature-guess` | `probe.ts` treated every element under a label with a non-none fill as background | two quadrantChart labels "failed" on an rgb(51,51,51) shape that is a 1 px `<line>` | one chunk (C8) spent explaining a false failure | count a shape only when `isPointInFill` holds at the sample point |
| 2 | `premature-guess` | `probe-theme-paint.ts` judged the first-paint theme by class name, and its observer watched class mutations only | V1 caught a false green on a chapter; C1 and C10 caught the dark-OS case (coal fallback has no theme class) | the Phase 0 loop could have reported OK on a broken page | read the resolved `--bg` at first contentful paint and record the parse-time class (`childList`) |
| 3 | `rule-miss` | dispatched two research chunks that require TinyFish without checking it was signed in | both chunks returned "blocked" with no fetch | two agent runs, no external evidence | check the TinyFish tool list (only `authenticate` exposed means signed out) in the parent before dispatching web research |
| 4 | `retry-blind` | read the tail of the full `bun test` log and named the wrong failing test (donation-badge) | the `(fail)` line pointed at scrape-shield | one extra command | grep `^\(fail\)` before naming a failure |

## 3. Distilled Rules

| # | Candidate rule | Minimum-Signal | 30-Day Horizon | Keep? | Kind |
|---|---|---|---|---|---|
| 1 | WHEN verifying what a Dawnbook page does at first paint (theme, scripts, hide or reveal) → DO measure the live page or a replay through Cloudflare's Rocket Loader rewrite, NOT a local mdBook build, which never passes through Rocket Loader | Y | Y | KEEP | judgement |
| 2 | WHEN adding an inline script to Dawnbook book pages that must run before paint → DO mark it `data-cfasync="false"` together with every script it reads globals from, NOT only the script itself | Y | Y | KEEP | mechanical for mdBook's theme scripts (build check in `markThemeScriptsCfAsync`); judgement for new scripts |
| 3 | WHEN checking which theme a page painted → DO compare the resolved `--bg` colour, NOT the `<html>` class name | Y | Y | KEEP | judgement |
| 4 | WHEN dispatching web research on this VPS → DO confirm TinyFish is signed in first, NOT let each chunk discover the block | Y | Y | KEEP | judgement |
| 5 | WHEN measuring SVG text contrast via `elementsFromPoint` → DO filter with `isPointInFill` | N (spike-only harness, recorded in the spike README) | Y | NO-OP | |
| 6 | WHEN a full test log fails → DO grep the `(fail)` lines | N (already in sucp-rules, Full Log Triage) | Y | NO-OP | |

## Environment Improvements

| # | Kind | What happened | Proposed change | Keep? |
|---|---|---|---|---|
| 1 | `information-access` | `plan-issue-sync.mjs` exit 1 on the VPS: `~/vivera/plan.issues.json` is machine-local and absent here | note in the follow-up-session memory that issue sync runs from the laptop | KEEP (memory) |
| 2 | `information-access` | mdBook fails with "Permission denied" on the optional `dawnbook` preprocessor because `/etc/profile.d/snipset-android.sh` adds `/root/Android/Sdk/platform-tools` to PATH | memory note with the PATH workaround; the root-owned file is the owner's to change | KEEP (memory) |
| 3 | `tool-economy` | no mdBook on the VPS; a chunk downloaded v0.5.3 into `/tmp` | memory note that `/tmp` binaries vanish; `cargo install mdbook --version 0.5.3` for a durable copy | NO-OP (one-off) |

## 4. Promotion Decision

| Rule # | Destination | Why | Approval |
|---|---|---|---|
| 1, 2, 3 | project memory (`rocket-loader-first-paint`) and GEMINI.md if the owner selects the docs follow-up | repo-scoped | not required |
| 4 and env 1, 2 | project memory (`followup-session-traps`) | VPS-scoped | not required |

## 5. Carry-Forward Pointer

Memory: `rocket-loader-first-paint.md`, `followup-session-traps.md` in the dawnbook project memory.
