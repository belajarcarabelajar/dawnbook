## Langkah 2: Menentukan Kriteria Penilaian

Setelah kamu berhasil mengidentifikasi semua alternatif pilihan pada langkah sebelumnya, kini saatnya menentukan alat ukur untuk menilai pilihan-pilihan tersebut. Dalam penyusunan **matriks keputusan** atau **decision matrix**, alat ukur ini dikenal dengan istilah **kriteria penilaian**.

Menetapkan kriteria penilaian adalah langkah yang sangat menentukan. Jika kriteria yang kamu pilih keliru atau tumpang tindih, hasil perhitungan pada matriks keputusanmu akan menjadi bias dan tidak akurat. Mari kita pelajari cara mengidentifikasi faktor-faktor kunci agar keputusanmu tetap objektif serta terukur.

### Apa Itu Kriteria Penilaian?

Kriteria penilaian merupakan standar atau parameter untuk mengevaluasi seberapa baik suatu alternatif memenuhi tujuanmu. Kriteria berfungsi sebagai penyaring untuk membedakan pilihan yang biasa dengan pilihan terbaik.

> **Poin Penting:** Kriteria yang baik tidak hanya mencakup hal-hal yang kamu inginkan, tetapi harus didasarkan pada apa yang benar-benar dibutuhkan agar keputusan tersebut berhasil.

### Teknik Mengidentifikasi Faktor Kunci

Untuk menemukan kriteria yang tepat, hindari mengandalkan intuisi semata. Kamu bisa menggunakan pendekatan terstruktur berikut:

Pertama, lakukan **analisis pemangku kepentingan (stakeholders)**. Cari tahu siapa saja yang terdampak oleh keputusan ini dan kumpulkan masukan mengenai hal-benar penting bagi mereka. Sebagai contoh, dalam keputusan bisnis, kriteria dapat bersumber dari tim keuangan (aspek biaya), tim operasional (kemudahan prosedur), dan pelanggan (kualitas produk atau layanan).

Selanjutnya, gunakan metode **brainstorming & mind mapping**. Tuliskan semua faktor potensial tanpa membatasinya terlebih dahulu. Setelah semua ide terkumpul, kelompokkan poin-poin yang memiliki kesamaan fungsi.

Terakhir, petakan **analisis batasan (constraints)**. Identifikasi batasan nyata yang tidak bisa ditawar. Jika kamu memiliki anggaran maksimal Rp10 juta, "biaya" otomatis menjadi kriteria mutlak yang wajib dimasukkan ke dalam matriks.

### Syarat Kriteria yang Efektif: Prinsip MECE

Agar matriks keputusanmu berfungsi optimal, kriteria yang disusun sebaiknya memenuhi prinsip **MECE** (*Mutually Exclusive, Collectively Exhaustive*).

#### Independen (Mutually Exclusive)

Setiap kriteria harus berdiri sendiri tanpa saling tumpang tindih (*overlap*). Jika dua kriteria mengukur hal yang sama, kamu akan melakukan *double counting* (penghitungan ganda). Hal ini akan memberikan bobot penilaian yang berlebih pada satu aspek secara tidak adil.

Sebagai contoh, hindari menggunakan kriteria "Kecepatan Prosesor" dan "Performa Komputer" secara bersamaan karena keduanya mengukur hal yang hampir sama. Solusinya, pilih salah satu kriteria yang paling mewakili atau gabungkan keduanya menjadi satu parameter yang lebih luas.

#### Terukur (Measurable)

Kriteria harus dapat dinilai secara objektif, baik melalui pendekatan kuantitatif maupun kualitatif.

*   **Kuantitatif (berupa angka pasti):** Contohnya seperti biaya dalam Rupiah, waktu pengerjaan dalam satuan hari, atau kapasitas penyimpanan dalam Gigabyte.
*   **Kualitatif (berdasarkan skala persepsi):** Contohnya meliputi keindahan estetika, kemudahan penggunaan (*usability*), serta reputasi penyedia jasa (*vendor*).

### Karakteristik Kriteria yang Baik

Pastikan kriteriamu memenuhi kualifikasi berikut:

