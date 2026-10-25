# Sistem Modul Rust

`books/sistem-modul-rust`: 56 temuan.


## `books/sistem-modul-rust/src/content/01_pengenalan-sistem-modul-rust.md`

- **Fakta meragukan**: “Dalam satu package, kamu bisa menyimpan satu atau lebih crate, dengan syarat minimal terdapat satu crate (baik berupa library maupun binary).”
  - Usulan: “Dalam satu package, kamu bisa menyimpan satu atau lebih crate, dengan syarat minimal terdapat satu crate. Package boleh berisi banyak binary crate, tetapi paling banyak hanya satu library crate.”
  - Catatan: Aturan Cargo membatasi satu package hanya boleh memiliki maksimal satu library crate. Batasan ini penting dan tidak disebutkan.
- **Istilah tidak konsisten**: “**Crate** adalah blok bangunan utama di dalam kota tersebut”
  - Usulan: “**Crate** adalah gedung di dalam kota tersebut”
  - Catatan: Analogi crate tidak konsisten: di sini disebut "blok bangunan", tetapi di bagian Module disebut "gedung" dan di tabel disebut "Gedung utama".
- **Istilah tidak konsisten**: “fungsi `tambah()` pada modul kalkulator”
  - Usulan: “fungsi `tambah()` pada module kalkulator”
  - Catatan: Bab ini memakai istilah "module", tetapi di beberapa tempat tercampur dengan "modul" (juga pada "oleh modul lain" dan judul "Sistem Modul"). Sebaiknya diseragamkan.
- **Istilah tidak konsisten**: “agar terhindar dari modifikasi yang tidak disengaja oleh modul lain”
  - Usulan: “agar terhindar dari modifikasi yang tidak disengaja oleh module lain”
  - Catatan: Istilah module/modul tidak konsisten di dalam bab.
- **Kalimat rancu**: “| **Path** | Rute navigasi (path) | Cara memanggil suatu item (contoh: `crate::math::add`) |”
  - Catatan: Konsep Path muncul di tabel ringkasan, padahal belum pernah dibahas di dalam bab. Contoh `crate::math::add` juga tidak berkaitan dengan contoh kode yang ada. Selain itu, kolom analogi mengulang kata "path" sehingga tidak menjelaskan apa pun.
- **Tata bahasa**: “Pembahasan berikutnya akan membahas aspek teknis”
  - Usulan: “Bab berikutnya akan membahas aspek teknis”
  - Catatan: Kalimat pleonastis karena kata "pembahasan" dan "membahas" dipakai berdampingan.

## `books/sistem-modul-rust/src/content/02_deklarasi-modul-dengan-kata-kunci-mod.md`

- **Tata bahasa**: “Modul berfungsi mirip seperti bab dan sub-bab pada buku”
  - Usulan: “Modul berfungsi seperti bab dan sub-bab pada buku”
  - Catatan: "Mirip seperti" bersifat pleonastis; cukup gunakan salah satu kata.
- **Fakta meragukan**: “Modul dapat berisi hampir semua tipe data Rust untuk menjaga kerapian struktur proyek.”
  - Usulan: “Modul dapat berisi berbagai item Rust (fungsi, struct, enum, trait, dan lainnya) untuk menjaga kerapian struktur proyek.”
  - Catatan: Modul berisi item, bukan "tipe data". Fungsi, misalnya, bukan tipe data. Istilah ini juga tidak konsisten dengan penjelasan sebelumnya yang memakai kata "item".
- **Istilah tidak konsisten**: “## Mengelompokkan Berbagai Tipe Data”
  - Usulan: “## Mengelompokkan Berbagai Item”
  - Catatan: Judul subbab sebaiknya memakai istilah "item" agar konsisten dan tepat.
- **Istilah tidak konsisten**: “Secara default, semua elemen di dalam modul bersifat privat.”
  - Usulan: “Secara default, semua item di dalam modul bersifat privat.”
  - Catatan: Bab ini bergantian memakai "item" dan "elemen" untuk konsep yang sama; pilih satu istilah.
- **Kalimat rancu**: “tanpa izin akses khusus”
  - Usulan: “tanpa ditandai dengan kata kunci `pub`”
  - Catatan: Frasa "izin akses khusus" kabur; sebaiknya sebut mekanismenya secara langsung.
