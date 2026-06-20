## Anatomi dan Komponen Utama: Membedah Struktur Matriks Keputusan

Pernahkah kamu merasa kewalahan saat harus memilih di antara beberapa opsi yang sama-sama menarik? Bayangkan kamu sedang berdiri di depan rak laptop. Ada yang baterainya tahan lama tetapi berat, ada yang sangat ringan tetapi mahal, dan ada yang performanya tinggi tetapi desainnya biasa saja. Pikiran kita sering kali macet karena mencoba memproses semua variabel ini secara bersamaan. Di sinilah **matriks keputusan** (*decision matrix*) berperan sebagai *exoskeleton* bagi otak kita. Alat ini membantu menstrukturkan pilihan berdasarkan berbagai **kriteria penilaian** untuk menghasilkan **skor berbobot** yang objektif.

Untuk menguasai metode ini, mari kita bedah anatomi dan komponen utamanya terlebih dahulu.

### Kerangka Dasar: Baris dan Kolom

Secara visual, *decision matrix* berupa sebuah tabel terstruktur di mana setiap elemen memiliki peran spesifik:

- **Baris (Horizontal)**: Merepresentasikan daftar pilihan atau alternatif yang akan dinilai.
- **Kolom (Vertikal)**: Berisi kriteria atau tolok ukur penilaian yang kita gunakan sebagai dasar evaluasi.

Sebagai analogi sederhana, jika kamu sedang membangun tim sepak bola, pilihan alternatifnya adalah para kandidat pemain yang ingin bergabung, sedangkan kriteria penilaiannya meliputi kecepatan lari, akurasi tendangan, serta ketahanan fisik mereka.

### Komponen 1: Alternatif

**Alternatif** adalah daftar opsi atau solusi yang sedang kamu pertimbangkan dalam pengambilan keputusan. Di dalam struktur matriks, alternatif ini diposisikan pada kolom pertama di setiap baris.

Setiap alternatif harus bersifat *comparable* (sebanding). Sebagai contoh, kamu tidak bisa menyejajarkan keputusan "membeli mobil baru" dengan "memilih menu makan siang" dalam satu matriks yang sama. Jika sedang mengevaluasi lokasi kantor baru, pilihan alternatifnya bisa berupa: *Lokasi A (Sudirman)*, *Lokasi B (BSD)*, atau *Lokasi C (Kemang)*.

### Komponen 2: Kriteria Penilaian

**Kriteria** adalah standar, syarat, atau faktor spesifik yang digunakan untuk mengevaluasi setiap alternatif. Kriteria ini ditempatkan pada baris *column header*.

Kriteria wajib relevan dan dapat diukur dengan jelas agar penilaian tetap objektif. Semakin spesifik kriteria yang kamu tentukan, semakin minim bias yang muncul. Contohnya, saat menyeleksi laptop baru, kriteria yang digunakan bisa berupa *harga*, *daya tahan baterai*, *berat fisik*, hingga *kapasitas memori (RAM)*.

Apakah semua kriteria memiliki tingkat kepentingan yang sama bagimu? Jika kamu sering bekerja secara *remote* di luar ruangan, daya tahan baterai tentu jauh lebih penting dibandingkan kapasitas RAM yang super besar. Perbedaan tingkat kepentingan inilah yang melahirkan komponen berikutnya.

### Komponen 3: Bobot (*Weight*)

Tidak semua kriteria memiliki nilai kepentingan yang setara. **Bobot (*weight*)** adalah nilai numerik yang menunjukkan tingkat kepentingan suatu kriteria dibandingkan dengan kriteria lainnya.

Dalam konvensi umum, akumulasi seluruh bobot kriteria harus bernilai \\( 1.0 \\) atau \\( 100\\% \\).

Misalnya, jika Kriteria A memiliki bobot \\( 0.5 \\) dan Kriteria B memiliki bobot \\( 0.2 \\), itu berarti Kriteria A dua setengah kali lebih penting bagi keputusanmu dibandingkan Kriteria B.

**Secara matematis:** Jika \\( w \\) adalah bobot untuk kriteria ke-\\( i \\), maka persamaannya ditulis sebagai:

\\[ \sum_{i=1}^{n} w_i = 1 \text{ atau } 100\% \\]

### Komponen 4: Skor Penilaian (*Rating*)

**Skor** merupakan nilai numerik yang kamu berikan pada setiap alternatif berdasarkan pemenuhan kriteria tertentu.

Kamu bisa menggunakan skala penilaian yang konsisten, misalnya 1–5 atau 1–10. Skor terendah (1) mencerminkan performa alternatif yang sangat buruk pada kriteria terkait, sedangkan skor tertinggi melambangkan performa yang sangat baik.

### Hasil Akhir: Skor Berbobot (*Weighted Score*)

