## Diseminasi Informasi dan Komunikasi Risiko

Diseminasi informasi komunikasi risiko bencana menentukan apakah peringatan dini benar-benar menyelamatkan nyawa. Rantai peringatan hanya berhasil bila pesan dari pusat pemantauan sampai kepada penerima yang tepat dalam waktu cukup untuk bertindak. diseminasi informasi komunikasi risiko bencana sering gagal bukan karena sensor atau model, melainkan karena pesan berhenti di perantara atau tiba dalam format yang tidak dipahami. Bab ini membahas arsitektur diseminasi dari hulu ke hilir, peran last mile, standar pertukaran data, ragam kanal, prinsip komunikasi risiko, serta pelajaran dari Palu dan Merapi.

Pesan peringatan memiliki ekonomi waktu. Nilai peringatan turun cepat bila terlambat, tidak jelas, atau tidak konsisten. Efektivitas diseminasi dapat digambarkan melalui hubungan \\[ R_{\text{efektif}} = R_{\text{pesan}} \times R_{\text{saluran}} \times R_{\text{penerima}} \\] dimana \\( R_{\text{efektif}} \\) adalah peluang penerima melakukan tindakan protektif, \\( R_{\text{pesan}} \\) adalah kejelasan isi, \\( R_{\text{saluran}} \\) adalah keandalan kanal, dan \\( R_{\text{penerima}} \\) adalah kesiapan penerima. Jika salah satu komponen rendah, hasil keseluruhan ikut rendah meski komponen lain kuat.

### Last Mile dan Tantangan Hilir

Last mile adalah segmen paling kritis antara titik terakhir infrastruktur resmi dan individu yang harus mengambil keputusan. Di Indonesia last mile mencakup kelurahan, kepala desa, pengelola pesisir, pengurus masjid, relawan Destana, serta kelompok nelayan dan petani. Karakter last mile sangat heterogen, meliputi wilayah seluler baik, blank spot, kawasan wisata musiman, serta permukiman padat bantaran sungai. Tantangan hilir meliputi keterlambatan penerusan, perubahan redaksi tiap simpul, kelelahan akibat false alarm, serta hambatan bahasa dan literasi.

Pendekatan last mile yang efektif bertumpu pada pemetaan aktor sebelum bencana, daftar kontak yang diperbarui, dan latihan rutin. Pemberdayaan relawan lokal meningkatkan kepercayaan karena pesan datang dari figur yang dikenal. Latihan skenario memastikan warga memahami beda informasi, peringatan, dan perintah evakuasi, sementara umpan balik dua arah membantu pusat mengetahui titik buta.

### Common Alerting Protocol dan Interoperabilitas

Common Alerting Protocol atau CAP adalah standar terbuka berbasis XML untuk pertukaran peringatan lintas platform. CAP memungkinkan satu pesan master diterjemahkan otomatis ke berbagai kanal tanpa pengetikan ulang. Struktur CAP berisi pengenal, urgensi, keparahan, kepastian, wilayah dalam geocode dan polygon, instruksi tindakan, serta masa berlaku. Dengan CAP, pesan InaTEWS, BMKG, dan PVMBG dapat diformat seragam dan diteruskan ke TV, radio, aplikasi, dan sirene via gateway yang sama.

Di Indonesia, interoperabilitas menjadi kunci karena banyak lembaga menghasilkan peringatan. CAP mengurangi duplikasi. Ketika BMKG merilis peringatan potensi tsunami, pesan CAP yang sama dapat memicu WRS New Generation, running text televisi, pemotongan siaran radio, notifikasi push InfoBMKG dan InaRISK, serta sirene di zona rawan. Penerapan CAP menuntut sinkronisasi daftar istilah ancaman dan peta wilayah agar mesin dan manusia menafsirkan pesan identik.

### Kanal Diseminasi di Indonesia

Indonesia mengoperasikan kombinasi kanal lama dan baru. SMS blast dan cell broadcast menjangkau ponsel massal tanpa aplikasi. Sirene pesisir memberi sinyal akustik untuk evakuasi segera di zona yang sudah dilatih. Televisi dan radio tetap vital karena jangkauan dan otoritasnya, terutama RRI dan TVRI yang wajib menyiarkan peringatan. Aplikasi InfoBMKG, InaRISK, dan MAGMA Indonesia menyediakan peta bahaya sesuai lokasi. WRS BMKG di kantor pemerintah, bandara, dan pelabuhan memastikan peringatan prioritas diterima.

Setiap kanal memiliki profil kinerja berbeda sehingga perencanaan diseminasi memakai prinsip redundansi. Kombinasi kanal meningkatkan probabilitas penerimaan dan memberi alternatif bila satu infrastruktur terganggu oleh pemadaman listrik atau gangguan jaringan.

