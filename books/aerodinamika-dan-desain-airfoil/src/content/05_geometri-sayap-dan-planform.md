## Geometri Sayap dan Planform

Bentuk sayap jika diproyeksikan dan dilihat tepat dari atas dikenal sebagai **planform**. Ketika mengamati berbagai jenis wahana udara, mulai dari pesawat latih ringan, pesawat komersial berbadan lebar, hingga jet tempur supersonik, tampak bahwa masing-masing memiliki konfigurasi planform yang sangat berbeda.

Dalam aerodinamika terapan, planform bukan sekadar preferensi estetika atau arsitektur visual. Planform merupakan faktor primer yang menentukan distribusi sirkulasi udara, karakteristik pembentukan pusaran ujung sayap (*wingtip vortices*), besaran hambatan terinduksi (*induced drag*), perilaku pelepasan aliran saat *stall*, hingga distribusi beban struktur dan momen lentur pada pangkal sayap (*wing root*).

### 1. Parameter Dasar Geometri Sayap

Untuk menganalisis dan merancang sayap secara kuantitatif, para insinyur mengandalkan parameter geometris standar:

- **Rentang Sayap / Wingspan ($b$):** Jarak linear total dari ujung sayap (*tip*) kiri hingga ujung sayap kanan.
- **Kord Sayap / Chord ($c$):** Jarak lurus antara tepi depan (*leading edge*) dan tepi belakang (*trailing edge*) pada suatu penampang melintang.
  - **Kord Pangkal ($c\_{\text{root}}$):** Panjang kord pada bidang simetri badan pesawat (*fuselage centerline*).
  - **Kord Ujung ($c\_{\text{tip}}$):** Panjang kord pada batas terluar sayap (*wingtip*).
  - **Kord Rata-rata Geometris ($c\_{\text{avg}}$):** Nilai rata-rata kord di sepanjang rentang sayap.
  - **Mean Aerodynamic Chord ($\text{MAC}$):** Kord ekuivalen yang merepresentasikan karakteristik gaya angkat dan momen aerodinamika seluruh sayap.
- **Luas Permukaan Sayap / Wing Area ($S$):** Luas proyeksi planform total sayap terhadap bidang horizontal:

  <div>
  $$
  S = b \times c_{\text{avg}}
  $$
  </div>

- **Taper Ratio ($\lambda$):** Perbandingan antara panjang kord di ujung sayap dengan panjang kord di pangkal sayap:

  <div>
  $$
  \lambda = \frac{c_{\text{tip}}}{c_{\text{root}}}
  $$
  </div>

- **Aspect Ratio ($\text{AR}$):** Rasio kelangsingan sayap yang didefinisikan sebagai perbandingan antara kuadrat rentang sayap terhadap luas sayap:

  <div>
  $$
  \text{AR} = \frac{b^2}{S} = \frac{b}{c_{\text{avg}}}
  $$
  </div>

- **Sweep Angle ($\Lambda$):** Sudut kemiringan sumbu kord sayap (biasanya diukur pada $25\text{\%}$ kord) relatif terhadap garis tegak lurus sumbu longitudinal badan pesawat.
- **Dihedral Angle ($\Gamma$):** Sudut kemiringan bidang sayap ke atas relatif terhadap bidang horizontal untuk kestabilan lateral (*roll stability*).
- **Twist / Washout:** Variasi sudut pasang (*geometric twist*) atau profil airfoil (*aerodynamic twist*) sepanjang rentang sayap untuk mengendalikan inisiasi *stall*.

> **Prinsip Utama:** Planform bertindak sebagai fondasi distribusi sirkulasi fluida. Karakteristik geometris ini menentukan efisiensi jelajah, kecepatan terbang kritis, serta batasan struktural pesawat.

### 2. Variasi Bentuk Planform dan Karakteristik Aerodinamikanya

Setiap variasi geometri planform menawarkan perpaduan kompromi antara efisiensi aerodinamika, kemudahan manufaktur, serta integritas struktur internal.

#### A. Rectangular Planform (Sayap Persegi Panjang)

Planform persegi panjang memiliki kord konstan dari pangkal hingga ujung ($\lambda = 1.0$). Desain ini lazim diterapkan pada pesawat latih dasar seperti Cessna 150 atau Piper PA-28 Cherokee.

- **Keunggulan:** Proses pabrikasi sangat sederhana dan berbiaya rendah karena semua rusuk sayap (*ribs*) memiliki dimensi identik. Dari perspektif keselamatan, separasi aliran awal (*stall*) selalu bermula di pangkal sayap (*root*), sehingga permukaan kendali *aileron* di dekat ujung sayap tetap efektif mempertahankan kontrol guling.
- **Kekurangan:** Menghasilkan konsentrasi sirkulasi berlebih di ujung sayap yang memicu *induced drag* relatif besar, sehingga kurang efisien untuk penerbangan jelajah jarak jauh.

