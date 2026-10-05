# Review Report: PR #126 belajarcarabelajar/dawnbook

Tanggal review: 2026-10-02. Reviewer: parent session (orkestrator), fan-out 6 subagent reviewer (RV1-RV6, scope disjoint, read-only). Skill path: `/home/belajarcarabelajar/ai-skills/Super Ultra Code Plan Implementation.md` (file pertama pada chain fallback). Permintaan menyebut placeholder `<n>`/`<owner/repo>`; review diarahkan ke PR #126 milik sesi ini dan keberadaannya diverifikasi sebelum analisis.

## 1. Delivery Metadata

| Field | Value |
|---|---|
| PR | #126 `feat(books): add Kenapa Kebiasaan Susah Diubah? (12 modul)` |
| Base / Head | `main` / `ai/2026-10-01-dawnbook-kenapa-kebiasaan-susah-diubah/dawnbook-kenapa-kebiasaan-susah-diubah` |
| Author | `belajarcarabelajar` (commit sesi oleh `kaniasalsabila639-ops` = Kania Salsabila) |
| State saat review | **MERGED** 2026-10-01T17:09:58Z, merge commit `6af9f6496e767f69811a4bb09888502f5da5f499` |
| Tindakan merge | TIDAK dilakukan; PR sudah merge (terminal). AUTO-MERGE tidak diminta pada permintaan ini |

## 2. Input yang Difetch dan Direkam

| Input | Perintah | Exit | Hasil |
|---|---|---|---|
| Metadata PR | `gh pr view 126 --json number,title,author,baseRefName,headRefName,commits,reviews,reviewDecision,mergeable,mergeStateStatus` | 0 | 6 commit, 0 review, base main; mergeable/mergeStateStatus `UNKNOWN` (sifat PR merged) |
| Diff | `gh pr diff 126` | 0 | 4.672 baris, 45+ file |
| Commit list | `gh pr view 126 --json commits` | 0 | f562123, 30602cc, 5f94c4d (legacy Iwan), 227eb3a, 117de46, 7b83e5d (sesi Kania) |
| CI checks | `gh pr checks 126` | 0 | 1 check `test` = pass 18s (run 36897249724). Dilaporkan sebagai evidence penulis, TIDAK diadopsi sebagai verifikasi reviewer |
| Review comments / prior verdicts | `gh pr view 126 --json reviews,comments` | 0 | 0 review, 1 comment (body PR). Tidak ada prior verdict |
| isi check `test` | baca `.github/workflows/test.yml` | - | `bun run build` (termasuk check-seo.ts) + `bun test` + `check-d1-rate-limit.ts` |
| Registry | `bun scripts/pr-registry.mjs status` | 0 | sesi `dawnbook-kenapa-kebiasaan-susah-diubah` state `merged` PR #126 |
| Konten 12 bab | dibaca line-by-line (mandat AGENTS.md Rule 9/16, sesi penulis) + audit RV2 | - | lihat section 3 |

## 3. Coverage (9 kategori)

