## Masa Depan AWK dalam Kriminologi Digital: Menavigasi Labirin Bit dan Algoritma

Dunia kriminologi tidak lagi hanya berpijak pada ruang interogasi fisik atau lembaran koran cetak. Kita telah memasuki era di mana kejahatan, kontrol sosial, dan konstruksi tentang "siapa yang berbahaya" diproduksi melalui baris kode dan interaksi di media sosial. Analisis Wacana Kritis (AWK) kini menghadapi tantangan sekaligus peluang terbesar dalam sejarahnya: **Kriminologi Digital**.

Dalam bab ini, pemelajar akan mengeksplorasi bagaimana AWK beradaptasi untuk membongkar relasi kuasa yang tersembunyi di balik layar gawai, algoritma yang tidak terlihat, dan sistem pengawasan yang semakin canggih.

### 1. Pergeseran Paradigma: Dari Teks Cetak ke Arus Data

Tradisionalnya, AWK menganalisis teks yang statis seperti pidato, berita cetak, atau undang-undang. Namun, dalam kriminologi digital, wacana bersifat **likuid, masif, dan instan**.

- **Kecepatan (*Velocity*):** Narasi tentang sebuah kejahatan dapat menjadi viral dalam hitungan detik, menciptakan "pengadilan massa digital" sebelum proses hukum resmi dimulai.
- **Interaktivitas:** Wacana tidak lagi searah. Komentar warganet, *retweet*, dan *share* adalah bentuk partisipasi diskursif yang memperkuat atau meruntuhkan stigma terhadap kelompok tertentu.

> **Analogi:** Jika wacana tradisional adalah sebuah buku yang tersusun rapi di perpustakaan, wacana digital adalah arus sungai yang deras. Pemelajar tidak hanya melihat airnya, tetapi harus memahami bagaimana arus (algoritma) dan penghalang (sensor/moderasi) menentukan ke mana arah air tersebut mengalir.

| Dimensi | Kriminologi Wacana Tradisional | Kriminologi Wacana Digital |
| :--- | :--- | :--- |
| **Sifat Media** | Statis, cetak, searah | Dinamis, digital, interaktif |
| **Kecepatan Penyebaran** | Terjadwal (harian/mingguan) | Real-time / instan (*viral*) |
| **Aktor Utama** | Media arus utama, pejabat negara | Algoritma, warganet, akun anonim, *bot* |
| **Bentuk Pengawasan** | Fisik, institusional, terpusat | Algoritmik, *panopticon* digital, terdistribusi |

### 2. Algoritma sebagai Wacana: Kekuasaan di Balik Kode

Salah satu tantangan baru dalam AWK adalah memahami bahwa **algoritma bukanlah alat netral**. Dalam kriminologi digital, algoritma berperan sebagai "kurator realitas" yang menentukan narasi kriminalitas mana yang muncul di beranda publik.

> **Definisi:** Dalam perspektif AWK, algoritma adalah bentuk **wacana teknologis**. Ia membawa ideologi penciptanya dan memperkuat bias sistemik yang ada di masyarakat.

#### Kasus: Predictive Policing (Kepolisian Prediktif)

Banyak kepolisian modern menggunakan perangkat lunak untuk memprediksi di mana kejahatan akan terjadi. AWK dalam konteks ini tidak hanya menganalisis laporan polisi, tetapi juga menganalisis "logika" di balik kode tersebut.

Sebagai contoh, jika variabel "lokasi ekonomi rendah" diberi bobot tinggi dalam algoritma, maka secara diskursif, algoritma tersebut sedang mereproduksi narasi bahwa "kemiskinan identik dengan kriminalitas".

**Representasi Matematis dalam Bias Algoritma:**

Misalkan skor risiko kriminalitas ($R$) ditentukan oleh variabel data historis ($D$) dan bobot ideologis yang tidak disadari ($w$):

<div>

$$
R = \sum_{i=1}^{n} w_i D_i
$$

</div>

Jika $w_i$ untuk variabel latar belakang etnis atau wilayah tertentu lebih tinggi karena data historis yang bias, maka sistem tersebut secara otomatis melakukan "stigmatisasi digital".

### 3. Wacana Pengawasan Digital (*Digital Surveillance*)

Negara dan korporasi kini memiliki kemampuan untuk mengawasi warga secara total. AWK berperan membongkar bagaimana narasi "keamanan" digunakan untuk melegitimasi pengebirian "privasi".

- **Eufemisme Keamanan:** Penggunaan istilah seperti *"smart city"*, *"safe monitoring"*, atau *"data-driven protection"* sering kali merupakan wacana untuk menutupi praktik pengawasan massal yang diskriminatif.
- **Normalisasi Pengawasan:** Bagaimana wacana di media sosial membuat masyarakat merasa "biasa" dan "sukarela" untuk dipantau, yang dalam kriminologi dikenal sebagai *panopticon* digital.

> **Catatan Reflektif:** Apakah masyarakat merasa lebih aman karena diawasi oleh ribuan CCTV bermuatan kecerdasan buatan, atau sekadar telah terbiasa dengan narasi bahwa "jika tidak bersalah, tidak perlu takut"?

### 4. Metodologi Baru: AWK Komputasional

