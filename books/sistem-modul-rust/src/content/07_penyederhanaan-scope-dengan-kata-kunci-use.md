## Penyederhanaan Scope dengan Kata Kunci use

Bayangkan kamu tinggal di sebuah kompleks perumahan yang sangat besar. Setiap kali kamu ingin mengundang teman ke rumah, kamu harus memberikan alamat lengkap: **"Negara Indonesia, Provinsi DKI Jakarta, Kota Jakarta Selatan, Kecamatan Tebet, Jalan Gajah Mada Nomor 123"**.

Lama-lama, menuliskan alamat sepanjang itu di setiap surat undangan tentu melelahkan. Bukankah lebih mudah jika kamu cukup berkata, **"Datanglah ke Rumah Saya"**, dan semua orang di lingkungan tersebut sudah tahu maksudnya?

Dalam Rust, kata kunci `use` berfungsi seperti membuat "pintasan" atau "nama panggilan" tersebut. Ia membawa sebuah path ke dalam scope saat ini, sehingga kamu tidak perlu menuliskan path absolut yang panjang berulang kali.

## Masalah: Path yang Terlalu Panjang

Sebelum kita masuk ke solusi, mari kita lihat masalahnya. Perhatikan contoh struktur modul untuk sebuah restoran di bawah ini:

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

fn eat_at_restaurant() {
    // Memanggil fungsi dengan path absolut yang panjang
    crate::front_of_house::hosting::add_to_waitlist();
    
    // Memanggil lagi... terasa sangat repetitif
    crate::front_of_house::hosting::add_to_waitlist();
}
```

Menulis `crate::front_of_house::hosting::add_to_waitlist()` setiap kali kita membutuhkannya akan membuat kode menjadi kotor dan sulit dibaca.

## Solusi: Menggunakan Kata Kunci use

Dengan `use`, kita bisa membawa modul ke dalam scope fungsi atau modul saat ini. Ini mirip dengan membuat *symbolic link* di sistem operasi atau melakukan `import` di bahasa pemrograman lain.

### Contoh Dasar

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

// Membawa modul hosting ke dalam scope utama
use crate::front_of_house::hosting;

fn eat_at_restaurant() {
    // Sekarang kita cukup memanggil 'hosting'
    hosting::add_to_waitlist();
    hosting::add_to_waitlist();
}
```

> **Penting:** Menambahkan `use` di bagian atas file akan berlaku untuk seluruh isi file tersebut dalam scope modul tersebut. Namun, perlu diingat bahwa `use` hanya berlaku untuk scope tempat ia didefinisikan.

## Konvensi Path yang Idiomatis (The Rust Way)

Meskipun kamu bisa membawa fungsi secara langsung ke dalam scope, Rust memiliki konvensi tertentu agar kode tetap mudah dipahami:

### 1. Untuk Fungsi: Bawa Parent Module

Sangat disarankan untuk membawa **parent module** dari fungsi tersebut ke dalam scope, alih-alih mengimpor fungsinya secara langsung. Sebagai contoh, disarankan untuk menggunakan `use crate::front_of_house::hosting;` lalu memanggil `hosting::add_to_waitlist();`, daripada mengimpor fungsinya secara langsung dengan `use crate::front_of_house::hosting::add_to_waitlist;` kemudian memanggil `add_to_waitlist();`. Hal ini memberikan kejelasan visual bahwa fungsi tersebut didefinisikan di luar scope saat ini, bukan merupakan fungsi lokal.

### 2. Untuk Struct, Enum, dan Item Lainnya: Bawa Path Lengkap

Sebaliknya, untuk tipe data seperti struct atau enum, biasanya kita mengimpor item tersebut secara langsung.

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::new();
    map.insert(1, 2);
}
```

Mengapa untuk struct kita langsung membawa itemnya, sedangkan untuk fungsi kita tetap menyertakan nama modul induknya? Hal ini berkaitan dengan aspek kejelasan. Ketika melihat `HashMap::new()`, kamu bisa langsung mengidentifikasi bahwa itu merupakan sebuah tipe data. Namun, jika kamu melihat `add_to_waitlist()` tanpa prefiks modul, kamu mungkin akan bingung apakah itu fungsi lokal atau fungsi yang diimpor dari luar.

## Mengatasi Konflik Nama dengan Kata Kunci as

Terkadang, kita perlu mengimpor dua item dengan nama yang sama dari modul yang berbeda. Sebagai contoh, ada dua tipe `Result`.

Untuk mengatasi ini, kita menggunakan kata kunci `as` untuk memberikan alias (nama samaran).

```rust
use std::fmt::Result;
use std::io::Result as IoResult; // Memberikan nama panggilan baru

