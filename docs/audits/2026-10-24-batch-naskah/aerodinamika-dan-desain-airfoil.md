# Aerodinamika dan Desain Airfoil

`books/aerodinamika-dan-desain-airfoil`: 92 temuan.


## `books/aerodinamika-dan-desain-airfoil/src/content/01_pengantar-aerodinamika-pesawat-terbang.md`

- **Fakta meragukan**: “*Aero* (udara) dan *Dynamics* (kekuatan atau perubahan)”
  - Usulan: “*aēr* (udara) dan *dynamis* (kekuatan)”
  - Catatan: 'Dynamics' adalah kata Inggris, bukan Yunani. Akar Yunaninya adalah 'dynamis' atau 'dynamikos'. Arti 'perubahan' juga tidak tepat.
- **Kalimat rancu**: “Ia naik seolah-olah seringan kapas. Jawabannya terletak pada”
  - Usulan: “Ia naik seolah-olah seringan kapas. Bagaimana hal itu mungkin? Jawabannya terletak pada”
  - Catatan: Kata 'Jawabannya' tidak merujuk ke pertanyaan apa pun. Kalimat sebelumnya adalah ajakan membayangkan, bukan pertanyaan tentang penyebab.
- **Tata bahasa**: “daya hisap ke atas”
  - Usulan: “daya isap ke atas”
  - Catatan: Bentuk baku menurut KBBI adalah 'isap', bukan 'hisap'.
- **Istilah tidak konsisten**: “pada bagian buritan sayap (Newton)”
  - Usulan: “pada tepi belakang sayap (*trailing edge*) (Newton)”
  - Catatan: Sebelumnya bab memakai istilah 'tepi belakang sayap (trailing edge)'. 'Buritan' adalah istilah perkapalan.

## `books/aerodinamika-dan-desain-airfoil/src/content/02_nomenklatur-dan-geometri-airfoil.md`

- **Tata bahasa**: “standarisasi penamaan NACA”
  - Usulan: “standardisasi penamaan NACA”
  - Catatan: Bentuk baku menurut KBBI adalah "standardisasi".
- **Tata bahasa**: “memelopori standarisasi geometri airfoil”
  - Usulan: “memelopori standardisasi geometri airfoil”
  - Catatan: Bentuk baku menurut KBBI adalah "standardisasi".
- **Istilah tidak konsisten**: “memicu pemisahan gelembung laminer (*laminar separation bubble*)”
  - Usulan: “memicu gelembung separasi laminer (*laminar separation bubble*)”
  - Catatan: Terjemahan ini keliru karena yang terbentuk adalah gelembung akibat separasi laminer, bukan pemisahan gelembung. Bab juga memakai tiga istilah berbeda untuk *flow separation* (pelepasan, separasi, pemisahan); sebaiknya diseragamkan.
- **Fakta meragukan**: “Hambatan bentuk (*form drag*) meningkat pada bilangan Mach tinggi”
  - Usulan: “Hambatan gelombang (*wave drag*) meningkat pada bilangan Mach tinggi”
  - Catatan: Pada Mach tinggi, penalti utama ketebalan adalah hambatan gelombang, sesuai penjelasan bagian 2B. Jadi bukan hambatan bentuk.
- **Kalimat rancu**: “menunda lonjakan hambatan gelombang (*drag divergence Mach number*)”
  - Usulan: “menaikkan bilangan Mach divergensi hambatan (*drag divergence Mach number*)”
  - Catatan: Istilah Inggrisnya merujuk pada sebuah bilangan Mach, sedangkan teks Indonesianya menyebut lonjakan hambatan. Padanan ini tidak setara.
- **Kalimat rancu**: “Menggunakan profil berbentang panjang”
  - Usulan: “Menggunakan sayap berbentang panjang (rasio aspek tinggi) dengan profil”
  - Catatan: Bentang adalah sifat sayap tiga dimensi, bukan sifat profil airfoil dua dimensi.
- **Kalimat rancu**: “adalah jalur bergelombang di atas pulau tersebut”
  - Usulan: “adalah jalur melengkung di atas pulau tersebut”
  - Catatan: Garis camber rata-rata umumnya melengkung halus, tidak bergelombang. Kata "bergelombang" menyesatkan.
