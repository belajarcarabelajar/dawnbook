# Pull Request: Tuntaskan enam utang judul: judul tebal, judul berulang, seed lama, dan gerbang build

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-heading-debt-closeout` |
| Plan | `docs/code-plan/plans/2026-10-11-dawnbook-heading-colon-cleanup.md` (tugas F5 sampai F10) |
| Base branch | `main` |
| Head branch | `2026-10-11-dawnbook-heading-debt-closeout/dawnbook-heading-debt-closeout` |
| Worktree | `../dawnbook-wt/dawnbook-heading-debt-closeout` |
| Type of change | chore, docs (konten buku), feature (pemeriksa judul berulang) |
| Reviewer | tidak ada yang diminta; review independen oleh agen peninjau, lihat bagian 5 |

## 2. What This Changes

Menutup enam utang yang tertunda dari PR #134 dan #136. (1) Judul tebal satu baris yang berpola `**Label: Subjudul**` (maksimal 100 karakter, termasuk yang memuat huruf miring) kini diperlakukan seperti heading: 57 baris ditulis ulang tanpa colon dan detektor menandainya. (2) Teks heading yang sama di 3 bab atau lebih dalam satu buku kini gagal lewat `scripts/check-repeated-headings.ts`, dan 17 kelompok (sekitar 100 heading di 9 buku) dinamai ulang dari isi tiap bagiannya; pemeriksa itu dan detektor colon dijalankan oleh gerbang build, yang kini juga gagal bila akar proyek tidak memuat buku. (3) Sembilan `db/seed_N.sql` lama dihapus karena tidak dirujuk skrip, tes, atau konfigurasi mana pun. (4) Saran editorial dari tinjauan: judul pilar bab 4 sampai 7 `menemukan-tujuan-hidup-ikigai`, enam judul bab `analisis-ekspresif-9-summers-10-autumns` tanpa awalan seragam, label A sampai D bab 12 `fungsi-manajemen-poac`, dan dua judul berpola label-hyphen. (5) Pola ` vs. ` (177 heading) dan ` - ` (63 heading) diputuskan sah karena hampir semuanya rentang angka, padanan istilah, atau gloss, lalu dicatat di `GEMINI.md` bagian 24. Perubahan buku hanya menyentuh baris heading, baris tebal, dan teks tautan `SUMMARY.md`; nama berkas, tingkat heading, dan jumlah heading tidak berubah.

**Non-goals:** tidak mengubah isi paragraf; tidak menyentuh `db/seed.sql`; tidak men-deploy atau men-seed ulang D1; tidak menyatukan isi bagian yang berulang antarbab.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Tidak ada colon pada heading, entri SUMMARY, judul book.toml, atau judul tebal satu baris | F7 | `bun run scripts/check-heading-colons.ts` | exit 0, 0 pelanggaran, 56 buku, 1 dikecualikan |
| AC-2 | Tidak ada teks heading yang sama di 3 bab atau lebih dalam satu buku | F6 | `bun run scripts/check-repeated-headings.ts` | exit 0, `0 repeated headings`; sebelumnya 17 kelompok |
| AC-3 | Gerbang gagal pada akar tanpa buku dan pada heading berulang | F6, F10 | `bun test tests/scripts/heading-gate.test.ts tests/scripts/check-repeated-headings.test.ts` | lulus; RED awal exit 1 |
| AC-4 | Detektor mengenali judul tebal, termasuk huruf miring di dalamnya, dan tidak menandai lead-in inline, label berpenutup colon, callout panjang, atau isi blok kode | F7 | `bun test tests/scripts/check-heading-colons.test.ts` | 76 lulus, 0 gagal; RED awal gagal dua kali |
| AC-5 | Hanya baris heading, baris tebal, dan teks tautan SUMMARY yang berubah; judul bab dan entri SUMMARY tetap selaras; tanpa heading `##` kembar baru | F5-F10 | `... --diff-guard origin/main`, `--parity-base origin/main`, `--dup-guard origin/main` | ketiganya exit 0 |
| AC-6 | `db/seed_N.sql` tidak dirujuk oleh apa pun | F8 | `rg 'seed_[0-9]'` di luar `docs/code-plan` dan `books/` | kosong |
| AC-7 | Build dan seluruh tes hijau | semua | `bun run build`; `bun test` | build exit 0; 427 lulus, 13 dilewati, 0 gagal |

## 4. Local Verification Evidence

> Semua baris dihasilkan di mesin yang memegang working tree, sebelum cabang di-push.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Detektor penuh | `bun run scripts/check-heading-colons.ts` | 0 | 0 pelanggaran, 56 buku, 1 dikecualikan |
| Judul berulang | `bun run scripts/check-repeated-headings.ts` | 0 | 0 |
| Guard | `... --diff-guard`, `--parity-base`, `--dup-guard` (`origin/main`) | 0 | ketiganya ok |
| Tes skrip | `bun test tests/scripts` | 0 | 205 lulus, 0 gagal |
| Build | `export PATH=$HOME/.cargo/bin:$PATH; bun run build` | 0 | selesai, langkah "Checking heading colons...", validasi SEO R1-R7 lolos |
| Seluruh tes | `bun test` | 0 | 427 lulus, 13 dilewati, 0 gagal |
| Pindai baris tambahan | `git diff -U0 -- books` dipindai dengan `rg -P` untuk em dash, "Anda", emoji, U+FE0F, U+200D | 1 (tidak ada) | 0 temuan |

