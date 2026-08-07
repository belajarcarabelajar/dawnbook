## Dilema Tahanan (Prisoner's Dilemma)

Bayangkan kamu dan rekanmu tertangkap oleh polisi karena dicurigai melakukan kejahatan besar. Kamu berdua dibawa ke ruangan interogasi yang terpisah. Kamu tidak bisa berkomunikasi satu sama lain. Jaksa memberikan tawaran yang sama kepada kamu berdua:

1. Jika kamu **mengaku** dan rekanmu **diam**, kamu bebas, dan rekanmu dipenjara 10 tahun.
2. Jika kamu **diam** dan rekanmu **mengaku**, kamu dipenjara 10 tahun, dan rekanmu bebas.
3. Jika kalian berdua **mengaku**, kalian berdua dipenjara 5 tahun.
4. Jika kalian berdua tetap **diam**, kalian berdua hanya dipenjara 1 tahun (atas tuduhan ringan).

Apa yang akan kamu lakukan? Inilah inti dari **Dilema Tahanan**, sebuah paradoks dalam Teori Permainan yang menunjukkan mengapa kerja sama sulit dicapai bahkan ketika itu menguntungkan semua pihak.

### Representasi Matriks Hasil (Payoff Matrix)

Untuk menganalisis ini secara ilmiah, kita menggunakan **Bentuk Normal** atau matriks. Angka dalam kurung menunjukkan jumlah tahun penjara (semakin kecil angkanya, semakin baik hasilnya bagi pemain).

| Tahanan A \ Tahanan B | Tetap Diam (Kerja Sama) | Mengaku (Berkhianat) |
| --- | --- | --- |
| **Tetap Diam (Kerja Sama)** | (1, 1) | (10, 0) |
| **Mengaku (Berkhianat)** | (0, 10) | (5, 5) |

> **Intisari:** Dilema ini muncul karena pengejaran kepentingan pribadi secara rasional justru membawa hasil yang lebih buruk bagi semua orang secara kolektif.

### Logika di Balik Pengkhianatan

Mari kita bedah pola pikir Tahanan A secara rasional:

1. **Jika Tahanan B tetap diam:** Pilihan terbaik saya adalah **Mengaku** (0 tahun daripada 1 tahun).
2. **Jika Tahanan B mengaku:** Pilihan terbaik saya juga **Mengaku** (5 tahun daripada 10 tahun).

Apa pun yang dilakukan Tahanan B, pilihan terbaik bagi Tahanan A adalah **Mengaku**. Dalam Teori Permainan, ini disebut sebagai **Strategi Dominan**. Karena Tahanan B juga memiliki logika yang sama, mereka berdua akhirnya akan mengaku.

#### Ekuilibrium Nash vs. Optimalitas Pareto

- **Ekuilibrium Nash:** Terjadi pada titik (Mengaku, Mengaku) dengan hasil (5, 5). Tidak ada pemain yang ingin mengubah keputusannya secara sepihak.
- **Optimalitas Pareto:** Terjadi pada titik (Diam, Diam) dengan hasil (1, 1). Ini adalah hasil yang secara kolektif jauh lebih baik, namun tidak stabil secara strategis karena adanya godaan untuk berkhianat.

### Definisi Matematis

Secara formal, sebuah permainan dikategorikan sebagai Dilema Tahanan jika hasil (*payoffs*) memenuhi kondisi berikut:

- $T$ = *Temptation* (Godaan untuk berkhianat): 0 tahun
- $R$ = *Reward* (Imbalan kerja sama): 1 tahun
- $P$ = *Punishment* (Hukuman bagi keduanya): 5 tahun
- $S$ = *Sucker’s payoff* (Hukuman bagi yang ditipu): 10 tahun

Agar menjadi Dilema Tahanan, urutan preferensi haruslah: $T < R < P < S$ *(Catatan: Karena ini adalah tahun penjara, angka yang lebih kecil lebih diinginkan).*