- **Fakta meragukan**: “**Airfoil Tipis ($6\text{\%} - 9\text{\%}$):** Diterapkan pada pesawat tempur supersonik”
  - Catatan: Airfoil jet tempur supersonik umumnya lebih tipis dari 6% (misalnya F-16 sekitar 4%, F-104 sekitar 3,4%). Rentang ini sebaiknya ditinjau ulang.

## `books/aerodinamika-dan-desain-airfoil/src/content/03_mekanika-gaya-angkat-lift.md`

- **Fakta meragukan**: “peningkatan kecepatan fluida di sepanjang garis arus berbanding terbalik dengan tekanan statisnya”
  - Usulan: “peningkatan kecepatan fluida di sepanjang garis arus diiringi penurunan tekanan statisnya”
  - Catatan: Persamaan Bernoulli tidak menyatakan hubungan berbanding terbalik. Kecepatan naik berarti tekanan turun, dan yang kekal adalah jumlah P + ½ρv².
- **Salah ketik**: “Integrasi perbedaan tekanan netral”
  - Usulan: “Integrasi perbedaan tekanan neto”
  - Catatan: Yang dimaksud selisih tekanan bersih (neto), bukan 'netral'.
- **Kalimat rancu**: “kecepatan berbanding kuadrat ($v^2$) terhadap gaya angkat”
  - Usulan: “gaya angkat berbanding lurus dengan kuadrat kecepatan ($v^2$)”
  - Catatan: Susunan kalimat membalik hubungan dan rancu.
- **Salah ketik**: “Untuk mengkuantifikasi besaran”
  - Usulan: “Untuk menguantifikasi besaran”
  - Catatan: Menurut KBBI, fonem k luluh setelah prefiks meng-.
- **Salah ketik**: “Massa jenis udara ambient”
  - Usulan: “Massa jenis udara ambien”
  - Catatan: Bentuk baku KBBI adalah 'ambien'.
- **Fakta meragukan**: “kecepatan keputusan rotasi ($V_r$)”
  - Usulan: “kecepatan rotasi ($V_r$)”
  - Catatan: V_r adalah kecepatan rotasi. Kecepatan keputusan adalah V_1, yaitu besaran yang berbeda.
- **Fakta meragukan**: “yang secara instan melipatgandakan nilai $C_L$”
  - Usulan: “yang meningkatkan nilai $C_L$”
  - Catatan: Kenaikan C_L saat rotasi bersifat bertahap dan tidak selalu berlipat ganda, sehingga klaim ini berlebihan.
- **Istilah tidak konsisten**: “Perpaduan kecepatan dinamis yang tinggi”
  - Usulan: “Perpaduan tekanan dinamis yang tinggi”
  - Catatan: Bab ini memakai istilah 'tekanan dinamis'. Istilah 'kecepatan dinamis' tidak dikenal.
- **Salah ketik**: “Berikan hembusan napas”
  - Usulan: “Berikan embusan napas”
  - Catatan: Bentuk baku KBBI adalah 'embusan'.
- **Fakta meragukan**: “pesawat besi berbobot ratusan ton”
  - Usulan: “pesawat logam berbobot ratusan ton”
  - Catatan: Struktur pesawat umumnya terbuat dari paduan aluminium atau komposit, bukan besi.

## `books/aerodinamika-dan-desain-airfoil/src/content/04_komponen-dan-analisis-gaya-hambat-drag.md`

- **Fakta meragukan**: “Kecepatan ini menjadi acuan operasional untuk efisiensi jelajah terjauh (*maximum range*) pada pesawat bertenaga jet”
  - Usulan: “Kecepatan ini menjadi acuan operasional untuk jarak jelajah terjauh (*maximum range*) pada pesawat bertenaga baling-baling (atau daya tahan terbang terlama pada pesawat jet)”
  - Catatan: Pada pesawat jet, jarak jelajah maksimum dicapai pada kecepatan yang lebih tinggi dari kecepatan L/D maksimum (sekitar 1,32 kali kecepatan hambat minimum). L/D maksimum menentukan jarak maksimum pesawat baling-baling dan daya tahan maksimum pesawat jet.
