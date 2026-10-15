---
schema: ultra-plan/v1
plan_id: 2026-10-16-dawnbook-mermaid-diagrams
status: Draft
version: 1
runner_contract: true
skill: "super-ultra-code-plan (first file found in the chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-mermaid-diagrams (pr-registry branch 2026-10-16-dawnbook-mermaid-diagrams/dawnbook-mermaid-diagrams)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-mermaid-diagrams
author: Iwan Kurniawan <iwan@belajarcarabelajar.com>
coauthor_trailer: none
---

# Build-time Mermaid diagrams for every Dawnbook

## Session checklist

- [x] S1 Explore: active profile recorded (build pipeline, `dawnbook` preprocessor, deploy path, CI, existing checks) with the commands that proved each fact. Evidence: R1 and R3 reports synthesized into `research-mermaid-diagrams.md`; parent re-read `scripts/builder/mdbook-runner.ts:6-24,70` and `.github/workflows/deploy.yml` (exit 0)
- [x] S2 Research: Mermaid CLI, Mermaid theming/accessibility, and mdBook preprocessor facts read from primary sources with TinyFish, cited with date. Evidence: R2 and R4 reports with URLs dated 2026-10-16; parent reproduced `mmdc` exit 1 without `-p` and exit 0 with `-p` (32,173 bytes), and found `<p>` labels in the SVG; inventory g1-g6 written (356 lines, em-dash (U+2014) scan with `rg -c` exit 1 = none)
- [x] S3 Spike: one sample diagram rendered locally with `mmdc` to light and dark SVG, render time and file size measured. Evidence: `docs/code-plan/spikes/2026-10-16-mermaid-render/report.md`; parent viewed 3 screenshots (light 1280, coal 1280, coal 375 scroll), re-ran `bun test` in `p3-integration/` (11 pass, 0 fail, exit 0), re-rendered `p2-types/08-xychart-bar.mmd` (exit 0, `aria-roledescription="xychart"`) and `90-syntax-error.mmd` (exit 1, no SVG written)
- [ ] S4 Design: design sections shown in chat and approved through the question tool
- [ ] S5 Plan: task frontmatter written, `ultra-plan-runner.mjs` prints `Validation: OK`, Mermaid map matches `depends_on`
- [ ] S6 Gate 2: plan approved through the question tool
- [ ] S7 Execute: chunks dispatched per batch manifest, each chunk past the parent diff audit gate
- [ ] S8 Verify: tests, `bun run build`, heading and content gates run locally with exit codes, 0 failures
- [ ] S9 Deliver: commit on the session branch, PR body file per template, PR opened and registered
- [ ] S10 Sweep: session-close debt sweep, learning ledger, plan closeout decision, graphify sync

## Research wave manifest (read-only, no file writes)

| Chunk | Owner | Scope | Expected output | Verification |
|---|---|---|---|---|
| R1 | timid | Build pipeline: `scripts/build.ts` Markdown pre-processing, `[preprocessor.dawnbook]`, `sync-template.ts`, `deploy-website.sh`, CI, output layout, theme class switching | Integration points with file:line | parent re-reads cited lines |
| R2 | aqua | Mermaid CLI rendering: `mmdc` flags, Node API, one-browser batch rendering, Puppeteer needs, render cost | Cited facts with date | parent re-fetches one source |
| R3 | timid | Rules and gates: where rules live, authoring dispatch templates, content gates that would see a ` ```mermaid ` block (emoji, em-dash, headings, meta description, D1 seed, search index) | Surfaces list with file:line | parent re-reads cited lines |
| R4 | aqua | Mermaid syntax: diagram types (incl. xychart, timeline, quadrant, sankey), accessibility (`accTitle`/`accDescr`), theming, `htmlLabels`/`foreignObject`, security level; `mdbook-mermaid` as the client-side alternative | Cited facts with date | parent re-fetches one source |
| R5-R10 | timid/aqua alternating | Diagram-candidate inventory, 6 groups of 9-10 books | Per book 0-3 grounded candidates with source lines | parent spot-checks 3 candidates |

## Approval log

| Gate | Answer | Date |
|---|---|---|
| `Intent` | Approve: A tooling (build-time Mermaid to inline SVG), B rules for authoring subagents, C retrofit of existing books | 2026-10-16 |
| `Probe` | Run the spike (3 diagrams, light and dark theme, 375 px and 1280 px) | 2026-10-16 |
| `SVG cache` (clarifying) | Commit the rendered SVG cache; CI never renders | 2026-10-16 |
| `Rollout` (clarifying) | One tooling PR (this session), then 6 retrofit PRs of about 10 books each | 2026-10-16 |

## Spike manifest (prototype only, under `docs/code-plan/spikes/2026-10-16-mermaid-render/`)

| Chunk | Owner | Question | Permitted writes | Verification |
|---|---|---|---|---|
| P1 | chef | Can one inline SVG follow all five mdBook themes through CSS variables, and do labels fit their boxes at 375 px and 1280 px? | `docs/code-plan/spikes/2026-10-16-mermaid-render/p1-theme/`, `/tmp/mermaid-spike/p1/` | screenshots inspected by the parent |
| P2 | nappy | Which diagram types render correctly and deterministically under the locked config, and how does a parse error surface? | `docs/code-plan/spikes/2026-10-16-mermaid-render/p2-types/`, `/tmp/mermaid-spike/p2/` | per-type table with exit codes, parent re-runs one render |
| P3 | hoggy | What does mdBook 0.5.4 do with an inline SVG block, and what reaches the meta description and the search index? | `docs/code-plan/spikes/2026-10-16-mermaid-render/p3-integration/`, `/tmp/mermaid-spike/p3/` | `bun test` on the prototype, parent re-runs it |

Fan-out is 3, below the floor of 10: the spike has exactly three independent questions.

## Status

- Status: Draft
- Approved scope: none yet (Gate 1 pending)
- Completed: claim (`pr-registry claim` exit 0), worktree created from `origin/main` at 60debfd, registry state `active`
- Current: S1 Explore
- Next: S2 Research
- Blockers: none
