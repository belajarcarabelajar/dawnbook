## Laju Peluruhan dan Waktu Paruh

Pernahkah muncul pertanyaan, jika kita memiliki satu gram zat radioaktif yang memancarkan partikel beta, apakah zat tersebut akan habis dalam sekejap? Ataukah ia akan bertahan selamanya?

Dalam dunia fisika nuklir, kita tidak bisa memprediksi kapan **satu atom spesifik** akan meluruh. Namun, kita bisa memprediksi dengan sangat akurat bagaimana **sekelompok besar atom** akan berperilaku. Inilah keindahan dari statistik peluruhan radioaktif.

### 1. Konsep Dasar: Probabilitas dalam Ketidakpastian

Peluruhan beta adalah proses stokastik (acak). Bayangkan kita memiliki satu juta buah dadu. Setiap kali mengocoknya, dadu yang memunculkan angka 6 dianggap meluruh dan dikeluarkan dari permainan.

- Pada lemparan pertama, banyak dadu yang keluar.
- Seiring berjalannya waktu, jumlah dadu yang tersisa semakin sedikit, sehingga jumlah dadu yang memunculkan angka 6 pada setiap lemparan juga berkurang.

Begitu pulalah cara kerja isotop beta. Laju di mana inti atom meluruh berbanding lurus dengan jumlah inti yang masih ada.

### 2. Hukum Peluruhan Radioaktif

Secara matematis, jika $N$ adalah jumlah inti radioaktif yang ada pada waktu $t$, maka laju perubahannya ($\frac{dN}{dt}$) dinyatakan sebagai:

<div>
$$
\frac{dN}{dt} = -\lambda N
$$
</div>

**Keterangan:**

- $\lambda$ (Lambda): **Konstanta peluruhan**, unik untuk setiap isotop. Ini menunjukkan probabilitas peluruhan per unit waktu.
- Tanda negatif ($-$) menunjukkan bahwa jumlah inti $N$ berkurang seiring bertambahnya waktu.

#### Persamaan Eksponensial

Jika kita mengintegrasikan persamaan di atas, kita mendapatkan rumus utama untuk menghitung jumlah inti yang tersisa:

<div>
$$
N(t) = N_0 e^{-\lambda t}
$$
</div>

Di mana:

- $N(t)$ = Jumlah inti yang tersisa pada waktu $t$.
- $N_0$ = Jumlah inti mula-mula (saat $t = 0$).
- $e$ = Bilangan Euler ($\approx 2.718$).

> **Wawasan Penting:** Karena persamaannya bersifat eksponensial, secara teoritis zat radioaktif tidak akan pernah benar-benar mencapai angka nol (habis total), ia hanya akan terus mendekati nol.

### 3. Waktu Paruh (Half-Life)

**Waktu Paruh ($T_{1/2}$)** adalah waktu yang dibutuhkan oleh separuh dari jumlah atom radioaktif dalam suatu sampel untuk meluruh.

Mari kita turunkan hubungannya dengan konstanta peluruhan. Jika $t = T_{1/2}$, maka $N(t) = \frac{1}{2} N_0$. Masukkan ke dalam persamaan eksponensial:

$\frac{1}{2} N_0 = N_0 e^{-\lambda T_{1/2}} \implies \frac{1}{2} = e^{-\lambda T_{1/2}}$

Dengan menggunakan logaritma natural ($\ln$), kita mendapatkan:

$\ln(2) = \lambda T_{1/2} \implies 0.693 = \lambda T_{1/2}$

Sehingga, rumus untuk mencari Waktu Paruh adalah:

$T_{1/2} = \frac{0.693}{\lambda}$

*Klarifikasi Konsep Waktu Paruh: Apabila sebuah isotop beta memiliki waktu paruh 10 menit dengan sampel awal 1 kg, setelah 10 menit tersisa 500 g. Setelah 20 menit, sampel tidak langsung habis melainkan menyisakan 250 g (setengah dari 500 g).*

