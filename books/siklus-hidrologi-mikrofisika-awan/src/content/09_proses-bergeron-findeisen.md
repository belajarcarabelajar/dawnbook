## Proses Bergeron-Findeisen: Transfer Molekul Uap di Awan Cold Phase

Bagaimana hujan dapat terbentuk di wilayah beriklim dingin saat musim dingin, atau di puncak awan kumulonimbus yang menjulang tinggi di kawasan khatulistiwa? Di mana suhu berada jauh di bawah titik beku, pembentukan presipitasi tidak hanya bergantung pada mekanisme tumbukan dan penggabungan (*collision-coalescence*) tetes air cair. Pada temperatur subnol, mekanisme dominan yang mendorong pertumbuhan partikel presipitasi adalah pembekuan dan transfer massa uap air yang dikenal sebagai **Proses Bergeron-Findeisen** (atau proses Tor Bergeron dan Walter Findeisen).

### Memahami Kondisi Fase Campuran (*Mixed-Phase*)

Sebelum mendalami mekanisme utama, lingkungan mikro fisika tempat proses ini berlangsung perlu dipahami terlebih dahulu. Di atmosfer, air murni tidak selalu langsung membeku tepat pada temperatur $0^\circ\text{C}$.

#### Air Superdingin (*Supercooled Water*)

Tetesan air murni di atmosfer dapat bertahan dalam fase cair hingga temperatur mencapai $-40^\circ\text{C}$ apabila tidak terdapat aerosol spesifik yang bertindak sebagai inti pembekuan (*ice nuclei*). Kondisi air cair pada temperatur di bawah $0^\circ\text{C}$ ini dinamakan **air superdingin** (*supercooled water*).

Pada lapisan awan dengan rentang temperatur antara $0^\circ\text{C}$ hingga $-40^\circ\text{C}$, terbentuk lingkungan **fase campuran** (*mixed-phase cloud*) yang terdiri atas:

1. **Tetesan air superdingin** dengan konsentrasi jumlah yang sangat tinggi.
2. **Kristal es** dengan konsentrasi jumlah yang relatif jauh lebih rendah.

> **Pertanyaan Analisis:** Mengapa populasi kristal es jauh lebih sedikit dibandingkan tetesan air superdingin pada rentang temperatur ini? Hal ini terjadi karena atmosfer bumi secara alami memiliki konsentrasi Inti Kondensasi Awan ($\text{CCN}$) yang jauh lebih melimpah dibandingkan Inti Es ($\text{IN}$) yang efektif pada temperatur hangat di atas $-40^\circ\text{C}$.

### Fisika Termodinamika: Perbedaan Tekanan Uap Jenuh

Prinsip dasar yang menggerakkan Proses Bergeron-Findeisen terletak pada perbedaan besarnya **Tekanan Uap Jenuh** ($e_s$) di atas permukaan air cair dibandingkan dengan di atas permukaan es padat pada temperatur subnol yang sama.

#### Prinsip Termodinamika Kesetimbangan

Pada temperatur di bawah titik beku ($T < 0^\circ\text{C}$), molekul air pada fase cair memiliki energi kinetik laten yang membuat molekul lebih mudah melepaskan diri ke fase uap dibandingkan molekul pada kisi kristal es padat. Ikatan hidrogen dalam kisi kristal es berstruktur heksagonal jauh lebih stabil dan mengikat molekul air secara ketat.

Kondisi kesetimbangan termodinamika ini dinyatakan dalam pertidaksamaan:

<div>

$$
e_{s(\text{air})} > e_{s(\text{es})}
$$

</div>

Dengan kata lain, ketika kondisi parsial uap air di udara berada pada tingkat jenuh terhadap air cair ($RH_{\text{air}} = 100\text{\%}$), udara tersebut berada pada kondisi lewat jenuh (*supersaturated*) terhadap permukaan kristal es ($RH_{\text{es}} > 100\text{\%}$).

