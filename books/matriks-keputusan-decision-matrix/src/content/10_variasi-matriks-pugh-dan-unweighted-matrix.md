## Variasi Matriks: Matriks Pugh dan Unweighted Matrix

Setelah memahami anatomi dasar dan cara menghitung bobot dalam matriks keputusan, mungkin kamu bertanya: *"Apakah aku selalu harus menghitung bobot yang rumit untuk setiap keputusan?"* Jawabannya adalah tidak.

Dalam dunia pengambilan keputusan profesional, kita mengenal berbagai variasi matriks yang disesuaikan dengan tingkat kompleksitas masalah dan ketersediaan data. Dua variasi yang paling sering digunakan selain Matriks Keputusan Berbobot (*weighted decision matrix*) adalah **unweighted matrix** dan **Matriks Pugh**.

### 1. Unweighted Matrix (Matriks Tanpa Bobot)

**Unweighted matrix** adalah bentuk paling sederhana dari matriks keputusan. Dalam model ini, semua kriteria dianggap memiliki tingkat kepentingan yang sama. Tidak ada pengali (bobot) yang membedakan satu kriteria dengan kriteria lainnya.

#### Bagaimana Cara Kerjanya?

Bayangkan kamu sedang memilih menu makan siang kantor untuk tim. Kriteria yang ditentukan adalah Harga, Rasa, Kecepatan Pengiriman, dan Kebersihan. Jika kamu menggunakan unweighted matrix, kamu mengasumsikan bahwa Harga sama pentingnya dengan Kebersihan.

**Rumus Matematisnya:**

\\[ \\text{Total Skor} = \\sum_{i=1}^{n} \\text{Skor}_{i} \\]

*Di mana \\( n \\) adalah jumlah kriteria.*

#### Kapan Menggunakan Unweighted Matrix?

- **Skrining Awal**: Berguna ketika alternatif terlalu menumpuk dan butuh penyaringan cepat sebelum analisis mendalam.
- **Konsensus Sederhana**: Cocok jika semua pemangku kepentingan sepakat bahwa setiap kriteria bernilai sama.
- **Keterbatasan Data**: Digunakan saat kamu kekurangan dasar objektif untuk menentukan bobot yang spesifik.

> [!IMPORTANT]
> Kelemahan utama metode ini adalah risiko **distorsi hasil**. Pilihan yang unggul di banyak kriteria sepele bisa mengalahkan pilihan yang sangat kuat di satu kriteria yang paling menentukan.

### 2. Matriks Pugh (Matriks Perbandingan Relatif)

Diciptakan oleh **Stuart Pugh**, seorang desainer industri ternama, Matriks Pugh (sering disebut *Pugh Concept Selection*) berbeda secara fundamental dari matriks lainnya. Alih-alih memberikan skor absolut (seperti 1-10), kamu membandingkan setiap alternatif terhadap sebuah **baseline** (tolok ukur).

#### Konsep Dasar: "The Datum"

Dalam Matriks Pugh, kamu harus memilih satu alternatif sebagai **datum** (titik referensi). Biasanya, datum adalah solusi yang sudah ada saat ini (*status quo*) atau kompetitor terkuat di pasar.

#### Sistem Penilaian Relatif

Setiap alternatif dibandingkan dengan datum pada tiap kriteria menggunakan simbol berikut:

- **(+) Plus**: Menunjukkan alternatif lebih baik daripada datum.
- **(-) Minus**: Menunjukkan alternatif lebih buruk daripada datum.
- **(S/0) Same**: Berarti alternatif memiliki performa yang sama dengan datum.

#### Contoh Visual Sederhana

Jika kamu ingin mengganti perangkat lunak manajemen proyek (datum: Software Lama):

| Kriteria | Software A | Software B | Datum (Lama) |
| --- | --- | --- | --- |
| Kemudahan Pakai | + | S | 0 |
| Fitur Laporan | + | + | 0 |
| Biaya Langganan | - | + | 0 |
| **Total (+) / Plus** | 2 | 2 | - |
| **Total (-) / Minus** | 1 | 0 | - |
| **Skor Net** | **+1** | **+2** | - |

