## Kontrol Akses dan Visibilitas dengan pub

Dalam dunia pemrograman, tidak semua hal harus diketahui oleh semua orang. Bayangkan sebuah restoran: kamu sebagai pelanggan diizinkan untuk melihat menu dan memesan makanan di kasir, tetapi kamu tidak diizinkan masuk ke dapur untuk melihat bumbu rahasia atau bagaimana koki mengelola inventaris bahan makanan.

Di Rust, prinsip ini diterapkan secara ketat melalui sistem **Privacy by Default** (Privasi secara Default). Secara standar, semua elemen di Rust (baik itu fungsi, struct, enum, maupun modul) berstatus **privat**.

### Filosofi "Privacy by Default"

Mengapa Rust membuat semuanya privat sejak awal? Ini berkaitan erat dengan keamanan dan pemeliharaan kode (*maintenance*). Dengan menyembunyikan detail implementasi, kamu bebas mengubah logika di dalam modul tanpa khawatir akan merusak kode orang lain yang menggunakan modulmu.

> **Prinsip Utama:** Kamu hanya mengekspos apa yang benar-benar perlu digunakan oleh dunia luar.

### Menggunakan Kata Kunci pub

Untuk membuat sebuah item menjadi publik sehingga bisa diakses oleh modul induk atau modul lain, kita menggunakan kata kunci `pub` (singkatan dari *public*).

Mari kita lihat contoh struktur dasar berikut:

```rust
mod ruang_tamu {
    // Fungsi ini privat secara default
    fn bisik_bisik() {
        println!("Ini adalah rahasia.");
    }

    // Fungsi ini publik karena menggunakan 'pub'
    pub fn menyapa() {
        println!("Halo, selamat datang!");
    }
}

fn main() {
    // Ini akan ERROR karena bisik_bisik bersifat privat
    // ruang_tamu::bisik_bisik(); 

    // Ini akan berhasil
    ruang_tamu::menyapa();
}
```

*Saat merancang sebuah pustaka (library), kamu perlu menimbang matang-matang mana bagian yang layak dibuka ke publik dan mana yang harus dikunci rapat. Ingat, sekali suatu fungsi dipasangi `pub`, kode orang lain akan langsung bergantung padanya. Mengubahnya di kemudian hari bisa memicu error di mana-mana.*

### Visibilitas pada Struct

Berbeda dengan beberapa bahasa pemrograman lain, memberikan `pub` pada sebuah `struct` di Rust **tidak secara otomatis** membuat field (bidang) di dalamnya menjadi publik. Kamu harus menentukan visibilitas setiap field secara individual.

**Analogi: Mesin ATM**  
Sebuah ATM adalah objek publik yang bisa kamu lihat dan sentuh. Namun, brankas uang di dalamnya tetap terkunci rapat secara privat. Hanya slot kartu dan layar yang bersifat publik.

```rust
mod operasional_bank {
    pub struct AkunNasabah {
        pub nama: String,      // Publik: Bisa dilihat siapa saja
        saldo: f64,            // Privat: Hanya modul ini yang bisa akses
    }

    impl AkunNasabah {
        // Kita butuh fungsi publik untuk membuat instance karena ada field privat
        pub fn buka_akun(nama: String) -> AkunNasabah {
            AkunNasabah {
                nama,
                saldo: 0.0, // Saldo awal diset internal
            }
        }
    }
}

fn main() {
    let mut akun = operasional_bank::AkunNasabah::buka_akun(String::from("Budi"));
    
    // Bisa diakses
    println!("Nasabah: {}", akun.nama);

    // ERROR: field `saldo` is private
    // akun.saldo = 1000000.0; 
}
```

### Visibilitas pada Enum

Berbeda dengan `struct`, jika kita menandai sebuah `enum` sebagai publik, maka **seluruh variannya otomatis menjadi publik**.

```rust
mod menu_restoran {
    pub enum MakananUtama {
        NasiGoreng,
        SateAyam,
        MieRebus,
    }
}

fn main() {
    // Semua varian bisa langsung diakses karena enum-nya 'pub'
    let pesanan = menu_restoran::MakananUtama::NasiGoreng;
}
```

*Alasan di balik keputusan desain ini cukup praktis: enum sering dipakai untuk pencocokan pola (*pattern matching*). Jika variannya disembunyikan, pengguna luar tidak akan bisa melakukan pencocokan dengan efektif.*

### Kontrol Visibilitas yang Lebih Spesifik

Terkadang, `pub` (publik untuk semua) atau privat (hanya untuk modul saat ini) terasa terlalu ekstrem. Rust menyediakan kontrol yang lebih halus:

1. **`pub(crate)`** membatasi akses agar item hanya bisa digunakan di dalam *crate* (proyek) yang sama. Pihak luar yang mengimpor library-mu tidak akan bisa melihatnya.
2. **`pub(super)`** memberikan izin akses khusus kepada modul induk (*parent module*) di atasnya.
3. **`pub(in path)`** memungkinkan pembatasan akses yang lebih presisi, hanya untuk jalur (*path*) tertentu yang kamu tentukan.

Contoh penggunaan `pub(crate)`:

```rust
mod rahasia_perusahaan {
    // Hanya bisa diakses oleh kode di dalam proyek yang sama
    pub(crate) fn rumus_saus_rahasia() {
        println!("Garam + Gula + Cinta");
    }
}
```

### Real-World Application: Merancang API Library

Saat membangun sebuah library (misalnya library pengolah gambar), kamu mungkin memiliki ratusan fungsi untuk manipulasi pixel. Namun, kamu tentu tidak ingin pengguna library-mu pusing dengan detail teknis tersebut.

**Skenario Penerapan:**

- **Bagian Internal (Privat):** Di sini kita menyembunyikan detail teknis seperti alokasi memori buffer, hitungan matematika yang rumit, atau instruksi optimasi hardware. Pengguna library tidak perlu tahu detail ini.
- **Bagian Eksternal (Publik):** Kita cukup menyajikan fungsi-fungsi praktis yang siap pakai, seperti `.buka_gambar()`, `.putar_90_derajat()`, dan `.simpan()`.

**Keuntungan:** Jika suatu hari kamu menemukan algoritma yang lebih cepat untuk memutar gambar, kamu bisa mengganti kode di dalam fungsi privat tanpa mengubah cara pengguna memakai library-mu. Inilah yang disebut dengan **Encapsulation** (Enkapsulasi).

### Ringkasan Aturan Visibilitas

Untuk mempermudah ingatanmu, gunakan tabel referensi cepat ini:

| Elemen | Status Default | Jika Diberi `pub` |
| --- | --- | --- |
| **Modul** | Privat | Terlihat oleh modul induk |
| **Fungsi** | Privat | Bisa dipanggil dari tempat yang bisa melihat modulnya |
| **Struct** | Privat | Struct-nya terlihat, tapi field-nya tetap privat |
| **Field Struct** | Privat | Bisa dibaca/tulis dari luar |
| **Enum** | Privat | Enum dan **semua** variannya menjadi publik |

> **Pesan Penting:** Selalu mulailah dengan kode privat. Jika kamu menemukan kebutuhan untuk mengaksesnya dari luar, baru tambahkan `pub`. Ini menjaga API-mu tetap bersih dan mudah dikelola.
