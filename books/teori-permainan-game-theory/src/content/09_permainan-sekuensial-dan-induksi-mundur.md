## Permainan Sekuensial dan Induksi Mundur: Menatap Masa Depan untuk Menentukan Masa Kini

Bayangkan kamu sedang bermain catur. Sebelum kamu menggerakkan bidak, kamu tidak hanya memikirkan posisi saat ini, tetapi kamu mencoba membayangkan: *"Jika saya melangkah ke A, lawan akan melangkah ke B. Jika lawan melangkah ke B, saya akan membalas dengan C."*

Inilah inti dari **Permainan Sekuensial**. Berbeda dengan permainan simultan (seperti Batu-Gunting-Kertas) di mana semua orang bergerak bersamaan, dalam permainan sekuensial, urutan waktu dan informasi adalah segalanya.

## 1. Apa Itu Permainan Sekuensial?

**Permainan Sekuensial** adalah situasi strategis di mana para pemain melakukan langkah secara bergantian. Pemain yang bergerak belakangan memiliki keuntungan informasi: mereka bisa melihat apa yang dilakukan pemain sebelumnya sebelum menentukan langkah mereka sendiri.

**Karakteristik Utama:**

- **Urutan (Turns):** Ada pemain pertama, kedua, dan seterusnya.
- **Informasi Sempurna (Perfect Information):** Pemain mengetahui langkah yang telah diambil sebelumnya (meskipun tidak selalu demikian dalam semua model, kita akan fokus pada informasi sempurna di sini).
- **Representasi:** Biasanya digambarkan menggunakan **Bentuk Ekstensif** atau sering disebut sebagai **Pohon Permainan (Game Tree)**.

## 2. Mengenal Pohon Permainan (Game Tree)

Sebelum kita melakukan analisis, kita harus memahami struktur "peta" permainan ini:

1. **Simpul Keputusan (Decision Nodes):** Titik di mana seorang pemain harus memilih tindakan.
2. **Cabang (Branches):** Mewakili pilihan tindakan yang tersedia.
3. **Simpul Terminal (Terminal Nodes):** Titik akhir permainan di mana hasil ditentukan.
4. **Hasil (Payoffs):** Angka yang menunjukkan keuntungan/kerugian bagi setiap pemain di akhir jalur tertentu.

## 3. Induksi Mundur (Backward Induction): Logika Detektif

Teknik paling ampuh untuk memecahkan permainan sekuensial adalah **Induksi Mundur (Backward Induction)**.

> **Insight:** Induksi mundur adalah proses menganalisis permainan dari akhir (langkah terakhir) kembali ke awal untuk menentukan urutan langkah yang optimal.

### Mengapa Harus dari Belakang?

Karena untuk mengetahui apa yang harus kamu lakukan sekarang (langkah pertama), kamu harus tahu bagaimana lawanmu akan bereaksi nanti. Dan untuk tahu bagaimana lawan bereaksi, kamu harus tahu bagaimana kamu akan menanggapi reaksi tersebut, dan seterusnya hingga permainan berakhir.

### Langkah-langkah Melakukan Induksi Mundur:

1. Pergilah ke simpul keputusan terakhir dalam pohon permainan (paling kanan atau paling bawah).
2. Tentukan tindakan mana yang akan diambil oleh pemain di simpul tersebut untuk memaksimalkan hasil (*payoff*) mereka sendiri.
3. Hapus pilihan lain yang tidak optimal (cabang yang "layu").
4. Anggap hasil dari pilihan optimal tersebut sebagai hasil dari simpul itu.
5. Bergerak mundur ke simpul keputusan sebelumnya dan ulangi proses tersebut hingga mencapai awal permainan.

## 4. Studi Kasus: Permainan Masuk Pasar (Market Entry)

Mari kita gunakan skenario nyata untuk memahami konsep ini.

**Skenario:** Ada dua perusahaan: **Pendatang (P)** dan **Petahana (B)**.

1. **P** harus memilih: **Masuk** ke pasar atau **Tetap Keluar**.
2. Jika **P** masuk, **B** (yang sudah ada di pasar) punya dua pilihan: **Bertarung** (perang harga) atau **Akomodasi** (berbagi pasar).

**Data Hasil (Payoff):** (Pendatang, Petahana)

- Jika P Tetap Keluar: $(0, 10)$
- Jika P Masuk dan B Bertarung: $(-2, -1)$
- Jika P Masuk dan B Akomodasi: $(2, 5)$

### Analisis dengan Induksi Mundur:

1. **Lihat Langkah Terakhir:** Langkah terakhir ada di tangan **Petahana (B)** jika P masuk.
   - Jika B Bertarung, hasilnya $-1$.
   - Jika B Akomodasi, hasilnya $5$.
   - *Pilihan Rasional B:* B akan memilih **Akomodasi** karena $5 > -1$.
