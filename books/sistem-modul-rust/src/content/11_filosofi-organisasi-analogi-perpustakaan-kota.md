Ketika proyek Rust berkembang dari sekadar "Hello World" menjadi aplikasi berskala produksi, tantangan terbesarnya bukan lagi memahami sintaksis, melainkan merancang **organisasi** kode. Tanpa struktur yang terencana, direktori `src` akan cepat berubah menjadi belantara kode yang membingungkan.

Para praktisi Rust (Rustaceans) menggunakan pola standar dan praktik terbaik tertentu untuk menjaga basis kode tetap bersih, modular, dan mudah dipelihara.

## Filosofi Organisasi: Analogi Perpustakaan Kota

Bayangkan kamu sedang mengelola sebuah perpustakaan.

Pada proyek berskala kecil, kamu mungkin hanya membutuhkan satu rak buku. Semua buku ditumpuk di rak tersebut dan tetap mudah dicari (seperti menulis seluruh kode di `main.rs`).

Ketika koleksi buku bertambah banyak, kamu mulai mengelompokkannya ke dalam beberapa rak berdasarkan kategori fiksi, sejarah, atau sains. Ini setara dengan memisahkan kode ke beberapa file `.rs` yang berbeda.

Pada skala profesional, kamu membutuhkan ruangan-ruangan terpisah, label petunjuk di setiap lorong, dan meja informasi di depan. Pengunjung bisa mencari informasi melalui pustakawan di meja depan tanpa perlu masuk mengacak-ngacak gudang penyimpanan. Struktur inilah yang ingin kita bangun dalam organisasi kode Rust.

## 1. Menjaga main.rs dan lib.rs Tetap Ramping

Menulis logika bisnis langsung di dalam `main.rs` adalah kekeliruan umum. Biasakan memperlakukan `main.rs` murni sebagai pintu masuk (entry point) aplikasi, sedangkan `lib.rs` berfungsi sebagai pusat koordinasi.

* **`main.rs`**: Berisi kode untuk parsing argumen command-line interface (CLI), memuat konfigurasi awal, dan memanggil fungsi utama dari library.
* **`lib.rs`**: Hanya berisi deklarasi modul (`mod`) dan re-export (`pub use`) yang diperlukan, tanpa logika detail di dalamnya.

### Contoh Struktur File

```
src/
├── main.rs        # Pintu masuk: urusan input/output luar
├── lib.rs         # Deklarasi modul dan API publik
├── auth/          # Logika autentikasi
│   ├── mod.rs     # atau auth.rs di level src/
│   └── crypto.rs
└── database/      # Logika database
    └── connection.rs
```

## 2. Pengelompokan Berdasarkan Domain (Bukan Tipe)

Jika kamu terbiasa dengan bahasa pemrograman lain, kamu mungkin sering mengelompokkan file berdasarkan tipenya (seperti meletakkan semua model di folder `models` dan semua controller di folder `controllers`). Di Rust, pendekatan yang lebih disarankan adalah mengelompokkan kode berdasarkan **Domain Bisnis** or **Fitur**.

> [!IMPORTANT]
> Pola ini mempermudah navigasi kode. Saat ingin memperbarui fitur pembayaran, misalnya, seluruh logika terkait (akses database, validasi, API) bisa kamu temukan langsung di dalam satu folder modul `payment/`.

### Struktur Domain-Driven

```
src/
├── orders/        # Semua tentang pesanan
│   ├── models.rs
│   ├── logic.rs
│   └── tests.rs
├── users/         # Semua tentang pengguna
│   ├── profile.rs
│   └── permissions.rs
└── api/           # Entry point untuk transport layer (HTTP/gRPC)
    ├── handlers.rs
    └── routes.rs
```

## 3. Strategi Privacy by Default

Rust menerapkan pembatasan akses yang ketat secara default. Manfaatkan fitur ini untuk merancang arsitektur yang aman:

* Hindari penggunaan kata kunci `pub` kecuali fungsi atau struct tersebut memang dirancang untuk diekspos ke luar modul.
* Gunakan `pub(crate)` jika kamu ingin suatu komponen bisa diakses bebas di dalam project kamu sendiri, tetapi tetap tersembunyi dari pengguna luar yang mengimpor library milikmu.