#### B. Elliptical Planform (Sayap Elips)

Secara teoritis murni berdasarkan teori garis angkat Prandtl (*Prandtl's lifting-line theory*), planform elips merupakan bentuk paling optimal untuk domain subsonik tak termampatkan.

- **Keunggulan:** Menghasilkan distribusi gaya angkat eliptik murni yang memberikan kecepatan induksi seragam (*constant downwash*), sehingga meminimalkan koefisien hambatan terinduksi ($C\_{D,i}$) ke batas teoretis terendah ($e = 1.0$).
- **Kekurangan:** Kompleksitas manufaktur sangat tinggi karena setiap penampang memiliki kord dan kelengkungan permukaan yang berbeda. Contoh historis terkenal dari aplikasi ini adalah pesawat tempur **Supermarine Spitfire**. Selain itu, *stall* cenderung terjadi serentak di seluruh rentang sayap tanpa peringatan awal yang terlokalisasi.

#### C. Tapered Planform (Sayap Meruncing)

Planform meruncing linear ($\lambda < 1.0$) dirancang sebagai kompromi teknis antara efisiensi aerodinamika sayap elips dan kepraktisan produksi sayap persegi panjang.

- **Karakteristik:** Kord sayap mengecil secara teratur dari pangkal menuju ujung sayap. Pada nilai $\lambda \approx 0.4$ hingga $0.5$, distribusi gaya angkat mendekati kurva elips teoretis.
- **Keunggulan:** Mengurangi massa struktural di ujung sayap, sehingga menurunkan momen lentur (*bending moment*) pada pangkal sayap. Hal ini memungkinkan perancangan struktur penopang (*spar*) yang lebih ringan dan efisien.

#### D. Swept Wing dan Delta Wing

- **Swept Wing (Sayap Sapu):** Menekuk ke belakang ($\Lambda > 0$) untuk menunda lonjakan hambatan gelombang (*wave drag*) saat mendekati kecepatan transonik dengan cara memecah vektor kecepatan udara lokal menjadi komponen normal dan paralel.
- **Delta Wing (Sayap Segitiga):** Menggabungkan sudut sapu tinggi dengan *aspect ratio* rendah untuk penerbangan supersonik berkecepatan tinggi, memanfaatkan pembentukan pusaran tepi depan (*leading-edge vortices*) untuk menghasilkan gaya angkat tambahan (*vortex lift*).

### 3. Distribusi Gaya Angkat (Lift Distribution)

Pengaruh geometri planform terhadap performa pesawat berakar pada **Distribusi Gaya Angkat** di sepanjang sumbu bentang ($y$).

Kondisi aerodinamika paling efisien tercapai ketika distribusi gaya angkat per satuan rentang membentuk kurva elips. Persamaan distribusi gaya angkat eliptik ideal dirumuskan sebagai:

<div>
$$
L(y) = L_{\text{root}} \sqrt{1 - \left(\frac{2y}{b}\right)^2}
$$
</div>

Keterangan parameter:
- $L(y)$ merupakan besaran gaya angkat lokal pada posisi koordinat rentang $y$.
- $L\_{\text{root}}$ adalah gaya angkat maksimum pada pusat pangkal sayap ($y = 0$).
- $b$ adalah total rentang sayap.

Ketika gaya angkat terdistribusi secara eliptik, kecepatan aliran turun (*downwash velocity*, $w$) di belakang sayap bernilai konstan di sepanjang rentang. Konsekuensinya, sudut serang terinduksi ($\alpha\_i$) seragam dan *induced drag* mencapai nilai minimum mutlak.

#### Analogi Dinamika Beban Fluida

Bayangkan sebuah dayung perahu yang bergerak melalui air. Jika beban dorongan terdistribusi merata dan proporsional di seluruh bilah dayung, fluida terdorong secara stabil tanpa pergolakan pusaran berlebih di tepinya. Namun, jika gaya dorong terkonsentrasi berlebihan hanya pada ujung dayung, terbentuk pusaran turbulen yang kuat di tepian air dan batang dayung menerima tegangan lentur yang jauh lebih berat. Prinsip serupa berlaku pada sayap: distribusi beban yang tidak seimbang memperbesar pusaran ujung sayap dan memboroskan energi propulsi.

### 4. Metode Pendekatan Schrenk (Schrenk's Approximation)

Dalam tahap perancangan awal (*preliminary design*), insinyur sering menggunakan **Metode Schrenk** untuk mengestimasi distribusi gaya angkat aktual tanpa memerlukan komputasi dinamika fluida (CFD) yang mahal.

Schrenk merumuskan bahwa distribusi gaya angkat aktual ($L\_{\text{actual}}$) pada sayap tanpa *twist* merupakan nilai rata-rata aritmetika antara distribusi bentuk fisik planform ($L\_{\text{planform}}$) dan distribusi eliptik ideal ($L\_{\text{elliptical}}$):

<div>
$$
L_{\text{actual}}(y) = \frac{L_{\text{planform}}(y) + L_{\text{elliptical}}(y)}{2}
$$
</div>

Metode ini memberikan estimasi distribusi beban yang akurat untuk menghitung gaya geser (*shear force*) dan momen lentur (*bending moment*) sepanjang bentang sayap saat melakukan analisis kekuatan struktur.

> **Refleksi Kritis:** Mengapa pesawat komersial modern jarang mengadopsi sayap elips murni jika bentuk tersebut paling efisien secara teoritis? Hal ini disebabkan oleh batasan manufaktur komponen komposit berskala besar, kebutuhan volume internal untuk tangki bahan bakar di sepanjang sayap, serta pertimbangan penempatan mekanisme *flap* dan *slat* yang memerlukan garis engsel lurus.

### 5. Karakteristik Planform Sayap Meruncing

Pada sayap meruncing (*tapered wing*) berbentuk trapesium, kord ujung didapat dari kord pangkal dan *taper ratio* ($c\_{\text{tip}} = \lambda c\_{\text{root}}$). Kord rata-ratanya adalah rata-rata kord pangkal dan kord ujung, sehingga luas sayapnya menjadi:

<div>
$$
S = b \times \frac{c_{\text{root}} + c_{\text{tip}}}{2}
$$
</div>

*Aspect ratio* tetap dihitung dengan $\text{AR} = b^2/S$, sedangkan *mean aerodynamic chord* untuk sayap trapesium dihitung dari kord pangkal dan *taper ratio*:

<div>
$$
\text{MAC} = \frac{2}{3} c_{\text{root}} \frac{1 + \lambda + \lambda^2}{1 + \lambda}
$$
</div>

Dengan angka ilustrasi, ambil sebuah pesawat nirawak (UAV) dengan rentang sayap 12 m, kord pangkal 1,8 m, dan *taper ratio* 0,6:

| Besaran | Perhitungan | Hasil |
| --- | --- | --- |
| Kord ujung ($c\_{\text{tip}}$) | 0,6 × 1,8 | 1,08 m |
| Luas sayap ($S$) | 12 × (1,8 + 1,08) / 2 | 17,28 m² |
| *Aspect ratio* ($\text{AR}$) | 12² / 17,28 | ≈ 8,33 |
| *Mean aerodynamic chord* ($\text{MAC}$) | (2/3) × 1,8 × (1 + 0,6 + 0,36) / (1 + 0,6) | 1,47 m |

### 6. Studi Kasus dan Aplikasi Dunia Nyata

1. **Cessna 172 Skyhawk (Modified Rectangular / Tapered):** Mengutamakan kestabilan terbang dan keselamatan operasional. Pola pelepasan aliran bermula dari akar sayap, memberikan getaran peringatan (*buffet*) sebelum *stall* penuh terjadi, sekaligus mempertahankan efektivitas kendali kemudi guling.
2. **Supermarine Spitfire (Elliptical):** Mengoptimalkan efisiensi gaya angkat subsonik dan meminimalkan *induced drag* selama pertempuran udara, meskipun memerlukan biaya manufaktur dan waktu perakitan yang sangat intensif.
3. **Boeing 787 Dreamliner (Swept & Highly Tapered dengan Raked Wingtips):** Memadukan ketirusan tinggi, sudut sapu moderat, dan kelengkungan fleksibel (*aeroelastic wing*) untuk mencapai efisiensi bahan bakar maksimal pada angka Mach transonik ($M \approx 0.85$).
4. **Glider / Sailplane Berperforma Tinggi (High Aspect Ratio Tapered):** Menggunakan sayap yang sangat panjang dan ramping ($\text{AR} > 25$) dengan *taper ratio* teroptimasi untuk menekan *induced drag* ke tingkat serendah mungkin, memungkinkan rasio luncur (*glide ratio*) melampaui $50:1$.

### Ringkasan Pelajaran

- **Planform** adalah geometri proyeksi sayap dari atas yang mengendalikan distribusi sirkulasi udara dan sifat induksi fluida.
- **Distribusi Gaya Angkat Elips** merupakan acuan efisiensi aerodinamika tertinggi karena menghasilkan *downwash* seragam dan meminimalkan *induced drag*.
- **Taper Ratio ($\lambda$)** digunakan untuk mendekati distribusi gaya angkat elips sekaligus meringankan momen lentur pada struktur pangkal sayap.
- **Metode Schrenk** menyediakan perkiraan distribusi beban angkat praktis dengan menggabungkan profil geometri sayap dan distribusi elips ideal.
- **Kompromi Desain:** Pemilihan planform selalu melibatkan integrasi antara batas aerodinamika, beban struktur material, kemudahan manufaktur, dan kebutuhan operasional wahana udara.
