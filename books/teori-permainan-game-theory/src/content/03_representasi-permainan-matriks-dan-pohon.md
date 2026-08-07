## Representasi Permainan: Matriks dan Pohon

Dalam Teori Permainan, cara kita menyajikan sebuah masalah menentukan seberapa mudah kita dapat menyelesaikannya. Bayangkan kamu sedang mencoba menjelaskan strategi bisnis yang kompleks atau taktik dalam sebuah olahraga. Jika kamu menjelaskannya hanya dengan kata-kata, risiko terjadinya salah paham sangat besar.

Representasi visual dan matematis berfungsi sebagai "cetak biru" yang mengubah narasi interaksi sosial atau ekonomi menjadi model yang dapat dihitung dan dianalisis. Terdapat dua format utama yang digunakan oleh para pakar: **Bentuk Normal (Matriks)** dan **Bentuk Ekstensif (Pohon)**.

## 1. Bentuk Normal (Normal Form)

Bentuk Normal, atau sering disebut **Bentuk Strategis**, paling cocok digunakan untuk menggambarkan **permainan simultan**. Dalam jenis permainan ini, semua pemain mengambil keputusan pada waktu yang sama, atau setidaknya tanpa mengetahui apa yang dipilih oleh lawan mereka sebelumnya.

### Komponen Utama

Sebuah permainan dalam bentuk normal terdiri dari tiga elemen dasar ($N, S, P$):

1. **Pemain ($N$):** Siapa saja yang terlibat dalam permainan?
2. **Strategi ($S$):** Daftar lengkap tindakan yang tersedia bagi setiap pemain.
3. **Payoff/Hasil ($P$):** Nilai numerik (utilitas) yang diterima pemain untuk setiap kombinasi strategi yang mungkin.

### Visualisasi: Matriks Payoff

Dalam permainan dua pemain, kita menggunakan tabel (bi-matriks). Pemain 1 biasanya ditempatkan di baris (Row Player), dan Pemain 2 ditempatkan di kolom (Column Player).

**Contoh: Permainan Koordinasi (Battle of the Sexes)** Dua orang ingin bertemu, pilihannya adalah menonton Pertunjukan A atau Pertunjukan B. Mereka lebih suka bersama daripada sendiri.

| Pemain 1 \ Pemain 2 | Pertunjukan A | Pertunjukan B |
| --- | --- | --- |
| **Pertunjukan A** | (3, 2) | (0, 0) |
| **Pertunjukan B** | (0, 0) | (2, 3) |

> **Cara Membaca:** Jika Pemain 1 memilih "Pertunjukan A" dan Pemain 2 memilih "Pertunjukan A", maka hasilnya adalah (3, 2). Angka pertama (**3**) adalah milik Pemain 1, dan angka kedua (**2**) adalah milik Pemain 2.

## 2. Bentuk Ekstensif (Extensive Form)

Bentuk Ekstensif menggunakan diagram **Pohon Permainan (Game Tree)**. Representasi ini jauh lebih kuat untuk menggambarkan **permainan sekuensial**, di mana pemain bergerak secara bergantian dan dapat melihat (atau tidak melihat) langkah sebelumnya.

### Komponen Utama

- **Simpul (Nodes):** Titik di mana seorang pemain harus membuat keputusan.
- **Cabang (Edges/Branches):** Mewakili tindakan atau pilihan yang diambil.
- **Simpul Terminal (Terminal Nodes):** Titik akhir permainan di mana hasil (payoff) diberikan.
- **Himpunan Informasi (Information Sets):** Menunjukkan apakah pemain mengetahui posisi mereka saat ini di dalam pohon tersebut.

### Keunggulan Bentuk Ekstensif

Bentuk ini memungkinkan kita memodelkan konsep waktu dan informasi:

- **Informasi Sempurna (Perfect Information):** Setiap pemain tahu persis apa yang telah dilakukan pemain sebelumnya (misal: Catur).
- **Informasi Tidak Sempurna (Imperfect Information):** Pemain tidak tahu langkah pasti lawan sebelumnya meskipun mereka bergerak secara berurutan. Dalam diagram, ini digambarkan dengan garis putus-putus yang menghubungkan dua simpul keputusan.

### Analogi Pohon Keputusan