| Kategori | Verdict | Bukti ringkas |
|---|---|---|
| Functionality | PASS | RV1: 12 halaman HTML; index meta = deskripsi book.toml (136 char); meta bab 01/12 = kalimat pembuka (Rule 8); manifest.json 12 chapter; kartu hub `data-created-at=1790872339899`, penulis, timestamp PUEBI; sitemap 13 URL buku (748 total); semua `<title>` terisi |
| Test reversal | FINDING F2 (P3) | RV4: mekanisme reversal terkonfirmasi (revert menghasilkan built-stats 675/8, manifest tanpa buku, generator: template-engine.ts); TAPI tidak ada unit test yang mem-pin nilai builder atau parsing pinnedMs, sehingga check `test` remote tetap HIJAU setelah revert. Ini temuan, bukan netral |
| Scope | FINDING F1 (P3) | RV3: diff membawa 22 file di luar buku baru: 21 dari 3 commit legacy sesi sebelumnya (buku pengaruh-uang, db/seed.sql, plan/research docs; sudah terdisclosure di PR body dan merge evidence) + `scripts/builder/metadata.ts` pada 7b83e5d (perubahan pinnedMs, terpre-otorisasi user pada debt sweep multi-select, tercatat di backlog plan FU-2) |
| Security | PASS | RV3: scan token/api_key/secret/password/gho_/sk- di seluruh diff: nol kecocokan nyata (semua false positive: komentar CSS "design tokens", kata "task-", teks checklist); tanpa file .env/kredensial |
| Compatibility | PASS | RV5: parser metadata.ts baru aman untuk 7 edge case (null/0/negatif/object tanpa pinnedMs/bukan-number/array/string, semua fallback ke git, tanpa crash); satu-satunya konsumen runtime release-dates.json adalah metadata.ts (5 konsumen lain hanya string/docs) |
| Data & migration | PASS + FINDING F3 (P3) | RV5: baris D1 ada (subject_label Psikologi, 91.305 byte vs lokal 90.673, selisih +0,7% wajar, view_count 0). F3: `db/seed.sql` di git BELUM memuat slug baru (regenerasi lokalnya ada sebagai perubahan uncommitted `M db/seed.sql` di checkout main); kanonis seeding adalah migrate-to-d1.ts (Rule 19), jadi tidak memblokir |
| Observability | N/A | Buku konten tanpa surface runtime; progress tracking tetap agnostik slug (tidak disentuh) |
| Documentation | PASS | RV6: plan status `Complete`, checklist T0..V3 berbukti, backlog FU-1..FU-4 terisi; research notes 16 referensi dengan DOI valid dan tahun konsisten internal; klaim lintas dokumen (135 char, 16 hyperlink, 13 DOI, F-1/F-2 diperbaiki) terverifikasi ulang |
| Artifacts | FINDING F4 (P3) | RV6: `docs/code-plan/artifacts/` di main hanya memuat pr-body dan review-report (commit 117de46); `...-merge-evidence.md` ada dan lengkap di worktree sesi tetapi tidak pernah ter-commit ke main |

## 4. Findings (kualifikasi 8-kriteria, semua non-blocking)

| ID | P | Confidence | Anchor (baris yang disentuh diff) | Temuan | Disposisi |
|---|---|---|---|---|---|
| F1 | P3 | 0.85 | daftar file diff (commit legacy f562123/30602cc/5f94c4d + 7b83e5d menyentuh `scripts/builder/metadata.ts`) | PR membawa 3 commit legacy sesi sebelumnya dan 1 file kode platform di luar jalur buku | Terdisclosure dan terpre-otorisasi (debt sweep); dicatat agar merge order masa depan tidak mengulang pola ini |
| F2 | P3 | 0.9 | `scripts/builder/metadata.ts:107-118` (disentuh 7b83e5d); `tests/scripts/builder-metadata.test.ts` (tidak menyentuh, absennya itulah temuan) | Tidak ada unit test untuk parsing pinnedMs maupun pin nilai built-stats; revert tetap membuat CI hijau | Backlog: tambahkan kasus pinnedMs ke builder-metadata.test.ts. `defer: 1 sesi, upgrade-trigger: perubahan berikutnya pada metadata.ts` |
| F3 | P3 | 0.95 | konsekuensi merge `6af9f64` terhadap `db/seed.sql` (file disentuh PR hanya oleh commit legacy; absen pembaruan untuk buku baru itulah temuan) | seed.sql di git tertinggal dari D1 produksi; regenerasi lokal uncommitted di checkout main | Backlog: commit `chore(db): regenerate seed.sql` mengikuti pola 5f94c4d pada PR berikutnya. `defer: PR berikutnya, upgrade-trigger: fresh clone yang men-seed dari seed.sql` |
| F4 | P3 | 0.9 | `docs/code-plan/artifacts/` (disentuh 117de46, hanya 2 dari 3 file) | merge-evidence.md tidak ter-commit ke main; hanya ada di worktree sesi | Backlog: commit artifact ketiga. `defer: PR berikutnya, upgrade-trigger: rotasi worktree yang menghapus salinannya` |

