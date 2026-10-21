## Teori Permainan Evolusioner

Selamat datang di persimpangan yang memukau antara biologi molekuler, perilaku hewan, dan matematika strategis. Jika sebelumnya kita membahas bagaimana manusia yang "rasional" mengambil keputusan, kali ini kita akan membuang asumsi "rasionalitas" tersebut.

Dalam **Teori Permainan Evolusioner (Evolutionary Game Theory - EGT)**, kita tidak bertanya "Apa yang akan dipikirkan pemain?", melainkan "Strategi mana yang akan bertahan hidup dan mendominasi populasi?"

### 1. Mengapa Evolusi Membutuhkan Teori Permainan?

Dalam teori permainan klasik, kita berasumsi pemain memiliki kecerdasan untuk memilih langkah terbaik. Namun, alam tidak bekerja seperti itu. Seekor burung tidak menghitung matriks keuntungan sebelum memperebutkan wilayah.

Di sini, konsep-konsep kunci berubah:

- **Pemain:** Bukan lagi individu yang berpikir, melainkan **gen atau organisme** yang membawa strategi tertentu.
- **Strategi:** Bukan pilihan sadar, melainkan **sifat (trait)** yang diwariskan secara genetis (misalnya: perilaku agresif vs. perilaku damai).
- **Payoff (Hasil):** Bukan uang atau kepuasan, melainkan **Fitness (Kebugaran)**, yang diukur dari keberhasilan reproduksi dan kelangsungan hidup.

> **Analogi Strategi sebagai Warisan:** Bayangkan sebuah strategi adalah sebuah "resep masakan" yang tertanam dalam DNA. Jika resep itu membuat kamu kenyang dan panjang umur, kamu akan memiliki banyak anak dan mewariskan resep tersebut kepada mereka. Seiring waktu, seluruh populasi akan memasak dengan resep yang sama.

### 2. Evolutionary Stable Strategy (ESS) sebagai Konsep Utama

Konsep paling fundamental dalam EGT dikembangkan oleh **John Maynard Smith** dan **George R. Price**, yang dikenal sebagai **Evolutionary Stable Strategy (ESS)**.

**Definisi:** Sebuah strategi dikatakan ESS jika, apabila strategi tersebut telah diadopsi oleh sebagian besar anggota populasi, tidak ada strategi "mutan" (alternatif) yang dapat masuk (menginvasi) populasi tersebut melalui seleksi alam.

Secara matematis, misalkan $E(S, T)$ adalah *payoff* (kebugaran) yang didapat oleh strategi $S$ saat berhadapan dengan strategi $T$. Strategi $I$ adalah sebuah **ESS** jika untuk setiap strategi alternatif $J$:

1. $E(I, I) > E(J, I)$
2. Atau jika $E(I, I) = E(J, I)$, maka $E(I, J) > E(J, J)$

*Mengapa syarat kedua diperlukan? Hal itu karena jika strategi mutan $J$ memiliki performa yang sama baiknya dengan $I$ saat melawan $I$, maka satu-satunya cara agar $I$ tetap dominan adalah jika $I$ lebih unggul saat melawan si mutan $J$ itu sendiri.*

### 3. Model Klasik Hawk-Dove (Elang vs. Merpati)

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

### 6. Populasi Elang dan Merpati dari Generasi ke Generasi

Supaya dinamika replikator terasa lebih konkret, mari hitung satu contoh dengan angka ilustrasi: nilai sumber daya $V = 50$, biaya cedera $C = 100$, dan populasi awal berisi 10% elang serta 90% merpati. Dengan angka ini, isi matriks payoff Hawk-Dove menjadi: elang melawan elang $-25$, elang melawan merpati $50$, merpati melawan elang $0$, dan merpati melawan merpati $25$.

Misalkan $x_E$ adalah proporsi elang dan $x_M$ proporsi merpati. Kebugaran setiap strategi dihitung dari payoff-nya melawan elang dan melawan merpati, masing-masing ditimbang dengan proporsinya di populasi:

<div>
$$
f_E = x_E \cdot \frac{V-C}{2} + x_M \cdot V
$$
</div>

<div>
$$
f_M = x_E \cdot 0 + x_M \cdot \frac{V}{2}
$$
</div>

Kebugaran rata-rata populasi adalah $\phi = x_E f_E + x_M f_M$. Dari satu generasi ke generasi berikutnya, proporsi elang diperbarui dengan aturan berikut:

<div>
$$
x_E^{\text{baru}} = x_E \cdot \frac{f_E}{\phi}
$$
</div>

Arahnya sama dengan rumus dinamika replikator di bagian 4: proporsi elang naik jika $f_E > \phi$ dan turun jika $f_E < \phi$. Pada generasi awal, kebugaran elang adalah $0{,}1 \cdot (-25) + 0{,}9 \cdot 50 = 42{,}5$, kebugaran merpati $0{,}9 \cdot 25 = 22{,}5$, dan rata-ratanya $0{,}1 \cdot 42{,}5 + 0{,}9 \cdot 22{,}5 = 24{,}5$. Proporsi elang pada generasi berikutnya menjadi $0{,}1 \cdot 42{,}5 / 24{,}5 \approx 0{,}1735$, atau 17,35%. Hitungan yang sama, diulang tiap generasi, menghasilkan tabel ini (dibulatkan dua desimal):

| Generasi | Elang | Merpati | Kebugaran elang | Kebugaran merpati | Kebugaran rata-rata |
| --- | --- | --- | --- | --- | --- |
| 0 (awal) | 10,00% | 90,00% | 42,50 | 22,50 | 24,50 |
| 1 | 17,35% | 82,65% | 36,99 | 20,66 | 23,50 |
| 2 | 27,31% | 72,69% | 29,52 | 18,17 | 21,27 |
| 3 | 37,90% | 62,10% | 21,58 | 15,53 | 17,82 |
| 4 | 45,89% | 54,11% | 15,58 | 13,53 | 14,47 |
| 5 | 49,42% | 50,58% | 12,94 | 12,65 | 12,79 |
| 6 | 49,99% | 50,01% | 12,51 | 12,50 | 12,51 |
| 7 | 50,00% | 50,00% | 12,50 | 12,50 | 12,50 |

Pada generasi awal, kebugaran elang (42,50) jauh di atas rata-rata (24,50), sehingga proporsinya naik. Makin banyak elang, kebugaran elang turun sampai sama dengan rata-rata. Dalam contoh ini, sejak generasi ke-7 proporsi elang tertahan di 50,00%. Pada titik itu kebugaran elang ($0{,}5 \cdot (-25) + 0{,}5 \cdot 50 = 12{,}5$) sama dengan kebugaran merpati ($0{,}5 \cdot 25 = 12{,}5$), sehingga tidak ada strategi yang berada di atas rata-rata dan proporsinya berhenti berubah. Inilah keseimbangan campuran elang dan merpati yang disebut di bagian 3 untuk kasus $V < C$.

### 7. Pentingnya Sudut Pandang Evolusioner

Teori Permainan Evolusioner mengajarkan kita bahwa perilaku yang tampak "tidak logis" pada tingkat individu (seperti mengalah atau mengorbankan diri) sering kali merupakan strategi yang sangat stabil dan cerdas pada tingkat populasi.

**Poin Penting untuk Diingat:**

- **ESS** adalah kondisi di mana populasi kebal terhadap "serangan" strategi asing.
- **Kebugaran (Fitness)** adalah mata uang utama, bukan uang atau kepuasan pribadi.
- **Konflik dan Kerjasama** adalah hasil dari interaksi berulang selama jutaan tahun yang terukir dalam mekanisme biologis.

*Latihan Refleksi: Dapatkah kamu memikirkan norma sosial manusia yang mungkin merupakan sebuah ESS? Misalnya, mengapa kita mengantre? Apakah mengantre adalah strategi yang lebih stabil daripada berebut jika semua orang melakukannya?*
