## Strategi Campuran (Mixed Strategies): Seni Menjadi Tidak Terduga

Bayangkan kamu sedang bermain **Batu-Gunting-Kertas**. Jika kamu selalu mengeluarkan "Batu", lawan kamu akan dengan mudah mengalahkan kamu dengan "Kertas". Jika kamu beralih ke pola yang terbaca (misalnya: Batu, lalu Gunting, lalu Kertas), lawan yang cerdas akan segera menyadari pola tersebut dan mengeksploitasinya.

Dalam situasi ini, satu-satunya cara untuk tidak bisa dikalahkan secara konsisten adalah dengan menjadi **acak**. Inilah inti dari **Strategi Campuran** (*Mixed Strategies*).

### 1. Mengapa Strategi Murni Terkadang Gagal?

Dalam bab sebelumnya, kita mempelajari **Strategi Murni** (*Pure Strategies*), di mana seorang pemain memilih satu tindakan spesifik dengan kepastian 100%. Namun, dalam banyak permainan kompetitif, terutama yang bersifat *zero-sum* (keuntungan satu pihak adalah kerugian pihak lain), Ekuilibrium Nash dalam strategi murni sering kali tidak ditemukan.

**Analogi: Penjaga Gawang vs. Penendang Penalti**  
Seorang penendang penalti (*Striker*) bisa menendang ke kiri atau ke kanan. Seorang kiper bisa melompat ke kiri atau ke kanan.

- Jika kiper tahu striker akan menendang ke kiri, kiper akan melompat ke kiri.
- Jika striker tahu kiper akan melompat ke kiri, striker akan menendang ke kanan.
- Jika kiper tahu striker akan menendang ke kanan, kiper akan melompat ke kanan.

Tidak ada titik "diam" di sini. Setiap kali satu pemain menetapkan satu pilihan pasti, pemain lain memiliki insentif untuk mengubah pilihannya. Inilah saat kita membutuhkan **Strategi Campuran**.

### 2. Definisi Strategi Campuran

**Strategi Campuran** adalah sebuah strategi di mana pemain menetapkan **probabilitas** untuk setiap strategi murni yang tersedia. Bukannya memilih satu aksi secara permanen, pemain "mengocok" pilihan mereka berdasarkan distribusi peluang tertentu.

> **Definisi Formal:** Jika seorang pemain memiliki strategi murni $S_1, S_2, \dots, S_n$, maka strategi campuran adalah vektor probabilitas $P = (p_1, p_2, \dots, p_n)$ sedemikian sehingga:
>
> $$
> \sum_{i=1}^{n} p_i = 1 \quad \text{dan} \quad p_i \geq 0
> $$

Dalam Batu-Gunting-Kertas, Ekuilibrium Nash tercapai ketika setiap pemain memilih masing-masing pilihan dengan probabilitas tepat $1/3$. Jika kamu melakukan ini, lawan kamu tidak bisa mendapatkan keuntungan lebih, apa pun strategi yang mereka gunakan.

### 3. Menghitung Ekuilibrium Strategi Campuran

Bagaimana kita menentukan probabilitas yang tepat? Kuncinya adalah **Prinsip Indiferensi** (*Indifference Principle*).

Agar sebuah strategi campuran menjadi Ekuilibrium Nash, probabilitas yang kamu pilih harus membuat lawan kamu merasa **sama saja** (*indifferent*) antara pilihan-pilihan yang mereka miliki. Jika lawan merasa satu pilihan lebih menguntungkan daripada yang lain, mereka akan mengeksploitasi pilihan itu, dan strategi kamu belum optimal.

#### Contoh Kasus: Permainan "Matching Pennies"

Dua pemain, A dan B, masing-masing menaruh koin di meja secara sembunyi-sembunyi (Angka atau Gambar).

- Jika koin **cocok** (A: Angka, B: Angka), Pemain A menang (mendapat 1 poin dari B).
- Jika koin **berbeda** (A: Angka, B: Gambar), Pemain B menang (mendapat 1 poin dari A).

**Matriks Hasil (*Payoff Matrix*):**

| Pemain A \ Pemain B | Angka ($q$) | Gambar ($1-q$) |
| --- | --- | --- |
| **Angka ($p$)** | (1, -1) | (-1, 1) |
| **Gambar ($1-p$)** | (-1, 1) | (1, -1) |

*Mari kita hitung probabilitas $p$ untuk Pemain A:*

1. Hitung ekspektasi hasil (*Expected Payoff*) Pemain B jika dia memilih Angka:

   $$
   E_B(\text{Angka}) = p(-1) + (1-p)(1) = 1 - 2p
   $$