Tidak ada temuan P0/P1. Temuan kandidat yang ditolak setelah verifikasi: (a) rumusan "mengendalikan sekitar 43 persen" di bab 11 (RV2) tetap berkualifikasi "sekitar" + atribusi studi, tidak menyimpang dari notes; (b) meta description bab 1 tanpa titik akhir (RV1) tetap sentence-intact dan sesuai R26.

## 5. Pre-Existing Debt (di luar diff, dengan defer)

- `books/_template/theme/head.hbs` (tidak disentuh): workflow test.yml memasang mdbook dua kali (langkah duplikat). `defer: 1 sesi, upgrade-trigger: perubahan workflow berikutnya`
- Standalone `tsc --noEmit` tidak berlaku di repo (tanpa script typecheck/@types/node). `defer: tidak, upgrade-trigger: jika repo menambahkan script typecheck`
- Checkbox V4/V5 pada plan masih `[ ]` (staleness dokumen pasca-merge). `defer: PR berikutnya, upgrade-trigger: audit plan lifecycle berikutnya`

## 6. Verdict

**`correct`.**

Derivasi: nol temuan P0/P1; empat temuan P3 semuanya non-blocking dengan disposisi backlog dan defer. Verdict berubah menjadi `not correct` jika salah satu kondisi checkable ini terpenuhi: (1) ditemukan klaim faktual di buku yang tidak bisa dilacak ke `research-kenapa-kebiasaan-susah-diubah.md` (sitasi karangan); (2) ditemukan nilai rahasia nyata di diff; (3) ditemukan jalur crash atau kehilangan data pada parser `metadata.ts` atau baris D1 buku ini; (4) build `bun run build` gagal di main (exit != 0 atau SEO R1-R7 gagal).

## 7. Evidence Utama (parent, exit code)

- `gh pr view 126 ...` exit 0; `gh pr diff 126` exit 0 (4.672 baris); `gh pr checks 126` exit 0 (`test` pass, evidence penulis)
- `gh auth status` exit 0 sebelum semua perintah gh
- RV1: 12 html, meta/index/bab/sitemap/title semua PASS (6/6)
- RV2: 6/6 PASS (0 Anda, 0 dash, 0 emoji di konten, heading unik, 16 hyperlink/13 DOI, traceability angka 6/6 cocok)
- RV3: rahasia 0; identitas/trailer 3 commit sesi sesuai aturan (Kania + trailer Iwan); file list diverifikasi parent
- RV4: reversal mechanism terkonfirmasi; workflow test.yml dibaca; temuan test-gap eksplisit (F2)
- RV5: metadata.ts edge cases 7/7 aman; konsumen release-dates tunggal; D1 row terverifikasi via `cf d1 query` (read-only)
- RV6: plan Complete, artifacts konsisten; temuan F4
- Parent diff audit: daftar file, hunk `metadata.ts`, entri `release-dates.json`, dan `git status` (`M db/seed.sql`) diverifikasi ulang langsung oleh parent

## 8. Tindakan yang TIDAK Dilakukan (sesuai batas permintaan)

- Tidak mem-post komentar review ke GitHub (posting menunggu human gate; PR sudah merged sehingga komentar review post-hoc hanya tersedia bila diminta)
- Tidak melakukan merge (PR sudah MERGED; terminal; AUTO-MERGE tidak diminta)
- Tidak mengimplementasikan fix untuk F1-F4; tidak push; tidak membuka PR baru
- Laporan ini disimpan sebagai file (untracked) di `docs/code-plan/artifacts/2026-10-02-dawnbook-pr126-review-report.md`; pemeriksaan F3/F4 (commit seed.sql dan merge-evidence) adalah perubahan pada main dan dengan sengaja tidak dieksekusi di sesi review ini
