## Teknologi Pemantauan dan Sensor Kebencanaan

Teknologi pemantauan dan sensor adalah mata dan telinga sistem peringatan dini. Tanpa sensor yang andal, peringatan hanya akan menjadi dugaan, bukan keputusan berbasis data. Kamu akan melihat bagaimana Indonesia merangkai jaringan sensor dari dasar laut hingga atmosfer untuk menangkap tanda bahaya sedini mungkin.

Pertanyaan awal yang relevan: *alat apa yang sebenarnya mendeteksi gempa, tsunami, atau banjir sebelum manusia merasakannya?* Jawaban terletak pada kombinasi fisika gelombang, radar, dan sistem satelit.

### 1. Sensor Seismik dan Geodesi

Untuk gempa bumi, BMKG mengoperasikan lebih dari 400 seismometer broadband yang tersebar dari Sabang sampai Merauke. Seismometer merekam getaran tanah dengan sensitivitas mikron, lalu mengirim data real time ke pusat pengolahan melalui VSAT.

Prinsip dasar pengukuran kecepatan gelombang seismik dapat ditulis sebagai

\\[ v = \frac{d}{t} \\]

di mana \\( v \\) adalah kecepatan gelombang, \\( d \\) jarak, dan \\( t \\) waktu tempuh. Dari selisih waktu gelombang P dan S, sistem menghitung lokasi dan kedalaman gempa.

Selain seismometer, jaringan GPS CORS mengukur pergeseran lempeng dalam orde milimeter per tahun. Data ini penting untuk memetakan daerah yang terkunci dan berpotensi menghasilkan gempa besar.

> "Seismometer tidak memprediksi gempa, ia memberi tahu kita bahwa gempa baru saja terjadi dengan sangat cepat sehingga peringatan tsunami masih mungkin dikeluarkan."

### 2. Sensor Tsunami dan Muka Air Laut

Tsunami dipantau melalui tide gauge di pantai dan buoy DART di laut dalam. Tide gauge mengukur perubahan muka air setiap menit, sementara buoy DART mendeteksi perubahan tekanan air di dasar laut akibat lewatnya gelombang tsunami.

#### Tabel Perbandingan Sensor Utama

| Sensor | Besaran Diukur | Cakupan | Kecepatan Data | Keterbatasan |
| --- | --- | --- | --- | --- |
| Seismometer broadband | Getaran tanah | Nasional | Detik | Tidak mengukur tsunami langsung |
| GPS CORS | Deformasi lempeng | Nasional | Menit | Perlu koreksi atmosfer |
| Tide gauge | Muka air pantai | Pantai | Menit | Terpengaruh pasang surut |
| Buoy DART | Tekanan dasar laut | Samudra Hindia | Menit | Biaya tinggi, vandalisme |
| Radar Doppler | Curah hujan | Regional | 5 menit | Jangkauan 250 km |
| AWS | Suhu, hujan, angin | Lokal | Menit | Perlu perawatan |

### 3. Radar, Satelit, dan Sensor Hidrometeorologi

Untuk banjir dan cuaca ekstrem, BMKG mengoperasikan radar Doppler C-Band yang memindai awan hujan setiap 10 menit. Data radar dikombinasikan dengan satelit Himawari-8 yang memberi citra awan setiap 10 menit dengan resolusi 500 meter.

Magnitudo hujan dari radar diturunkan melalui hubungan empiris

\\[ Z = a R^{b} \\]

di mana \\( Z \\) adalah reflektivitas radar dan \\( R \\) laju hujan, dengan \\( a \\) dan \\( b \\) konstanta kalibrasi.

Di darat, Automatic Weather Station (AWS) dan Automatic Rain Gauge (ARG) merekam hujan lokal yang kemudian diasimilasi ke model numerik WRF untuk prakiraan 3 harian.

### 4. Internet of Things dan Sensor Komunitas

Inovasi terbaru adalah sensor murah berbasis IoT: sensor tinggi muka air berbasis ultrasonik di sungai, sensor longsor berbasis inklinometer, dan pemancar LoRa yang mengirim data tanpa jaringan seluler. Sensor ini dapat dipasang warga bersama BPBD dengan biaya sepersepuluh sistem konvensional.

Tantangan utama bukan pada kecanggihan alat, melainkan pada perawatan, kalibrasi, dan keberlanjutan daya di lokasi terpencil. Sensor yang mati karena baterai habis sama berbahayanya dengan tidak ada sensor sama sekali. Oleh karena itu, setiap pemasangan harus disertai skema pemeliharaan dan redundansi komunikasi.

Sebagai penutup, teknologi tidak menggantikan kearifan. Sensor memberi angka, namun keputusan evakuasi tetap membutuhkan konteks lokal dan kepercayaan komunitas.
