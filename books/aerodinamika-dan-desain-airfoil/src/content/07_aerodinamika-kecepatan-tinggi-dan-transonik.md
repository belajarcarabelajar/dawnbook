## Aerodinamika Kecepatan Tinggi dan Transonik

Topik aerodinamika kecepatan tinggi dan transonik merupakan salah satu domain paling krusial sekaligus menantang dalam rekayasa kedirgantaraan modern. Pada kecepatan rendah (subsonik tak mampumampat), udara mengalir di sekitar permukaan sayap dengan variasi kerapatan massa yang dapat diabaikan. Namun, ketika kecepatan terbang meningkat mendekati kecepatan suara, kompresibilitas udara menjadi dominan dan dinamika fluida berubah secara drastis.

Perilaku fluida pada kecepatan tinggi dapat dianalogikan dengan interaksi mekanik pada media air. Ketika seseorang menggerakkan tangan perlahan di dalam kolam renang, partikel air dengan mudah berpindah dan mengalir mengitari tangan. Sebaliknya, jika tangan digerakkan secara mendadak dengan kecepatan sangat tinggi untuk memukul permukaan air, fluida memberikan resistansi balik yang sangat keras. Fenomena serupa dialami oleh wahana terbang saat mendekati ambang batas kecepatan suara, di mana gangguan tekanan merambat dengan kecepatan yang sebanding dengan kecepatan gerak pesawat itu sendiri.

### 1. Angka Mach dan Rezim Aliran

Parameter fundamental dalam analisis aliran kecepatan tinggi adalah **Angka Mach** ($M$), yaitu rasio tanpa dimensi antara kecepatan gerak relatif fluida ($v$) terhadap kecepatan suara lokal ($a$) pada medium tersebut:

$$
M = \frac{v}{a}
$$

Kecepatan suara lokal di atmosfer sangat bergantung pada temperatur termodinamika absolut ($T$), yang dirumuskan melalui hubungan gas ideal $a = \sqrt{\gamma R T}$, dengan $\gamma$ adalah rasio kalor jenis ($\gamma = 1{,}4$ untuk udara) dan $R$ adalah konstanta gas spesifik. Oleh karena temperatur atmosfer menurun seiring bertambahnya ketinggian pada lapisan troposfer, kecepatan suara lokal juga menurun pada elevasi jelajah yang lebih tinggi.

Rezim aliran udara secara umum diklasifikasikan ke dalam empat domain utama:

- **Subsonik ($M < 0{,}75$):** Kecepatan aliran di seluruh medan di sekitar airfoil berada di bawah kecepatan suara lokal, sehingga efek kompresibilitas relatif kecil dan gangguan tekanan merambat ke segala arah mendahului pesawat.
- **Transonik ($0{,}75 \le M \le 1{,}2$):** Medan aliran merupakan kombinasi kompleks antara zona subsonik dan zona supersonik lokal di atas permukaan sayap, disertai pembentukan gelombang kejut.
- **Supersonik ($1{,}2 < M < 5{,}0$):** Seluruh medan aliran di sekitar badan pesawat melampaui kecepatan suara lokal ($M > 1$), menghasilkan sistem gelombang kejut haluan (*bow shock*) atau gelombang kejut miring (*oblique shock*).
- **Hipersonik ($M > 5{,}0$):** Aliran berkecepatan ekstrem di mana efek termal berkecepatan tinggi, disosiasi molekuler udara, dan interaksi lapisan batas menjadi sangat dominan.

Rezim transonik memiliki kompleksitas aerodinamika tertinggi karena pesawat mengalami perubahan drastis pada distribusi gaya angkat (*lift*), pusat tekanan (*center of pressure*), dan gaya hambat (*drag*).

### 2. Pembentukan Gelombang Kejut (*Shock Waves*)

Ketika pesawat terbang pada kecepatan subsonik rendah, gelombang tekanan akustik kecil merambat mendahului pesawat dan memberikan sinyal awal bagi partikel udara untuk membelok sebelum menyentuh sayap. Namun, ketika kecepatan pesawat mendekati $M = 1{,}0$, informasi tekanan tidak lagi mampu mendahului wahana secara efektif karena laju perambatan gelombang akustik setara dengan laju gerak pesawat. Akibatnya, gelombang-gelombang tekanan mikro menumpuk di depan atau di atas permukaan sayap dan berakumulasi menjadi diskontinuitas termodinamika tajam yang dikenal sebagai **gelombang kejut** (*shock wave*).

#### Mekanisme Pembentukan Gelombang Kejut Lokal