*   **Relevan:** Setiap kriteria harus berhubungan langsung dengan tujuan akhir keputusanmu.
*   **Operasional:** Parameter penilaian harus jelas dan dapat dipahami secara seragam oleh semua orang yang terlibat dalam pengambilan keputusan.
*   **Jumlah yang Proporsional:** Jumlah kriteria yang ideal berkisar antara **5 hingga 10 kriteria**. Kriteria yang terlalu sedikit membuat analisis menjadi dangkal, sedangkan kriteria yang terlalu banyak akan membuat matriks menjadi rumit dan sulit dikelola.

Misalkan kamu sedang mencari rumah tinggal. Apakah warna cat dinding luar rumah merupakan kriteria yang sama pentingnya dengan akses transportasi? Tentu tidak. Dalam matriks keputusan, relevansi membantu memfokuskan energimu pada kriteria-kriteria yang berdampak langsung pada kualitas keputusan, alih-alih terdistraksi oleh informasi yang kurang penting.

### Contoh Skenario: Memilih Vendor Software CRM

Untuk melihat bagaimana kriteria penilaian diterapkan dalam situasi nyata, mari kita ambil contoh pemilihan vendor software CRM (*Customer Relationship Management*) oleh sebuah perusahaan.

| Kriteria | Definisi Operasional | Jenis Data |
| :--- | :--- | :--- |
| **Biaya Implementasi** | Total biaya lisensi dan biaya *setup* awal. | Kuantitatif (Rupiah) |
| **Kemudahan Penggunaan** | Tingkat kemudahan staf dalam menguasai sistem (*user experience*). | Kualitatif (Skala 1-5) |
| **Integrasi** | Kemampuan sistem untuk terhubung dengan aplikasi email dan akuntansi yang sudah ada. | Kuantitatif (Jumlah Integrasi) |
| **Skalabilitas** | Kemampuan sistem untuk menangani pertumbuhan volume data dan pengguna di masa mendatang. | Kualitatif (Skala 1-5) |
| **Dukungan Teknis** | Keberadaan layanan bantuan 24/7 beserta reputasi *vendor*. | Kualitatif (Skala 1-5) |

### Implementasi Teknis (Struktur Data)

Bagi kamu yang mengembangkan aplikasi pendukung keputusan atau menggunakan *spreadsheet* tingkat lanjut, kriteria ini dapat direpresentasikan menggunakan format JSON terstruktur seperti berikut:

```json
{
  "decision_project": "Pemilihan Vendor Cloud",
  "criteria": [
    {
      "id": "C1",
      "name": "Biaya Bulanan",
      "is_independent": true,
      "measurement_unit": "USD",
      "type": "quantitative"
    },
    {
      "id": "C2",
      "name": "Keamanan Data",
      "is_independent": true,
      "measurement_unit": "Compliance Score",
      "type": "qualitative"
    },
    {
      "id": "C3",
      "name": "Latensi Server",
      "is_independent": true,
      "measurement_unit": "ms",
      "type": "quantitative"
    }
  ]
}
```

### Aplikasi Dunia Nyata: Membeli Rumah Pertama

Bayangkan kamu dan pasangan sedang berencana membeli rumah pertama. Saat ini, ada 3 kandidat rumah yang menjadi alternatif pilihan. Sebelum mulai melakukan survei fisik, kamu harus menentukan kriteria penilaian terlebih dahulu agar tidak mudah terpikat oleh aspek sekunder seperti "taman yang asri", padahal lokasinya sangat jauh dari tempat kerja.

Berikut adalah contoh identifikasi kriteria penilaian yang bisa kamu buat:

1. **Jarak ke Kantor:** \\( D \\le 15 \\) km (Kriteria Independen).
2. **Harga Rumah:** \\( P \\le 1 \\) Miliar Rupiah (Kriteria Terukur).
3. **Tingkat Keamanan Lingkungan:** Mengacu pada data statistik kriminalitas wilayah setempat (Kriteria Terukur).
4. **Akses Transportasi Umum:** Jumlah stasiun atau halte terdekat dalam radius 1 km (Kriteria Terukur).

Dengan menentukan kriteria sejak awal, kamu mengunci logika berpikir sebelum faktor emosional memengaruhi penilaian objektif.

Setelah kriteria ini ditetapkan dengan jelas dan dipastikan tidak ada parameter yang tumpang tindih, kamu siap melangkah ke tahap berikutnya: **Langkah 3: Pemberian Bobot pada Kriteria**. Di tahap tersebut, kamu akan menentukan mana kriteria yang memiliki prioritas paling tinggi bagimu.
