## Big Data: Bahan Bakar Utama Algoritma

Bayangkan sebuah mesin jet yang paling canggih di dunia. Tanpa bahan bakar berkualitas tinggi, mesin tersebut hanyalah tumpukan besi tua yang diam. Dalam ekosistem periklanan digital, **Algoritma** adalah mesin jetnya, dan **Big Data** adalah bahan bakarnya.

Tanpa aliran data yang masif dan terus-menerus, algoritma tidak akan bisa memprediksi apakah kamu sedang mencari sepatu lari baru atau sedang merencanakan liburan ke Bali. Di bagian ini, kita akan membedah jenis-jenis "bahan bakar" yang dikumpulkan oleh platform digital untuk menggerakkan mesin penargetan mereka.

### 1. Mengenal Karakteristik Big Data dalam Periklanan

Sebelum masuk ke jenis datanya, kita perlu memahami mengapa data ini disebut "Big". Dalam industri AdTech (Advertising Technology), data dikelola berdasarkan prinsip **5V**:

1. **Volume:** Jumlah data yang sangat besar (terabyte hingga petabyte setiap hari).
2. **Velocity:** Kecepatan data yang masuk secara *real-time* (setiap klik dan scroll dihitung saat itu juga).
3. **Variety:** Format data yang beragam (teks, gambar, video, koordinat GPS).
4. **Veracity:** Keakuratan data untuk memastikan profil pengguna benar-benar valid.
5. **Value:** Nilai ekonomi yang dihasilkan dari pengolahan data tersebut menjadi iklan yang konversinya tinggi.

> "Data adalah minyak baru, tetapi seperti minyak, ia tidak berguna jika tidak dimurnikan. Big Data dalam iklan adalah proses pemurnian perilaku manusia menjadi prediksi yang dapat dijual."

### 2. Taksonomi Data: Apa Saja yang Mereka Ketahui?

Algoritma membangun profil digital kamu (sering disebut sebagai *User Persona*) dengan menggabungkan berbagai lapisan data berikut:

#### A. Data Demografis (Siapa Kamu?)

Ini adalah lapisan paling dasar. Data ini memberikan kerangka tentang identitas fisik dan sosial kamu.

- **Komponen:** Usia, jenis kelamin, status pernikahan, tingkat pendidikan, pekerjaan, dan perkiraan pendapatan.
- **Analogi:** Seperti melihat KTP seseorang untuk mengetahui profil dasarnya.

#### B. Data Geografis (Di Mana Kamu?)

Algoritma sangat peduli dengan lokasi kamu karena relevansi iklan sering kali bergantung pada jarak.

- **Komponen:** Lokasi GPS terkini, alamat IP, kota tempat tinggal, hingga riwayat perjalanan.
- **Kegunaan:** Menampilkan iklan promo restoran yang hanya berjarak 500 meter dari posisi kamu saat ini.

#### C. Data Minat & Psikografis (Apa yang Kamu Sukai?)

Di sinilah algoritma mulai "mengenal" kepribadian kamu. Data ini jauh lebih berharga daripada sekadar demografi.

- **Komponen:** Hobi (misal: *cycling*, *skincare*), nilai-nilai yang dianut, gaya hidup, dan opini politik.
- **Cara Pengumpulan:** Melalui akun yang kamu ikuti, grup yang kamu masuki, dan konten yang kamu beri "Like".

#### D. Data Perilaku / Behavioral (Apa yang Kamu Lakukan?)

Ini adalah data yang paling prediktif. Perilaku masa lalu adalah indikator terbaik untuk keinginan masa depan.

- **Komponen:**
  - **Riwayat Penjelajahan:** Situs apa yang kamu kunjungi sebelum ke sini?
  - **Search Intent:** Apa yang kamu ketik di kolom pencarian?
  - **Interaksi:** Berapa lama kamu berhenti untuk menonton sebuah video (*dwell time*)?
  - **Riwayat Pembelian:** Apa yang terakhir kali kamu masukkan ke keranjang belanja tapi tidak jadi dibeli?