```rust
pub struct PublicUser;      // Terlihat oleh semua orang (publik)
pub(crate) struct Internal; // Hanya terlihat di seluruh crate ini
struct Private;             // Hanya terlihat di dalam modul ini saja
```

## 4. Teknik Re-exporting untuk API yang Clean

Sebagai arsitek kode, kamu mungkin membuat struktur folder yang cukup dalam, misalnya `src/shipping/international/dhl/provider.rs`. Namun, kamu tentu tidak ingin pengguna library menulis jalur impor yang sangat panjang:

`use crate::shipping::international::dhl::provider::DHLProvider;`

Kamu bisa memanfaatkan teknik **re-exporting** pada `lib.rs` atau modul induk untuk memotong jalur akses tersebut.

```rust
// Di src/shipping/mod.rs
mod international;
pub use self::international::dhl::provider::DHLProvider;
```

Dengan begitu, pengguna luar cukup memanggilnya seperti ini:

```rust
use crate::shipping::DHLProvider;
```

## 5. Menangani Unit Test dan Uji Integrasi

Rust memisahkan pengujian menjadi dua kategori utama agar kode tetap rapi dan terorganisasi:

1. **Unit Tests**: Letakkan langsung di file yang sama dengan kode yang diuji. Tulis di bagian paling bawah di dalam modul `mod tests` dengan penanda atribut `#[cfg(test)]`. Hal ini dilakukan karena unit test di Rust diizinkan mengakses fungsi internal yang bersifat privat, sehingga kamu bisa menguji logika internal dengan mudah tanpa harus mengeksposnya secara publik.
2. **Integration Tests**: Tempatkan di folder khusus bernama `tests/` pada root proyek (sejajar dengan folder `src`). Folder ini akan diperlakukan sebagai crate terpisah oleh Cargo, sehingga hanya bisa menguji API publik dari library milikmu.

## Contoh Implementasi: Struktur Proyek E-Commerce

Penerapan seluruh teknik organisasi ini bisa kita lihat pada struktur backend e-commerce berikut.

### Struktur Folder

```
ecommerce_project/
├── Cargo.toml
├── src/
│   ├── main.rs           # Menjalankan server
│   ├── lib.rs            # Eksposisi API internal
│   ├── core/             # Logika inti (Math, Tax, Currency)
│   │   ├── mod.rs
│   │   └── calculator.rs
│   ├── products/         # Domain Produk
│   │   ├── mod.rs
│   │   ├── store.rs
│   │   └── validation.rs
│   └── utils.rs          # Helper umum
├── tests/                # Integration tests
│   └── checkout_flow.rs
```

### Implementasi lib.rs

```rust
// Deklarasikan modul
pub mod core;
pub mod products;
pub mod utils;

// Re-export untuk mempermudah akses (Clean API)
pub use crate::core::calculator::TaxCalculator;
pub use crate::products::store::ProductStore;
```

## Ringkasan Praktik Terbaik

| Prinsip | Deskripsi |
| --- | --- |
| **Separation of Concerns** | `main.rs` menangani eksekusi utama, sedangkan `lib.rs` memuat logika bisnis. |
| **Encapsulation** | Jaga visibilitas seketat mungkin, batasi penggunaan modifier `pub`. |
| **Flat API** | Manfaatkan `pub use` agar pengguna tidak perlu menelusuri struktur folder yang dalam. |
| **Modular Testing** | Terapkan atribut `#[cfg(test)]` agar kode pengujian tidak membebani ukuran biner produksi. |
| **Modern Pattern** | Pilih salah satu antara pola lama `folder/mod.rs` atau pola baru `folder.rs` bersama folder pendamping, lalu terapkan secara konsisten. |

> "Sistem modul bukan sekadar cara membagi file, melainkan bagaimana kamu memetakan alur pemikiran ke dalam struktur fisik kode."

Menerapkan pola organisasi sejak awal akan membuat proyek Rust kamu tetap nyaman dikelola, bahkan ketika baris kodenya sudah berkembang hingga puluhan ribu baris.
