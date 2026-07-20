## System Calls: Antarmuka User-Kernel

Bayangkan kamu berada di sebuah restoran mewah. Sebagai pelanggan, kamu tidak diperbolehkan masuk ke dapur untuk memasak makanan sendiri karena alasan keamanan dan kebersihan. Kamu harus duduk di meja dan menyampaikan pesananmu kepada pelayan. Pelayan tersebut kemudian membawa pesananmu ke dapur, dan setelah makanan siap, pelayan akan mengantarkannya kembali kepadamu.

Dalam dunia sistem operasi, **kamu adalah aplikasi pengguna**, **dapur adalah kernel**, dan **pelayan adalah System Call**.

## Apa itu System Call?

**System Call (syscall)** adalah antarmuka terprogram yang memungkinkan program aplikasi (User Space) untuk meminta layanan dari kernel sistem operasi (Kernel Space). Karena kernel memiliki kendali penuh atas perangkat keras, aplikasi tidak boleh mengakses memori atau perangkat keras secara langsung demi stabilitas dan keamanan sistem.

> **Catatan Penting:** System call adalah pintu gerbang tunggal yang dikontrol ketat bagi aplikasi untuk berinteraksi dengan dunia luar melalui bantuan kernel.

## Dual-Mode Operation: User Mode vs. Kernel Mode

Untuk melindungi sistem, CPU modern mendukung setidaknya dua mode operasi:

1. **User Mode (Ring 3):** Mode dengan hak akses terbatas. Aplikasi seperti web browser, text editor, atau game berjalan di sini. Jika terjadi kesalahan di mode ini, hanya aplikasi tersebut yang berhenti (crash), bukan seluruh sistem.
2. **Kernel Mode (Ring 0):** Mode dengan hak akses penuh ke seluruh instruksi CPU dan hardware. Hanya kode inti kernel yang berjalan di sini.

### Mekanisme Transisi Mode

Ketika sebuah aplikasi memanggil system call, terjadi peralihan mode (mode switch) dari User Mode ke Kernel Mode secara terkontrol.

Sebagai gambaran, jika aplikasi pemutar video dapat menulis data secara langsung ke penyimpanan (disk) tanpa melalui kernel, risiko kerusakan data (data corruption) akan sangat tinggi karena tidak ada koordinasi antar-proses.

## Bagaimana System Call Bekerja? (Mekanisme Teknis)

Proses pemanggilan system call melibatkan koordinasi antara software and hardware:

### 1. Penyiapan Parameter

Sebelum memanggil kernel, aplikasi menempatkan argumen (seperti nama file atau data yang akan ditulis) ke dalam register CPU tertentu. Setiap system call memiliki nomor unik (ID).

### 2. Instruksi Trap/Exception

Aplikasi mengeksekusi instruksi khusus yang memaksa CPU beralih mode.

- Pada arsitektur x86 lama: `int 0x80` (Software Interrupt).
- Pada arsitektur x86_64 modern: Instruksi `syscall`.

### 3. System Call Table

Kernel memiliki daftar fungsi yang disebut **System Call Table**. Kernel menggunakan nomor ID yang diberikan di register untuk mencari alamat memori dari fungsi yang sesuai di dalam tabel ini.

### 4. Eksekusi di Kernel Space

Kernel menjalankan tugas yang diminta (misalnya, membaca data dari disk).

### 5. Kembali ke User Mode

Setelah selesai, kernel menempatkan nilai kembalian (return value) ke register, lalu mengeksekusi instruksi untuk kembali ke User Mode dan melanjutkan eksekusi program pengguna.

## Arsitektur Layer: Standard Library vs System Call

Hampir tidak ada programmer yang menulis instruksi `syscall` secara manual dalam bahasa Assembly. Sebaliknya, kita menggunakan **Standard C Library (glibc)**.

| Layer | Contoh | Peran |
| --- | --- | --- |
| **Aplikasi** | `printf("Hello");` | Logika program pengguna. |
| **Library (glibc)** | `write()` | Wrapper yang menyiapkan register dan memicu syscall. |
| **Kernel Interface** | `sys_write` | Fungsi internal kernel yang mengelola hardware. |

## Contoh Kode: High-Level vs Low-Level

Mari kita bandingkan penggunaan library API standar dengan pemanggilan system call secara langsung.

### Menggunakan C Standard Library (Standard API)

```c
#include <stdio.h>
#include <unistd.h>

int main() {
    // printf secara internal akan memanggil system call 'write'
    printf("Halo dari User Space!\n");
    return 0;
}
```

