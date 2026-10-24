## Teori Permainan Algoritmik dan AI

Teori permainan algoritmik memadukan matematika, ekonomi, dan ilmu komputer. Jika sebelumnya kita telah mempelajari bagaimana manusia mengambil keputusan strategis, sekarang kita akan mengeksplorasi apa yang terjadi ketika **algoritma** dan **kecerdasan buatan (AI)** menjadi pemainnya.

Bayangkan jutaan bot perdagangan saham, mobil otonom, dan algoritma lelang iklan saling berinteraksi setiap milidetik. Bagaimana kita memastikan sistem serumit ini tetap stabil dan efisien? Jawabannya terletak pada **Teori Permainan Algoritmik (Algorithmic Game Theory - AGT)**.

## 1. Jembatan Antara Insentif dan Komputasi

Teori permainan klasik sering kali berasumsi bahwa pemain memiliki kecerdasan tak terbatas dan waktu yang cukup untuk menghitung strategi terbaik. Namun, dalam dunia nyata (terutama internet), kita menghadapi dua kendala besar:

1. **Kompleksitas Komputasi**: Menghitung Ekuilibrium Nash untuk permainan besar bisa memakan waktu ribuan tahun, bahkan bagi komputer tercepat.
2. **Masalah Insentif**: Pengguna internet bertindak demi kepentingan pribadi. Mereka akan memanipulasi sistem jika itu menguntungkan mereka.

> **Wawasan Penting:** Teori Permainan Algoritmik adalah studi tentang desain dan analisis sistem ketika partisipan yang bertindak demi kepentingan pribadi (*selfish*) berinteraksi dalam lingkungan komputasi.

### Kemacetan Lalu Lintas Digital

Bayangkan aplikasi GPS seperti Google Maps atau Waze. Setiap pengemudi (agen) ingin rute tercepat untuk dirinya sendiri. Jika semua orang mengambil rute tercepat yang sama, jalan tersebut akan macet.

- **Game Theory** bertanya: "Di mana titik keseimbangannya?"
- **Algorithmic Game Theory** bertanya: "Seberapa buruk kemacetan ini dibandingkan jika ada pengatur pusat, dan bagaimana kita mendesain algoritma agar orang tidak berbohong tentang tujuan mereka?"

## 2. Price of Anarchy (Biaya Anarki)

Salah satu konsep terpenting dalam AGT adalah **Price of Anarchy (PoA)**. Ini adalah metrik yang mengukur seberapa besar efisiensi yang hilang karena perilaku individualistis pemain dibandingkan dengan hasil optimal yang diatur secara terpusat.

Secara matematis, $\text{PoA}$ didefinisikan sebagai:

$$
\text{PoA} = \frac{\text{Kesejahteraan Sosial pada Kondisi Terburuk (Equilibrium)}}{\text{Kesejahteraan Sosial Optimal (Ideal)}}
$$

Jika $\text{PoA}$ mendekati 1, maka perilaku individualistis pemain tidak merusak sistem. Jika $\text{PoA}$ besar, maka kita butuh intervensi atau desain mekanisme yang lebih baik.

## 3. Sistem Multi-Agen (Multi-Agent Systems - MAS)

Dalam AI, kita sering tidak hanya membangun satu model, melainkan ekosistem ketika banyak agen berinteraksi.

### Karakteristik MAS

- **Otonomi**: Setiap agen mengambil keputusan sendiri.
- **Interaksi**: Hasil satu agen bergantung pada tindakan agen lain.
- **Tujuan Berbeda**: Agen bisa bekerja sama (kooperatif) atau bersaing (kompetitif).

**Contoh Skenario Lelang Iklan Real-Time**
Saat kamu membuka halaman web, di balik layar terjadi lelang instan untuk menentukan iklan mana yang muncul. Ribuan algoritma penawar (*bidding agents*) bersaing dalam hitungan milidetik. Di sini, AI harus memutuskan berapa nilai penawaran yang optimal tanpa mengetahui penawaran lawan, menggunakan prinsip-prinsip teori permainan.

## 4. Desain Mekanisme (Mechanism Design)

Jika Teori Permainan adalah tentang "memprediksi hasil dari aturan yang ada", maka **Desain Mekanisme** adalah kebalikannya: "mendesain aturan untuk mencapai hasil yang diinginkan". Ini sering disebut sebagai **Reverse Game Theory**.

