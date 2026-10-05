# Session Learning Ledger: dawnbook-psikologi-di-balik-keputusan-finansial-kita

> Template: templates/session-learning-ledger-template.md (skill super-ultra-code-plan).
> Tanggal sesi: 2026-10-06. Sesi: delivery buku Dawnbook ke-49 via PR #127.

## 1. Mistake Log (mentah)

| # | Situasi | Kesalahan/Insiden | Dampak | Koreksi yang dilakukan |
|---|---|---|---|---|
| M1 | Fan-out riset: 4 agent paralel | 1 dari 4 agent gagal "user concurrency limit exceeded" | retry kluster A secara manual oleh parent | verifikasi kluster A inline via TinyFish sendiri |
| M2 | Fan-out penulis gelombang 1: 4 agent paralel | 3 dari 4 agent gagal concurrency limit (hanya bab 06 lolos) | 3 chunk antri ulang | serialisasi dispatch + takeover inline bab yang kontraknya sudah lengkap |
| M3 | Draft chapter 08 inline | typo "Lelok" (harusnya "Lelang") tertulis | tertangkap audit rg sebelum commit | edit satu baris |
| M4 | Draft chapter 05 inline | kata Inggris "Impatien" tertinggal di teks Indonesia | tertangkap audit rg | diganti "Ketidaksabaran" |
| M5 | Draft chapter 12 inline | "Kedua,ikat" tanpa spasi + kata gaul "nunda" + frasa janggal "sadar-bias" | tertangkap grep | edit satu paragraf |
| M6 | Verify sumber kandidat | 2 dari 5 sitasi awal kluster B salah metadata (DOI Feinberg, jurnal Raghubir & Srivastava) dan 1 studi ter-retrak 2026 (Ariely & Wertenbroch) nyaris masuk | salah kutip berbahaya jika lolos | koreksi via Crossref + retraction notice; studi ter-retrak dilarang eksplisit di research notes |
| M7 | Patch word "dipangsales" di bab 09 | rg/grep tidak menemukan string; ternyata kata itu hanya ada di draf pemikiran, tidak pernah tertulis di file | 3 perintah pencarian sia-sia | baca file langsung; konfirmasi file bersih |

## 2. Kandidat Aturan WHEN/DO/NOT

| Kandidat | Gate Minimum-Signal (muncul >= 2x?) | Gate 30-Hari Horizon | Status |
|---|---|---|---|
| WHEN melakukan fan-out subagent di akun ini, DO batasi ke maksimal 2 agent berjalan bersamaan (dispatch serial/wave kecil), NOT mengirim 4+ paralel. | Ya (M1, M2; juga tercatat di sesi 2026-10-01 "7 chunk retry karena user concurrency limit") | Ya, berlaku umum | KEEP (in-repo) |
| WHEN mengutip studi psikologi/ekonomi populer, DO verifikasi DOI via Crossref + cek status retraction, NOT mempercayai metadata dari ingatan atau dari satu halaman agregator. | Ya (M6; juga koreksi DOI Laibson di sesi ini) | Ya | KEEP (in-repo) |
| WHEN menulis konten inline sebagai parent, DO jalankan audit rg (Anda/em-dash/emoji/typo) segera setelah tiap file, NOT menumpuk verifikasi di akhir. | Ya (M3, M4, M5 semua tertangkap oleh audit) | Ya | KEEP (in-repo) |

## 3. Aturan KEEP (ditulis ke MEMORY.md repo bila ada)

1. WHEN fanning out subagents on this account, DO cap concurrency at 2 and dispatch waves serially, NOT launching 4+ background agents at once (measured: "user concurrency limit exceeded" kills extras instantly; three separate sessions affected).
2. WHEN citing an academic work from memory, DO verify its DOI through Crossref and check retraction status before writing the research notes, NOT trusting remembered metadata (measured this session: 2 wrong metadata out of 5 in one cluster, plus one 2026 retraction).
3. WHEN the parent authors content inline, DO run the rg hygiene audit (forbidden words, punctuation, emoji, typos) immediately per file, NOT batching verification at the end.

## 4. Follow-up Ranking (kandidat debt sweep)

1. FU-A Seed D1 buku baru pasca-merge: `bun run scripts/migrate-to-d1.ts` dengan kredensial ~/cloudflare/.env (wajib per AGENTS.md Rule 19 Phase F).
2. FU-B Trigger reindex GSC pasca-deploy: `python3 scripts/gsc_trigger_reindex.py` (Rule R19).
3. FU-C Deploy: `set -a && source ~/cloudflare/.env && set +a && bash scripts/deploy-website.sh` (dilakukan terpisah dari PR).
4. FU-D Pasang `mdbook-dawnbook` preprocessor lokal agar WARN build hilang (pre-existing, dua sesi).
