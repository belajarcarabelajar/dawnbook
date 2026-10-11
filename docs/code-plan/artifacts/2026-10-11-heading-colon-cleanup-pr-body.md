# Pull Request: Hapus colon dari semua judul dan heading buku, tambah detektor dan aturannya

## 1. Delivery Metadata

| Field | Value |
|---|---|
| Session slot | `dawnbook-heading-colon-cleanup` |
| Plan | `docs/code-plan/plans/2026-10-11-dawnbook-heading-colon-cleanup.md` |
| Base branch | `main` |
| Head branch | `2026-10-11-dawnbook-heading-colon-cleanup/dawnbook-heading-colon-cleanup` |
| Worktree | `../dawnbook-wt/dawnbook-heading-colon-cleanup` |
| Type of change | docs, chore (konten buku, detektor baca-saja, aturan agen) |
| Reviewer | tidak ada yang diminta; review independen oleh agen peninjau, lihat bagian 5 |

## 2. What This Changes

Setelah PR ini digabung, tidak ada heading bab, entri `SUMMARY.md`, atau judul `book.toml` di 56 buku yang memuat colon (`Label: Subjudul`, `4. Label: Subjudul`, atau colon penutup seperti `Komponen SMART:`). Sebelumnya ada 2.516 heading bercolon di 613 dari 712 berkas bab, ditambah 330 entri `SUMMARY.md` dan 3 judul `book.toml`. Setiap judul ditulis ulang menjadi satu frasa yang wajar: bagian label yang redundan dibuang, nama tokoh, istilah teknis, dan klaim inti dipertahankan, dan label bab tetap memuat topik. Perubahan hanya menyentuh baris heading, teks tautan `SUMMARY.md`, baris `title` pada tiga `book.toml` (izin pemilik, satu kali, hanya baris itu), dan 12 baris isi bab di enam berkas yang mengutip judul bab lama. Nama berkas, tingkat heading, jumlah heading, dan target tautan `SUMMARY.md` tidak berubah. PR juga menambah detektor baca-saja `scripts/check-heading-colons.ts` dengan tesnya, serta aturan baru di `GEMINI.md` bagian 24 dan `MDBOOK_SYSTEM_RULES.md` (4.3, 7.11, dan satu butir checklist).

**Non-goals:** tidak mengubah pola ` vs. ` atau ` - ` pada heading; tidak menghapus label perancah yang bebas colon (mis. "Aplikasi Dunia Nyata"); tidak mengubah isi bab selain kutipan judul; tidak menjalankan deploy, seed D1, atau reindeks Google Search Console (dikerjakan setelah merge); tidak menyentuh `db/seed.sql`.

## 3. Acceptance Criteria

| ID | Criterion | Task | Check | Evidence |
|---|---|---|---|---|
| AC-1 | Tidak ada colon pada heading bab, entri SUMMARY, atau judul book.toml | T3-T8, T9 | `bun run scripts/check-heading-colons.ts` | exit 0, `0 violations ... 56 books scanned`, 1 dikecualikan (judul karya "Guardian: The Lonely and Great God" dikutip apa adanya, dengan penanda beralasan) |
| AC-2 | Hanya baris heading, teks tautan SUMMARY, dan baris `title` yang berubah, kecuali enam berkas isi bab yang disetujui | T9 | `bun run scripts/check-heading-colons.ts --diff-guard origin/main --allow-body <6 berkas>` | exit 0; tanpa `--allow-body` gagal tepat pada enam berkas itu |
| AC-3 | Judul bab dan entri SUMMARY yang dulu identik tetap identik | T9 | `... --parity-base origin/main` | exit 0 |
| AC-4 | Tidak ada heading `##` kembar baru dalam satu buku | T9 | `... --dup-guard origin/main` | exit 0 |
| AC-5 | Detektor menangkap pola contoh pemilik dan tidak melewatkan heading di dalam blockquote atau daftar | T1 | `bun test tests/scripts/check-heading-colons.test.ts` dan `--self-test` | 52 lulus, 0 gagal; `self-test ok` |
| AC-6 | Aturan tercatat, `AGENTS.md` dan `CLAUDE.md` tetap symlink ke `GEMINI.md` | T2 | `test -L AGENTS.md && test -L CLAUDE.md` | exit 0 |
| AC-7 | Tidak ada em dash, "Anda", emoji, U+FE0F, U+200D pada baris tambahan | T9 | `git diff -U0 origin/main -- books` dipindai dengan `rg -P` | 0 temuan |
| AC-8 | Build tetap hijau | T9 | `bun run build` | exit 0, validasi SEO R1-R7 lolos |

