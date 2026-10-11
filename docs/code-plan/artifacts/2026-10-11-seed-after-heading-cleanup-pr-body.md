# Pull Request: Regenerasi db/seed.sql setelah penghapusan colon pada heading buku

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-seed-after-heading-cleanup` |
| Plan | `docs/code-plan/plans/2026-10-11-dawnbook-heading-colon-cleanup.md` (tugas T12) |
| Base branch | `main` |
| Head branch | `2026-10-11-dawnbook-seed-after-heading-cleanup/dawnbook-seed-after-heading-cleanup` |
| Worktree | `../dawnbook-wt/dawnbook-seed-after-heading-cleanup` |
| Type of change | chore (artefak seed turunan) |
| Reviewer | tidak ada yang diminta |

## 2. What This Changes

`db/seed.sql` diregenerasi oleh `bun run scripts/migrate-to-d1.ts` dari sumber buku yang sudah digabung lewat PR #134, sehingga salinan seed di repo sama dengan isi D1 produksi yang sudah di-seed ulang. Berkas ini turunan murni dari `books/*/src`; tidak ada sumber buku, kode, atau skema yang berubah. Selisih 2.638 baris tambah dan 2.638 baris hapus berasal dari judul bab yang tidak lagi bercolon dan dari stempel waktu `created_at`/`updated_at` yang dibuat ulang seeder.

**Non-goals:** tidak menyentuh berkas `db/seed_N.sql` lama (tidak dipakai seeder saat ini), tidak mengubah isi buku.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Seed lokal tidak lagi memuat judul bab lama | T12 | `rg -c -F 'Harga yang Dibayar: Stres' db/seed.sql` | 0 (sebelumnya 1); judul baru "sebagai Harga yang Dibayar" ada 1 |
| AC-2 | Seed lokal sama dengan sumber buku | T12 | seeder menulis `db/seed.sql` dari `books/*/src` pada `main` setelah merge | `bun run scripts/migrate-to-d1.ts` exit 0, "All seeds applied successfully." |
| AC-3 | D1 produksi sama dengan sumber lokal | T11 | `cf d1 query <dawnbook-db> --sql "SELECT slug, length(content_md) ..."` dibandingkan dengan panjang gabungan lokal per slug | 56 dari 56 slug sama panjang; 0 selisih; tidak ada heading `# Analogi: Sang Pilot` tersisa di D1 |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Seed D1 | `bun run scripts/migrate-to-d1.ts` | 0 | "All seeds applied successfully."; 0 baris `error`, `failed`, atau `SQLITE` pada log |
| Panjang per slug | `cf d1 query ... SELECT slug, length(content_md)` lalu pembanding lokal | 0 | 56 sama, 0 beda (baris `_template` tidak di-seed, sesuai seeder) |
| Detektor colon | `bun run scripts/check-heading-colons.ts` | 0 | 0 pelanggaran, 56 buku |

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Hanya salinan seed di repo; D1 produksi sudah ter-seed dan diverifikasi. Seed ini dipakai untuk membangun ulang D1 dari nol. |
| Rollout | Merge ke `main`. |
| Health signal | `rg -c -F 'Harga yang Dibayar: Stres' db/seed.sql` bernilai 0. |
| Rollback | `git revert -m 1 <commit merge>`; D1 produksi tidak terpengaruh. |
| Compatibility | Tidak ada perubahan skema. |

## 7. Pre-Existing Issues and Deferred Debt

- `db/seed_N.sql` lama masih memuat judul lama. `defer: satu sesi, pemicu: berkas itu dipakai kembali atau dihapus`
- Label tebal di isi bab berpola `Analogi: ...` (mis. `nudge-theory` bab 02 dan `eksistensialisme-dan-makna-hidup` bab 04) bukan heading dan tetap ada di seed. `defer: satu sesi, pemicu: pemilik ingin aturan untuk label tebal`

## 8. Checklist

- [x] Cabang dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada komit langsung ke `main`.
- [x] Judul imperatif, isi dalam bahasa basis kode.
- [x] Tidak ada em dash, footer atribusi, atau baris co-author.
- [x] Tidak ada rahasia atau isi `.env` pada diff.
- [ ] Terdaftar di registry: `bun scripts/pr-registry.mjs pr dawnbook-seed-after-heading-cleanup --number <N>` (setelah PR dibuka).
