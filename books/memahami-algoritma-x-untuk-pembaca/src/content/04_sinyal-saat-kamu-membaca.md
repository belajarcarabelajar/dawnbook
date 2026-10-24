## Sinyal yang Terkirim Saat Kamu Membaca

Kamu bisa memberi tahu sistem rekomendasi bahwa sebuah topik menarik bagimu tanpa pernah sekali pun menekan tombol like pada post tentang topik itu. Cukup buka percakapannya, baca balasan demi balasan, lalu kembali lagi besok. Dari luar kamu tampak diam, padahal dari sisi mesin kamu sedang bicara cukup lantang. Bab ini memetakan apa saja yang bisa terbaca dari aktivitasmu menurut kode yang dibuka untuk publik, dengan satu catatan: kode itu bukan salinan utuh sistem yang berjalan hari ini.

### Tombol yang Ditekan dan Jejak yang Tertinggal

Tindakan eksplisit adalah hal yang kamu lakukan dengan sengaja dan terlihat, seperti like, repost, reply, atau follow. Tindakan implisit muncul begitu saja selama membaca: mengklik post, menonton video, atau mampir ke profil seseorang. Dalam implementasi lama (repositori twitter/the-algorithm, pembaruan September 2025), dokumentasi User Signal Service (USS) menyebut kedua jenis ini sebagai bahan untuk mencari calon post dan menyusun fitur penilaian. Contoh sinyal eksplisit di sana adalah like, repost, dan reply, sedangkan contoh sinyal implisitnya klik post, tontonan video, dan kunjungan profil.

Ada juga Unified User Actions (UUA), aliran data real-time terpusat yang menghimpun berbagai tindakan pengguna, termasuk bookmark. USS dan UUA adalah nama komponen perangkat lunak di balik layar, bukan menu atau pengaturan yang bisa kamu nyalakan dan matikan.

### Dicatat, Dipakai, dan Diprediksi

