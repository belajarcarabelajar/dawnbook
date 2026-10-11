# Pull Request: Pasang detektor colon ke build, perluas cakupannya, dan tutup utang tes serta emoji

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-heading-guard-followups` |
| Plan | `docs/code-plan/plans/2026-10-11-dawnbook-heading-colon-cleanup.md` (utang yang dipilih pemilik pada penutupan sesi) |
| Base branch | `main` |
| Head branch | `2026-10-11-dawnbook-heading-guard-followups/dawnbook-heading-guard-followups` |
| Worktree | `../dawnbook-wt/dawnbook-heading-guard-followups` |
| Type of change | feature (gerbang build), test fix, chore (konten) |
| Reviewer | tidak ada yang diminta; review independen oleh agen peninjau, lihat bagian 5 |

## 2. What This Changes

Empat utang yang tercatat setelah PR #134 ditutup. (1) `bun run build` kini menjalankan detektor colon sebelum membuat sitemap dan gagal dengan exit 1 bila ada heading bercolon, sehingga `scripts/deploy-website.sh` ikut terjaga; penggaris mutu judul pindah dari skrip lokal ke `scripts/measure-heading-quality.ts` sebagai alat dev, dan ada skrip `check:headings`. (2) Detektor kini juga memindai heading setext, heading `<h1>` sampai `<h6>` satu baris, dan colon fullwidth (U+FF1A), serta memakai aturan matematika ala Pandoc sehingga `Harga $5: murah dan $10` tidak lagi lolos. (3) Lima berkas tes API yang memakai `mock.module` untuk `functions/lib/auth` kini memulihkan modul asli di `afterAll`; sebelumnya mock bocor dan membuat tes auth gagal dalam rangkaian penuh `bun test`. (4) Karakter U+FE0F sisa emoji dibuang dari empat heading (`bias-kognitif` bab 03 dan 09, `menemukan-tujuan-hidup-ikigai` bab 08); `GEMINI.md` bagian 24 diperbarui.

**Non-goals:** tidak mengubah isi buku selain empat baris heading; tidak memperluas `--diff-guard`; tidak menyentuh `db/seed*.sql` (sudah dibahas di PR #135); tidak memasang penggaris mutu ke build.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Build gagal bila ada heading bercolon dan lolos bila bersih | F1 | `bun test tests/scripts/heading-gate.test.ts`; `bun run build` | 2 lulus (RED awal exit 1); build exit 0 dengan langkah "Checking heading colons..." |
| AC-2 | Penggaris mutu ada di repo dan lulus pada data nyata | F1 | `bun test tests/scripts/measure-heading-quality.test.ts`; `bun run scripts/measure-heading-quality.ts metakognisi --base <komit sebelum pembersihan>` | 7 lulus; 49 heading, `RULER: PASS` |
| AC-3 | Detektor menutup empat celah tanpa false positive di 56 buku | F4 | `bun test tests/scripts/check-heading-colons.test.ts`; `bun run scripts/check-heading-colons.ts` | 72 lulus (52 lama tidak berubah, 20 baru, RED awal 11 gagal); exit 0, 0 pelanggaran, 1 dikecualikan |
| AC-4 | `bun test` penuh hijau | F2 | `bun test` setelah `bun run build` | 415 lulus, 13 dilewati, 0 gagal, exit 0 |
| AC-5 | Tidak ada U+FE0F atau U+200D pada heading buku | F3 | `rg -n -P '\x{FE0F}\|\x{200D}' books/*/src/content/*.md books/*/src/SUMMARY.md` | kosong (exit 1) |
| AC-6 | Tiga guard terhadap `origin/main` tetap hijau | F1-F4 | `--diff-guard`, `--parity-base`, `--dup-guard` | ketiganya exit 0 |

## 4. Local Verification Evidence

> Semua baris dihasilkan di mesin yang memegang working tree, sebelum cabang di-push.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Build | `export PATH=$HOME/.cargo/bin:$PATH; bun run build` | 0 | selesai, validasi SEO R1-R7 lolos |
| Seluruh tes | `bun test` | 0 | 415 lulus, 13 dilewati, 0 gagal |
| Tes skrip | `bun test tests/scripts` | 0 | 193 lulus, 0 gagal (pemeriksaan peninjau) |
| Detektor penuh | `bun run scripts/check-heading-colons.ts` | 0 | 0 pelanggaran, 56 buku, 1 dikecualikan |
| Self-test | `bun run scripts/check-heading-colons.ts --self-test` | 0 | `self-test ok` |
| Guard | `... --diff-guard`, `--parity-base`, `--dup-guard` (`origin/main`) | 0 | ketiganya ok |

## 5. Independent Review

- [x] Peninjau yang tidak menulis perubahan menjalankan sendiri build, tes penuh, 33 kasus uji adversarial untuk detektor, dan bisect pemulihan mock.
- [x] Audit diff oleh parent: tiap hasil agen dijalankan ulang sendiri sebelum komit; komit per potongan dengan jalur eksplisit.
- [x] Temuan [P3] (confidence rendah) dicatat di bagian 7.

**Reviewer verdict:** `correct`. Tidak ada temuan P0 sampai P2. Verdict berubah menjadi `not correct` bila ditemukan heading bercolon nyata yang tidak ditandai gerbang.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | `bun run build` dan deploy kini gagal bila ada heading bercolon, termasuk dari kontributor lain; tidak ada perubahan perilaku runtime situs. |
| Rollout | Default: merge ke `main`. |
| Health signal | `bun run build` tetap exit 0 di `main` setelah merge. |
| Rollback | `git revert -m 1 <commit merge>`; atau cabut satu blok panggilan di `scripts/build.ts` bila gerbang menghalangi darurat. |
| Compatibility | Judul yang dulu lolos (setext, `<hN>`, `$5: ...`) kini ditandai; tidak ada contoh seperti itu di 56 buku saat ini. |

## 7. Pre-Existing Issues and Deferred Debt

- `scripts/heading-gate.ts:6-14`: gerbang lolos bila akar tidak memuat buku (0 buku dipindai). Tidak terjangkau pada build normal. `defer: satu sesi kecil, pemicu: gerbang dipakai di luar build`
- `--diff-guard` hanya mengizinkan perubahan pada heading ATX, entri SUMMARY, dan baris `title`; memperbaiki heading setext atau `<hN>` kelak memerlukan `--allow-body`. `defer: satu sesi kecil, pemicu: ada heading setext atau <hN> bercolon yang perlu diperbaiki`
- Setext di dalam blockquote atau daftar, heading `<hN>` multi-baris, dan entitas HTML colon tidak dipindai. `defer: satu sesi kecil, pemicu: contoh nyata ditemukan`
- Matematika dengan spasi (`$ x: y $`) tidak lagi dianggap matematika; build mengubahnya menjadi `\( ... \)`, jadi heading seperti itu akan ditandai. Tidak ada contoh di repo. `defer: satu sesi kecil, pemicu: contoh nyata ditemukan`
- Sisa utang dari PR #134 (pola ` vs. ` dan ` - `, label perancah bebas colon, `db/seed_N.sql` lama, label tebal berpola `Label: ...`) tetap berlaku.

## 8. Checklist

- [x] Cabang dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada komit langsung ke `main`.
- [x] Judul imperatif, isi dalam bahasa basis kode.
- [x] Tidak ada em dash, footer atribusi, atau baris co-author.
- [x] Tidak ada rahasia atau isi `.env` pada diff.
- [x] Setiap kriteria penerimaan terpetakan ke pemeriksaan dan bukti.
- [ ] Terdaftar di registry: `bun scripts/pr-registry.mjs pr dawnbook-heading-guard-followups --number <N>` (setelah PR dibuka).
