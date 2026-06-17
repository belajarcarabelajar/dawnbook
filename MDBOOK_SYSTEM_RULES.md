# System Rules: Panduan Autopilot mdBook (End-to-End)

Dokumen ini merupakan **SOP WAJIB** yang harus dijalankan secara berurutan (*autopilot*) oleh agen AI utama setiap kali ada penambahan materi mdBook baru ke dalam repositori. **DILARANG KERAS MENGULANGI KESALAHAN FATAL DARI SESI SEBELUMNYA!**

## Tahap 1: Inisialisasi Struktur Buku & Validasi File (ZERO TOLERANCE)
1. **FILTER FILE RAHASIA / SYSTEM PROMPT:** Sebelum mengimpor `.md` ke dalam buku, Agen **WAJIB** membaca isi semua file mentah. Jika menemukan file berisi instruksi sistem, *prompt* rahasia, atau bahasan tentang deteksi pola AI (misal file *guidelines* internal), file tersebut **WAJIB DIHAPUS/DISINGKIRKAN** dan dilarang keras dimasukkan ke dalam daftar isi (`SUMMARY.md`)! Pastikan hanya materi buku murni yang masuk.
2. **GENERATE JUDUL & SLUG BUKU:** Agen **WAJIB** membaca sekilas isi file untuk menyimpulkan topik sebenarnya, lalu menggunakannya sebagai `title` di dalam `book.toml` dan penamaan folder utama (slug) di dalam `books/`. **DILARANG KERAS** menggunakan asal-asalan nama folder mentah dari komputer pengguna.
3. **RENAME FILE SESUAI HEADER:** Pindahkan seluruh file `.md` mentah ke dalam sub-folder `src/content/`. **DILARANG KERAS** menggunakan nama *link* atau *placeholder* asal-asalan seperti "Part 1". Agen **WAJIB** mengekstrak judul asli dari baris pertama/header (`#` atau `##`) dari tiap file.
4. **FORMAT SUMMARY.md (NO EMOJI!):** Buat file `SUMMARY.md` dengan judul asli file. **DILARANG KERAS MENGGUNAKAN EMOJI DI DALAM SUMMARY.md.** Judul *chapter* di *sidebar* harus berupa teks polos yang profesional (contoh: "Studi Kasus" bukan "Studi Kasus 💡").

## Tahap 2: Konfigurasi UI dan book.toml (WAJIB CLONE TEMPLATE)
1. **JANGAN PERNAH BIKIN book.toml DARI NOL!** Agen **WAJIB** menduplikasi file `books/_template/book.toml` (atau mencontek dari buku `piaget`) secara utuh agar tema *website*, font, dan navigasi (*shared CSS/JS*) seragam. Pastikan parameter `additional-css` dan `additional-js` selalu ikut ter- *copy*!
2. **KESEJAJARAN GRID (UI/UX STRICT RULES):** Agen dilarang keras membuat modifikasi CSS (seperti `margin-top` berselang-seling) yang membuat *card* buku di halaman utama (Hub) terlihat berantakan/tidak sejajar (*staggered*) di desktop. Pastikan juga selalu menggunakan `box-sizing: border-box;` jika memakai `height: 100%` agar *card* tidak tumpang tindih (*overlap*) saat dibuka di perangkat *mobile*.

## Tahap 3: Pemrosesan Konten via Subagents Dinamis (1 File = 1 Subagent)
Agen AI utama **WAJIB mengerahkan *subagents* secara dinamis dengan rasio 1:1** untuk menangani setiap file `.md` yang lolos filter. Setiap *subagent* wajib menerapkan:
- **Aturan 1 (Pronoun):** Penggunaan kata ganti formal "Anda" **DILARANG KERAS**. Ganti sepenuhnya menjadi **"kamu"**.
- **Aturan 2 (LaTeX):** Teks *raw* LaTeX wajib dikonversi menjadi `\( ... \)` untuk *inline* dan `\[ ... \]` (atau `$$ ... $$`) untuk *block equation*.
- **Aturan 3 (Humanisasi):** Hindari kata klise AI (*krusial, signifikan, komprehensif, bukan sekadar X melainkan Y*). Jangan menggunakan paragraf dan *bullet-points* yang sangat simetris panjangnya. Hindari juga struktur paragraf "Sandwich" (memaksa menambahkan kesimpulan generik di akhir).

## Tahap 4: Mekanisme Fallback (Anti-Stuck & Timeout)
- **Monitoring:** Agen utama wajib menantikan laporan *subagents*.
- **Fallback Rule:** Jika ada *subagent* yang tidak merespons (stuck) akibat gagal memodifikasi file berukuran raksasa, agen utama **WAJIB langsung membunuh (kill)** *subagent* tersebut.
- **Strategi Overwrite:** Luncurkan *subagent* pengganti dengan instruksi tegas: "Baca keseluruhan teks, lalu gunakan fitur `write_to_file` dengan mode `Overwrite: true` untuk menimpa file secara utuh dalam satu tarikan napas."

## Tahap 5: Build, Database, dan Deployment Autopilot
1. **INTEGRITAS BUILD SCRIPT (chapterCount):** Agen wajib memastikan *script* `scripts/build.ts` menghitung jumlah *chapter* dengan cara membaca isi file `SUMMARY.md` secara langsung (menghitung tanda `- [ `). **DILARANG KERAS** menebak jumlah bab dengan cara membaca asal daftar file `.md` di dalam *folder*, demi mencegah miskalkulasi *chapter* hantu!
2. **HANYA GUNAKAN SCRIPT RESMI:** Setelah siap rilis, agen **WAJIB** mengeksekusi MURNI hanya lewat satu *script* pamungkas:
   `rtk bash scripts/deploy-website.sh`
   **DILARANG KERAS** menjalankan command *wrangler* secara manual (`bunx wrangler pages...`, `wrangler d1...`). Semua proses rilis (termasuk migrasi D1 dan *build* statis) harus mengandalkan *script* tersebut.

## Tahap 6: Laporan Rekapitulasi Akhir
Setelah Tahap 5 selesai, agen AI wajib mengerahkan **1 Subagent Terakhir (Supervisor)** untuk membaca log *deployment* dan daftar perubahan file, lalu menyusun laporan ringkas dan transparan kepada pengguna. Pengguna cukup bersandar dan menikmati hasil yang 100% akurat.
