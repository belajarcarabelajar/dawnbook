## Termodinamika Atmosfer dan Perubahan Fase

Jika atmosfer Bumi dianggap sebagai sebuah mesin cuaca, uap air adalah bahan bakarnya, karena air menyerap dan melepas energi ketika berubah wujud. Dalam bagian ini, pembahasan berfokus pada bagaimana air berubah wujud serta bagaimana proses tersebut melepaskan atau menyerap energi dalam jumlah besar yang memicu badai, membentuk awan, dan mengatur suhu planet ini.

### 1. Tiga Fase Air di Atmosfer

Di atmosfer, air merupakan satu-satunya zat yang dapat ditemukan dalam tiga fase sekaligus: **padat (es)**, **cair (air)**, dan **gas (uap air)**. Perubahan dari satu fase ke fase lainnya disebut sebagai **perubahan fase**.

Analogi sederhana untuk molekul air adalah sekelompok orang di sebuah ruang pertemuan:

- **Fase Padat (Es):** Setiap orang duduk tenang di kursi masing-masing (struktur kristal yang kaku).
- **Fase Cair (Air):** Orang-orang mulai berdiri dan berjalan, saling bersenggolan tetapi tetap berdekatan.
- **Fase Gas (Uap):** Orang-orang bergerak cepat ke segala arah dan jarang bersentuhan satu sama lain.

Untuk mengubah susunan molekul ini, diperlukan energi. Interaksi energi dan wujud zat inilah yang menjadi inti dari termodinamika atmosfer.

### 2. Panas Laten

Salah satu konsep utama dalam mikrofisika awan adalah **Panas Laten (Latent Heat)**. Istilah "laten" berasal dari bahasa Latin *latere* yang berarti "tersembunyi".

> **Definisi:** Panas laten adalah energi yang diserap atau dilepaskan oleh suatu zat selama perubahan fase berlangsung tanpa mengubah suhu zat tersebut.

Saat mendidihkan air, suhu air bertahan pada $100^\circ\text{C}$ meskipun sumber panas terus menyala. Energi dari kompor tidak lagi menaikkan suhu, melainkan digunakan untuk memutus ikatan antarmolekul cairan agar berubah wujud menjadi gas.

#### Jenis-jenis Panas Laten

| Jenis Panas Laten | Simbol | Nilai Khas | Proses Perubahan Fase | Sifat Energi |
| :--- | :--- | :--- | :--- | :--- |
| **Panas Laten Penguapan** | $L\_v$ | $\approx 2.5 \times 10^6\text{ J/kg}$ ($0^\circ\text{C}$) | Cair $\rightarrow$ Gas | Diserap |
| **Panas Laten Kondensasi** | $L\_v$ | $\approx 2.5 \times 10^6\text{ J/kg}$ ($0^\circ\text{C}$) | Gas $\rightarrow$ Cair | Dilepaskan |
| **Panas Laten Peleburan** | $L\_f$ | $\approx 3.34 \times 10^5\text{ J/kg}$ | Padat $\rightarrow$ Cair | Diserap |
| **Panas Laten Sublimasi** | $L\_s$ | $L\_s = L\_v + L\_f$ | Padat $\leftrightarrow$ Gas | Diserap / Dilepaskan |

> **Ilustrasi Fisika:** Fenomena ini terlihat saat seseorang merasa dingin ketika keluar dari kolam renang meskipun udara sekitar terasa hangat. Air di permukaan kulit menyerap panas tubuh sebagai panas laten penguapan untuk berubah menjadi gas.

### 3. Tekanan Uap (Vapor Pressure)

Di atmosfer, uap air memberikan tekanan parsial yang disebut **Tekanan Uap ($\text{e}$)**. Semakin banyak molekul uap air di udara, semakin tinggi tekanan uap yang dihasilkan.

Namun, terdapat batas maksimum jumlah uap air yang dapat berada dalam kesetimbangan pada suhu tertentu. Batas ini disebut **Tekanan Uap Jenuh ($e\_s$)**.

- **Belum Jenuh ($e < e\_s$):** Laju penguapan lebih cepat dibandingkan laju kondensasi.
- **Jenuh ($e = e\_s$):** Laju penguapan setara dengan laju kondensasi (kondisi kesetimbangan).
- **Lewat Jenuh ($e > e\_s$):** Uap air cenderung berkondensasi menjadi tetesan air (dasar pembentukan awan).

### 4. Persamaan Clausius-Clapeyron

Untuk menentukan nilai $e\_s$ pada suhu tertentu, digunakan **Persamaan Clausius-Clapeyron**. Persamaan ini menunjukkan bahwa tekanan uap jenuh meningkat secara **eksponensial** terhadap kenaikan suhu.