- **Fakta meragukan**: “contohnya `depan_restoran::pelayanan::ambil_pesanan()` jika fungsi tersebut bersifat publik”
  - Usulan: “contohnya `depan_restoran::pelayanan::ambil_pesanan()` jika modul `pelayanan` dan fungsi tersebut bersifat publik”
  - Catatan: Agar dapat dipanggil dari luar, sub-modul `pelayanan` juga harus ditandai `pub`, tidak cukup fungsinya saja.
- **Istilah tidak konsisten**: “Berkas di dalamnya berfungsi sebagai elemen kode”
  - Usulan: “File di dalamnya berfungsi sebagai elemen kode”
  - Catatan: Bab ini mencampur istilah "file" dan "berkas" untuk konsep yang sama; pilih salah satu secara konsisten.
- **Fakta meragukan**: “Pengujian unit di Rust umumnya diletakkan di dalam modul yang sama dengan kode utama menggunakan deklarasi `mod tests`.”
  - Usulan: “Pengujian unit di Rust umumnya diletakkan di file yang sama dengan kode utama, di dalam sub-modul `mod tests` yang diberi atribut `#[cfg(test)]`.”
  - Catatan: `mod tests` adalah sub-modul tersendiri, bukan modul yang sama dengan kode utama.

## `books/sistem-modul-rust/src/content/03_kontrol-akses-dan-visibilitas-dengan-pub.md`

- **Fakta meragukan**: “| **Modul** | Privat | Terlihat oleh modul induk |”
  - Usulan: “| **Modul** | Privat | Bisa diakses dari luar modul induknya (selama modul induk itu sendiri dapat diakses) |”
  - Catatan: Modul privat sudah terlihat oleh modul induknya. `pub` justru membuat modul dapat diakses dari luar induknya, jadi keterangan ini keliru.
- **Salah ketik**: “ratusan fungsi untuk manipulasi pixel”
  - Usulan: “ratusan fungsi untuk manipulasi piksel”
  - Catatan: Bentuk baku menurut KBBI adalah "piksel".

## `books/sistem-modul-rust/src/content/04_memisahkan-modul-ke-dalam-file-terpisah.md`

- **Tata bahasa**: “Aturan Visibilitas Antar File”
  - Usulan: “Aturan Visibilitas Antarfile”
  - Catatan: Menurut PUEBI, bentuk terikat "antar" ditulis serangkai dengan kata yang mengikutinya.
- **Kalimat rancu**: “| `mod nama_mod { ... }` | `mod nama_mod;` | Deklarasi di file induk menggunakan `;` |”
  - Usulan: “| `mod nama_mod { ... }` | `mod nama_mod;` (tetap di `main.rs`) | Deklarasi di file induk menggunakan `;` |”
  - Catatan: Judul kolom "Lokasi Baru (`file.rs`)" menyiratkan `mod nama_mod;` ditulis di file baru, padahal deklarasi ini tetap berada di file induk. Ini bertentangan dengan penjelasan di langkah 1.
- **Fakta meragukan**: “IDE seperti VS Code dapat memproses struktur yang terfragmentasi dengan baik, membuat navigasi kode terasa lebih responsif.”
  - Usulan: “Struktur file yang terpisah memudahkan kamu berpindah antarbagian kode melalui penjelajah file dan fitur pencarian di IDE seperti VS Code.”
  - Catatan: Klaim bahwa pemisahan file membuat IDE lebih responsif meragukan. rust-analyzer tetap menganalisis seluruh crate; manfaat utamanya ada pada keterbacaan dan kemudahan navigasi bagi manusia.

## `books/sistem-modul-rust/src/content/05_mengelola-kompleksitas-hierarki-modul-dengan-folder.md`

- **Istilah tidak konsisten**: “src/
├── engine/
│   ├── graphics/”
  - Usulan: “src/
├── engine.rs
├── engine/
│   ├── graphics.rs
│   ├── graphics/”
  - Catatan: Contoh ini bertentangan dengan pola File-dan-Folder yang baru dijelaskan. Tidak ada `engine.rs`, `graphics.rs`, `physics.rs`, `input.rs` (atau `mod.rs`), padahal file-file itu diperlukan untuk mendeklarasikan submodul. Tanpanya, struktur ini tidak akan dikenali kompilator.
