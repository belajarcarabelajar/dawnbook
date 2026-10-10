---
schema: ultra-plan/v1
plan_id: 2026-10-06-dawnbook-psikologi-di-balik-keputusan-finansial-kita
status: Complete
version: 1
runner_contract: true
skill: "super-ultra-code-plan (file pertama yang ditemukan pada chain: /home/belajarcarabelajar/vivera/Super Ultra Code Plan Implementation.md)"
session: "dawnbook-psikologi-di-balik-keputusan-finansial-kita (pr-registry: 2026-10-06-dawnbook-psikologi-di-balik-keputusan-finansial-kita/dawnbook-psikologi-di-balik-keputusan-finansial-kita)"
worktree: /home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-psikologi-di-balik-keputusan-finansial-kita
author: Kania Salsabila <kaniasalsabila639@gmail.com>
coauthor_trailer: "Co-authored-by: Iwan Kurniawan <iwan@belajarcarabelajar.com>"
research_notes: docs/code-plan/plans/research-psikologi-di-balik-keputusan-finansial-kita.md
defaults:
  retry_transient_max: 1
  step_timeout_s: 120
  on_precondition_fail: stop-task-continue-independent
  allow_loose_skip_if: []
---

# Dawnbook: Psikologi di Balik Keputusan Finansial Kita? (12 Modul + Referensi, Penulis Kania Salsabila)

## Global Constraints

- Sumber materi: `docs/code-plan/plans/research-psikologi-di-balik-keputusan-finansial-kita.md` (semua klaim terverifikasi 2026-10-06 via TinyFish search + fetch PDF/abstrak/Crossref). Dilarang mengarang fakta, angka, atau sitasi.
- Gaya: sapa pembaca dengan "kamu" (kata "Anda" DILARANG). Nada mengajak, hidup, seperti `books/kenapa-kebiasaan-susah-diubah`.
- Nol emoji di semua file kecuali `icon.txt`. Nol em-dash (`—`) di semua file konten, PR body, dan pesan commit.
- Panjang tiap bab: 6.000-9.000 byte (`wc -c`); bab Referensi 3.000-8.000 byte.
- Setiap bab punya TEPAT satu section `## ` penutup dengan judul yang ditugaskan (tidak boleh sama antar bab).
- Kalimat pembuka bab harus kalimat lengkap dan bersih (dipakai mesin meta description SERP, 110-160 karakter idealnya, tanpa duplikasi judul halaman/buku).
- File bab: `books/psikologi-di-balik-keputusan-finansial-kita/src/content/NN_slug-bab.md` (zero-padded, kebab-case); semua bab dibuka dengan heading `##` (H2), bukan `#`.
- Tanpa LaTeX; `mathjax-support = false` diwarisi template.
- Pemisah desimal Indonesia: koma (0,66 bukan 0.66) untuk teks naratif.

## Visual Implementation Map

```
books/psikologi-di-balik-keputusan-finansial-kita/
├── book.toml          (C1: title, authors=Kania Salsabila, subject_label=Psikologi, language=id, description 100-160 char)
├── icon.txt           (C1: satu emoji cover, 💳)
├── theme/             (C1: copy dari _template; jangan diedit)
└── src/
    ├── SUMMARY.md     (C1: 13 entri, 12 bab + Referensi)
    └── content/
        ├── 01_kalkulator-bukan-kamu.md                        (C2)
        ├── 02_dua-sistem-di-balik-keputusan-uang.md           (C3)
        ├── 03_akuntansi-mental-anggaran-di-kepala.md          (C4)
        ├── 04_rasa-sakit-membayar.md                          (C5)
        ├── 05_bias-masa-kini-masa-depan-selalu-kalah.md       (C6)
        ├── 06_rasa-takut-kehilangan.md                        (C7)
        ├── 07_menjual-pemenang-mengikuti-pengalah.md          (C8)
        ├── 08_angka-pertama-yang-membelenggu.md               (C9)
        ├── 09_terlalu-percaya-diri-di-pasar.md                (C10)
        ├── 10_ikut-arus-fomo-dan-kekuatan-kerumunan.md        (C11)
        ├── 11_jebakan-status-quo-dan-kekuatan-default.md      (C12)
        ├── 12_merancang-pertahanan-keputusan-baik-otomatis.md (C13)
        └── 13_referensi.md                                    (C14)
release-dates.json  (C1: entry pinnedMs 1791227815704 untuk slug)
```

