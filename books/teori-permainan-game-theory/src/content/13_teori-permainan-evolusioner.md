## Teori Permainan Evolusioner: Saat Biologi Bertemu Strategi

Selamat datang di persimpangan yang memukau antara biologi molekuler, perilaku hewan, dan matematika strategis. Jika sebelumnya kita membahas bagaimana manusia yang "rasional" mengambil keputusan, kali ini kita akan membuang asumsi "rasionalitas" tersebut.

Dalam **Teori Permainan Evolusioner (Evolutionary Game Theory - EGT)**, kita tidak bertanya "Apa yang akan dipikirkan pemain?", melainkan "Strategi mana yang akan bertahan hidup dan mendominasi populasi?"

### 1. Dasar Pemikiran: Mengapa Evolusi Membutuhkan Teori Permainan?

Dalam teori permainan klasik, kita berasumsi pemain memiliki kecerdasan untuk memilih langkah terbaik. Namun, alam tidak bekerja seperti itu. Seekor burung tidak menghitung matriks keuntungan sebelum memperebutkan wilayah.

Di sini, konsep-konsep kunci berubah:

- **Pemain:** Bukan lagi individu yang berpikir, melainkan **gen atau organisme** yang membawa strategi tertentu.
- **Strategi:** Bukan pilihan sadar, melainkan **sifat (trait)** yang diwariskan secara genetis (misalnya: perilaku agresif vs. perilaku damai).
- **Payoff (Hasil):** Bukan uang atau kepuasan, melainkan **Fitness (Kebugaran)**, yang diukur dari keberhasilan reproduksi dan kelangsungan hidup.

> **Analogi Strategi sebagai Warisan:** Bayangkan sebuah strategi adalah sebuah "resep masakan" yang tertanam dalam DNA. Jika resep itu membuat kamu kenyang dan panjang umur, kamu akan memiliki banyak anak dan mewariskan resep tersebut kepada mereka. Seiring waktu, seluruh populasi akan memasak dengan resep yang sama.

### 2. Konsep Utama: Evolutionary Stable Strategy (ESS)

Konsep paling fundamental dalam EGT dikembangkan oleh **John Maynard Smith** dan **George R. Price**, yang dikenal sebagai **Evolutionary Stable Strategy (ESS)**.

**Definisi:** Sebuah strategi dikatakan ESS jika, apabila strategi tersebut telah diadopsi oleh sebagian besar anggota populasi, tidak ada strategi "mutan" (alternatif) yang dapat masuk (menginvasi) populasi tersebut melalui seleksi alam.

Secara matematis, misalkan $E(S, T)$ adalah *payoff* (kebugaran) yang didapat oleh strategi $S$ saat berhadapan dengan strategi $T$. Strategi $I$ adalah sebuah **ESS** jika untuk setiap strategi alternatif $J$:

1. $E(I, I) > E(J, I)$
2. Atau jika $E(I, I) = E(J, I)$, maka $E(I, J) > E(J, J)$

*Mengapa syarat kedua diperlukan? Hal itu karena jika strategi mutan $J$ memiliki performa yang sama baiknya dengan $I$ saat melawan $I$, maka satu-satunya cara agar $I$ tetap dominan adalah jika $I$ lebih unggul saat melawan si mutan $J$ itu sendiri.*

### 3. Model Klasik: Hawk-Dove (Elang vs. Merpati)

Mari kita lihat skenario paling terkenal untuk memahami bagaimana perilaku sosial hewan terbentuk. Bayangkan dua individu memperebutkan sumber daya bernilai $V$ (misalnya makanan). Jika mereka bertarung dan terluka, ada biaya sebesar $C$.

Ada dua strategi:

1. **Hawk (Elang):** Agresif. Selalu bertarung sampai menang atau terluka parah.
2. **Dove (Merpati):** Damai. Menampilkan ancaman tapi akan mundur jika lawan mulai menyerang secara fisik.

**Matriks Payoff:**

| | Lawan: Hawk | Lawan: Dove |
| --- | --- | --- |
| **Pemain: Hawk** | $\frac{V-C}{2}$ | $V$ |
| **Pemain: Dove** | $0$ | $\frac{V}{2}$ |

**Analisis Skenario:**

- **Jika $V > C$:** Menjadi Elang selalu menguntungkan. Strategi Elang adalah ESS.
- **Jika $V < C$:** (Biaya cedera lebih besar dari nilai sumber daya). Menjadi Elang murni bukan lagi ESS, karena jika semua orang jadi Elang, semua orang terluka parah. Populasi akan mencapai keseimbangan di mana ada persentase tertentu Elang dan Merpati.