- **Fakta meragukan**: “Sistem modul Rust mencerminkan struktur pohon ini secara identik.”
  - Usulan: “Sistem modul Rust umumnya mencerminkan struktur pohon ini.”
  - Catatan: Klaim berlebihan. Modul bisa didefinisikan inline (`mod x { ... }`) atau diarahkan dengan atribut `#[path]`, sehingga pohon modul tidak selalu identik dengan struktur folder.
- **Istilah tidak konsisten**: “#### 2. Menghubungkan Anak di Parent Modul (src/media.rs)”
  - Usulan: “#### 2. Menghubungkan Anak di Modul Induk (src/media.rs)”
  - Catatan: Bagian lain bab memakai istilah "induk" (file induk). "Parent Modul" juga mencampur istilah Inggris dengan susunan yang tidak sesuai kaidah bahasa Indonesia.
- **Tata bahasa**: “### Hierarki yang Lebih Dalam (Cucu Modul)”
  - Usulan: “### Hierarki yang Lebih Dalam (Modul Cucu)”
  - Catatan: Dalam bahasa Indonesia, kata yang diterangkan ditempatkan di depan (hukum D-M), sehingga yang tepat "modul cucu".

## `books/sistem-modul-rust/src/content/06_memahami-pohon-modul-module-tree.md`

- **Fakta meragukan**: “Di Rust, Absolute Path selalu dimulai dengan kata kunci `crate`.”
  - Usulan: “Di Rust, Absolute Path untuk item di crate saat ini dimulai dengan kata kunci `crate`; untuk item dari crate eksternal, path dimulai dengan nama crate tersebut.”
  - Catatan: Absolute path ke crate eksternal dimulai dengan nama crate, bukan `crate`.
- **Fakta meragukan**: “Path di atas dimulai dari `crate`, yang merupakan entry point dari program kamu.”
  - Usulan: “Path di atas dimulai dari `crate`, yang merujuk ke crate root (akar module tree).”
  - Catatan: `crate` merujuk ke crate root, bukan entry point. Entry point program adalah fungsi `main`, dan library crate tidak memiliki entry point.
- **Tata bahasa**: “Relative Path memulai pencarian dari module di mana kode tersebut ditulis.”
  - Usulan: “Relative Path memulai pencarian dari module tempat kode tersebut ditulis.”
  - Catatan: "di mana" sebagai kata penghubung relatif tidak baku.
- **Fakta meragukan**: “Jika kamu memanggil function yang berada di module yang sama atau submodulenya, kamu bisa langsung menyebut namanya.”
  - Usulan: “Jika kamu memanggil function yang berada di module yang sama, kamu bisa langsung menyebut namanya; untuk submodule, awali dengan nama submodule-nya (misalnya `sub::fungsi()`).”
  - Catatan: Function di submodule tidak bisa dipanggil hanya dengan namanya, tetapi harus melalui nama submodule-nya.
- **Kalimat rancu**: “Ini membantu mengurangi pengulangan jika kamu memindahkan seluruh submodule ke parent module yang berbeda.”
  - Usulan: “Ini memudahkan jika kamu memindahkan module beserta parent-nya ke lokasi lain, karena path `super` tetap valid.”
  - Catatan: Manfaat `super` bukan mengurangi pengulangan. Path `super` tetap valid bila hubungan parent–child ikut dipindah, tetapi akan rusak bila submodule dipindah ke parent yang berbeda.
- **Fakta meragukan**: “Gunakan `crate` jika kamu ingin path yang **kokoh** dan tidak berubah meski file dipindah.”
  - Usulan: “Gunakan `crate` jika kamu ingin path yang **kokoh** dan tetap valid meski kode pemanggilnya dipindah.”
  - Catatan: Absolute path tetap valid jika kode pemanggil dipindah, tetapi rusak jika item tujuannya dipindah. Frasa "file dipindah" menyesatkan.

## `books/sistem-modul-rust/src/content/07_penyederhanaan-scope-dengan-kata-kunci-use.md`