- **Fakta meragukan**: “yang secara langsung meningkatkan laju konsumsi bahan bakar spesifik (*specific fuel consumption*)”
  - Usulan: “yang secara langsung meningkatkan laju aliran bahan bakar (*fuel flow*)”
  - Catatan: SFC adalah konsumsi per satuan gaya dorong dan merupakan karakteristik mesin. Hambat yang lebih besar menaikkan total konsumsi bahan bakar, bukan SFC itu sendiri.
- **Istilah tidak konsisten**: “laju luncur terbaik (*best glide angle*)”
  - Usulan: “sudut luncur terbaik (*best glide angle*)”
  - Catatan: Istilah *glide angle* berarti sudut luncur, bukan laju luncur.
- **Tata bahasa**: “sayap ber-rasio aspek tinggi”
  - Usulan: “sayap dengan rasio aspek tinggi”
  - Catatan: Awalan ber- tidak boleh ditulis dengan tanda hubung (PUEBI).
- **Istilah tidak konsisten**: “sayap berspan pendek”
  - Usulan: “sayap berbentang pendek”
  - Catatan: Di bagian lain bab ini digunakan istilah "bentang"; "span" adalah istilah asing yang tidak konsisten dengan istilah tersebut.
- **Istilah tidak konsisten**: “di sepanjang rentang sayap”
  - Usulan: “di sepanjang bentang sayap”
  - Catatan: Bab ini juga memakai "bentang sayap". Sebaiknya gunakan satu istilah secara konsisten.
- **Istilah tidak konsisten**: “efisiensi planform rentang sayap”
  - Usulan: “efisiensi distribusi gaya angkat sepanjang bentang sayap”
  - Catatan: Istilah "rentang" tidak konsisten dengan "bentang", dan frasa aslinya rancu.

## `books/aerodinamika-dan-desain-airfoil/src/content/05_geometri-sayap-dan-planform.md`

- **Fakta meragukan**: “Desain ini lazim diterapkan pada pesawat latih dasar seperti Cessna 150 atau Piper PA-28 Cherokee.”
  - Usulan: “Desain ini lazim diterapkan pada pesawat latih dasar seperti Piper PA-28 Cherokee generasi awal.”
  - Catatan: Sayap Cessna 150 tidak murni persegi panjang: bagian dalamnya berkord konstan dan bagian luarnya meruncing. Bagian 6 bab ini sendiri menyebut Cessna 172 yang serupa sebagai 'Modified Rectangular / Tapered', sehingga contoh ini tidak konsisten.
- **Fakta meragukan**: “separasi aliran awal (*stall*) selalu bermula di pangkal sayap (*root*)”
  - Usulan: “separasi aliran awal (*stall*) cenderung bermula di pangkal sayap (*root*)”
  - Catatan: Kata 'selalu' berlebihan. Pola stall juga dipengaruhi airfoil, twist, dan kondisi terbang; yang tepat adalah kecenderungan.
- **Salah ketik**: “Proses pabrikasi sangat sederhana”
  - Usulan: “Proses fabrikasi sangat sederhana”
  - Catatan: Bentuk baku menurut KBBI adalah 'fabrikasi'.
- **Salah ketik**: “Secara teoritis murni berdasarkan teori garis angkat Prandtl”
  - Usulan: “Secara teoretis murni berdasarkan teori garis angkat Prandtl”
  - Catatan: Bentuk baku menurut KBBI adalah 'teoretis'. Bagian lain bab sudah memakai 'teoretis', jadi penulisan juga tidak konsisten.
- **Salah ketik**: “jika bentuk tersebut paling efisien secara teoritis?”
  - Usulan: “jika bentuk tersebut paling efisien secara teoretis?”
  - Catatan: Bentuk baku menurut KBBI adalah 'teoretis'.
- **Istilah tidak konsisten**: “di sepanjang sumbu bentang ($y$)”
  - Usulan: “di sepanjang sumbu rentang ($y$)”
  - Catatan: Bab mendefinisikan istilah 'rentang sayap', tetapi di beberapa tempat memakai 'bentang'. Pilih satu istilah dan gunakan secara seragam.
- **Istilah tidak konsisten**: “sepanjang bentang sayap saat melakukan analisis kekuatan struktur”
  - Usulan: “sepanjang rentang sayap saat melakukan analisis kekuatan struktur”
  - Catatan: Istilah tidak konsisten dengan 'rentang sayap' yang didefinisikan di awal bab.