### 4. Aktivitas Radiasi

Dalam aplikasi praktis, kita seringkali lebih tertarik pada **Aktivitas ($A$)**, yaitu jumlah peluruhan yang terjadi per detik.

<div>
$$
A(t) = \lambda N(t)
$$
</div>

Satuan Aktivitas:

1. **Becquerel (Bq)**: 1 peluruhan per detik (Satuan SI).
2. **Curie (Ci)**: $3.7 \times 10^{10} \text{ Bq}$ (Berdasarkan aktivitas 1 gram Radium-226).

### 5. Simulasi Perhitungan (Contoh Kasus)

Misalkan kita memiliki isotop **Iodium-131** (pemancar beta yang digunakan dalam pengobatan tiroid) dengan waktu paruh sekitar 8 hari. Jika kita memulai dengan aktivitas $400 \text{ MBq}$, berapakah aktivitasnya setelah 24 hari?

**Langkah-langkah:**

1. Tentukan jumlah waktu paruh yang telah berlalu ($n$): $n = \frac{\text{total waktu}}{\text{waktu paruh}} = \frac{24 \text{ hari}}{8 \text{ hari}} = 3 \text{ siklus}$
2. Gunakan rumus praktis: $A = A_0 \times (\frac{1}{2})^n$
3. $A = 400 \times (\frac{1}{2})^3$
4. $A = 400 \times \frac{1}{8} = 50 \text{ MBq}$

### 6. Implementasi Kode (Python)

Bagi pemelajar yang belajar secara kinestetik melalui pemrograman, berikut adalah cuplikan kode sederhana untuk memvisualisasikan penurunan jumlah atom akibat peluruhan beta:

```python
import numpy as np

def hitung_sisa_inti(N0, waktu_paruh, durasi):
    # Konstanta peluruhan (lambda)
    lam = 0.693 / waktu_paruh
    
    # Menghitung sisa inti menggunakan rumus eksponensial
    Nt = N0 * np.exp(-lam * durasi)
    
    return Nt

# Parameter Contoh: Karbon-14 (Waktu paruh ~5730 tahun)
N_awal = 1000  # Persentase atau jumlah atom
t_paruh = 5730 
t_simulasi = 11460 # Tepat 2 kali waktu paruh

sisa = hitung_sisa_inti(N_awal, t_paruh, t_simulasi)
print(f"Setelah {t_simulasi} tahun, sisa atom: {sisa:.2f}")
# Output yang diharapkan: 250.00
```

### 7. Aplikasi Dunia Nyata: Mengapa Kita Perlu Menghitung Ini?

**Skenario Medis (Brachytherapy):** Dokter menggunakan isotop pemancar beta untuk membunuh sel kanker. Mereka harus menghitung laju peluruhan dengan sangat presisi. Jika laju peluruhan tidak dihitung dengan benar:

- **Terlalu cepat:** Dosis radiasi tidak cukup untuk membunuh tumor.
- **Terlalu lambat:** Pasien terpapar radiasi berbahaya lebih lama dari yang dibutuhkan.

**Skenario Arkeologi (Carbon Dating):** Isotop Karbon-14 meluruh melalui proses beta dengan waktu paruh 5.730 tahun. Dengan mengukur perbandingan Karbon-14 yang tersisa dibandingkan dengan Karbon-12 yang stabil pada artefak kayu kuno, ilmuwan dapat menghitung usia artefak tersebut berdasarkan rumus laju peluruhan di atas.

### Ringkasan Cepat

- **Laju peluruhan** sebanding dengan jumlah inti yang ada.
- **Konstanta peluruhan ($\lambda$)** menentukan seberapa agresif suatu zat meluruh.
- **Waktu paruh ($T_{1/2}$)** adalah durasi di mana sampel berkurang menjadi setengahnya.
- **Aktivitas** diukur dalam Bq, menggambarkan kekuatan pancaran radiasi pada saat tertentu.