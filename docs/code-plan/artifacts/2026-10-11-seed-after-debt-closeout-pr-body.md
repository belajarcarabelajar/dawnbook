# Pull Request: Regenerasi db/seed.sql setelah penutupan utang judul

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-seed-after-debt-closeout` |
| Plan | `docs/code-plan/plans/2026-10-11-dawnbook-heading-colon-cleanup.md` (tugas F5 sampai F10, langkah seed) |
| Base branch | `main` |
| Head branch | `2026-10-11-dawnbook-seed-after-debt-closeout/dawnbook-seed-after-debt-closeout` |
| Worktree | `../dawnbook-wt/dawnbook-seed-after-debt-closeout` |
| Type of change | chore (artefak seed turunan) |
| Reviewer | tidak ada yang diminta |

## 2. What This Changes

`db/seed.sql` diregenerasi oleh `bun run scripts/migrate-to-d1.ts` dari sumber buku di `main` setelah PR #137, sehingga salinan seed di repo sama dengan isi D1 produksi yang sudah di-seed ulang dan di-deploy. Berkas ini turunan murni dari `books/*/src`; tidak ada sumber buku, kode, atau skema yang berubah. Selisih 282 baris tambah dan 282 baris hapus berasal dari judul tebal, judul berulang, dan judul bab yang ditulis ulang.

**Non-goals:** tidak mengubah isi buku atau kode.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Seed tidak lagi memuat judul lama | seed | `rg -c -F 'Sintesis Bab' db/seed.sql`; `rg -c -F 'Analogi: Mesin ATM' db/seed.sql` | 0 dan 0 (sebelumnya 10 dan 1) |
| AC-2 | D1 produksi sama dengan sumber lokal | seed | `cf d1 query <dawnbook-db> --sql "SELECT slug, length(content_md) ..."` dibandingkan dengan panjang gabungan lokal per slug | 56 dari 56 slug sama; judul lama tidak ada di D1 |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Deploy | `bash scripts/deploy-website.sh` | 0 | "Deployment complete", 573 berkas baru diunggah |
| Seed D1 | `bun run scripts/migrate-to-d1.ts` | 0 | "All seeds applied successfully."; 0 baris `error`, `failed`, atau `SQLITE` |
| Panjang per slug | `cf d1 query ...` lalu pembanding lokal | 0 | 56 sama, 0 beda (`_template` tidak di-seed, sesuai seeder) |
| Reindeks sitemap | OAuth pemilik, `PUT` lalu `GET` sitemap | 0 | PUT 204; `lastSubmitted` diperbarui; errors 0, warnings 0 |

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Hanya salinan seed di repo; produksi sudah ter-seed dan diverifikasi. |
| Rollout | Merge ke `main`. |
| Health signal | `rg -c -F 'Sintesis Bab' db/seed.sql` bernilai 0. |
| Rollback | `git revert -m 1 <commit merge>`; D1 produksi tidak terpengaruh. |
| Compatibility | Tidak ada perubahan skema. |

## 7. Pre-Existing Issues and Deferred Debt

- Isi bagian yang hampir identik antarbab di `teori-gaya-kelekatan` dan `analisis-wacana-kritis-awk-dalam-kriminologi` dibiarkan atas keputusan pemilik. `defer: tidak ada tindakan, keputusan pemilik; ditinjau ulang bila pemilik berubah pikiran`

## 8. Checklist

- [x] Cabang dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada komit langsung ke `main`.
- [x] Judul imperatif, isi dalam bahasa basis kode.
- [x] Tidak ada em dash, footer atribusi, atau baris co-author.
- [x] Tidak ada rahasia atau isi `.env` pada diff.
- [x] Setiap kriteria penerimaan terpetakan ke pemeriksaan dan bukti.
- [ ] Terdaftar di registry: `bun scripts/pr-registry.mjs pr dawnbook-seed-after-debt-closeout --number <N>` (setelah PR dibuka).
