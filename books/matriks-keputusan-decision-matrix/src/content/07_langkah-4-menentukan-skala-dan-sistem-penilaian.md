## Penentuan Skala dan Sistem Penilaian

Kriteria penilaian dan bobotnya sudah kamu tentukan, jadi tantangan berikutnya adalah menentukan skala dan **sistem penilaian (scoring system)** secara adil. Langkah ini termasuk dalam penyusunan **matriks keputusan (decision matrix)**. Tanpa standarisasi yang tepat, perbandingan antar-alternatif akan menjadi bias dan tidak konsisten.

Bayangkan kamu sedang menjadi juri dalam sebuah kompetisi memasak. Jika kamu menilai aspek rasa hidangan kontestan A menggunakan skala 1–10, sedangkan aspek rasa hidangan kontestan B dinilai menggunakan skala 1–100, hasil akhirnya akan kacau. Kamu tidak akan bisa membandingkan kedua hidangan tersebut secara objektif.

Di sinilah pentingnya standarisasi alat ukur. Langkah ini bertujuan menciptakan "penggaris" yang seragam untuk mengukur setiap alternatif yang kamu miliki.

### 1. Mengapa Standarisasi Skala Penting?

Dalam menyusun matriks keputusan, standarisasi skala berfungsi sebagai penyeimbang agar data yang disajikan tidak bias. Standarisasi ini memastikan beberapa hal berikut:

- **Objektivitas Penilaian:** Mengurangi subjektivitas dengan memberikan definisi konkret untuk setiap tingkatan angka pada skala.
- **Komparabilitas Data:** Membantu menyandingkan variabel yang berbeda sifat, seperti harga dalam rupiah dan kualitas layanan yang bersifat opini, sehingga semuanya dapat dikonversi ke dalam satuan nilai yang setara untuk dijumlahkan.
- **Konsistensi Nilai:** Menjamin kesetaraan makna angka. Sebagai contoh, skor "5" pada aspek kecepatan harus merepresentasikan tingkat keunggulan yang setara dengan skor "5" pada aspek kemudahan penggunaan.

### 2. Memilih Rentang Skala yang Tepat

Ada beberapa jenis skala yang sering digunakan dalam pengambilan keputusan profesional, tergantung pada tingkat detail yang kamu butuhkan:

#### A. Skala Likert 1–5 (Paling Populer)

Skala ini sangat efisien untuk keputusan sehari-hari atau analisis yang tidak terlalu rumit karena sifatnya yang sederhana dan cepat dipahami.

- **Skor 1:** Sangat Buruk / Sangat Rendah
- **Skor 2:** Buruk / Rendah
- **Skor 3:** Cukup / Rata-rata
- **Skor 4:** Baik / Tinggi
- **Skor 5:** Sangat Baik / Sangat Tinggi

#### B. Skala 1–10 (High Granularity)

Pilihlah skala ini jika kamu menghadapi banyak alternatif dengan performa yang mirip. Rentang yang lebih lebar memberikan ruang untuk membedakan skor antar-pilihan secara lebih rinci.

- *Contoh:* Menilai efisiensi bahan bakar dari beberapa mesin industri yang perbedaannya hanya terpaut sekian persen.

#### C. Skala Biner (0 atau 1)

Skala ini khusus digunakan untuk kriteria mutlak yang hanya memiliki dua kemungkinan jawaban.

- *Contoh:* Evaluasi kriteria mutlak seperti "Apakah vendor memiliki sertifikasi ISO?" (Ya = 1, Tidak = 0).

### 3. Menyusun Rubrik Penilaian (Scoring Rubric)

Angka skala tidak boleh dibiarkan abstrak atau berdasarkan tebakan semata. Kamu perlu mendefinisikan arti konkret dari setiap angka untuk tiap kriteria yang dinilai. Dokumentasi inilah yang disebut sebagai **Scoring Rubric**.

Mari kita lihat contoh penerapan rubrik penilaian ketika kamu memilih laptop baru untuk kriteria **Ketahanan Baterai** dengan skala 1–5:

| Skor | Definisi Kualitatif | Indikator Kuantitatif |
| :---: | :--- | :--- |
| **1** | Sangat Buruk | Tahan kurang dari 3 jam |
| **2** | Buruk | Tahan 3 s.d. kurang dari 5 jam |
| **3** | Cukup | Tahan 5 s.d. kurang dari 8 jam |
| **4** | Baik | Tahan 8 s.d. 12 jam |
| **5** | Sangat Baik | Tahan lebih dari 12 jam |

> [!IMPORTANT]
> Pastikan arah penilaian selalu konsisten: **skor yang lebih tinggi harus selalu merepresentasikan kondisi yang lebih baik**. 
> 
> Sebagai contoh, pada kriteria "Biaya", harga yang mahal tentu berdampak buruk bagi keuanganmu. Oleh karena itu, harga yang paling murah harus mendapatkan skor 5, sedangkan harga yang paling mahal mendapatkan skor 1.