Meskipun badan pesawat terbang pada kecepatan jelajah subsonik bebas (misalnya $M_\infty = 0{,}80$), aliran udara yang melintasi kelengkungan permukaan atas (*extrados*) airfoil akan berakselerasi melebihi kecepatan aliran bebas. Kecepatan aliran bebas terendah di mana kecepatan lokal pada titik tertentu di permukaan sayap tepat mencapai $M = 1{,}0$ didefinisikan sebagai **Angka Mach Kritis** ($M_{\text{crit}}$).

Setelah kecepatan jelajah melampaui $M_{\text{crit}}$, kantung supersonik lokal ($M > 1{,}0$) terbentuk di atas permukaan sayap. Aliran supersonik lokal ini pada akhirnya harus melambat kembali ke kecepatan subsonik saat mendekati tepi belakang (*trailing edge*). Transisi perlambatan mendadak dari rezim supersonik ke subsonik ini dimediasi oleh gelombang kejut normal (*normal shock wave*).

#### Konsekuensi Fisik Gelombang Kejut

1. **Lonjakan Tekanan Statis:** Terjadi kenaikan tekanan statis dan temperatur secara tiba-tiba di belakang garis gelombang kejut, disertai penurunan tekanan total (*total pressure loss*).
2. **Disipasi Energi Kinetik:** Sebagian energi kinetik aliran terdisipasi secara ireversibel menjadi energi termal (peningkatan entropi).
3. **Separasi Lapisan Batas Terinduksi Kejut (*Shock-Induced Separation*):** Lonjakan gradien tekanan merugikan (*adverse pressure gradient*) di belakang gelombang kejut menyebabkan lapisan batas terlepas dari permukaan sayap. Hal ini memicu getaran struktural frekuensi tinggi (*buffeting*) dan penurunan drastis pada gaya angkat (*shock stall*).

### 3. Fenomena *Drag Divergence* dan *Wave Drag*

Pada awal era pengembangan pesawat jet tempur dan komersial, peningkatan hambatan aerodinamika yang sangat tajam saat mendekati kecepatan suara sering diidentifikasikan secara populer sebagai "tembok suara". Dalam konteks aerodinamika kuantitatif, fenomena ini disebut **Drag Divergence**.

**Angka Mach Divergensi Hambatan** ($M_{\text{dd}}$) adalah nilai angka Mach aliran bebas di mana koefisien gaya hambat total ($C_d$) mulai mengalami kenaikan eksponensial yang sangat curam (secara konvensional didefinisikan saat $\frac{dC_d}{dM} \ge 0{,}10$).

Koefisien gaya hambat total pada rezim transonik dirumuskan sebagai:

$$
C_d = C_{d,0} + C_{d,i} + \Delta C_{d,\text{wave}}
$$

Di mana:
- $C_{d,0}$ adalah koefisien hambat parasitik (gesekan permukaan dan bentuk).
- $C_{d,i}$ adalah koefisien hambat terinduksi (*induced drag*).
- $\Delta C_{d,\text{wave}}$ adalah koefisien **hambat gelombang** (*wave drag*), yaitu komponen hambatan tambahan yang dihasilkan oleh disipasi entropi melintasi gelombang kejut dan separasi aliran terinduksi kejut.

Lonjakan drastis pada $\Delta C_{d,\text{wave}}$ menuntut peningkatan daya dorong (*thrust*) mesin berkali-kali lipat hanya untuk menambah sedikit kecepatan jelajah. Tanpa optimasi geometri khusus, konsumsi bahan bakar pada kecepatan transonik menjadi sangat boros.

### 4. Desain Airfoil Superkritis (*Supercritical Airfoil*)

Untuk mempertahankan efisiensi aerodinamika pesawat jet komersial modern yang beroperasi pada rentang kecepatan jelajah $M = 0{,}80 \text{ hingga } 0{,}86$, para peneliti aerodinamika (dipelopori oleh Richard Whitcomb di NASA Langley) merancang geometri khusus yang dikenal sebagai **Airfoil Superkritis** (*Supercritical Airfoil*).

#### Karakteristik Geometri Airfoil Superkritis

Dibandingkan dengan profil airfoil konvensional (seperti seri NACA 6-digit), airfoil superkritis memiliki tiga ciri geometris yang sangat distingtif:

1. **Permukaan Atas yang Relatif Datar (*Flattened Upper Surface*):** Mengurangi kelengkungan kurvatur di bagian atas untuk membatasi percepatan aliran udara berlebih, sehingga menunda pembentukan kantung supersonik lokal dan memperlemah intensitas gelombang kejut.
2. **Radius Tepi Depan yang Lebih Besar (*Blunt Leading Edge*):** Menghasilkan distribusi gradien tekanan yang lebih seragam dan meminimalkan puncak hisap (*suction peak*) tajam di dekat tepi depan.
3. **Kelengkungan Tajam di Tepi Belakang Bawah (*Cambered Aft Section*):** Menyediakan hisapan dan gaya angkat tambahan di bagian belakang (*rear loading*) untuk menggantikan gaya angkat yang berkurang akibat bagian atas yang didatarkan.

