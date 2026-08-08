## Mikrofisika Awan Hangat: Tabrakan dan Penyatuan (Collision-Coalescence)

Pernahkah timbul pertanyaan mengapa awan di daerah tropis, seperti di Indonesia, dapat menghasilkan hujan yang sangat lebat meskipun suhu di dalam awan tersebut tidak pernah mencapai titik beku? Di sinilah **Mikrofisika Awan Hangat** memegang peran utama.

Pada bagian sebelumnya, pembelajaran telah membahas bagaimana tetesan air tumbuh melalui **difusi uap**. Namun, pertumbuhan melalui difusi berlangsung sangat lambat setelah tetesan mencapai ukuran tertentu (sekitar $20\ \mu\text{m}$). Untuk menjadi tetes hujan yang berukuran $1\text{–}2\text{ mm}$, diperlukan mekanisme lain yang jauh lebih cepat: proses **Tabrakan dan Penyatuan (Collision-Coalescence)**.

### 1. Mengapa Difusi Saja Tidak Cukup?

Pertumbuhan tetesan air melalui kondensasi uap mengikuti hukum penambahan hasil yang semakin berkurang (*diminishing returns*). Semakin besar tetesan, semakin lambat laju pertumbuhan radiusnya.

> **Analogi:** Bayangkan proses mengecat dinding yang sangat luas. Saat awal, satu kaleng cat bisa menutupi area yang terlihat luas. Namun, seiring dinding yang dicat semakin luas, penambahan satu kaleng cat yang sama hanya memberikan tambahan lebar yang hampir tidak terlihat secara visual.

Secara matematis, laju pertumbuhan massa melalui difusi dirumuskan sebagai berikut:

$$ \frac{\text{d}m}{\text{d}t} \propto r $$

Karena massa tetesan berbanding lurus dengan pangkat tiga radiusnya ($m \propto r^3$), maka laju pertumbuhan radiusnya adalah:

$$ \frac{\text{d}r}{\text{d}t} \propto \frac{1}{r} $$

Artinya, saat $r$ membesar, nilai $\frac{\text{d}r}{\text{d}t}$ semakin mengecil. Untuk mencapai ukuran tetes hujan hanya dengan mengandalkan difusi, diperlukan waktu berhari-hari, padahal awan kumulus mampu menghasilkan hujan hanya dalam waktu 20–30 menit.

### 2. Kecepatan Terminal: Kunci Terjadinya Tabrakan

Inti dari proses *collision-coalescence* adalah perbedaan **kecepatan terminal** ($V_{\text{t}}$) antar tetesan air. Tetesan yang lebih besar jatuh lebih cepat daripada tetesan yang lebih kecil karena gaya gravitasi yang bekerja padanya lebih besar dibandingkan dengan gaya hambat udara (*drag force*).

Untuk tetesan sangat kecil (radius $r < 40\ \mu\text{m}$), berlaku **Hukum Stokes**:

$$ V_{\text{t}} = \frac{2 r^2 g (\rho_{\text{l}} - \rho_{\text{a}})}{9 \eta} $$

Keterangan variabel:

- $g$ = percepatan gravitasi ($\text{m/s}^2$)
- $\rho_{\text{l}}$ = densitas air ($\text{kg/m}^3$)
- $\rho_{\text{a}}$ = densitas udara ($\text{kg/m}^3$)
- $\eta$ = viskositas dinamik udara ($\text{kg}/(\text{m}\cdot\text{s})$)

> **Poin Utama:** Karena $V_{\text{t}} \propto r^2$, perbedaan kecil dalam ukuran radius akan menghasilkan perbedaan besar dalam kecepatan jatuh. Tetesan pengumpul yang lebih besar (*collector drop*) akan menyusul dan menabrak tetesan kecil di bawahnya.

### 3. Mekanisme Tabrakan (Collision)

Saat tetesan pengumpul yang besar jatuh melewati kumpulan tetesan yang lebih kecil, terjadi interaksi hidrodinamika. Tidak semua tetesan kecil yang berada di jalur tetesan besar akan bertabrakan.

- **Garis Alir (Streamlines):** Saat tetesan besar jatuh, ia mendorong udara di depannya ke samping. Tetesan yang sangat kecil (massa rendah) akan mengikuti garis alir udara ini dan tertiup menjauh, sehingga luput dari tabrakan.
- **Inersia:** Tetesan yang sedikit lebih besar memiliki inersia yang cukup untuk menembus garis alir udara dan menabrak tetesan pengumpul.

**Efisiensi Tabrakan ($E_{\text{coll}}$):** Didefinisikan sebagai rasio antara jumlah tabrakan aktual dengan jumlah tabrakan teoritis berdasarkan geometri lintasan.

$$ E_{\text{coll}} = \frac{\text{Jumlah tabrakan aktual}}{\text{Jumlah tabrakan teoritis secara geometris}} $$

### 4. Mekanisme Penyatuan (Coalescence)

Peristiwa tabrakan tidak selalu berakhir dengan penyatuan. Setelah tabrakan terjadi, terdapat dua kemungkinan: **menyatu (*merge*)** atau **memantul (*bounce*)**.

