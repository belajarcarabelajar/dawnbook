## Langkah 1: Identifikasi Alternatif Pilihan

Bayangkan kamu berdiri di depan sebuah mesin penjual otomatis (*vending machine*). Sebelum kamu memasukkan koin, matamu memindai seluruh rak untuk melihat pilihan yang tersedia: kopi, teh, soda, atau air mineral. Dalam konteks **matriks keputusan** (*decision matrix*), proses memindai rak ini setara dengan langkah pertama, yaitu **Identifikasi Alternatif**.

### Apa Itu Alternatif Pilihan?

Dalam konteks matriks keputusan, **Alternatif** adalah berbagai opsi, solusi, atau kandidat yang bersaing untuk dipilih. Jika tujuanmu adalah "Membeli Laptop Baru", maka alternatifnya adalah merek dan model laptop yang berbeda (misalnya: MacBook Air, Dell XPS, atau ThinkPad).

> **Catatan Penting:** Kualitas keputusanmu sangat bergantung pada kualitas daftar alternatif yang kamu susun. Jika pilihan terbaik tidak masuk ke dalam daftarmu sejak awal, perhitungan secanggih apa pun tidak akan menghasilkan solusi terbaik.

### Mengapa Langkah Ini Penting?

Banyak orang terjebak dalam *tunnel vision*, di mana mereka hanya berfokus pada satu atau dua opsi yang sudah lazim. Mengidentifikasi alternatif secara menyeluruh membantu:

1. **Mencegah Penyesalan.** Cara ini mengurangi risiko melewatkan peluang emas yang sebenarnya lebih menguntungkan.
2. **Objektivitas yang Lebih Baik.** Kita didorong untuk mempertimbangkan opsi yang mungkin awalnya kurang disukai, tetapi secara teknis sangat mumpuni.
3. Kita bisa menghemat waktu (**Efisiensi**) dengan langsung membuang opsi yang kurang layak sejak awal agar tidak membuang waktu pada tahap penilaian nanti.

### Strategi Menyusun Daftar Alternatif

Untuk mendapatkan daftar yang solid, kamu perlu menggabungkan kreativitas dengan logika. Berikut adalah beberapa langkah praktisnya:

#### 1. Sesi *Brainstorming* (Kuantitas di atas Kualitas)

Pada tahap awal, jangan terlalu kritis. Tuliskan semua kemungkinan yang muncul di benakmu atau timmu. Gunakan teknik *mind mapping* untuk memperluas cakrawala berpikir.

- *Coba tanyakan pada diri sendiri: apakah ada cara radikal untuk menyelesaikan masalah ini yang belum pernah dicoba sebelumnya?*

#### 2. Riset dan *Benchmarking*

Lihat apa yang dilakukan pihak lain atau kompetitor dalam situasi serupa. Jika ini adalah keputusan bisnis, carilah vendor atau teknologi yang sedang tren di pasar.

#### 3. Batasan Teknis (*Constraints*)

Identifikasi batas-batas yang tidak bisa dilanggar. Jika anggaranmu maksimal Rp10 juta, maka opsi seharga Rp20 juta bukan lagi alternatif, melainkan sekadar angan-angan.

\\[ \\text{Anggaran} \\leq \\text{Rp10.000.000} \\]

### Teknik Penyaringan (*Filtering*): Memilih yang Relevan

Terlalu banyak pilihan bisa menyebabkan *analysis paralysis*. Kita perlu menyaring daftar panjang tersebut menjadi daftar pendek yang berkualitas.

#### Prinsip *Mutually Exclusive, Collectively Exhaustive* (MECE)

Gunakan prinsip ini untuk memastikan daftarmu efisien:

- **Mutually Exclusive (Saling Lepas).** Setiap opsi tidak boleh saling tumpang tindih. Jika Opsi A dan Opsi B sangat mirip, gabungkan saja atau pilih salah satu yang terbaik.
- Opsi yang dikumpulkan harus mencakup seluruh kategori solusi yang ada (**Collectively Exhaustive**). Jangan sampai ada celah solusi yang terlewatkan.