- **Fakta meragukan**: “Menambahkan `use` di bagian atas file akan berlaku untuk seluruh isi file tersebut dalam scope modul tersebut.”
  - Usulan: “Menambahkan `use` di bagian atas file hanya berlaku untuk scope modul tempat ia ditulis; modul anak yang didefinisikan di dalam file yang sama (misalnya blok `mod`) tidak otomatis ikut melihatnya.”
  - Catatan: Klaim "berlaku untuk seluruh isi file" menyesatkan. Blok `mod` di dalam file yang sama memiliki scope sendiri dan tidak mewarisi `use` dari luar. Kalimat ini juga bertentangan dengan kalimat berikutnya.
- **Kalimat rancu**: “Sebagai contoh, ada dua tipe `Result`.”
  - Usulan: “Sebagai contoh, pustaka standar memiliki dua tipe `Result`, yaitu `std::fmt::Result` dan `std::io::Result`.”
  - Catatan: Tidak disebutkan tipe `Result` mana yang dimaksud sebelum contoh kode muncul.
- **Kalimat rancu**: “Sebagai contoh, disarankan untuk menggunakan `use crate::front_of_house::hosting;` lalu memanggil `hosting::add_to_waitlist();`, daripada mengimpor fungsinya secara langsung dengan `use crate::front_of_house::hosting::add_to_waitlist;` kemudian memanggil `add_to_waitlist();`.”
  - Usulan: “Sebagai contoh, gunakan `use crate::front_of_house::hosting;` lalu panggil `hosting::add_to_waitlist();`. Cara ini lebih disarankan daripada `use crate::front_of_house::hosting::add_to_waitlist;` yang diikuti pemanggilan `add_to_waitlist();`.”
  - Catatan: Kalimat terlalu panjang dan memuat empat potongan kode sehingga sulit diikuti.
- **Istilah tidak konsisten**: “use std::io::Result as IoResult; // Memberikan nama panggilan baru”
  - Usulan: “use std::io::Result as IoResult; // Memberikan alias baru”
  - Catatan: Teks sebelumnya menyebut "alias (nama samaran)", sedangkan komentar kode memakai "nama panggilan". Sebaiknya istilahnya diseragamkan.
- **Fakta meragukan**: “Kecamatan Tebet, Jalan Gajah Mada Nomor 123”
  - Usulan: “Kecamatan Tebet, Jalan Tebet Raya Nomor 123”
  - Catatan: Jalan Gajah Mada berada di Jakarta Pusat/Barat, bukan di Kecamatan Tebet, Jakarta Selatan.

## `books/sistem-modul-rust/src/content/08_navigasi-hierarki-dengan-super-dan-self.md`

- **Fakta meragukan**: “mana yang lebih mudah dikelola jika suatu saat nama crate-mu berubah: absolute path atau relative path?”
  - Usulan: “mana yang lebih mudah dikelola jika suatu saat modul tersebut dipindahkan ke lokasi lain dalam hierarki: absolute path atau relative path?”
  - Catatan: Absolute path diawali keyword `crate`, bukan nama crate. Mengganti nama crate tidak merusak absolute path, jadi premis pertanyaan ini keliru.
- **Fakta meragukan**: “Misalnya, `super::self` (meskipun jarang digunakan karena redundant dengan `super`) atau”
  - Usulan: “Misalnya, masuk kembali ke submodule lain dari parent module:”
  - Catatan: Di Rust, `self` hanya boleh berada di awal path (kecuali dalam daftar `use`, misalnya `use super::{self}`). Path `super::self` menghasilkan error kompilasi, bukan sekadar redundan.
- **Fakta meragukan**: “Tanpa `super`, modul `tests` tidak akan bisa mengakses fungsi yang ingin diuji karena fungsi tersebut berada di luar scope modul `tests`.”
  - Usulan: “Tanpa `super` (atau absolute path), modul `tests` tidak bisa langsung memanggil fungsi yang ingin diuji karena fungsi tersebut berada di luar scope modul `tests`.”
  - Catatan: Fungsi tetap bisa diakses lewat absolute path seperti `crate::tambah`, jadi klaim "tidak akan bisa" berlebihan.

