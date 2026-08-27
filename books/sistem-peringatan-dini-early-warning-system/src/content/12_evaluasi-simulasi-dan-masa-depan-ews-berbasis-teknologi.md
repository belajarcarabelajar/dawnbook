## Evaluasi Simulasi dan Masa Depan EWS Berbasis Teknologi

Masa depan sistem peringatan dini ditentukan oleh seberapa jujur kita mengevaluasi kinerja masa lalu dan seberapa berani kita mengadopsi teknologi baru. Evaluasi tanpa data adalah opini, teknologi tanpa evaluasi adalah spekulasi. Bab ini mengajak kamu melihat sisi pengukuran dan proyeksi ke depan.

Pertanyaan panduan: *bagaimana kita tahu bahwa sistem peringatan dini kita benar-benar bekerja dan apa yang akan mengubahnya dalam sepuluh tahun ke depan?*

### 1. Metrik Kinerja: POD, FAR, dan Lead Time

Tiga metrik utama digunakan secara internasional:

- **Probability of Detection**

\\[ \text{POD} = \frac{\text{Hit}}{\text{Hit} + \text{Miss}} \\]

- **False Alarm Ratio**

\\[ \text{FAR} = \frac{\text{False}}{\text{Hit} + \text{False}} \\]

- **Lead Time**

\\[ T_{\text{lead}} = T_{\text{kejadian}} - T_{\text{peringatan}} \\]

di mana \\( \text{Hit} \\) adalah kejadian yang berhasil diperingatkan, \\( \text{Miss} \\) kejadian terlewat, dan \\( \text{False} \\) peringatan tanpa kejadian. Idealnya \\( \text{POD} \\) mendekati 1, \\( \text{FAR} \\) mendekati 0, dan \\( T_{\text{lead}} \\) selama mungkin tanpa mengorbankan akurasi.

> "Peringatan yang selalu benar namun datang terlambat sama tidak bergunanya dengan peringatan cepat yang selalu salah. Keseimbangan keduanya adalah inti Evaluasi."

#### Tabel Target Kinerja Ideal vs Realita

| Metrik | Target Sendai | Realita Indonesia 2020-2024 | Catatan |
| --- | --- | --- | --- |
| POD gempa >5 SR | >0.95 | 0.98 | Jaringan seismik padat |
| FAR tsunami | <0.3 | 0.35 | Masih tinggi karena skenario konservatif |
| Lead time tsunami lokal | 3 sampai 5 menit | 4 menit rata-rata | Perlu 2 menit lagi |
| POD banjir | >0.8 | 0.72 | Keterbatasan radar di timur |

### 2. Simulasi: Tabletop hingga Full Scale

Evaluasi tidak lengkap tanpa simulasi. Tiga tingkat latihan umum:

1. **Tabletop Exercise:** Diskusi skenario di meja tanpa pengerahan fisik, menguji SOP dan alur komunikasi.
2. **Drill:** Latihan parsial seperti uji sirene dan evakuasi satu dusun.
3. **Full Scale Exercise:** Simulasi penuh dengan pengerahan BPBD, TNI, PMI, dan masyarakat selama berjam-jam.

Setiap simulasi harus mencatat waktu tempuh evakuasi, kepatuhan warga, dan titik macet. Hasilnya menjadi masukan untuk merevisi peta jalur dan penempatan rambu.

### 3. Masa Depan: AI, IoT, dan Digital Twin

Tiga gelombang teknologi akan mengubah EWS:

**Kecerdasan buatan untuk nowcasting.** Model machine learning dapat memprediksi hujan 1 sampai 2 jam ke depan dengan resolusi 1 km, lebih cepat dari model fisik konvensional. AI juga membantu memilah sinyal gempa dari derau industri.

**Internet of Things masif.** Sensor murah di sungai, lereng, dan atap rumah warga akan mengalirkan data setiap detik melalui LoRa dan satelit LEO. Tantangannya adalah kurasi data dan daya tahan.

**Digital twin kota.** Replika virtual kota yang mensimulasikan banjir atau tsunami secara real time memungkinkan kamu melihat dampak skenario sebelum terjadi dan menguji jalur evakuasi alternatif di layar.

Peringatan personal melalui cell broadcast yang menargetkan ponsel di area terdampak spesifik, bukan seluruh provinsi, akan mengurangi kelelahan peringatan dan meningkatkan kepatuhan.

### 4. Jalan Menuju 2030

Target Kerangka Sendai G adalah meningkatkan ketersediaan sistem peringatan dini multi ancaman untuk semua orang pada 2030. Untuk Indonesia, ini berarti memperluas cakupan ke wilayah timur, memastikan perawatan sensor berkelanjutan, dan memperkuat literasi warga agar teknologi diterima bukan ditakuti. Masa depan EWS bukan sekadar alat lebih canggih, melainkan ekosistem di mana data, regulasi, komunitas, dan teknologi saling menguatkan.