Satu tindakan bisa memegang tiga peran berbeda. Ia bisa sekadar **dicatat** sebagai data. Ia bisa **dipakai sebagai masukan**, misalnya muncul di [tabel sinyal pencarian calon post](https://github.com/twitter/the-algorithm/blob/main/RETREIVAL_SIGNALS.md) yang memetakan 18 jenis sinyal ke enam komponen. Ia juga bisa **diprediksi oleh model**: [berkas keluaran model](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/model/PredictedScoreFeature.scala) di implementasi lama mendaftar 15 jenis keluaran prediksi, sebagian besar berupa perkiraan peluang kamu melakukan sesuatu terhadap sebuah post. Tercatat tidak otomatis berarti menjadi faktor utama. Kolom terakhir tabel berikut berisi saran, bukan bobot resmi.

| Aktivitas kamu | Peran dalam implementasi lama | Cara memakainya sebagai pembaca |
| --- | --- | --- |
| Follow | Masukan bagi semua komponen di tabel sinyal kecuali Light Ranking | Ikuti sumber yang berguna berulang kali, bukan karena satu post viral |
| Unfollow | Hanya tercantum di kolom USS | Lepaskan akun yang tak lagi kamu perlukan, tanpa berharap riwayat lama ikut lenyap |
| Like | Dipakai keenam komponen dan diprediksi model | Berikan pada tulisan yang memang layak kamu temui lagi |
| Unlike | Tercantum di kolom USS dan SimClusters | Koreksi like yang keliru, bukan penghapus minat |
| Reply | Dipakai semua komponen kecuali SimClusters; model memprediksi reply dan reply yang ditanggapi penulis | Balas saat ada pertanyaan atau diskusi nyata, bukan untuk "melatih" feed |
| Repost / quote | Keduanya dipakai semua komponen kecuali SimClusters; model memprediksi repost | Bagikan setelah klaimnya kamu periksa; quote untuk mengejek juga interaksi |
| Share | Tercantum di kolom USS dan FRS; model memprediksi share | Kirim ke orang yang memang membutuhkan bacaannya |
| Bookmark | Hanya di kolom USS, dicatat UUA, dan diprediksi model | Simpan untuk dipakai, dan jangan anggap bebas sinyal |
| Klik post | Sinyal implisit USS; di tabel muncul di kolom USS, FRS, dan sebagai label Light Ranking; ada dua prediksi "good click" | Buka untuk memahami isi atau mengecek sumber, bukan setiap utas yang memancing penasaran |
| Kunjungan profil | Tidak ada di tabel sinyal; disebut di dokumentasi USS dan menjadi masukan Real Graph; ada prediksi "good profile click" | Nilai sumber sebelum follow; kunjungan berulang karena kesal ikut tercatat |
| Dwell (lama berhenti di sebuah post) | Model memprediksi dwell | Baca sewajarnya, tidak perlu menahan layar sekian detik |
| Menonton video | Di kolom USS, SimClusters, dan label Light Ranking; ada beberapa prediksi terkait video | Matikan autoplay bila ingin sesi yang fokus pada teks |
| Not interested | Hanya di kolom USS; model memprediksi umpan balik negatif | Pakai saat rekomendasi melenceng dari tujuanmu |
| Mute / block | Tercantum di kolom USS dan FRS | Beri batas pada akun tertentu, lalu cek cakupannya di kebijakan X terbaru |

Report juga hanya tercantum di kolom USS, dan tidak masuk daftar utama keluaran prediksi model.

### Interaksi karena Kesal Tetap Tercatat

Bayangkan sebuah utas yang membuatmu jengkel. Kamu tidak memberi like, tetapi kamu membukanya lagi dan lagi, membaca setiap balasan, lalu mengetik bantahan. Klik, waktu baca, dan reply itu tetap bisa masuk ke riwayat aktivitasmu. Komentar marah tidak selalu berujung pada lebih banyak post bertopik sama, tetapi sistem mencatat interaksinya tanpa memahami alasannya. Bagi mesin, membuka berulang kali untuk menolak dan membuka berulang kali karena suka bisa tampak serupa.

Kalau ingin topik itu berkurang, pilih umpan balik yang sesuai dan pangkas keterlibatan yang tidak perlu. Kamu masih boleh meluruskan informasi yang salah atau membela seseorang. Sebelumnya, timbang tujuannya, berapa lama waktu yang akan habis, dan kenyataan bahwa interaksi itu ikut menjadi bagian dari riwayatmu.

### Bookmark untuk Bahan Riset

Bookmark terasa privat karena tidak tampil sebagai dukungan publik, tetapi ia tidak bebas sinyal. Di implementasi lama, bookmark tercantum di kolom USS, dicatat UUA, dan menjadi salah satu keluaran yang diprediksi model. Kode itu menunjukkan bahwa keluarannya ada, bukan seberapa besar pengaruhnya pada akunmu.

Kalau kamu hanya ingin menyimpan bukti sebuah klaim yang belum kamu percayai, salin tautannya ke catatan pribadi. Cara ini menghindari tindakan bookmark, tetapi klik yang sudah terjadi tidak ikut batal, dan menyimpan di luar X juga bukan mode anonim. Di mana pun kamu menyimpan, beri setiap tautan status: belum dicek, sudah dicek, atau siap digunakan. Tumpukan simpanan yang tidak pernah dibuka lagi tidak menolong tujuan belajarmu.

### Catatan Kode tentang Interaksi di Home

Repositori baru, xai-org/x-algorithm, memuat [komentar kode](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs) yang memberi batas tegas: sebuah tindakan baru dihitung untuk rekomendasi bila terjadi pada post yang disajikan di timeline Home, sedangkan membuka post secara langsung tidak berpengaruh pada peringkat. Itu komentar dalam kode, bukan janji tentang seluruh sistem produksi, tetapi ia mengingatkan bahwa tempat kamu membaca ikut menentukan arti sebuah tindakan.

## Poin Penting

- Kamu mengirim sinyal lewat tindakan eksplisit seperti like dan follow, juga lewat tindakan implisit seperti klik, tontonan video, dan kunjungan profil.
- Dicatat, dipakai sebagai masukan, dan diprediksi model adalah tiga peran berbeda, dan tercatat belum tentu menjadi faktor utama.
- Membuka utas yang menjengkelkan berulang kali meninggalkan jejak, karena sistem membaca interaksinya, bukan niatmu.
- Bookmark tidak bebas sinyal, dan menyimpan tautan di luar X tidak membatalkan klik yang sudah terjadi.

Semua jejak itu tidak berhenti sebagai catatan, sebab sistem meraciknya menjadi perkiraan tentang minatmu, dan cara racikan itu bekerja layak kita bongkar sesudah ini.