## 5. Independent Review

- [x] Peninjau yang tidak menulis perubahan menjalankan sendiri tes skrip, detektor, pemeriksa judul berulang, tiga guard, pemindaian lingkup, dan menguji kasus tepi aturan judul tebal; ia juga membaca 108 pasang judul lama dan baru.
- [x] Audit diff oleh parent: tiap hasil lima agen penulis dijalankan ulang sendiri sebelum komit, satu komit per buku dengan jalur eksplisit.
- [x] Temuan [P2] diperbaiki di PR ini: judul tebal yang memuat huruf miring (`**Skenario: *Burnout* di Tempat Kerja**`, `> **Refleksi Kritis: ... *Brain Drain***`) luput karena regex menolak `*` di dalam teks tebal. Tes gagal ditulis dulu, regex diganti dengan fungsi bersama `boldTitleInner` yang dipakai pemindaian dan `--diff-guard`, dan dua baris itu ditulis ulang.
- [x] Temuan [P3] tentang ambang 2 melawan 3 pada `GEMINI.md` bagian 21 dan 24 diperjelas di bagian 24. Dua temuan P3 lain ada di bagian 7.

**Reviewer verdict:** `correct`. Tidak ada temuan P0 atau P1. Verdict berubah menjadi `not correct` bila ada regresi isi atau gerbang yang merah, dan itu tidak ditemukan.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Teks heading dan judul tebal di 32 buku (anchor `#id` heading berubah, tautan eksternal ke anchor lama bisa patah); `bun run build` kini gagal pada heading berulang di 3 bab dan pada akar tanpa buku. |
| Rollout | Default: merge ke `main`. Konten situs live dan D1 baru berubah setelah deploy dan seed ulang, yang menunggu pemilik. |
| Health signal | `bun run build` tetap exit 0 di `main`; setelah deploy, panjang `content_md` D1 per slug sama dengan sumber lokal. |
| Rollback | `git revert -m 1 <commit merge>`; sembilan berkas seed lama dapat dipulihkan dari riwayat git bila ternyata dibutuhkan. |
| Compatibility | `db/seed.sql` masih memuat judul lama sampai seeder dijalankan ulang. Judul bab dan entri SUMMARY tetap identik. |

## 7. Pre-Existing Issues and Deferred Debt

- `books/teori-gaya-kelekatan/src/content/`: bagian "Membangun Relasi yang Bermakna" (rumus kedalaman relasi, empat pilar, kutipan yang sama) hampir identik di 7 bab. Judulnya kini berbeda, tetapi isinya masih salinan; menggabungkannya mengubah isi bab. `defer: satu sesi editorial, pemicu: pemilik menyetujui penggabungan atau penghapusan bagian itu`
- Bagian "Linguistik Forensik" di `analisis-wacana-kritis-awk-dalam-kriminologi` bab 04, 05, 06, dan 09 sampai 13 juga hampir identik antarbab. `defer: satu sesi editorial, pemicu: sama dengan di atas`
- `--diff-guard` mengizinkan baris tebal apa pun (maksimal 100 karakter) berubah, bukan hanya yang berpola `Label: Sub`; 11 dari 55 pasangan di PR ini bukan sekadar penghapusan colon dan semuanya sudah dibaca. `defer: satu sesi kecil, pemicu: ada kebutuhan guard yang lebih ketat atau tes negatif untuk guard ini`
- Heading yang tidak mengandung colon tetapi berulang tepat dua kali (mis. dua penutup identik) tidak dihentikan gerbang. `defer: satu sesi kecil, pemicu: pemilik ingin ambang 2`
- Bentuk `**Rasio 3:1**` atau `**Pukul 10:30**` sebagai baris tebal penuh akan ditandai; belum ada contoh di korpus, dan `heading-colon-ok` dapat dipakai. `defer: satu sesi kecil, pemicu: contoh nyata ditemukan`
- Sisa utang dari PR #134 dan #136 yang tidak disentuh di sini: celah detektor tanpa contoh nyata (setext dalam blockquote, `<hN>` multi-baris), label tebal inline `**Label:** teks`, dan judul LaTeX rusak di `filosofi-stoikisme` bab 11 (`4 SM−65 M4 \\text{ SM} - 65 \\text{ M}`). `defer: satu sesi kecil, pemicu: audit konten berikutnya`

## 8. Checklist

- [x] Cabang dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada komit langsung ke `main`.
- [x] Judul imperatif, isi dalam bahasa basis kode.
- [x] Tidak ada em dash, footer atribusi, atau baris co-author.
- [x] Tidak ada rahasia atau isi `.env` pada diff.
- [x] Setiap kriteria penerimaan terpetakan ke pemeriksaan dan bukti.
- [ ] Terdaftar di registry: `bun scripts/pr-registry.mjs pr dawnbook-heading-debt-closeout --number <N>` (setelah PR dibuka).
