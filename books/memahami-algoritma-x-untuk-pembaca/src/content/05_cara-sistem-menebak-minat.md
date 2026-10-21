## Cara Sistem Menebak Minatmu

Pustakawan yang sudah lama bertugas sering bisa menebak buku yang kamu sukai hanya dari apa yang dipinjam pembaca lain dengan selera serupa. Ia tidak perlu membaca isi kepalamu. Cukup melihat bahwa orang yang meminjam buku sejarah maritim juga sering meminjam catatan perjalanan, lalu menyodorkan keduanya kepadamu. Sistem rekomendasi di X bekerja dengan logika yang mirip, hanya saja raknya berisi jutaan akun dan catatan peminjamannya berupa follow, like, dan kunjungan. Bab ini membedah dua mekanisme dari repositori twitter/the-algorithm (pembaruan September 2025), yaitu SimClusters dan Real Graph, lalu melihat sekilas apa yang berubah di repositori baru xai-org/x-algorithm. Ingat juga bahwa kedua repositori bukan salinan lengkap sistem produksi: konfigurasi per permintaan, model terlatih, dan banyak eksperimen yang sedang berjalan tidak bisa dibaca siapa pun.

### Komunitas dari Pola Follow

[SimClusters](https://github.com/twitter/the-algorithm/blob/main/src/scala/com/twitter/simclusters_v2/README.md) mengelompokkan akun berdasarkan siapa yang mengikutinya. Kalau sekumpulan akun cenderung diikuti oleh pembaca yang sama, akun-akun itu dianggap satu komunitas. Komunitas di sini bukan grup resmi yang bisa kamu masuki, melainkan pola yang muncul dari data. README SimClusters menyebut skalanya sekitar 20 juta akun produsen, yaitu akun yang diikuti pembaca, dan sekitar 145 ribu komunitas.

Satu pembaca tidak harus masuk satu kotak saja. Kamu bisa dekat dengan komunitas pemrograman, sepak bola, dan kuliner sekaligus, dengan kadar yang berbeda untuk masing-masing. Kadar inilah yang dihitung.

### Matriks sebagai Tabel Angka

Untuk menghitung kadar itu, SimClusters memakai matriks. Bayangkan matriks sebagai tabel: setiap baris mewakili satu hal, setiap kolom mewakili hal lain, dan setiap sel berisi angka yang menunjukkan seberapa kuat hubungan keduanya. Dua tabel yang ukurannya cocok bisa dikalikan untuk menghasilkan tabel baru. Rumus intinya adalah:

<div>
$$
U = A V
$$
</div>

- $A$ adalah tabel follow: baris berisi pembaca, kolom berisi akun produsen, dan selnya menandai siapa mengikuti siapa.
- $V$ adalah tabel KnownFor: baris berisi akun produsen, kolom berisi komunitas, dan selnya menunjukkan komunitas yang membuat akun itu dikenal.
- $U$ adalah hasilnya, tabel InterestedIn: baris berisi pembaca, kolom berisi komunitas, dan selnya memperkirakan seberapa tertarik seorang pembaca pada tiap komunitas.

Satu baris di tabel $U$, yaitu deretan angka minatmu terhadap semua komunitas, disebut vektor. Kembali ke perpustakaan: $A$ adalah catatan buku yang kamu pinjam, $V$ adalah label rak tempat buku itu biasa diletakkan, dan $U$ adalah tebakan rak mana yang paling sering kamu datangi. Rumus ini hanya satu tahap pembentukan perkiraan minat, bukan seluruh perhitungan For You.

Post juga punya representasi sendiri. Saat baru terbit, representasinya kosong. Setiap kali seseorang menyukainya, vektor InterestedIn milik orang itu ditambahkan ke representasi post. Artinya, like-mu ikut menentukan ke komunitas mana sebuah post dianggap condong. Karena itu, like yang selektif lebih masuk akal daripada menyukai apa saja yang kebetulan bertema sama, sebab satu topik bisa mencakup berita, promosi, humor, dan perdebatan sekaligus.

### Arti Mirip dalam Hitungan

Setelah pembaca, akun, dan post punya vektor, sistem perlu cara membandingkannya. Salah satu ukuran yang dipakai SimClusters adalah cosine similarity:

<div>
$$
\cos(a,b)=\frac{a\cdot b}{\lVert a\rVert \lVert b\rVert}
$$
</div>

Pembilang $a\cdot b$ (dot product) mengalikan komponen kedua vektor yang sepadan lalu menjumlahkannya. Penyebut berisi panjang masing-masing vektor, sehingga yang tersisa adalah kesamaan arah, bukan besar angkanya. Karena ada pembagian, rumus ini hanya berlaku jika $a$ dan $b$ sama-sama bukan vektor nol. Hasilnya makin besar ketika dua pola makin searah.

Di SimClusters, cosine similarity dipakai untuk membangun graf kemiripan antarakun produsen. Komunitasnya sendiri kemudian ditemukan dengan metode pengambilan sampel bernama Metropolis-Hastings. Jadi, kemiripan adalah bahan bakunya, bukan langsung jawabannya.

Mirip dalam hitungan ini berarti pola datanya searah. Dua post yang mirip belum tentu mengatakan hal yang sama, belum tentu sama benarnya, dan belum tentu sama bermanfaatnya bagimu. Kamu juga tidak bisa mengetik vektor minatmu sendiri. Pengaruhmu datang lewat sumber yang kamu pilih, aktivitas yang kamu lakukan, dan kontrol produk yang tersedia.

### Akun yang Sering Kamu Datangi

SimClusters membaca minat dari komunitas. [Real Graph](https://github.com/twitter/the-algorithm/blob/main/src/scala/com/twitter/interaction_graph/README.md) melihat hal yang lebih personal, yaitu seberapa mungkin kamu berinteraksi dengan akun tertentu. Ia adalah model jenis gradient boosted yang menebak apakah satu pengguna akan berinteraksi dengan pengguna lain. Bahannya ada dua macam. Yang publik berupa like, repost, dan follow. Yang privat berupa kunjungan profil, klik pada post, dan data buku alamat.

Riwayat interaksi itu digabung sebagai jumlah yang meluruh (decayed sum). Aktivitas lama tetap dihitung, tetapi bobotnya makin kecil seiring waktu, dan tidak lenyap begitu saja pada tanggal tertentu. Mirip pustakawan yang masih ingat kamu dulu rajin meminjam novel detektif, meski kini kamu lebih sering terlihat di rak sains.

Konsekuensinya sederhana: perhatikan siapa yang kamu baca berulang kali, bukan hanya topiknya. Sebuah akun bisa sesekali membahas teknologi, tetapi lebih sering mengajak debat yang tidak kamu butuhkan. Kunjungan profil yang kamu lakukan diam-diam pun ikut menjadi bahan perkiraan.

### Yang Berubah di Repositori Baru

Repositori xai-org/x-algorithm memakai pendekatan lain untuk mencari kandidat. Tahap retrieval bernama [Phoenix](https://github.com/xai-org/x-algorithm/blob/main/phoenix/README.md) mencari post dengan pencarian embedding dua menara (two-tower), dan kamu direpresentasikan oleh apa yang pernah kamu interaksikan, tanpa embedding khusus untuk ID pengguna. Dengan kata lain, sistem mengenalmu dari jejakmu, bukan dari nomor anggotamu. SimClusters pun belum pensiun: sejak Agustus 2026, ia masih dipakai sebagai sumber tambahan untuk post dari luar jaringan follow-mu.

## Inti Pembahasan

- SimClusters membentuk komunitas dari pola follow, dan satu pembaca bisa condong ke beberapa komunitas sekaligus.
- Tabel follow dikalikan dengan tabel KnownFor menghasilkan tabel InterestedIn, yaitu perkiraan minatmu per komunitas.
- Representasi post dimulai kosong dan diisi vektor minat para penyukanya, jadi like yang selektif ikut menentukan arah sebuah post.
- Mirip berarti polanya searah, bukan sama benar atau sama bermanfaat.
- Real Graph menebak interaksimu dengan akun lain dari sinyal publik dan privat, dengan riwayat lama yang bobotnya meluruh.

Tebakan minat ini baru menentukan post mana yang layak dipertimbangkan, sedangkan urutan yang akhirnya muncul di layarmu bergantung pada skor yang diberikan kepada setiap post.
