# Review report: build-time Mermaid diagrams (session dawnbook-mermaid-diagrams)

- **Date:** 2026-10-16
- **Diff reviewed:** `git diff origin/main...HEAD` at the end of T14 (17 commits, 85 files, base `60debfd`)
- **Reviewers:** two independent `staid` audits, run in parallel without seeing each other's report: a standards axis (rubric in `templates/code-review-template.md` of the pipeline) and a spec axis (against `docs/code-plan/specs/2026-10-16-mermaid-diagrams-design.md` and plan AC-1..AC-8)
- **Parent role:** synthesis, independent re-verification, fixes dispatched as plan task T15

## Standards axis (as reported, own order)

Verdict: `correct` (confidence 0.75). Changing condition named by the reviewer: CI's `bun run build` or `bun test` exiting non-zero on this branch.

| Id | Priority | Finding | Resolution |
|---|---|---|---|
| S1 | P3 | The cache key covers the source, config, CSS and CLI version but not the resolved `mermaid` (bun.lock resolves 12.2.0 through `^12.0.0`) or the post-processor, so a lockfile refresh or a `finalizeSvg` change leaves stale SVGs under unchanged keys | Fixed in `16fa1e2` (T15c): the key adds the installed `mermaid` version and the sha256 of `scripts/diagrams/postprocess.ts` |

Residual risks reported (not findings): two sequence diagrams in one chapter would repeat unprefixed ids; a per-block `%%{init}%%` or front-matter `config:` can override the locked config; tab-indented and blockquoted fences are not modelled; the renderer suite would run in CI if `/usr/bin/chromium` exists there. The parent confirmed the last one from the primary source (`actions/runner-images`, `images/ubuntu/scripts/build/install-google-chrome.sh` links `/usr/bin/chromium`, read 2026-10-16) and fixed it in `052a27d` (suite skips when `CI` is set unless `DIAGRAMS_RENDER_TEST=1`). The override risk is fixed by the `config-override` rule in `b980d6b`; the id risk by `3206686`.

Design note (non-blocking): `markdownFiles`, `toPosix` and `listBooks` are duplicated across `inline.ts`, `check-diagrams.ts` and `render-diagrams.ts`. Recorded as follow-up FU17.

Independent checks the standards reviewer ran: fence detector compared with the `marked` parser on all 797 chapter files (241 fenced blocks, 0 mismatches); a temp mdBook 0.5.4 build of both pilots (6 SVGs intact, none inside `<p>`, meta lead text unchanged); copy-rule scan of 5,627 added lines and 17 commit messages (clean, 0 co-author trailers).

## Spec axis (as reported, own order)

Verdict: `not correct`. Changing conditions named by the reviewer: (1) no cached SVG id without the `dbd-` diagram id; (2) the gate reports a straight quote inside a label.

| Id | Priority | Finding | Resolution |
|---|---|---|---|
| F1 | P1 | Sequence SVGs carry unprefixed ids (`actor0`, `root-1`, `actor-man-*`), so two sequence diagrams on one page would duplicate DOM ids (spec line 48) | Fixed in `3206686` (T15a): `finalizeSvg` scopes every id lacking the diagram id and rewrites its `url(#)`, `href` and aria references; after re-render in `ee88704`, 0 unscoped ids in all six SVGs |
| F2 | P1 | No gate rule for a straight double quote inside label text (spec line 47) | Fixed in `b980d6b` (T15b): rule `straight-quote` for quoted flowchart labels and the text after `:` in sequence and timeline lines |
| F3 | P2 | Dot-thousands numbers (`bar [1.500, 2.750]`) pass and render as 1.5 | Fixed in `b980d6b`: rule `xychart-thousands` |
| F4 | P2 | Same defect as S1 | Fixed in `16fa1e2` |
| F5 | P2 | Section 25 says every colour comes from four mdBook variables; pie slices and later xychart series use a fixed palette | Fixed in `052a27d`: wording now states the first xychart series follows `--links` and pie slices and later series use the fixed 8-colour palette |
| F6 | P2 | Timeline label "Banner ad pertama di HotWired milik AT&T" reads as HotWired being owned by AT&T; chapter line 29 says the banner belonged to AT&T | Fixed in `ee88704`: "Banner ad pertama milik AT&T tampil di HotWired" |
| F7 | P2 | Plan Global Constraints still state the approval-time config and CSS; T14 lived only in an uncommitted plan | Fixed in `437f531`: constraints marked superseded with the committed files named as source of truth; T13-T15 recorded |
| F8 | P3 | Spec file still says Draft | Fixed in `437f531` |

Requirement table highlights from the spec axis: user stories 3-6 and 8-14 proven; US1, US2, US7 partial at review time (screenshots and CI not inspected by the reviewer; the parent viewed built-page screenshots in light and coal at 1280 and 375 px and confirmed the CI Chromium path); roadmap RF1-RF6 covers all 58 books exactly once with the two pilots done; FU1-FU4 cover the four contradictory-text books.

## Parent synthesis

- Overlap: S1 and F4 are the same defect; counted once.
- Every qualifying finding from both axes is fixed in this PR; none is deferred.
- Re-verification after the fixes: see the plan's Execution evidence table (T15 rows and T12 run 3) and the spec reviewer's re-check of its two conditions.

Not read: none by the parent; each reviewer lists its own unread files in its report.
