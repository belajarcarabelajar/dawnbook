## Navigasi Hierarki dengan 'super' dan 'self'

Menulis path yang sangat panjang hanya untuk memanggil fungsi yang sebenarnya berada "tepat di sebelah" atau "satu tingkat di atas" modul saat ini tentu sangat melelahkan. Di dalam Rust module system, kamu tidak harus selalu menggunakan absolute path yang dimulai dari `crate`.

Rust menyediakan dua keyword, yaitu **`self`** dan **`super`**, yang berfungsi sebagai navigasi relatif. Jika diibaratkan dengan filesystem pada komputermu, `self` adalah seperti `./` (current directory), sedangkan `super` adalah seperti `../` (parent directory).

### 1. Memahami Keyword self

Keyword **`self`** merujuk pada modul tempat kode tersebut ditulis. Secara teknis, menggunakan `self` di awal path sering kali bersifat opsional karena Rust akan mencari di scope saat ini secara default. Namun, `self` menjadi sangat berguna untuk memperjelas bahwa kita merujuk pada item di dalam modul yang sama, atau saat kita ingin melakukan *re-exporting*.

#### Analogi: "Ruangan yang Sama"

Bayangkan kamu sedang berada di dalam dapur. Jika kamu berkata, "Ambilkan sapu yang ada di *sini* (dapur ini)", itu adalah analogi dari `self`. Kamu tidak perlu menyebutkan alamat lengkap rumahmu hanya untuk mengambil barang di ruangan yang sama.

#### Contoh Kode:

```rust
fn fungsi_luar() {
    println!("Memanggil fungsi_luar");
}

mod modul_saya {
    pub fn fungsi_kita() {
        println!("Memanggil fungsi_kita");
    }

    pub fn jalankan() {
        // Menggunakan 'self' untuk merujuk ke modul yang sama
        self::fungsi_kita(); 
        
        // Ini sama saja dengan memanggil langsung:
        fungsi_kita();
    }
}

fn main() {
    modul_saya::jalankan();
}
```

> **Penting:** Penggunaan `self` paling sering terlihat dalam `use` statement untuk mengelompokkan import dari modul yang sama guna menghindari redundancy.

### 2. Memahami Keyword super

Keyword **`super`** memungkinkan kita untuk mengakses item yang berada di parent module. Ini sangat berguna ketika kamu mengorganisasi kode dalam submodule yang dalam, namun tetap perlu berinteraksi dengan fungsi atau data structure yang didefinisikan satu tingkat di atasnya.

#### Analogi: "Lantai Atas"

Jika kamu berada di lantai 1 sebuah gedung dan membutuhkan peralatan yang ada di lantai 2 (lantai di atasmu), kamu tidak perlu keluar gedung lalu masuk lagi lewat pintu depan. Kamu cukup naik tangga ke arah parent (lantai di atasmu). Itulah fungsi `super`.

#### Mengapa Menggunakan super?

- **Menghindari Redundancy**: Kamu tidak perlu mengetik path panjang seperti `crate::...` untuk mengakses modul terdekat.
- **Refactoring yang aman**: Ketika memindahkan folder modul ke tempat lain, relative path dengan `super` tidak akan rusak selama struktur internal hubungan parent-child tetap sama.

#### Contoh Kode:

```rust
fn sajikan_makanan() {
    println!("Makanan disajikan!");
}

mod dapur {
    pub fn masak_pesanan() {
        println!("Memasak...");
        // Memanggil fungsi di parent module (satu tingkat di atas)
        super::sajikan_makanan();
    }

    mod area_cuci {
        pub fn cuci_piring() {
            // Bisa menggunakan super berkali-kali untuk naik lebih tinggi
            super::super::sajikan_makanan();
            println!("Piring bersih!");
        }
    }
}

fn main() {
    dapur::masak_pesanan();
}
```

### 3. Perbandingan Path: Absolut vs Relatif

Berikut perbedaan penggunaannya dalam struktur modul:

| Jenis Path | Sintaks | Kapan Digunakan? |
| --- | --- | --- |
| **Absolut** | `crate::area::dapur::masak` | Saat mengakses item dari modul di cabang hierarki yang jauh berbeda. |
| **Relatif (`self`)** | `self::masak` | Untuk menegaskan pemanggilan item di dalam scope modul yang sama. |
| **Relatif (`super`)** | `super::masak` | Saat mengakses item yang berada tepat satu tingkat di atas (parent module). |

Jika kamu menulis kode di dalam modul yang sangat dalam, mana yang lebih mudah dikelola jika suatu saat nama crate-mu berubah: absolute path atau relative path?

### 4. Real-world Application: Unit Testing

Salah satu penggunaan `super` yang paling umum dan standar di dunia nyata adalah pada penulisan **unit test** di Rust. Secara konvensi, developer Rust membuat modul `tests` di dalam file yang sama dengan kode yang diuji.

#### Skenario: Modul Kalkulator

Tanpa `super`, modul `tests` tidak akan bisa mengakses fungsi yang ingin diuji karena fungsi tersebut berada di luar scope modul `tests`.

```rust
pub fn tambah(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    // Membawa fungsi 'tambah' dari parent module ke dalam scope saat ini
    use super::tambah;

    #[test]
    fn test_tambah() {
        assert_eq!(tambah(2, 2), 4);
    }
}
```

**Penjelasan Skenario:** Pada contoh di atas, modul `tests` adalah submodule dari modul utama file tersebut. Dengan menggunakan `use super::tambah`, kita memberi tahu Rust: *"Naiklah satu tingkat ke parent module, cari fungsi bernama `tambah`, dan bawa ke scope ini agar bisa digunakan."*

### 5. Kombinasi Navigasi Kompleks

Kita juga bisa menggabungkan navigasi ini untuk mencapai target spesifik. Misalnya, `super::self` (meskipun jarang digunakan karena redundant dengan `super`) atau masuk kembali ke submodule lain dari parent module:

```rust
mod ruang_tamu {
    pub fn nyalakan_tv() {}
}

mod kamar_tidur {
    fn bangun_tidur() {
        // Naik ke parent module (crate root), lalu masuk ke modul tetangga
        super::ruang_tamu::nyalakan_tv();
    }
}
```

> **Tips Navigasi:** Anggaplah `super` sebagai tombol "Back" pada browsermu. Keyword ini membawamu kembali ke konteks yang lebih luas, memberikan fleksibilitas tanpa harus terpaku pada absolute structure yang kaku.

### Ringkasan Visual

Jika struktur modul adalah:

- **`crate` (A)**
	- **`mod_b` (B)**
		- **`mod_c` (C)**

Maka dari dalam **C**:

- `self` = Merujuk ke **C**
- `super` = Merujuk ke **B**
- `super::super` = Merujuk ke **A** (`crate`)

Dengan keyword `self` dan `super`, struktur path modul menjadi fleksibel. Kode lebih mudah di-refactor karena relasi modul bersifat relatif, mempermudah pengelolaan kode saat proyek Rust-mu mulai berkembang pesat.
