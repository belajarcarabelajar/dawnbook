## Langkah 5: Perhitungan Skor Berbobot (Weighted Score)

Di sinilah inti dari matriks keputusan (decision matrix) bekerja. Setelah menentukan kriteria penilaian dan menetapkan bobot pada langkah sebelumnya, **Langkah 5** adalah proses integrasinya. Kita mengubah penilaian subjektif maupun objektif menjadi angka-angka presisi berupa skor berbobot (*weighted score*) untuk memandu kamu menuju pilihan terbaik.

### 1. Apa Itu Skor Berbobot?

**Skor Berbobot (Weighted Score)** adalah hasil kali antara skor mentah yang diberikan pada suatu alternatif dengan bobot kepentingan kriteria tersebut.

Mengapa kita tidak bisa hanya menjumlahkan skor mentah saja? Bayangkan kamu sedang memilih tempat tinggal baru. Kamu memberikan skor 10 untuk "Warna Cat Tembok" dan skor 5 untuk "Keamanan Lingkungan". Jika kamu hanya menjumlahkan kedua nilai tersebut begitu saja, warna cat akan terlihat seolah jauh lebih penting. Namun, dengan **pemberian bobot**, kita bisa memastikan bahwa nilai keamanan yang lebih tinggi tetap memberikan pengaruh lebih besar pada keputusan akhir daripada estetika warna cat semata.

> **Prinsip Utama:** Tanpa perhitungan skor berbobot, setiap kriteria dianggap memiliki tingkat kepentingan yang sama. Padahal, realitas pengambilan keputusan yang kompleks selalu melibatkan kriteria dengan prioritas yang berbeda.

### 2. Rumus Matematis

Kalkulasi ini menggunakan operasi perkalian dasar dan penjumlahan sederhana.

Untuk satu kriteria pada satu alternatif:

\\( \\text{WS} = S \\times W \\)

Keterangan:
- \\( \\text{WS} \\) mewakili *Weighted Score* (Skor Berbobot).
- \\( S \\) adalah *Raw Score*, yaitu skor mentah yang diberikan pada Langkah 4.
- \\( W \\) adalah *Weight*, yaitu bobot tingkat kepentingan kriteria yang ditentukan pada Langkah 3.

Untuk mendapatkan **Total Skor** dari sebuah alternatif, jumlahkan seluruh skor berbobot dari setiap kriteria yang ada:

\\[ \\text{Total Score} = \\sum_{i=1}^{n} (S_i \\times W_i) \\]

### 3. Panduan Langkah Demi Langkah Kalkulasi

Proses perhitungan dapat dilakukan secara sistematis melalui langkah berikut:

1. **Siapkan Tabel Matriks:** Pastikan semua skor mentah (\\( S \\)) dan bobot (\\( W \\)) sudah terisi dengan lengkap di sel masing-masing.
2. **Kalikan Secara Horizontal:** Untuk setiap alternatif (baris), kalikan skor mentah dengan bobot kriteria pada kolom yang sesuai.
3. **Jumlahkan:** Tambahkan hasil perkalian kriteria tersebut untuk mendapatkan total nilai akhir per alternatif.
4. **Ulangi dan Urutkan:** Lakukan kalkulasi yang sama untuk semua alternatif lain, lalu urutkan hasilnya dari nilai tertinggi ke terendah.

> **Tips Praktis:** Pastikan satuan bobot yang kamu gunakan konsisten. Jika menggunakan persentase, total dari seluruh bobot kriteria harus berjumlah tepat 100% atau 1.0.

### 4. Analogi: Menentukan MVP (Most Valuable Player)

Bayangkan kamu adalah juri dalam sebuah liga basket. Tugasmu adalah menentukan siapa pemain terbaik musim ini.

- **Kriteria A:** Jumlah poin yang dicetak (Bobot: 0.7 - Sangat Penting)
- **Kriteria B:** Gaya rambut pemain (Bobot: 0.1 - Kurang Penting)

Pemain X mencetak banyak poin (Skor 9) tetapi gaya rambutnya biasa saja (Skor 4). Sebaliknya, Pemain Y hanya mencetak sedikit poin (Skor 3) namun memiliki gaya rambut yang sangat keren (Skor 10).