## Batch Manifest (fan-out, satu owner per chunk, tidak ada dua chunk menulis file yang sama)

| Chunk | Owner | Target files | Output | Verifikasi |
|---|---|---|---|---|
| C1 | parent (scaffold inline) | book.toml, icon.txt, theme/*, src/SUMMARY.md, release-dates.json | scaffold + metadata + SUMMARY 13 entri | SELESAI: book.toml terbaca, SUMMARY 13 entri, diff release-dates.json = 1 baris |
| C2 | sa-c02 | content/01_kalkulator-bukan-kamu.md | bab pengantar + Simon 1955 + K&T 1974 | test -f + parent audit |
| C3 | sa-c03 | content/02_dua-sistem-di-balik-keputusan-uang.md | Sistem 1/Sistem 2, bat-and-ball | test -f + parent audit |
| C4 | sa-c04 | content/03_akuntansi-mental-anggaran-di-kepala.md | Thaler 1999, tiket bioskop T&K 1981 | test -f + parent audit |
| C5 | sa-c05 | content/04_rasa-sakit-membayar.md | Prelec-Loewenstein, Feinberg, Raghubir-Srivastava | test -f + parent audit |
| C6 | sa-c06 | content/05_bias-masa-kini-masa-depan-selalu-kalah.md | Laibson, O'Donoghue-Rabin, McClure | test -f + parent audit |
| C7 | sa-c07 | content/06_rasa-takut-kehilangan.md | K&T 1979, lambda 2,25 | test -f + parent audit |
| C8 | sa-c08 | content/07_menjual-pemenang-mengikuti-pengalah.md | disposition effect, P/L 1,5, myopic loss aversion | test -f + parent audit |
| C9 | sa-c09 | content/08_angka-pertama-yang-membelenggu.md | A/L/P 2003 SSN, Stewart 2009 | test -f + parent audit |
| C10 | sa-c10 | content/09_terlalu-percaya-diri-di-pasar.md | Barber-Odean 2000+2001 | test -f + parent audit |
| C11 | sa-c11 | content/10_ikut-arus-fomo-dan-kekuatan-kerumunan.md | informational cascades BHW 1992 | test -f + parent audit |
| C12 | sa-c12 | content/11_jebakan-status-quo-dan-kekuatan-default.md | Samuelson-Zeckhauser, Madrian-Shea, SMarT | test -f + parent audit |
| C13 | sa-c13 | content/12_merancang-pertahanan-keputusan-baik-otomatis.md | SEED commitment, sophisticated/naiive, Nudge | test -f + parent audit |
| C14 | sa-c14 | content/13_referensi.md | ~20 referensi berhyperlink DOI | test -f + parent audit |

## Kontrak per chunk (ringkas; teks lengkap dikirim di prompt dispatch)

Setiap subagent menerima: worktree path (absolut), target file (satu file saja), judul bab, gaya pembuka yang ditugaskan, judul section penutup yang ditugaskan, fakta yang boleh dipakai (dari research notes, path diberikan), batas byte, dan aturan (kamu / nol emoji / nol em-dash / kalimat pembuka bersih / jembatan ke bab berikutnya bervariasi / tidak boleh menyentuh file lain / TIDAK BOLEH menjalankan git). Subagent wajib `wc -c` file dan menyeimbangkan sendiri sebelum lapor.

### Assignment penutup & pembuka (Rule 21, anti-template)

| Bab | Pembuka (device) | Section penutup |
|---|---|---|
| 1 | skenario dialog kasir/promo | Poin Kunci |
| 2 | pertanyaan retoris | Ringkasan |
| 3 | paradoks angka (bonus vs gaji) | Intisari |
| 4 | metafora rasa sakit | Inti Pembahasan |
| 5 | skenario menunda cicilan | Yang Perlu Kamu Ingat |
| 6 | data point grafik nilai | Kesimpulan Bab |
| 7 | kisah kasus investor | Gagasan Utama |
| 8 | rekaan lelang eksperimen | Benang Merah |
| 9 | statistik kontra-intuitif | Poin Penting |
| 10 | fenomena gelembung pasar | Recap |
| 11 | skenario program kantor | Key Takeaways |
| 12 | reflektif personal (bab penutup) | Penutup |

## Tasks

- [x] T0: Research via TinyFish (search + fetch PDF/abstrak/Crossref), ~22 sumber terverifikasi di 4 kluster (A prospek/loss aversion: parent; B mental accounting: subagent; C present bias: subagent; D anchoring/overconfidence/herding/status quo/defense: subagent). Catatan khusus: Ariely & Wertenbroch (2002) TER-RETRAK 2026, diganti Ashraf-Karlan-Yin 2006.
- [x] T0.5: Claim slot sesi + worktree di tip origin/main 6af9f64.
- [x] C1: scaffold buku, book.toml, SUMMARY.md 13 entri, icon.txt, release-dates.json (SELESAI oleh parent).
- [x] C2..C14: 13 file konten (bab 01,02,04,05,08,09,11,12,13 oleh parent inline; 03,06,07,10 oleh 4 subagent; ukuran 6.544-9.051 byte) oleh subagent fan-out.
- [x] V1: Parent diff audit gate: hanya books/psikologi-di-balik-keputusan-finansial-kita/**, release-dates.json, docs/code-plan/plans/*.md yang berubah.
- [x] V2: Verifikasi AI line-by-line (uniq -d kosong; 0 Anda/em-dash/en-dash/emoji di content+book.toml; 13 entri SUMMARY = disk; kalimat pembuka 137-159 char; built-stats.ts auto-generated +13 bab ikut diff) 13 bab: heading `## ` penutup unik (uniq -d kosong), 0 em-dash, 0 emoji (kecuali icon.txt), 0 "Anda", kalimat pembuka lengkap, referensi hyperlink, deskripsi 100-160 char, angka sesuai research notes.
- [x] V3: Build lokal (sync-template.ts exit 0 tanpa diff liar; bun run build exit 0, SEO Validation R1-R7 passed, sitemap 762 URL, manifest books[0] = slug baru, meta description bab diekstrak dari kalimat pembuka): `bun run scripts/sync-template.ts` exit 0; `bun run build` exit 0 dengan SEO Validation passed.
- [x] V4: Commit b20884d (author+committer Kania Salsabila + trailer), push, PR #127 via --body-file, registry pr --number 127 (state verified lalu open). Bukti: gh pr view 127 state=OPEN additions=958.
- [x] V5: Debt sweep + follow-up injection (4 kandidat: seed D1, GSC reindex, deploy, preprocessor lokal; learning ledger di docs/code-plan/artifacts/2026-10-06-dawnbook-psikologi-learning-ledger.md; 3 aturan KEEP terdistil; review report verdict correct tanpa temuan P0/P1).

## Follow-up Backlog

Debt sweep 2026-10-06: kandidat dieksekusi sesuai pilihan user pada question set akhir sesi.

- [ ] FU-A seed D1 buku baru pasca-merge: `set -a && source ~/cloudflare/.env && set +a && bun run scripts/migrate-to-d1.ts`. defer: butuh merge PR #127 dan kredensial user, upgrade-trigger: kartu buku error di Hub atau /api/progress tidak mengenali slug.
- [ ] FU-B trigger reindex GSC pasca-deploy: `python3 scripts/gsc_trigger_reindex.py`. defer: butuh deploy production, upgrade-trigger: sitemap 762 URL belum terindeks Google.
- [ ] FU-C deploy production: `set -a && source ~/cloudflare/.env && set +a && export PATH="$HOME/.cargo/bin:$PATH" && bash scripts/deploy-website.sh`. defer: aksi milik user, upgrade-trigger: user meminta go-live.
- [ ] FU-D pasang mdbook-dawnbook preprocessor lokal (hilangkan WARN build). defer: 1 sesi, upgrade-trigger: fitur preprocessor dibutuhkan buku berikutnya.
- [x] FU-E hygiene gitignore: `graphify-out/` ditambahkan ke .gitignore agar graph lokal tidak bocor ke diff PR (preseden *.bak-*).
