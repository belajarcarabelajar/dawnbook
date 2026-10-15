# Session Learning Ledger: dawnbook-diagrams-retrofit-1

## 1. Identity

- **Session:** dawnbook-diagrams-retrofit-1 (PR #153)
- **Plan file:** `docs/code-plan/plans/2026-10-16-dawnbook-diagrams-retrofit-rf1.md`
- **Written at:** 2026-10-16
- **Preconditions:** tasks B1-B10 and V1 done with evidence on tree `e145754`; three reviews `correct`; PR #153 open and registered

## 2. Mistake Log

| # | Category | Trigger | Signal | Cost | Correct move |
|---|---|---|---|---|---|
| M1 | `verification-gap` | Parent audited each diagram's source block and trusted `check:diagrams` for the rendered output | The B9 subagent reported "Eksistensialism / e"; a scan of all SVGs found 8 mid-word splits in 7 diagrams already committed | 1 fix commit (`cc5ec8b`), 6 re-renders | Scan the rendered SVG text rows against the source labels after every render |
| M2 | `rule-miss` | Ten subagents each wrote their own intro sentence; the dispatch did not ask for varied wording | Reviewers found "... bisa kamu X ... pada bagan berikut" repeated inside three books, and a repeated opener in a fourth | Part of fix commit `e145754` | List intro sentences per book in the parent audit (GEMINI.md section 21 already warns that independent agents converge) |
| M3 | `rule-miss` | Labels compressed from the chapter text | Reviewers found a dropped hedge ("sering kali"), an order where the text says "apakah perlu", and an example turned into a cause ("salju memicu") | Part of fix commit `e145754` | Require hedges and examples to survive in labels; check them in the parent audit |
| M4 | `tool-misfire` | `cmd \| tail; echo exit=$?` in a loop | Printed tail's exit code, not the command's | none (output lines were read instead) | Capture `${PIPESTATUS[0]}` or redirect to a file first |
| M5 | `navigation` | Guessed the build output folder (`dist`, `public`) | The scan found no HTML; the folder is `output/` | 2 calls | Find one built chapter by name before scanning |

## 3. Distilled Rules

| # | Rule | Minimum signal | 30-day horizon | Keep? | Kind |
|---|---|---|---|---|---|
| R1 | WHEN a Mermaid diagram is rendered → DO check the SVG for words the 110 px wrap split, NOT trust the source-only gate | Y | Y | KEEP | mechanical: a `split-word` rule in `scripts/check-diagrams.ts` (debt sweep item); memory line until it lands |
| R2 | WHEN parallel subagents add diagrams to one book → DO list the intro sentences per book and rewrite repeats, NOT trust each agent to vary wording | Y | Y | KEEP | judgement |
| R3 | WHEN text is compressed into diagram labels → DO keep the source's hedges and examples, NOT state a "sering kali" claim as always or an example as the cause | Y | Y | KEEP | judgement; candidate wording for the section 25 contract (debt sweep item) |
| R4 | WHEN a pipeline exit code matters → DO read `PIPESTATUS` | N (generic shell knowledge) | Y | NO-OP | mechanical, not repo-specific |
| R5 | WHEN scanning build output → DO locate one known file first | N (cost 2 calls) | Y | NO-OP | judgement |

## 4. Environment Improvements

- Information access: reviewers looked for `scripts/check-copy-rules.mjs` in the repo; it lives in `~/vivera/scripts/`. Kept as item 3 of the `subagent-dispatch-budgets` memory (name the path in reviewer dispatches).
- Steering no-op: none found. The section 25 contract paragraph was pasted verbatim into all ten dispatches and every gate rule it names held; the gaps (R1, R3) are things the paragraph does not say.

## 5. Where the KEEP rules went

- R1, R2, R3: project memory `mermaid-diagram-pipeline-traps` (items 5 and 6), written 2026-10-16.
- R1 as a gate rule and R3 as contract wording: offered as follow-ups in this session's debt sweep.
- Global promotion to `~/AGENTS.md`: none proposed; all three rules are specific to the Dawnbook diagram pipeline.
