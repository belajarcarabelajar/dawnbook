# Merge & Deployment Evidence: PR #140 Memahami Algoritma X untuk Pembaca

> Bukti merge dan deployment sesi `dawnbook-mengatur-bacaan-x` (plan `docs/code-plan/plans/2026-10-12-dawnbook-mengatur-bacaan-x.md`, status Complete sebelum merge).

## 1. Merge

| Item | Bukti |
|---|---|
| Gerbang merge | Pemilik memilih "Merge PR #140" lewat pertanyaan `Merge` (2026-10-12) |
| Perintah | `gh pr merge 140 --merge --match-head-commit 4b71ad9ac159d03986ed911e25526487f583acc7` |
| Hasil | state MERGED, mergedAt 2026-10-12T13:58:34Z, merge commit `7e3bc735f932d21b55888638c97ce6701ec41e24` |
| Base | `main` tetap di `7b8d41a` sejak branch dibuat, jadi tidak perlu rebase |
| Pohon merge | `git diff --stat 4b71ad9 7e3bc73` kosong: pohon merge identik dengan head yang sudah diverifikasi |
| Verifikasi pasca-merge di `main` | `bun test` exit 0 (427 pass, 13 skip, 0 fail); `bun run build` exit 0, `Successfully built: memahami-algoritma-x-untuk-pembaca`, sitemap 788 URL, SEO R1-R7 passed, `manifest.json` books[0] = slug baru |
| CI remote (bukti penulis, bukan verifikasi sesi) | `Test` pada `7e3bc73`: success. Satu kegagalan sebelumnya di PR (job 114844163948) berasal dari tes waktu yang flaky (`test_parallel_performance_boost`), lulus 5/5 lokal dan lulus pada run berikutnya |
| Registry | `bun scripts/pr-registry.mjs state dawnbook-mengatur-bacaan-x merged --repo /home/belajarcarabelajar/Proyek/dawnbook` exit 0, setelah `plan-publish.mjs` menulis mirror vault |

## 2. Deploy (Phase H)

- Workflow GitHub `Deploy Dawnbook` gagal di langkah "Set up job" karena action `cloudflare/pages-action` tidak bisa di-resolve (run 38259515450; sama pada `7b8d41a`, run 38213664148). Jadi deploy dilakukan manual sesuai GEMINI.md bagian 19.
- `bash scripts/deploy-website.sh` dengan kredensial `~/cloudflare/.env` disumberkan dulu, dari `main` `7e3bc73`: exit 0, "No migrations to apply!", "Uploaded 30 files (2668 already uploaded)", deployment `b9b0b08f`, "Deployment complete! D1 binding 'DB' is active."

## 3. D1 Seed (Phase F)

- `bun run scripts/migrate-to-d1.ts` dengan kredensial yang sama: exit 0, "All seeds applied successfully.", 0 baris `"success": false`, 0 baris error.
- Verifikasi remote: `cf d1 query <dawnbook-db> --sql "SELECT slug, title, subject_label, length(content_md) ..."` mengembalikan `memahami-algoritma-x-untuk-pembaca`, judul "Memahami Algoritma X untuk Pembaca", subject_label `Teknologi`, panjang konten 84.957.
- Seeder meregenerasi `db/seed.sql` di checkout `main`; perubahan itu dibawa oleh PR kecil terpisah, sesuai pola PR #135 dan #138.

## 4. Verifikasi Pasca-Deploy (Phase I)

| URL | Status | Catatan |
|---|---|---|
| `/books/memahami-algoritma-x-untuk-pembaca/` | 200 | meta = deskripsi `book.toml` |
| `/books/.../content/01_tentukan-apa-yang-ingin-kamu-baca.html` | 200 | bab pratinjau publik, meta = kalimat pembuka utuh |
| `/books/.../content/06_skor-rekomendasi-bukan-ukuran-manfaat.html` | 401 | bab tergating untuk pengunjung tanpa sesi, sesuai desain |
| `/` (Hub) | 200 | memuat slug buku baru |
| `/sitemap.xml` | 200 | 13 URL buku baru |

- UA Googlebot palsu dari mesin lokal tetap 401 karena middleware memakai `isVerifiedBotRequest` (reverse DNS dan konfirmasi maju), jadi pengecekan bot bypass hanya bisa dibuktikan oleh Googlebot asli.
- JSON-LD di output build: bab 01 `isAccessibleForFree: "true"`; bab tergating (06, 12) `"false"` dengan `hasPart` `WebPageElement`.

## 5. GSC Reindex (bagian 11)

- Jalur token OAuth pemilik properti (bukan skrip service account yang dibalas 403 tetapi exit 0): token dari `GSC_OAUTH_*` di `~/cloudflare/.env`, scope `webmasters`.
- `PUT .../sites/sc-domain%3Adawnbook.belajarcarabelajar.com/sitemaps/<sitemap>`: HTTP 204.
- `GET` pada URL yang sama: `lastSubmitted 2026-10-12T14:10:04.480Z`, `isPending true`, errors 0, warnings 0.

## 6. Graphify

- `graphify update .` di checkout `main` (graph belum pernah ada, jadi dibangun): exit 0.
- `bun ~/vivera/scripts/graphify-sync.mjs --root <dawnbook>`: 852 dokumen, nodes 9.475 menjadi 17.244; `--check` CURRENT exit 0; `graphify query` menemukan catatan riset sesi ini.

## 7. Utang baru yang ditemukan setelah merge

- `vivera/plan.issues.json` belum memetakan proyek `dawnbook` ke repositori GitHub, sehingga `plan-issue-sync.mjs` menolak membuat issue plan. `defer: konfigurasi vivera, saat pemilik ingin plan dawnbook punya issue`
- Workflow `Deploy Dawnbook` rusak karena `cloudflare/pages-action` tidak tersedia lagi; setiap push ke `main` gagal di langkah pertama. `defer: sesi CI, ganti dengan deploy wrangler atau hapus workflow`