> Bayangkan kamu sedang mendaki gunung yang memiliki banyak persimpangan jalan. Setiap papan penunjuk jalan adalah "Simpul Keputusan", dan setiap jalan yang kamu ambil adalah "Cabang". Di puncak gunung, ada harta karun dengan nilai berbeda-beda, itulah "Payoff".

## 3. Kapan Menggunakan Matriks vs. Pohon?

Meskipun setiap permainan bentuk ekstensif dapat dikonversi menjadi bentuk normal, namun tidak selalu efisien untuk dilakukan.

| Karakteristik | Bentuk Normal (Matriks) | Bentuk Ekstensif (Pohon) |
| --- | --- | --- |
| **Waktu Keputusan** | Simultan (Serentak) | Sekuensial (Berurutan) |
| **Fokus Utama** | Strategi akhir dan hasil | Proses dan urutan langkah |
| **Visualisasi** | Tabel dua dimensi | Struktur hierarkis |
| **Kompleksitas** | Mudah untuk 2 pemain, sulit untuk >2 | Lebih fleksibel untuk banyak pemain |

## 4. Kasus Dunia Nyata: Masuknya Perusahaan ke Pasar

Bayangkan sebuah skenario bisnis: **Perusahaan A** (Pendatang Baru) memutuskan apakah akan masuk ke pasar yang dikuasai **Perusahaan B** (Petahana).

1. **Jika A Masuk:** Perusahaan B bisa memilih untuk "Perang Harga" atau "Akomodasi".
2. **Jika A Tetap Keluar:** Perusahaan B tetap menjadi monopoli.

**Dalam Bentuk Ekstensif:** Awalnya ada satu titik (Perusahaan A). Dua cabang keluar: "Masuk" dan "Keluar". Jika "Masuk", muncul titik baru (Perusahaan B) dengan dua cabang: "Lawan" atau "Terima".

**Dalam Bentuk Normal:** Kita bisa memodelkannya sebagai matriks, tetapi kita akan kehilangan nuansa bahwa Perusahaan B baru bertindak *setelah* melihat langkah Perusahaan A.

## 5. Implementasi Teknis (Python)

Dalam dunia data science dan AI, kita sering menggunakan pustaka seperti `Nashpy` untuk merepresentasikan permainan dalam bentuk matriks. Berikut adalah cara mendefinisikan permainan sederhana:

```python
import nashpy as nash
import numpy as np

# Definisikan Payoff untuk Pemain Baris (Pemain 1)
# Contoh: Dilema Tahanan
# Matriks A: [ [-1, -3], [0, -2] ]
A = np.array([[-1, -3], [0, -2]])

# Definisikan Payoff untuk Pemain Kolom (Pemain 2)
# Matriks B: [ [-1, 0], [-3, -2] ]
B = np.array([[-1, 0], [-3, -2]])

# Buat objek permainan
prisoners_dilemma = nash.Game(A, B)

print("Matriks Permainan:")
print(prisoners_dilemma)

# Menemukan Ekuilibrium Nash (akan dibahas di modul selanjutnya)
equilibria = prisoners_dilemma.support_enumeration()
for eq in equilibria:
    print(f"Ekuilibrium ditemukan: {eq}")
```

## 6. Latihan Refleksi

*Coba bayangkan permainan "Batu-Gunting-Kertas".*

1. *Apakah ini lebih cocok digambarkan dengan Matriks atau Pohon? Mengapa?*
2. *Jika kita sepakat pemain tidak boleh melihat tangan satu sama lain, bagaimana kamu menggambarkan "ketidaktahuan" tersebut dalam sebuah pohon permainan?*

> **Poin Penting:** Meskipun visualisasinya berbeda, tujuan akhirnya sama: memetakan setiap kemungkinan pilihan ke sebuah nilai hasil tertentu sehingga kita dapat memprediksi perilaku manusia atau sistem secara rasional.

**Langkah Selanjutnya:** Setelah memahami bagaimana sebuah permainan "digambar", pada bagian selanjutnya kita akan mempelajari bagaimana pemain memilih strategi terbaik mereka melalui konsep **Strategi Dominan**, di mana kita mulai mencari tahu siapa yang akan menang dan mengapa.