- **Istilah tidak konsisten**: “Pola pelepasan aliran bermula dari akar sayap”
  - Usulan: “Pola pelepasan aliran bermula dari pangkal sayap”
  - Catatan: Bagian lain bab memakai istilah 'pangkal sayap' untuk *root*.

## `books/aerodinamika-dan-desain-airfoil/src/content/06_efek-aspect-ratio-pada-efisiensi-bahan-bakar.md`

- **Fakta meragukan**: “perbandingan antara rentang sayap (*wingspan*) dengan lebar rata-rata kord sayap (*mean aerodynamic chord*)”
  - Usulan: “perbandingan antara bentang sayap (*wingspan*) dengan kord geometris rata-rata (*mean geometric chord*, $S/b$)”
  - Catatan: AR = b²/S setara dengan b dibagi kord geometris rata-rata (S/b), bukan *mean aerodynamic chord* (MAC). Nilai MAC umumnya berbeda dari S/b pada sayap meruncing.
- **Istilah tidak konsisten**: “Secara fundamental, *Aspect Ratio* ($\text{AR}$) merupakan perbandingan antara rentang sayap”
  - Usulan: “Gunakan satu istilah secara konsisten, misalnya "bentang sayap", di seluruh bab.”
  - Catatan: Bab memakai "rentang sayap" dan "bentang sayap" secara bergantian untuk *wingspan*.
- **Kalimat rancu**: “memiliki bentang sayap tampak lebih lentur dan panjang”
  - Usulan: “memiliki sayap yang tampak lebih lentur dan panjang”
  - Catatan: "Bentang" adalah ukuran panjang sehingga tidak dapat disebut "lentur". Yang lentur adalah sayapnya.
- **Kalimat rancu**: “jarak antarujung sayap semakin jauh dari garis tengah badan pesawat”
  - Usulan: “ujung sayap terletak semakin jauh dari garis tengah badan pesawat”
  - Catatan: "Jarak antarujung sayap" berarti jarak antara kedua ujung sayap, sehingga tidak logis bila dikatakan "jauh dari garis tengah".
- **Fakta meragukan**: “Peningkatan $\text{AR}$ secara langsung memangkas porsi hambatan terbesar ini.”
  - Usulan: “Peningkatan $\text{AR}$ secara langsung memangkas porsi hambatan yang signifikan ini.”
  - Catatan: Porsi 30–40% bukan porsi terbesar. Pada fase jelajah, hambatan parasit/gesekan umumnya lebih dominan, sehingga klaim ini bertentangan dengan angka yang disebut di kalimat sebelumnya.
- **Fakta meragukan**: “menurunkan konsumsi bahan bakar spesifik (*Specific Fuel Consumption* / $\text{SFC}$) secara berkelanjutan”
  - Usulan: “menurunkan laju aliran bahan bakar (*fuel flow*) dan total konsumsi bahan bakar”
  - Catatan: SFC adalah konsumsi bahan bakar per satuan gaya dorong, yaitu karakteristik mesin. Pengurangan hambatan menurunkan kebutuhan dorong dan total konsumsi bahan bakar, bukan SFC itu sendiri.

## `books/aerodinamika-dan-desain-airfoil/src/content/07_aerodinamika-kecepatan-tinggi-dan-transonik.md`

- **Salah ketik**: “subsonik tak mampumampat”
  - Usulan: “subsonik tak mampu mampat”
  - Catatan: "mampumampat" ditulis serangkai tanpa spasi. Padanan yang lebih lazim adalah "tak termampatkan".
- **Kalimat rancu**: “gangguan tekanan merambat dengan kecepatan yang sebanding dengan kecepatan gerak pesawat itu sendiri”
  - Usulan: “gangguan tekanan merambat dengan kecepatan yang setara dengan kecepatan gerak pesawat itu sendiri”
  - Catatan: "Sebanding" berarti proporsional. Maksud kalimat ini adalah kecepatannya hampir sama, sesuai dengan penjelasan di Bagian 2.
- **Istilah tidak konsisten**: “(mendekati batas transonik)”
  - Usulan: “(sudah berada di dalam rezim transonik)”
  - Catatan: Bab ini mendefinisikan transonik sebagai 0,75 ≤ M ≤ 1,2. Jadi M = 0,80 sudah termasuk transonik, bukan baru mendekati batasnya.