Faktor-faktor yang memengaruhi penyatuan meliputi:

1. **Lapisan Film Udara:** Saat dua tetesan mendekat, terdapat lapisan tipis udara di antara keduanya yang harus dikeluarkan sebelum permukaan air dapat bersentuhan.
2. **Tegangan Permukaan:** Jika energi benturan cukup besar untuk mengatasi tegangan permukaan, kedua tetesan akan menyatu.
3. **Muatan Listrik:** Adanya medan listrik di awan sering kali meningkatkan efisiensi penyatuan dengan cara menarik tetesan secara elektrostatik.

**Efisiensi Penyatuan ($\epsilon$):** Adalah probabilitas bahwa tetesan yang telah menabrak akan benar-benar menyatu.

> **Catatan Penting:** Efisiensi Koleksi ($E_{\text{c}}$) total merupakan hasil kali dari efisiensi tabrakan dan efisiensi penyatuan:

$$ E_{\text{c}} = E_{\text{coll}} \times \epsilon $$

### 5. Simulasi Sederhana: Kecepatan Terminal

Berikut adalah skrip Python sederhana untuk menghitung perbedaan kecepatan jatuh antara tetes pengumpul (radius $50\ \mu\text{m}$) dan tetes awan biasa (radius $10\ \mu\text{m}$).

```python
def terminal_velocity_stokes(r_micrometer):
    # Konstanta fisik
    g = 9.81         # Gravitasi (m/s^2)
    rho_l = 1000     # Densitas air (kg/m^3)
    rho_a = 1.225    # Densitas udara (kg/m^3)
    eta = 1.8e-5     # Viskositas dinamik udara (kg/ms)
    
    # Konversi mikrometer ke meter
    r = r_micrometer * 1e-6
    
    # Rumus Stokes
    v_t = (2 * r**2 * g * (rho_l - rho_a)) / (9 * eta)
    return v_t

# Perhitungan kecepatan terminal
v_small = terminal_velocity_stokes(10)
v_large = terminal_velocity_stokes(50)

print(f"Kecepatan tetes 10um: {v_small:.4f} m/s")
print(f"Kecepatan tetes 50um: {v_large:.4f} m/s")
print(f"Selisih kecepatan: {v_large - v_small:.4f} m/s")
```

### 6. Aplikasi Dunia Nyata dan Skenario

#### Awan Tropis vs. Awan Garis Lintang Tinggi

Di wilayah tropis seperti Indonesia, puncak awan sering kali tidak mencapai suhu $0^\circ\text{C}$ (awan hangat). Hujan di kawasan ini murni merupakan hasil dari proses *collision-coalescence*. Hal inilah yang menyebabkan hujan tropis dapat terjadi secara mendadak dengan suhu tetesan yang hangat.

#### Skenario: "The Great Collector"

Dalam perkembangan awan *Cumulus*, beberapa tetesan dapat tumbuh lebih cepat karena terbentuk di atas **Inti Kondensasi Awan (CCN)** berukuran raksasa, seperti partikel garam laut.

1. Tetesan awal ini mencapai radius $30\ \mu\text{m}$ melalui proses difusi uap.
2. Tetesan tersebut mulai jatuh lebih cepat dibandingkan tetesan di sekitarnya.
3. Sepanjang lintasan jatuh, tetesan ini menyapu dan menyatukan tetesan-tetesan kecil di bawahnya, sehingga volumenya bertambah pesat.
4. Dalam waktu singkat, tetesan berkembang menjadi tetes hujan berukuran $2\text{ mm}$.
5. Saat ukuran tetesan melampaui batas stabil (sekitar $> 6\text{ mm}$), hambatan udara akan memecah tetesan besar ini menjadi beberapa tetesan kecil baru, yang masing-masing kembali bertindak sebagai tetesan pengumpul. Fenomena ini dikenal sebagai **Proses Berantai Langmuir**.

### 7. Ringkasan Proses

| Tahap | Mekanisme Utama | Ukuran Tetesan |
| --- | --- | --- |
| **Awal** | Nukleasi pada $\text{CCN}$ | $< 0.1\ \mu\text{m}$ |
| **Pertumbuhan I** | Kondensasi dan Difusi | $0.1\ \mu\text{m} \rightarrow 20\ \mu\text{m}$ |
| **Pertumbuhan II** | Tabrakan dan Penyatuan | $20\ \mu\text{m} \rightarrow 2000\ \mu\text{m}$ |
| **Akhir** | Presipitasi (Hujan) | $> 2000\ \mu\text{m}\ (2\text{ mm})$ |

> **Pertanyaan Refleksi:** Jika semua tetesan di dalam awan memiliki ukuran yang seragam (homogen), apakah hujan tetap dapat terbentuk melalui proses tabrakan dan penyatuan?

Tanpa adanya variasi ukuran, seluruh tetesan akan jatuh dengan kecepatan terminal yang sama, sehingga tabrakan tidak akan terjadi. Polusi udara sering kali menyebabkan distribusi ukuran tetesan menjadi seragam dan berukuran sangat kecil, yang secara tidak langsung dapat menghambat pembentukan hujan pada jenis awan tertentu.
