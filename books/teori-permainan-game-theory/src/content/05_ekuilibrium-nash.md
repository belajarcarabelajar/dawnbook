## Ekuilibrium Nash (Nash Equilibrium)

Selamat datang di jantung Teori Permainan! Jika kamu pernah menonton film *A Beautiful Mind*, kamu pasti tidak asing dengan sosok **John Nash**. Konsep yang ia rumuskan bukan sekadar teori akademis, melainkan sebuah kacamata untuk melihat bagaimana dunia bekerja, mulai dari perang dagang, strategi militer, hingga mengapa orang-orang mengantre di kasir supermarket.

Dalam bagian ini, kita akan membongkar apa itu Ekuilibrium Nash, mengapa ia disebut sebagai titik "tanpa penyesalan", dan bagaimana cara menemukannya dalam sebuah interaksi strategis.

### 1. Apa Itu Ekuilibrium Nash?

Bayangkan kamu dan seorang teman sedang bermain. **Ekuilibrium Nash** adalah sebuah situasi di mana tidak ada satu pun pemain yang dapat meningkatkan keuntungannya dengan mengubah strateginya sendirian, sementara pemain lain tetap pada pilihan mereka.

**Analogi Sederhana: Pertemuan di Mal**

Kamu dan temanmu berencana bertemu di sebuah mal besar yang memiliki dua pintu masuk: Pintu Utara dan Pintu Selatan. Ponsel kalian berdua mati, sehingga kalian tidak bisa berkomunikasi.

- Jika kamu pergi ke Pintu Utara dan temanmu ke Pintu Utara, kalian bertemu (Hasil Bagus).
- Jika kamu di Utara dan temanmu di Selatan, kalian tidak bertemu (Hasil Buruk).

Jika saat ini kalian berdua berada di **Pintu Utara**, apakah kamu ingin pindah ke Selatan sendirian? Tidak, karena kamu justru tidak akan bertemu temanmu. Begitu juga temanmu. Karena tidak ada yang mau pindah secara sepihak, posisi "Keduanya di Pintu Utara" adalah sebuah **Ekuilibrium Nash**.

> **Wawasan Penting:** Ekuilibrium Nash bukanlah tentang hasil yang "paling adil" atau "paling menguntungkan secara total", melainkan tentang **stabilitas**. Ini adalah titik di mana setiap pemain berkata, "Mengingat apa yang dilakukan lawan saya, saya sudah melakukan yang terbaik yang saya bisa."

### 2. Definisi Formal

Secara matematis, misalkan terdapat $n$ pemain. Sebuah kombinasi strategi $(s_1^*, s_2^*, \dots, s_n^*)$ disebut sebagai Ekuilibrium Nash jika untuk setiap pemain $i$:

$$
u_i(s_i^*, s_{-i}^*) \geq u_i(s_i, s_{-i}^*)
$$

Dengan:

- $u_i$ adalah fungsi utilitas atau *payoff* (hasil) bagi pemain $i$.
- $s_i^*$ adalah strategi optimal pemain $i$.
- $s_{-i}^*$ adalah strategi yang dipilih oleh semua pemain lain selain pemain $i$.

Artinya, hasil ($u_i$) yang didapat pemain $i$ dengan strategi $s_i^*$ adalah yang tertinggi dibandingkan pilihan strategi lainnya ($s_i$), dengan asumsi pemain lain tidak mengubah pilihan mereka.

### 3. Cara Menemukan Ekuilibrium Nash dalam Matriks

Untuk mencari ekuilibrium dalam permainan simultan (pemain memilih di waktu yang sama), kita menggunakan metode **"Best Response" (Respon Terbaik)**. Mari kita lihat contoh kompetisi antara dua perusahaan, Perusahaan A dan Perusahaan B, yang memutuskan untuk memasang iklan atau tidak.

| Perusahaan A \ B | Pasang Iklan | Tidak Iklan |
| --- | --- | --- |
| **Pasang Iklan** | (10, 10) | (20, 5) |
| **Tidak Iklan** | (5, 20) | (15, 15) |

*Catatan: Angka pertama dalam kurung adalah payoff Perusahaan A, angka kedua adalah payoff Perusahaan B.*

**Langkah-langkah Analisis:**

