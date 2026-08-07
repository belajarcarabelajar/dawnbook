## Teori Permainan Kooperatif dan Nilai Shapley: Seni Berbagi Secara Adil

Dalam bagian-bagian sebelumnya, kita banyak belajar tentang bagaimana pemain bersaing untuk mendapatkan hasil terbaik bagi diri mereka sendiri. Namun, di dunia nyata, sering kali jauh lebih menguntungkan jika kita bekerja sama daripada saling menjatuhkan.

Selamat datang di dunia **Teori Permainan Kooperatif**. Di sini, fokus kita bergeser dari "Bagaimana saya menang?" menjadi "Bagaimana kita bisa bekerja sama, dan bagaimana kita membagi keuntungannya dengan adil?"

## 1. Apa itu Teori Permainan Kooperatif?

Berbeda dengan permainan non-kooperatif (seperti Dilema Tahanan) di mana pemain tidak bisa membuat kesepakatan yang mengikat, dalam **permainan kooperatif**, pemain dapat berkomunikasi, membentuk kelompok yang disebut **koalisi**, dan membuat perjanjian yang berkekuatan hukum atau moral.

### Konsep Utama: Fungsi Karakteristik

Dalam permainan kooperatif, setiap kelompok (koalisi) memiliki nilai tertentu yang bisa mereka capai jika bekerja sama. Ini disebut sebagai **Fungsi Karakteristik**, dilambangkan dengan $v(S)$, di mana $S$ adalah sebuah koalisi.

- **Koalisi Besar (Grand Coalition):** Situasi di mana semua pemain dalam permainan bergabung menjadi satu kelompok besar.
- **Nilai Koalisi ($v$):** Jumlah total keuntungan (atau penghematan biaya) yang dihasilkan oleh kelompok tersebut.

> **Analogi Sederhana:** Bayangkan tiga orang teman: Andi, Budi, dan Caca.
> 
> - Andi punya tepung.
> - Budi punya telur.
> - Caca punya oven. Secara individu, mereka tidak bisa membuat kue. Namun, jika mereka membentuk koalisi besar, mereka bisa membuat kue raksasa seharga Rp100.000. Masalahnya: **Siapa yang berhak mendapatkan berapa bagian dari Rp100.000 tersebut?**

## 2. Nilai Shapley: Definisi Keadilan

Pertanyaan tentang "pembagian yang adil" adalah inti dari karya **Lloyd Shapley**, yang memenangkan Hadiah Nobel Ekonomi pada tahun 2012. **Nilai Shapley (Shapley Value)** adalah cara untuk membagi total keuntungan di antara para pemain berdasarkan kontribusi rata-rata mereka terhadap semua kemungkinan koalisi yang ada.

### Mengapa Kita Butuh Nilai Shapley?

Kita tidak bisa sekadar membagi rata. Jika Andi memberikan kontribusi yang jauh lebih besar daripada Caca, pembagian rata akan terasa tidak adil. Nilai Shapley memberikan solusi matematis yang memenuhi kriteria "adil" melalui empat aksioma utama:

1. **Efisiensi (Efficiency):** Seluruh keuntungan harus dibagikan habis kepada para pemain. Tidak ada sisa dan tidak ada kekurangan.
2. **Simetri (Symmetry):** Jika dua pemain memiliki kontribusi yang sama persis di setiap situasi, mereka harus mendapatkan bagian yang sama.
3. **Pemain Nol (Null Player):** Jika seorang pemain tidak menambah nilai apa pun pada koalisi mana pun, dia mendapatkan nol.
4. **Aditif (Additivity):** Jika ada dua permainan berbeda, total bagian pemain adalah jumlah bagian dari masing-masing permainan tersebut.

## 3. Matematika di Balik Nilai Shapley

Untuk menghitung Nilai Shapley bagi pemain $i$, kita melihat kontribusi marginalnya. Kontribusi marginal adalah: *Berapa banyak nilai yang bertambah ketika pemain $i$ bergabung ke dalam kelompok yang sudah ada?*

Rumusnya adalah:

$$
\phi_i(v) = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|! (n - |S| - 1)!}{n!} [v(S \cup \{i\}) - v(S)]
$$

**Keterangan:**