## 4. Local Verification Evidence

> Semua baris dihasilkan di mesin yang memegang working tree, sebelum cabang di-push. Tidak ada runner jarak jauh yang diminta memverifikasi apa pun.

| Gate | Command | Exit | Result |
|---|---|---|---|
| Tes detektor | `bun test tests/scripts/check-heading-colons.test.ts` | 0 | 52 lulus, 0 gagal (RED awal gagal sebelum perbaikan blockquote) |
| Self-test | `bun run scripts/check-heading-colons.ts --self-test` | 0 | `self-test ok` |
| Detektor penuh | `bun run scripts/check-heading-colons.ts` | 0 | 0 pelanggaran, 56 buku, 1 dikecualikan |
| Guard diff | `... --diff-guard origin/main --allow-body <6 berkas>` | 0 | ok |
| Guard paritas | `... --parity-base origin/main` | 0 | ok |
| Guard duplikat | `... --dup-guard origin/main` | 0 | ok |
| Build | `export PATH=$HOME/.cargo/bin:$PATH; bun run build` | 0 | selesai, sitemap 775 URL, validasi SEO lolos |
| Seluruh tes | `bun test` | 1 | 384 lulus, 13 dilewati, 1 gagal (kegagalan yang sama muncul di `origin/main`, lihat bagian 7) |

Peringatan build: 56 kali `mdbook-dawnbook` (preprocessor opsional) tidak ditemukan di mesin ini; tidak terkait perubahan dan sudah ada sebelumnya.

## 5. Independent Review

- [x] Setiap gelombang buku (enam gelombang, 56 buku) ditinjau oleh agen peninjau yang tidak menulis perubahannya; seluruh temuan FIX-SMALL diterapkan, satu ditolak dengan alasan (lihat di bawah).
- [x] Audit diff oleh parent: empat pemeriksaan mekanis dijalankan ulang sendiri per gelombang dan pada seluruh cabang; klaim sukses tiap subagen diverifikasi ulang, bukan dipercaya.
- [x] Peninjau independen terakhir atas seluruh PR menemukan satu hal [P2]: satu heading di dalam blockquote (`10_perlakuan-dan-penguatan-respons-siswa.md:62`) lolos karena regex heading hanya mencocokkan awal baris. Sudah diperbaiki di PR ini: tes gagal ditulis dulu, regex heading dan fence kini mengenali awalan blockquote dan daftar, satu heading itu ditulis ulang, dan `GEMINI.md` menyebutnya.

Satu saran yang ditolak: memulihkan baris isi bab di `neurobiologi-sistem-vestibular` bab 01 yang mengutip judul bab 02 lama. Memulihkannya akan meninggalkan kutipan judul yang sudah tidak ada, jadi baris itu diselaraskan dan diizinkan eksplisit lewat `--allow-body`.

**Reviewer verdict:** `correct`. Tidak ada temuan P0 atau P1; satu temuan P2 sudah diperbaiki sebelum PR dibuka. Verdict berubah menjadi `not correct` bila ada heading lain dalam lingkup yang tampil sebagai heading di halaman tetapi tidak terdeteksi.

## 6. Risk, Rollout, Rollback

| Concern | Answer |
|---|---|
| Blast radius | Judul halaman (`<title>`), teks sidebar, dan teks tautan SUMMARY di 56 buku; ID anchor heading berubah sehingga tautan eksternal ke anchor lama bisa patah (tidak bisa diperiksa dari repo). Tidak ada perubahan kode runtime. |
| Rollout | Default: merge ke `main`. Konten D1 (`content_md`) baru ikut berubah setelah deploy dan seed ulang, yang dikerjakan pemilik setelah merge. |
| Health signal | Setelah deploy: `manifest.json` tanpa colon pada judul bab, halaman bab 01 publik 200, panjang `content_md` D1 per slug sama dengan sumber lokal. |
| Rollback | `git revert -m 1 <commit merge>` pada `main`, lalu deploy dan seed ulang; tidak ada migrasi skema atau penghapusan data. |
| Compatibility | `db/seed.sql` dan berkas `db/seed_N.sql` lama masih menyimpan judul lama sampai seeder dijalankan ulang; tidak ada konsumen kode yang mengunci judul bab (tes memakai fixture). |

