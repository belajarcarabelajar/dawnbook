# Session Learning Ledger: dawnbook-mermaid-diagrams

## 1. Identity

- **Session:** dawnbook-mermaid-diagrams (PR #148)
- **Plan file:** `docs/code-plan/plans/2026-10-16-dawnbook-mermaid-diagrams.md`
- **Written at:** 2026-10-16
- **Preconditions:** plan tasks T1-T15 integrated with evidence; T12 run 3 green (build exit 0, `bun test` 0 fail, `CI=true bun test` 0 fail)

## 2. Mistake Log

| # | Category | Trigger | Signal | Cost | Correct move |
|---|---|---|---|---|---|
| M1 | `wrong-tool` | Asked six researcher sprites (`timid`, `aqua`) to save their inventory reports as files | Four refused: the researcher crew is read-only by definition | 1 round plus the parent writing four files | Route file writes to the implementer crew (`chef`, `nappy`, `hoggy`) or the parent |
| M2 | `premature-guess` | Treated the spike's theme CSS as proven after testing one diagram type (flowchart) | First built-page screenshots showed sequence text dark on coal, timeline text light on bright boxes, a pale xychart bar | One extra task (T13) and a full re-render | Prove a shared style against every type the rule allows before building on it |
| M3 | `premature-guess` | Wrote "Bun skips Puppeteer's postinstall" into the T5 contract from an inference in the research notes | `bun add` downloaded about 670 MB of Chrome; Bun's default trusted list includes puppeteer | 670 MB on disk; CI would have downloaded it on every run | Add `.puppeteerrc.json` with `skipDownload` before adding any puppeteer-based dependency, and verify a claimed install behaviour by running it |
| M4 | `rule-miss` | A test read a cached SVG by its content-hash name | Renaming the cache (new key) deleted the file; `bun test` failed with ENOENT; caught by the spec re-check | 1 fix commit | Tests use committed fixtures, never generated hash-named artifacts |
| M5 | `tool-misfire` | Dispatched research, review and spike agents without a tool-call budget | 11 agents stopped at their 30- or 40-turn limit with no report | 11 resume messages | Put an explicit budget and "write the report by call N" in every dispatch that reads widely |
| M6 | `tool-misfire` | `rm -f *.png` with a relative path | The rm guard hook blocked it | 1 call | Absolute paths under `/tmp` (already enforced by the hook) |

## 3. Distilled Rules

| # | Rule | Minimum signal | 30-day horizon | Keep? | Kind |
|---|---|---|---|---|---|
| R1 | WHEN a subagent must write a file → DO dispatch an implementer sprite or write it in the parent, NOT a researcher sprite | Y | Y | KEEP | judgement (crew routing) |
| R2 | WHEN a spike proves a shared stylesheet or config → DO test every allowed variant (all diagram types, all themes) before building on it, NOT one representative | Y | Y | KEEP | judgement |
| R3 | WHEN adding a dependency that pulls `puppeteer` with Bun → DO commit `.puppeteerrc.json` `{"skipDownload": true}` first, NOT trust "Bun skips postinstall" | Y | Y | KEEP | mechanical (a test could assert the file exists when puppeteer is in the lockfile); recorded in memory until a check lands |
| R4 | WHEN a test needs real generated output that is named by a content hash → DO commit a fixture copy, NOT read the generated file by name | Y | Y | KEEP | judgement |
| R5 | WHEN dispatching a wide read (research, inventory, review, spike) → DO state a tool-call budget and a report deadline in the prompt, NOT rely on the agent's turn limit | Y | Y | KEEP | judgement |
| R6 | WHEN deleting scratch files → DO use absolute `/tmp` paths | N (the hook already enforces it) | Y | NO-OP | mechanical, already enforced |

## 4. Environment Improvements

- Information access: the GitHub runner image facts (Chromium at `/usr/bin/chromium`) were needed for a test-skip decision and came from `actions/runner-images` via TinyFish; recorded in the plan's T15 rationale, no file change needed.
- Tool economy: `ctx_execute_file` refuses files outside the project root, so build logs under `/tmp` were filtered with `rg` in Bash instead; no change needed.

## 5. Where the KEEP rules went

- R1, R2, R3, R4, R5: project memory (`new-book-authoring-traps` style feedback entries under the Dawnbook memory directory), written at session close.
- Global promotion to `~/AGENTS.md`: none proposed; R1 and R5 apply to every repository, but they belong to the pipeline skill rather than to this machine, so they are listed here for the pipeline owner instead of promoted.
