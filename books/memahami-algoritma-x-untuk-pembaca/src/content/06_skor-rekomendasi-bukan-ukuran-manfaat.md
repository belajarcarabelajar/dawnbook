## Skor Rekomendasi Bukan Ukuran Manfaat

Coba ingat post yang paling lama menahan jempolmu kemarin, karena kemungkinan besar post itu tidak mengajarkan satu hal pun yang sedang kamu cari.

Mungkin itu utas perdebatan yang kamu baca sampai habis, atau video yang kamu tonton dua kali sambil menunggu makanan datang. Kamu bertahan, mungkin juga ikut membalas, tetapi setelah aplikasi ditutup tidak ada pengetahuan baru yang tertinggal. Bagi sistem rekomendasi, sesi seperti itu tampak berhasil. Alasannya sederhana: skor yang menyusun urutan For You dibangun dari tebakan tentang responsmu, bukan dari penilaian apakah sebuah post berguna bagimu.

### Respons yang Ditebak Model

Pada implementasi lama, yaitu repositori twitter/the-algorithm (pembaruan September 2025), ada [berkas kode yang mendaftar jenis respons yang diprediksi](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/model/PredictedScoreFeature.scala). Isinya mencakup like, reply, repost, bookmark, share, dwell (lamanya kamu berhenti di sebuah post), beberapa jenis klik tertentu, tontonan video, dan umpan balik negatif. Report tidak termasuk dalam daftar utama itu.

Cermati sudut pandangnya. Model tidak bertanya apakah post ini benar atau apakah post ini membantumu belajar. Pertanyaannya adalah seberapa mungkin kamu memberi respons tertentu terhadap kandidat ini. Semua angka sesudahnya berangkat dari pertanyaan tersebut.

### Rumus Sederhana Bagian Positif

Cara paling ringkas memahami bagian positif dari penggabungan skor lama adalah rumus berikut.

<div>
$$
S_{+}=\sum_{i:w_i\geq 0} w_i p_i
$$
</div>

Di sini $p\_i$ adalah keluaran prediksi untuk satu jenis respons, sedangkan $w\_i$ adalah bobotnya, dan penjumlahan hanya mengambil bobot yang tidak negatif. Untuk respons berbentuk peristiwa, seperti like atau reply, $p\_i$ bisa dibaca sebagai peluang respons itu terjadi. Sebagian keluaran lain berkaitan dengan durasi atau tontonan video, jadi tidak semua $p\_i$ punya arti yang sama.

Satu hal yang sering disalahpahami: yang dinilai adalah respons yang diprediksi terhadap sebuah kandidat post. Kode tidak sedang memberimu satu poin setiap kali kamu menekan like. Aktivitasmu memang bisa menjadi masukan bagi tebakan berikutnya, tetapi hubungan itu bukan tabel poin yang baku.

### Bobot Lama yang Tidak Pernah Tetap

Rumus di atas sengaja disederhanakan. Berkas HomeGlobalParams menyimpan sekitar 30 parameter bobot yang nilai awalnya 0,0. Nilai sebenarnya diisi lewat konfigurasi permintaan dan sebuah optimizer yang memberi set bobot per pengguna. Jadi angka 0,0 itu bukan pengaruh nyata like atau bookmark di akunmu.

Prediksi negatif juga ditangani khusus. Fungsi RerankerUtil bisa mengalikannya secara biasa atau memakai aturan ambang, yang dibandingkan dengan nilai tertinggi di antara kandidat atau dengan sebuah konstanta. Di bawah ambang itu, prediksi negatif tidak menyumbang apa pun. Setelah itu, HeuristicScorer mengalikan sekitar 15 faktor penyesuaian, misalnya untuk post dari luar jaringanmu, reply, keragaman penulis, dan kelelahan umpan balik. Snapshot September 2025 juga memuat Phoenix sebagai jalur pemeringkatan alternatif. Karena itu, $S\_{+}$ hanya alat bantu memahami, bukan reproduksi skor produksi, dan tidak cukup untuk menebak urutan feed-mu.

### Bobot yang Kini Dibuka