### 4. Dinamika Replikator (Replicator Dynamics)

EGT tidak hanya bersifat statis, tetapi juga mempelajari bagaimana proporsi strategi berubah seiring waktu. Ini disebut **Dinamika Replikator**.

Jika $x_i$ adalah proporsi individu yang menggunakan strategi $i$ dalam populasi, maka perubahan proporsi tersebut dapat dirumuskan sebagai:

$$
\dot{x}_i = x_i [f_i(x) - \phi(x)]
$$

Di mana:

- $f_i(x)$ adalah kebugaran dari strategi $i$.
- $\phi(x)$ adalah rata-rata kebugaran seluruh populasi.

**Intinya:** Jika sebuah strategi memberikan hasil di atas rata-rata populasi, maka proporsi pengguna strategi tersebut akan meningkat di generasi berikutnya.

### 5. Aplikasi Dunia Nyata & Kasus Praktis

#### A. Rasio Jenis Kelamin (Sex Ratio)

Mengapa di hampir semua spesies mamalia jumlah jantan dan betina mendekati 50:50? Ronald Fisher menggunakan logika EGT untuk menjelaskan bahwa jika salah satu jenis kelamin menjadi langka, individu yang menghasilkan jenis kelamin langka tersebut akan memiliki keuntungan evolusioner yang besar, hingga akhirnya rasio kembali seimbang.

#### B. Altruisme pada Hewan (Timbal Balik)

Mengapa kelelawar vampir berbagi darah dengan temannya yang kelaparan? Secara individu, ini merugikan. Namun, dengan EGT, kita melihat bahwa strategi "Berbagi dengan yang pernah berbagi denganku" (Tit-for-Tat) adalah ESS yang mencegah kepunahan kelompok saat sumber daya sulit didapat.

#### C. Resistensi Antibiotik

Dalam medis, dokter menggunakan EGT untuk memahami bagaimana bakteri "bertarung" melawan antibiotik. Bakteri yang memiliki mutasi resistensi memiliki biaya energi lebih tinggi untuk bereproduksi. Jika penggunaan antibiotik dikurangi secara strategis, bakteri normal yang lebih cepat bereproduksi dapat "mengalahkan" bakteri resisten dalam kompetisi populasi.

### 6. Contoh Kode: Simulasi Sederhana EGT

Berikut adalah cuplikan logika (Python-like pseudocode) untuk mensimulasikan perubahan populasi Hawk-Dove sederhana:

```python
# Parameter
V = 50  # Nilai sumber daya
C = 100 # Biaya cedera
hawk_ratio = 0.1 # Awalnya sedikit elang
dove_ratio = 0.9 # Banyak merpati

for generation in range(100):
    # Hitung kebugaran rata-rata
    f_hawk = hawk_ratio * ((V-C)/2) + dove_ratio * V
    f_dove = hawk_ratio * 0 + dove_ratio * (V/2)
    avg_fitness = (hawk_ratio * f_hawk) + (dove_ratio * f_dove)
    
    # Update proporsi berdasarkan dinamika replikator
    hawk_ratio = hawk_ratio * (f_hawk / avg_fitness)
    dove_ratio = dove_ratio * (f_dove / avg_fitness)
    
    print(f"Gen {generation}: Hawk {hawk_ratio:.2f}, Dove {dove_ratio:.2f}")
```

### 7. Kesimpulan: Pentingnya Sudut Pandang Evolusioner

Teori Permainan Evolusioner mengajarkan kita bahwa perilaku yang tampak "tidak logis" pada tingkat individu (seperti mengalah atau mengorbankan diri) sering kali merupakan strategi yang sangat stabil dan cerdas pada tingkat populasi.

**Poin Penting untuk Diingat:**

- **ESS** adalah kondisi di mana populasi kebal terhadap "serangan" strategi asing.
- **Kebugaran (Fitness)** adalah mata uang utama, bukan uang atau kepuasan pribadi.
- **Konflik dan Kerjasama** adalah hasil dari interaksi berulang selama jutaan tahun yang terukir dalam mekanisme biologis.

*Latihan Refleksi: Dapatkah kamu memikirkan norma sosial manusia yang mungkin merupakan sebuah ESS? Misalnya, mengapa kita mengantre? Apakah mengantre adalah strategi yang lebih stabil daripada berebut jika semua orang melakukannya?*
