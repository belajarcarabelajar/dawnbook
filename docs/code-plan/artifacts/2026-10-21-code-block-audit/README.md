# Audit blok kode di buku Dawnbook (2026-10-21)

Pemicu: owner melihat blok Python `def cek_volume(...)` tampil mentah di `piaget/06_tahap-praoperasional-dunia-simbol-dan-imajinasi` (bagian "4. Representasi Logika Praoperasional (Analogi Teknis)"). Bagi pembaca awam itu tampak seperti eror. Permintaan: audit semua buku, pertahankan kode hanya bila materinya memang tentang pemrograman, ubah sisanya ke bentuk yang membawa pesan yang sama.

Status: audit selesai, semua batch dikonversi dan menunggu merge (PR #172 sampai #177). Belum di-deploy.

## Keputusan owner (2026-10-21)

1. BORDERLINE: ubah 21 blok, pertahankan pixel pelacak 1 baris di iklan-digital 05 dengan satu kalimat penjelas.
2. Angka salah: hitung ulang dari rumus dan input yang tertulis, betulkan prosa juga, catat tiap koreksi di PR. Angka karangan yang tidak bisa diverifikasi diberi label "ilustrasi" atau dibuang.
3. Pengiriman: PR percontohan Piaget dulu, lalu buku lain dalam sekitar lima PR batch. Deploy hanya atas permintaan owner.

## Progres

| Batch | Buku | Blok | PR |
|---|---|---|---|
| Percontohan | `piaget` | 5 | #172 (bersama audit ini) |
| g1 | 8 buku (teori-permainan, multiple-intelligences, state-of-flow, dan lain-lain) | 33 | #174 |
| g2 | 8 buku (matriks-keputusan, filosofi-stoikisme, psikologi-bencana, dan lain-lain) | 33 | #173 |
| g3 | 9 buku (nudge-theory, siklus-hidrologi, neuroplastisitas, dan lain-lain) | 33 | #175 |
| g4 | 8 buku (bias-kognitif, logika, analisis-wacana-kritis, dan lain-lain) | 29 | #176 |
| g5 | 8 buku (iklan-digital, aerodinamika, fungsi-manajemen-poac, dan lain-lain) | 31 + 1 dipertahankan | #177 |

Cara kerja tiap batch: satu worktree per batch, satu agen implementer per 1 sampai 4 buku (kontrak berisi aturan GEMINI.md bagian 9, 16, 21, 24, 25 dan keputusan owner), lalu satu reviewer independen per kelompok buku. Reviewer menemukan 5 P1 (semuanya diperbaiki: klaim tanpa dasar di stoikisme 06, kalimat sebab yang bertentangan dengan tabel di teori-permainan 13, dua diagram yang kehilangan dasar di prosa setelah kodenya dihapus di relief 05 dan bias-kognitif 12, ambang tanpa label di digital-minimalisme 10) dan sekitar 100 P2 (hampir semua diperbaiki). Setiap batch lulus `remaining-fences.py`, `check:headings`, `check-repeated-headings`, `check:diagrams`, copy rules, dan `bun run build`.

## Tindak lanjut di luar cakupan (belum diubah)

Ditemukan saat konversi, di baris yang bukan blok kode. Butuh keputusan owner atau sapuan terpisah:

- Rumus tampilan bermasalah: sekitar 40 blok `$$` menempel ke paragraf tanpa baris kosong di 20 buku (contoh: piaget 05, geopolitik 11:45, nudge 08:13), blok dengan baris kosong di dalam `$$` (kecerdasan-interpersonal 04:59, bias-kognitif 13:29, digital-minimalisme 08:15 dan 11:31, nudge 06:86 dan 09:29), `\\` di dalam math (bias-kognitif 05:17, drama-korea 09:49, kecerdasan-interpersonal 09:28), `aligned` dengan satu backslash di nudge 05:70, dan `$` tunggal di drama-korea 08:45.
- Salah ketik: "and" di logika 05:77 dan 11:89, matriks-keputusan 06:11, drama-korea 09:57 ("or"); "perkebunan sifar" di neuroplastisitas 13:11; judul "Plateu" di neuroplastisitas 12; baris teks lepas sebelum judul di metakognisi 08:1.
- Isi yang perlu dicek sumber: konstanta difusi $\xi$ di siklus-hidrologi 06 (contoh angka sudah dibuang), alasan Prancis dan Skotlandia mundur 1950 di geopolitik 03, tarif pajak 35% di ekonomi-laissez-faire 10 (sudah berlabel ilustrasi), waktu pulih fokus 23 vs 20 menit di digital-minimalisme 08 dan 09.
- Keputusan isi: nama kolom tabel strategi-manajemen-kelas 05 (header asli hilang sejak commit pertama), rubrik 3 kriteria vs 4 aspek di pembelajaran-multidisiplin 09, kode inline `saveData()` di logika 02, pseudo-kode IF/THEN inline di relief-karmawibhangga 04:33.

Piaget menyimpang dari saran auditor di dua tempat, dengan alasan berikut:

- 03: auditor menyarankan tabel baru, tetapi tabel "Asimilasi vs Akomodasi" tepat di atas blok sudah memuat isinya. Bagian 5 dihapus, tabel itu diberi baris **Contoh** dari contoh bab sendiri (burung gereja, burung unta), dan bagian sesudahnya dinomori ulang.
- 06 (blok yang dilaporkan owner) dan 08: auditor menyarankan hapus, tetapi owner meminta bentuk visual pengganti. Keduanya jadi diagram yang setiap simpulnya tertulis di prosa bab (08 mendapat butir 4 "Tindakan" lebih dulu).

## Metode

- Inventaris: semua blok berpagar (```` ``` ````) di `books/*/src/**/*.md`. 416 blok: 160 Mermaid (sudah dirender jadi diagram, tidak diaudit) dan 256 blok kode atau teks.
- Kontrol kelengkapan: jumlah `<pre><code>` di `output/` (build 2026-10-21 15:24) = 261 = 256 blok berpagar + 5 salinan bab pertama di `index.html`. Tidak ada blok kode berindentasi yang terlewat.
- Dua buku yang memang tentang pemrograman diperiksa langsung: `sistem-modul-rust` (70 blok: Rust, pohon folder `src/`) dan `arsitektur-kernel-linux` (21 blok: C, perintah shell, log `dmesg`/`strace`). Semua dipertahankan.
- 165 blok di 42 buku lain diaudit oleh lima auditor read-only memakai `rubric.md`. Tiap blok dibaca bersama prosa di sekitarnya. Laporan lengkap per blok ada di `g1.md` sampai `g5.md` (nomor baris = baris file pada commit `59324ec`).
- Cek silang parent: angka nudge-theory 07 (Rp 569.293.809, bukan Rp 1.077.322.667) dan bug ekonomi-laissez-faire 08 (fungsi mengembalikan harga, bukan kuantitas) dihitung ulang dan cocok dengan laporan.

## Hasil

| Kelompok | Blok | Vonis |
|---|---|---|
| Buku pemrograman (`sistem-modul-rust`, `arsitektur-kernel-linux`) | 91 | KEEP semua |
| Buku lain, CONVERT | 143 | ubah |
| Buku lain, BORDERLINE | 22 | 21 disarankan ubah, 1 disarankan tetap (pixel pelacak 1 baris di iklan-digital 05) |
| **Total** | **256** | |

Bentuk pengganti untuk 165 blok di buku non-pemrograman (BORDERLINE dihitung dengan rekomendasinya):

| Bentuk | Blok | Arti |
|---|---|---|
| `hapus` | 47 | Diagram, tabel, atau prosa di bagian yang sama sudah memuat isinya. Sebagian perlu 1-3 kalimat pengganti untuk info kecil yang hanya ada di kode. |
| `tabel` | 49 | Data JSON, profil, skor, matriks, aturan bercabang dengan ambang. |
| `teks` | 26 | Templat, surat, agenda, dialog, protokol, langkah yang salah dimasukkan ke pagar kode. |
| `contoh-hitung` | 24 | Hitungan numerik jadi rumus + tabel input dan hasil. |
| `rumus` | 9 | Rumus di pagar kode atau rumus yang hanya tersirat di kode jadi `$$ ... $$`. |
| `mermaid` | 9 | Logika keputusan yang belum punya diagram, setelah aturannya ditulis di prosa (GEMINI.md bagian 25). |
| tetap | 1 | iklan-digital 05 (rekomendasi, butuh keputusan owner). |

## Per buku

| Buku | Grup | Blok | CONVERT | BORDERLINE |
|---|---|---|---|---|
| `eksistensialisme-dan-kehendak-bebas` | g1 | 3 | 3 | 0 |
| `geopolitik-dalam-sejarah-piala-dunia` | g1 | 2 | 2 | 0 |
| `multiple-intelligences` | g1 | 6 | 4 | 2 |
| `quarter-life-crisis` | g1 | 1 | 1 | 0 |
| `resiliensi-dan-ketangguhan` | g1 | 4 | 4 | 0 |
| `state-of-flow` | g1 | 5 | 3 | 2 |
| `struktur-pasar-dan-persaingan` | g1 | 2 | 2 | 0 |
| `teori-permainan-game-theory` | g1 | 10 | 10 | 0 |
| `ekonomi-laissez-faire` | g2 | 2 | 2 | 0 |
| `filosofi-stoikisme` | g2 | 6 | 6 | 0 |
| `gegar-budaya` | g2 | 3 | 3 | 0 |
| `kenapa-kita-suka-menunda-nunda` | g2 | 2 | 2 | 0 |
| `matriks-keputusan-decision-matrix` | g2 | 8 | 8 | 0 |
| `psikologi-bencana-dan-manajemen-panik` | g2 | 5 | 5 | 0 |
| `strategi-manajemen-kelas-proaktif` | g2 | 5 | 5 | 0 |
| `virtue-ethics-aristoteles` | g2 | 2 | 1 | 1 |
| `human-capital-theory` | g3 | 4 | 3 | 1 |
| `metakognisi` | g3 | 2 | 0 | 2 |
| `neuroplastisitas-dalam-belajar` | g3 | 6 | 5 | 1 |
| `nudge-theory` | g3 | 8 | 4 | 4 |
| `peluruhan-beta` | g3 | 2 | 2 | 0 |
| `pembelajaran-multidisiplin` | g3 | 3 | 3 | 0 |
| `relief-karmawibhangga-dan-hukum-sebab-akibat` | g3 | 1 | 1 | 0 |
| `siklus-hidrologi-mikrofisika-awan` | g3 | 6 | 6 | 0 |
| `sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar` | g3 | 1 | 1 | 0 |
| `analisis-wacana-kritis-awk-dalam-kriminologi` | g4 | 5 | 2 | 3 |
| `bias-kognitif` | g4 | 8 | 7 | 1 |
| `elastisitas-harga-permintaan-dan-penawaran` | g4 | 2 | 2 | 0 |
| `logika-dan-penalaran-kritis` | g4 | 7 | 5 | 2 |
| `mekanisme-koping-dan-manajemen-stres` | g4 | 1 | 1 | 0 |
| `metodologi-microteaching` | g4 | 1 | 1 | 0 |
| `pejorasi-dan-ameliorasi` | g4 | 2 | 2 | 0 |
| `piaget` | g4 | 5 | 5 | 0 |
| `sejarah-evolusi-drama-korea` | g4 | 3 | 3 | 0 |
| `aerodinamika-dan-desain-airfoil` | g5 | 6 | 6 | 0 |
| `digital-minimalisme` | g5 | 4 | 4 | 0 |
| `fungsi-manajemen-poac` | g5 | 6 | 6 | 0 |
| `iklan-digital-dan-penargetan-algoritma` | g5 | 7 | 5 | 2 |
| `kecerdasan-interpersonal` | g5 | 4 | 4 | 0 |
| `neurobiologi-motivasi-dopamin` | g5 | 1 | 1 | 0 |
| `neurobiologi-sistem-vestibular` | g5 | 2 | 2 | 0 |
| `psikologi-positif` | g5 | 2 | 1 | 1 |
## BORDERLINE (22)

| Blok | Alasan borderline | Rekomendasi |
|---|---|---|
| iklan-digital 05 (pixel `<img>` 1 baris) | Artefak nyata yang dibahas bab | Tetap, plus kalimat penjelas |
| iklan-digital 07 (JSON bid request) | Format teknis RTB | Tabel |
| psikologi-positif 05, state-of-flow 05 dan 09, metakognisi 07 dan 08, neuroplastisitas 12_1, bias-kognitif 06, logika 05 dan 06 | Skenario programmer atau insinyur | Hapus atau teks; pesan psikologinya tidak butuh kode |
| nudge-theory 01, 04, 05, 08 | Disapa ke "front-end developer"; contoh UI | Mock-up teks atau tabel |
| multiple-intelligences 04 dan 06 | Bagian menyebut pemrograman | Rumus (bola parametrik; gelombang sinus) |
| human-capital 11 | Tentang pengembang di era AI | Tabel peran |
| virtue-ethics 09 | Menyapa pengembang perangkat lunak | Rumus keadilan distributif |
| AWK 08, 11, 13 | Metode riset komputasional | Tabel, teks, contoh-hitung |

## Temuan yang harus diputuskan sebelum konversi

Angka atau klaim di kode atau prosa yang salah (konversi tidak boleh menyalinnya apa adanya):

- nudge-theory 07: prosa menulis hasil Rp 1.077.322.667; logika kodenya sendiri menghasilkan Rp 569.293.809.
- ekonomi-laissez-faire 08: fungsi mengembalikan harga, bukan kuantitas; pajak tampak menaikkan produksi 50 ke 60 padahal modelnya memberi 50 ke 40.
- matriks-keputusan 07: rumus kode (3,0) berbeda dari rumus prosa (3,33). Matriks-keputusan 09: prosa bilang Vendor B memimpin, padahal seri 7,0 vs 7,0.
- pembelajaran-multidisiplin 07: prosa mengklaim "titik temu" kata kunci, irisan hasil kode kosong.
- siklus-hidrologi 03 (permukaan laut vs tanah), 05 (RH vs lewat jenuh, blok salah tempat), 06 (nilai ξ tampak terlalu besar, belum diverifikasi ke sumber), 07 (Stokes dipakai di 50 µm, batas prosa 40 µm).
- dopamin 04 (180 dan 80 vs 250% dan 70% di bab), poac 05 (50% vs 40%), poac 11 vs 12 (input sama, vonis berbeda), iklan 10 (`analytics: true` vs Privacy by Default), teori-permainan (angka Dilema Tahanan berbeda di bab 03, 06, 07), quarter-life 04 (diagram yang ada memuat "0.8" dan kata "kode"; sumbernya hanya kode).
- strategi-manajemen-kelas 05: tabel tanpa header sejak commit pertama; nama kolom harus diusulkan ulang.

Angka karangan tanpa sumber yang hanya ada di kode (geopolitik 11, psikologi-bencana 12 "85%", ekonomi 10, neuroplastisitas 13, dan lainnya): pindahkan dengan label "ilustrasi" atau buang. Rinciannya di kolom "Catatan" tiap laporan.

## Aturan yang berlaku saat konversi

- GEMINI.md bagian 9 dan 16: tiap bab dibaca dan diedit baris per baris, tanpa skrip batch.
- Bagian 25 (Mermaid): setiap simpul harus sudah tertulis di prosa bab; `diagrams:render` lalu `check:diagrams`.
- Bagian 24: judul pengganti tanpa titik dua; bagian 21: judul penutup tidak seragam.
- "kamu", tanpa em dash, tanpa emoji; `$$` dengan baris kosong dan pembungkus `<div>`; `\text{\%}` untuk persen.
- Judul bagian yang seluruhnya tentang kode ("Implementasi Python", "Analogi Kode") ditulis ulang atau dihapus, lalu penomoran bagian sesudahnya disesuaikan.
