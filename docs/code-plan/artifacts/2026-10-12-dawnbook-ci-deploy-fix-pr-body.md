# Pull Request: Perbaiki workflow Deploy Dawnbook dengan wrangler-action

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-ci-deploy-fix` (bergantung pada `dawnbook-seed-after-x-book`, PR #141 sudah merge) |
| Plan | `docs/code-plan/plans/2026-10-12-dawnbook-x-book-followups.md` (tugas B1) |
| Base branch | `main` |
| Head branch | `2026-10-12-dawnbook-x-book-followups/dawnbook-ci-deploy-fix` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-ci-deploy-fix` |
| Type of change | bug fix (CI) |
| Reviewer | none requested |

## 2. What This Changes

Setiap push ke `main` membuat workflow `Deploy Dawnbook` gagal di langkah "Set up job" karena action `cloudflare/pages-action` tidak bisa di-resolve lagi (repositori itu kini 404; run 38213664148 dan 38259515450). Langkah deploy diganti dengan `cloudflare/wrangler-action@v4` yang menjalankan perintah yang sama dengan `scripts/deploy-website.sh`: `pages deploy output --project-name=dawnbook --branch=main --commit-dirty=true`, memakai secret `CLOUDFLARE_API_TOKEN` dan `CLOUDFLARE_ACCOUNT_ID` yang sudah ada. Plan tindak lanjut ditutup `Complete` di PR ini.

**Non-goals:** tidak menambah migrasi D1, seed, atau reindex GSC ke CI; langkah build tidak berubah.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-B1 | Workflow tidak lagi memakai `cloudflare/pages-action` dan menjalankan perintah deploy yang sama dengan skrip lokal | B1 | baca diff; `scripts/deploy-website.sh:34` | 3 baris berubah, flag identik |
| AC-B2 | YAML valid dan action pengganti ada di upstream | B1 | `Bun.YAML.parse`; `gh api repos/cloudflare/wrangler-action/git/ref/tags/v4` | exit 0, 6 langkah; tag v4 ada (rilis terbaru v4.1.3, 2026-09-24) |
| AC-B3 | Secret yang dibutuhkan tersedia | B1 | `gh secret list` (nama saja) | CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Workflow parse | `bun -e 'Bun.YAML.parse(...)'` | 0 | 6 langkah, `uses: cloudflare/wrangler-action@v4` |
| Plan | `bun ~/vivera/scripts/ultra-plan-runner.mjs <plan>` | 0 | `Validation: OK`, status Complete |

Workflow ini hanya berjalan pada push ke `main`, jadi bukti nyatanya adalah run pertama setelah merge. `actionlint` tidak terpasang di mesin ini.

## 5. Independent Review

- [x] Parent diff audit: hanya `.github/workflows/deploy.yml`, plan tindak lanjut, dan body PR ini yang berubah.
- [ ] Tidak ada reviewer independen: perubahan tiga baris konfigurasi CI.

**Reviewer verdict:** self-review, `correct`. Berubah menjadi `not correct` bila run `Deploy Dawnbook` pertama di `main` setelah merge gagal di langkah deploy.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Deploy produksi otomatis aktif kembali: setiap push ke `main` akan mem-publish `output/` ke Pages project `dawnbook` |
| Rollout | Merge PR ini memicu run pertama, yang mem-publish isi `main` yang sama dengan deployment manual `b9b0b08f` ditambah PR #141 (tanpa perubahan konten) |
| Health signal | Run `Deploy Dawnbook` di `main` sukses dan URL buku tetap 200 |
| Rollback | `git revert` commit merge PR ini (workflow kembali gagal tanpa deploy); deployment Pages sebelumnya bisa dipulihkan dari dashboard |
| Compatibility | N/A |

## 7. Pre-Existing Issues and Deferred Debt

- CI memasang mdBook v0.5.3 sedangkan mesin lokal v0.5.4. `defer: sesi toolchain, saat output CI dan lokal terlihat berbeda`

## 8. Checklist

- [x] Branch dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada commit langsung ke base branch.
- [x] Tidak ada em dash, footer atribusi, atau baris co-author.
- [x] Tidak ada nilai secret di diff (hanya nama).
- [x] PR body dikirim dengan `--body-file`.
