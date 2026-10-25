## Mekanisme Algoritma Penargetan

Pernahkah kamu merasa seolah ponsel kamu sedang "mendengarkan" pembicaraan kamu? Kamu baru saja membahas tentang keinginan membeli sepatu lari baru, dan tiba-tiba, iklan sepatu lari muncul di feed media sosial kamu.

Meskipun terdengar seperti penyadapan, kenyataannya jauh lebih teknis: ini adalah hasil kerja **algoritma penargetan**. Bagian ini akan membedah "kotak hitam" teknologi yang memproses miliaran titik data untuk memprediksi keinginan kamu.

### 1. Mengubah Data Menjadi Vektor

Algoritma tidak memahami "minat" atau "hobi" dalam bentuk kata-kata seperti manusia. Mereka memahami angka. Proses pertama dalam mekanisme ini adalah mengubah perilaku kamu menjadi representasi matematis yang disebut **Vektor Pengguna**.

Setiap tindakan yang kamu lakukan (durasi menonton video, tombol yang diklik, hingga kecepatan *scrolling*) diberi bobot numerik.

> **Analogi:** Bayangkan sebuah perpustakaan raksasa di mana setiap pengunjung memiliki "peta koordinat" unik. Jika kamu sering mengunjungi rak buku teknologi dan fiksi ilmiah, koordinat kamu akan bergeser ke arah area "Geek". Algoritma adalah navigator yang memetakan posisi kamu di peta ini secara real-time.

Secara matematis, profil kamu bisa direpresentasikan sebagai vektor $n$-dimensi:

$$
\vec{U} = [f_1, f_2, f_3, \dots, f_n]
$$

Di sini, $f$ merepresentasikan fitur seperti (usia, lokasi, minat\_otomotif, riwayat\_belanja).

### 2. Tiga Pendekatan Algoritma Penargetan

Untuk memprediksi apa yang ingin kamu lihat, algoritma menggunakan tiga pendekatan utama:

#### A. Collaborative Filtering (Penyaringan Kolaboratif)

Logika ini bekerja berdasarkan prinsip: *"Orang yang memiliki minat yang sama di masa lalu, cenderung memiliki minat yang sama di masa depan."*

- **Cara kerja:** Jika Pengguna A menyukai produk X, Y, dan Z, dan Pengguna B menyukai X dan Y, maka algoritma akan merekomendasikan produk Z kepada Pengguna B.
- **Kekuatan:** Tidak perlu memahami isi konten, hanya perlu melihat pola perilaku antar pengguna.

#### B. Content-Based Filtering (Penyaringan Berbasis Konten)

Logika ini fokus pada properti dari item yang kamu konsumsi.

- **Cara kerja:** Jika kamu sering menonton video tentang "Resep Rendang", algoritma akan mencari konten lain dengan metadata serupa (misal: "Masakan Padang", "Tips Daging Empuk").
- **Kekuatan:** Sangat efektif untuk pengguna baru yang belum memiliki banyak interaksi sosial namun sudah menunjukkan minat spesifik.

#### C. Lookalike Modeling (Pemodelan Serupa)

Ini adalah teknik lanjutan di mana pengiklan memberikan data pelanggan terbaik mereka, dan algoritma mencari "kloningan" perilaku dari pengguna lain di platform tersebut.

### 3. Pemrosesan Real-Time dan Latensi Rendah

Salah satu ciri teknis algoritma penargetan adalah kecepatannya. Seluruh proses, mulai dari kamu membuka aplikasi hingga iklan muncul, terjadi dalam waktu kurang dari **100 milidetik**.

1. **Trigger:** Kamu membuka aplikasi (misal: Instagram).
2. **Request:** Aplikasi mengirim sinyal ke server iklan: "Pengguna ID\_123 sedang aktif, butuh iklan."
3. **Scoring:** Algoritma melakukan *scoring* terhadap ribuan iklan yang tersedia berdasarkan kecocokan dengan vektor kamu.
4. **Selection:** Iklan dengan skor tertinggi (gabungan minat dan bid) dipilih.
5. **Rendering:** Iklan muncul di layar kamu.

### 4. Menghitung Skor Sebuah Iklan

Bagaimana sebuah sistem memberikan skor pada sebuah iklan untuk pengguna tertentu? Salah satu logika paling sederhana adalah mengalikan minat pengguna terhadap kategori iklan (dalam skala 0-1) dengan harga bid yang ditawarkan pengiklan:

<div>
$$
\text{Skor} = \text{Minat} \times \text{Bid}
$$
</div>

Misalkan seorang pengguna punya minat 0,9 pada gadget, 0,2 pada fashion, dan 0,5 pada travel, sementara tiga iklan bersaing memperebutkan layarnya (semua angka ini angka ilustrasi). Setelah dihitung dan diurutkan dari skor tertinggi, hasilnya seperti ini:

| Peringkat | Iklan | Kategori | Minat pengguna | Bid | Skor |
| --- | --- | --- | --- | --- | --- |
| 1 | Smartphone X | Gadget | 0,9 | 500 | 450 |
| 2 | Bali Trip | Travel | 0,5 | 800 | 400 |
| 3 | Luxury Watch | Fashion | 0,2 | 1.200 | 240 |

Dalam hitungan ini, meskipun iklan "Luxury Watch" memiliki bayaran (bid) tertinggi, iklan "Smartphone X" menang karena skor minat pengguna terhadap gadget sangat tinggi (0,9). Luxury Watch justru jatuh ke urutan terakhir karena minat pengguna pada fashion hanya 0,2.

### 5. Keranjang Belanja yang Ditinggalkan

**Penargetan Prediktif pada E-commerce:** Seorang pengguna memasukkan botol susu bayi ke dalam keranjang belanja tetapi tidak membelinya (*abandoned cart*).

- **Aksi Algoritma:** Algoritma segera memperbarui vektor pengguna dengan tag "Parenting" dan "High Intent".
- **Prediksi Real-Time:** Dalam hitungan detik, saat pengguna tersebut membuka portal berita, algoritma penargetan bekerja sama dengan jaringan iklan untuk menampilkan iklan diskon popok atau susu formula dari merek kompetitor.
- **Hasil:** Konversi terjadi karena iklan muncul saat relevansi emosional dan kebutuhan fungsional sedang tinggi.

### Ringkasan Cara Kerja Algoritma

- **Data adalah Input:** Algoritma membutuhkan aliran data terus-menerus untuk menjaga akurasi.
- **Vektorisasi:** Manusia diubah menjadi titik-titik data matematis agar bisa diproses secara komputasi.
- **Prediksi vs Realitas:** Algoritma tidak tahu *pasti* apa yang kamu mau, mereka hanya menghitung **probabilitas statistik** berdasarkan pola masa lalu.
- **Real-Time:** Semua keputusan ini diambil lebih cepat daripada proses berpikir sadar manusia.

> **Insight Memorable:** Algoritma penargetan tidak mengenal kamu secara pribadi; mereka hanya mengenal "bayangan digital" kamu yang terbentuk dari ribuan interaksi yang pernah kamu lakukan di internet.
