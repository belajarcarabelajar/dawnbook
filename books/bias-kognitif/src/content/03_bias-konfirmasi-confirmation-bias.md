## Bias Konfirmasi (Confirmation Bias)

Pernahkah kamu merasa bahwa sebuah artikel berita seolah-olah "berbicara langsung" kepadamu karena sangat sesuai dengan pendapatmu? Atau pernahkah kamu mengabaikan komentar pedas di media sosial yang mengkritik hobimu, namun langsung menekan tombol *like* pada komentar yang memujinya?

Selamat, kamu baru saja mengalami **Bias Konfirmasi**.

Bias konfirmasi adalah salah satu bias kognitif yang paling kuat dan meresap dalam kehidupan manusia. Ini adalah kecenderungan kita untuk mencari, menafsirkan, dan mengingat informasi dengan cara yang memperkuat keyakinan atau hipotesis awal kita, sambil mengabaikan informasi yang bertentangan dengannya.

## 🏗️ Tiga Pilar Bias Konfirmasi

Otak kita tidak bekerja seperti hakim yang tidak memihak dalam mencari kebenaran. Sebaliknya, otak kita sering bertindak seperti **pengacara** yang hanya mencari bukti untuk memenangkan kasusnya. Ada tiga cara utama bagaimana bias ini beroperasi:

### 1\. Pencarian Informasi yang Terpihak (Biased Search)

Kita cenderung mencari bukti yang mendukung apa yang sudah kita percayai.

- **Contoh:** Seseorang yang percaya bahwa "diet keto itu berbahaya" akan mengetik di Google: *"Efek samping buruk diet keto"*, alih-alih mengetik *"Manfaat dan risiko diet keto"*.

### 2\. Penafsiran yang Terpihak (Biased Interpretation)

Saat dihadapkan pada bukti yang ambigu, kita akan menafsirkannya sedemikian rupa agar sesuai dengan pandangan kita.

- **Analogi:** Bayangkan dua orang menonton pertandingan sepak bola. Saat terjadi benturan keras, pendukung tim A akan melihatnya sebagai "pelanggaran berat", sementara pendukung tim B melihatnya sebagai "akting lawan". Informasi visualnya sama, namun penafsirannya berbeda total.

### 3\. Ingatan yang Terpihak (Biased Memory)

Kita lebih mudah mengingat informasi yang mendukung keyakinan kita dan lebih cepat melupakan informasi yang menantangnya.

- **Penting:** Ini bukan berarti kita berbohong secara sengaja; otak kita secara otomatis melakukan filter terhadap informasi yang menyebabkan ketidaknyamanan mental.

## 🧠 Mengapa Otak Kita Melakukannya?

Mengapa evolusi membiarkan kita memiliki "cacat" berpikir seperti ini?

## 💻 Bias Konfirmasi dalam Dunia Teknik & Data

Dalam dunia rekayasa perangkat lunak atau sains data, bias konfirmasi bisa menjadi sangat berbahaya. Seorang pengembang mungkin menulis kode dan hanya menguji skenario yang mereka tahu akan berhasil (*Happy Path*), alih-alih mencoba mencari cara untuk merusaknya.

### Contoh Skenario: "Debugging yang Terbias"

Seorang programmer yakin bahwa *bug* di aplikasinya disebabkan oleh masalah jaringan.

1. Dia menghabiskan waktu berjam-jam memeriksa log *server*.
2. Dia mengabaikan pesan error di log *database* yang sebenarnya menunjukkan kesalahan sintaks.
3. Dia menyimpulkan bahwa "jaringan memang sedang tidak stabil hari ini" meskipun datanya berkata lain.

**Contoh Kode (Logika Filter yang Salah):** Seringkali, algoritma yang kita buat secara tidak sengaja mereplikasi bias kita sendiri.

```python
# Simulasi filter informasi yang bias dalam sebuah algoritma rekomendasi
user_belief = "Teknologi A lebih baik dari Teknologi B"
all_news = [
    {"title": "Kelebihan Teknologi A", "sentiment": "positive"},
    {"title": "Kegagalan Teknologi A", "sentiment": "negative"},
    {"title": "Inovasi Baru Teknologi B", "sentiment": "positive"}
]

# Algoritma yang bias hanya akan menampilkan apa yang disukai pengguna
filtered_news = [news for news in all_news if "A" in news['title'] and news['sentiment'] == "positive"]

print(f"Hasil untuk pengguna: {filtered_news}")
# Output ini akan memperkuat keyakinan pengguna tanpa memberi sudut pandang lain.
```

## 🌍 Aplikasi di Dunia Nyata

### 1\. Investasi dan Keuangan

Seorang investor yang sudah terlanjur membeli saham perusahaan X cenderung hanya membaca berita positif tentang perusahaan tersebut. Mereka mengabaikan laporan keuangan yang memburuk (tanda bahaya) karena mereka ingin memvalidasi keputusan investasi mereka.

### 2\. Media Sosial dan "Echo Chambers"

Algoritma media sosial dirancang untuk menunjukkan konten yang kamu sukai. Jika kamu sering berinteraksi dengan konten politik tertentu, algoritma akan terus menyuapimu dengan pandangan serupa.

> **Wawasan Penting:** Media sosial tidak hanya mencerminkan bias kita, mereka memperkuatnya dengan menciptakan "ruang gema" di mana suara-suara yang berbeda diredam.

### 3\. Dunia Medis

Seorang dokter mungkin secara tidak sadar membentuk diagnosis awal dalam beberapa menit pertama pertemuan. Dia kemudian hanya menanyakan pertanyaan yang mengonfirmasi diagnosis tersebut, dan mengabaikan gejala lain yang mungkin menunjukkan penyakit yang berbeda.

## 💡 Latihan Refleksi

*Pikirkan sebuah topik yang kamu sangat yakini (misalnya: pola makan tertentu, pandangan politik, atau merek smartphone favorit).*

1. *Kapan terakhir kali kamu secara sengaja mencari argumen dari pihak yang berseberangan denganmu?*
2. *Apakah kamu membaca argumen tersebut untuk memahaminya, atau hanya untuk mencari celah agar bisa membantahnya?*

## 🛠️ Cara Menghadapi Bias Konfirmasi

Meskipun kita tidak bisa menghapus bias ini sepenuhnya (karena ini adalah bagian dari "hardware" otak kita), kita bisa memitigasi dampaknya:

- **Mainkan "Devil's Advocate":** Saat kamu mengambil keputusan, tanyakan pada diri sendiri: *"Jika keputusan ini salah, apa saja alasannya?"*
- **Cari Diskonfirmasi:** Alih-alih mencari bukti yang mendukung, cobalah untuk membuktikan bahwa dirimu **salah**. Inilah dasar dari metode ilmiah.
- **Perluas Sumber Informasi:** Ikuti orang-orang atau baca media yang memiliki sudut pandang berbeda denganmu secara sadar.

> **Ingat:** Kekuatan pikiran yang sebenarnya tidak diukur dari seberapa banyak bukti yang kita kumpulkan untuk merasa benar, tetapi dari keberanian untuk mengakui bahwa kita bisa saja keliru.