# Review report: diagram follow-ups (four contradictory books)

- **Date:** 2026-10-16
- **Reviewer:** one independent `staid` fact review (sources re-fetched with curl, NCBI eutils and Crossref; TinyFish was not available in that harness)
- **Scope:** commits 65b5071, 8ac278c, 58c36bf, 794cb4d, then the fix commits 3dc1d96 and 474eb4c

## Round 1 (verdict `not correct`)

| Id | Priority | Finding | Resolution |
|---|---|---|---|
| T1 | P1 | Tonsillectomy ch08 L49 and ch10 L17 tied the later pain rise to teens and adults, while Medikondu (2025) reports a second peak around days 5-8 in children and Lavy (1997) reports older patients staying sore until about day 9; the adult claim cited no listed source | `3dc1d96`: each clause now follows one source (Medikondu, NHS Bedfordshire leaflet, Lavy); the leaflet is added as reference item 2 |
| T2 | P2 | "hari ke-3 hingga ke-7" did not match the cited days 5-8 | `3dc1d96` |
| E1 | P2 | EWS ch12 L33 still called the 5-minute issue target a lead time | `3dc1d96`: row relabelled |
| T3 | P3 | "lebih menyakitkan daripada hari pertama" had no source | `3dc1d96`: removed |
| E2 | P3 | Commit subject of 58c36bf says "four-message chain" while the diff names four stages | kept; history is not rewritten |
| P1 | P3 | Marliana entry links the article page, not the DOI | kept; the registered DOI has a doubled prefix |

Supported without change: every ikigai edit, every InaTEWS edit (BMKG 2012 manual: T1 at most 5 minutes, end message at the earliest 2 hours after the first, Awas from 3 m), every pedagogy edit (Marliana pp. 85-86).

## Round 2 (verdict `correct`)

- Each new tonsillectomy clause is supported: Medikondu (second peak days 5-8 with eschar separation, children), NHS Bedfordshire adult leaflet ("be at its worst between days 3 to 7", fetched by both the parent and the reviewer), Lavy (older than 10 constant until day 9).
- Remaining items fixed in `474eb4c`: "sering paling berat" hedged to "bisa paling berat" as the leaflet says "may"; "anak di atas sepuluh tahun" widened to "pasien" because Lavy's older group is not limited to children; the EWS row note "Perlu 2 menit lagi" contradicted its own 4-minute figure and now reads "Sudah dalam rentang target".

Not read: Warnock and Lander (1998) full text, the Mitchell (2019) guideline pages, the pairings inside Winn's diagram image (the research chunk read them by OCR), the Garcia and Miralles book itself.