#### Kriteria Eliminasi Awal (*Fatal Flaw Test*)

Gunakan tes ini untuk membuang opsi yang tidak relevan sejak awal:

- Apakah opsi ini menabrak hukum atau regulasi yang berlaku?
- Kendala waktu: Apakah secara teknis tidak mungkin diimplementasikan dalam tenggat yang ditentukan?
- Bagaimana dengan biaya operasionalnya? Apakah akan memberatkan keuangan kita secara ekstrem?

### Contoh Skenario & Kasus Nyata

#### Skenario: Memilih *Framework* Pengembangan Web untuk Proyek Baru

Sebuah tim pengembang harus memutuskan *framework* mana yang akan digunakan untuk proyek *e-commerce* berskala besar.

**Daftar Alternatif Awal (Hasil *Brainstorming*):**

1. React.js
2. Vue.js
3. Angular
4. WordPress (sederhana, namun kurang skalabel)
5. Membangun *framework* sendiri dari awal (*custom*)
6. Svelte

**Proses Penyaringan:**

- **WordPress** langsung gugur karena kebutuhan skalabilitas proyek yang sangat tinggi (*fatal flaw*).
- Kendala waktu (*time constraint*) membuat opsi **membangun framework sendiri** tidak realistis untuk dijalankan.
- Untuk **Svelte**, tim memutuskan mengeliminasinya karena sulitnya mencari SDM di pasar lokal saat ini (*resource constraint*).

**Daftar Alternatif Akhir untuk Matriks:**

1. **React.js** dengan ekosistemnya yang sangat luas.
2. **Vue.js** yang menawarkan kurva pembelajaran relatif cepat.
3. **Angular** karena memiliki struktur kuat yang cocok untuk skala korporasi.

### Aplikasi Praktis: Penggunaan Kode dalam Dokumentasi

Dalam sistem manajemen keputusan otomatis, alternatif sering kali direpresentasikan dalam bentuk *array* atau *list* objek sebelum diproses ke dalam matriks.

```python
# Contoh representasi alternatif dalam kode Python
alternatif_pilihan = [
    {"id": 1, "nama": "Cloud Provider A", "status": "Aktif"},
    {"id": 2, "nama": "Cloud Provider B", "status": "Aktif"},
    {"id": 3, "nama": "On-Premise Server", "status": "Eliminasi"} # Dibuang karena biaya perawatan tinggi
]

# Fungsi sederhana untuk menyaring alternatif yang relevan
alternatif_final = [a for a in alternatif_pilihan if a['status'] == "Aktif"]

print(f"Jumlah alternatif yang akan dievaluasi: {len(alternatif_final)}")
```

### Tips Menghindari Kesalahan Umum

- **Hindari *decoy option* (opsi boneka).** Kadang kita sengaja memasukkan pilihan buruk hanya agar opsi favorit terlihat menonjol. Hal ini dapat merusak objektivitas analisis.
- Batasi jumlah alternatif yang masuk ke dalam daftar (**ideal antara 3 hingga 7 opsi**). Jika lebih dari 7, proses penilaian akan terasa melelahkan dan rentan bias.
- **Tuliskan definisi secara detail.** Jangan hanya menulis "Cloud". Sebaiknya sebutkan dengan jelas, misalnya "AWS (Amazon Web Services) - Paket Enterprise", agar mempermudah penilaian nanti.

> **Rangkuman Langkah 1:** Mulailah dengan pikiran terbuka untuk mengumpulkan seluruh opsi yang memungkinkan. Setelah itu, terapkan penyaringan realitas (seperti anggaran, waktu, dan kapasitas teknis) guna menyaring daftar tersebut menjadi 3-7 pilihan terbaik yang siap dievaluasi menggunakan matriks keputusan.