Selain itu, untuk permainan berulang, terdapat syarat tambahan:

$$
\frac{T + S}{2} > R
$$

Artinya, bergiliran berkhianat tidak boleh lebih menguntungkan daripada kerja sama yang konsisten.

### Aplikasi Dunia Nyata

Dilema Tahanan bukan sekadar teka-teki logika; ini adalah model untuk memahami kegagalan kerja sama di berbagai bidang.

#### 1. Perang Iklan (Bisnis)

Dua perusahaan besar (misalnya Coca-Cola dan Pepsi) mempertimbangkan anggaran iklan. Jika keduanya tidak beriklan, mereka menghemat biaya dan membagi pasar. Namun, jika satu beriklan besar-besaran sementara yang lain tidak, yang beriklan akan merebut pasar. Akhirnya, keduanya beriklan secara agresif hanya untuk mempertahankan pangsa pasar mereka, sehingga keuntungan keduanya menurun karena biaya iklan yang tinggi.

#### 2. Perlombaan Senjata (Politik Internasional)

Dua negara merasa lebih aman jika memiliki nuklir. Jika Negara A membangun nuklir dan Negara B tidak, Negara A mendominasi. Akibatnya, kedua negara menghabiskan miliaran dolar untuk membangun senjata, padahal mereka akan jauh lebih aman dan kaya jika keduanya sepakat untuk tidak memilikinya.

#### 3. Perubahan Iklim (Lingkungan)

Setiap negara diuntungkan jika semua negara mengurangi emisi karbon. Namun, secara individu, setiap negara memiliki insentif untuk terus menggunakan energi murah (fosil) demi pertumbuhan ekonomi sambil berharap negara lain melakukan penghematan. Hasilnya? Polusi global terus meningkat.

### Simulasi Sederhana dengan Kode (Python)

Berikut adalah cuplikan kode sederhana untuk memvisualisasikan bagaimana keputusan diambil berdasarkan matriks Dilema Tahanan:

```python
def prisoner_dilemma(player_a_choice, player_b_choice):
    # Definisi hasil (tahun penjara)
    # Choice: 'C' (Cooperate/Diam), 'D' (Defect/Mengaku)
    outcomes = {
        ('C', 'C'): (1, 1),
        ('C', 'D'): (10, 0),
        ('D', 'C'): (0, 10),
        ('D', 'D'): (5, 5)
    }
    return outcomes[(player_a_choice, player_b_choice)]

# Skenario: Keduanya bertindak rasional demi kepentingan pribadi
decision_a = 'D' # Mengaku
decision_b = 'D' # Mengaku

result = prisoner_dilemma(decision_a, decision_b)
print(f"Hasil akhir: Tahanan A {result[0]} tahun, Tahanan B {result[1]} tahun.")
```

### Cara Mengatasi Dilema

Jika secara logika kita akan selalu berakhir pada pengkhianatan, bagaimana masyarakat bisa berfungsi? Para ilmuwan menemukan beberapa cara untuk memicu kerja sama:

- **Iterasi (Pengulangan):** Jika permainan dilakukan berulang kali, pemain akan takut pada pembalasan di masa depan (*tit-for-tat*).
- **Reputasi:** Dalam komunitas kecil, pengkhianat akan dikucilkan.
- **Kontrak Hukum:** Pemerintah menciptakan aturan yang menghukum mereka yang "berkhianat" (seperti denda bagi perusahaan yang melakukan monopoli).

Pernahkah kamu berada dalam situasi kerja kelompok ketika kamu melakukan semua pekerjaan sementara temanmu mendapatkan nilai yang sama tanpa berusaha? Itulah Dilema Tahanan dalam kehidupan sekolah! Mengapa kamu tetap mau bekerja sama meskipun ada risiko temanmu menjadi "free rider"?

> **Penting:** Kepercayaan (Trust) adalah komoditas ekonomi yang paling berharga. Tanpa mekanisme untuk mengatasi Dilema Tahanan, kolaborasi manusia akan runtuh.
