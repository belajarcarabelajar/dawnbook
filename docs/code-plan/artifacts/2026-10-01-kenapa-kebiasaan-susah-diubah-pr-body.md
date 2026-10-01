# Pull Request: feat(books): add Kenapa Kebiasaan Susah Diubah? (12 modul)

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-kenapa-kebiasaan-susah-diubah` (pr-registry claim) |
| Plan | `docs/code-plan/plans/2026-10-01-dawnbook-kenapa-kebiasaan-susah-diubah.md` |
| Base branch | `main` |
| Head branch | `ai/2026-10-01-dawnbook-kenapa-kebiasaan-susah-diubah/dawnbook-kenapa-kebiasaan-susah-diubah` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-kenapa-kebiasaan-susah-diubah` |
| Type of change | feature (buku baru) |
| Reviewer | none requested |

## 2. What This Changes

Menambahkan buku Dawnbook baru "Kenapa Kebiasaan Susah Diubah?" karya Kania Salsabila: 11 modul isi plus 1 bab Referensi, membahas sains kebiasaan dari loop cue-routine-reward, basal ganglia dan dopamin, gap niat-perilaku, mitos 21 hari vs riset Lally 2010, sifat jejak kebiasaan yang tidak terhapus, kekuatan konteks, fresh start effect, friction, habit reversal, sampai identity-based habits. Semua klaim faktual bersumber dari 16 referensi yang diverifikasi langsung pada 2026-10-01 (PDF primer, abstrak resmi, dan metadata Crossref, terdokumentasi di `docs/code-plan/plans/research-kenapa-kebiasaan-susah-diubah.md`). Juga menambahkan entri timestamp `release-dates.json` untuk slug baru.

**Non-goals:** tidak mengubah template, tema, skrip build, buku lain, atau infrastruktur; tidak men-deploy; tidak melakukan seeding D1 (dilakukan pasca-merge sesuai kebijakan deploy).

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Buku terscaffold mengikuti `_template`, authors = Kania Salsabila | C1 | `grep authors book.toml` | `authors = ["Kania Salsabila"]`, `subject_label = "Psikologi"`, `language = "id"` |
| AC-2 | Deskripsi SEO 100-160 karakter | C1 | python3 `len()` | 135 karakter |
| AC-3 | SUMMARY.md berisi 12 entri dan nama file cocok dengan file di disk | C1 | `grep -c '^- \['` + paste judul | 12 entri, judul bab = heading file, 12 halaman HTML |
| AC-4 | Setiap bab menutup dengan section `## ` berjudul unik antar bab (anti-template R21) | C2-C13 | `grep -h '^## ' content/*.md \| sort \| uniq -d` | kosong (tidak ada duplikat) |
| AC-5 | 0 em-dash/en-dash, 0 emoji di konten, 0 kata "Anda" | V2 | grep karakter em-dash dan en-dash, grep emoji (kelas unicode), grep kata "Anda" | BERSIH untuk ketiganya; emoji hanya di `icon.txt` |
| AC-6 | Referensi 16 entri, semuanya hyperlink deep-link/DOI, tanpa URL generik | C13 | `grep -c '](http' 12_referensi.md` | 16 hyperlink, 13 DOI langsung |
| AC-7 | Meta description: index memakai deskripsi book.toml, bab memakai kalimat pembuka utuh (R26) | V3 | grep output final | index 135 char; bab 1 dan 12 memakai kalimat pembuka; bab 5 terpotong bersih di batas kata dengan `...` |
| AC-8 | Build situs penuh hijau | V3 | `bun run build` | exit 0, "SEO Validation passed! All rules (R1-R7) satisfied", sitemap 748 URL |

## 4. Local Verification Evidence

