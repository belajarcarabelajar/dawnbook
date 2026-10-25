---
schema: ultra-plan/v1
plan_id: 2026-10-25-dawnbook-later-backlog
status: Approved
version: 1
runner_contract: true
skill: "super-ultra-code-plan (loaded through the Skill tool from ~/.claude/skills/super-ultra-code-plan/SKILL.md)"
author: Iwan Kurniawan <iwan@belajarcarabelajar.com>
coauthor_trailer: ""
defaults:
  retry_transient_max: 1
  step_timeout_s: 300
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
  require_impacts: true
  allow_no_impacts: []
  retry_if: any
tasks:
  - id: G0
    depends_on: []
    impacts: ["new guard rules over every book (known-misattributions) and a link per citation in every Referensi chapter (referensi-presence) - bun test tests/books/known-misattributions.test.ts tests/books/referensi-presence.test.ts"]
    files: { create: [], modify: ["tests/books/known-misattributions.test.ts", "tests/books/referensi-presence.test.ts"], test: ["tests/books/known-misattributions.test.ts", "tests/books/referensi-presence.test.ts"] }
    idempotency_key: "G0:guard"
    verify_exit: 1
    run:
      - cmd: "bun test tests/books/known-misattributions.test.ts tests/books/referensi-presence.test.ts"
        expect_exit: 1
        retry: 0
  - id: B1
    depends_on: [G0]
    impacts: ["fact fixes in 8 books - bun run scripts/check-book-structure.ts and check-voice per slug"]
    files: { create: [], modify: ["books/*/src/content/*.md"], test: [] }
    idempotency_key: "B1:fact-fixes"
    verify_exit: 0
    run:
      - cmd: "for s in sistem-peringatan-dini-early-warning-system digital-minimalisme neuroplastisitas-dalam-belajar literasi-keuangan piaget metakognisi filosofi-stoikisme sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar; do bun run scripts/check-book-structure.ts $s || exit 1; done"
        expect_exit: 0
        retry: 0
      - cmd: "bun run scripts/check-voice.ts sistem-peringatan-dini-early-warning-system digital-minimalisme neuroplastisitas-dalam-belajar literasi-keuangan piaget metakognisi filosofi-stoikisme sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar"
        expect_exit: 0
        retry: 0
  - id: L1
    depends_on: [G0]
    impacts: ["verified links for 32 Referensi citations in 7 books - bun test tests/books/referensi-presence.test.ts tests/books/referensi-links.test.ts"]
    files: { create: [], modify: ["books/*/src/content/*referensi*.md"], test: ["tests/books/referensi-presence.test.ts"] }
    idempotency_key: "L1:links"
    verify_exit: 0
    run:
      - cmd: "bun test tests/books/referensi-presence.test.ts tests/books/referensi-links.test.ts"
        expect_exit: 0
        retry: 0
  - id: A1
    depends_on: []
    impacts: ["About page and README carry a one-line AI-assistance notice - bun test tests/scripts/attribution.test.ts"]
    files: { create: [], modify: ["i18n/id.json", "i18n/en.json", "scripts/builder/template-engine.ts", "README.md", "tests/scripts/attribution.test.ts"], test: ["tests/scripts/attribution.test.ts"] }
    idempotency_key: "A1:ai-notice"
    verify_exit: 0
    run:
      - cmd: "bun test tests/scripts/attribution.test.ts"
        expect_exit: 0
        retry: 0
  - id: G1
    depends_on: [B1, L1, A1]
    impacts: ["guards green and full gate - bun test tests/scripts/ tests/books/ and bun run build"]
    files: { create: [], modify: [], test: ["tests/books/known-misattributions.test.ts", "tests/books/referensi-presence.test.ts"] }
    idempotency_key: "G1:gate"
    verify_exit: 0
    run:
      - cmd: "bun test tests/books/known-misattributions.test.ts tests/books/referensi-presence.test.ts tests/books/referensi-links.test.ts tests/scripts/attribution.test.ts"
        expect_exit: 0
        retry: 0
  - id: X1
    depends_on: [G1]
    impacts: ["one PR in pr.registry.json - bun ~/vivera/scripts/pr-registry.mjs order"]
    files: { create: [], modify: [], test: [] }
    idempotency_key: "X1:pull-request"
    skip_if: "false"
    verify_exit: 0
---

# Plan: close the LATER backlog of the attribution and quote audits

Status: Approved
Author: Iwan Kurniawan <iwan@belajarcarabelajar.com>, no trailer. sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar is by Kania Salsabila: committed with her identity and the `Co-authored-by: Iwan Kurniawan` trailer (GEMINI.md section 18).
Trigger: owner request 2026-10-25 to check the "UNESCO menekankan" line (sistem-peringatan-dini 10:58) and the eight remaining LATER items of `2026-10-24-dawnbook-attribution-fixes` (items 1-7 and 9). Read-only audit: `docs/code-plan/artifacts/2026-10-25-dawnbook-later-audit.md`.