**Perhitungan:**
- **Pemain X:** \\( (9 \\times 0.7) + (4 \\times 0.1) = 6.3 + 0.4 = \\mathbf{6.7} \\)
- **Pemain Y:** \\( (3 \\times 0.7) + (10 \\times 0.1) = 2.1 + 1.0 = \\mathbf{3.1} \\)

Meskipun Pemain Y memiliki skor sempurna pada satu kategori, bobot yang rendah membuat skor totalnya tidak mampu mengalahkan kontribusi nyata dari Pemain X. Itulah kekuatan nyata dari *Weighted Score*.

### 5. Contoh Kasus: Pemilihan Vendor Software Cloud

Mari kita terapkan metode ini pada skenario bisnis nyata. Sebuah perusahaan sedang memilih antara dua vendor layanan cloud (Vendor A dan Vendor B).

**Bobot Kriteria:**
- Keamanan: 0.50
- Harga: 0.30
- Fitur: 0.20 (Total Bobot = 1.00)

| Alternatif | Kriteria Keamanan (S) | Kriteria Harga (S) | Kriteria Fitur (S) | Perhitungan Total Skor |
| --- | --- | --- | --- | --- |
| **Vendor A** | 8 | 6 | 9 | \\( (8 \\times 0.5) + (6 \\times 0.3) + (9 \\times 0.2) = 4.0 + 1.8 + 1.8 = \\mathbf{7.6} \\) |
| **Vendor B** | 6 | 9 | 7 | \\( (6 \\times 0.5) + (9 \\times 0.3) + (7 \\times 0.2) = 3.0 + 2.7 + 1.4 = \\mathbf{7.1} \\) |

**Hasil Akhir:** Vendor A terpilih sebagai pemenang meskipun harganya lebih mahal. Hal ini disebabkan karena Vendor A unggul pada kriteria keamanan yang memiliki bobot penilaian paling tinggi.

### 6. Implementasi Teknis dengan Python

Bagi kamu yang ingin mengotomatisasi proses ini untuk menangani data berskala besar, berikut adalah cuplikan kode sederhana menggunakan Python untuk menghitung skor berbobot secara otomatis:

```python
def calculate_weighted_score(alternatives, weights):
    results = {}
    
    for name, scores in alternatives.items():
        # Mengalikan skor mentah dengan bobot dan menjumlahkannya
        total_score = sum(s * w for s, w in zip(scores, weights))
        results[name] = round(total_score, 2)
        
    # Mengurutkan hasil dari yang tertinggi
    sorted_results = dict(sorted(results.items(), key=lambda item: item[1], reverse=True))
    return sorted_results

# Data: [Keamanan, Harga, Fitur]
weights = [0.5, 0.3, 0.2]
vendors = {
    "Vendor A": [8, 6, 9],
    "Vendor B": [6, 9, 7],
    "Vendor C": [7, 7, 7]
}

final_rank = calculate_weighted_score(vendors, weights)

print("Peringkat Keputusan:")
for rank, (name, score) in enumerate(final_rank.items(), 1):
    print(f"{rank}. {name}: {score}")
```

### 7. Penggunaan di Dunia Nyata

Metode perhitungan ini digunakan secara luas dalam berbagai bidang profesional:

- **Manajemen Proyek:** Menentukan skala prioritas proyek untuk didanai terlebih dahulu menggunakan kombinasi ROI, risiko, dan urgensi.
- **HRD (Recruitment):** Mempermudah penyaringan kandidat dengan mengalikan nilai tes teknis (yang berbobot tinggi) serta hasil wawancara perilaku.
- **Teknik (Engineering):** Membantu pemilihan material konstruksi terbaik dengan menyeimbangkan daya tahan, efisiensi biaya, serta kemudahan instalasi di lapangan.
- **Pembelian Pribadi:** Memilih aset besar seperti mobil atau rumah baru dengan menyesuaikan kebutuhan fungsional terhadap anggaran yang tersedia.

> **Catatan Penting:** Hasil dari perhitungan ini berfungsi sebagai alat bantu pembuat keputusan. Apabila selisih skor antar-alternatif sangat tipis (misalnya 7.6 vs 7.5), disarankan untuk melakukan analisis sensitivitas (*sensitivity analysis*) pada tahap berikutnya guna memastikan pilihanmu tetap kokoh.
