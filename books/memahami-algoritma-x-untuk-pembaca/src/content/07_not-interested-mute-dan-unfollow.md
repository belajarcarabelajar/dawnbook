## Not Interested, Mute, dan Unfollow

Beberapa minggu lalu kamu meminta X menampilkan lebih sedikit post dari seorang penulis, tetapi kini namanya perlahan muncul lagi di berandamu. Wajar kalau kamu curiga tombolnya rusak atau permintaanmu diabaikan. Penjelasannya bisa lebih sederhana: setiap kontrol di X mengubah hal yang berbeda, dan setidaknya di kode lama, ada jenis permintaan yang memang dirancang untuk memudar. Bab ini memetakan kontrol yang cocok untuk tiap masalah, lalu membedah satu mekanisme "tampilkan lebih sedikit" yang menjelaskan kenapa efeknya bisa melemah.

### Pilih Kontrol Sesuai Masalahnya

Tidak semua gangguan perlu ditangani dengan tombol yang sama. Isi tabel di bawah bersandar pada halaman bantuan X tentang [pendekatan rekomendasi](https://help.x.com/en/rules-and-policies/recommendations), [mute akun](https://help.x.com/en/using-x/x-mute), dan [opsi mute lanjutan](https://help.x.com/en/using-x/advanced-x-mute-options). Nama dan letak menu bisa berbeda menurut perangkat, wilayah, dan versi aplikasi.

| Masalah | Tindakan paling langsung | Batas yang perlu diingat |
| --- | --- | --- |
| Satu rekomendasi tidak relevan | Not interested in this post, atau Not interested in this Topic | X akan merekomendasikan lebih sedikit konten sejenis, bukan menjamin seluruh topik hilang |
| Penulis yang direkomendasikan terus berulang | Opsi tampilkan lebih sedikit dari penulis itu, jika tersedia | Efeknya bisa memudar, seperti dibahas di bawah |
| Satu akun terus mengganggu | Mute akun | Akun itu tidak diberi tahu; kalau kamu mengikutinya, balasan dan mention-nya tetap masuk Notifications dan balasannya tetap tampil di dalam percakapan; DM tidak terpengaruh |
| Akun di Following tidak lagi kamu perlukan | Unfollow, atau mute jika ingin tetap mengikuti tanpa melihat post-nya | Unfollow berhenti mengikuti, sedangkan mute menyembunyikan post tanpa berhenti mengikuti |
| Frasa, nama, atau hashtag mengganggu | Muted words untuk Home timeline dan/atau Notifications | Juga menyembunyikan post di balasan serta notifikasi push, SMS, dan email; durasinya Forever (bawaan), 24 jam, 7 hari, atau 30 hari; notifikasi seluler yang kamu nyalakan untuk akun yang kamu ikuti tetap lolos; cara kerjanya mencocokkan kata, bukan memahami topik |
| Percakapan mengirim notifikasi terus-menerus | Mute this conversation | Notifikasinya berhenti, tetapi post di percakapan itu masih bisa muncul di timeline |
| Ada pelanggaran aturan | Report dengan alasan yang jujur dan sesuai | Jangan memakai report massal untuk konten yang sekadar tidak kamu sukai |
| Kamu butuh batas interaksi dengan satu akun | Block | Periksa kebijakan block yang berlaku saat ini sebelum menyimpulkan efeknya |

Satu catatan soal mute: X menyebut bahwa mute hanya berlaku untuk notifikasi dan Home timeline. Jadi jangan berharap kata yang kamu bisukan lenyap dari semua tempat, termasuk hasil pencarian.

### Jejak SeeFewer di Implementasi Lama

Kembali ke penulis yang muncul lagi tadi. Repositori twitter/the-algorithm (pembaruan September 2025) memberi gambaran konkret tentang cara permintaan semacam itu melemah. Di sana, SeeFewer adalah nama kode untuk satu jenis umpan balik yang meminta lebih sedikit rekomendasi dari sumber tertentu. Nama itu belum tentu tampil persis di menu aplikasi.

Komponen bernama `FeedbackFatigueScorer` ([berkas kodenya](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/functional_component/scorer/FeedbackFatigueScorer.scala)) hanya menghitung entri SeeFewer yang berusia di bawah 140 hari. Untuk satu faktor yang cocok, pengali skornya dimulai dari 0,2 lalu naik 0,2 setiap 35 hari.

| Usia entri SeeFewer | Pengali satu faktor |
| --- | --- |
| Hari 0 | 0,2 |
| Hari 35 | 0,4 |
| Hari 70 | 0,6 |
| Hari 105 | 0,8 |
| Hari 140 | 1,0, netral karena entri keluar dari jendela hitungan |

Jika $t$ adalah usia entri dalam hari, rumus di kode itu berupa garis lurus yang melewati kelima titik di tabel:

<div>

$$
m(t)=0{,}2+0{,}8\times\frac{t}{140}\quad\text{untuk } 0\leq t<140
$$

</div>

Mulai hari ke-140, entri itu tidak lagi dihitung, sehingga pengalinya menjadi 1 dan tidak ada potongan sama sekali.

Ada syarat yang menyertainya. Jenis umpan baliknya harus SeeFewer, dan entrinya harus cocok dengan kandidat post. Kode juga memisahkan faktor untuk penulis asli, liker, follower, dan akun yang me-repost. Faktor-faktor itu saling dikalikan, tetapi masing-masing hanya berlaku bila syaratnya sendiri terpenuhi: faktor liker hanya jika semua liker yang ditampilkan terkena potongan, faktor follower hanya jika semua follower yang ditampilkan terkena potongan dan tidak ada liker, dan faktor reposter hanya untuk repost.

Angka 0,2 juga mudah disalahpahami. Pada skor dasar yang positif, $m(t)$ sebesar 0,2 mempertahankan 20% skor dari faktor tersebut. Itu bukan peluang 20% bagi post untuk muncul.

### Penyaring Bukan Pengurang Skor

Implementasi lama juga punya `FeedbackFatigueFilter`, yang hanya membaca SeeFewer dengan durasi bawaan 14 hari dan bisa diatur dari 0 sampai 100 hari. Penyaring menyingkirkan kandidat, sedangkan scorer hanya menurunkan skornya, jadi keduanya mekanisme berbeda dengan jam masing-masing. Tidak satu pun mengatur ulang riwayat minatmu. Ingat juga, semua ini menggambarkan jalur SeeFewer di kode tersebut, bukan cara kerja setiap tombol Not interested.

Kalau X masih memakai mekanisme serupa, potongan skor itu menipis dari minggu ke minggu, sehingga wajar bila penulis tadi pelan-pelan kembali. Meski begitu, repositori lama tidak membuktikan bahwa sistem produksi hari ini bekerja persis seperti itu.

### Repositori Baru Menyaring Lebih Dulu

Repositori xai-org/x-algorithm memakai urutan yang berbeda. Akun yang kamu block dan mute, serta kata kunci yang kamu bisukan, disaring sebelum tahap penilaian, sehingga post semacam itu tidak ikut dinilai. Di tahap penilaian, prediksi bahwa kamu akan menekan not interested, mute, block, atau report diberi bobot negatif. Angka bobotnya sudah dibahas di bab 6.

### Batas Jangka Panjang dengan Satu Akun

Kalau kamu ingin menjaga jarak dari satu akun dalam waktu lama, mute atau unfollow lebih langsung daripada mengandalkan satu umpan balik lama. Untuk kata yang ramai sesaat, misalnya istilah dari satu peristiwa, durasi 24 jam, 7 hari, atau 30 hari membuat mute itu berakhir sendiri. Sesekali, buka juga daftar mute-mu, karena akun atau kata yang dulu mengganggu bisa saja kini menjadi sumber berguna yang ikut tertutup.

## Kesimpulan Bab

- Pilih kontrol menurut masalahnya: Not interested untuk satu rekomendasi, mute atau unfollow untuk akun, muted words untuk frasa, dan report hanya untuk pelanggaran.
- Mute berlaku pada notifikasi dan Home timeline, dengan pengecualian yang perlu kamu kenali.
- Di implementasi lama, pengali SeeFewer naik dari 0,2 ke 1,0 dalam 140 hari, sementara penyaringnya berdurasi bawaan 14 hari, dan keduanya tidak menghapus riwayat minat.
- Repositori baru menyaring akun dan kata yang kamu bisukan sebelum penilaian, lalu memberi bobot negatif pada prediksi reaksi negatif.

Mengenal tombol-tombol ini baru separuh jalan, dan separuh sisanya adalah benar-benar menata Lists, Following, dan daftar mute di akunmu sendiri.
