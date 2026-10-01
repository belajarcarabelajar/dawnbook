# Review Report Internal: PR #126 feat(books): add Kenapa Kebiasaan Susah Diubah? (12 modul)

Tanggal review: 2026-10-01. Reviewer: parent session (self-review terdokumentasi, review independen eksternal tidak diminta).

## 1. Input yang Difetch dan Direkam

| Input | Status | Catatan |
|---|---|---|
| Metadata PR (`gh pr view 126`) | Diconsult | PR #126, base main, head ai/2026-10-01-dawnbook-kenapa-kebiasaan-susah-diubah/dawnbook-kenapa-kebiasaan-susah-diubah, state open |
| Diff (`git diff`/`git status` worktree) | Diconsult | 24 file, 1386 insertions; hanya books/kenapa-kebiasaan-susah-diubah/**, release-dates.json, functions/lib/built-stats.ts, 2 file plan |
| Commit | Diconsult | 227eb3a, author/committer Kania Salsabila, trailer Co-authored-by: Iwan Kurniawan ada |
| Review comments existing | Diconsult | belum ada (PR baru dibuka) |
| Prior verdicts | Not consulted, reason | tidak ada verdict sebelumnya untuk PR ini |
| Remote CI checks | Not consulted, reason | repo ini tidak memakai CI runner untuk verifikasi; verifikasi kebijakan repo adalah lokal |
| Konten 12 bab | Diconsult | dibaca line-by-line oleh AI (mandat AGENTS.md Rule 9/16) |

Remote CI status (jika ada) dilaporkan sebagai evidence penulis, tidak diadopsi sebagai verifikasi reviewer.

## 2. Coverage

| Kategori | Jawaban | Alasan/Bukti |
|---|---|---|
| Functionality | Lolos | Buku terbentuk utuh: 12 halaman HTML, meta description sesuai tipe halaman, hub menampilkan kartu buku (manifest auto). |
| Test reversal | Lolos dengan catatan | Tidak ada test unit yang merah bila PR di-revert karena deliverable adalah konten; reversal terlihat pada `bun run build` (jumlah chapter 687 turun ke 675, kartu buku hilang dari manifest) dan `grep -c '^- \[' SUMMARY.md` = 0. Reversal check eksplisit ini adalah bukti, bukan netralitas. |
| Scope | Lolos | Tidak ada file di luar jalur yang diizinkan plan. `functions/lib/built-stats.ts` adalah file auto-generated yang ter-track dan berubah sebagai konsekuensi build (675 ke 687 chapter, buku Kania 8 ke 9). |
| Security | N/A | Tidak ada perubahan gating, middleware, kredensial, atau endpoint. |
| Compatibility | Lolos | `release-dates.json` entri baru berupa angka polos sesuai konsumen `metadata.ts` (typeof number). Tidak ada konsumen lain yang berubah. |
| Data & migration | N/A | Tidak ada skema DB yang disentuh; seeding D1 konten adalah langkah pasca-merge yang terdokumentasi di Non-goals. |
| Observability | N/A | Buku konten tidak punya surface observability; progress tracking tetap agnostik slug. |
| Documentation | Lolos | Plan + research notes + artifacts ter-commit; deskripsi book.toml 135 karakter. |
| Artifacts | Lolos | PR body dan review report disimpan sebagai .md di docs/code-plan/artifacts/. |

## 3. Temuan (8-point qualification filter)

| ID | Severity | Confidence | Lokasi (baris yang disentuh diff) | Temuan | Status |
|---|---|---|---|---|---|
| F-1 | P2 | 0.9 | release-dates.json (entri baru) | Entri awal ditulis sebagai objek `{pinnedMs}` sedangkan `scripts/builder/metadata.ts:110` hanya menerima `typeof number`; timestamp akan diabaikan dan jatuh ke fallback git. | Diperbaiki di PR (angka polos 1790872339899) |
| F-2 | P3 | 0.85 | content/04, 09, 10 (angka statistik) | Pemisah desimal tidak konsisten: bab 4/9 memakai titik (0.66, 0.36, 0.65), bab 10 memakai koma (0,65), bertentangan dengan PUEBI dan gaya buku lain. | Diperbaiki di PR (dinormalisasi ke koma) |
| F-3 | P3 | 0.7 | content/05 (meta description) | Lead kalimat bab 5 panjang sehingga meta description terpotong di 155 karakter dengan "..." pada batas kata. Sesuai aturan R26 (word-boundary), bukan pelanggaran; dicatat agar tidak dianggap bug. | Diterima sebagai sesuai aturan |

Tidak ada temuan P0/P1. Tidak ada emoji, em-dash, "Anda", heading duplikat, atau sitasi yang tidak bisa dilacak ke research notes.

## 4. Verdict

**correct.** Tidak ada temuan P0/P1; dua temuan P2/P3 sudah diperbaiki di dalam PR ini; satu catatan P3 diterima karena sesuai aturan. Verdict berubah menjadi `not correct` jika `bun run build` gagal di tree final (exit != 0 atau SEO validation merah) atau ditemukan temuan P0/P1 baru pada diff, misalnya klaim faktual di bab yang tidak ada di research notes.