2. **Bergerak Mundur ke Langkah Pertama:** Sekarang **Pendatang (P)** membuat keputusan. P tahu bahwa jika dia masuk, B pasti akan memilih Akomodasi (berdasarkan analisis langkah 1).
   - Jika P Masuk: Dia akan mendapat $2$ (karena B akan akomodasi).
   - Jika P Tetap Keluar: Dia mendapat $0$.
   - *Pilihan Rasional P:* P akan memilih **Masuk** karena $2 > 0$.

**Hasil Akhir (Ekuilibrium):** Pendatang Masuk, dan Petahana melakukan Akomodasi.

## 5. Ekuilibrium Nash Sempurna Subpermainan (Subgame Perfect Nash Equilibrium - SPNE)

Hasil yang kita temukan melalui induksi mundur disebut **Subgame Perfect Nash Equilibrium (SPNE)**. Ini adalah konsep yang lebih kuat daripada Ekuilibrium Nash biasa.

**Mengapa ini penting?** Dalam permainan sekuensial, seringkali ada "ancaman kosong" (*incredible threats*). Misalnya, Petahana (B) mungkin mengancam: *"Kalau kamu masuk, saya akan bertarung sampai kita berdua bangkrut!"*

Namun, melalui induksi mundur, Pendatang (P) tahu bahwa ancaman itu tidak rasional. Saat benar-benar dihadapkan pada pilihan di akhir, Petahana akan lebih memilih untung $5$ daripada rugi $-1$. Induksi mundur membantu kita menyaring strategi yang hanya berupa gertakan.

## 6. Contoh Teknis: Kode Logika Sederhana

Dalam pemrograman atau AI, kita sering menggunakan algoritma **Minimax** (bentuk dari induksi mundur) untuk permainan seperti Tic-Tac-Toe.

```python
# Pseudo-code logika induksi mundur sederhana
def decision_making(node):
    if node.is_terminal():
        return node.payoff
    
    # Pemain ingin memaksimalkan payoff-nya
    best_value = -float('inf')
    for action in node.possible_actions():
        value = decision_making(action.result_node())
        best_value = max(best_value, value)
    
    return best_value

# Hasilnya adalah nilai terbaik yang bisa didapat 
# dengan asumsi lawan juga bermain optimal secara mundur.
```

## 7. Aplikasi Dunia Nyata dan Kasus Praktis

1. **Negosiasi Gaji:** Calon karyawan memberikan angka pertama (jangkar), perusahaan merespons. Calon karyawan harus memikirkan: *"Jika saya meminta X, apakah mereka akan menolak atau memberikan penawaran kontra Y?"*
2. **Catur dan Board Games:** Mesin catur seperti Stockfish menggunakan evaluasi jutaan posisi ke depan dan melakukan induksi mundur untuk menemukan langkah terbaik saat ini.
3. **Strategi Militer:** Analisis langkah-demi-langkah dalam penyebaran pasukan, di mana reaksi musuh terhadap setiap gerakan harus diantisipasi sebelum perintah pertama diberikan.

## 8. Tantangan dan Batasan

Meskipun secara teori sangat kuat, induksi mundur memiliki kelemahan dalam praktik:

- **Rasionalitas Terbatas (Bounded Rationality):** Manusia tidak selalu rasional secara sempurna. Kadang orang melakukan tindakan balas dendam meskipun itu merugikan diri mereka sendiri (menghancurkan asumsi SPNE).
- **Kompleksitas Komputasi:** Dalam permainan seperti Catur atau Go, jumlah kemungkinan langkah sangat besar sehingga tidak mungkin melakukan induksi mundur hingga ke akhir yang absolut bagi otak manusia (dan bahkan komputer super).
- **Masalah Kepercayaan:** Jika ada ketidakpastian informasi, induksi mundur menjadi jauh lebih sulit dilakukan.

### Bahan Pertimbangan:

> Jika kamu sedang bernegosiasi dengan seseorang yang dikenal sangat emosional dan tidak rasional, apakah teknik Induksi Mundur masih bisa diandalkan sepenuhnya? Mengapa strategi "ancaman gila" terkadang berhasil dalam politik internasional meskipun secara matematis tidak rasional?

**Poin Penting untuk Diingat:**

- **Induksi Mundur** adalah cara berpikir "Melihat ke Depan, Menalar ke Belakang" (*Look forward, reason backward*).
- Gunakan **Pohon Permainan** untuk memetakan setiap kemungkinan.
- Abaikan **ancaman yang tidak kredibel**; fokuslah pada apa yang akan dilakukan pemain secara rasional saat mereka benar-benar berada di posisi tersebut.