Bagian ini merupakan inti analisis dari matriks keputusan. Untuk mendapatkan hasil yang adil, kita tidak menjumlahkan skor mentah begitu saja, melainkan mengalikan skor setiap alternatif dengan bobot masing-masing kriteria terlebih dahulu sebelum dijumlahkan.

**Rumus Dasar:**

\\[ \text{Total Score} = (\text{Skor} \times \text{Bobot}_1) + (\text{Skor} \times \text{Bobot}_2) + \dots + (\text{Skor} \times \text{Bobot}_n) \\]

Formula ini juga dapat dinyatakan dalam notasi sigma sebagai berikut:

\\[ S_j = \sum_{i=1}^{n} (w_i \cdot r_{ij}) \\]

Keterangan:

- \\( S_j \\) mewakili total skor akhir untuk alternatif \\( j \\).
- \\( w_i \\) adalah bobot tingkat kepentingan untuk kriteria \\( i \\).
- \\( r_{ij} \\) merupakan nilai peringkat (*rating*) alternatif \\( j \\) pada kriteria \\( i \\).

### Visualisasi Struktur Matriks

Berikut adalah representasi visual dari struktur matriks keputusan:

| Alternatif | Kriteria 1 (Bobot: 40%) | Kriteria 2 (Bobot: 60%) | Total Skor |
| :--- | :---: | :---: | :--- |
| **Opsi A** | Skor (1–5) | Skor (1–5) | \\( (\text{Skor}_1 \times 0.4) + (\text{Skor}_2 \times 0.6) \\) |
| **Opsi B** | Skor (1–5) | Skor (1–5) | \\( (\text{Skor}_1 \times 0.4) + (\text{Skor}_2 \times 0.6) \\) |

### Aplikasi Praktis: Rekrutmen *Software Engineer*

Mari kita lihat penerapannya pada skenario nyata. Bayangkan seorang manajer HR ingin merekrut seorang *software engineer* baru untuk timnya dari 3 kandidat yang tersedia.

- **Alternatif**: Andi, Budi, dan Citra.
- **Kriteria**: Kemampuan *coding* (bobot 50%), kerja sama tim (bobot 30%), dan ekspektasi gaji (bobot 20%).
- **Proses Penilaian**:
  - Citra memiliki kemampuan *coding* yang luar biasa (skor 5), tetapi ekspektasi gajinya sangat tinggi sehingga mendapat skor terendah untuk kriteria gaji (skor 1).
  - Andi memiliki kemampuan *coding* standar (skor 3), tetapi sangat kooperatif dalam tim (skor 5) dan ekspektasi gajinya masuk akal (skor 4).

Dengan menggunakan struktur *decision matrix* ini, manajer HR tidak hanya terpaku pada siapa yang paling mahir pemrograman, melainkan dapat menemukan kandidat yang paling sesuai dengan kebutuhan organisasi secara menyeluruh.

### Implementasi Kode (Python)

Bagi kamu yang memiliki latar belakang teknis, memahami anatomi matriks keputusan akan lebih mudah jika diekspresikan ke dalam struktur data seperti *dictionary* atau *list* pada Python.

```python
# Anatomi Matriks Keputusan dalam Kode Python
decision_matrix = {
    "kriteria": ["Harga", "Kualitas", "Kecepatan"],
    "bobot": [0.4, 0.4, 0.2],
    "alternatif": {
        "Vendor A": [8, 7, 9], # Skor untuk tiap kriteria
        "Vendor B": [6, 9, 7],
        "Vendor C": [9, 6, 6]
    }
}

def calculate_winner(matrix):
    results = {}
    for vendor, scores in matrix["alternatif"].items():
        total_score = sum(s * w for s, w in zip(scores, matrix["bobot"]))
        results[vendor] = round(total_score, 2)
    return results

# Output: {'Vendor A': 7.8, 'Vendor B': 7.4, 'Vendor C': 7.2}
print(calculate_winner(decision_matrix))
```

### Ringkasan Komponen

Untuk mengingat kembali struktur dasar yang telah kita bedah:

- **Alternatif (Baris)**: Pilihan atau solusi yang akan kamu evaluasi dan bandingkan secara langsung.
- **Kriteria (Kolom)**: Faktor atau tolok ukur spesifik yang relevan bagi pengambilan keputusan.
- **Bobot**: Nilai prioritas yang menunjukkan seberapa penting kriteria tersebut bagi kebutuhanmu.
- **Skor & Total Skor**: Skor merepresentasikan penilaian mentah pada tiap kriteria, sedangkan total skor adalah hasil akhir berbobot yang menunjukkan opsi terbaik secara objektif.

### Pesan Utama

Struktur matriks keputusan tidak bertujuan menghilangkan intuisimu, tetapi dirancang untuk mendisiplinkan cara berpikirmu. Dengan membedah keputusan menjadi komponen-komponen terukur ini, kamu bisa melihat dengan jelas mengapa satu opsi lebih unggul dibandingkan dengan opsi lainnya.
