## Mekanisme Peluruhan Beta Minus (β−)

Pernahkah terbayang sebuah atom yang tiba-tiba berubah identitasnya? Dalam dunia fisika nuklir, ini bukan sekadar imajinasi. Peluruhan Beta Minus ($\beta^-$) adalah salah satu keajaiban alam di mana sebuah inti atom melakukan transmutasi untuk mencapai kestabilan.

Mari kita selami lebih dalam bagaimana sebuah neutron yang tampak tenang di dalam inti atom bisa berubah menjadi proton dan memancarkan partikel berenergi tinggi.

## Apa Itu Peluruhan Beta Minus?

Secara sederhana, **peluruhan beta minus** adalah proses radioaktif yang terjadi pada inti atom yang memiliki **terlalu banyak neutron** dibandingkan dengan jumlah protonnya (rasio $N/Z$ yang terlalu tinggi).

Untuk mencapai keseimbangan, inti tersebut mengubah salah satu neutronnya menjadi proton. Namun, alam semesta memiliki aturan ketat mengenai kekekalan muatan dan energi. Oleh karena itu, perubahan ini tidak terjadi begitu saja; ia disertai dengan pelepasan dua partikel kecil:

1. **Elektron ($\beta^-$)**: Bergerak dengan kecepatan sangat tinggi.
2. **Antineutrino elektron ($\bar{\nu}_e$)**: Partikel hantu yang hampir tidak bermassa dan tidak bermuatan.

> **Analogi Sederhana:** Bayangkan seorang pemain sepak bola yang kelebihan berat badan (neutron) sehingga gerakannya lambat dan tidak stabil. Untuk menjadi pemain yang lincah dan stabil (proton), ia harus melepaskan beban ekstra (elektron) dan keringat yang tak terlihat (antineutrino). Pemain tersebut tetap orang yang sama di tim, tetapi sifatnya berubah.

## Mekanisme Transformasi: Dari Neutron ke Proton

Mari kita bedah apa yang terjadi di tingkat subatomik. Proses ini digerakkan oleh **Gaya Nuklir Lemah** (*Weak Nuclear Force*), salah satu dari empat gaya fundamental di alam semesta.

### 1. Transformasi Quark

Neutron dan proton tersusun dari partikel yang lebih kecil yang disebut **quark**.

- **Neutron ($n$)** terdiri dari satu quark *up* ($u$) dan dua quark *down* ($d$) $\rightarrow (udd)$.
- **Proton ($p$)** terdiri dari dua quark *up* ($u$) dan satu quark *down* ($d$) $\rightarrow (uud)$.

Dalam peluruhan $\beta^-$, satu quark **down** di dalam neutron berubah menjadi quark **up**. Perubahan identitas quark inilah yang mengubah neutron menjadi proton.

### 2. Persamaan Reaksi Nuklir

Secara matematis, proses dasar ini dapat dituliskan sebagai: $n \rightarrow p + e^- + \bar{\nu}_e$

Di mana:

- $n$ adalah neutron
- $p$ adalah proton
- $e^-$ adalah partikel beta (elektron)
- $\bar{\nu}_e$ adalah antineutrino

### 3. Perubahan Nomor Atom

Karena jumlah proton dalam inti bertambah satu, maka **nomor atom ($Z$)** naik satu tingkat, tetapi **nomor massa ($A$)** tetap sama karena total jumlah nukleon (proton + neutron) tidak berubah.

<div>
$$
{}^{A}_{Z}\text{X} \rightarrow {}^{A}_{Z+1}\text{Y} + e^- + \bar{\nu}_e
$$
</div>

*Latihan Konseptual: Apabila sebuah atom Karbon ($Z = 6$) mengalami peluruhan beta minus, unsur apakah yang terbentuk dari proses transmutasi ini? (Petunjuk: Periksa nomor atom $Z = 7$ pada tabel periodik).*

## Mengapa Antineutrino Harus Ada?