| Kanal | Kelebihan | Kekurangan |
| --- | --- | --- |
| SMS blast dan cell broadcast | Jangkauan massal cepat, tidak butuh aplikasi | Tergantung jaringan seluler, isi terbatas |
| Sirene pesisir | Sinyal instan di zona rawan, efektif untuk perintah evakuasi | Tidak bawa informasi rinci, perlu pemeliharaan |
| Televisi | Jangkauan luas, visual peta jelas, kredibel | Butuh listrik dan perangkat, tidak mobile |
| Radio | Tahan saat listrik terbatas, jangkauan lokal kuat | Tanpa visual, perlu penyiar siaga |
| Aplikasi InfoBMKG dan InaRISK | Detail spasial interaktif, pembaruan berkala | Perlu smartphone dan data |
| WRS BMKG | Jalur khusus pemerintah dan media, prioritas tinggi | Distribusi perangkat terbatas |

Pemilihan kanal mempertimbangkan urgensi, sebaran geografis, dan ketahanan infrastruktur. Untuk tsunami belasan menit, sirene dan cell broadcast menjadi kanal pertama, diikuti radio dan televisi. Untuk banjir jam, aplikasi dan radio komunitas memberi pembaruan progresif. Untuk kekeringan bulan, buletin dan pertemuan desa lebih relevan.

### Prinsip Komunikasi Risiko

Komunikasi risiko mengikuti prinsip kecepatan, kejelasan, dan konsistensi. Kecepatan berarti pesan pertama dikirim segera setelah ambang terpenuhi, meski dengan ketidakpastian yang dinyatakan jujur. Kejelasan berarti bahasa sederhana, struktur baku, dan instruksi spesifik tentang wilayah, waktu, dan tindakan. Konsistensi berarti semua lembaga menyampaikan narasi selaras dan pembaruan diberi nomor urut.

Prinsip tambahan meliputi transparansi dan segmentasi audiens. Segmentasi memastikan pesan untuk nelayan berbeda dengan warga pesisir. Evaluasi memakai indikator keterjangkauan, keterpahaman, dan ketertindakan.

Daftar periksa redaksi pesan yang baik meliputi:

- Sumber resmi disebut di awal
- Jenis ancaman, lokasi, dan waktu kejadian atau perkiraan
- Tingkat urgensi, keparahan, dan kepastian
- Instruksi tindakan yang konkret dan batas waktu
- Kanal untuk pembaruan dan kontak verifikasi

### Studi Kasus Kegagalan dan Keberhasilan

Gempa dan tsunami Palu 2018 menjadi contoh kegagalan hilir. Gempa magnitudo 7,4 memicu tsunami lokal yang tiba dalam menit di Teluk Palu. BMKG menerbitkan peringatan dalam lima menit pertama, kemudian mengakhiri setelah observasi. Di lapangan, listrik padam dan jaringan rusak menghambat penerusan, sirene tidak merata, dan banyak warga salah tafsir pengakhiran sebagai tanda aman lalu kembali ke pesisir padahal gelombang mendekat. Rantai last mile terputus dan latihan evakuasi belum membumi.

Kontras terlihat pada Merapi 2010 sebagai keberhasilan bertingkat. Peningkatan deformasi, seismisitas, dan gas sejak September 2010 diterjemahkan menjadi kenaikan status dari Waspada ke Siaga lalu Awas dengan perluasan zona bahaya yang diumumkan berulang via radio komunitas, pertemuan desa, dan MAGMA. Pesan PVMBG konsisten, peta kawasan rawan disosialisasikan jauh sebelum krisis, dan jalur evakuasi dilatih. Saat erupsi 26 Oktober dan awan panas awal November tiba, puluhan ribu warga telah mengungsi. Keberhasilan Merapi berasal dari pemantauan andal, keputusan berbasis ambang, dan komunikasi yang dirawat bertahun-tahun.

Pelajaran yang ditarik adalah teknologi hulu tidak menggantikan kerja sosial hilir. Palu menunjukkan peringatan tanpa kanal tahan gangguan dan literasi akan kehilangan daya. Merapi menunjukkan peringatan bertahap memberi waktu belajar dan meningkatkan kepatuhan.

> Komunikasi peringatan yang efektif bukan hanya soal mengirim pesan lebih cepat, melainkan memastikan pesan dipahami, dipercaya, dan diterjemahkan menjadi tindakan oleh mereka yang paling berisiko. UNESCO menekankan bahwa sistem peringatan dini berpusat pada manusia menempatkan pendidikan publik, latihan, dan umpan balik komunitas sebagai inti, bukan pelengkap.

Penguatan ke depan mencakup perluasan cell broadcast berbasis lokasi, integrasi CAP lintas kementerian, peremajaan sirene mandiri, serta dashboard kabupaten yang menggabungkan WRS, InaRISK, dan data lokal. Indikator keberhasilan perlu digeser dari kecepatan penerbitan ke persentase warga yang menerima, memahami, dan bertindak dalam window time tersedia.
