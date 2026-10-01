---
schema: ultra-plan/v1
plan_id: 2026-10-01-dawnbook-kenapa-kebiasaan-susah-diubah
status: In Progress
version: 1
runner_contract: true
skill: super-ultra-code-plan (file pertama yang ditemukan pada chain: /home/belajarcarabelajar/ai-skills/Super Ultra Code Plan Implementation.md)
session: dawnbook-kebiasaan (pr-registry: ai/2026-10-01-dawnbook-kenapa-kebiasaan-susah-diubah/dawnbook-kenapa-kebiasaan-susah-diubah)
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-kenapa-kebiasaan-susah-diubah
author: Kania Salsabila <kaniasalsabila639@gmail.com>
coauthor_trailer: Co-authored-by: Iwan Kurniawan <iwan@belajarcarabelajar.com>
research_notes: docs/code-plan/plans/research-kenapa-kebiasaan-susah-diubah.md
defaults:
  retry_transient_max: 1
  step_timeout_s: 120
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
---

# Dawnbook: Kenapa Kebiasaan Susah Diubah? (12 Modul, Penulis Kania Salsabila)

## Global Constraints

- Sumber materi: `docs/code-plan/plans/research-kenapa-kebiasaan-susah-diubah.md` (semua klaim terverifikasi 2026-10-01). Dilarang mengarang fakta, angka, atau sitasi.
- Gaya: sapa pembaca dengan "kamu" (kata "Anda" DILARANG). Nada mengajak, hidup, seperti buku terakhir (`books/pengaruh-uang-terhadap-kebahagiaan`).
- Nol emoji di semua file kecuali `icon.txt`. Nol em-dash (`-` em) di semua file konten dan pesan commit.
- Panjang tiap bab: 6.000-9.000 byte (`wc -c`); bab Referensi bebas 3.000-7.000 byte.
- Setiap bab punya TEPAT satu section `## ` penutup dengan judul yang ditugaskan (tidak boleh sama antar bab).
- Kalimat pembuka bab harus kalimat lengkap dan bersih (dipakai mesin meta description SERP, 110-160 karakter idealnya).
- File bab: `books/kenapa-kebiasaan-susah-diubah/src/content/NN_slug-bab.md` (zero-padded, kebab-case).
- Tanpa LaTeX; `mathjax-support = false` diwarisi template.

## Visual Implementation Map

```
books/kenapa-kebiasaan-susah-diubah/
├── book.toml          (C1: title, authors=Kania Salsabila, subject_label=Psikologi, language=id, description 100-160 char)
├── icon.txt           (C1: satu emoji cover)
├── theme/             (C1: copy dari _template; jangan diedit)
└── src/
    ├── SUMMARY.md     (C1: 12 entri)
    └── content/
        ├── 01_niat-tidak-cukup.md                             (C2)
        ├── 02_anatomi-loop-kebiasaan.md                       (C3)
        ├── 03_otak-pengotomat-di-basal-ganglia.md             (C4)
        ├── 04_jebakan-niat-kenapa-niat-gugur.md               (C5)
        ├── 05_mitos-21-hari-dan-waktu-sebenarnya.md           (C6)
        ├── 06_kebiasaan-lama-tidak-bisa-dihapus.md            (C7)
        ├── 07_kekuatan-konteks-lingkungan-yang-memancing.md   (C8)
        ├── 08_fresh-start-momen-terbaik-untuk-mulai.md        (C9)
        ├── 09_friction-susah-itu-alat-bukan-musuh.md          (C10)
        ├── 10_mengganti-bukan-menghapus.md                    (C11)
        ├── 11_identitas-satu-kemenangan-kecil.md              (C12)
        └── 12_referensi.md                                    (C13)
release-dates.json  (C1: entry pinnedMs untuk slug)
```

## Batch Manifest (fan-out, satu owner per chunk, tidak ada dua chunk menulis file yang sama)

