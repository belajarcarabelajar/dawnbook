## Deklarasi Modul dengan Kata Kunci mod

Kata kunci `mod` digunakan untuk membuat ruang lingkup baru yang mengelompokkan kode terkait agar tetap terstruktur. Modul berfungsi mirip seperti bab dan sub-bab pada buku, memisahkan bagian-bagian tulisan agar kode tetap rapi dan mudah ditelusuri.

## Apa itu Modul?

Dalam Rust, modul berfungsi sebagai wadah untuk mengelompokkan berbagai item seperti fungsi, struct, enum, trait, hingga modul lainnya. 

Fokus pembahasan kali ini adalah *inline modules*, yaitu modul yang dideklarasikan langsung di dalam satu file (biasanya `main.rs` atau `lib.rs`).

### Analogi: Folder di Desktop

Menyimpan ratusan file secara berserakan di desktop tentu tidak rapi. Folder seperti "Pekerjaan" atau "Kuliah" dibuat untuk mengelompokkannya secara spesifik:
- Folder berfungsi sebagai modul (`mod`).
- Berkas di dalamnya berfungsi sebagai elemen kode (`fn`, `struct`, dll.).

## Sintaks Dasar mod

Untuk membuat modul, gunakan kata kunci `mod` diikuti nama modul berformat `snake_case`, lalu blok kurung kurawal `{}` berisi kode terkait:

```rust
mod manajemen_dapur {
    fn cuci_piring() {
        println!("Sedang mencuci piring...");
    }

    fn masak_nasi() {
        println!("Nasi sedang dimasak.");
    }
}
```

Secara default, semua elemen di dalam modul bersifat privat. Fungsi `cuci_piring` dan `masak_nasi` tidak bisa dipanggil dari luar modul `manajemen_dapur` tanpa izin akses khusus.

## Mengelompokkan Berbagai Tipe Data

Modul dapat berisi hampir semua tipe data Rust untuk menjaga kerapian struktur proyek.

### Modul untuk Entitas Data

Contoh struktur modul pada sistem perpustakaan:

```rust
mod perpustakaan {
    pub struct Buku {
        pub judul: String,
        pub penulis: String,
    }

    pub enum StatusPinjam {
        Tersedia,
        Dipinjam,
        Hilang,
    }

    pub fn cari_buku(id: u32) {
        println!("Mencari buku dengan ID: {}", id);
    }
}
```

Menaruh seluruh elemen di tingkat teratas (root) pada proyek besar berisiko menimbulkan konflik nama. Modul meminimalkan risiko tersebut lewat pemisahan ruang nama (*namespacing*).

## Hierarki Modul

Modul dapat disusun bertingkat (sub-modul) layaknya folder di dalam folder. Secara matematis, hubungan ini digambarkan sebagai relasi himpunan bagian:

\\[ \\text{Modul}_{\\text{Anak}} \\subset \\text{Modul}_{\\text{Induk}} \\subset \\text{Crate} \\]

Struktur restoran berikut menggambarkan hierarki tersebut:

```rust
mod depan_restoran {
    mod pelayanan {
        fn ambil_pesanan() {}
        fn antar_makanan() {}
    }

    mod kasir {
        fn proses_pembayaran() {}
    }
}
```

Pada struktur ini, `depan_restoran` bertindak sebagai modul utama, sedangkan `pelayanan` dan `kasir` merupakan sub-modul di dalamnya. Jalur akses fungsi di dalam sub-modul ditulis menggunakan tanda `::`, contohnya `depan_restoran::pelayanan::ambil_pesanan()` jika fungsi tersebut bersifat publik.

## Kasus Penggunaan Nyata

### Skenario: Pemrosesan Gambar

Saat membangun pengolah gambar, logika filter sebaiknya dipisahkan dari logika manajemen berkas agar kode lebih mudah dikelola:

```rust
mod filter_gambar {
    pub fn hitam_putih() {
        // Logika mengubah piksel menjadi grayscale
        println!("Menerapkan filter hitam putih...");
    }

    pub fn blur(intensitas: u32) {
        // Logika pengaburan gambar
        println!("Mengaburkan gambar dengan level {}", intensitas);
    }
}

mod manajemen_file {
    pub fn simpan_gambar(nama: &str) {
        println!("Gambar {} berhasil disimpan.", nama);
    }

    pub fn buka_gambar(path: &str) {
        println!("Membuka gambar dari {}", path);
    }
}

fn main() {
    manajemen_file::buka_gambar("pemandangan.jpg");
    filter_gambar::hitam_putih();
    manajemen_file::simpan_gambar("pemandangan_edited.jpg");
}
```

**Analisis Kode**

Penerapan `mod` mendukung pemisahan tanggung jawab. Tim pengembang dapat fokus pada salah satu modul tanpa khawatir terjadi bentrokan nama fungsi di modul lainnya.

## Tips Organisasi Modul

- **Gunakan nama deskriptif**: Pilih nama modul berdasarkan kegunaannya, bukan cara kerjanya. Sebagai contoh, `mod autentikasi` lebih baik dibandingkan `mod fungsi_login`.
- **Batasi kedalaman sub-modul**: Usahakan tingkat kedalaman hierarki tidak lebih dari 3 atau 4 tingkat agar penulisan jalur pemanggilannya tidak terlalu panjang.
- **Manfaatkan untuk pengujian**: Pengujian unit di Rust umumnya diletakkan di dalam modul yang sama dengan kode utama menggunakan deklarasi `mod tests`.
