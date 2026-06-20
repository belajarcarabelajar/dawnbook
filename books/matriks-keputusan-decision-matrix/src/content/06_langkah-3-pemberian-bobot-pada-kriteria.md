## Langkah 3: Pemberian Bobot pada Kriteria

Setelah kamu berhasil mengidentifikasi berbagai pilihan (alternatif) dan menentukan kriteria apa saja yang akan dinilai, kini saatnya masuk ke tahap yang paling menentukan objektivitas analisismu: **Pemberian Bobot (Weighting)**.

Dalam pembuatan **matriks keputusan (decision matrix)**, tidak semua **kriteria penilaian** diciptakan sama. Jika kamu sedang memilih mobil, mungkin aspek keamanan jauh lebih penting bagimu daripada warna eksterior. Pemberian bobot adalah cara kita memberikan nilai numerik pada tingkat kepentingan tersebut agar keputusan akhir menghasilkan **skor berbobot** yang mencerminkan prioritasmu yang sebenarnya.

### Mengapa Pemberian Bobot Begitu Penting?

Tanpa bobot, setiap kriteria dianggap memiliki pengaruh yang sama (bobot rata). Ini sering kali menyesatkan.

> **Analogi Masakan:** Bayangkan kamu sedang membuat sup. Garam dan merica adalah bumbu (kriteria), tetapi jumlah (bobot) yang kamu masukkan tentu berbeda. Jika kamu memasukkan garam sebanyak air sup, masakan tersebut akan rusak. Begitu pula dalam pengambilan keputusan; memberikan bobot yang salah akan menghasilkan keputusan yang "terlalu asin" or tidak seimbang.

### Metodologi Pemberian Bobot

Ada dua pendekatan utama yang sering digunakan untuk menentukan tingkat kepentingan relatif setiap kriteria:

#### 1. Sistem Persentase (Total 100%)

Metode ini paling populer karena sangat intuitif. Kamu mendistribusikan total 100% ke seluruh kriteria yang ada.

- **Aturan Main:** Semua nilai bobot yang didistribusikan harus berjumlah tepat 100% atau 1,0.
- **Kelebihan utama:** Sangat mudah divisualisasikan serta memberikan gambaran instan mengenai porsi kepentingan masing-masing kriteria.

**Contoh Matematis:** Jika kamu memiliki 3 kriteria: Harga, Kualitas, dan Desain.

- Harga: \\( 0.5 \\) (atau setara dengan \\( 50\\% \\) dari total prioritas)
- Kualitas produk: \\( 0.3 \\) (mengambil porsi \\( 30\\% \\))
- Desain estetika: \\( 0.2 \\) (sisa porsi \\( 20\\% \\))
- **Total:** \\( \\sum w = 1.0 \\)

#### 2. Skala Prioritas (1 - 5 atau 1 - 10)

Dalam metode ini, kamu memberikan angka pada setiap kriteria berdasarkan skala tertentu (misalnya 1 = tidak penting, 5 = sangat penting).

- **Normalisasi Nilai:** Setelah memberikan angka kasar, kamu harus melakukan proses normalisasi agar jumlah seluruh bobot tepat bernilai 1,0.
- **Rumus Normalisasi:**
  \\[ w_i = \\frac{p_i}{\\sum_{j=1}^{n} p_j} \\]
  Di mana:
  - \\( w_i \\) = Bobot kriteria ke-\\( i \\) (setelah dinormalisasi)
  - \\( p_i \\) = Skor kepentingan kriteria ke-\\( i \\)
  - \\( \\sum p_j \\) = Total jumlah skor dari semua kriteria yang ada

### Langkah-Langkah Praktis Menentukan Bobot

1. **Refleksi Kebutuhan Nyata:** Tanyakan pada diri sendiri atau tim, "Jika harus mengorbankan satu kriteria demi kriteria lain, mana yang paling wajib dipertahankan?"
2. **Pengurutan Prioritas:** Urutkan kriteria mulai dari yang paling vital hingga yang sekadar opsional.
3. **Alokasi Nilai:** Terapkan salah satu metode (sistem persentase atau skala prioritas).
   - *Tips penting:* Hindari memberikan nilai bobot yang seragam untuk semua kriteria. Jika semuanya dianggap sama penting, esensi dari analisis terstruktur ini akan hilang.
