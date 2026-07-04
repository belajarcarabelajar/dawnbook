## Mengelola Kompleksitas: Hierarki Modul dengan Folder

Bayangkan kamu sedang membangun perpustakaan digital yang sangat besar. Awalnya, kamu mungkin hanya membutuhkan satu rak buku. Namun, seiring bertambahnya koleksi, satu rak tentu tidak lagi cukup. Kamu pun mulai membagi buku berdasarkan kategori (Fiksi, Sains, Sejarah). Di dalam kategori Sains, buku-buku tersebut dibagi lagi menjadi Fisika, Biologi, dan Kimia.

Dalam dunia Rust, ketika kode programmu tumbuh dari puluhan menjadi ribuan baris, menumpuk semua file di dalam satu folder `src/` akan membuat proyek berantakan. Di sinilah **Hierarki Modul dengan Folder** mulai memainkan peran penting.

### Analogi: Struktur Organisasi Perusahaan

Untuk memahami konsep hierarki ini, kita bisa membayangkan struktur sebuah perusahaan:

1. **`main.rs` (CEO)**: Berperan mengawasi seluruh departemen.
2. **Folder (Departemen)**: Mewakili departemen tertentu, misalnya departemen `Akuntansi`.
3. **File di dalam Folder (Tim Spesifik)**: Mewakili tim kecil di dalam departemen. Di dalam `Akuntansi`, misalnya, terdapat tim `Gaji` dan tim `Pajak`.

Tanpa adanya pembagian folder, semua anggota tim dari setiap departemen akan berkumpul di satu ruangan besar. Hal ini tentu memicu kekacauan ketika ada yang ingin mencari informasi spesifik.

### Pola Modern: File dan Folder Berdampingan

Sejak Rust edisi 2018, cara standar untuk membuat submodul yang kompleks adalah dengan menggunakan pola **File-dan-Folder**. Aturannya cukup sederhana:

> Jika kamu memiliki modul bernama `network` yang memiliki submodul (anak), maka kamu memerlukan:
> 
> 1. File bernama `network.rs` untuk mendeklarasikan anak-anaknya.
> 2. Folder bernama `network/` untuk menyimpan file-file submodul tersebut.

#### Contoh Struktur Proyek

Katakanlah kita sedang membangun sistem manajemen konten (CMS) dan ingin mengelompokkan kode terkait "Media":

```text
src/
├── main.rs          # Root crate
├── media.rs         # Deklarasi modul media dan submodulnya
└── media/           # Folder yang menyimpan isi dari submodul media
    ├── image.rs     # Submodul: media::image
    └── video.rs     # Submodul: media::video
```

### Langkah demi Langkah Implementasi

Mari kita bedah cara menghubungkan file-file ini agar Rust mengenalnya sebagai satu kesatuan hierarki yang utuh.

#### 1. Deklarasi di Root (src/main.rs)

Langkah awal adalah memberi tahu Rust bahwa modul `media` tersedia di dalam proyek.

```rust
// main.rs
mod media; // Rust secara otomatis akan mencari src/media.rs

fn main() {
    // Memanggil fungsi dari hierarki yang lebih dalam
    media::image::upload("kucing.jpg");
    media::video::stream("tutorial_rust.mp4");
}
```

#### 2. Menghubungkan Anak di Parent Modul (src/media.rs)

File `media.rs` bertindak sebagai "jembatan" atau pintu masuk utama menuju submodul yang ada di dalam folder pendukungnya.

```rust
// media.rs

// Deklarasikan submodul yang tersimpan di dalam folder media/
pub mod image; 
pub mod video;

pub fn print_status() {
    println!("Media module is active!");
}
```

#### 3. Isi dari Submodul (src/media/image.rs)

Di dalam file ini, kamu tidak perlu lagi menuliskan `mod image`. Kamu bisa langsung menuliskan fungsi atau komponen yang dibutuhkan.

```rust
// media/image.rs

pub fn upload(filename: &str) {
    println!("Mengunggah gambar: {}", filename);
}
```

### Hierarki yang Lebih Dalam (Cucu Modul)

Bagaimana jika modul `image` ternyata butuh submodul tambahan, misalnya `compression`? Caranya cukup dengan mengulangi pola yang sama.

**Struktur Folder:**

```text
src/media/
├── image.rs
├── image/           # Folder baru untuk submodul dari image
│   └── compression.rs
└── video.rs
```

**Di dalam `src/media/image.rs`:**

```rust
pub mod compression; // Mencari file di media/image/compression.rs

pub fn upload(name: &str) { ... }
```

Kalau diperhatikan, struktur folder di komputermu sebenarnya membentuk pola sebuah "pohon" (tree). Menariknya, sistem modul Rust mencerminkan struktur pohon ini secara identik.

### Kasus Nyata: Pengembangan Game Engine

Dalam pengembangan game, kerapian organisasi kode menjadi sangat krusial. Perhatikan bagaimana hierarki folder berikut mempermudah proses navigasi:

```text
src/
├── engine/
│   ├── graphics/
│   │   ├── renderer.rs
│   │   ├── shader.rs
│   │   └── texture.rs
│   ├── physics/
│   │   ├── collision.rs
│   │   └── gravity.rs
│   └── input/
│       ├── keyboard.rs
│       └── mouse.rs
└── main.rs
```

Sebagai contoh, seorang developer yang sedang menangani bagian pencahayaan (lighting) hanya perlu berfokus pada folder `src/engine/graphics/`. Tanpa adanya hierarki terstruktur ini, ia harus bersusah payah mencari file tersebut di antara ratusan file lain di root folder `src/`.

### Aturan Penting Hierarki Modul

Ada beberapa aturan dasar yang perlu kamu ingat ketika menyusun modul menggunakan folder:

1. **Module Discovery**: Rust tidak memindai folder secara otomatis. Kamu **wajib** menggunakan kata kunci `mod` di file induk untuk mendaftarkan file anak agar dikenal oleh kompilator.
2. **Naming Convention**: Nama folder harus **sama persis** dengan nama file induknya. Jika file induk bernama `auth.rs`, maka seluruh file anaknya harus ditempatkan di dalam folder bernama `auth/`.
3. **Encapsulation**: Secara default, semua isi modul bersifat privat. Pastikan untuk menambahkan visibilitas `pub` agar submodul atau fungsi di dalamnya bisa diakses oleh modul luar.

> **Tips Praktis:** Gunakan hierarki folder hanya jika sebuah modul sudah terasa terlalu besar (misalnya lebih dari 200-300 baris kode) atau ketika modul tersebut memiliki subkomponen dengan tanggung jawab yang berbeda. Terlalu banyak membuat folder pada proyek kecil justru akan membuat navigasi menjadi rumit (over-engineering).

Coba tengok proyek kode yang sedang kamu kerjakan saat ini. Jika kamu harus membaginya ke dalam tiga folder utama, pembagian seperti apa yang paling masuk akal supaya tidak bingung saat membacanya lagi di masa depan?