> **Analogi Transfer Massa:**
> Pembaca dapat membayangkan kondisi ini seperti dua tangki yang terhubung oleh saluran uap. Tangki pertama (Tetes Air) melepaskan uap dengan tekanan tinggi karena ikatan molekul yang lebih longgar, sedangkan tangki kedua (Kristal Es) menarik dan mengikat uap dengan kuat. Akibat perbedaan tekanan ini, massa molekul uap berpindah secara terus-menerus dari tangki air menuju tangki es.

### Tahapan Mekanisme Pertumbuhan Kristal Es

Proses transfer massa uap dari tetesan air superdingin ke kristal es berlangsung dalam tahapan berurutan sebagai berikut:

1. **Pembentukan Gradien Tekanan Uap:** Akibat pertidaksamaan $e_{s(\text{air})} > e_{s(\text{es})}$, tercipta gradien tekanan uap parsial antara mikro-lingkungan di sekitar tetesan air cair dan mikro-lingkungan di sekitar kristal es.
2. **Penguapan Tetes Air (*Evaporation*):** Tetesan air superdingin mengalami penguapan untuk mempertahankan kejenuhan uap di sekitarnya.
3. **Difusi Molekuler Uap Air (*Vapor Diffusion*):** Molekul uap air berpindah secara difusi melewati gradien tekanan menuju wilayah bertekanan uap rendah di dekat permukaan kristal es.
4. **Deposisi Fase Uap (*Deposition*):** Saat molekul uap menyentuh permukaan kristal es, uap air langsung mengalami perubahan fase menjadi padat (deposisi) dan menyatu dengan kisi kristal.
5. **Pertumbuhan Massa Kristal:** Kristal es bertambah massa dan ukurannya dengan cepat, sedangkan tetesan air superdingin di sekitarnya menyusut hingga menguap sempurna.

> **Catatan Fisika Awan:** Pada fase awal ini, pertumbuhan kristal es terjadi akibat ikatan deposisi uap air langsung dari fase gas ke padat, bukan akibat tumbukan fisik (*impact freezing*) antara kristal es dengan tetesan air superdingin.

### Pemodelan Laju Pertumbuhan Kristal Es

Laju perubahan massa kristal es ($M$) terhadap waktu ($t$) yang disebabkan oleh proses difusi uap air dirumuskan melalui persamaan berikut:

<div>

$$
\frac{dM}{dt} = C \cdot f(T, P) \cdot (S_i - 1)
$$

</div>

Persamaan tersebut memiliki variabel-variabel termodinamika sebagai berikut:

- $M$: Massa kristal es ($\text{g}$ atau $\text{kg}$).
- $t$: Waktu ($\text{s}$).
- $C$: Faktor kapasitas bentuk (*capacitance factor*) yang bergantung pada geometri habit kristal es (misalnya jarum, pelat heksagonal, atau dendrit).
- $f(T, P)$: Fungsi koefisien termodinamika gabungan dari konduktivitas termal dan difusivitas uap air pada temperatur ($T$) dan tekanan ($P$).
- $(S_i - 1)$: Tingkat lewat-jenuh uap air relatif terhadap permukaan es padat, di mana $S_i = \frac{e}{e_{s(\text{es})}}$.

Karena nilai $(S_i - 1)$ selalu positif dan signifikan dalam awan fase campuran, pertumbuhan massa kristal es terus berlangsung dengan laju yang lebih tinggi dibandingkan laju pertumbuhan tetes air.

### Peran Proses Bergeron-Findeisen dalam Pembentukan Presipitasi

Tetesan air awan berukuran mikroskopis ($10\text{--}20\ \mu\text{m}$) memiliki kecepatan jatuh terminal yang sangat kecil sehingga tetap melayang akibat arus udara naik (*updraft*). Agar presipitasi dapat terbentuk, partikel awan harus mencapai ukuran minimal tertentu (beberapa ratus mikrometer hingga milimeter) agar gaya gravitasi dapat mengalahkan gaya angkat udara.

Dibandingkan dengan proses pembentukan hujan pada awan hangat (*warm cloud*) yang mengandalkan tumbukan-penggabungan (*collision-coalescence*), Proses Bergeron-Findeisen memberikan laju pertumbuhan partikel presipitasi yang jauh lebih pesat pada temperatur subnol.