- **Fakta meragukan**: “seperti seri NACA 6-digit”
  - Usulan: “seperti seri NACA 6”
  - Catatan: Penamaan resminya adalah NACA seri 6 (6-series). Klasifikasi "digit" hanya dipakai untuk seri 4-digit dan 5-digit.
- **Fakta meragukan**: “sehingga menunda pembentukan kantung supersonik lokal dan memperlemah intensitas gelombang kejut”
  - Usulan: “sehingga kantung supersonik lokal yang terbentuk diakhiri oleh gelombang kejut yang jauh lebih lemah”
  - Catatan: Airfoil superkritis justru dirancang beroperasi di atas M_crit dengan kantung supersonik lokal. Yang ditunda terutama adalah M_dd, bukan pembentukan kantung supersonik.
- **Fakta meragukan**: “**Peningkatan Nilai $M_{\text{crit}}$ dan $M_{\text{dd}}$:**”
  - Usulan: “**Peningkatan Nilai $M_{\text{dd}}$:**”
  - Catatan: Keunggulan utama airfoil superkritis adalah kenaikan M_dd. M_crit tidak selalu naik. Tabel ringkasan pun hanya menyebut "Menunda M_dd".
- **Tata bahasa**: “Di mana:”
  - Usulan: “Dengan:”
  - Catatan: Frasa "di mana" sebagai penghubung keterangan tidak baku dalam bahasa Indonesia.

## `books/aerodinamika-dan-desain-airfoil/src/content/08_stabilitas-longitudinal-dan-pusat-tekanan.md`

- **Istilah tidak konsisten**: “memicu kondisi membahayakan hingga kehilangan daya angkat (*stall*)”
  - Usulan: “memicu kondisi membahayakan hingga kehilangan gaya angkat (*stall*)”
  - Catatan: Di bagian lain bab ini istilah yang dipakai adalah "gaya angkat"; "daya" dalam fisika berarti besaran lain.
- **Tata bahasa**: “yang nilainya bernilai tetap untuk rentang kerja sudut serang linear”
  - Usulan: “yang nilainya tetap untuk rentang kerja sudut serang linear”
  - Catatan: Redundan: "nilainya bernilai".
- **Istilah tidak konsisten**: “Jarak posisi antara $\text{CG}$ dan $\text{AC}$ (*Static Margin*)”
  - Usulan: “Jarak posisi antara $\text{CG}$ dan $\text{AC}$”
  - Catatan: Catatan Kunci mendefinisikan Static Margin sebagai jarak tanpa dimensi antara CG dan titik netral total pesawat, bukan jarak berdimensi CG–AC sayap.
- **Istilah tidak konsisten**: “Pusat Aerodinamika total pesawat (*Neutral Point* / $\text{AC}$)”
  - Usulan: “titik netral pesawat (*Neutral Point*)”
  - Catatan: AC di bab ini didefinisikan untuk airfoil/sayap, sedangkan titik netral adalah milik seluruh pesawat. Menyamakan keduanya membingungkan.
- **Istilah tidak konsisten**: “defleksi kendali kemudi tukik (*elevator*)”
  - Usulan: “defleksi kemudi angguk (*elevator*)”
  - Catatan: Bab ini memakai istilah "angguk" untuk gerak *pitch*. "Kemudi tukik" tidak konsisten dengan istilah tersebut.
- **Salah ketik**: “Ketika hembusan angin mendadak”
  - Usulan: “Ketika embusan angin mendadak”
  - Catatan: Bentuk baku menurut KBBI adalah "embusan".
- **Salah ketik**: “gangguan hembusan udara”
  - Usulan: “gangguan embusan udara”
  - Catatan: Bentuk baku menurut KBBI adalah "embusan".
- **Fakta meragukan**: “(seperti F-16 Falcon atau F-22 Raptor)”
  - Usulan: “(seperti F-16 Fighting Falcon atau F-22 Raptor)”
  - Catatan: Nama resmi pesawat ini adalah F-16 Fighting Falcon.
