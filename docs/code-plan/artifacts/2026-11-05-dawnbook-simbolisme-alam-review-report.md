# Review report: Simbolisme Alam dalam Sastra

Plan: docs/code-plan/plans/2026-11-05-dawnbook-simbolisme-alam.md (task V3)
Date: 2026-11-05

## Reviewers

| Reviewer | Scope | Verdict |
|---|---|---|
| staid 1 | chapters 01-07 against research items A1-A9, B1-B12, C1-C2 | not correct (0 P1, 14 P2, 7 P3) |
| staid 2 | chapters 08-14 and Referensi against C3-C13, D1-D11, B10, B12 | not correct (1 P1, 11 P2, 7 P3) |
| staid 3 | book test, scaffold, cover, diagrams, research notes, plan | correct (0 P1, 0 P2, 5 P3) |

All three confirmed: every chapter URL is a section 9 row; 0 em dash, 0 "Anda", 0 contrast framing; no trace of a corrected error; hypothetical names unique per chapter; Mermaid nodes grounded in the chapter text; book test exit 0 (12 pass); `check-copy-rules --diff origin/main` flags only the icon.txt emoji, which GEMINI.md section 14 allows.

## Findings and resolution

Pattern: almost every P2 was a generalisation, an intent or a causal link stated as fact where the source supports only a reading. Fixes hedge or narrow the sentence; none adds a fact.

| Ch | Finding (severity) | Resolution |
|---|---|---|
| 01 | "Ia" read as Chekhov, antecedent is the principle (P3) | Fixed by parent: "Prinsip itu berangkat dari nasihat ..." |
| 02 | "terbit pada 1856" stronger than A1 (P2) | Fixed: preface dated January 1856 |
| 02 | "istilah itu umumnya dipakai ... tanpa nada mencela" unsourced (P2) | Fixed: tied to the cited glossary |
| 02 | closer "memilah penyair" vs body (first class are not poets) (P2) | Fixed: "memilah orang" |
| 03 | "tradisi yang lebih optimis" names an unsourced tradition (P2) | Fixed: "Sebagian pembaca melihat ..." |
| 03 | "Kita yang tinggal di Indonesia pun hidup dengan dua musim" (P2) | Kept: requested in the chapter brief; general knowledge; framed as the reader's own lens |
| 03, 07 | "tidak perlu ..., karena X sudah ..." scene closer repeated in four chapters (P3) | Fixed in 03 and 07 |
| 04 | "Yang membuat kisah itu awet adalah rasa sakitnya" (P2) | Fixed: framed as what a writer can borrow |
| 04 | "Icarus tidak sabar" adds a trait (P2) | Fixed: "tergoda dan terus naik" (B3) |
| 04 | burnt land "kerap tampil sebagai hukuman" (P2) | Fixed: "Sebagian kisah ..." |
| 05 | opener starts with "Bayangkan" like chapter 01 (P3) | Fixed: direct sensory scene |
| 05 | "tafsir yang lazim dalam kajian sastra" (P2) | Fixed: "banyak pembaca" |
| 05 | full moon at the climax stated as frequency (P2) | Fixed: "sering dibaca sebagai" |
| 05, 07 | "tafsir Jungian" wider than B5's alchemical pairing (P2) | Fixed: "sebagian pembaca meminjam kerangka Jung" |
| 05 | Gothic generalised from two scenes, body and closer (P2) | Fixed: "dua adegan Gotik" |
| 05 | tides sentence in the closer has no item (P2) | Kept: basic astronomy, also in the owner's notes; used only as the bridge image |
| 05 | Mariner moon sits inside the Dracula paragraph (P3) | Fixed: own paragraph |
| 06 | rain scene states authorial intent and a baptism analogy (P2) | Fixed: "sering dibaca sebagai pencucian" |
| 07 | Dante's wood as a place where heroes come out changed (P2) | Fixed: limited to fairy tales; Dante's wood as a starting point |
| 07 | horror forests "mungkin juga menjelaskan" (P2) | Fixed: open question, no causal claim |
| 07 | "Dalam banyak cerita" entry timing (P2) | Fixed: "kerap ... bisa dibaca sebagai" |
| 07 | closer adds Treebeard's patience and Thorin's lesson, drops hedge (P2) | Fixed: C2 wording with hedge; bridge no longer starts "Sekarang" |
| 08 | Lear "kehilangan atap, pengikut ... dalam satu malam" (P2) | Fixed: outside the shut doors, losing his footing (C3) |
| 09 | loss of empathy attributed to Zarathustra (P2) | Fixed: general reading, detached from Zarathustra |
| 09 | Dante's hill "membawa harapan semacam ini" (P3) | Fixed: "membesarkan hati Dante ... bisa dibaca dengan cara serupa" |
| 10 | Gothic and Decadent role stated as fact (P2) | Fixed: "sering dikaitkan dengan" |
| 10 | Ophelia's grief reading flat, closer drops hedge (P2) | Fixed: "bisa dibaca", "Bagi banyak pembaca" |
| 12 | two houses "memperkenalkan watak" (P2) | Fixed: "mudah dibaca sebagai lambang dua dunia" |
| 12 | drought as poverty outside D4 (P2) | Kept: from the owner's notes, already hedged ("sering dibaca sebagai") |
| 12 | "berarti", "saja", "dukuh kecil" (P2, P3) | Fixed: "barangkali", "saja" dropped, "kecil" dropped |
| 13 | "yang tersisa hanyalah dua orang" contradicts "hampir semua kehidupan" (P1) | Fixed: "yang tampak hanyalah ayah dan anak" (D11) |
| 13 | Burke explains Romantic storms (P2) | Fixed: "membantu membaca" |
| 13 | war and technology as cause of the shift (P2) | Fixed: "di tengah ..." without causation |
| 13 | ecocriticism characterised; forest as shrinking resource (P2) | Kept: from the owner's notes, already hedged ("kurang lebih", "Dalam sejumlah karya") |
| 13 | ozone sentence in the closer (P2) | Fixed: sentence removed |
| 13 | Mariner reading stated flat (P3) | Fixed: "Dalam bacaan itu" |
| 14 | The Hobbit links Tolkien Gateway, not a catalogue (P3) | Kept: section 9 has no catalogue row for it; the entry names the page as a reference page |
| test | meta-length case lacks the sibling's controls (P3) | Backlog (debt sweep) |
| all | link-title italics inconsistent (P3) | Skipped: cosmetic |

## Verification after fixes

Recorded in the plan checklist (V3 item): fixer diffs read line by line by the parent against the pre-edit copies in ~/.cache/tmp/dawnbook-scratch/fix1-pre, fix2-pre, fix3-pre; gates re-run.
