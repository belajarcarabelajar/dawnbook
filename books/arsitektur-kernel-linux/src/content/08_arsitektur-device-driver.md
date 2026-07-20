## Arsitektur Device Driver: Jembatan Menuju Dunia Fisik

Bayangkan kernel Linux sebagai seorang konduktor orkestra yang sangat cerdas. Ia tahu persis bagaimana musik harus dimainkan, tetapi tidak bisa memainkan biola, meniup trompet, atau memukul drum secara langsung. Ia membutuhkan musisi yang ahli di bidangnya masing-masing untuk menerjemahkan instruksinya menjadi suara.

Dalam sistem operasi, **device driver** adalah musisi tersebut. Mereka merupakan kode spesifik yang bertugas menerjemahkan bahasa tingkat tinggi kernel ke bahasa elektrik yang rumit dari perangkat keras (*hardware*).

## 1. Filosofi: "Everything is a File"

Sebelum masuk ke jenis-jenis driver, kita harus memahami prinsip fundamental Linux: **"Everything is a file"** (semua hal adalah file).

Di Linux, perangkat keras tidak diakses melalui instruksi rahasia yang rumit. Sebaliknya, mereka muncul di sistem sebagai file di dalam direktori `/dev/`.

- Keyboard kamu mungkin diwakili oleh `/dev/input/eventX`.
- Hard drive kamu mungkin muncul sebagai `/dev/sda`.

> "Abstraksi ini memungkinkan programmer aplikasi untuk menggunakan fungsi standar seperti `open()`, `read()`, `write()`, dan `close()` untuk berkomunikasi dengan perangkat apa pun, tanpa perlu tahu protokol fisik di bawahnya."

## 2. Tiga Pilar Utama Device Driver

Linux membagi dunia perangkat keras menjadi tiga kategori besar berdasarkan cara data dikirim dan diterima.

### A. Character Driver

Character driver adalah jenis yang paling sederhana dan paling umum. Driver ini menangani data sebagai aliran karakter atau **byte demi byte**.

- **Analogi:** Bayangkan sebuah **sedotan**. Data mengalir secara berurutan. Apa yang masuk pertama akan keluar pertama. Kamu tidak bisa melompat ke tengah-tengah aliran data dengan mudah.
- **Karakteristik:**
  - Akses data dilakukan secara sekuensial (berurutan).
  - Biasanya tidak membutuhkan penyangga (*buffer*) yang besar di sisi kernel.
  - Contoh umumnya meliputi keyboard, mouse, serial port (UART), dan sensor suhu.

### B. Block Driver

Berbeda dengan character driver, block driver menangani data dalam jumlah besar yang disebut **blok** (biasanya berukuran 512 byte atau lebih).

- **Analogi:** Bayangkan sebuah **perpustakaan**. Kamu tidak perlu membaca buku dari halaman pertama setiap kali. Kamu bisa langsung menuju rak tertentu, mengambil buku yang dibutuhkan, dan langsung membuka halaman yang dituju. Kamu bebas melompat ke mana saja (*random access*).
- **Karakteristik:**
  - Mendukung akses acak (*random access*).
  - Memanfaatkan *cache* dan *buffer* secara agresif untuk meningkatkan performa.
  - Diatur oleh *I/O scheduler* untuk mengoptimalkan urutan pergerakan data ke media penyimpanan.
  - Contoh: HDD, SSD, USB flash drive, dan SD card.

### C. Network Interface Driver

Driver ini memiliki sifat yang unik. Berbeda dengan dua tipe di atas, driver jaringan **tidak muncul sebagai file di direktori `/dev/`**. Mereka dikelola langsung oleh *networking stack* milik kernel.

- **Analogi:** Seperti **kantor pos**. Data dikirim dalam bentuk paket-paket surat. Setiap paket memiliki alamat tujuan serta pengirim, dan mereka bisa sampai di tujuan secara tidak berurutan.
- **Karakteristik:**
  - Bekerja dengan orientasi paket (*packet-oriented*).
  - Berinteraksi erat dengan protokol komunikasi seperti TCP/IP.
  - Mengandalkan struktur data `sk_buff` (*socket buffer*) untuk mentransmisikan data antar-lapisan.
  - Contoh: Kartu Ethernet (NIC) dan adaptor Wi-Fi.

## 3. Anatomi Driver: Struktur file_operations

Bagi pengembang kernel, jantung dari sebuah driver karakter adalah struktur data yang disebut `file_operations`. Struktur ini berfungsi memetakan *system calls* standar ke fungsi kustom yang kamu buat di dalam driver.

