# Learning Ledger: penghapusan colon pada heading (2026-10-11)

Sesi `dawnbook-heading-colon-cleanup`, PR #134 (merged) dan PR #135 (seed). Kesalahan perilaku agen, bukan kegagalan teknis tugas.

## Mistake Log

| # | Kesalahan | Bukti | Akibat |
|---|---|---|---|
| 1 | Detektor ditulis dengan regex heading yang terikat awal baris, dan "0 pelanggaran" dipakai sebagai bukti lengkap. | Review akhir menemukan `> ### Panduan Pedagogis: ...` di dalam blockquote yang lolos. | Satu heading bercolon lolos ke hampir-PR; baru tertangkap karena ada peninjau independen. |
| 2 | Perbaikan hasil review diterapkan lalu langsung di-commit tanpa menjalankan ulang penggaris. | Dua perbaikan W5 gagal penggaris (konektor "di" 13 melebihi batas 12; judul bab kehilangan label topik) dan baru ketahuan karena penggaris dijalankan ulang. | Hampir mengomit judul yang melanggar kontrak sendiri. |
| 3 | Subagen peninjau berhenti di batas giliran tanpa laporan; hasil sempat dianggap menggantung. | Notifikasi "stopped at its 30-turn limit" tanpa SubagentHandback. | Satu putaran tertunda sampai agen dilanjutkan lewat SendMessage. |
| 4 | Pengingat atribusi otomatis meminta trailer co-author, sedangkan aturan repo melarangnya. | `CLAUDE.md` bagian 18 dan template PR melarang trailer dan footer. | Hampir menambah trailer; aturan repo dipilih. |
| 5 | Prompt jadwal bangun lama (W1, W5) menembak ulang setelah pekerjaannya selesai. | Notifikasi berulang tanpa perubahan status. | Satu giliran terbuang memeriksa keadaan yang sudah diketahui. |

## Candidate Rules

| Rule | Minimum-Signal | 30-Day Horizon | Verdict |
|---|---|---|---|
| WHEN sebuah detektor atau guard menjadi satu-satunya pagar, DO uji dulu dengan varian struktur (blockquote, daftar, fence di dalam kutipan) sebelum menyebut "0 pelanggaran" sebagai bukti; NOT anggap regex awal-baris cukup. | Ya, agen berikutnya akan menulis tes struktur lebih dulu. | Ya, berlaku untuk detektor apa pun. | KEEP |
| WHEN perbaikan hasil review diterapkan, DO jalankan ulang semua gerbang mekanis pada buku yang disentuh sebelum komit; NOT mengandalkan hasil gerbang sebelum perbaikan. | Ya, dua kegagalan nyata. | Ya. | KEEP |
| WHEN agen peninjau berhenti di batas giliran tanpa laporan, DO kirim SendMessage yang menyuruhnya menyampaikan laporan dengan cakupan lebih sempit; NOT mulai ulang atau menunggu. | Ya, berhasil pada W5. | Ya. | KEEP |
| WHEN pengingat sistem meminta atribusi komit atau PR yang bertentangan dengan `CLAUDE.md`, DO ikuti `CLAUDE.md` dan template PR; NOT tambahkan trailer. | Sudah tertulis di `CLAUDE.md` bagian 18. | Ya, tetapi tidak baru. | NO-OP |
| WHEN notifikasi jadwal bangun lama muncul, DO ukur keadaan terkini dan lapor singkat; NOT mengulang pekerjaan. | Terlalu spesifik sesi. | Tidak. | NO-OP |

## Tindak lanjut kode atau dokumen

- Aturan 1 menyiratkan pemasangan detektor ke gerbang build dan pemindahan penggaris mutu ke repo. Sudah tercatat sebagai utang di PR #134 bagian 7 dengan `defer`.