4. **Uji Kelayakan Logika:** Lakukan evaluasi ulang. Apakah kriteria dengan bobot tertinggi benar-benar mencerminkan faktor penentu keputusanmu? Misalnya, jika kriteria "Biaya" mendapatkan bobot \\( 70\\% \\), artinya kamu sangat sensitif terhadap harga dan siap mengabaikan faktor kualitas demi menekan pengeluaran.

### Real-World Application: Memilih Vendor Software IT

Mari kita lihat bagaimana sebuah perusahaan memberikan bobot saat memilih vendor perangkat lunak untuk sistem manajemen inventaris mereka.

| Kriteria | Skor Kepentingan (1-10) | Bobot Terkalkulasi (Normalisasi) |
| --- | --- | --- |
| Keamanan Data | 10 | \\( 10 / 25 = 0.40 \\) (\\( 40\\% \\)) |
| Kemudahan Penggunaan | 7 | \\( 7 / 25 = 0.28 \\) (\\( 28\\% \\)) |
| Biaya Langganan | 5 | \\( 5 / 25 = 0.20 \\) (\\( 20\\% \\)) |
| Dukungan Pelanggan | 3 | \\( 3 / 25 = 0.12 \\) (\\( 12\\% \\)) |
| **Total** | **25** | **1.00 (100%)** |

**Skenario:** Dalam kasus di atas, manajemen memutuskan bahwa **Keamanan Data** adalah harga mati (skor 10). Meskipun sebuah software sangat murah (Biaya), jika keamanannya buruk, bobot \\( 40\\% \\) pada keamanan akan langsung menurunkan skor total vendor tersebut secara drastis.

### Implementasi Teknis (Python Snippet)

Bagi pengembang atau analis data, proses normalisasi bobot dapat diotomatisasi dengan kode sederhana berikut:

```python
# Daftar skor kepentingan kriteria (Skala 1-10)
scores = {
    "Keamanan": 10,
    "Usability": 7,
    "Biaya": 5,
    "Support": 3
}

def calculate_weights(criteria_scores):
    total_score = sum(criteria_scores.values())
    # Menghitung bobot normalisasi untuk setiap kriteria
    normalized_weights = {k: round(v / total_score, 2) for k, v in criteria_scores.items()}
    return normalized_weights

weights = calculate_weights(scores)
print(f"Bobot Akhir: {weights}")
# Output: {'Keamanan': 0.4, 'Usability': 0.28, 'Biaya': 0.2, 'Support': 0.12}
```

### Tantangan dalam Pemberian Bobot

- **Confirmation Bias:** Ada kecenderungan psikologis untuk sengaja meninggikan bobot kriteria tertentu demi memenangkan opsi favorit sejak awal.
  - *Evaluasi kembali:* Apakah bobot ini didasarkan pada kebutuhan objektif yang nyata, atau hanya trik agar pilihan yang disukai secara emosional keluar sebagai pemenang?
- **Kriteria yang Tumpang Tindih:** Ketika dua kriteria terlalu mirip, mereka akan memecah dan mendistorsi nilai bobot sesungguhnya. Selalu pastikan kriteria penilaian bersifat independen satu sama lain.

Nilai bobot bukanlah angka statis yang berlaku selamanya, melainkan refleksi dinamis dari strategi yang berjalan. Sebagai contoh, di tahun ini prioritas utama mungkin terletak pada pertumbuhan sehingga kriteria tersebut mendapat bobot \\( 60\\% \\). Namun, ketika situasi ekonomi berubah menantang, efisiensi biaya bisa bergeser menjadi prioritas utama. Fleksibilitas ini sangat wajar, asalkan kamu tetap konsisten dan objektif selama sesi pengambilan keputusan berlangsung.