Berikut adalah contoh sederhana bagaimana sebuah driver didefinisikan dalam bahasa C:

```c
#include <linux/fs.h>

// Fungsi yang dipanggil saat aplikasi membuka file di /dev/my_device
static int my_open(struct inode *inode, struct file *file) {
    printk(KERN_INFO "Perangkat dibuka!\n");
    return 0;
}

// Memetakan operasi standar ke fungsi kustom kita
static struct file_operations fops = {
    .owner = THIS_MODULE,
    .read = my_read,       // Fungsi baca
    .write = my_write,     // Fungsi tulis
    .open = my_open,       // Fungsi buka
    .release = my_release, // Fungsi tutup
};
```

Sebagai gambaran, jika kamu ingin membuat driver untuk sensor lampu kustom, kamu cukup mengisi fungsi `.read` dengan logika untuk mengambil data dari pin hardware perangkat tersebut.

## 4. Mekanisme Komunikasi: Major dan Minor Numbers

Bagaimana kernel mengetahui bahwa ketika aplikasi membuka `/dev/tty0`, ia harus memanggil driver konsol dan bukan driver hard disk? Jawabannya terletak pada **Major** dan **Minor Numbers**.

1. **Major Number:** Mengidentifikasi driver mana yang bertanggung jawab atas perangkat tersebut (misalnya, semua hard disk mungkin berbagi Major Number 8).
2. **Minor Number:** Digunakan oleh driver tersebut untuk membedakan unit perangkat fisik yang spesifik (misalnya, disk A adalah Minor 0, disk B adalah Minor 1).

\\[ \text{Perangkat} = (\text{Major}, \text{Minor}) \\]

## 5. Alur Kerja: Dari Aplikasi ke Hardware

Mari kita lihat skenario dunia nyata: **Menyimpan dokumen ke USB Drive.**

1. **Aplikasi (User Space):** Kamu menekan tombol "Save". Aplikasi memanggil fungsi `write()` pada file di `/media/usb/data.txt`.
2. **VFS (Kernel Space):** Virtual File System menerima permintaan tersebut dan mendeteksi bahwa file ini berada di *file system* FAT32 pada sebuah *block device*.
3. **Block Layer:** Kernel mengatur antrean penulisan agar efisien, misalnya menghindari gerakan berlebih pada *head* mekanis piringan hard disk.
4. **Block Driver:** Driver *USB storage* menerima perintah untuk menulis data sejumlah 4096 byte ke sektor tertentu.
5. **Hardware:** Driver mengirimkan sinyal elektrik melalui bus USB ke pengontrol fisik di flash drive hingga data berhasil disimpan.

## 6. Kasus Penggunaan Dunia Nyata

| Jenis Perangkat | Kategori Driver | Rationale / Alasan |
| --- | --- | --- |
| **Printer** | Character Driver | Data dikirim secara berurutan untuk dicetak karakter demi karakter. |
| **NVMe SSD** | Block Driver | Membutuhkan akses cepat ke lokasi data mana pun secara acak di dalam memori flash. |
| **Dongle Wi-Fi** | Network Interface | Menangani transmisi paket data nirkabel menggunakan protokol 802.11. |
| **Webcam** | Character Driver | Mengirimkan aliran (*stream*) frame video secara berurutan. |

## 7. Ringkasan Teknis

- **Character Driver:** Memproses data secara sekuensial (byte demi byte) dan memiliki representasi file di direktori `/dev/`.
- **Block Driver:** Mengakses data dalam unit blok secara acak (*random access*), memanfaatkan sistem buffer, serta terdaftar di `/dev/`.
- **Network Interface Driver:** Bekerja dengan orientasi paket tanpa representasi file di `/dev/`, melainkan dikendalikan langsung oleh *networking stack*.

**Penting:** *Device driver* beroperasi sepenuhnya di dalam *Kernel Space*. Konsekuensinya, kesalahan kecil pada kode (seperti mengakses alamat memori yang tidak valid) dapat langsung memicu kegagalan sistem global atau *Kernel Panic*. Oleh karena itu, penulisan driver menuntut ketelitian jauh lebih tinggi dibanding pembuatan aplikasi biasa.

> "Device driver adalah pahlawan tanpa tanda jasa. Tanpa kehadiran mereka, kernel Linux hanyalah sekumpulan algoritma yang terisolasi dari dunia nyata."