Semua dijalankan di worktree sesi, pada mesin yang memegang working tree; tidak ada runner remote yang diminta memverifikasi apa pun.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Sync template | `bun run scripts/sync-template.ts` | 0 | semua book.toml sinkron dengan master template |
| Build buku | `mdbook build books/kenapa-kebiasaan-susah-diubah` | 0 | 12 halaman HTML |
| Build situs | `bun run build` | 0 | 687 chapters, hub generated, SEO R1-R7 passed |
| Verifikasi konten | grep heading/dash/emoji/Anda + baca line-by-line 12 bab | 0 temuan | 1 temuan (inkonsistensi desimal) diperbaiki di PR ini |

## 5. Independent Review

- [x] Self-review terdokumentasi: 12 bab dibaca ulang line-by-line oleh parent (bukan subagent), kontrak setiap chunk diverifikasi ulang lewat diff, klaim sukses subagent diverifikasi dengan `wc -c` dan grep, bukan dipercaya mentah.
- [x] Parent diff audit: `git status --short` hanya memuat `books/kenapa-kebiasaan-susah-diubah/`, `release-dates.json`, dan 2 file plan di `docs/code-plan/plans/`; staging dilakukan per path eksplisit.
- [x] Temuan yang memenuhi kualifikasi: (1) entri `release-dates.json` awalnya objek `{pinnedMs}` sedangkan `scripts/builder/metadata.ts` hanya menerima `typeof number`, diperbaiki menjadi angka polos; (2) pemisah desimal tidak konsisten antar bab (titik vs koma), dinormalisasi ke koma PUEBI.

**Reviewer verdict:** `correct`. Semua acceptance criteria terpenuhi dengan bukti perintah dan exit code; temuan yang ditemukan sudah diperbaiki di dalam PR ini. Verdict berubah menjadi `not correct` bila build `bun run build` gagal di tree final atau ditemukan temuan P0/P1 baru pada diff.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Buku baru bersifat aditif; satu perubahan pada file bersama (`release-dates.json`) hanya menambah satu kunci. Hub memuat buku baru otomatis via `manifest.json`. |
| Rollout | Default (build pipeline yang sama dengan buku lain). Seeding D1 konten via `scripts/migrate-to-d1.ts` dilakukan pasca-merge sesuai Rule 19. |
| Health signal | Hub menampilkan kartu buku dengan progress bar; `/api/progress` tetap agnostik slug sehingga pelacakan aktif otomatis. |
| Rollback | `git revert <merge commit>` pada main; buku hilang dari manifest pada build berikutnya. |
| Compatibility | Tidak ada konsumen yang berubah; `release-dates.json` kompatibel (angka polos seperti entri lain). |

## 7. Pre-Existing Issues and Deferred Debt

- `scripts/builder/metadata.ts:110` hanya menerima nilai `number` dari `release-dates.json`, sementara dokumentasi AGENTS.md menyebut format `pinnedMs` (objek); format keduanya berbeda dan bisa membingungkan penulis buku berikutnya. `defer: 1 iterasi plan, upgrade-trigger: ketika ada buku baru lagi yang salah memasukkan objek`
- Preprocessor opsional `mdbook-dawnbook` tidak terpasang di lingkungan build lokal (warning non-fatal, build tetap exit 0). `defer: 1 sesi, upgrade-trigger: ketika fitur preprocessor dibutuhkan oleh buku`
- Bab 5 meta description terpotong di 155 karakter dengan `...` (lead kalimat buku memang panjang); sudah sesuai aturan word-boundary R26. `defer: tidak, upgrade-trigger: tidak ada`

## 8. Checklist

- [x] Branch dan worktree berasal dari `pr-registry claim`, bukan dari ingatan.
- [x] Tidak ada commit langsung ke base branch.
- [x] Judul imperatif dan body dalam bahasa codebase (Indonesia).
- [x] Tidak ada em dash di body, pesan commit, atau string user-visible di diff.
- [x] Tidak ada rahasia, token, isi `.env`, atau pembersihan tak terkait di diff.
- [x] Setiap acceptance criteria dipetakan ke check dan evidence.
- [x] Body PR ditulis ke file dan diposting dengan `--body-file`.
- [x] Terdaftar di registry: `bun scripts/pr-registry.mjs pr <session> --number <N>` (dilakukan setelah PR dibuat).