fn function1() -> Result {
    // --snip--
    Ok(())
}

fn function2() -> IoResult<()> {
    // --snip--
    Ok(())
}
```

## Mengelompokkan Path (Nested Paths)

Jika kamu mengimpor banyak item dari package atau modul yang sama, baris `use` kamu bisa menumpuk dan terlihat berantakan.

**Cara lama:**

```rust
use std::cmp::Ordering;
use std::io;
use std::collections::HashMap;
```

**Cara efisien (nested paths):** Kita bisa menggunakan kurung kurawal `{}` untuk mengelompokkan item yang berasal dari parent yang sama.

```rust
use std::{cmp::Ordering, io, collections::HashMap};
```

Jika salah satu item adalah parent path itu sendiri, gunakan kata kunci `self`:

```rust
// Ini akan mengimpor std::io dan std::io::Write
use std::io::{self, Write};
```

## Glob Operator (\*)

Jika kamu ingin membawa **semua** item publik dari sebuah modul ke dalam scope, kamu bisa menggunakan operator glob:

```rust
use std::collections::*;
```

Peringatan: Gunakan operator glob dengan sangat hati-hati. Operator glob dapat mempersulit pembaca kode untuk mengetahui asal-usul suatu item, serta berisiko menimbulkan konflik nama jika modul tersebut menambahkan fungsi baru di masa mendatang. Biasanya, operator glob digunakan dalam file pengujian (testing) atau saat menyiapkan prelude.

## Real-world Application: Penanganan Data JSON

Dalam pengembangan aplikasi web menggunakan Rust, kita sering menggunakan library `serde`. Penggunaan `use` sangat krusial di sini agar logika bisnis tidak terganggu oleh path modul yang panjang.

```rust
use serde::{Serialize, Deserialize};
use serde_json::Result as JsonResult;

#[derive(Serialize, Deserialize)]
struct User {
    username: String,
    id: u32,
}

fn process_user_data(data: &str) -> JsonResult<()> {
    let u: User = serde_json::from_str(data)?;
    println!("User ID {} adalah {}", u.id, u.username);
    Ok(())
}
```

### Analogi Efisiensi

Dalam matematika, jika kita memiliki variabel kompleks, kita sering memisalkannya: Misalkan \\( f(x, y, z) = \\frac{x^2 + y^2}{z} \\), daripada menuliskan seluruh rumus tersebut berulang kali dalam integrasi: \\( \\int_{0}^{1} \\frac{x^2 + y^2}{z} dx \\) Kita cukup merujuk pada \\( f(x, y, z) \\). Kata kunci `use` adalah cara Rust melakukan "pemisalan" tersebut untuk mempermudah operasi kode kita.

## Ringkasan Cepat

| Teknik | Contoh Sintaks | Kegunaan |
| --- | --- | --- |
| **Basic Use** | `use std::io;` | Membawa modul `io` ke dalam scope saat ini. |
| **Direct Item** | `use std::collections::HashMap;` | Membawa struct `HashMap` langsung. |
| **Aliasing** | `use std::io::Result as IoResult;` | Mengubah nama agar tidak terjadi konflik. |
| **Grouping** | `use std::{io, fs};` | Menghemat baris untuk impor dari parent yang sama. |
| **Glob** | `use std::io::*;` | Membawa semua item (gunakan dengan bijak). |

> **Insight:** Mengelola scope dengan baik bukan hanya tentang mengetik lebih sedikit, melainkan tentang memberikan informasi yang cukup bagi pembaca kode (atau kamu di masa mendatang) untuk memahami asal-usul setiap komponen tanpa perlu menelusuri seluruh hierarki proyek.