- **Fakta meragukan**: “Telapak tangan akan merasakan satu titik lokasi tempat resultan tekanan udara paling kuat bekerja.”
  - Usulan: “Seluruh tekanan udara yang tersebar pada papan dapat diwakili oleh satu gaya resultan yang bekerja pada satu titik.”
  - Catatan: CP adalah titik tangkap resultan gaya, bukan titik dengan tekanan paling kuat. Kalimat asli menyesatkan.

## `books/aerodinamika-dan-desain-airfoil/src/content/09_boundary-layer-dan-separasi-aliran.md`

- **Salah ketik**: “tanpa pertukaran massa makroskopis antar-lapisan”
  - Usulan: “tanpa pertukaran massa makroskopis antarlapisan”
  - Catatan: Menurut PUEBI, bentuk terikat "antar" ditulis serangkai tanpa tanda hubung. Bab ini juga sudah menulis "antarmolekul" secara serangkai.
- **Salah ketik**: “**Pencampuran Fluida Antar-Lapisan**”
  - Usulan: “**Pencampuran Fluida Antarlapisan**”
  - Catatan: Bentuk terikat "antar" ditulis serangkai.
- **Istilah tidak konsisten**: “Pemisahan aliran masif terjadi di permukaan atas”
  - Usulan: “Separasi aliran masif terjadi di permukaan atas”
  - Catatan: Di bagian lain bab ini istilah yang dipakai konsisten "separasi aliran".
- **Istilah tidak konsisten**: “Setelah melewati titik ketebalan maksimum menuju tepi belakang (*trailing edge*), tekanan fluida meningkat”
  - Usulan: “Setelah melewati titik kecepatan puncak (tekanan minimum) menuju tepi belakang (*trailing edge*), tekanan fluida meningkat”
  - Catatan: Tahap 1 menyebut batasnya "titik kecepatan puncak", sedangkan tahap 2 menyebut "titik ketebalan maksimum". Kedua titik ini umumnya tidak berimpit, sehingga batas antara gradien menguntungkan dan merugikan menjadi rancu. Hal yang sama terjadi pada diagram.
- **Istilah tidak konsisten**: “lalu berbalik arah membentuk pusaran resirkulasi (*reverse flow*)”
  - Usulan: “lalu berbalik arah (*reverse flow*) membentuk pusaran resirkulasi”
  - Catatan: "Reverse flow" berarti aliran balik, bukan pusaran resirkulasi. Padanan istilahnya perlu diletakkan pada frasa yang tepat.
- **Tata bahasa**: “Permukaan sayap pesawat umumnya dibuat sangat halus, namun di area tertentu”
  - Usulan: “Permukaan sayap pesawat umumnya dibuat sangat halus, tetapi di area tertentu”
  - Catatan: Untuk pertentangan di dalam satu kalimat majemuk setara, konjungsi baku yang dipakai adalah "tetapi"; "namun" lazim digunakan sebagai penghubung antarkalimat.

## `books/aerodinamika-dan-desain-airfoil/src/content/10_perangkat-high-lift-dan-kontrol-aerodinamika.md`

- **Tata bahasa**: “meningkatkan respon belok pesawat”
  - Usulan: “meningkatkan respons guling pesawat”
  - Catatan: Bentuk baku KBBI adalah "respons". Spoiler membantu gerak guling (roll), bukan belok secara langsung, sehingga "guling" lebih tepat dan konsisten dengan judul poin.
- **Tata bahasa**: “Pesawat transport sipil modern”
  - Usulan: “Pesawat transpor sipil modern”
  - Catatan: Bentuk baku KBBI adalah "transpor".
- **Istilah tidak konsisten**: “fase desensus”
  - Usulan: “fase penurunan (*descent*)”
  - Catatan: "Desensus" bukan kata baku KBBI. Kalimat yang sama sudah memakai "laju penurunan (*descent rate*)".
- **Istilah tidak konsisten**: “laju tanjak (*climb gradient*)”
  - Usulan: “gradien tanjak (*climb gradient*)”
  - Catatan: *Climb gradient* adalah gradien atau sudut tanjak, bukan laju (*rate of climb*).