Tujuannya adalah menciptakan sistem yang *Strategy-Proof* (tahan manipulasi). Artinya, strategi terbaik bagi pemain adalah berkata jujur.

### Lelang Vickrey (Second-Price Auction)

Salah satu pencapaian besar dalam desain mekanisme adalah lelang harga kedua.

- **Aturan**: Pemenang adalah penawar tertinggi, tetapi harga yang dibayar adalah tawaran tertinggi kedua.
- **Mengapa AI menyukai ini?**: Dalam mekanisme ini, strategi dominan bagi setiap agen adalah menawar tepat sesuai nilai asli barang tersebut. Tidak perlu menebak-nebak lawan!

## 5. AI di Papan Permainan

Dalam pengembangan AI modern, teori permainan digunakan untuk melatih model agar bisa mengalahkan manusia atau mencapai efisiensi tinggi.

### Algoritma Minimax

Ini adalah fondasi AI untuk permainan *zero-sum* seperti Catur atau Tic-Tac-Toe. AI mencoba meminimalkan kemungkinan kerugian maksimum (*minimizing the maximum loss*).

Cara kerjanya bisa diringkas menjadi tiga aturan yang diterapkan di setiap posisi permainan:

1. **Berhenti di ujung.** Jika posisi itu sudah merupakan akhir permainan, atau AI sudah menelusuri sejauh batas langkah ke depan yang ditetapkan, posisi itu langsung diberi nilai.
2. **Giliran AI, pilih nilai tertinggi.** Pada gilirannya sendiri, AI memilih langkah yang menghasilkan nilai paling besar.
3. **Giliran lawan, anggap lawan memilih nilai terendah.** Pada giliran lawan, AI berasumsi lawan akan memilih langkah yang paling merugikan AI.

Nilai dari posisi-posisi paling ujung itu lalu dibawa mundur sampai ke posisi sekarang, sama seperti induksi mundur yang dibahas pada bab permainan sekuensial.

### Reinforcement Learning (RL) & Game Theory

Dalam **Multi-Agent Reinforcement Learning (MARL)**, agen belajar melalui uji coba (*trial-and-error*). Tantangannya adalah "target yang bergerak": saat Agen A belajar, lingkungan Agen B berubah karena perilaku Agen A berubah. Ini sering diselesaikan dengan mencari **Ekuilibrium Nash** dalam proses pelatihan.

## 6. Teori Permainan pada Iklan Digital, Spektrum Radio, Keamanan Siber, dan Kripto

1. **Google Ads & Meta Ads**: Menggunakan desain mekanisme tingkat lanjut untuk mengalokasikan ruang iklan secara efisien kepada jutaan pengiklan.
2. **Frekuensi Radio & Spektrum**: Pemerintah menggunakan lelang kombinatorial (berdasarkan AGT) untuk menjual hak frekuensi seluler senilai miliaran dolar.
3. **Keamanan Siber**: AI digunakan untuk memodelkan interaksi antara penyerang (*hacker*) dan pertahanan sistem sebagai permainan stokastik untuk memprediksi titik serangan.
4. **Ekonomi Kripto (Tokenomics)**: Protokol blockchain seperti Ethereum menggunakan teori permainan untuk memastikan validator bertindak jujur melalui sistem imbalan (*reward*) dan penalti (*slashing*).

## 7. Tantangan Masa Depan ketika AI Berhadapan dengan AI

Apa yang terjadi jika AI menjadi terlalu pintar dalam bernegosiasi? Ada risiko di mana algoritma secara tidak sengaja belajar untuk melakukan **kolusi** (bekerja sama secara rahasia) untuk menaikkan harga bagi konsumen.

*Coba bayangkan skenario ini: jika dua algoritma penetapan harga di toko online belajar bahwa mereka berdua untung lebih besar jika tidak pernah menurunkan harga, apakah itu sebuah kesuksesan AI atau kegagalan pasar?*

> **Pesan Utama:** Teori permainan algoritmik bukan hanya tentang menang, tetapi tentang membangun sistem yang adil, stabil, dan efisien secara komputasi ketika banyak agen mementingkan diri sendiri.

*Jika kamu merancang sebuah sistem yang dipakai banyak agen, aturan apa yang akan kamu buat agar berkata jujur menjadi strategi terbaik mereka?*