2. Hitung ekspektasi hasil Pemain B jika dia memilih Gambar:

   $$
   E_B(\text{Gambar}) = p(1) + (1-p)(-1) = 2p - 1
   $$

3. Buat Pemain B tidak peduli (*indifferent*) dengan menyamakan keduanya:

   $$
   1 - 2p = 2p - 1
   $$

   $$
   2 = 4p
   $$

   $$
   p = 0{,}5
   $$

Artinya, Pemain A harus memilih Angka 50% dari waktu dan Gambar 50% dari waktu agar Pemain B tidak bisa memprediksi dan memenangkan permainan.

### 4. Implementasi dalam Kode (Python)

Dalam dunia nyata, kita bisa menggunakan pustaka seperti `Nashpy` untuk mencari ekuilibrium strategi campuran secara otomatis.

```python
import nashpy as nash
import numpy as np

# Membuat matriks payoff untuk Matching Pennies
# Pemain A (Baris), Pemain B (Kolom)
A = np.array([[1, -1], [-1, 1]])
B = np.array([[-1, 1], [1, -1]])

# Inisialisasi permainan
matching_pennies = nash.Game(A, B)

# Menghitung Ekuilibrium Nash
equilibria = matching_pennies.support_enumeration()

print("Ekuilibrium Strategi Campuran:")
for eq in equilibria:
    print(f"Pemain A: {eq[0]}")
    print(f"Pemain B: {eq[1]}")
```

*Hasilnya akan menunjukkan bahwa kedua pemain harus memilih masing-masing aksi dengan peluang 0,5.*

### 5. Aplikasi Dunia Nyata dan Kasus Praktis

Strategi campuran bukan sekadar teori matematika, melainkan alat pertahanan dan optimasi di dunia nyata.

#### A. Keamanan Siber dan Audit

Bayangkan tim IT yang harus memeriksa peladen (*server*) dari serangan. Jika mereka selalu memeriksa peladen yang sama pada jam yang sama, peretas akan menyerang peladen lain.

- **Aplikasi:** Auditor pajak atau petugas keamanan bandara menggunakan algoritma strategi campuran untuk menentukan jadwal inspeksi secara acak sehingga pelaku kejahatan tidak bisa menemukan celah waktu atau lokasi yang aman.

#### B. Strategi Olahraga

Dalam tenis, jika seorang pemain selalu melakukan servis *wide* (melebar) saat poin kritis, lawan akan bersiap di posisi tersebut.

- **Fakta Menarik:** Penelitian terhadap data servis tenis profesional menunjukkan bahwa pemain papan atas dunia memiliki distribusi servis yang mendekati Ekuilibrium Nash strategi campuran, sehingga servis mereka hampir tidak mungkin diprediksi secara statistik.

#### C. Penegakan Hukum

Polisi lalu lintas tidak bisa berjaga di setiap sudut jalan setiap saat. Dengan menggunakan strategi campuran, mereka dapat membagi personel secara acak di berbagai titik rawan. Ketidakpastian ini memaksa pengemudi untuk tetap patuh di mana pun mereka berada karena siapa tahu ada polisi di sana.

### 6. Ringkasan Visual

| Aspek | Strategi Murni | Strategi Campuran |
| --- | --- | --- |
| **Kepastian** | Deterministik (Pasti) | Probabilistik (Peluang) |
| **Kapan Digunakan** | Saat ada satu pilihan terbaik yang stabil | Saat tidak ada ekuilibrium tunggal/perlu mengejutkan lawan |
| **Tujuan Utama** | Memaksimalkan hasil langsung | Mencegah eksploitasi oleh lawan |
| **Contoh** | Membeli barang termurah | Menentukan rute patroli keamanan |

### 7. Refleksi dan Latihan

- **Pertanyaan Refleksi:** *Dalam kehidupan sehari-hari, pernahkah kamu sengaja bersikap tidak terduga agar orang lain tidak bisa menebak langkahmu? Apakah itu secara tidak sadar merupakan bentuk strategi campuran?*

**Latihan Cepat:** Dalam permainan Batu-Gunting-Kertas, jika lawan kamu ternyata sangat sering mengeluarkan **Batu** (misal 60% waktu), apa yang harus kamu lakukan dengan strategi campuranmu untuk mengeksploitasi kelemahan tersebut? *(Petunjuk: Kamu tidak lagi harus 1/3, 1/3, 1/3. Kamu harus menyesuaikan probabilitasmu untuk lebih sering mengeluarkan Kertas!)*

> **Pesan Utama:** Strategi campuran mengajarkan kita bahwa dalam dunia yang kompetitif, **ketidakpastian adalah aset**. Dengan menjadi acak secara terukur, kamu menciptakan pertahanan yang solid terhadap lawan yang paling cerdas sekalipun.
