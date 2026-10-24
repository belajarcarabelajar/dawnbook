## Mengantisipasi Kesalahan (Expect Error)

Bayangkan kamu baru saja selesai menarik uang di mesin ATM. Di tengah hiruk-pikuk kota dan pikiran yang sudah melayang ke agenda berikutnya, kamu mengambil uang tunai, memasukkannya ke dompet, dan langsung pergi. Tak lama kemudian, kamu menyadari masalahnya: **Kartu ATM-mu tertinggal di mesin.**

Skenario di atas adalah contoh klasik dari kegagalan desain yang tidak mengantisipasi kesalahan manusia. Dalam *Choice Architecture* (arsitektur pilihan), seorang *choice architect* (arsitek pilihan) tidak akan berasumsi bahwa pengguna akan selalu fokus dan rasional. Sebaliknya, mereka akan **berasumsi bahwa manusia pasti akan melakukan kesalahan** dan merancang sistem yang toleran terhadap kekeliruan tersebut.

## Mengapa Kita Melakukan Kesalahan?

Manusia bukanlah *Econs* (makhluk fiktif yang selalu logis dan teliti). Kita adalah *Humans* yang dipandu oleh *System 1* (Sistem 1) yang cepat, impulsif, dan sering kali kurang memperhatikan detail teknis.

Kesalahan sering terjadi karena adanya *Post-Completion Error*. Ini adalah kecenderungan otak kita untuk menganggap suatu tugas telah selesai setelah tujuan utama tercapai, sehingga kita melupakan langkah-langkah kecil setelahnya.

- **Tujuan Utama:** Mengambil uang.
- **Langkah Sisa:** Mengambil kartu. Begitu uang di tangan, otak kita memberikan sinyal "Selesai!", dan langkah mengambil kartu pun terabaikan.

> **Insight:** Desain yang baik membantu orang memilih dengan benar sekaligus menyediakan jaring pengaman saat mereka melakukan kesalahan.

## Strategi Desain "Expect Error"

Untuk menciptakan sistem yang tangguh, *choice architect* menggunakan beberapa teknik utama:

### 1. *Forcing Function*

*Forcing function* adalah elemen desain yang mengharuskan pengguna melakukan suatu tindakan tertentu sebelum mereka dapat melanjutkan ke tahap berikutnya. Ini adalah cara paling efektif untuk mencegah kesalahan fatal.

- **Contoh Klasik:** Di masa lalu, banyak orang meninggalkan kartu di ATM. Solusinya? Mesin ATM modern tidak akan mengeluarkan uangmu sebelum kamu mengambil kartu terlebih dahulu. Dengan menjadikan pengambilan kartu sebagai syarat mendapatkan uang, tingkat kehilangan kartu menurun drastis.
- **Analogi:** Seperti kunci mobil modern yang tidak bisa dikunci dari luar jika sensor mendeteksi kunci masih berada di dalam kabin.

### 2. Sinyal Peringatan (*Alert*) dan *Feedback*

Sistem harus memberikan tanda yang jelas jika sesuatu yang tidak diinginkan akan terjadi.

- **Peringatan Visual & Auditorial:** Sensor parkir mobil yang berbunyi semakin cepat saat mendekati objek adalah cara sistem "mengantisipasi" bahwa pengemudi mungkin tidak melihat jarak dengan akurat.

### 3. Kelenturan Format (*Input Flexibility*)

Alih-alih memaksa manusia mengikuti format kaku komputer, biarkan sistem yang menyesuaikan diri.

- **Contoh:** Saat mengisi nomor telepon, pengguna mungkin menulis `0812-3456`, `08123456`, atau `+628123456`. Desain yang antisipatif akan menerima semua format tersebut dan membersihkannya secara otomatis di sisi *backend*, daripada memberikan pesan kesalahan (*error message*) yang menjengkelkan.

## Penerapan dari Dunia Medis hingga Digital

### Dunia Medis

Di rumah sakit, kesalahan pemberian obat bisa berakibat fatal. Salah satu penerapan prinsip *Expect Error* adalah penggunaan konektor yang berbeda untuk saluran yang berbeda.

Misalnya, pipa oksigen memiliki bentuk konektor yang berbeda dengan pipa cairan infus. Hal ini secara fisik mencegah perawat secara tidak sengaja menghubungkan selang oksigen ke jalur intravena. Secara matematis, kemungkinan *error* $P(\text{error})$ ditekan mendekati nol melalui hambatan fisik.

### Dunia Digital dan *User Experience* (UX)

Pernahkah kamu menulis email yang menyebutkan "Saya lampirkan dokumen...", lalu menekan tombol kirim tanpa benar-benar melampirkan file?

**Nudge pada Gmail:** Sistem mendeteksi kata "lampirkan" atau "attachment" di badan email. Jika kamu menekan *send* tanpa file, muncul kotak dialog: *"Kamu menyebutkan lampiran tetapi tidak ada file yang dilampirkan. Kirim saja?"* Ini adalah penerapan *Choice Architecture* yang mengantisipasi kelalaian *System 1* manusia.

## *Anticipatory Validation* di Kolom Email

Di formulir daring, prinsip *Expect Error* bisa diwujudkan dengan validasi yang proaktif: isian diperiksa secara *real-time* saat pengguna masih mengetik, sehingga kesalahan pengiriman formulir dicegah sebelum terjadi. Contohnya pada kolom alamat email, dua mekanisme bekerja bersama:

| Mekanisme | Pemicu | Yang dilihat pengguna |
| --- | --- | --- |
| **Sinyal peringatan saat mengetik** | Isian sudah lebih dari 5 karakter, tetapi belum memuat tanda "@". | Pesan berwarna jingga: "Sepertinya kamu melupakan tanda '@' pada email-mu." Pesan ini hilang lagi begitu tanda "@" diketik. |
| ***Forcing function* pada tombol kirim** | Tombol kirim ditekan saat isian belum memuat tanda "@". | Formulir tidak terkirim, dan muncul peringatan "Mohon perbaiki kesalahan sebelum melanjutkan." |

## Menghitung Dampak Kesalahan

Dalam sistem industri, rumus keandalan (*reliability*) sering digunakan untuk memahami pentingnya desain antisipatif. Jika sebuah proses memiliki 5 langkah dan setiap langkah memiliki probabilitas keberhasilan $p = 0.95$ (5% kemungkinan salah), maka probabilitas keseluruhan sistem berhasil tanpa kesalahan adalah:

<div>
$$
P_{\text{success}} = p^n
$$
</div>

<div>
$$
P_{\text{success}} = 0.95^5 \approx 0.77
$$
</div>

Ini berarti ada **23% kemungkinan terjadi kesalahan** secara keseluruhan. Dengan menambahkan *forcing function* atau *nudge* yang meningkatkan $p$ menjadi $0.999$, kita dapat menghindarkan sistem dari kegagalan besar.

## Desain yang Pemaaf

Mengantisipasi kesalahan bukan berarti menganggap pengguna bodoh. Sebaliknya, ini adalah bentuk **empati dalam desain**. Dengan memahami keterbatasan kognitif manusia, kita dapat membangun lingkungan yang tidak hanya lebih aman, tetapi juga lebih nyaman digunakan.

> **Penting:** *Choice Architecture* yang baik haruslah pemaaf. Kesalahan adalah bagian dari sifat manusia; desain yang buruk adalah desain yang membiarkan kesalahan tersebut berakibat serius.
