## Re-exporting dengan pub use: Menciptakan Antarmuka yang Elegan

Bayangkan kamu sedang mengunjungi sebuah restoran mewah. Sebagai pelanggan, kamu tidak perlu tahu di mana letak gudang penyimpanan bumbu, bagaimana piring dicuci, atau di rak mana koki menyimpan pisau pemotong daging. Kamu hanya ingin melihat **menu** yang bersih dan memesan makanan.

Di Rust, **Re-exporting** adalah cara kita membuat "menu" tersebut untuk pengguna kode kita.

### Mengapa Kita Membutuhkan Re-exporting?

Saat kita membangun proyek yang besar, kita cenderung membagi kode ke dalam hierarki modul yang dalam demi kerapian organisasi internal. Namun, struktur yang rapi bagi pengembang (internal) seringkali menjadi mimpi buruk bagi pengguna (eksternal).

Tanpa re-exporting, pengguna mungkin harus menulis jalur yang sangat panjang seperti ini:

```rust
use my_library::core::internals::utils::converters::format_string;
```

Ini tidak efisien dan membocorkan detail implementasi internal kamu. Jika suatu saat kamu memindahkan `format_string` ke folder lain, semua pengguna kode kamu akan mengalami *breaking change*.

> **Wawasan Penting:** Struktur internal kode kamu (bagaimana kamu mengaturnya) tidak harus sama dengan struktur publik kode kamu (bagaimana orang lain menggunakannya).

### Analogi: Toko Ritel vs. Gudang

Pikirkan sebuah toko furnitur.

* **Bagian Internal (Gudang):** Di sini barang-barang disimpan berdasarkan susunan logistik (misalnya ukuran, berat, atau tanggal masuk). Jalurnya bisa sangat panjang seperti `Gudang -> Rak_B -> Baris_4 -> Kursi_Kayu`.
* **Bagian Publik (Showroom):** Pajangan di bagian depan toko yang langsung terlihat oleh pembeli. Contoh jalurnya sangat ringkas: `Showroom -> Kursi_Kayu`.

**Re-exporting** adalah tindakan mengambil barang dari rak terdalam di gudang dan meletakkannya tepat di depan pintu masuk toko (Showroom) sehingga pelanggan bisa langsung mengambilnya tanpa harus masuk ke lorong-lorong sempit di belakang.

### Cara Kerja pub use

Secara default, kata kunci `use` hanya membawa item ke dalam scope saat ini secara **privat**. Dengan menambahkan kata kunci `pub` di depannya, kamu melakukan dua hal sekaligus:

1. Memasukkan item ke dalam scope aktif saat ini.
2. Memberikan hak akses kepada siapa saja yang mengimpor modul ini agar bisa menggunakan item tersebut secara langsung.

#### Sintaks Dasar:

```rust
pub use self::modul_internal::ItemPenting;
```

### Contoh Kasus: Membangun Library Seni

Mari kita lihat contoh nyata. Misalkan kita membuat library bernama `seni`. Secara internal, kita membaginya menjadi dua modul: `macam` (untuk warna) dan `utilitas` (untuk fungsi bantuan).

**Struktur File:**

```
src/
 ├── lib.rs
 ├── macam.rs
 └── utilitas.rs
```

#### Isi src/macam.rs:

```rust
pub enum WarnaPrimer {
    Merah,
    Kuning,
    Biru,
}

pub enum WarnaSekunder {
    Oranye,
    Hijau,
    Ungu,
}
```

#### Isi src/utilitas.rs:

```rust
use crate::macam::WarnaPrimer;

pub fn campur(warna1: WarnaPrimer, warna2: WarnaPrimer) {
    // Logika mencampur warna...
    println!("Warna telah dicampur!");
}
```

#### Isi src/lib.rs (Tanpa Re-export):

Jika kita hanya menulis seperti ini:

```rust
pub mod macam;
pub mod utilitas;
```

Maka pengguna harus memanggilnya dengan cara yang panjang: `seni::macam::WarnaPrimer` dan `seni::utilitas::campur`.

#### Isi src/lib.rs (Dengan Re-export):

Sekarang kita gunakan `pub use` untuk menyederhanakan API:

```rust
pub mod macam;
pub mod utilitas;

// Re-export ke tingkat atas (root)
pub use self::macam::WarnaPrimer;
pub use self::macam::WarnaSekunder;
pub use self::utilitas::campur;
```

**Hasilnya bagi pengguna:** Kini pengguna library kamu bisa menulis kode yang jauh lebih bersih:

```rust
// Jauh lebih sederhana!
use seni::{WarnaPrimer, campur};

fn main() {
    let merah = WarnaPrimer::Merah;
    let kuning = WarnaPrimer::Kuning;
    campur(merah, kuning);
}
```

### Keuntungan Utama Re-exporting

1. **Menyembunyikan kerumitan struktur internal.** Kamu bebas mengubah struktur folder internal tanpa merusak kode pengguna selama jalur `pub use` di `lib.rs` tidak berubah.
2. **Dokumentasi yang lebih bersih dan ramah.** Saat menjalankan `cargo doc`, semua item yang di-re-export akan langsung muncul di halaman utama, sehingga pengguna tidak perlu mencari-cari ke dalam submodul yang dalam.
3. **Kemudahan pengelompokan secara logis.** Berbagai fungsi yang tersebar di banyak file dapat disatukan ke dalam sebuah "modul fasad" tunggal yang rapi.

### Kapan Harus Menggunakan Re-exporting?

Tanyakan pada diri sendiri: apakah pengguna library kamu perlu tahu bahwa suatu fungsi sebenarnya berada di dalam folder `utils/internal/helpers/`?

Jika jawabannya tidak, maka fungsi tersebut sangat layak untuk di-re-export ke tingkat yang lebih tinggi.

#### Praktik Terbaik:

* **Pada Level Root:** Tarik tipe data serta fungsi yang paling sering dipakai ke tingkat atas (`lib.rs`).
* **Membuat Modul Fasad:** Ketika proyekmu punya banyak submodul berukuran kecil, satukan semuanya ke dalam satu modul publik yang rapi demi kenyamanan pengguna.

### Real-world Application: Library API

Dalam pengembangan web API menggunakan Rust (misalnya dengan `Axum` atau `Actix`), kamu mungkin memiliki struktur seperti ini:

```rust
// Di src/handlers/mod.rs
mod user_handlers;
mod product_handlers;
mod order_handlers;

// Re-export agar pengguna tidak perlu tahu file spesifiknya
pub use user_handlers::*;
pub use product_handlers::*;
pub use order_handlers::*;
```

Dengan cara ini, di `main.rs`, kamu cukup melakukan satu kali import:

```rust
use crate::handlers::{get_user, create_product, place_order};
```

### API yang Menyenangkan untuk Digunakan

Menggunakan `pub use` memberikan kebebasan bagi kamu sebagai penulis library. Kode internal bisa disusun serumit atau serinci mungkin demi kerapian teknis, sementara pengguna luar tetap disuguhi antarmuka yang bersih dan minimalis. 

Bagaimanapun juga, kode yang baik tidak hanya dinilai dari cara ia berjalan tanpa error, tetapi juga dari seberapa mudah kode tersebut dipahami dan digunakan oleh orang lain.