| Chunk | Owner | Target files | Output | Verifikasi |
|---|---|---|---|---|
| C1 | sa-scaffold | book.toml, icon.txt, theme/*, src/SUMMARY.md, release-dates.json, hapus src/introduction.md | scaffold + metadata + SUMMARY 12 entri | grep judul/authors/description len; jq release-dates; wc -l SUMMARY |
| C2 | sa-c02 | content/01_niat-tidak-cukup.md | bab pengantar + 43% | test -f + parent audit |
| C3 | sa-c03 | content/02_anatomi-loop-kebiasaan.md | loop Duhigg/Clear | test -f + parent audit |
| C4 | sa-c04 | content/03_otak-pengotomat-di-basal-ganglia.md | basal ganglia + dopamin | test -f + parent audit |
| C5 | sa-c05 | content/04_jebakan-niat-kenapa-niat-gugur.md | Webb-Sheeran, Ouellette-Wood | test -f + parent audit |
| C6 | sa-c06 | content/05_mitos-21-hari-dan-waktu-sebenarnya.md | Maltz, Lally 66 hari | test -f + parent audit |
| C7 | sa-c07 | content/06_kebiasaan-lama-tidak-bisa-dihapus.md | Wood-Rünger, Gardner | test -f + parent audit |
| C8 | sa-c08 | content/07_kekuatan-konteks-lingkungan-yang-memancing.md | Wood 2005, discontinuity | test -f + parent audit |
| C9 | sa-c09 | content/08_fresh-start-momen-terbaik-untuk-mulai.md | Dai-Milkman-Riis | test -f + parent audit |
| C10 | sa-c10 | content/09_friction-susah-itu-alat-bukan-musuh.md | 4 hukum Clear, friction | test -f + parent audit |
| C11 | sa-c11 | content/10_mengganti-bukan-menghapus.md | golden rule, Azrin-Nunn, implementation intentions | test -f + parent audit |
| C12 | sa-c12 | content/11_identitas-satu-kemenangan-kecil.md | identity-based habits, penutup buku | test -f + parent audit |
| C13 | sa-c13 | content/12_referensi.md | 16 referensi berhyperlink | test -f + parent audit |

## Kontrak per chunk (ringkas; teks lengkap dikirim di prompt dispatch)

Setiap subagent menerima: worktree path (absolut), target file (satu file saja), judul bab, gaya pembuka yang ditugaskan, judul section penutup yang ditugaskan, fakta yang boleh dipakai (dari research notes, path diberikan), batas byte, dan aturan (kamu / nol emoji / nol em-dash / kalimat pembuka bersih / jembatan ke bab berikutnya bervariasi / tidak boleh menyentuh file lain / TIDAK BOLEH menjalankan git). Subagent wajib `wc -c` file dan menyeimbangkan sendiri sebelum lapor.

### Assignment penutup & pembuka (Rule 21, anti-template)

| Bab | Pembuka (device) | Section penutup |
|---|---|---|
| 1 | skenario dialog pendek | Poin Kunci |
| 2 | paradoks angka | Ringkasan |
| 3 | pertanyaan retoris | Intisari |
| 4 | metafora | Inti Pembahasan |
| 5 | mitos yang dibongkar | Yang Perlu Kamu Ingat |
| 6 | analogi gambar/visual | Benang Merah |
| 7 | skenario pindahan | Poin Penting |
| 8 | data point | Kesimpulan Bab |
| 9 | pertanyaan-paradoks | Recap |
| 10 | kisah kasus | Gagasan Utama |
| 11 | reflektif personal | Penutup |

## Tasks

- [x] T0: Research via TinyFish (search + fetch PDF/abstrak/Crossref), 16 sumber terverifikasi. Bukti: /tmp/tf-research/*.json, PDF primer dibaca (angka 66 hari, 43%, 94 tes d=.65, d=.66/d=.36, 800 peserta, 12 klien habit reversal).
- [x] T0.5: Claim slot sesi + worktree. Bukti: pr-registry claim OK; worktree di tip main 5f94c4d.
- [x] C1 (sa-scaffold): scaffold buku, book.toml, SUMMARY.md 12 entri, icon.txt, release-dates.json, hapus introduction.md. Bukti: verifikasi subagent OK; koreksi parent: entri release-dates.json diubah dari objek {pinnedMs} menjadi angka polos (metadata.ts mensyaratkan typeof number).
- [x] C2..C13: 12 file konten oleh 12 subagent (6 sukses gelombang 1; 7 chunk retry karena user concurrency limit; semua 12 file final ada, 6.627-9.006 byte). Bukti: wc -c per file.
- [x] V1: Parent diff audit gate: hanya books/kenapa-kebiasaan-susah-diubah/**, release-dates.json, docs/code-plan/plans/*.md yang berubah. Bukti: git status --short di worktree.
- [x] V2: Verifikasi AI line-by-line 12 bab: heading `## ` unik (uniq -d kosong), 0 em-dash/en-dash, 0 emoji (kecuali icon.txt), 0 "Anda", kalimat pembuka lengkap, 16 referensi hyperlink, deskripsi 135 char. Temuan diperbaiki: normalisasi desimal d = 0.66/0.36/0.65 menjadi d = 0,66/0,36/0,65 (konsistensi PUEBI).
- [x] V3: Build lokal: `bun run scripts/sync-template.ts` exit 0; `mdbook build` exit 0 (12 halaman); `bun run build` exit 0 dengan "SEO Validation passed! All rules (R1-R7) satisfied"; meta description bab diekstrak dari kalimat pembuka oleh inject-gating.
- [ ] V4: Commit (author Kania Salsabila + trailer), push, gh pr create --body-file, record pr + state open.
- [ ] V5: Debt sweep + follow-up injection; plan-issue-sync bila tersedia.

## Follow-up Backlog

(filled by debt sweep; format `defer: <ceiling>, <upgrade-trigger>`)
