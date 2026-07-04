## Filosofi Organisasi Kode di Rust

Memahami kata kunci `mod`, `pub`, dan `use` barulah langkah awal. Tantangan sesungguhnya adalah menyusun arsitektur kode agar tetap ramping, mudah dinavigasi, dan siap dikembangkan dalam skala besar.

Bayangkan kamu sedang membangun sebuah perpustakaan raksasa. Jika kamu hanya menumpuk buku di lantai (satu file `main.rs` yang besar), pengunjung akan kesulitan mencari informasi. Sebaliknya, jika kamu membagi rak terlalu banyak hingga setiap rak hanya berisi satu lembar kertas (over-modularization), pengunjung akan lelah berpindah-pindah rak.

> **Insight:** Struktur modul yang baik adalah tentang menemukan keseimbangan antara keterkaitan erat (*cohesion*) dan ketergantungan minimal (*coupling*). Kelompokkan komponen yang sering berubah bersamaan, dan pisahkan bagian yang dapat berdiri sendiri.

## 1. Strategi "The Facade Pattern" (Pola Fasad)

Salah satu praktik terbaik yang sering digunakan dalam library Rust populer seperti `serde` atau `tokio` adalah menyembunyikan kompleksitas internal dan menyajikan antarmuka (API) yang bersih kepada pengguna.

### Masalah
Struktur folder internal kamu mungkin sangat dalam karena mengikuti logika pengembangan: `src/auth/providers/oauth2/google.rs`

### Solusi
Gunakan re-exporting untuk memotong jalur bagi pengguna luar.

```rust
// Di src/auth/mod.rs
mod providers;

// Alih-alih pengguna memanggil: auth::providers::oauth2::google::GoogleClient
// Mereka cukup memanggil: auth::GoogleClient
pub use self::providers::oauth2::google::GoogleClient;
```

Dalam skenario nyata, teknik ini memungkinkan kamu merestrukturisasi folder internal tanpa merusak kode orang lain yang menggunakan library kamu. Kamu bebas memindahkan file selama `pub use` tetap mengarah ke jalur yang benar.

## 2. Struktur Folder Standar untuk Aplikasi Produksi

Untuk aplikasi berskala menengah hingga besar, komunitas Rust cenderung mengikuti pola yang memisahkan tanggung jawab berdasarkan domain atau lapisan logika.

### Contoh Struktur Folder:

```
src/
├── main.rs          # Entry point aplikasi
├── lib.rs           # Logika bisnis utama (agar bisa di-test secara integrasi)
├── api/             # Layer transportasi (HTTP/gRPC)
│   ├── mod.rs
│   ├── handlers.rs
│   └── routes.rs
├── models/          # Struktur data (Structs)
│   ├── mod.rs
│   └── user.rs
├── services/        # Logika bisnis inti
│   ├── mod.rs
│   └── auth_service.rs
└── utils/           # Helper fungsi yang umum
    └── hash.rs
```

Apakah modul kamu disusun berdasarkan fitur (misalnya semua tentang 'User' berada di satu folder) atau berdasarkan tipe (seperti semua 'Structs' dikelompokkan di satu folder)? Untuk proyek besar, pengelompokan berbasis fitur biasanya jauh lebih mudah dikelola.

## 3. Prinsip "Small Files, Clear Responsibility"

Jangan ragu memecah modul. File yang mencapai lebih dari 500 baris kode biasanya menjadi sinyal kuat bahwa ia memikul terlalu banyak tanggung jawab.

**Satu File, Satu Fokus**
Jika kamu memiliki modul `database.rs`, hindari memasukkan logika validasi email di sana.

**Manfaatkan `pub(crate)`**
Gunakan visibilitas `pub(crate)` jika ingin fungsi bisa diakses oleh modul lain di dalam crate yang sama, namun tetap tersembunyi dari pengguna luar.

```rust
pub(crate) fn internal_setup() {
    // Hanya bisa dilihat oleh modul lain di proyek ini
}
```

## 4. Organisasi Kode untuk Pengujian (Testing)

Rust memiliki pendekatan pengujian unik yang sangat dipengaruhi oleh sistem modulnya.

### Unit Tests di Dalam File
Tempatkan pengujian logika internal di file yang sama dengan kodenya agar kamu bisa menguji fungsi privat sekalipun.

```rust
// src/math.rs
fn secret_calculation(a: i32) -> i32 { a * 2 }

#[cfg(test)]
mod tests {
    use super::*; // Mengambil fungsi dari scope atas

    #[test]
    fn test_secret() {
        assert_eq!(secret_calculation(2), 4);
    }
}
```

### Integration Tests di Folder `/tests`
Untuk pengujian yang mensimulasikan pengguna luar, gunakan folder `tests/` di root proyek. Folder ini diperlakukan sebagai crate terpisah, sehingga kamu hanya bisa menguji bagian-bagian yang dideklarasikan dengan kata kunci `pub`.

## 5. Menghindari Ketergantungan Melingkar (Circular Dependencies)

Rust melarang Modul A mengimpor Modul B jika Modul B juga mengimpor Modul A secara langsung. Larangan ini mendeteksi *code smell* yang menandakan desain kurang optimal.

**Gunakan Trait (Abstraksi)**
Kamu bisa membuat *trait* di modul ketiga yang nantinya diimplementasikan oleh kedua modul yang saling membutuhkan.

**Ekstraksi ke Modul Bersama**
Pindahkan fungsi atau struktur data yang dibutuhkan oleh kedua modul ke modul baru, misalnya `common` atau `shared`.

## Penerapan pada Sistem E-Commerce

Mari kita lihat bagaimana pola ini diterapkan pada skenario nyata pembuatan sistem pembayaran dengan metode `CreditCard`, `PayPal`, dan `Stripe`.

**Pola Penerapan:**
- Pertama, buat modul `payments` sebagai pintu masuk utama (fasad).
- Kedua, sembunyikan detail implementasi masing-masing penyedia dalam sub-modul privat.
- Ketiga, ekspos hanya satu interface (*trait*) ke publik untuk digunakan modul lain.

```rust
// src/payments/mod.rs
mod credit_card;
mod paypal;

// Pengguna luar tidak perlu tahu detail paypal.rs
// Mereka cukup menggunakan PaymentProvider
pub use self::paypal::PayPalProvider;
pub use self::credit_card::CardProvider;

pub trait Payment {
    fn process(&self, amount: f64);
}
```

## Ringkasan Praktik Terbaik

| Praktik | Alasan |
| --- | --- |
| **Gunakan `pub use`** | Menyederhanakan API publik tanpa mengorbankan kerapian internal. |
| **Batasi Visibilitas** | Gunakan `pub(crate)` atau biarkan privat jika tidak benar-benar perlu diekspos. |
| **Folder per Domain** | Memudahkan navigasi tim saat proyek tumbuh menjadi ribuan baris. |
| **Pisahkan `lib.rs`** | Memungkinkan logika bisnis kamu digunakan kembali oleh binary lain atau integration tests. |

Struktur modul bukanlah sesuatu yang kaku. Mulailah secara sederhana di `main.rs`. Saat kode mulai terasa sesak, pecah menjadi modul. Ketika modul semakin padat, pindahkan ke file terpisah. Saat file-file tersebut mulai saling terkait, kelompokkan dalam folder. Ikuti pertumbuhan kode secara alami, jangan memaksakan struktur sejak awal.