*Analogi: Bayangkan kamu sedang mencoba sepatu baru. Kamu tidak memberikan skor 85 untuk kenyamanannya, melainkan merasakannya sambil berpikir, "Sepatu ini jauh lebih empuk (+) daripada sepatu lamaku, tapi talinya lebih susah diikat (-)."*

#### Keunggulan Matriks Pugh

1. **Menghilangkan Subjektivitas Skor**: Lebih mudah menentukan apakah suatu aspek "lebih baik" daripada harus menetapkan angka spesifik seperti 7,5.
2. **Peluang Hibrida**: Memungkinkan kamu melihat potensi penggabungan fitur positif dari Alternatif A dan B untuk menciptakan solusi baru yang lebih baik.
3. **Berorientasi pada Perbaikan**: Sangat efektif dalam pengembangan produk (R&D) dengan fokus melampaui standar yang sudah ada.

### Perbandingan Cepat: Kapan Menggunakan yang Mana?

| Fitur | Unweighted Matrix | Matriks Pugh | Weighted Matrix |
| --- | --- | --- | --- |
| **Tingkat Kompleksitas** | Rendah | Sedang | Tinggi |
| **Tujuan Utama** | Penyaringan cepat | Perbaikan dari standar yang ada | Keputusan final yang menentukan |
| **Input Penilaian** | Angka absolut (1-5) | Simbol relatif (+, -, S) | Skor berbobot |
| **Waktu Pengerjaan** | Sangat Cepat | Cepat - Sedang | Cukup Lama |

### Real-World Application: Skenario Perusahaan Teknologi

**Skenario:** Sebuah perusahaan rintisan (*startup*) ingin memilih bahasa pemrograman baru untuk sistem *backend* mereka.

1. **Tahap 1 (Menggunakan Unweighted Matrix)**: Tim memiliki 10 kandidat bahasa. Mereka menggunakan unweighted matrix dengan kriteria "Populasi Developer", "Kecepatan Eksekusi", dan "Dokumentasi". Tujuannya hanya untuk menyaring menjadi 3 besar secara cepat.
2. **Tahap 2 (Menggunakan Matriks Pugh)**: Dari 3 besar tersebut, mereka membandingkannya dengan bahasa pemrograman yang mereka gunakan sekarang (**datum**).
   - *Sebagai bahan refleksi: Apakah bahasa baru ini benar-benar memberikan nilai tambah (+) yang nyata dibandingkan bahasa yang kita gunakan sekarang, atau kita hanya mengikuti tren?*
3. **Tahap 3 (Keputusan Akhir)**: Jika hasil Matriks Pugh menunjukkan persaingan ketat, tim akan beralih ke **Weighted Decision Matrix** (yang telah dibahas di bagian sebelumnya) untuk menghitung secara lebih akurat dampak finansial dan teknis jangka panjang.

### Tips Implementasi untuk Berbagai Tipe Pembelajar

- **Pembelajar Visual**: Coba gunakan kode warna saat mengisi Matriks Pugh. Menggunakan warna hijau untuk (+), merah untuk (-), dan kuning untuk (S) membantu kamu mengenali alternatif terbaik dengan cepat lewat pola warna.
- **Pembelajar Kinestetik**: Saat berdiskusi dengan tim, manfaatkan *post-it notes* di papan tulis. Secara fisik, memindahkan alternatif dengan banyak nilai minus (-) ke bagian bawah papan memperkuat proses eliminasi dalam pikiran.
- **Pembelajar Auditori**: Ucapkan perbandingannya secara lantang sewaktu mengisi matriks. Sebagai contoh: *"Sistem baru ini lebih hemat memori dibanding sistem lama, jadi kita beri nilai Plus."*

> [!NOTE]
> **Wawasan Penting:** Tidak ada satu matriks yang paling benar. Seringkali, perjalanan menuju keputusan yang hebat melibatkan penggunaan variasi matriks secara bertahap: mulai dari yang sederhana (unweighted) untuk menyaring, hingga yang mendalam (Weighted atau Pugh) untuk menetapkan pilihan terbaik.
