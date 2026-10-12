# Pull Request: Regenerasi db/seed.sql dan bukti merge buku Memahami Algoritma X

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-seed-after-x-book` |
| Plan | `docs/code-plan/plans/2026-10-12-dawnbook-x-book-followups.md` (tugas A1, A2) |
| Base branch | `main` |
| Head branch | `2026-10-12-dawnbook-x-book-followups/dawnbook-seed-after-x-book` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-seed-after-x-book` |
| Type of change | chore (data seed dan dokumentasi sesi) |
| Reviewer | none requested |

## 2. What This Changes

Membawa `db/seed.sql` hasil `bun run scripts/migrate-to-d1.ts` pada 2026-10-12 (seed D1 setelah PR #140), dengan isi byte-identik dengan keluaran seeder (sha256 diawali `f0ae9cfa`). Diff berisi baris buku `memahami-algoritma-x-untuk-pembaca` dan stempel waktu yang diregenerasi untuk semua buku, pola yang sama dengan PR #135 dan #138. PR ini juga menambahkan bukti merge dan deploy PR #140, mencentang tugas M1 di plan induk, mencatat dua utang yang ditemukan setelah merge (pemetaan issue plan dawnbook, workflow deploy yang rusak), dan membuat plan tindak lanjut.

**Non-goals:** tidak mengubah konten buku, skrip, atau workflow. Perbaikan workflow deploy ada di sesi `dawnbook-ci-deploy-fix` yang bergantung pada PR ini.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-A1 | `db/seed.sql` sama persis dengan keluaran seeder 2026-10-12 | A1 | `sha256sum` checkout utama vs worktree | keduanya `f0ae9cfac7d06215...` |
| AC-A2 | Bukti merge PR #140 tersimpan dan M1 di plan induk dicentang dengan rujukannya | A2 | baca plan induk | M1 `[x]` merujuk file bukti |
| AC-A3 | Tes dan build tetap hijau | A1, A2 | `bun test`; `bun run build` | 427 pass 0 fail (dua run berturut-turut); build exit 0, SEO R1-R7 passed |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Install | `bun install --frozen-lockfile` | 0 | lockfile tidak berubah |
| Tests | `bun test` | 0 | 427 pass, 13 skip, 0 fail (dua run berturut-turut) |
| Heading gate | `bun run check:headings` | 0 | 0 violations |
| Build | `bun run build` | 0 | sitemap 788 URL, SEO R1-R7 passed |
| Plan | `bun ~/vivera/scripts/ultra-plan-runner.mjs <plan>` | 0 | `Validation: OK` |

Satu run `bun test` pertama di worktree ini melaporkan 1 kegagalan yang tidak muncul lagi pada dua run berikutnya. Nama tesnya tidak tertangkap karena log hanya menyimpan bagian ekor; kemungkinan besar tes waktu yang flaky (`test_parallel_performance_boost`, utang L7), tetapi belum terbukti.

## 5. Independent Review

- [x] Parent diff audit: hanya `db/seed.sql`, plan induk, plan tindak lanjut, file bukti, dan body PR ini yang berubah.
- [ ] Tidak ada reviewer independen: perubahan berupa data hasil generator dan dokumentasi sesi, tanpa kode.

**Reviewer verdict:** self-review, `correct`. Berubah menjadi `not correct` bila `bun test` atau `bun run build` gagal secara konsisten pada branch ini.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | `db/seed.sql` dipakai untuk bootstrap D1 baru; D1 produksi sudah diisi oleh seeder pada 2026-10-12 |
| Rollout | N/A: tidak ada deploy yang dipicu selain workflow deploy yang saat ini rusak |
| Health signal | `bun test` (termasuk `tests/scripts/pr-safety.test.ts` yang membaca seed) hijau |
| Rollback | `git revert` commit merge PR ini |
| Compatibility | N/A: skema tidak berubah |

## 7. Pre-Existing Issues and Deferred Debt

- Kegagalan tes sekali yang tidak teridentifikasi (lihat bagian 4). `defer: test-reliability session, digabung dengan L7 di plan induk`

## 8. Checklist

- [x] Branch dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada commit langsung ke base branch.
- [x] Tidak ada em dash, footer atribusi, atau baris co-author.
- [x] Tidak ada secret di diff.
- [x] PR body dikirim dengan `--body-file`.
