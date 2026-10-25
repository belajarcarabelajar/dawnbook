## Kanalis Semisirkularis Pendeteksi Rotasi

Pernahkah timbul pertanyaan mengapa seseorang merasa dunia masih berputar sesaat setelah berhenti berputar-putar di tempat? Atau bagaimana seorang pesenam lantai dapat melakukan *backflip* dan mendarat dengan tegak tanpa kehilangan arah? Jawabannya terletak di dalam telinga bagian dalam manusia, tepatnya pada tiga struktur berbentuk cincin yang disebut **Kanalis Semisirkularis**.

Jika organ otolit (yang akan dibahas di bagian selanjutnya) adalah "detektor gravitasi dan garis lurus", maka Kanalis Semisirkularis adalah "detektor rotasi" yang bekerja dalam tiga dimensi.

### 1. Arsitektur Tiga Dimensi

Kanalis semisirkularis terdiri atas tiga saluran berbentuk setengah lingkaran yang saling tegak lurus satu sama lain, mirip dengan sudut-sudut di pojok ruangan yang mewakili sumbu X, Y, dan Z. Struktur ini memungkinkan otak kita untuk mendeteksi gerakan rotasi kepala dalam bidang apa pun.

Ketiga saluran tersebut adalah:

1. **Kanalis Anterior (Superior):** Mendeteksi gerakan seperti mengangguk ("Ya").
2. **Kanalis Posterior:** Mendeteksi gerakan memiringkan kepala ke arah bahu.
3. **Kanalis Horizontal (Lateral):** Mendeteksi gerakan menggelengkan kepala ("Tidak").

> **Analogi:** Bayangkan terdapat tiga buah *hula hoop* kecil yang diletakkan di dalam kepala. Satu berdiri tegak menghadap depan, satu berdiri tegak menghadap samping, dan satu lagi tidur mendatar. Ke mana pun kepala berputar, setidaknya satu dari lingkaran ini akan merasakan gerakannya.

### 2. Ampula dan Kupula

Di salah satu ujung setiap kanalis terdapat bagian yang membesar, yang disebut **Ampula**. Di dalam ampula inilah "mesin" pendeteksi sebenarnya berada.

- **Krista Ampularis:** Sebuah gundukan jaringan sensorik yang terletak di dalam ampula. Di atas krista ini terdapat sel-sel rambut vestibular.
- **Kupula:** Sebuah struktur gelatinosa (seperti jeli) yang menutupi krista ampularis. Kupula membentang dari dasar ampula hingga ke puncaknya, menciptakan penghalang yang bisa digerakkan oleh aliran cairan.
- **Endolimfe:** Cairan yang mengisi seluruh kanalis semisirkularis.

> **Penting:** Kupula memiliki berat jenis yang sama dengan endolimfe di sekitarnya. Artinya, kupula tidak terpengaruh oleh gravitasi (tidak seperti otolit), tetapi sangat sensitif terhadap dorongan cairan.

### 3. Inersia dan Defleksi Kupula

Bagaimana gerakan putar kepala berubah menjadi sinyal listrik di otak? Proses ini melibatkan prinsip fisika sederhana: **Inersia**.

1. **Kepala Mulai Berputar:** Saat kepala mulai berputar ke kanan, tulang kanalis semisirkularis ikut bergerak ke kanan.
2. **Inersia Endolimfe:** Karena inersia, cairan endolimfe di dalam saluran cenderung "tertinggal" atau tetap diam sejenak. Hal ini menyebabkan aliran relatif cairan ke arah yang berlawanan dengan gerakan kepala.
3. **Pembengkokan Kupula:** Aliran endolimfe ini mendorong kupula seperti angin mendorong layar kapal.
4. **Transduksi Sinyal:** Saat kupula bengkok, sel-sel rambut di bawahnya juga ikut membengkok.
   - Jika sel rambut membengkok ke arah **kinosilium** (rambut tertinggi), sel akan mengalami **depolarisasi** (meningkatkan frekuensi sinyal saraf).
   - Jika membengkok menjauhi kinosilium, sel mengalami **hiperpolarisasi** (menurunkan frekuensi sinyal).

> [!NOTE]
> **Dinamika Putaran Konstan:** Apa yang terjadi jika tubuh berputar terus-menerus dengan kecepatan konstan? Cairan endolimfe akhirnya akan ikut bergerak dengan kecepatan yang sama dengan saluran, kupula kembali ke posisi tegak, dan sensasi berputar pun mereda. Inilah alasan mengapa pilot sering mengalami disorientasi spasial saat terbang di dalam kabut tebal.