## `books/sistem-modul-rust/src/content/09_re-exporting-dengan-pub-use-menciptakan-antarmuka-yang-elegan.md`

- **Tata bahasa**: “seringkali menyulitkan pengguna (eksternal)”
  - Usulan: “sering kali menyulitkan pengguna (eksternal)”
  - Catatan: Menurut KBBI, bentuk bakunya ditulis terpisah: "sering kali".
- **Fakta meragukan**: “Kamu bebas mengubah struktur folder internal tanpa merusak kode pengguna selama jalur `pub use` di `lib.rs` tidak berubah.”
  - Usulan: “Kamu bebas mengubah struktur folder internal tanpa merusak kode pengguna selama jalur `pub use` di `lib.rs` tidak berubah, asalkan modul internalnya tidak ikut dipublikasikan (misalnya ditulis `mod macam;` alih-alih `pub mod macam;`).”
  - Catatan: Pada contoh, `macam` dan `utilitas` dideklarasikan `pub mod`. Jalur panjang seperti `seni::macam::WarnaPrimer` tetap bisa dipakai pengguna, sehingga memindahkan modul tetap dapat merusak kode mereka. Klaim ini perlu syarat tambahan.

## `books/sistem-modul-rust/src/content/10_perbandingan-struktur-mod-rs-vs-pola-modern.md`

- **Tata bahasa**: “Sedikit lebih sulit navigasi file”
  - Usulan: “Navigasi file sedikit lebih sulit”
  - Catatan: Susunan kalimatnya rancu. Subjek "navigasi file" sebaiknya diletakkan di depan.
- **Kalimat rancu**: “Beberapa library pembuat kode generator lebih mudah”
  - Usulan: “Beberapa library generator kode lebih mudah”
  - Catatan: "Pembuat kode generator" berlebihan dan membingungkan karena "pembuat kode" dan "generator kode" bermakna sama.
- **Salah ketik**: “Lebih "terkapsul" di dalam satu folder”
  - Usulan: “Lebih "terenkapsulasi" di dalam satu folder”
  - Catatan: Bentuk "terkapsul" tidak baku. Bentuk yang sesuai dengan kata dasar "enkapsulasi" adalah "terenkapsulasi".
- **Fakta meragukan**: “Edisi Rust 2018 menghadirkan cara yang lebih rapi.”
  - Usulan: “Rust 1.30 (dirilis bersamaan dengan persiapan edisi 2018) menghadirkan cara yang lebih rapi.”
  - Catatan: Pola tanpa mod.rs distabilkan di Rust 1.30 dan berlaku di semua edisi, termasuk 2015. Pola ini bukan fitur eksklusif edisi 2018.

## `books/sistem-modul-rust/src/content/11_filosofi-organisasi-analogi-perpustakaan-kota.md`

- **Salah ketik**: “tanpa perlu masuk mengacak-ngacak gudang penyimpanan”
  - Usulan: “tanpa perlu masuk mengacak-acak gudang penyimpanan”
  - Catatan: Bentuk baku menurut KBBI adalah "mengacak-acak".
- **Istilah tidak konsisten**: “`main.rs` menangani eksekusi utama, sedangkan `lib.rs` memuat logika bisnis.”
  - Usulan: “`main.rs` menangani eksekusi utama, sedangkan `lib.rs` mengoordinasikan modul dan API publik; logika bisnis ditempatkan di modul-modul domain.”
  - Catatan: Bertentangan dengan bagian 1, yang menyebut lib.rs hanya berisi deklarasi modul dan re-export tanpa logika detail.
- **Istilah tidak konsisten**: “│   ├── lib.rs            # Eksposisi API internal”
  - Usulan: “│   ├── lib.rs            # Deklarasi modul dan API publik”
  - Catatan: lib.rs berfungsi mengekspos API publik, bukan internal. Ini juga tidak konsisten dengan komentar pada contoh struktur sebelumnya.
- **Fakta meragukan**: “Dengan begitu, pengguna luar cukup memanggilnya seperti ini:

```rust
use crate::shipping::DHLProvider;
```”
  - Usulan: “Dengan begitu, pengguna luar cukup memanggilnya seperti ini:

```rust
use nama_crate::shipping::DHLProvider;
```”
  - Catatan: Pengguna luar library tidak memakai `crate::`. Kata kunci `crate::` hanya merujuk ke crate tempat kode itu sendiri berada, jadi pengguna luar harus memakai nama crate library.
- **Fakta meragukan**: “Folder ini akan diperlakukan sebagai crate terpisah oleh Cargo”
  - Usulan: “Setiap file di folder ini akan dikompilasi sebagai crate terpisah oleh Cargo”
  - Catatan: Cargo memperlakukan tiap file .rs di tests/ sebagai crate terpisah, bukan folder secara keseluruhan.
- **Istilah tidak konsisten**: “di dalam project kamu sendiri”
  - Usulan: “di dalam proyek kamu sendiri”
  - Catatan: Bagian lain bab ini memakai istilah "proyek".

## `books/sistem-modul-rust/src/content/12_filosofi-organisasi-kode-di-rust.md`

- **Fakta meragukan**: “Rust melarang Modul A mengimpor Modul B jika Modul B juga mengimpor Modul A secara langsung. Larangan ini mendeteksi *code smell* yang menandakan desain kurang optimal.”
  - Usulan: “Di dalam satu crate, Rust mengizinkan Modul A dan Modul B saling mengimpor lewat `use`. Yang dilarang adalah ketergantungan melingkar antar-crate. Meski diizinkan di level modul, ketergantungan melingkar sering menjadi *code smell* yang menandakan desain kurang optimal.”
  - Catatan: Kompiler Rust tidak melarang impor melingkar antarmodul dalam satu crate. Larangan hanya berlaku untuk dependensi antar-crate di Cargo.
- **Istilah tidak konsisten**: “// Mereka cukup menggunakan PaymentProvider”
  - Usulan: “// Mereka cukup menggunakan trait Payment”
  - Catatan: Kode tidak mendefinisikan `PaymentProvider`. Trait yang ada bernama `Payment`, sedangkan struct yang diekspos bernama `PayPalProvider` dan `CardProvider`.
- **Istilah tidak konsisten**: “Ketiga, ekspos hanya satu interface (*trait*) ke publik untuk digunakan modul lain.”
  - Usulan: “Ketiga, ekspos sebuah interface (*trait*) bersama beserta tipe penyedia yang diperlukan ke publik untuk digunakan modul lain.”
  - Catatan: Contoh kode justru mengekspos dua struct (`PayPalProvider`, `CardProvider`) selain trait `Payment`, sehingga tidak sesuai dengan klaim "hanya satu interface".
- **Istilah tidak konsisten**: “pembuatan sistem pembayaran dengan metode `CreditCard`, `PayPal`, dan `Stripe`.”
  - Usulan: “pembuatan sistem pembayaran dengan metode `CreditCard` dan `PayPal`.”
  - Catatan: Contoh kode hanya memuat modul `credit_card` dan `paypal`. Stripe disebut, tetapi tidak muncul di kode.
- **Istilah tidak konsisten**: “└── utils/           # Helper fungsi yang umum
    └── hash.rs”
  - Usulan: “└── utils/           # Fungsi helper umum
    ├── mod.rs
    └── hash.rs”
  - Catatan: Folder lain memiliki `mod.rs`, sedangkan `utils/` tidak. Tanpa `mod.rs` atau `utils.rs`, modul `utils` tidak dapat dideklarasikan.
- **Kalimat rancu**: “Struktur folder internal kamu mungkin dalam karena mengikuti logika pengembangan”
  - Usulan: “Struktur folder internal kamu mungkin bertingkat-tingkat (bersarang dalam) karena mengikuti logika pengembangan”
  - Catatan: Kata "dalam" berdiri sendiri sehingga ambigu; maksudnya struktur bersarang yang dalam.

## `books/sistem-modul-rust/src/content/13_referensi.md`

- **Fakta meragukan**: “<https://doi.org/10.1145/3419997>”
  - Usulan: “<https://doi.org/10.1145/3418295>”
  - Catatan: DOI artikel Jung dkk. (2021) "Safe systems programming in Rust" di Communications of the ACM 64(4) setahu saya adalah 10.1145/3418295. Mohon dicek ulang ke sumber aslinya.
