## Elemen Dasar dalam Permainan

Bayangkan kamu sedang duduk di depan papan catur, atau mungkin sedang berada di tengah negosiasi gaji yang alot. Apa kesamaan dari kedua situasi tersebut? Keduanya adalah **permainan**.

Dalam dunia Teori Permainan, sebuah "permainan" bukan hanya sekadar hiburan, melainkan model matematis dari interaksi strategis. Agar sebuah situasi dapat dianalisis menggunakan teori permainan, ia harus memiliki tiga komponen fundamental yang sering disebut sebagai **"The Rules of the Game"**.

Tanpa ketiga elemen ini, kita hanya memiliki aksi acak tanpa tujuan. Tiga elemen mendasar tersebut adalah: **Pemain (Players)**, **Strategi (Strategies)**, dan **Hasil atau Imbalan (Payoffs)**.

### 1. Pemain (Players)

Pemain adalah para pengambil keputusan dalam permainan. Mereka adalah entitas yang bertindak secara rasional untuk memaksimalkan kepentingannya sendiri.

- **Siapa saja mereka?** Pemain tidak selalu berarti individu manusia. Pemain bisa berupa perusahaan yang bersaing di pasar, negara yang sedang bernegosiasi dalam perjanjian iklim, atau bahkan algoritma komputer dalam perdagangan saham otomatis.
- **Jumlah Pemain:** Biasanya dilambangkan dengan $n$. Jika $n = 2$, kita menyebutnya permainan dua pemain (*two-person game*).
- **Asumsi Dasar:** Dalam teori permainan klasik, kita berasumsi bahwa pemain itu **rasional** (memilih tindakan yang memberikan hasil terbaik bagi mereka) dan memiliki **pengetahuan umum** (*common knowledge*) bahwa pemain lain juga rasional.

> **Wawasan Penting:** Karakteristik pemain yang paling utama adalah kemampuan mereka untuk memilih di antara berbagai tindakan yang tersedia. Jika suatu entitas tidak punya pilihan (hanya mengikuti aturan tetap tanpa opsi lain), ia lebih dianggap sebagai bagian dari lingkungan daripada seorang pemain.

### 2. Strategi (Strategies)

Strategi adalah rencana aksi yang **lengkap** dan **menyeluruh**. Ini bukan sekadar satu langkah tunggal, melainkan sebuah instruksi yang memberi tahu pemain apa yang harus dilakukan pada setiap situasi yang mungkin terjadi dalam permainan.

- **Ruang Strategi:** Kumpulan semua strategi yang tersedia bagi pemain $i$ biasanya dilambangkan dengan $S_i$.
- **Contoh Sederhana:** Dalam permainan Gunting-Batu-Kertas, ruang strategi kamu adalah $S = \{\text{Gunting}, \text{Batu}, \text{Kertas}\}$.
- **Strategi vs. Aksi:**
  - **Aksi:** Langkah spesifik pada satu titik waktu (misal: "Saya memindahkan pion ke E4").
  - **Strategi:** Rencana total (misal: "Jika dia menggerakkan kuda, saya akan memindahkan menteri; jika dia menggerakkan pion, saya akan bertahan").

*Jika kamu bermain catur, mampukah kamu menuliskan strategi yang benar-benar lengkap di atas kertas sebelum permainan dimulai? Secara teoritis bisa, namun secara praktis jumlah kombinasinya lebih banyak daripada atom di alam semesta!*

### 3. Hasil atau Imbalan (Payoffs)

Imbalan adalah nilai numerik yang diterima pemain di akhir permainan. Nilai ini mencerminkan tingkat kepuasan, keuntungan, atau utilitas yang diperoleh pemain dari hasil interaksi tersebut.

- **Fungsi Utilitas:** Imbalan biasanya dinyatakan dalam fungsi utilitas $u_i(s_1, s_2, \dots, s_n)$, yang berarti imbalan pemain $i$ bergantung bukan hanya pada strateginya sendiri ($s_i$), tetapi juga pada strategi yang dipilih oleh semua pemain lainnya.
- **Bentuk Imbalan:**
  - Dalam bisnis: **Profit/Laba**.
  - Dalam politik: **Jumlah suara atau kekuasaan**.
  - Dalam biologi: **Tingkat kelangsungan hidup** (*survival rate*).