- $n$: Jumlah total pemain.
- $S$: Sebuah koalisi yang tidak menyertakan pemain $i$.
- $v(S \cup \{i\}) - v(S)$: Kontribusi marginal pemain $i$ saat bergabung ke koalisi $S$.
- $\frac{|S|! (n - |S| - 1)!}{n!}$: Probabilitas pemain $i$ bergabung ke koalisi tersebut dalam urutan acak.

*Apakah adil jika seseorang yang bergabung terakhir mendapatkan bagian yang sama dengan orang yang merintis dari awal? Nilai Shapley menjawab ini dengan merata-ratakan semua urutan kedatangan yang mungkin.*

## 4. Contoh Perhitungan: Masalah Taksi

Mari kita lihat skenario dunia nyata yang sering kita alami.

**Skenario:** Tiga orang (A, B, dan C) berbagi taksi untuk pulang.

- Rumah A berjarak Rp10.000 (jika naik sendiri).
- Rumah B berjarak Rp20.000.
- Rumah C berjarak Rp30.000. Taksi tersebut melewati jalur yang sama, sehingga total biaya untuk mengantar ketiganya adalah Rp30.000. Bagaimana mereka harus membagi biayanya?

**Langkah-langkah Nilai Shapley:**

1. **Pemain A:** Dia harus membayar bagian dari biaya sampai ke rumahnya. Karena ada 3 orang yang menikmati perjalanan tersebut, A membayar $10.000 / 3 = 3.333$.
2. **Pemain B:** Dia berbagi biaya $10.000$ pertama dengan A dan C, lalu dia berbagi biaya $10.000$ berikutnya (dari rumah A ke rumah B) hanya dengan C. Jadi: $(10.000/3) + (10.000/2) = 3.333 + 5.000 = 8.333$.
3. **Pemain C:** Dia berbagi biaya dengan A dan B, lalu dengan B saja, lalu menanggung sisa perjalanan sendiri. Jadi: $(10.000/3) + (10.000/2) + 10.000 = 3.333 + 5.000 + 10.000 = 18.333$.

**Total:** $3.333 + 8.333 + 18.333 \approx 30.000$.

## 5. Aplikasi Dunia Nyata

Konsep kooperatif dan Nilai Shapley bukan hanya teori di atas kertas. Ini digunakan di berbagai bidang canggih:

### A. Alokasi Biaya Bandara (The Airport Problem)

Bandara melayani berbagai jenis pesawat, mulai dari jet kecil hingga Boeing 747. Pesawat besar butuh landasan pacu yang lebih panjang dan kuat (lebih mahal). Nilai Shapley digunakan untuk menentukan biaya pendaratan yang adil bagi setiap jenis pesawat sehingga maskapai kecil tidak mensubsidi maskapai besar secara tidak proporsional.

### B. Machine Learning (Explainable AI)

Dalam kecerdasan buatan, kita sering bertanya: *"Fitur mana yang paling berpengaruh terhadap prediksi model?"* Para ahli menggunakan **SHAP (SHapley Additive exPlanations)** untuk memecah kontribusi setiap variabel input terhadap hasil akhir model.

### C. Kekuatan Pemungutan Suara (Voting Power)

Dalam parlemen atau dewan direksi, jumlah kursi tidak selalu mencerminkan kekuatan sebenarnya. Nilai Shapley-Shubik membantu mengukur seberapa sering seorang pemain menjadi "penentu" (pivotal) dalam sebuah pemungutan suara untuk meloloskan kebijakan.

## 6. Ringkasan Strategis

> **Pesan Utama:** Teori permainan kooperatif mengajarkan kita bahwa sinergi kelompok dapat menciptakan nilai yang lebih besar daripada usaha individu. Namun, keberlanjutan kerja sama sangat bergantung pada **mekanisme pembagian yang dirasakan adil oleh semua anggota.**

**Latihan Cepat (Kinestetik):** Cobalah hitung pembagian biaya langganan paket keluarga (seperti Netflix atau Spotify) di antara teman-teman kamu menggunakan logika Nilai Shapley jika setiap orang memiliki frekuensi penggunaan yang berbeda. Apakah hasil pembagiannya berbeda jauh dengan pembagian rata?

*Bagian selanjutnya akan membahas bagaimana konsep-konsep ini diterapkan secara luas dalam strategi persaingan bisnis dan ekonomi makro.*