### Menggunakan System Call Secara Langsung (Linux x86_64)

Dalam skenario nyata, kita bisa menggunakan fungsi `syscall()` untuk memanggil ID tertentu:

```c
#include <unistd.h>
#include <sys/syscall.h>

int main() {
    const char *pesan = "Memanggil kernel secara langsung!\n";
    // SYS_write adalah ID untuk system call write (ID 1 pada x86_64)
    // 1 adalah file descriptor untuk stdout
    syscall(SYS_write, 1, pesan, 35);
    return 0;
}
```

## Kategori Utama System Call

Linux memiliki ratusan system call (sekitar 300 hingga 400 lebih, tergantung versi kernel). System call ini dikelompokkan ke dalam beberapa kategori utama:

1. **Kontrol Proses (Process Control):** Digunakan untuk membuat proses baru dengan `fork()`, menghentikan proses dengan `exit()`, atau memuat program baru menggunakan `exec()`.
2. **Manajemen File (File Management):** Operasi dasar berkas seperti membuka file (`open()`), membaca isi (`read()`), menulis data (`write()`), serta menutup file (`close()`).
3. **Manajemen Perangkat (Device Management):** Mengelola hardware melalui fungsi seperti `ioctl()` untuk konfigurasi khusus, serta `read()` dan `write()` untuk transfer data perangkat.
4. **Informasi Sistem (Information Maintenance):** Meminta data dari kernel, seperti mendapatkan ID proses aktif dengan `getpid()`, mengatur timer (`alarm()`), atau menunda eksekusi (`sleep()`).
5. **Komunikasi (Communication):** Digunakan untuk komunikasi antar-proses (IPC), misalnya membuat saluran pipa data (`pipe()`), mengalokasikan memori bersama (`shmget()`), atau membuka koneksi jaringan (`socket()`).

## Menggunakan strace untuk Menganalisis System Call

Sebagai engineer, kamu sering kali perlu mengetahui apa yang dilakukan aplikasi di balik layar. Linux menyediakan utilitas bernama `strace` untuk memantau setiap system call yang dieksekusi oleh suatu proses.

**Skenario:** Kamu ingin melihat berkas apa saja yang diakses ketika menjalankan perintah `ls`.

**Perintah:**

```bash
strace ls
```

**Contoh Output (Disederhanakan):**

```
execve("/usr/bin/ls", ["ls"], 0x7ffdce...) = 0
brk(NULL)                               = 0x559e17...
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
stat("/usr/bin/ls", {st_mode=S_IFREG|0755, ...}) = 0
write(1, "file1.txt  file2.jpg  folder1\n", 30) = 30
exit_group(0)                           = ?
```

- `openat`: Digunakan untuk membuka berkas atau direktori (dalam contoh ini, memuat pustaka sistem `/etc/ld.so.cache`).
- `write`: Mengirimkan output teks (daftar berkas) ke `stdout` (layar).
- `exit_group`: Menghentikan seluruh thread dalam proses dan keluar dari program.

## Overhead System Call: Konsekuensi Keamanan

Setiap kali aplikasi melakukan system call, ada beban performa (overhead) yang harus dibayar. Transisi mode dari User Mode ke Kernel Mode memerlukan siklus CPU tambahan untuk menyimpan status register dan memvalidasi parameter.

**Analogi:** Bayangkan kamu ingin mengambil segelas air (data). Dapur (kernel) berada di sebelahmu, tetapi kamu tidak boleh masuk sendiri. Kamu harus mengisi formulir pesanan (system call) dan menanti pelayan membawakannya. Proses ini tentu memakan waktu lebih lama dibandingkan jika kamu mengambilnya secara langsung.

**Rumus Sederhana Efisiensi:**
\\[
T_{\text{total}} = T_{\text{user-logic}} + T_{\text{syscall-overhead}} + T_{\text{kernel-execution}}
\\]

Oleh karena itu, aplikasi yang sensitif terhadap performa biasanya meminimalkan frekuensi system call, salah satunya dengan teknik **buffering** (mengakumulasikan data di memori sebelum melakukan satu operasi `write` besar).

### Ringkasan Poin Penting

- **System Call berfungsi sebagai API** yang menjembatani komunikasi aman antara User Space dan Kernel Space.
- **Keamanan dan stabilitas sistem** adalah alasan utama mengapa pembatasan akses langsung ke hardware diberlakukan melalui dual-mode operation.
- **Library standar (seperti glibc)** membungkus detail instruksi assembly dari system call sehingga mempermudah tugas developer.