- **Matriks Imbalan:** Untuk permainan sederhana, imbalan sering ditampilkan dalam tabel (matriks).

**Analogi Sederhana:** Bayangkan pemain sebagai **koki** (*Players*), strategi sebagai **resep** (*Strategies*), dan imbalan sebagai **rating bintang** dari juri (*Payoffs*). Rating yang diterima koki A tidak hanya tergantung pada bumbu yang dia pakai, tapi juga apakah koki B memasak hidangan yang lebih enak atau justru hidangan yang saling melengkapi.

### Contoh Dunia Nyata: Perang Harga Antar Toko

Mari kita terapkan elemen-elemen di atas ke dalam skenario bisnis: **Toko A** dan **Toko B** menjual produk yang sama di jalan yang sama.

1. **Pemain:** Toko A dan Toko B.
2. **Strategi:** Masing-masing memiliki dua pilihan strategi harga: $\{\text{Harga Tinggi}, \text{Harga Murah}\}$.
3. **Imbalan (Profit):**
   - Jika keduanya memasang **Harga Tinggi**, masing-masing mendapat profit Rp10 juta (pasar stabil).
   - Jika keduanya memasang **Harga Murah**, masing-masing mendapat profit Rp5 juta (margin tipis).
   - Jika Toko A **Harga Murah** dan Toko B **Harga Tinggi**, Toko A merebut semua pelanggan dan mendapat Rp15 juta, sementara Toko B mendapat Rp2 juta.

Secara matematis, jika kita melihat dari sudut pandang Toko A, fungsi imbalannya adalah:

$$
u_A(\text{Murah}, \text{Tinggi}) = 15
$$

$$
u_A(\text{Tinggi}, \text{Tinggi}) = 10
$$

### Implementasi Teknis (Konsep Python)

Dalam pemodelan simulasi, kita sering mendefinisikan elemen-elemen ini dalam struktur data. Berikut adalah representasi sederhana bagaimana elemen dasar ini disusun dalam kode:

```python
class GameElement:
    def __init__(self):
        # 1. Pemain (Players)
        self.players = ["Toko_A", "Toko_B"]
        
        # 2. Ruang Strategi (Strategy Space)
        self.strategies = {
            "Toko_A": ["Harga_Tinggi", "Harga_Murah"],
            "Toko_B": ["Harga_Tinggi", "Harga_Murah"]
        }
        
    # 3. Hasil atau Imbalan (Payoffs)
    def get_payoff(self, action_a, action_b):
        # Matriks Imbalan dalam bentuk logika
        if action_a == "Harga_Tinggi" and action_b == "Harga_Tinggi":
            return (10, 10)
        elif action_a == "Harga_Murah" and action_b == "Harga_Tinggi":
            return (15, 2)
        elif action_a == "Harga_Tinggi" and action_b == "Harga_Murah":
            return (2, 15)
        else: # Keduanya Harga Murah
            return (5, 5)

# Simulasi interaksi
game = GameElement()
hasil = game.get_payoff("Harga_Murah", "Harga_Tinggi")
print(f"Hasil Imbalan (Toko A, Toko B): {hasil}")
```

### Ringkasan Strategis

| Elemen | Deskripsi | Pertanyaan Kunci |
| --- | --- | --- |
| **Pemain** | Pengambil keputusan rasional | Siapa yang terlibat dalam interaksi? |
| **Strategi** | Rencana aksi lengkap | Apa saja pilihan yang mungkin diambil? |
| **Imbalan** | Hasil akhir (utilitas) | Apa tujuan akhir atau apa yang mereka dapatkan? |

Memahami ketiga elemen ini adalah fondasi sebelum kita melangkah ke konsep yang lebih kompleks seperti **Ekuilibrium Nash**. Tanpa pemahaman yang kuat tentang siapa yang bermain, apa pilihannya, dan apa tujuannya, analisis strategi akan menjadi bias dan tidak akurat.

> **Ingat:** Dalam teori permainan, keberhasilan kamu tidak hanya ditentukan oleh tindakan kamu sendiri, tetapi juga oleh tindakan orang lain yang berada dalam permainan yang sama. Itulah esensi dari ketergantungan strategis.