Sebelum tahun 1930-an, para ilmuwan bingung karena energi yang dilepaskan dalam peluruhan beta tampak hilang (tidak sesuai dengan hukum kekekalan energi). Wolfgang Pauli kemudian mengusulkan keberadaan partikel ketiga yang membawa sisa energi tersebut.

Partikel ini disebut **Antineutrino**. Ia tidak membawa muatan listrik dan memiliki massa yang sangat kecil sehingga bisa menembus bumi tanpa menabrak satu atom pun! Inilah alasan mengapa partikel beta (elektron) yang kita deteksi memiliki spektrum energi yang bervariasi, bukan satu angka tetap.

## Contoh Kasus: Peluruhan Karbon-14

Salah satu contoh paling terkenal dari peluruhan $\beta^-$ adalah isotop Karbon-14 yang digunakan dalam penanggalan arkeologi.

<div>
$$
{}^{14}_{6}\text{C} \rightarrow {}^{14}_{7}\text{N} + e^- + \bar{\nu}_e
$$
</div>

1. **Induk**: Karbon-14 memiliki 6 proton dan 8 neutron (tidak stabil).
2. **Proses**: Satu neutron berubah menjadi proton.
3. **Anak**: Menjadi Nitrogen-14 (7 proton, 7 neutron) yang sangat stabil.
4. **Hasil samping**: Sebuah elektron terpental keluar dengan kecepatan mendekati kecepatan cahaya.

## Aplikasi Dunia Nyata (Real-World Applications)

Mekanisme peluruhan $\beta^-$ bukan sekadar teori fisika; ia memiliki kegunaan praktis yang luas:

- **Penanggalan Radiokarbon**: Mengukur sisa Karbon-14 pada fosil atau artefak kayu untuk menentukan usia mereka hingga puluhan ribu tahun.
- **Pengukur Ketebalan Industri**: Partikel beta digunakan di pabrik kertas atau plastik. Sensor mendeteksi berapa banyak elektron yang bisa menembus lembaran; jika terlalu sedikit yang lolos, berarti lembaran tersebut terlalu tebal.
- **Terapi Medis (Brachytherapy)**: Isotop pemancar beta seperti Strontium-90 digunakan untuk mengobati kanker tertentu atau mencegah pertumbuhan jaringan yang tidak diinginkan setelah operasi jantung.

## Simulasi Logika (Code Representation)

Jika kita ingin merepresentasikan perubahan muatan dan nomor atom dalam sebuah fungsi sederhana (misalnya dalam Python), logikanya akan seperti ini:

```python
def beta_minus_decay(element_name, z, a):
    """
    Simulasi perubahan identitas atom pada peluruhan Beta Minus
    """
    original_z = z
    new_z = z + 1  # Proton bertambah
    new_a = a      # Nomor massa tetap
    
    print(f"Unsur Induk: {element_name} (Z={original_z}, A={new_a})")
    print("--- Terjadi Peluruhan Beta Minus ---")
    print(f"Memancarkan: 1 Elektron (Beta) dan 1 Antineutrino")
    print(f"Unsur Anak: (Z={new_z}, A={new_a})")
    
    return new_z, new_a

# Contoh pada Karbon-14
beta_minus_decay("Karbon", 6, 14)
```

## Ringkasan Singkat

- **Pemicu**: Terlalu banyak neutron ($N/Z$ tinggi).
- **Proses Inti**: $n \rightarrow p$.
- **Partikel yang Dipancarkan**: Elektron ($\beta^-$) dan Antineutrino ($\bar{\nu}_e$).
- **Hasil Akhir**: Nomor atom bertambah 1 ($Z+1$), nomor massa tetap ($A$).
- **Gaya yang Bekerja**: Gaya Nuklir Lemah.

> **Pesan Penting:** Peluruhan beta minus adalah cara alam semesta mendaur ulang ketidakstabilan menjadi kestabilan, membuktikan bahwa identitas sebuah materi tidaklah absolut, melainkan dinamis.