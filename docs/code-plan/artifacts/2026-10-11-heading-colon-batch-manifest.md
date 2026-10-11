# Batch Manifest dan Kontrak Subagent: Pembersihan Heading Berpola "Judul: Subjudul"

Plan: `docs/code-plan/plans/2026-10-11-dawnbook-heading-colon-cleanup.md`
Sesi: `dawnbook-heading-colon-cleanup` (pr-registry), branch `2026-10-11-dawnbook-heading-colon-cleanup/dawnbook-heading-colon-cleanup`
Worktree: `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-heading-colon-cleanup`
Status manifest: DRAFT, dispatch dilarang sebelum plan disetujui (Gate 1) dan T1 (detektor) serta T2 (aturan) hijau.

Sumber angka: pemindaian baca-saja pada tip `origin/main` 21a5ad4, 2026-10-11. Baris heading di dalam blok kode pagar (```) tidak dihitung.

## 1. Ringkasan temuan deteksi

| Metrik | Nilai |
|---|---|
| Buku dipindai | 56 |
| Berkas bab (`src/content/*.md`) | 712 |
| Berkas bab dengan minimal satu heading bercolon | 613 |
| Heading bercolon (H1-H4) | 2.516 (H1 25, H2 1.212, H3 1.088, H4 191) |
| Dari total itu: colon di akhir ("Komponen SMART:") | 197 |
| Dari total itu: berawalan nomor ("4. Label: Subjudul") | 1.033 |
| Dari total itu: judul biasa ("Label: Subjudul") | 1.286 |
| Heading yang colon-nya hanya di dalam kode/matematika | 0 |
| Entri `SUMMARY.md` bercolon | 330 |
| Judul `book.toml` bercolon | 3 (metakognisi, pembelajaran-multidisiplin, quarter-life-crisis) |
| Tautan anchor internal `](#...)` di bab | 0 |
| Pembeda positif | `## Harga yang Dibayar: Stres, Kesehatan, dan Tidur` terdeteksi oleh pola yang sama |

Label perancah yang paling sering mendahului colon (jumlah di seluruh buku): Analogi 128, Real-World Application 109, Aplikasi Dunia Nyata 78, Skenario 35, Real-world Application 34, Langkah N 34, Studi Kasus 33, Skenario N 28, Kesimpulan 26, Kasus N 23, Aplikasi Nyata 22, Implementasi Teknis 20, Aplikasi Praktis 20, Contoh Kasus 13, Penerapan Nyata 12.

Pola berdekatan yang TIDAK masuk lingkup (dicatat agar tidak hilang): heading ber-" vs. " 184, heading ber-" - " 66, heading ber-em-dash 0.

## 2. Manifest chunk (satu buku = satu chunk = satu pemilik)

Kolom: id | slug | heading bercolon | berkas bab | entri SUMMARY bercolon | ukuran bab (KB) | pemilik (kru implementer, bergilir `chef`, `nappy`, `hoggy`).

### Gelombang W1 (9 buku, 425 heading)

| Chunk | Slug | Heading | Berkas | SUMMARY | KB | Pemilik |
|---|---|---|---|---|---|---|
| C01 | arsitektur-kernel-linux | 74 | 13 | 1 | 96 | chef |
| C02 | nudge-theory | 63 | 13 | 6 | 85 | nappy |
| C03 | struktur-pasar-dan-persaingan | 56 | 13 | 10 | 83 | hoggy |
| C04 | teori-permainan-game-theory | 54 | 15 | 9 | 100 | chef |
| C05 | human-capital-theory | 49 | 12 | 5 | 106 | nappy |
| C06 | digital-minimalisme | 47 | 11 | 10 | 61 | hoggy |
| C07 | psikologi-bencana-dan-manajemen-panik | 33 | 13 | 0 | 128 | chef |
| C08 | pejorasi-dan-ameliorasi | 26 | 13 | 0 | 81 | nappy |
| C09 | menemukan-tujuan-hidup-ikigai | 23 | 12 | 9 | 70 | hoggy |

### Gelombang W2 (9 buku, 423 heading)

| Chunk | Slug | Heading | Berkas | SUMMARY | KB | Pemilik |
|---|---|---|---|---|---|---|
| C10 | fungsi-manajemen-poac | 68 | 13 | 10 | 87 | chef |
| C11 | filosofi-stoikisme | 65 | 11 | 10 | 67 | nappy |
| C12 | piaget | 60 | 12 | 6 | 68 | hoggy |
| C13 | kecerdasan-interpersonal | 53 | 13 | 7 | 93 | chef |
| C14 | gegar-budaya | 51 | 13 | 5 | 75 | nappy |
| C15 | matriks-keputusan-decision-matrix | 43 | 13 | 9 | 82 | hoggy |
| C16 | virtue-ethics-aristoteles | 40 | 13 | 11 | 73 | chef |
| C17 | pengaruh-uang-terhadap-kebahagiaan | 23 | 12 | 7 | 94 | nappy |
| C18 | sistem-peringatan-dini-early-warning-system | 20 | 13 | 0 | 92 | hoggy |

### Gelombang W3 (10 buku, 421 heading)

| Chunk | Slug | Heading | Berkas | SUMMARY | KB | Pemilik |
|---|---|---|---|---|---|---|
| C19 | quarter-life-crisis | 71 | 13 | 6 | 78 | chef |
| C20 | neurobiologi-motivasi-dopamin | 65 | 13 | 7 | 88 | nappy |
| C21 | strategi-manajemen-kelas-proaktif | 56 | 12 | 8 | 72 | hoggy |
| C22 | eksistensialisme-dan-makna-hidup | 54 | 13 | 8 | 79 | chef |
| C23 | sistem-modul-rust | 50 | 13 | 4 | 72 | nappy |
| C24 | metodologi-microteaching | 47 | 14 | 9 | 85 | hoggy |
| C25 | peluruhan-beta | 36 | 13 | 5 | 73 | chef |
| C26 | kenapa-kita-gampang-percaya-hoax | 26 | 12 | 7 | 85 | nappy |
| C27 | pembelajaran-multidisiplin | 8 | 12 | 0 | 103 | hoggy |
| C28 | sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar | 8 | 12 | 0 | 78 | chef |

### Gelombang W4 (10 buku, 416 heading)

| Chunk | Slug | Heading | Berkas | SUMMARY | KB | Pemilik |
|---|---|---|---|---|---|---|
| C29 | ekonomi-laissez-faire | 68 | 13 | 11 | 80 | chef |
| C30 | neuroplastisitas-dalam-belajar | 66 | 13 | 11 | 83 | nappy |
| C31 | resiliensi-dan-ketangguhan | 58 | 13 | 8 | 81 | hoggy |
| C32 | tonsilektomi | 54 | 14 | 9 | 83 | chef |
| C33 | bias-kognitif | 50 | 14 | 8 | 86 | nappy |
| C34 | analisis-ekspresif-9-summers-10-autumns | 46 | 15 | 6 | 55 | hoggy |
| C35 | elastisitas-harga-permintaan-dan-penawaran | 37 | 12 | 0 | 71 | chef |
| C36 | eksistensialisme-dan-kehendak-bebas | 25 | 13 | 6 | 68 | nappy |
| C37 | psikologi-di-balik-keputusan-finansial-kita | 11 | 13 | 8 | 101 | hoggy |
| C38 | literasi-keuangan | 1 | 11 | 0 | 73 | chef |

### Gelombang W5 (9 buku, 416 heading)

| Chunk | Slug | Heading | Berkas | SUMMARY | KB | Pemilik |
|---|---|---|---|---|---|---|
| C39 | geopolitik-dalam-sejarah-piala-dunia | 68 | 13 | 8 | 80 | chef |
| C40 | sejarah-evolusi-drama-korea | 66 | 12 | 6 | 74 | nappy |
| C41 | psikologi-positif | 56 | 13 | 7 | 94 | hoggy |
| C42 | state-of-flow | 55 | 13 | 0 | 79 | chef |
| C43 | iklan-digital-dan-penargetan-algoritma | 51 | 11 | 5 | 67 | nappy |
| C44 | siklus-hidrologi-mikrofisika-awan | 44 | 12 | 0 | 92 | hoggy |
| C45 | metakognisi | 39 | 11 | 10 | 89 | chef |
| C46 | teori-teori-kepribadian | 24 | 12 | 5 | 100 | nappy |
| C47 | kenapa-kebiasaan-susah-diubah | 13 | 12 | 7 | 89 | hoggy |

### Gelombang W6 (9 buku, 415 heading)

| Chunk | Slug | Heading | Berkas | SUMMARY | KB | Pemilik |
|---|---|---|---|---|---|---|
| C48 | analisis-wacana-kritis-awk-dalam-kriminologi | 85 | 14 | 5 | 139 | chef |
| C49 | neurobiologi-sistem-vestibular | 61 | 13 | 4 | 88 | nappy |
| C50 | relief-karmawibhangga-dan-hukum-sebab-akibat | 56 | 13 | 8 | 73 | hoggy |
| C51 | teori-gaya-kelekatan | 53 | 13 | 4 | 109 | chef |
| C52 | mekanisme-koping-dan-manajemen-stres | 48 | 12 | 4 | 74 | nappy |
| C53 | logika-dan-penalaran-kritis | 42 | 12 | 7 | 78 | hoggy |
| C54 | multiple-intelligences | 30 | 15 | 10 | 93 | chef |
| C55 | aerodinamika-dan-desain-airfoil | 28 | 13 | 0 | 124 | nappy |
| C56 | kenapa-kita-suka-menunda-nunda | 12 | 12 | 4 | 77 | hoggy |

Total: 56 chunk, 2.516 heading, 330 entri SUMMARY. Fan-out per gelombang 9-10 subagent (lantai 10 terpenuhi sebagai satu gelombang lebar; enam gelombang berurutan agar pemeriksaan parent per gelombang tetap terbaca). Alasan tidak 56 sekaligus: batas sumber daya mesin dan kapasitas parent untuk mengaudit diff; satu chunk merah dikerjakan ulang sendirian.

Chunk boundary check:

- [x] Setiap chunk punya tepat satu pemilik dan menulis hanya di `books/<slug>/src/content/*.md` dan `books/<slug>/src/SUMMARY.md` miliknya.
- [x] Tidak ada dua chunk menulis berkas yang sama (jalur dipisah per slug).
- [x] 56 slug pada manifest = 56 direktori buku non-template pada tip main (angka berasal dari pemindaian yang sama).
- Permukaan di luar chunk (hub `manifest.json`, `llms.txt`, sitemap, judul halaman, `db/seed.sql`, D1) tidak dimiliki chunk mana pun. Semuanya diturunkan dari SUMMARY/bab oleh `bun run build` dan `migrate-to-d1.ts`; pemilik: T9 (build) dan T11 (D1), lihat `impacts` di plan.

## 3. Kontrak per chunk (berlaku untuk C01-C56)

**Delegasi:** mode `isolated-files`. Working directory: worktree sesi di atas. Semua jalur absolut diawali worktree itu; jangan menulis di `/home/belajarcarabelajar/Proyek/dawnbook` (checkout utama).

**Batas git (wajib):** kamu menyunting berkas dan menjalankan pemeriksaan. Kamu TIDAK menjalankan `git commit`, `git add`, `git checkout`, `git switch`, `git merge`, `git rebase`, `git stash`, `git reset`, `git push`, atau `gh`. Jika terlanjur commit, laporkan agar parent melakukan `git reset --soft HEAD~1`.

**Berkas yang boleh diubah:** `books/<slug>/src/content/*.md` dan `books/<slug>/src/SUMMARY.md` untuk slug chunk-mu. Berkas lain, termasuk `book.toml`, adalah laporan, bukan suntingan.

**Yang boleh diubah dalam berkas itu:** hanya teks heading (baris berawalan `#`) dan teks tautan entri SUMMARY.md. Isi paragraf, tabel, rumus, daftar, dan blok kode tidak boleh berubah satu karakter pun. Satu pengecualian: jika ada kalimat isi yang mengutip persis teks heading lama, laporkan sebagai `IMPACT:`, jangan ubah.

**Wajib baca penuh:** setiap bab dibaca penuh dengan Read sebelum heading-nya diubah (GEMINI.md §16: pembacaan 1:1 baris demi baris, bukan skrip). Dilarang skrip massal, regex find-replace massal, atau konverter batch untuk menyunting heading. Sunting per heading dengan Edit. Skrip detektor `scripts/check-heading-colons.ts` hanya untuk membaca/memeriksa, bukan untuk menulis.

**Aturan penulisan ulang (sama dengan aturan baru GEMINI.md §24):**

1. Tidak boleh ada `:` pada teks heading, termasuk colon penutup ("Komponen SMART:"), pada bab maupun SUMMARY.md.
2. Dilarang mengganti colon secara mekanis dengan tanda hubung, tanda pisah, titik koma, kurung, atau kata sambung kosong ("dan"). Itu pola yang sama dengan penyamaran. Tulis ulang menjadi satu frasa yang wajar.
3. Pilih salah satu cara, sesuai isi bagian: (a) subjudul membawa makna spesifik: pakai subjudul, buang label generik; (b) label membawa topik dan subjudul hanya mengulang: pakai label; (c) keduanya penting: lebur menjadi satu frasa alami (frasa nomina, frasa verba, atau pertanyaan); (d) colon penutup: hapus colon, dan bila heading itu pengantar daftar, ubah menjadi frasa nomina.
4. Pertahankan nomor urut ("4.", "\\5." sesuai bentuk aslinya), tingkat heading, bahasa, dan makna. Jangan menambah klaim baru.
5. Label perancah generik (Analogi, Real-World Application, Aplikasi Dunia Nyata, Studi Kasus, Skenario, Kasus, Kesimpulan, Implementasi Teknis, Penerapan Nyata) tidak boleh menjadi kata pertama pada lebih dari 2 heading dalam satu buku setelah penulisan ulang. Variasikan; bila isi bagian sudah jelas sebagai analogi atau kasus, label boleh dibuang seluruhnya (GEMINI.md §21).
6. Tidak boleh muncul heading `##` baru yang identik di dua bab dalam satu buku (`grep -h '^## ' books/<slug>/src/content/*.md | sort | uniq -d` tidak boleh bertambah dibanding awal).
7. Entri SUMMARY.md yang sebelumnya sama persis dengan heading baris pertama bab harus tetap sama persis sesudahnya. Entri yang sudah berbeda sejak awal (55 kasus di seluruh buku) jangan "diperbaiki"; hanya hilangkan colon-nya sendiri.
8. Keluaran bersih: tanpa em dash, tanpa emoji, tanpa "Anda" (pakai "kamu"), tanpa tanda baca spasi sebelum titik/koma.
9. Colon sah (judul karya yang dikutip apa adanya, misal "Thinking, Fast and Slow: ...") ditandai penanda `<!-- heading-colon-ok: <alasan> -->` di akhir baris heading, dan WAJIB disebut di laporan. Jangan memakai penanda untuk menghindari penulisan ulang.
10. Variasi kata sambung dan label urutan (ditambahkan 2026-10-11 setelah laporan W1 pertama, plan v2). (a) Satu kata sambung (sebagai, dengan, lewat, melalui, pada, saat, untuk, menurut, dalam, di) tidak boleh dipakai pada lebih dari max(4, 15% dari heading yang kamu tulis ulang) dalam satu buku (angka yang dipakai penggaris `hc-measure.js`; paling lama 4 untuk buku kecil); lebih disukai membuang label atau menyusun ulang menjadi frasa nomina tanpa sambung. Pola satu kerangka yang sama diulang (misalnya setiap langkah berakhir dengan "sebagai Langkah Kedua") adalah perancah berulang (GEMINI.md bagian 21) dan dilarang. (b) Label urutan seperti "Langkah N", "Tahap N", "Kasus N", "Skenario A/B": pertahankan urutannya sebagai nomor biasa pada format yang sudah dipakai buku itu ("N. Judul"), atau buang labelnya bila urutan sudah jelas dari posisi; jangan menempelkan ordinal di akhir heading. (d) Jangan menempelkan penggantinya sebagai sufiks setelah label perancah dibuang: "di Dunia Nyata", "dalam Praktik" setelah "Real-World Application" menghidupkan kembali perancah yang sama. (e) "vs." dan "vs" pada heading dipertahankan apa adanya; menggantinya dengan "Dibandingkan" bukan penghapusan colon dan terbaca kaku. (c) Batas label perancah pada aturan 5 dihitung atas heading yang kamu tulis ulang; heading bebas colon yang sudah ada tidak perlu disunting, cukup dilaporkan bila melanggar batas itu.
11. Judul bab mempertahankan topik (ditambahkan 2026-10-11 setelah audit W1, plan v2). Heading pertama sebuah berkas bab dan entri SUMMARY.md-nya (tetap identik) wajib memuat kata topik dari bagian label lama: pertahankan bagian label dan buang subjudul, atau lebur keduanya tanpa kata sambung; slogan tanpa topik ("Seni Berbagi Secara Adil") dilarang. Label generik tunggal (Pendahuluan, Pengantar, Kritik) boleh dibuang bila subjudul menyebut topik. Ukur dengan penggaris `bun /tmp/hc-measure/hc-measure.js <slug>` (juga memeriksa batas sambung dan panjang); hasil harus `RULER: PASS` sebelum melapor.

**Verifikasi chunk (jalankan sendiri, sertakan keluaran di laporan):**

- `bun run scripts/check-heading-colons.ts --books <slug>` harus exit 0 (RED sebelum kerja: exit 1 dengan jumlah pada tabel di atas).
- `bun run scripts/check-heading-colons.ts --diff-guard origin/main --books <slug>` exit 0 (hanya baris heading dan entri SUMMARY yang berubah).
- `bun run scripts/check-heading-colons.ts --parity-base origin/main --books <slug>` exit 0 (aturan 7).
- `bun run scripts/check-heading-colons.ts --dup-guard origin/main --books <slug>` exit 0 (aturan 6).

**Laporan wajib (format tetap):**

1. Tabel `berkas | baris | heading lama | heading baru` untuk SEMUA heading yang diubah (jumlah baris tabel = jumlah heading pada manifest untuk slug itu, ditambah entri SUMMARY).
2. Keluaran empat perintah verifikasi di atas, lengkap dengan exit code.
3. Satu baris `IMPACT: <permukaan> - <apa yang rusak> - <perintah bukti>` untuk tiap permukaan terdampak yang ditemukan, atau `IMPACT: none (<perintah yang dipakai memeriksa>)`.
4. Satu baris `NOT READ: <sumber> (<alasan>)` per sumber yang gagal dibaca, atau `NOT READ: none`.
5. Daftar penanda `heading-colon-ok` yang dipakai beserta alasannya, atau `none`.

**Gerbang parent (setelah gelombang):**

- [ ] Semua laporan terkumpul; tidak ada yang ditempel mentah sebagai hasil.
- [ ] Parent menjalankan ulang empat perintah verifikasi untuk seluruh buku gelombang (bukan percaya laporan).
- [ ] `git diff --stat -- books/<slug>` memperlihatkan hanya jalur yang diizinkan.
- [ ] Sampel review independen oleh `staid`: 5 heading acak per buku dibaca terhadap isi bagiannya (makna tetap, bukan sekadar colon dibuang).
- [ ] Jumlah baris `IMPACT:` = jumlah pemilik (tiap IMPACT jadi tugas atau baris `defer:`); setiap `NOT READ:` dibaca ulang parent atau dibawa sebagai belum terbaca.
- [ ] Integrasi dengan `git add <jalur eksplisit>` (tidak pernah `git add .`), commit oleh parent pada branch sesi.
- [ ] Chunk merah dipecah dan dikirim ulang sendirian, tidak pernah dua kali tanpa perubahan; subagent diam tanpa penulisan 3 menit diukur dulu (mtime berkas miliknya dan proses) sebelum dinyatakan macet.