<div>
$$
\frac{de_s}{dT} = \frac{L_v \cdot e_s}{R_v \cdot T^2}
$$
</div>

Dalam bentuk integrasi yang umum digunakan untuk perhitungan atmosfer:

<div>
$$
e_s(T) = e_{s0} \cdot \exp \left[ \frac{L_v}{R_v} \left( \frac{1}{T_0} - \frac{1}{T} \right) \right]
$$
</div>

Keterangan variabel:

- $e\_{s0} = 6.11\text{ hPa}$ (tekanan uap jenuh pada suhu acuan $T\_0 = 273.15\text{ K}$)
- $L\_v$ adalah panas laten penguapan ($\approx 2.5 \times 10^6\text{ J/kg}$)
- $R\_v$ adalah konstanta gas spesifik untuk uap air ($461.5\text{ J/(kg}\cdot\text{K)}$)
- $T$ adalah suhu mutlak dalam Kelvin ($\text{K}$)

**Poin Utama:** Udara hangat memiliki kapasitas menampung uap air yang jauh lebih besar daripada udara dingin. Hal ini menjelaskan mengapa badai di daerah tropis memiliki intensitas tinggi; terdapat ketersediaan energi laten yang melimpah.

### 5. Efek Pendinginan Evaporatif

Alasan lingkungan hutan terasa sejuk tidak hanya berasal dari rimbunnya naungan pohon, melainkan juga akibat proses **Evapotranspirasi**. Tanaman melepaskan uap air melalui stomata. Penguapan ini menyerap panas dari udara sekitar (panas laten), sehingga menurunkan suhu lingkungan setempat.

#### Pembentukan Awan

Saat parsel udara naik, suhunya turun akibat ekspansi adiabatik. Berdasarkan hubungan Clausius-Clapeyron, penurunan suhu ($T$) mengakibatkan tekanan uap jenuh ($e\_s$) ikut menurun. Ketika nilai $e\_s$ turun hingga menyamai tekanan uap aktual ($e$), udara mencapai kondisi jenuh ($\text{RH} = 100\text{\%}$).

Jika pendinginan terus berlanjut, terjadilah kondensasi yang melepaskan panas laten ke lingkungan. Pelepasan energi ini menghangatkan parsel udara di dalam awan dan memberikan dorongan konvektif tambahan untuk terus naik.

### 6. Menghitung Tekanan Uap Jenuh

Untuk perhitungan cepat, Tekanan Uap Jenuh biasa dihitung dengan rumus *August-Roche-Magnus*, turunan praktis dari Clausius-Clapeyron. Pada rumus ini $T$ ditulis dalam derajat Celsius dan $e\_s$ dihasilkan dalam hPa:

<div>
$$
e_s = 6{,}112 \cdot \exp\left(\frac{17{,}67 \cdot T}{T + 243{,}5}\right)
$$
</div>

Berikut hasilnya untuk lima suhu, dari suhu di permukaan ($30^\circ\text{C}$) sampai suhu di ketinggian awan ($-10^\circ\text{C}$):

| Suhu ($^\circ\text{C}$) | Tekanan uap jenuh $e\_s$ (hPa) |
| ---: | ---: |
| 30 | 42,46 |
| 20 | 23,37 |
| 10 | 12,27 |
| 0 | 6,11 |
| -10 | 2,87 |

**Analisis Hasil:** Nilai $e\_s$ berkurang drastis dari suhu $30^\circ\text{C}$ (sekitar $42\text{ hPa}$) hingga suhu $0^\circ\text{C}$ (sekitar $6\text{ hPa}$). Penurunan kapasitas ini memaksa kelebihan uap air berkondensasi menjadi titik air atau membeku menjadi kristal es.

### Panas Laten Penggerak Cuaca

- **Perubahan fase** merupakan mekanisme utama perpindahan energi di atmosfer.
- **Panas Laten** bertindak sebagai penggerak dinamika cuaca; energi dilepaskan saat kondensasi dan pembekuan, serta diserap saat penguapan dan peleburan.
- **Tekanan uap jenuh ($e\_s$)** bergantung secara eksponensial pada suhu, sehingga kenaikan suhu meningkatkan kapasitas udara dalam menyimpan air.
- **Kondensasi** melepaskan kembali energi tersembunyi ke atmosfer, memanaskan udara di sekitar dan memicu pertumbuhan awan secara konvektif.

> **Pesan Utama:** Tanpa panas laten dan perubahan fase air, iklim Bumi akan menjadi ekstrem dan siklus hidrologi tidak akan berfungsi dalam mendistribusikan air tawar ke seluruh daratan.