### 3. Klasifikasi Data Berdasarkan Sumbernya

Tidak semua data didapatkan dengan cara yang sama. Industri membaginya menjadi empat kategori utama:

| Jenis Data | Definisi | Contoh |
| --- | --- | --- |
| **Zero-party Data** | Data yang diberikan pengguna secara sadar dan sukarela. | Mengisi preferensi makanan saat mendaftar aplikasi. |
| **First-party Data** | Data yang dikumpulkan langsung oleh perusahaan dari interaksi di platform mereka sendiri. | Riwayat belanja kamu di aplikasi e-commerce favorit. |
| **Second-party Data** | First-party data milik perusahaan lain yang dibagikan atau dijual kepada kamu. | Maskapai penerbangan berbagi data dengan penyedia asuransi perjalanan. |
| **Third-party Data** | Data yang dikumpulkan oleh agregator dari berbagai sumber di seluruh internet. | Data dari broker data yang melacak aktivitas kamu di ribuan situs web. |

### 4. Representasi Teknis: Bagaimana Algoritma Melihat Kamu?

Secara teknis, profil kamu bukanlah nama atau foto, melainkan deretan kode dan angka dalam sebuah basis data. Berikut adalah gambaran sederhana bagaimana sebuah profil pengguna disimpan dalam format JSON untuk diproses oleh algoritma:

```json
{
  "user_id": "u987654321",
  "demographics": {
    "age_range": "25-34",
    "gender": "female",
    "location": "Jakarta Selatan"
  },
  "interests": ["minimalist_interior", "sustainable_fashion", "k-drama"],
  "behavioral_score": {
    "tech_savvy": 0.85,
    "impulse_buyer_index": 0.72,
    "travel_frequency": "high"
  },
  "recent_searches": ["meja kerja kayu jati", "tanaman indoor murah"],
  "active_device": "iPhone 15 Pro"
}
```

Dalam matematika statistik, probabilitas kamu akan mengklik iklan tertentu ($P$) dapat dirumuskan secara sederhana sebagai fungsi dari variabel-variabel tersebut:

$$
P(\text{Click}) = f(\text{Demografi}, \text{Minat}, \text{Perilaku}, \text{Konteks})
$$

### 5. Aplikasi Dunia Nyata: Skenario "The Ghost Ad"

Pernahkah kamu membicarakan suatu produk dengan teman, lalu tiba-tiba iklan produk tersebut muncul di media sosial kamu? Meskipun sering dianggap "mendengarkan pembicaraan", kenyataannya algoritma sering kali hanya menggunakan **Big Data** secara sangat cerdas:

- **Skenario:** Budi dan Andi adalah teman dekat (data grafik sosial).
- **Aksi:** Andi baru saja membeli jam tangan merek X (data perilaku).
- **Reaksi Algoritma:** Algoritma tahu Budi memiliki minat yang sama dengan Andi dan mereka sering berada di lokasi yang sama (data geografis).
- **Hasil:** Algoritma menyimpulkan bahwa Budi kemungkinan besar juga tertarik pada jam tangan merek X, lalu menampilkan iklannya di ponsel Budi.

### 6. Rangkuman Pembelajaran

- **Big Data** adalah fondasi yang memungkinkan iklan tidak lagi bersifat massal, melainkan personal.
- Data dikumpulkan dari berbagai aspek: **siapa kita** (demografis), **di mana kita** (geografis), **apa yang kita rasakan** (minat), dan **apa yang kita lakukan** (perilaku).
- Kombinasi dari berbagai sumber data (Zero, First, Second, Third party) menciptakan profil digital yang sangat akurat.

**Penting:** Meskipun Big Data memberikan kenyamanan berupa iklan yang relevan, pengumpulannya memicu perdebatan besar mengenai privasi. Hal ini akan kita bahas lebih mendalam pada bagian **Etika Periklanan dan Privasi Data**.
