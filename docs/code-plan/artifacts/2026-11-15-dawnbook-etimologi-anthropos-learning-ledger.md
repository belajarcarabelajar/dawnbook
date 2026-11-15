# Learning ledger: dawnbook-etimologi-anthropos (2026-11-15)

## Mistake log

| # | What happened | Cost | Caught by |
|---|---|---|---|
| 1 | Seven of 13 chapter writers opened with "Bayangkan <name> ...": distinct names were assigned, but not distinct first words, so the scenario opener became a template | 6 openers rewritten in V1 | parent read (V1) |
| 2 | The ch13 writer drew five side-by-side branches with long derived words; check:diagrams failed (1076 px, split words) only in the V2 runner | one failed runner pass | runner V2 step 7 |
| 3 | Referensi budget was fixed at 11 KB before counting the source rows chapters link, so 30 cited sources were left out | 30 entries added in V3, test budget raised | facts reviewer (V3) |
| 4 | Writers kept unbacked connective claims (Alceste's motive, a 2019 vote "choosing" the start date, genome figures as paleoanthropology inputs) that sound like glue but are claims | 6 should-fix edits | facts reviewer (V3) |
| 5 | Banned-phrase test matched numbers by substring ("3 juta tahun" would hit "23 juta tahun") | test fix plus detector test | technical reviewer (V3) |

## Candidate rules

| Rule | Gates | Class | Destination |
|---|---|---|---|
| WHEN a dispatch table assigns invented characters per chapter → DO also assign the first two words of each opener (at most one chapter may start "Bayangkan"), NOT only distinct names and situations | Minimum-Signal yes, 30-day yes | judgement | project memory new-book-authoring-traps |
| WHEN setting the Referensi byte budget → DO size it after the source table exists, about 150 B per source row the chapters link, NOT a fixed 11 KB | Minimum-Signal yes, 30-day yes | judgement | project memory referensi-and-credit-fix-traps |
| WHEN a writer reports a diagram done → DO run check:diagrams --book yourself in V1, NOT wait for the V2 runner | Minimum-Signal yes, 30-day yes | judgement | project memory mermaid-diagram-pipeline-traps |
| WHEN a test bans numeric phrases → DO match with a digit boundary | Minimum-Signal no (book-specific helper) | mechanical | NO-OP |

## Environment improvements

None kept: every gate needed was reachable and ran locally.