## 7. Pre-Existing Issues and Deferred Debt

- `functions/lib/auth.ts` (tes `verifySession handles last_seen_at UPDATE failure silently`): gagal pada rangkaian penuh `bun test` di `origin/main` bersih juga, lulus bila dijalankan sendiri (tes saling memengaruhi menurut urutan). `defer: satu sesi, saat tes auth berikutnya disentuh atau bila rangkaian penuh harus hijau tanpa pengecualian`
- `db/seed.sql` dan berkas `db/seed_N.sql` lama yang masih terlacak: masih memuat heading lama. `defer: satu sesi kecil setelah deploy, pemicu: PR ini merged dan seeder dijalankan ulang`
- Heading tanpa colon yang berawalan label perancah, mis. "Aplikasi Dunia Nyata" sepuluh kali di `teori-permainan`, dan "Kesimpulan" ganda di beberapa buku. `defer: satu sesi, pemicu: pemilik ingin aturan label perancah`
- Pola ` vs. ` (sekitar 184 heading) dan ` - ` (sekitar 66 heading) pada heading belum dibahas aturan. `defer: satu sesi, pemicu: keputusan pemilik`
- Penggaris kualitas judul yang dipakai selama pengerjaan (batas konektor, batas panjang, topik judul bab) hanya skrip lokal di luar repo. `defer: satu sesi, pemicu: aturan ingin dipaksa secara mekanis di build`
- Detektor belum dipasang di gerbang build, dan `--diff-guard` mengizinkan penambahan atau penghapusan heading serta pergantian tingkat. `defer: satu sesi, pemicu: pemasangan gerbang build`
- Celah detektor yang belum punya contoh nyata di repo: heading setext, heading HTML `<hN>`, colon fullwidth (U+FF1A), dan pembersihan matematika yang serakah (`$5: murah dan $10`). `defer: satu sesi, pemicu: contoh nyata ditemukan atau gerbang build dipasang`
- Residu U+FE0F dan U+200D pada heading yang tidak disentuh (`bias-kognitif` 3, `ikigai` 1). `defer: satu sesi, pemicu: audit emoji berikutnya`
- Label tebal di isi bab yang masih berpola `Label: ...` bukan heading, mis. `filosofi-stoikisme` bab 06 ("Analogi: Konduktor Orkestra") dan satu baris pembuka di `metakognisi` bab 08. `defer: satu sesi, pemicu: pemilik ingin aturan untuk label tebal`
- 15 entri `SUMMARY.md` yang sudah berbeda dari heading pertama bab sebelum PR ini. `defer: satu sesi, pemicu: pemilik ingin keselarasan penuh`
- Saran peninjau yang opsional dan tidak diterapkan: judul pilar `ikigai` bab 4-7, judul bab 10-14 `analisis-ekspresif` ("Kajian Ekspresif <topik>"), label kasus A sampai D di `poac` bab 12, dan "Spinlock Si Penjaga yang Gigih". `defer: satu sesi, pemicu: tinjauan editorial berikutnya`
- Buku yang ditulis Kania Salsabila (`pengaruh-uang`, `psikologi-di-balik-keputusan-finansial-kita`, `kenapa-kebiasaan-susah-diubah`, `kenapa-kita-suka-menunda-nunda`) dikomit atas nama Iwan Kurniawan sebagai pemeliharaan lintas buku, tanpa trailer co-author. `defer: tidak ada tindakan, catatan keputusan pemilik bila ingin dipecah per penulis`

## 8. Checklist

- [x] Cabang dan worktree berasal dari `pr-registry claim`.
- [x] Tidak ada komit langsung ke `main`.
- [x] Judul imperatif, isi dalam bahasa basis kode.
- [x] Tidak ada em dash di isi ini, pesan komit, atau string yang terlihat pengguna pada diff.
- [x] Tidak ada footer atribusi, lencana, atau baris co-author di isi, komit, maupun nama cabang.
- [x] Tidak ada rahasia, token, atau isi `.env` pada diff.
- [x] Setiap kriteria penerimaan terpetakan ke pemeriksaan dan bukti.
- [ ] Terdaftar di registry: `bun scripts/pr-registry.mjs pr dawnbook-heading-colon-cleanup --number <N>` (dikerjakan setelah PR dibuka).
