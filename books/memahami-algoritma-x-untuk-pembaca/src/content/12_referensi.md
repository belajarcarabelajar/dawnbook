## Referensi

Halaman ini mengumpulkan kode publik sistem rekomendasi X dan halaman resmi X Help yang menjadi dasar penjelasan di seluruh bab buku ini. Setiap entri menautkan langsung ke berkas atau halaman yang dibaca, jadi kamu bisa memeriksa ulang klaim mana pun dari sumber aslinya. Buku ini berawal dari catatan pribadi penulis tentang cara X menyusun peringkat unggahan, yang kemudian diperluas menjadi buku.

### Repositori twitter/the-algorithm

Ini implementasi lama. Tautan berkas mengarah ke cabang `main`, yang per 12 Oktober 2026 terakhir diperbarui pada September 2025.

- [Repositori twitter/the-algorithm di GitHub](https://github.com/twitter/the-algorithm). Kode rekomendasi yang pertama kali dipublikasikan 31 Maret 2023, masih daring dan tidak diarsipkan, dengan pembaruan terakhir 3 September 2025.
- [Penjelasan layanan Home Mixer](https://github.com/twitter/the-algorithm/blob/main/home-mixer/README.md). README yang menguraikan produk For You, Following, dan Lists, tahap pengumpulan kandidat sampai penilaian, serta heuristik seperti keragaman penulis dan *feedback fatigue*.
- [Tabel sinyal retrieval `RETREIVAL_SIGNALS.md`](https://github.com/twitter/the-algorithm/blob/main/RETREIVAL_SIGNALS.md). Tabel 18 baris yang memetakan aksi seperti like, follow, bookmark, mute, dan report ke komponen yang memakainya, ditambahkan 28 April 2023. Ejaan nama berkasnya memang demikian di repositori.
- [Penjelasan User Signal Service](https://github.com/twitter/the-algorithm/blob/main/user-signal-service/README.md). README tentang sinyal eksplisit (favorite, retweet, reply) dan sinyal implisit (klik tweet, tontonan video, kunjungan profil).
- [Penjelasan Unified User Actions](https://github.com/twitter/the-algorithm/blob/main/unified_user_actions/README.md). README tentang aliran aksi pengguna yang terpusat dan berjalan secara real-time di atas Kafka.
- [Penjelasan SimClusters](https://github.com/twitter/the-algorithm/blob/main/src/scala/com/twitter/simclusters_v2/README.md). README tentang matriks KnownFor dan InterestedIn yang memetakan akun ke sekitar 145 ribu komunitas.
- [Penjelasan Real Graph (`interaction_graph`)](https://github.com/twitter/the-algorithm/blob/main/src/scala/com/twitter/interaction_graph/README.md). README tentang pengklasifikasi yang memprediksi apakah seorang pengguna akan berinteraksi dengan pengguna lain.
- [Daftar keluaran prediksi `PredictedScoreFeature.scala`](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/model/PredictedScoreFeature.scala). Berkas yang memuat 15 jenis keluaran prediksi model pada salinan September 2025.
- [Penggabungan skor `RerankerUtil.scala`](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/util/RerankerUtil.scala). Berkas yang menggabungkan prediksi dengan bobot, termasuk aturan ambang untuk prediksi negatif.
- [Parameter bobot `HomeGlobalParams.scala`](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/param/HomeGlobalParams.scala). Berkas berisi sekitar 30 parameter bobot dengan nilai bawaan 0,0 yang ditimpa oleh konfigurasi permintaan.
- [Pengurang skor `FeedbackFatigueScorer.scala`](https://github.com/twitter/the-algorithm/blob/main/home-mixer/server/src/main/scala/com/twitter/home_mixer/functional_component/scorer/FeedbackFatigueScorer.scala). Berkas yang menurunkan skor setelah umpan balik SeeFewer dan memulihkannya bertahap selama 140 hari.
- [Tulisan blog engineering "Twitter's Recommendation Algorithm"](https://web.archive.org/web/20260310113313/https://blog.x.com/engineering/en_us/topics/open-source/2023/twitter-recommendation-algorithm). Tulisan 31 Maret 2023 yang mengumumkan pembukaan kode. Alamat aslinya di blog.x.com sudah tidak tersedia, jadi tautan ini mengarah ke salinan di Internet Archive.

### Repositori xai-org/x-algorithm

- [Repositori xai-org/x-algorithm beserta README-nya](https://github.com/xai-org/x-algorithm). Kode sistem rekomendasi For You yang dibuat 19 Januari 2026, terutama ditulis dalam Rust dan Python, berlisensi Apache-2.0. README yang dibaca memuat catatan pembaruan hingga 18 September 2026.
- [Bobot peringkat `param.rs`](https://github.com/xai-org/x-algorithm/blob/main/home-mixer/params/param.rs). Nilai bawaan bobot tiap aksi yang disalin dari konfigurasi produksi, terakhir disinkronkan 8 Oktober 2026 dan bisa berubah sewaktu-waktu.
- [Penjelasan model Phoenix](https://github.com/xai-org/x-algorithm/blob/main/phoenix/README.md). README tentang retrieval dua menara dan model ranking yang membaca sekitar seribu aktivitas terbarumu.
- [Pengumuman akun @Engineering](https://x.com/Engineering/status/2013471689087086804). Post 20 Januari 2026 yang memperkenalkan repositori baru dan menyebut arsitektur transformer yang sama dengan model Grok milik xAI.

### Dokumentasi resmi X

Halaman Bantuan X tidak mencantumkan tanggal terbit. Semuanya dibaca pada 12 Oktober 2026.

- [Timeline For You dan Following](https://help.x.com/en/using-x/x-timeline). Dua tab di Home dan isi tab Following.
- [Pendekatan X terhadap rekomendasi](https://help.x.com/en/rules-and-policies/recommendations). Pilihan "Not interested" dan cakupan mute pada notifikasi serta timeline Home.
- [Panduan Lists](https://help.x.com/en/using-x/x-lists). List publik secara bawaan, opsi Private, dan cara menyematkan List.
- [Membisukan akun](https://help.x.com/en/using-x/x-mute). Efek mute tanpa unfollow atau blokir, beserta jalur pengaturannya.
- [Opsi mute lanjutan](https://help.x.com/en/using-x/advanced-x-mute-options). Kata yang dibisukan, cakupannya, dan pilihan durasi.
- [Mengikuti dan berhenti mengikuti Topics](https://help.x.com/en/using-x/follow-and-unfollow-topics). Topik yang kamu ikuti bersifat publik, plus pengaturan Interests from X.
- [Rekomendasi di Explore](https://help.x.com/en/resources/recommender-systems/explore-recommendations). Tab For You dan Trending di Explore.
- [Rekomendasi Trends](https://help.x.com/en/resources/recommender-systems/trends-recommendations). Faktor yang membentuk Trends dan dua jenis umpan baliknya.
- [Video dan putar otomatis](https://help.x.com/en/using-x/x-videos). Cara mematikan autoplay di aplikasi dan di web.
- [Pencarian lanjutan](https://help.x.com/en/using-x/x-advanced-search). Filter kata, akun, tempat, dan tanggal.
- [Tanya jawab hasil pencarian teratas](https://help.x.com/en/using-x/top-search-results-faqs). Tab Top dan Latest pada hasil pencarian.

### Cakupan pemeriksaan

Pemeriksaan untuk buku ini berupa pembacaan statis atas salinan pembaruan September 2025 dari twitter/the-algorithm (arsip dengan SHA-256 berawalan `92fa7db2`), ditambah repositori xai-org/x-algorithm dan halaman Bantuan X dalam kondisi 12 Oktober 2026. Konfigurasi produksi di luar nilai bawaan yang disalin ke `param.rs`, model yang sudah dilatih, data pengguna, dan eksperimen yang tidak dipublikasikan di repositori tidak tercakup. Tautan ke cabang `main` di GitHub bisa berubah isinya setelah tanggal itu, dan nama menu di aplikasi bisa berbeda menurut perangkat, wilayah, dan versi.