#### Keunggulan Aerodinamika

- **Peningkatan Nilai $M_{\text{crit}}$ dan $M_{\text{dd}}$:** Menunda kemunculan gelombang kejut ke angka Mach penerbangan yang lebih tinggi, memungkinkan pesawat terbang lebih cepat dengan konsumsi bahan bakar yang tetap ekonomis.
- **Pelemahan Kekuatan Gelombang Kejut:** Mengubah gelombang kejut yang semula kuat dan tegak menjadi sistem gelombang yang jauh lebih lemah dengan lonjakan entropi minimal, mereduksi $\Delta C_{d,\text{wave}}$ secara signifikan.
- **Kapasitas Ketebalan Sayap Lebih Besar:** Geometri superkritis memungkinkan penggunaan penampang sayap yang lebih tebal pada angka Mach yang sama. Ketebalan sayap tambahan ini memberikan ruang internal yang lebih besar untuk volume tangki bahan bakar serta memperkuat integritas struktural sayap dengan bobot yang lebih ringan.

### 5. Konsep Sapuan Sayap (*Wing Sweep*)

Selain rekayasa profil airfoil superkritis, strategi aerodinamika terpenting untuk menaklukkan rezim transonik adalah penerapan **sayap sapu** (*swept wing*), yaitu memiringkan bidang sayap ke arah belakang dengan sudut sapu $\Lambda$ (*sweep angle*).

Prinsip fisika di balik sayap sapu didasarkan pada konsep bahwa respons aerodinamika airfoil 2D hanya ditentukan oleh komponen kecepatan aliran udara yang tegak lurus terhadap garis seperempat tali sayap (*quarter-chord line*). Komponen kecepatan yang sejajar dengan rentang sayap (*spanwise component*) diasumsikan tidak memengaruhi distribusi tekanan profil secara signifikan.

Dengan memberikan sudut sapuan $\Lambda$, angka Mach efektif ($M_{\text{eff}}$) yang dirasakan langsung oleh profil sayap berkurang menjadi:

$$
M_{\text{eff}} = M_\infty \cos(\Lambda)
$$

Sebagai ilustrasi kuantitatif, tinjau pesawat jet yang terbang pada kecepatan jelajah $M_\infty = 0{,}80$ dengan sudut sapuan sayap $\Lambda = 30^\circ$:

$$
M_{\text{eff}} = 0{,}80 \cdot \cos(30^\circ) \approx 0{,}80 \cdot 0{,}8660 = 0{,}6928
$$

Meskipun pesawat secara keseluruhan melaju pada $M_\infty = 0{,}80$ (mendekati batas transonik), penampang sayap secara aerodinamis hanya merasakan aliran udara efektif sebesar $M_{\text{eff}} \approx 0{,}69$, yang berada sepenuhnya di dalam domain subsonik aman di bawah $M_{\text{crit}}$. Strategi ini menjadi fondasi rekayasa bagi hampir seluruh pesawat angkut jet komersial dan militer modern.

### Ringkasan Konsep Kunci

| Parameter / Konsep | Formulasi / Karakteristik | Signifikansi Aerodinamika |
| :--- | :--- | :--- |
| **Angka Mach ($M$)** | $M = \frac{v}{a}$ | Parameter penentu kompresibilitas aliran fluida udara. |
| **Mach Kritis ($M_{\text{crit}}$)** | Kecepatan lokal pertama mencapai $M = 1{,}0$ | Ambang batas pembentukan kantung aliran supersonik di atas airfoil. |
| **Hambat Gelombang ($\Delta C_{d,\text{wave}}$)** | Disipasi energi melintasi gelombang kejut | Lonjakan hambatan akibat pembentukan gelombang kejut normal. |
| **Airfoil Superkritis** | Atas datar, *leading edge* tumpul, *aft camber* | Menunda $M_{\text{dd}}$, melemahkan kekuatan kejut, dan meningkatkan efisiensi bahan bakar. |
| **Sayap Sapu (*Wing Sweep*)** | $M_{\text{eff}} = M_\infty \cos(\Lambda)$ | Mengurangi angka Mach efektif yang dirasakan sayap agar tetap berada di rezim subsonik. |

Penguasaan aerodinamika kecepatan tinggi dan transonik bukan semata-mata mengenai upaya meningkatkan kecepatan maksimum wahana terbang, melainkan tentang optimalisasi pengelolaan energi fluida. Perpaduan antara profil airfoil superkritis dan konfigurasi sayap sapu menghasilkan efisiensi aerodinamika optimal yang memungkinkan penerbangan jarak jauh berkecepatan tinggi dengan keandalan ekonomis dan keselamatan tinggi.
