# Session Learning Ledger: dawnbook-mengatur-bacaan-x

## 1. Identitas

- Sesi: `dawnbook-mengatur-bacaan-x` (PR #140)
- Plan: `docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md`
- Ditulis: 2026-10-12
- Prasyarat: semua tugas sebelum merge berstatus selesai dengan bukti; build, gerbang judul, dan review independen hijau.

## 2. Mistake Log

| # | Kategori | Pemicu | Sinyal | Biaya | Langkah yang benar |
|---|---|---|---|---|---|
| 1 | `rule-miss` | Subagen penulis diberi batas kalimat pembuka 110-160 karakter dari GEMINI.md bagian 8 | Pemeriksaan meta hasil build: bab 01 dan 08 terpotong dengan "..." | 1 putaran edit + 1 build ulang | Baca `formatSerpDescription(text, maxLen = 155)` di `scripts/inject-gating.ts:48` sebelum dispatch dan pakai 155 |
| 2 | `tool-misfire` | Scaffold dengan `cp -r books/_template` lalu `rm src/introduction.md` | Hook keamanan menolak `rm *` | 1 panggilan ditolak | Salin hanya bagian yang dibutuhkan (`theme/`) dan tulis file lain langsung |
| 3 | `premature-guess` | Hampir mengikuti label "kode 2023" dari dokumen sumber | Peneliti lokal: 7.667 file berstempel 2025-09-04, commit terakhir 3 September 2025, ada Phoenix dan Grok | Nol (tertangkap sebelum menulis) | Periksa tanggal file dan riwayat commit arsip sebelum memberi tanggal pada klaim |
| 4 | `rule-miss` | Mempercayai GEMINI.md bagian 9 dan 16 bahwa pembungkus `<div>` melindungi display math | Probe mdBook v0.5.4: `\,` menjadi koma, `\\` kehilangan satu backslash | Nol untuk buku ini (probe sebelum dispatch) | Hindari makro backslash+tanda baca di dalam math; uji render bila ragu |
| 5 | `scope-creep` (kecil) | Dua subagen riset dan reviewer diberi 14 klaim sekaligus | Dua kali berhenti di batas 30 giliran dengan laporan parsial | 2 putaran SendMessage | Beri anggaran panggilan alat eksplisit dan pecah ke paling banyak 7 klaim per agen |
| 6 | `premature-guess` | Koreksi riset "Cr Mixer, bukan Tweet Mixer" diterapkan sebagai aturan mutlak | README akar repositori ternyata menyebut `tweet-mixer` sebagai lapisan koordinasi kandidat luar jaringan | Satu klaim sumber dibuang tanpa perlu | Cek semua README relevan (akar dan komponen) sebelum menulis koreksi sebagai larangan |
| 7 | `rule-miss` | Plan, catatan riset, dan laporan review ditulis dalam bahasa Inggris | Artefak di `docs/code-plan` sebelumnya umumnya berbahasa Indonesia | Konsistensi arsip | Cocokkan bahasa artefak dengan file di sebelahnya sejak awal |

## 3. Aturan kandidat (WHEN, DO, NOT)

| Aturan | Minimum-Signal | 30-Day | Keputusan |
|---|---|---|---|
| WHEN mengirim subagen penulis bab Dawnbook, DO pakai batas kalimat pembuka 155 karakter dari `formatSerpDescription` (scripts/inject-gating.ts), NOT 160 dari GEMINI.md bagian 8. | Ya, dua bab nyata terpotong | Ya, selama kode itu tidak berubah | KEEP |
| WHEN menulis display math di buku Dawnbook, DO hindari `\,` `\;` `\\` `\{` `\}` dan cases di dalam `$$`, NOT mengandalkan pembungkus `<div>` (mdBook v0.5.4 tetap memproses escape Markdown). | Ya, terukur dengan probe | Ya, sampai preprocessor math ada | KEEP |
| WHEN dokumen sumber membawa arsip repositori, DO cek stempel file dan commit terakhir sebelum memberi label tahun, NOT ikut label dokumen sumber. | Ya | Ya | KEEP |
| WHEN scaffold buku baru di mesin ini, DO salin `theme/` saja lalu tulis file lain, NOT `cp -r` lalu `rm` (ditolak kebijakan keamanan). | Ya | Ya, selama kebijakan berlaku | KEEP |
| WHEN agen riset atau review diberi lebih dari 7 klaim, DO pecah atau beri anggaran panggilan alat, NOT satu agen untuk semua. | Ya, dua kali terjadi | Ya | KEEP (melengkapi memori `detector-and-review-fix-gates`) |
| WHEN menulis artefak di `docs/code-plan`, DO pakai bahasa yang sama dengan artefak sebelumnya. | Lemah, aturan umum sudah ada | Ya | NO-OP (sudah tercakup aturan bahasa artefak) |

## 4. Ke mana aturan KEEP ditulis

- Memori proyek di mesin ini (`~/.claude/projects/-home-belajarcarabelajar-Proyek-dawnbook/memory/`), karena repositori tidak punya `MEMORY.md` dan sesi sebelumnya memakai pola yang sama.
- Promosi ke `~/AGENTS.md` tidak dilakukan tanpa persetujuan per item.