- **Fakta meragukan**: “lazim diaplikasikan pada pesawat komersial berbadan lebar (*wide-body*)”
  - Usulan: “pernah banyak digunakan pada pesawat komersial generasi lama (misalnya Boeing 727, 737 klasik, dan 747)”
  - Catatan: Pesawat berbadan lebar modern (misalnya 777, 787, A350) umumnya memakai flap single atau double-slotted demi kesederhanaan mekanis. Klaim "lazim" kurang tepat.
- **Kalimat rancu**: “guna meminimalkan $v_{\text{stall}}$ dan $v_{\text{ref}}$”
  - Usulan: “guna meminimalkan $v_{\text{stall}}$ dan kecepatan acuan pendaratan ($v_{\text{ref}}$)”
  - Catatan: Istilah $v_{\text{ref}}$ muncul tanpa didefinisikan sebelumnya.
- **Fakta meragukan**: “merusak (*spoil*) kontur aliran udara laminer di atas sayap”
  - Usulan: “merusak (*spoil*) aliran udara yang melekat di atas sayap”
  - Catatan: Lapisan batas pada sebagian besar permukaan atas sayap pesawat transpor umumnya turbulen, bukan laminer. Fungsi spoiler adalah memisahkan aliran yang melekat.
- **Kalimat rancu**: “pesawat komuter berkecepatan rendah (STOL - *Short Take-Off and Landing*)”
  - Usulan: “pesawat berkemampuan lepas landas dan mendarat pendek (STOL - *Short Take-Off and Landing*)”
  - Catatan: STOL berarti kemampuan lepas landas dan mendarat pendek, bukan padanan dari "pesawat komuter berkecepatan rendah".

## `books/aerodinamika-dan-desain-airfoil/src/content/11_desain-wingtip-dan-reduksi-vorteks.md`

- **Tata bahasa**: “Pernahkah teramati bentuk ujung sayap pesawat komersial modern saat duduk di dekat jendela kabin?”
  - Usulan: “Pernahkah Anda mengamati bentuk ujung sayap pesawat komersial modern saat duduk di dekat jendela kabin?”
  - Catatan: Kalimat tidak bersubjek: tidak jelas siapa yang "duduk di dekat jendela".
- **Istilah tidak konsisten**: “di sepanjang rentang sayap”
  - Usulan: “di sepanjang bentang sayap”
  - Catatan: Bab memakai "bentang sayap" dan "rentang sayap" secara bergantian untuk *span*. Sebaiknya seragamkan menjadi "bentang", termasuk pada "distribusi gaya angkat rentang sayap" dan "perpanjangan rentang".
- **Istilah tidak konsisten**: “Faktor efisiensi rentang Oswald”
  - Usulan: “Faktor efisiensi bentang Oswald”
  - Catatan: Istilah tidak konsisten dengan "Faktor Efisiensi Oswald" dan "bentang sayap" di bagian lain bab.
- **Istilah tidak konsisten**: “meningkatkan momen lentur pada pangkal sayap”
  - Usulan: “meningkatkan momen tekuk pada akar sayap”
  - Catatan: Bab mencampur "momen tekuk" dan "momen lentur", juga "akar sayap" dan "pangkal sayap", untuk konsep yang sama.
- **Kalimat rancu**: “Penalti bobot vertikal lebih rendah”
  - Usulan: “Penambahan momen tekuk lebih rendah dibanding sirip vertikal”
  - Catatan: Frasa "penalti bobot vertikal" tidak jelas. Teks sebelumnya menjelaskan keunggulan raked wingtip dari sisi momen tekuk.
- **Kalimat rancu**: “Desain sayap tingkat lanjut yang menggabungkan”
  - Usulan: “Desain winglet tingkat lanjut yang menggabungkan”
  - Catatan: Split Scimitar adalah perangkat ujung sayap (winglet), bukan desain sayap secara keseluruhan.
- **Istilah tidak konsisten**: “mengadopsi ujung melengkung (*curved wingtips*)”
  - Usulan: “mengadopsi ujung bilah melengkung (*curved blade tips*)”
  - Catatan: Bilah turbin bukan sayap, sehingga istilah "wingtips" kurang tepat untuk rotor turbin angin.

## `books/aerodinamika-dan-desain-airfoil/src/content/12_metode-pengujian-dan-simulasi-cfd.md`

