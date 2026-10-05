# Pull Request: add Psikologi di Balik Keputusan Finansial Kita? (12 modul)

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-psikologi-di-balik-keputusan-finansial-kita` |
| Plan | `docs/code-plan/plans/2026-10-06-dawnbook-psikologi-di-balik-keputusan-finansial-kita.md` |
| Base branch | `main` |
| Head branch | `2026-10-06-dawnbook-psikologi-di-balik-keputusan-finansial-kita/dawnbook-psikologi-di-balik-keputusan-finansial-kita` |
| Worktree | `/home/belajarcarabelajar/Proyek/dawnbook-wt/dawnbook-psikologi-di-balik-keputusan-finansial-kita` |
| Type of change | feature (buku baru) |
| Reviewer | none requested |

## 2. What This Changes

Menambahkan buku ke-49 Dawnbook, `books/psikologi-di-balik-keputusan-finansial-kita/`, berjudul "Psikologi di Balik Keputusan Finansial Kita?" karya Kania Salsabila: 12 modul konten plus bab Referensi (13 entri SUMMARY), subject label Psikologi, ikon cover 💳, dan pin tanggal rilis di `release-dates.json`. Materi disusun dari riset ke 27 sumber primer yang diverifikasi 2026-10-06 (dokumentasi di `docs/code-plan/plans/research-psikologi-di-balik-keputusan-finansial-kita.md`), mencakup teori prospek, akuntansi mental, rasa sakit membayar, bias masa kini, disposition effect, efek jangkar, kelebihan percaya diri, informational cascade, bias status quo, dan desain pertahanan finansial. Dua sumber salah metadata terdeteksi dan dikoreksi saat riset (DOI Feinberg 1986 dan jurnal Raghubir & Srivastava 2008); satu studi terkenal ter-retrak 2026 (Ariely & Wertenbroch 2002) sengaja tidak dipakai dan digantikan Ashraf, Karlan & Yin (2006).

**Non-goals:** PR ini tidak menyentuh aplikasi Hub/Admin, fungsi Cloudflare, atau buku lain; seeding D1 (`scripts/migrate-to-d1.ts`) dijalankan pasca-merge dengan kredensial yang tidak tersimpan di repo (deferred follow-up).

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | 13 file bab di `src/content/` dengan nama zero-padded kebab-case | C2-C14 | `ls books/psikologi-di-balik-keputusan-finansial-kita/src/content/` | 13 file, pola `NN_slug.md` |
| AC-2 | 0 "Anda", 0 em-dash, 0 emoji (kecuali icon.txt) di semua bab | V2 | `grep -c 'Anda' *.md; grep -c '—' *.md; grep -cP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' *.md` | semua 0 |
| AC-3 | Judul section penutup unik antar bab (anti-template Rule 21) | V2 | `grep -h '^## ' *.md \| sort \| uniq -d` | output kosong |
| AC-4 | Ukuran bab 6.000-9.000 byte | C2-C14 | `wc -c *.md` | semua dalam rentang |
| AC-5 | `bun run scripts/sync-template.ts` exit 0 tanpa diff liar | V3 | `bun run scripts/sync-template.ts` | exit 0 |
| AC-6 | `bun run build` exit 0 dengan SEO Validation passed | V3 | `bun run build` | exit 0 |

## 4. Local Verification Evidence

| Gate | Command | Exit | Result |
|---|---|---|---|
| Ukuran bab | `wc -c *.md` (13 file) | 0 | 6.544-9.051 byte per bab, total 103.455 |
| Heading unik | `grep -h '^## ' *.md \| sort \| uniq -d` | 0 | output kosong (12 judul penutup + Referensi semuanya unik) |
| Konten bersih | `grep -c 'Anda' *.md; grep -c '—' *.md; grep -cP '[emoji]' *.md` | 0 | semua 0 di 13 bab, book.toml, SUMMARY |
| Meta description | ekstraksi dari HTML hasil build | 0 | index memakai deskripsi book.toml (134 char); bab memakai kalimat pembuka (137-159 char) |
| Sinkron template | `bun run scripts/sync-template.ts` | 0 | exit 0, tidak ada diff di buku lain |
| Build penuh | `bun run build` | 0 | SEO Validation passed! All rules (R1-R7) satisfied; sitemap 762 URL; manifest.json books[0] = slug baru; 13 halaman HTML buku baru ada |
| Statistik build | `git diff functions/lib/built-stats.ts` | 0 | hanya +13 bab (687 ke 700) dan buku Kania 9 ke 10, auto-generated |

## 5. Sumber dan Integritas

- 27 entri referensi, semuanya dengan deep link DOI atau halaman penerbit (`src/content/13_referensi.md`).
- Angka kunci hasil verifikasi primer: lambda 2,25 (Tversky & Kahneman 1992); rasio PGR/PLR 1,5 (Odean 1998); 66.465 rumah tangga, 11,4% vs 17,9% (Barber & Odean 2000); pria berdagang 45% lebih banyak (Barber & Odean 2001); 49% menjadi 86% (Madrian & Shea 2001); 3,5% menjadi 13,6% dalam 40 bulan (Thaler & Benartzi 2004); 4,1 juta peserta dan $7,4 miliar (Benartzi & Thaler 2013); tiket teater 88% vs 46% dan framing 72%/78% (Tversky & Kahneman 1981); SSN 57-107% (Ariely dkk. 2003); minimum payment £99 menjadi £175 (Stewart 2009); SEED +81 poin persentase (Ashraf dkk. 2006).