1. **Jika Perusahaan B Pasang Iklan:** Respon terbaik Perusahaan A adalah **Pasang Iklan** (10 lebih baik daripada 5). *Kita tandai angka 10.*
2. **Jika Perusahaan B Tidak Iklan:** Respon terbaik Perusahaan A adalah **Pasang Iklan** (20 lebih baik daripada 15). *Kita tandai angka 20.*
3. **Jika Perusahaan A Pasang Iklan:** Respon terbaik Perusahaan B adalah **Pasang Iklan** (10 lebih baik daripada 5). *Kita tandai angka 10 (milik B).*
4. **Jika Perusahaan A Tidak Iklan:** Respon terbaik Perusahaan B adalah **Pasang Iklan** (20 lebih baik daripada 15). *Kita tandai angka 20 (milik B).*

**Hasil:** Kotak di mana kedua pemain memberikan respon terbaiknya adalah **(Pasang Iklan, Pasang Iklan)** dengan payoff **(10, 10)**. Inilah Ekuilibrium Nash-nya.

*Coba renungkan: Apakah (10, 10) adalah hasil terbaik bagi kedua perusahaan? Secara kolektif, (15, 15) lebih baik. Namun, dalam Ekuilibrium Nash, godaan untuk mendapatkan 20 membuat posisi (15, 15) tidak stabil.*

### 4. Karakteristik Penting Ekuilibrium Nash

#### A. Bisa Lebih dari Satu (Multiple Equilibria)

Dalam beberapa kasus, sebuah permainan bisa memiliki lebih dari satu titik keseimbangan. Contoh klasiknya adalah **"Battle of the Sexes"** (Pertempuran Pilihan), di mana sepasang kekasih ingin pergi bersama tapi punya selera berbeda (satu ingin nonton bola, satu ingin nonton konser). Jika mereka bersama-sama di bola atau bersama-sama di konser, keduanya adalah Ekuilibrium Nash.

#### B. Tidak Selalu Efisien (Pareto Optimal)

Seperti contoh iklan di atas, Ekuilibrium Nash sering kali membawa pemain pada hasil yang lebih buruk daripada jika mereka bisa bekerja sama secara jujur. Namun, tanpa kontrak yang mengikat, mereka terjebak pada pilihan egois yang rasional.

#### C. Tidak Selalu Ada dalam "Strategi Murni"

Terkadang, dalam permainan seperti Batu-Gunting-Kertas, tidak ada satu titik stabil tunggal. Jika kamu selalu memilih Batu, lawan akan memilih Kertas. Kamu lalu pindah ke Gunting. Tidak ada titik diam. (Masalah ini akan dibahas lebih dalam di bagian **Strategi Campuran**).

### 5. Aplikasi Dunia Nyata

**Skenario: Perlombaan Senjata (Arms Race)**

Dua negara yang bersaing harus memutuskan apakah akan menambah hulu ledak nuklir atau melakukan pelucutan senjata.

- Jika Negara A menambah senjata dan Negara B tidak, Negara A memiliki kekuatan dominan.
- Ketakutan akan didominasi memaksa kedua negara untuk terus menambah senjata.
- **Ekuilibrium Nash:** Kedua negara terus menambah senjata, meskipun keduanya akan jauh lebih makmur dan aman jika uang tersebut digunakan untuk pendidikan atau kesehatan.

**Skenario: Lokasi Bisnis (Hukum Hotelling)**

Pernahkah kamu bertanya-tanya mengapa gerai Alfamart dan Indomaret sering kali berada tepat bersebelahan?

- Jika satu toko berada di ujung jalan dan toko lain di tengah, toko di tengah akan mendapatkan lebih banyak pelanggan.
- Untuk mengamankan jumlah pelanggan maksimal, kedua toko akan bergerak menuju pusat keramaian yang sama.
- **Ekuilibrium Nash:** Kedua toko berada berdampingan di tengah wilayah tersebut.

### 6. Rangkuman Singkat

- **Ekuilibrium Nash** adalah kondisi stabil di mana tidak ada pemain yang untung jika mengubah strategi sendirian.
- Ini mencerminkan pemikiran: "Saya melakukan yang terbaik berdasarkan apa yang kamu lakukan, dan kamu melakukan yang terbaik berdasarkan apa yang saya lakukan."
- **Metode Pencarian:** Gunakan *best response* untuk setiap kemungkinan pilihan lawan dalam matriks hasil.
- **Penting:** Ekuilibrium Nash tidak menjamin kebahagiaan maksimal, ia hanya menjamin stabilitas rasional.

> **Renungan:** Dalam hidup, kita sering terjebak dalam Ekuilibrium Nash yang buruk (seperti kemacetan lalu lintas di mana semua orang ingin mengambil jalur tercepat secara egois). Menurut kamu, apa cara terbaik untuk memecahkan ekuilibrium yang buruk dan berpindah ke hasil yang lebih menguntungkan semua orang? *(Petunjuk: Jawabannya sering kali melibatkan komunikasi atau regulasi!)*
