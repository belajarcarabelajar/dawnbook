## Memahami Module Tree

Setelah memahami cara mendefinisikan module dan mengatur visibilitasnya, sekarang mari kita bayangkan module-module tersebut sebagai ruangan-ruangan di dalam sebuah gedung besar. Bagaimana cara kamu memberi tahu orang lain lokasi ruangan tertentu?

Ada dua cara: memberikan alamat lengkap dari pintu utama gedung (**Absolute Path**), atau memberikan petunjuk arah dari tempat kamu berdiri saat ini (**Relative Path**). Di Rust, kita menyebut "petunjuk arah" ini sebagai **Paths**.

Sebelum masuk ke teknis path, kita harus membayangkan kode kita sebagai sebuah pohon. Rust melihat struktur folder dan module kamu seperti struktur direktori pada komputer:

- **crate** bertindak sebagai root dari tree (biasanya berupa file `src/main.rs` atau `src/lib.rs`).
- **Module** merupakan cabang-cabang pembagi yang mengelompokkan item.
- **Item** adalah daun-daun di ujung cabang, seperti function, struct, atau enum.

### Analogi Sederhana

Bayangkan sebuah sistem file pada komputer:

- **Absolute Path** dimulai dari root `/`, misalnya `/home/user/dokumen/laporan.pdf`.
- **Relative Path** dihitung dari lokasi folder saat ini, misalnya `../dokumen/laporan.pdf`.

## 1. Absolute Paths

Absolute Path adalah cara merujuk ke sebuah item dengan memulai dari crate root atau **crate**. Di Rust, Absolute Path selalu dimulai dengan kata kunci `crate`.

Gunakan Absolute Path ketika kamu ingin merujuk ke suatu item yang letaknya jauh dalam hierarki module, atau ketika kamu ingin pemanggilan tersebut tetap valid meskipun kamu memindahkan kode pemanggilnya ke module lain.

### Contoh Kode:

```rust
mod ruang_makan {
    pub mod dapur {
        pub fn masak_nasi() {}
    }
}

fn sajikan_makanan() {
    // Memanggil menggunakan Absolute Path
    crate::ruang_makan::dapur::masak_nasi();
}
```

Path di atas dimulai dari `crate`, yang merupakan entry point dari program kamu.

## 2. Relative Paths

Relative Path memulai pencarian dari module di mana kode tersebut ditulis. Path ini bisa dimulai dengan:

1. Nama item atau module yang berada di tingkat yang sama.
2. `self`: Merujuk ke module saat ini (mirip dengan `./` di terminal).
3. `super`: Merujuk ke parent module (mirip dengan `../` di terminal).

### Menggunakan Nama Langsung

Jika kamu memanggil function yang berada di module yang sama atau submodulenya, kamu bisa langsung menyebut namanya.

```rust
mod ruang_makan {
    pub fn cuci_piring() {}

    pub fn bereskan_meja() {
        // Relative Path: langsung memanggil function di module yang sama
        cuci_piring();
    }
}
```

### Menggunakan super

Kata kunci `super` sangat berguna untuk mengakses item yang berada tepat satu tingkat di atas module saat ini. Ini membantu mengurangi pengulangan jika kamu memindahkan seluruh submodule ke parent module yang berbeda.

```rust
fn umumkan_pesanan() {}

mod dapur {
    fn buat_kopi() {
        // Mengakses function di luar module dapur (parent module)
        super::umumkan_pesanan();
    }
}
```

## Perbandingan Visual: Absolute vs Relative Paths

Mari kita lihat bagaimana sebuah function dipanggil dengan kedua cara tersebut dalam struktur yang lebih kompleks:

```rust
mod depan_rumah {
    pub mod pelayanan {
        pub fn ambil_pesanan() {}
    }
}

mod dapur {
    pub fn proses_order() {
        // 1. Absolute Path
        crate::depan_rumah::pelayanan::ambil_pesanan();

        // 2. Relative Path (menggunakan super untuk naik ke root, lalu turun)
        super::depan_rumah::pelayanan::ambil_pesanan();
    }
}
```

> **Insight:** Memilih antara Absolute Path dan Relative Path sering kali tergantung pada apakah kamu ingin memindahkan definisi item dan kode pemanggilnya secara bersamaan (relatif) atau secara terpisah (absolut).

## Privacy Rules dalam Path

Namun perlu diingat, path yang benar belum tentu bisa langsung diakses.

Rust secara default menyembunyikan isi module (private). Agar sebuah path bisa diakses dari luar:

- Module harus ditandai `pub`.
- Item (function, struct) harus ditandai `pub`.

Ketika Absolute Path yang digunakan sangat panjang, seperti `crate::area::bangunan::lantai::ruangan::meja::laci::kunci()`, mengetiknya berulang kali tentu akan sangat melelahkan. Rust menyediakan cara praktis untuk menyederhanakan penulisan ini, yang akan kita bahas di bagian `use` nanti.

## Kasus Penggunaan di Dunia Nyata: Struktur Proyek Web

Dalam pengembangan web application, sering kali kita memisahkan database logic dan API logic.

```rust
// src/lib.rs

pub mod database {
    pub struct Connection;
    
    impl Connection {
        pub fn connect() -> Self { Connection }
    }
}

pub mod api {
    pub fn handle_request() {
        // Menggunakan Absolute Path untuk kejelasan
        let db = crate::database::Connection::connect();
        println!("Menangani request dengan database connection.");
    }
}

mod tests {
    fn test_koneksi() {
        // Menggunakan Relative Path 'super' karena test module 
        // biasanya berada di bawah module yang di-test
        super::database::Connection::connect();
    }
}
```

### Kapan Memilih Mana?

- **Absolute Path**: Direkomendasikan untuk proyek besar. Jika kamu melihat `crate::models::user::User`, kamu langsung tahu di mana file tersebut berada tanpa perlu mengecek posisi file saat ini.
- **Relative Path**: Bagus untuk module kecil yang bersifat mandiri (self-contained) atau saat menulis unit test di dalam file yang sama menggunakan `super`.

## Ringkasan Cepat

| Jenis Path | Dimulai Dengan | Analogi |
| --- | --- | --- |
| **Absolute** | `crate` | Alamat lengkap di Google Maps (Titik Koordinat). |
| **Relative** | Nama module, `self`, atau `super` | "Belok kiri di depan toko roti itu." |

**Rumus Sederhana:**

- Gunakan `crate` jika kamu ingin path yang **kokoh** dan tidak berubah meski file dipindah.
- Gunakan `super` jika kamu ingin path yang **fleksibel** mengikuti hubungan antara parent module dan child module.
