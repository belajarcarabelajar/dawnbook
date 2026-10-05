# Merge & Deployment Evidence: PR #127 Psikologi di Balik Keputusan Finansial Kita?

> Bukti merge dan deployment sesi `dawnbook-psikologi-di-balik-keputusan-finansial-kita`.
> Tanggal: 2026-10-06. Semua perintah dijalankan lokal pada machine yang memegang
> worktree sebelum merge, dan verifikasi live setelahnya.

## 1. Merge

| Field | Value |
|---|---|
| PR | #127 (state MERGED, mergedAt 2026-10-05T19:52:08Z) |
| Merge commit | 06e62d801f5af8c61b77facd9a612ff6668280a9 |
| Rebase sebelum merge | tidak diperlukan: origin/main masih 6af9f64 (tip saat branch dipotong), tidak ada sesi lain yang landed |
| Verifikasi ulang pra-merge | `bun run build` exit 0 pada commit 8624b54; sitemap 762 URL; SEO Validation R1-R7 passed |
| Registry | state open -> merged via `bun scripts/pr-registry.mjs state dawnbook-psikologi-di-balik-keputusan-finansial-kita merged` |

## 2. D1 Seed (Phase F)

- `bun run scripts/migrate-to-d1.ts` dengan kredensial `~/cloudflare/.env`: percobaan pertama kena timeout 240 detik lokal (bukan error D1; seeder memproses 49 buku berurutan via per-statement command), percobaan kedua exit 0: "All seeds applied successfully."
- Verifikasi query remote: `cf d1 query <uuid-dawnbook-db> --sql "SELECT slug, subject_label, length(content_md) ..."` mengembalikan row `psikologi-di-balik-keputusan-finansial-kita`, subject_label `Psikologi`, content_md 104.062 byte.

## 3. Deploy (Phase H)

- `bash scripts/deploy-website.sh` (kredensial disumberkan dulu sesuai AGENTS.md Rule 19): exit 0, "Deployment complete! D1 binding 'DB' is active.", 31 file baru ter-upload (2.575 sudah ada di CDN).

## 4. Verifikasi Pasca-Deploy (Phase I manual)

- Hub `https://dawnbook.belajarcarabelajar.com/`: 200; kartu buku baru tampil dengan penulis "Kania Salsabila" dan timestamp PUEBI "6 Oktober 2026, 02.16 WIB" (pinnedMs dari release-dates.json).
- `manifest.json`: `books[0]` = slug baru.
- Index buku: 200. Bab 01 (public preview): 200.
- Bab 02-13 untuk anonim: 401 (gating, perilaku yang diharapkan).
- Catatan penting (pre-existing, bukan regresi): permintaan dengan UA `Googlebot` terhadap chapter gated BUKU LAMA pun mengembalikan 401 JSON `{"error":"Unauthorized",...}`, identik dengan buku baru. Artinya bot bypass R19 (Rule 11) tidak aktif di produksi untuk semua gated chapter. Terdaftar sebagai debt platform di plan (FU-B terkait, upgrade-trigger: penyusunan indeks Google terganggu).

## 5. Follow-up Status

| Item | Status |
|---|---|
| FU-A seed D1 | SELESAI (bagian 2) |
| FU-B GSC reindex | SELESAI via token OAuth user (bukan SA snipset). Consent flow satu kali di browser atas akun pemilik `kurniawaniwan7906@gmail.com` memakai client OAuth sendiri (project gen-lang-client-0718117783, scope webmasters). Kredensial aman di `~/cloudflare/.env`: `GSC_OAUTH_CLIENT_ID`, `GSC_OAUTH_CLIENT_SECRET`, `GSC_OAUTH_REFRESH_TOKEN` (ditambah 2026-10-06, backup lama `~/cloudflare/.env.bak-gsc-20261006`). Sitemap `https://dawnbook.belajarcarabelajar.com/sitemap.xml` di-submit ulang via API (HTTP 204, lastSubmitted 2026-10-05T20:43Z); URL Inspection dua halaman buku baru masih "URL is unknown to Google" (normal untuk halaman baru; crawler mengikuti sitemap). Pemakaian ulang: `set -a && source ~/cloudflare/.env && set +a`, mint token dari refresh token dengan scope webmasters, lalu PUT/PGET ke `webmasters/v3/sites/sc-domain:dawnbook.belajarcarabelajar.com/...`. Catatan: gcloud CLI TIDAK bisa dipakai untuk GSC (client gcloud tak terdaftar scope webmasters, terukur `restricted_client` dan `403 insufficient scopes`). |
| FU-C deploy | SELESAI (bagian 3) |
| FU-D preprocessor mdbook-dawnbook lokal | DEFERRED: crate tidak ada di crates.io dan tidak ada source lokal di repo; butuh sumber crate dari user. |
| FU-E gitignore graphify-out | SELESAI (ikut PR #127) |
| FU-F regenerasi db/seed.sql | db/seed.sql di main kini ter-regenerasi mengandung buku baru (juga mengabsorsi perubahan lama yang belum di-commit); belum di-commit karena aturan no-direct-to-main; layak satu sesi kecil `chore(db): regenerate seed.sql`. |
