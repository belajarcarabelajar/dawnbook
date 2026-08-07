## Strategi Dominan dan Dominasi: Kunci Menuju Keputusan Rasional

Dalam hiruk-pikuk pengambilan keputusan strategis, sering kali kita merasa pusing dengan banyaknya kemungkinan langkah yang bisa diambil oleh lawan. Namun, bagaimana jika ada sebuah langkah yang **selalu** lebih baik dari langkah lainnya, apa pun yang dilakukan orang lain? Inilah inti dari **Strategi Dominan**.

Memahami strategi dominan bukan hanya tentang memenangkan permainan, tetapi tentang menyederhanakan kompleksitas dunia nyata menjadi pilihan-pilihan yang logis dan tak terbantahkan.

### 1. Apa Itu Strategi Dominan?

**Strategi Dominan** adalah strategi yang memberikan hasil (payoff) tertinggi bagi seorang pemain dibandingkan dengan strategi lainnya, terlepas dari apa yang dipilih oleh pemain lawan.

Bayangkan kamu adalah seorang siswa yang sedang bersiap menghadapi ujian.

- **Strategi A:** Belajar dengan giat.
- **Strategi B:** Tidak belajar sama sekali.

Jika ujiannya sulit, belajar (A) memberikan hasil lebih baik daripada tidak belajar (B). Jika ujiannya mudah, belajar (A) tetap memberikan hasil yang lebih baik (nilai sempurna) dibandingkan tidak belajar. Dalam skenario ini, "Belajar" adalah **Strategi Dominan** kamu.

#### Definisi Formal

Secara matematis, misalkan $u_i(s_i, s_{-i})$ adalah fungsi utilitas (hasil) untuk pemain $i$ dengan strategi $s_i$ dan strategi lawan $s_{-i}$.

Strategi $s_i^*$ dikatakan **dominan secara ketat (strictly dominant)** jika:

$$
u_i(s_i^*, s_{-i}) > u_i(s_i, s_{-i})
$$

untuk semua strategi alternatif $s_i$ dan semua kemungkinan strategi lawan $s_{-i}$.

### 2. Dominasi Ketat vs. Dominasi Lemah

Tidak semua dominasi diciptakan sama. Dalam teori permainan, kita membedakan keduanya berdasarkan "kekuatan" keunggulannya.

#### A. Strategi Dominan Ketat (Strictly Dominant)

Strategi ini **selalu memberikan hasil yang lebih besar** daripada strategi lainnya. Tidak ada satu pun kondisi di mana strategi lain bisa menyamai atau melampaui hasilnya.

> **Pesan Penting:** Jika seorang pemain memiliki strategi dominan ketat, seorang pemain yang rasional **pasti** akan memilihnya.

#### B. Strategi Dominan Lemah (Weakly Dominant)

Strategi $s_i^*$ dikatakan dominan lemah jika ia memberikan hasil yang **setidaknya sama baiknya** dengan strategi lain, dan dalam setidaknya satu situasi, ia memberikan hasil yang **lebih baik**. Secara matematis:

$$
u_i(s_i^*, s_{-i}) \geq u_i(s_i, s_{-i})
$$

*Sebagai ilustrasi: Dalam dunia investasi, jika ada instrumen yang memberikan bunga 5% dengan risiko nol, dan instrumen lain memberikan bunga 5% tapi dengan risiko tinggi, mana yang akan kamu pilih? Instrumen tanpa risiko adalah strategi dominan lemah.*

### 3. Strategi yang Didominasi (Dominated Strategies)

Jika strategi dominan adalah "pemenang mutlak", maka **Strategi yang Didominasi** adalah "pecundang mutlak". Ini adalah strategi yang selalu memberikan hasil yang lebih buruk daripada setidaknya satu strategi lain yang tersedia.

**Mengapa ini penting?** Pemain yang rasional tidak akan pernah memilih strategi yang didominasi. Dengan mengenali strategi ini, kita dapat membuangnya dari pertimbangan, sehingga permainan yang kompleks menjadi jauh lebih sederhana.

### 4. Eliminasi Iteratif Strategi yang Didominasi (IESDS)

Ini adalah teknik detektif dalam teori permainan. **Iterated Elimination of Strictly Dominated Strategies (IESDS)** adalah proses menghapus strategi yang didominasi secara bertahap untuk menemukan solusi permainan.

#### Langkah-langkah IESDS:

1. Lihat dari perspektif Pemain 1: Adakah strategi yang selalu memberikan hasil lebih buruk daripada strategi lainnya? Jika ada, hapus baris tersebut.
2. Lihat dari perspektif Pemain 2: Dengan sisa strategi yang ada, adakah strategi yang selalu memberikan hasil lebih buruk? Jika ada, hapus kolom tersebut.
3. Ulangi proses ini sampai tidak ada lagi strategi yang bisa dieliminasi.