## Checklist

- [x] Design gate. Evidence: AskUserQuestion 2026-10-25: `Design` = Approve; `Referensi` = link all 32 + guard; `AI notice` = one line on About page (and README).
- [x] G0: guard rules RED on main. Evidence: 4a5947a9, `bun test tests/books/known-misattributions.test.ts tests/books/referensi-presence.test.ts` exit 1 on main content: all seven new rules fire, 32 citation lines without a link; the 23-minute rule also caught state-of-flow 08:13 (owner: fix in this PR).
- [x] B1: fact fixes in 9 books (8 planned + state-of-flow), one commit per book. Review 1: not correct, 0 P1, 3 P2 (neuroplastisitas ch12 label and ch07 lead-in, stoikisme Ellis/Beck without Referensi) and P3 additions; fixed in de668811..912140bc (stoikisme line restored to main). Verifier: 1 P2 ('jauh lebih sulit'), 1 P3 ('sederhana'), fixed in d8e4b55b.
- [x] L1: 32 citations linked (publisher, DOI, ERIC, PMC or Library of Congress records); Flourish moved to the LoC record of the 2011 Free Press edition. Records exposed four citation errors in metodologi-microteaching, corrected to the record (Kyriacou 5th ed. 2018, Turney et al. Sydney Micro Skills, Saban & Coklar in TOJET 12(2), duplicate Ambili/Remesh 2013 removed, Remesh title). Aman (2005) has no online record and is marked as cited through Marliana (2017).
- [x] A1: AI-assistance notice on the About page and in the README (9ead107b), RED then GREEN in `tests/scripts/attribution.test.ts`. Owner follow-up 2026-10-25: the placeholder author name is removed from every tracked file and the README names Iwan Kurniawan as the author of the first books (2046b068); a test keeps the name out (mutation-checked: adding it turns the test red).
- [x] G1: guards GREEN. Evidence (HEAD e5b6da9a, clean tree): `bun test tests/scripts/ tests/books/` exit 0, 664 pass, 0 fail; `bun run build` exit 0, 0 parse errors; heading colons exit 0; copy rules flag only the one required Kania trailer (GEMINI.md section 18).
- [ ] X1: one PR; merge asked alone; deploy, D1 seed and GSC reindex asked separately.

## Visual Implementation Map

```mermaid
flowchart TD
    accTitle: LATER backlog fixes behind guard tests
    accDescr: After the design gate the guard rules fail on main, then fact fixes per book, Referensi links and the AI notice run in parallel, the guards pass with the full gate, and one pull request is opened.
    Gate{{"Design gate"}} --> G0["G0: guards RED"]
    G0 --> B1["B1: fact fixes, 8 books"]
    G0 --> L1["L1: 32 Referensi links"]
    Gate --> A1["A1: AI notice"]
    B1 --> G1["G1: guards GREEN, full gate"]
    L1 --> G1
    A1 --> G1
    G1 --> X1["X1: PR, merge and deploy asked"]
```

## Tasks

### Task G0
Rules added to `known-misattributions.test.ts`: UNESCO with "umpan balik komunitas"; "23 menit" with recovering concentration or focus; "10 poin" IQ with context switching; an error ("kesalahan") paired with epinephrine release; object permanence at "8-9 bulan"; TLO "di atas 75"; "Nah / Jadi" as a summary marker. `referensi-presence.test.ts` gains a check that every citation item (a list item with a year in parentheses) in a Referensi chapter holds a link.

### Task B1
Contract: correct to what the verified source says, hedge, or drop; never add a fact, number, name, cause or superlative (GEMINI.md section 29); a source is named once only where its claim stays, and then listed in Referensi with a DOI or publisher/official link, never archive.org/details. Findings per line: the audit artifact.

### Task L1
Each of the 32 entries gets a verified publisher, DOI, ERIC or library-catalogue link to the exact edition cited; entries that cannot be verified are reported, not guessed.

### Task A1
One sentence on the About page (id and en) and in the README: the books are written with AI assistance and edited by the author.

### Task G1
Fresh run of the guards, the book checks, `bun test tests/scripts/ tests/books/` and `bun run build` on a clean tree.

### Task X1
One PR through `pr-registry open`; merge asked alone with `--match-head-commit`; deploy, D1 seed and GSC reindex asked separately.

## Backlog (LATER)

- `defer: paragraph-style Referensi entries, owner decision` 142 citation paragraphs without a link in 21 books (Referensi chapters that list sources as paragraphs, not list items); the per-item guard checks list items only.
- `defer: edition details, next Referensi pass` psikologi-positif Dweck (2016) links the Ballantine updated-edition page dated 2007; sistem-pengendalian-topik van Lier (1996) links the 2014 Routledge reissue, Fairclough (2006) and Coulthard & Brazil (1989) keep the years Marliana (2017) cites.
- `defer: neuroplastisitas chapter 7 epinephrine section, next fact pass` 07:23-25 teaches epinephrine and alertness without a source; not in the audit rows.
