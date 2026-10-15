# Session Learning Ledger: dawnbook-diagram-followups

- **Sessions:** dawnbook-diagram-followups (PR #150), dawnbook-seed-after-diagram-followups (seed PR)
- **Plan file:** `docs/code-plan/plans/2026-10-16-dawnbook-diagram-followups.md`
- **Written at:** 2026-10-16

## Mistake Log

| # | Category | Trigger | Signal | Cost | Correct move |
|---|---|---|---|---|---|
| M1 | `premature-guess` | Dispatched the tonsillectomy edit from a research summary that generalised two small studies into an age split ("teens and adults peak later") | The fact reviewer found the added children's source says children also have a second peak at days 5-8 | 2 fix commits, 2 review rounds | Paste the exact source sentence behind every clause into the edit contract, and reject a summary that merges sources into a new claim |
| M2 | `rule-miss` | Ran `bun test` in a fresh session worktree without `bun install` | 87 diagram tests failed with "cannot resolve the installed mermaid package; run bun install" | 1 rerun | Run `bun install --frozen-lockfile` right after `git worktree add`, before any test |
| M3 | `premature-guess` | Tried to verify gated chapters live with a spoofed Googlebot user agent | HTTP 401: the middleware verifies real crawlers | 1 call | Verify gated content in the build output of the merged tree, and the public chapter 01 live |

## Distilled Rules

| # | Rule | Minimum signal | 30-day horizon | Keep? | Kind |
|---|---|---|---|---|---|
| R1 | WHEN dispatching a factual content edit from research → DO quote the source sentence for each clause in the contract, NOT a synthesised summary | Y | Y | KEEP | judgement |
| R2 | WHEN a session worktree is created → DO `bun install --frozen-lockfile` before tests or gates, NOT trust a test run in a tree without node_modules | Y | Y | KEEP | mechanical (the claim output could print it); memory until then |
| R3 | WHEN verifying a gated Dawnbook chapter after deploy → DO check the build output of the merged tree, NOT a spoofed crawler user agent | Y | Y | KEEP | judgement (project fact) |

KEEP rules go to the Dawnbook project memory (`mermaid-diagram-pipeline-traps` and `followup-session-traps`). No global promotion proposed.