- **Istilah tidak konsisten**: “Desain tersebut secara teoritis tampak efisien”
  - Usulan: “Desain tersebut secara teoretis tampak efisien”
  - Catatan: Bentuk baku KBBI adalah "teoretis", dan bentuk ini juga dipakai pada paragraf berikutnya.
- **Kalimat rancu**: “Namun, memasang profil tersebut secara langsung pada purwarupa pesawat terbang berawak berisiko tinggi tanpa serangkaian tahapan validasi”
  - Usulan: “Namun, memasang profil tersebut secara langsung pada purwarupa pesawat terbang berawak tanpa serangkaian tahapan validasi eksperimental dan komputasional yang mendalam sangat berisiko.”
  - Catatan: Frasa "berisiko tinggi" terselip di tengah sehingga tampak menerangkan pesawat, bukan tindakan memasang profil.
- **Tata bahasa**: “perbedaan nyata antara formulasi analitis teoretis dengan fenomena aliran”
  - Usulan: “perbedaan nyata antara formulasi analitis teoretis dan fenomena aliran”
  - Catatan: Pasangan kata yang baku adalah "antara ... dan", bukan "antara ... dengan".
- **Tata bahasa**: “Karena aliran turbulensi memiliki rentang skala”
  - Usulan: “Karena aliran turbulen memiliki rentang skala”
  - Catatan: Kata sifat yang tepat adalah "turbulen"; "turbulensi" adalah kata benda.
- **Tata bahasa**: “sangat kritikal untuk menangkap”
  - Usulan: “sangat kritis untuk menangkap”
  - Catatan: "Kritikal" tidak baku; padanan bakunya "kritis".
- **Istilah tidak konsisten**: “3 gaya ($L, D, Y$) dan 3 momen ($M, N, L$)”
  - Usulan: “3 gaya ($L, D, Y$) dan 3 momen (momen guling, angguk, dan oleng)”
  - Catatan: Simbol L dipakai ganda, yaitu untuk gaya angkat dan momen guling, sehingga membingungkan pembaca.
- **Istilah tidak konsisten**: “Dalam praktik, nilai $C\_p$ hanya diketahui pada titik-titik diskret di sepanjang kord”
  - Usulan: “Dalam praktik, nilai $C\_p$ hanya diketahui pada titik-titik diskret di sepanjang *chord*”
  - Catatan: Bagian sebelumnya memakai istilah *chord*, sedangkan bagian ini memakai "kord"; istilah perlu diseragamkan.
- **Fakta meragukan**: “dibatasi secara ketat dalam bentuk jam komputasi CFD (*teraflops*) dan waktu operasi terowongan angin (*run time* per pekan)”
  - Usulan: “dibatasi secara ketat dalam bentuk alokasi sumber daya komputasi CFD dan jumlah jam/run terowongan angin per periode pengujian”
  - Catatan: Teraflops adalah satuan laju komputasi, bukan jam komputasi. Regulasi ATR saat ini juga memakai satuan alokasi (MAUh) per periode pengujian, bukan per pekan.
- **Fakta meragukan**: “Pengujian terowongan angin skala penuh dan transonik dilakukan pada tahap akhir”
  - Usulan: “Pengujian terowongan angin transonik dengan model berskala dilakukan pada tahap akhir”
  - Catatan: Pesawat sebesar A350 atau 787 tidak diuji pada skala penuh di terowongan angin transonik; pengujiannya memakai model berskala.
- **Salah ketik**: “memverifikasi batas batas buffet (*buffet boundary*)”
  - Usulan: “memverifikasi batas buffet (*buffet boundary*)”
  - Catatan: Kata "batas" tertulis dua kali.
- **Istilah tidak konsisten**: “Performa aerodinamika terukur dari integrasi distribusi koefisien tekanan permukaan ($C\_p$) dan tegangan geser dinding ($\tau\_w$).”
  - Catatan: Bagian 5 hanya membahas integrasi $C_p$; kontribusi tegangan geser tidak dibahas di bab, sehingga poin kunci ini tidak konsisten dengan isi bab.

## `books/aerodinamika-dan-desain-airfoil/src/content/13_referensi.md`

- **Tata bahasa**: “landasan teoritis serta metodologis”
  - Usulan: “landasan teoretis serta metodologis”
  - Catatan: Bentuk baku menurut KBBI adalah "teoretis", bukan "teoritis".
