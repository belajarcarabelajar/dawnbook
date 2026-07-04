## Memisahkan Modul ke dalam File Terpisah

Bayangkan kamu sedang membangun sebuah rumah. Awalnya, kamu menyimpan semua peralatan dalam satu kotak besar. Namun, seiring berjalannya proyek, kotak tersebut menjadi sangat penuh sehingga kamu kesulitan menemukan palu atau obeng. Strategi terbaik adalah memindahkan peralatan tersebut ke dalam laci-laci yang terorganisir.

Dalam Rust, memindahkan isi modul dari satu file besar (`main.rs` atau `lib.rs`) ke file terpisah adalah cara kita "merapikan laci" kode agar lebih mudah dikelola, dibaca, dan dikembangkan secara tim.

## Analogi: Dari Satu Gulungan Kertas ke Sebuah Buku

Jika `main.rs` yang sangat panjang adalah sebuah **gulungan perkamen raksasa**, maka memisahkan modul adalah proses mengubahnya menjadi sebuah **buku**. Setiap file `.rs` adalah satu bab. Daftar isi buku tersebut tetap berada di bagian depan (file utama), tetapi detail ceritanya ada di halaman masing-masing.

## Mengapa Kita Harus Memisahkannya?

1. **Lebih mudah dibaca**: Kamu bisa fokus pada satu logika spesifik tanpa terganggu oleh ribuan baris kode lainnya.
2. **Kolaborasi tim lebih lancar**: Setiap anggota tim bisa mengedit file berbeda secara bersamaan, sehingga meminimalkan risiko *merge conflict*.
3. **Navigasi IDE yang cepat**: IDE seperti VS Code dapat memproses struktur yang terfragmentasi dengan baik, membuat navigasi kode terasa lebih responsif.

## Langkah demi Langkah: Memindahkan Modul

Mari kita asumsikan kita memiliki kode awal di `src/main.rs` seperti ini:

```rust
// src/main.rs

mod pembersihan_data {
    pub fn hapus_spasi(teks: &str) -> String {
        teks.trim().to_string()
    }
}

fn main() {
    let input = "  Halo Rust!  ";
    let hasil = pembersihan_data::hapus_spasi(input);
    println!("Hasil: '{}'", hasil);
}
```

### Langkah 1: Deklarasikan Modul di File Utama

Ubah deklarasi modul di `src/main.rs`. Alih-alih menggunakan kurung kurawal `{ }`, kita gunakan **titik koma** `;`.

```rust
// src/main.rs

mod pembersihan_data; // Rust akan mencari file bernama pembersihan_data.rs

fn main() {
    let input = "  Halo Rust!  ";
    let hasil = pembersihan_data::hapus_spasi(input);
    println!("Hasil: '{}'", hasil);
}
```

> **Penting:** Baris `mod pembersihan_data;` memberi tahu Rust: *"Cari modul bernama 'pembersihan\_data' di file lain dengan nama yang sama."*

### Langkah 2: Buat File Modul Baru

Buat file baru di dalam folder `src/` dengan nama yang sesuai dengan nama modul, yaitu `pembersihan_data.rs`. Struktur folder kamu akan terlihat seperti ini:

```
my_project/
├── Cargo.toml
└── src/
    ├── main.rs
    └── pembersihan_data.rs
```

### Langkah 3: Pindahkan Isi Modul

Pindahkan fungsi dari dalam kurung kurawal di `main.rs` ke dalam file `pembersihan_data.rs`.

**Catatan Krusial:** Di dalam file baru, kamu **TIDAK PERLU** lagi menulis `mod pembersihan_data { ... }`. Isi file tersebut secara otomatis dianggap sebagai isi dari modul tersebut.

```rust
// src/pembersihan_data.rs

pub fn hapus_spasi(teks: &str) -> String {
    teks.trim().to_string()
}
```

## Aturan Visibilitas Antar File

Meskipun kode telah dipindah ke file berbeda, aturan privasi Rust tetap berlaku. Jika kamu ingin fungsi di dalam `pembersihan_data.rs` dapat dipanggil oleh `main.rs`, fungsi tersebut **harus** ditandai dengan kata kunci `pub`.

Jika kamu memindahkan fungsi ke file baru tapi lupa menambahkan `pub`, Rust akan memberikan error "function is private". Ini seperti memindahkan barang ke kamar terkunci tanpa memberikan kuncinya kepada orang lain.

## Skenario Dunia Nyata: Sistem Notifikasi

Bayangkan kamu sedang membangun aplikasi e-commerce. Kamu memiliki modul untuk mengirim email dan SMS. Daripada menumpuk semuanya di `main.rs`, kamu memisahkannya:

**Struktur File:**

```
src/
├── main.rs
├── email.rs
└── sms.rs
```

**src/email.rs:**

```rust
pub struct EmailConfig {
    pub server: String,
}

pub fn kirim_notifikasi(pesan: &str) {
    println!("Mengirim email: {}", pesan);
}
```

**src/main.rs:**

```rust
mod email;
mod sms; // Asumsikan file sms.rs juga ada

fn main() {
    let config = email::EmailConfig {
        server: String::from("smtp.gmail.com"),
    };
    
    email::kirim_notifikasi("Pesanan kamu telah dikirim!");
}
```

## Praktik Terbaik

1. **Satu File, Satu Tanggung Jawab**: Hindari mencampuradukkan logika database dan logika UI dalam file modul yang sama.
2. **Gunakan snake_case untuk nama file**: Selalu gunakan gaya penulisan ini, contohnya `proses_pembayaran.rs` (bukan `ProsesPembayaran.rs`).
3. **Ganti ke folder jika modul semakin kompleks**: Jika `pembersihan_data.rs` tumbuh terlalu besar dan memiliki sub-logika seperti pembersihan angka atau simbol, sebaiknya gunakan hierarki folder (yang akan kita pelajari nanti).

## Ringkasan Visual

| Lokasi Lama (`main.rs`) | Lokasi Baru (`file.rs`) | Keterangan |
| --- | --- | --- |
| `mod nama_mod { ... }` | `mod nama_mod;` | Deklarasi di file induk menggunakan `;` |
| Isi di dalam `{ ... }` | Langsung ditulis di file | Tidak perlu membungkus dengan `mod` lagi |
| Fungsi privat | Tetap privat | Butuh `pub` untuk diakses file induk |

> **Insight Memorable:** "File adalah modul, dan modul adalah unit organisasi. Rust menggunakan sistem file kamu sebagai peta untuk memahami bagaimana kode saling terhubung."

Setelah memahami cara memindahkan modul ke file tunggal, bagaimana jika modul tersebut memiliki sub-modul di dalamnya? Bab berikutnya akan membahas penggunaan folder untuk organisasi kode yang lebih kompleks.