Masa depan AWK dalam kriminologi melibatkan kolaborasi dengan ilmu data (*data science*). Peneliti tidak bisa lagi hanya membaca 10 artikel berita secara manual jika terdapat 10 juta cuitan di media sosial tentang sebuah kasus kejahatan.

**Aplikasi Dunia Nyata: Analisis Sentimen dan Narasi**

Seorang kriminolog digital dapat menggunakan bahasa pemrograman Python untuk melakukan *web scraping* dan menganalisis bagaimana suatu kelompok minoritas dikonstruksikan sebagai "ancaman" dalam skala besar.

```python
# Contoh sederhana analisis frekuensi kata untuk melihat konstruksi wacana
import nltk
from nltk.tokenize import word_tokenize

# Teks fiktif dari komentar media sosial tentang suatu wilayah
comments = "Wilayah X sangat rawan. Banyak kriminal di sana. Hati-hati di wilayah X."

tokens = word_tokenize(comments.lower())
# Mencari hubungan kata 'Wilayah X' dengan 'Kriminal'
dist = nltk.FreqDist(tokens)
print(f"Frekuensi kata 'kriminal': {dist['kriminal']}")
```

Dengan teknik ini, AWK dapat memetakan **hegemoni digital**, yaitu bagaimana opini tertentu mendominasi ruang publik digital dan membungkam suara-suara alternatif (korban atau kelompok marginal).

### 5. Tantangan Etis dan Masa Depan

Masa depan AWK dalam kriminologi digital juga membawa sejumlah tantangan etis mendasar:

1. **Anonimitas vs. Akuntabilitas:** Bagaimana menganalisis wacana dari akun anonim atau *bot* yang sengaja diciptakan untuk menyebar kebencian (*astroturfing*)?
2. **Ruang Gema (*Filter Bubbles* / *Echo Chambers*):** Bagaimana AWK dapat memberikan kritik yang efektif jika audiens yang dituju terjebak dalam ruang gema yang hanya memperkuat keyakinan mereka sendiri?
3. **Rekayasa Media (*Deepfakes*) dan Pasca-Kebenaran (*Post-Truth*):** Dalam dunia di mana bukti visual dapat dimanipulasi, AWK harus melampaui teks dan gambar untuk mempertanyakan otoritas dari sumber informasi itu sendiri.

### 6. Linguistik Forensik: Persimpangan Antara Bahasa dan Hukum

Linguistik forensik adalah cabang ilmu bahasa terapan yang menggunakan analisis bahasa untuk kepentingan hukum dan investigasi kriminal. Seorang peneliti atau investigator tidak hanya mencari sidik jari pada benda fisik, melainkan **"sidik jari linguistik"** yang tertinggal dalam susunan kalimat, pilihan kata, hingga tanda baca.

Dalam kriminologi, bahasa dianggap sebagai manifestasi perilaku. Berikut adalah pilar utama bagaimana kata-kata menjadi alat bukti:

#### 6.1 Idiolek: Sidik Jari dalam Kata

Sama seperti sidik jari atau DNA, setiap individu memiliki **idiolek**. Idiolek adalah gaya bahasa unik yang dimiliki individu, yang dipengaruhi oleh latar belakang pendidikan, dialek regional, usia, hingga profesi.

- **Pilihan Leksikal:** Penentuan penggunaan istilah (misalnya kata "komputer" versus "peranti").
- **Sintaksis:** Struktur kalimat yang dominan, seperti kecenderungan penggunaan kalimat pasif atau aktif.
- **Ortografi:** Pola penggunaan tanda baca atau singkatan (misalnya "yg" versus "yang", atau penggunaan tanda seru yang berlebihan).

#### 6.2 Atribusi Kepenulisan (*Authorship Attribution*)

Teknik ini digunakan untuk menentukan penulis asli dari sebuah teks yang tidak diketahui identitasnya, seperti surat ancaman, pesan teror, atau dokumen palsu. Ahli bahasa membandingkan teks bukti dengan teks pembanding yang sudah terverifikasi kepenulisannya.

#### 6.3 Analisis Konten dan Ancaman

Dalam kriminologi, sangat penting untuk membedakan antara **ancaman nyata** dan sekadar **luapan emosi**. Linguistik forensik membantu menentukan:

- Keberadaan niat (*intent*) yang jelas dalam teks.
- Tingkat risiko berdasarkan pola komunikasi yang digunakan.

### Ringkasan Praktis: Strategi AWK Digital

Untuk menerapkan AWK di era digital, peneliti harus memperhatikan tiga elemen kunci:

- **Arsitektur Platform:** Memahami bagaimana desain media sosial (seperti tombol *like* atau algoritma rekomendasi) memengaruhi cara pesan kriminalitas disampaikan.
- **Aktor Non-Manusia:** Mengakui dan menganalisis peran *bot* serta kecerdasan buatan dalam memproduksi wacana.
- **Resistensi Digital:** Mencari narasi tandingan dari kelompok-kelompok yang terpinggirkan melalui tagar atau gerakan bawah tanah digital.

> **Insight Utama:** Masa depan kriminologi bukan lagi sekadar menghitung jumlah kejahatan, melainkan membongkar bagaimana **wacana digital** mendefinisikan apa yang dianggap sebagai kejahatan, siapa yang dianggap sebagai musuh, dan sejauh mana masyarakat rela menyerahkan kebebasan demi rasa aman yang dikonstruksikan secara digital.