Setelah kristal es bertambah besar melalui deposisi uap hingga mencapai kecepatan jatuh efektif, kristal mulai mengalami pembesaran sekunder:

1. **Riming (Pelapisan Es):** Kristal es menabrak dan membekukan tetesan air superdingin secara langsung saat meluncur turun, membentuk *graupel* atau pelet es.
2. **Agregasi (*Aggregation*):** Kristal-kristal es saling bertabrakan dan melekat satu sama lain membentuk jalinan kepingan salju (*snowflake*).

Ketika kepingan salju atau graupel jatuh melewati garis-lintar pembekuan ($T > 0^\circ\text{C}$) pada atmosfer bagian bawah, partikel padat tersebut mencair sepenuhnya dan berubah menjadi presipitasi berbentuk **hujan cair**.

### Penerapan Modifikasi Cuaca: Penyemaian Awan (*Cloud Seeding*)

Pemahaman mengenai termodinamika fase campuran dan Proses Bergeron-Findeisen menjadi landasan ilmiah utama bagi teknologi modifikasi cuaca atau penyemaian awan (*cloud seeding*).

#### Skenario Awan Fase Campuran Tanpa Presipitasi

Pada kondisi kekeringan atau kebutuhan presipitasi tambahan, lapisan awan dingin sering kali mengandung volume air superdingin yang melimpah namun kekurangan partikel Inti Es ($\text{IN}$). Akibatnya, tetesan air superdingin gagal terkonversi menjadi kristal es dan tidak menghasilkan presipitasi.

#### Prosedur dan Mekanisme Penyemaian

1. **Penaburan Agen Penyemai:** Pesawat udara atau roket melepaskan material penyemai seperti **Perak Iodida** ($\text{AgI}$) atau es kering ($\text{CO}_2$ padat) ke dalam lapisan awan superdingin.
2. **Fungsi AgI sebagai Inti Es Buatan:** Kisi kristal $\text{AgI}$ memiliki struktur geometri heksagonal yang sangat presisi dan serupa dengan struktur kisi kristal es alami, sehingga $\text{AgI}$ efektif bertindak sebagai Inti Es ($\text{IN}$) pada temperatur yang lebih hangat ($T \approx -4^\circ\text{C}$).
3. **Inisiasi Proses Bergeron-Findeisen:** Kehadiran inti es buatan menginisiasi pembentukan kristal es seketika. Gradien tekanan uap langsung terbentuk antara tetesan air superdingin dan es baru tersebut.
4. **Pertumbuhan Pesat dan Presipitasi:** Kristal es tumbuh pesat melalui deposisi uap, mencapai ukuran kritis presipitasi, lalu jatuh sebagai salju atau mencair menjadi hujan di permukaan tanah.

### Ringkasan Tahapan Fisika Bergeron-Findeisen

| Tahapan | Tetesan Air Superdingin | Kristal Es Padat | Kondisi Kejenuhan Atmosfer | Hasil Akhir Mikro Fisika |
| :--- | :--- | :--- | :--- | :--- |
| **Inisiasi (Awal)** | Konsentrasi tinggi, fase cair superdingin | Konsentrasi sangat rendah | Jenuh terhadap air cair ($RH_{\text{air}} = 100\text{\%}$) | Kesetimbangan uap belum terganggu |
| **Transformasi (Proses)** | Mengalami evaporasi mendadak | Mengalami deposisi uap pesat | Lewat-jenuh terhadap es ($RH_{\text{es}} > 100\text{\%}$) | Transfer massa uap dari cair ke padat |
| **Klimaks (Terminasi)** | Menyusut hingga habis menguap | Tumbuh mekar dan semakin berat | Kesetimbangan uap bergeser | Partikel es mulai jatuh (presipitasi) |

Tanpa keberadaan Proses Bergeron-Findeisen pada atmosfer lintang menengah dan tinggi, laju pembentukan presipitasi pada awan-awan dingin akan berlangsung jauh lebih lambat, yang berpengaruh langsung terhadap distribusi curah hujan global.
