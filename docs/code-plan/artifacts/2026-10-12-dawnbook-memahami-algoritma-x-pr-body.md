# Pull Request: Tambah buku Memahami Algoritma X untuk Pembaca (12 halaman)

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-mengatur-bacaan-x` |
| Plan | `docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md` |
| Base branch | `main` |
| Head branch | `2026-10-12-dawnbook-mengatur-bacaan-x/dawnbook-mengatur-bacaan-x` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-mengatur-bacaan-x` |
| Type of change | feature (buku baru) |
| Reviewer | independent reviewer subagent (laporan di `docs/code-plan/artifacts/2026-10-12-dawnbook-memahami-algoritma-x-review-report.md`) |

## 2. What This Changes

Menambahkan buku `books/memahami-algoritma-x-untuk-pembaca/`, "Memahami Algoritma X untuk Pembaca" karya Iwan Kurniawan: 11 bab konten plus bab Referensi (12 entri SUMMARY), subject label Teknologi, ikon 🧭, dan pin tanggal rilis di `release-dates.json`. Materi berasal dari panduan Notion "Mengatur bacaan di X" dan diverifikasi ulang pada 12 Oktober 2026 (catatan riset di `docs/code-plan/plans/research-memahami-algoritma-x-untuk-pembaca.md`). Tiga koreksi utama terhadap dokumen sumber: (1) salinan kode yang dipakai sumber ternyata pembaruan 3 September 2025 dari `twitter/the-algorithm`, bukan kode 2023; (2) X merilis repositori baru `xai-org/x-algorithm` (Januari 2026), yang kini dibahas di bab 3 dan bab 6 beserta bobot publiknya per sinkronisasi 8 Oktober 2026; (3) sembilan klaim fitur disesuaikan dengan halaman X Help yang berlaku (antara lain jalur muted words yang terdokumentasi, Topics yang pasti publik, dan urutan kronologis Following yang hanya bersumber dari README Home Mixer lama). Widget interaktif Notion diubah menjadi teks dan tabel statis. `functions/lib/built-stats.ts` ikut berubah karena dibuat ulang oleh build (+12 bab, Iwan Kurniawan 46 menjadi 47 buku).

**Non-goals:** tidak menyentuh buku lain, template bersama, CSS, atau fungsi Cloudflare. Seeding D1, deploy, dan reindex GSC dijalankan setelah merge.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | 12 entri SUMMARY sama dengan 12 file di `src/content`, file pertama berawalan `01`, judul pertama tiap bab sama dengan judul SUMMARY | C1, V1 | audit mekanis buku (skrip audit sesi) | exit 0, PROBLEMS none |
| AC-2 | 0 em dash, 0 emoji di luar `icon.txt`, 0 "Anda", 0 judul bertitik dua, judul penutup tidak berulang | V1, V2 | `bun run check:headings`; `bun run scripts/check-repeated-headings.ts` | exit 0 (0 violations, 57 buku); exit 0 (0 repeated) |
| AC-3 | Build lolos dengan validasi SEO dan slug baru masuk manifest | V2 | `bun run build` | exit 0, `SEO Validation passed! All rules (R1-R7)`, sitemap 788 URL, `manifest.json` books[0] = `memahami-algoritma-x-untuk-pembaca` |
| AC-4 | Setiap fakta bisa ditelusuri ke catatan riset, setiap tautan Referensi adalah deep link yang bisa dibuka pada 12 Oktober 2026 | R0, V1, V3 | cek URL bab terhadap tabel sumber catatan riset | 27 URL unik, ok=27 missing=0 |

## 4. Local Verification Evidence

> Semua baris dijalankan di mesin yang memegang worktree, sebelum branch didorong.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Heading colons | `bun run check:headings` | 0 | 0 violations, 57 buku dipindai |
| Repeated headings | `bun run scripts/check-repeated-headings.ts` | 0 | 0 repeated |
| Template sync | `bun run scripts/sync-template.ts` | 0 | tidak ada perubahan di luar buku baru |
| Build | `bun run build` | 0 | buku baru terbangun, SEO R1-R7 passed, sitemap 788 URL |
| Meta description | pemeriksaan 13 halaman hasil build | 0 | 137-154 karakter, kalimat utuh, BAD_COUNT 0 |

Peringatan yang muncul di build hanya pemberitahuan opsional `mdbook-dawnbook` preprocessor tidak terpasang secara lokal (57 kali, satu per buku, sudah ada sebelum PR ini). Dicatat di bagian 7.

## 5. Independent Review

- [x] Reviewer yang tidak menulis konten membaca diff dan seluruh bab.
- [x] Parent diff audit berjalan: `git status` hanya menunjukkan jalur yang diizinkan, 12 bab dibaca baris per baris oleh parent, klaim setiap subagent diverifikasi ulang.
- [x] Setiap temuan yang lolos 8 kriteria sudah diperbaiki di PR ini atau dicatat di bagian 7.

**Reviewer verdict:** `correct`. Tidak ada temuan P0 atau P1; dua temuan P3 (klaim cakupan konfigurasi produksi di bab Referensi dan satu karakter em dash di file plan) sudah diperbaiki, bersama tiga observasi non-blocking. Verdict berubah menjadi `not correct` bila `bun run build` gagal atau `output/manifest.json` tidak memuat slug buku ini. Tidak ada tes otomatis yang memerah bila perubahan ini di-revert; check yang berubah adalah AC-3 dan `built-stats.ts`.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Hanya buku baru dan kartu Hub-nya. Build gagal akan memblokir deploy semua buku, tetapi build lokal sudah exit 0. |
| Rollout | Default: deploy lewat `scripts/deploy-website.sh` setelah merge, lalu `bun run scripts/migrate-to-d1.ts`. |
| Health signal | URL buku baru mengembalikan 200, kartu muncul di Hub dengan stempel waktu PUEBI, baris D1 untuk slug ada. |
| Rollback | `git revert` commit merge PR ini, lalu deploy ulang. |
| Compatibility | N/A: tidak ada antarmuka bersama, skema, atau API yang berubah. |

## 7. Pre-Existing Issues and Deferred Debt

- `books/*/book.toml` `[preprocessor.dawnbook]`: binary `mdbook-dawnbook` tidak terpasang di mesin lokal, sehingga build mencetak 57 peringatan opsional. `defer: environment setup, saat preprocessor dibutuhkan untuk fitur yang dirender`
- `MDBOOK_SYSTEM_RULES.md` Phase E menyebut build admin SPA di `apps/admin`, tetapi direktori itu tidak ada dan `scripts/build.ts` tidak memanggilnya. `defer: dokumentasi, saat MDBOOK_SYSTEM_RULES.md disentuh berikutnya`
- GEMINI.md bagian 9 dan 16: pembungkus `<div>` untuk display math tidak melindungi backslash. Diukur pada mdBook v0.5.4: `\,` menjadi koma dan `\\` kehilangan satu backslash di dalam `$$`. Buku lama yang memakai pola itu bisa salah render. `defer: audit LaTeX lintas buku, sebelum buku bermatematika berikutnya`

## 8. Checklist

- [x] Branch dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada commit langsung ke base branch.
- [x] Judul imperatif, isi mengikuti bahasa PR sebelumnya di repositori ini.
- [x] Tidak ada em dash di isi PR, pesan commit, atau teks buku.
- [x] Tidak ada footer atribusi, watermark, atau baris co-author.
- [x] Tidak ada secret, token, atau isi `.env` di diff.
- [x] Setiap acceptance criterion punya check dan evidence.
- [x] PR body ditulis ke file dan dikirim dengan `--body-file`.