### 4. Dinamika Fluida dan Matematika Rotasi

Secara matematis, respons kanalis semisirkularis terhadap akselerasi sudut ($\alpha$) dapat digambarkan melalui hukum kedua Newton untuk rotasi. Besarnya torsi ($\tau$) yang bekerja pada endolimfe sebanding dengan inersia cairan dan akselerasi kepala:

<div>
$$
\tau = I \cdot \alpha
$$
</div>

Keterangan:

- $I$ adalah momen inersia endolimfe.
- $\alpha$ adalah akselerasi sudut kepala ($\frac{\text{rad}}{\text{s}^2}$).

Sistem ini bekerja paling efektif untuk mendeteksi **akselerasi sudut** (perubahan kecepatan putar), bukan kecepatan konstan. Namun, dalam rentang gerak tertentu, sinyal yang dikirim ke otak mewakili:

<div>
$$
\text{Sinyal Saraf} \propto \text{Kecepatan Sudut Kepala}
$$
</div>

### 5. Prinsip "Push-Pull" (Dorong-Tarik)

Kanalis semisirkularis bekerja secara berpasangan antara telinga kiri dan kanan.

- Kanalis Horizontal Kanan berpasangan dengan Kanalis Horizontal Kiri.
- Kanalis Anterior satu sisi berpasangan dengan Kanalis Posterior sisi lainnya.

Saat kepala berputar ke kanan:

- Kanalis horizontal **kanan** mengalami eksitasi (peningkatan *firing rate*).
- Kanalis horizontal **kiri** mengalami inhibisi (penurunan *firing rate*).

Otak membandingkan perbedaan input dari kedua sisi ini. Jika ada ketidaksesuaian (misalnya karena infeksi pada satu sisi), otak akan mengalami kebingungan sinyal dan timbullah gejala **vertigo**.

### 6. *Firing Rate* Saat Kepala Menoleh

Dalam teknik robotika dan pengembangan *Virtual Reality* (VR), prinsip kanalis semisirkularis ditiru menggunakan sensor yang disebut **Gyroscope**. Gyroscope mengukur kecepatan sudut, dan pada saraf vestibular besaran yang sama tampil sebagai perubahan *firing rate*.

Perubahan *firing rate* (frekuensi detak) saraf vestibular terhadap kecepatan sudut kepala bisa digambarkan dengan model sederhana. Saraf punya laju istirahat, lalu putaran ke arah sensor menambah laju itu dan putaran ke arah lawan menguranginya, sebanding dengan kecepatan sudutnya. Hasilnya dibatasi agar tidak pernah kurang dari nol.

<div>
$$
\text{Firing rate} = \text{laju istirahat} + \text{sensitivitas} \times \text{kecepatan sudut}
$$
</div>

Dengan angka ilustrasi, misalkan laju istirahatnya 90 *spikes* per detik dan sensitivitasnya 0,5 *spikes* per detik untuk setiap derajat per detik. Saat kepala mendadak menoleh ke kanan dengan kecepatan 60°/s, putaran yang sama tercatat positif bagi kanalis horizontal kanan dan negatif bagi kanalis horizontal kiri:

| Kanalis horizontal | Kecepatan sudut yang dirasakan | Perhitungan | *Firing rate* |
| --- | --- | --- | --- |
| Kanan | +60°/s | 90 + 0,5 × 60 | 120 *spikes*/s |
| Kiri | -60°/s | 90 + 0,5 × (-60) | 60 *spikes*/s |

Sisi kanan naik dan sisi kiri turun dari laju istirahat yang sama, persis pola *push-pull* pada bagian 5. Perbedaan kedua angka inilah yang dibandingkan oleh otak.

**Mengapa Kepala Terasa Pusing Setelah Berhenti Berputar?** Ketika seseorang berhenti mendadak setelah berputar lama, cairan endolimfe masih terus bergerak karena momentum (inersia). Hal ini mendorong kupula ke arah yang berlawanan. Bola mata akan bergerak cepat secara ritmis (nistagmus) demi mengimbangi "gerakan" yang sebenarnya sudah berhenti, sehingga menimbulkan sensasi dunia masih berputar.

### Kesimpulan Bagian

Kanalis semisirkularis bekerja dengan prinsip mekanika fluida. Dengan memanfaatkan inersia endolimfe dan fleksibilitas kupula, tubuh manusia mampu memetakan setiap rotasi kepala dalam ruang tiga dimensi, memungkinkan koordinasi keseimbangan tetap terjaga dalam aktivitas yang dinamis.