#### Contoh Matriks (Game Iklan)

Dua perusahaan, A dan B, memutuskan apakah akan beriklan (I) atau tidak (TI).

| Perusahaan A \ B | Beriklan (I) | Tidak Iklan (TI) |
| --- | --- | --- |
| **Beriklan (I)** | (50, 50) | (90, 20) |
| **Tidak Iklan (TI)** | (20, 90) | (70, 70) |

**Analisis untuk Perusahaan A:**

- Jika B beriklan: I (50) > TI (20)
- Jika B tidak iklan: I (90) > TI (70)

Kesimpulan: Strategi **Beriklan** adalah strategi dominan ketat bagi A. Strategi **Tidak Iklan** didominasi secara ketat dan bisa kita hapus.

Karena Perusahaan B juga rasional dan memiliki struktur payoff yang sama, mereka juga akan mengeliminasi "Tidak Iklan". Hasil akhirnya adalah (50, 50).

### 5. Implementasi Kode: Mendeteksi Dominasi

Berikut adalah contoh sederhana menggunakan Python untuk memeriksa apakah suatu strategi dalam matriks payoff mendominasi strategi lainnya.

```python
def check_dominance(player_payoffs):
    """
    Memeriksa apakah ada strategi yang mendominasi strategi lain.
    player_payoffs: list of lists (baris adalah strategi)
    """
    num_strategies = len(player_payoffs)
    dominated_indices = []

    for i in range(num_strategies):
        for j in range(num_strategies):
            if i == j: continue
            
            # Cek apakah strategi j mendominasi strategi i secara ketat
            is_dominated = all(player_payoffs[i][k] < player_payoffs[j][k] 
                               for k in range(len(player_payoffs[0])))
            
            if is_dominated:
                print(f"Strategi {i} didominasi secara ketat oleh Strategi {j}")
                dominated_indices.append(i)
                break
                
    return list(set(dominated_indices))

# Contoh Payoff Pemain A
# Baris 0: Strategi A1, Baris 1: Strategi A2
# Kolom: Respons Pemain B
payoffs_A = [
    [50, 90], # Strategi Beriklan
    [20, 70]  # Strategi Tidak Iklan
]

check_dominance(payoffs_A)
```

### 6. Aplikasi Dunia Nyata

#### A. Perang Harga di Supermarket

Dua supermarket besar yang berdekatan sering kali terjebak dalam strategi dominan untuk menurunkan harga. Meskipun keduanya akan untung lebih besar jika menjaga harga tetap tinggi, menurunkan harga sering kali menjadi strategi dominan karena jika lawan menurunkan harga dan kamu tidak, kamu akan kehilangan semua pelanggan.

#### B. Perlombaan Senjata (Arms Race)

Dalam politik internasional, dua negara mungkin merasa bahwa membangun senjata nuklir adalah strategi dominan. Jika lawan membangun senjata, kamu harus membangunnya agar tidak kalah. Jika lawan tidak membangun, kamu membangunnya agar menjadi lebih kuat. Inilah yang menjelaskan mengapa eliminasi strategi yang didominasi bisa mengarah pada hasil yang tidak optimal secara kolektif (tragedi bersama).

#### C. Sistem Lelang

Dalam lelang tertutup (Vickrey Auction), menawar sesuai dengan nilai asli barang bagi kamu (true valuation) adalah strategi dominan lemah. Kamu tidak akan pernah rugi dengan menawar sesuai nilai asli, karena menawar lebih tinggi bisa membuat kamu membayar lebih mahal dari nilai barang, dan menawar lebih rendah hanya memperkecil peluang menang tanpa mengubah harga yang harus dibayar.

### 7. Kesimpulan & Refleksi

Memahami strategi dominan membantu kita untuk memprediksi perilaku dalam situasi kompetitif. Jika lawanmu memiliki strategi dominan, kamu bisa berasumsi dengan yakin bahwa mereka akan mengambil langkah tersebut.

*Renungkan hal ini: Dalam kehidupan sehari-hari, apakah kamu sering mengambil keputusan berdasarkan apa yang orang lain lakukan, atau apakah kamu memiliki "Strategi Dominan" yang tetap kamu jalankan apa pun situasinya?*

> **Insight Utama:** Menemukan strategi dominan adalah langkah pertama dalam memecahkan permainan apa pun. Jika kamu tidak menemukannya, barulah kita beralih ke konsep yang lebih dalam seperti Ekuilibrium Nash.
