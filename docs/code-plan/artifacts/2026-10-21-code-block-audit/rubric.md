# Code-block audit rubric (Dawnbook, 2026-10-21)

Context: Dawnbook is an Indonesian e-book platform (mdBook). Readers come from all backgrounds and most cannot read code. The owner saw this on the Piaget book (chapter 06, section "Representasi Logika Praoperasional (Analogi Teknis)"): a Python `def cek_volume(...)` block rendered as raw code, which looks like a bug to a lay reader. The owner wants every code block in non-programming books audited: keep it only if the reading material itself is about coding; otherwise convert it into a form that carries the same message (diagram, table, formula, list, prose).

Your job is AUDIT ONLY. Do not edit any file.

## Verdict per block

- KEEP: the chapter's own subject is teaching the reader to read or write that code or command (programming, software configuration). "The book mentions algorithms/technology" or "the code is an analogy" is NOT enough.
- BORDERLINE: the code is a real-world artifact the chapter discusses as such (for example the literal HTML of a tracking pixel the text explains), or the passage is explicitly about a programmer at work. Give your recommendation (keep or convert) and one-line reason.
- CONVERT: everything else (analogy code, pseudocode of a mental process, simulations, JSON used as a data card, prose/templates/letters/dialogues that were wrongly put in a fence, formulas in a fence).

## Target form for CONVERT (choose the one that carries the same message most clearly for a non-programmer)

- `hapus` (delete only): a Mermaid diagram, table or list in the same section already shows the same logic, or the block adds nothing beyond the prose. Name the covering element and its line range. Check that the covering element really covers it (same branches/steps).
- `mermaid:<type>`: decision logic (if/else) or process or loop -> `flowchart`; state change -> `stateDiagram-v2`; stated numbers -> `xychart`/`pie`; two-axis classification -> `quadrantChart`. Allowed types only: flowchart, sequenceDiagram, stateDiagram-v2, pie, quadrantChart, xychart, timeline. Dawnbook's grounding rule: every node, edge, label and number must already be stated in the chapter prose; the code alone does not count as a source the reader can read.
- `tabel`: JSON/dict data, profiles, criteria, scores, matrices, a fixed-input calculation -> Markdown table (name the columns).
- `rumus`: a formula inside a fence -> LaTeX display math `$$ ... $$`.
- `contoh-hitung`: a numeric computation (numpy, a function with inputs) -> a worked example: formula plus a small table of inputs and results.
- `teks`: protocol, letter, agenda, template, dialogue, checklist put inside a fence -> normal Markdown (numbered list, blockquote, bold labels, table).

Note that a combined answer is fine (for example `hapus` + one sentence of prose, or `tabel` + `mermaid:flowchart`).

## What to record per block (one row each, cells in Indonesian, short)

| Blok (file:start-end) | Bahasa | Isi singkat (apa yang ditunjukkan) | Vonis | Bentuk pengganti | Ikut diubah (baris judul/kalimat pengantar/rujukan ke kode) | Info unik di kode? | Catatan |

- "Ikut diubah": list line numbers of headings, intro sentences or later sentences that mention code ("Analogi Kode", "dalam Python", "pseudocode", "kalau diibaratkan kode program", "fungsi di atas", variable names) and would have to be rewritten together with the block. Write `-` if none.
- "Info unik di kode?": `tidak` if the prose already states everything the block says; otherwise `ya: <what>` (numbers, thresholds, steps, examples that appear ONLY in the code). This decides whether the conversion can be a plain delete or must move content into prose first.
- "Catatan": anything a converter must know: code contradicts the prose, invented numbers, a bug or syntax error, a heading that is entirely about the code (whole section must be rewritten), a Mermaid diagram right after the block that already duplicates it, etc.

## Method and budget

- Your input file holds, for each block, the numbered source lines from the nearest preceding heading (up to 25 lines before) to 30 lines after the block. Line numbers are the real file line numbers. Book titles are in the `######## BOOK` lines.
- Read the input file with the Read tool in chunks of about 350 lines (offset/limit). If a block's context is unclear (for example the book title does not tell whether the book is about programming), you may Read more of the chapter file (path is in the BLOCK header, relative to /home/belajarcarabelajar/Proyek/dawnbook).
- Budget: at most 22 tool calls. Write your final report by call 20 at the latest, even if partial; mark unfinished blocks as `BELUM`.
- Final message = the report only: one table per book (with the book slug as a level-3 heading), every block in your input listed exactly once, then a short "Ringkasan" with counts per verdict and per target form, and a list of BORDERLINE items with your recommendation.