Repositori baru, xai-org/x-algorithm, menuliskan skor akhir dengan lebih terbuka: untuk setiap aksi, bobot dikalikan peluang prediksinya, lalu semuanya dijumlahkan. Aksi positif mendapat bobot positif, aksi negatif mendapat bobot negatif.

<div>
$$
\text{Skor akhir}=\sum_{i} w_i P(a_i)
$$
</div>

Bobotnya tercantum di [berkas parameter peringkat](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs). Berikut sebagian nilai bawaan per sinkronisasi 8 Oktober 2026.

| Aksi yang diprediksi | Bobot bawaan |
|---|---|
| Like | 0,5 |
| Reply | 5 |
| Repost | 1 |
| Quote | 5 |
| Share | 2 |
| Share lewat DM | 5 |
| Share lewat salin tautan | 20 |
| Follow penulis | 4 |
| Not interested | -47,52 |
| Block penulis | -31,2 |
| Mute penulis | -58,8 |
| Report | -234 |

Tabel ini menggoda untuk dibaca sebagai daftar poin, dan [README repositori itu](https://github.com/xai-org/x-algorithm) sendiri memperingatkan agar kamu tidak melakukannya. Bobot dikalikan dengan peluang prediksi bahwa kamu akan melakukan sebuah aksi, bukan dengan jumlah aksi yang terjadi. Kesimpulan seperti "satu report menghapus 468 like" adalah salah baca. Komentar di kodenya menjelaskan bahwa bobot mencampur dua hal, yaitu seberapa berharga sebuah aksi dan seberapa jarang aksi itu terjadi. Peluang dasar report lebih dari 1.000 kali lebih kecil daripada like, sehingga bobotnya harus besar agar prediksinya berpengaruh sama sekali. Nilai-nilai ini disalin dari konfigurasi produksi dan bisa berubah, jadi anggap tabel di atas sebagai potret per 8 Oktober 2026.

Skor akhir belum langsung menjadi urutan. Sesudahnya masih ada pengali keragaman penulis yang menurun untuk post berikutnya dari penulis yang sama, potongan untuk post dari luar jaringanmu (juga untuk reply dan repost dari akun yang kamu ikuti), dorongan bagi penulis baru, lalu penataan ulang demi keragaman oleh VMRanker.

### Manfaat Tetap Kamu yang Menilai

Kembali ke post yang menahanmu kemarin. Post semacam itu bisa mendapat prediksi respons yang tinggi, misalnya peluang reply atau dwell yang besar, tanpa membantu pekerjaan atau belajarmu sedikit pun. Skor mengukur kemungkinan reaksi, sedangkan manfaat adalah urusan lain.

Karena itu, buat ukuranmu sendiri dengan tiga pertanyaan. Apakah ada pengetahuan baru yang kamu dapat? Apakah ada sumber yang bisa kamu periksa? Apakah ada keputusan yang menjadi lebih jelas? Kalau ketiganya dijawab tidak, lamanya kamu bertahan tidak mengubah apa-apa.

Tidak ada pula kuota interaksi yang perlu dikejar, entah sekian like atau sekian reply per hari. Bobot di tabel tadi tidak bisa diterjemahkan menjadi rasio pengaruh yang berlaku di akunmu. Pilih interaksi karena kegunaannya: like karena kamu menghargai isinya, bookmark karena akan memakainya lagi, reply karena memang ada yang perlu kamu sampaikan.

## Yang Perlu Kamu Ingat

- Model menebak responsmu terhadap sebuah kandidat post, bukan menilai apakah post itu berguna.
- Rumus $S\_{+}$ hanya penyederhanaan, karena di implementasi lama bobot diisi konfigurasi dan optimizer, lalu skornya dikalikan lagi oleh faktor penyesuaian.
- Bobot di repositori baru mengalikan peluang, bukan jumlah aksi, dan nilainya bisa berubah sewaktu-waktu.
- Ukuran manfaat ada di tanganmu: pengetahuan baru, sumber yang bisa diperiksa, dan keputusan yang lebih jelas.

Karena yang ditebak adalah responsmu, tiga alat yang paling dekat dengan jempolmu, yaitu Not interested, mute, dan unfollow, layak kamu kenali cara kerjanya satu per satu.