### 4. Mengolah Data Kualitatif dan Kuantitatif

Dalam satu matriks keputusan, kamu akan sering menemui kombinasi antara data kuantitatif (angka pasti) dan data kualitatif (opini atau penilaian subjektif). Keduanya harus dikonversi ke skala yang sama dengan cara berikut:

- **Data Kuantitatif:** Gunakan rumus normalisasi sederhana. Sebagai contoh, untuk kriteria Harga (di mana nilai yang lebih rendah justru lebih baik), kamu bisa menggunakan rumus:

<div>
$$
\text{Skor} = \frac{\text{Harga Termurah}}{\text{Harga Alternatif}} \times \text{Skala Maksimal}
$$
</div>

Sebagai contoh rekaan (angka ilustrasi), misalkan laptop termurah di daftarmu seharga Rp10.000.000, sedangkan Laptop A yang sedang kamu nilai seharga Rp15.000.000. Dengan skala maksimal 5, skornya dihitung seperti ini:

| Alternatif | Harga | Perhitungan | Skor |
| :--- | :--- | :--- | :---: |
| Laptop termurah | Rp10.000.000 | (10.000.000 ÷ 10.000.000) × 5 | 5 |
| Laptop A | Rp15.000.000 | (10.000.000 ÷ 15.000.000) × 5 | 3,33 |

Laptop termurah otomatis mendapat skor penuh 5, sedangkan Laptop A mendapat 3,33 (dibulatkan dua angka di belakang koma).

- **Data Kualitatif:** Gunakan konsensus tim atau penilaian ahli (*expert judgment*) untuk memosisikan setiap alternatif ke dalam skala 1–5 berdasarkan rubrik yang telah disepakati.

Sebagai gambaran, jika kamu menilai "Kenyamanan Kantor", bagaimana cara memastikan skor '4' yang kamu berikan memiliki standar yang sama dengan skor '4' dari rekan kerjamu? Di sinilah deskripsi tertulis pada setiap angka skala memainkan peran penting untuk menyamakan persepsi.

### 5. Pemilihan Vendor Software-as-a-Service (SaaS)

Sebuah tim ingin mengevaluasi platform CRM baru menggunakan skala penilaian 1–5. Berikut adalah perbandingan rubrik untuk kriteria kualitatif dan kuantitatif:

#### Kemudahan Penggunaan (User Experience)

- **Skor 1:** Sistem memiliki antarmuka yang kaku dan rumit, sehingga membutuhkan waktu pelatihan intensif lebih dari dua minggu bagi pengguna baru.
- **Skor 3:** Antarmuka standar dan fungsional, dengan perkiraan waktu orientasi mandiri sekitar tiga hari.
- **Skor 5:** Desain sangat intuitif dan modern, sehingga anggota tim bisa langsung mengoperasikannya tanpa perlu sesi pelatihan khusus.

#### Biaya Langganan Bulanan

- **Skor 1:** Biaya langganan sangat tinggi, yaitu di atas USD 500 per bulan.
- **Skor 3:** Biaya investasi bulanan sedang, berkisar antara USD 200 hingga USD 500.
- **Skor 5:** Biaya sangat ekonomis, berada di bawah USD 200 per bulan.

### 6. Tips Menghindari Bias Penilaian

Agar hasil matriks keputusan tetap objektif, hindari beberapa kesalahan umum berikut saat memberikan penilaian:

- **Efek Halo (Halo Effect):** Jangan biarkan keunggulan mencolok pada satu kriteria (misalnya desain produk yang sangat estetis) memengaruhi penilaianmu secara keseluruhan, sehingga kamu cenderung memberikan skor tinggi pada aspek lain (seperti performa) yang sebenarnya biasa saja.
- **Kecenderungan Memusat (Central Tendency Bias):** Hindari kebiasaan memberi skor "aman" di angka tengah (seperti skor 3 secara terus-menerus). Jika memang ada perbedaan kualitas yang nyata antar-alternatif, beranikan diri untuk memberikan skor yang tegas, baik tinggi maupun rendah.
- **Batasan Angka Nol:** Tentukan sejak awal apakah angka 0 boleh digunakan. Biasanya, skala penilaian dimulai dari angka 1 agar setiap alternatif tetap memberikan nilai kontribusi sekecil apa pun dalam perhitungan akhir.

> [!TIP]
> Skala penilaian yang dirancang dengan baik mengubah intuisi abstrak menjadi data kuantitatif yang terukur. Tanpa skala seperti itu, keputusan yang diambil hanyalah spekulasi dalam bentuk tabel angka.
