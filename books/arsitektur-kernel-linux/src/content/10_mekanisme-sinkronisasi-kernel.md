## Mekanisme Sinkronisasi Kernel: Menjaga Ketertiban di Tengah Kekacauan Konkurensi

Bayangkan kernel Linux sebagai dapur restoran yang sangat sibuk dengan banyak koki (CPU/core) yang bekerja secara bersamaan. Jika dua koki mencoba memotong wortel yang sama di atas talenan yang sama pada saat yang sama, kekacauan pasti terjadi. Dalam dunia sistem operasi, kekacauan ini dikenal sebagai **race condition**.

Mekanisme sinkronisasi adalah sekumpulan aturan dan alat yang digunakan kernel untuk memastikan bahwa data bersama (shared data) diakses secara tertib, mencegah korupsi data, dan menjaga integritas sistem.

## 1. Memahami Masalah: Race Condition

**Race condition** terjadi ketika dua atau lebih alur eksekusi (thread, interrupt handler, atau proses) mengakses data bersama secara konkuren, dan hasil akhirnya bergantung pada urutan eksekusi yang tidak terduga.

> **Analogi Sederhana:** Bayangkan saldo bank kamu adalah Rp1.000.000.
> 
> 1. Proses A ingin menarik Rp200.000. Ia membaca saldo: Rp1.000.000.
> 2. Di saat yang hampir bersamaan, Proses B ingin menyetor Rp100.000. Ia juga membaca saldo: Rp1.000.000.
> 3. Proses A menghitung \\(1.000.000 - 200.000 = 800.000\\) dan menyimpannya.
> 4. Proses B menghitung \\(1.000.000 + 100.000 = 1.100.000\\) dan menyimpannya. Hasil akhirnya adalah Rp1.100.000. Uang Rp200.000 yang ditarik Proses A "hilang" dari catatan karena tertimpa oleh hasil Proses B.

Untuk mencegah hal ini, kita membutuhkan **mutual exclusion**: memastikan hanya satu "koki" yang bisa mengakses "talenan" pada satu waktu.

## 2. Spinlock: Si Penjaga yang Gigih

**Spinlock** adalah mekanisme penguncian paling dasar dalam kernel Linux. Ketika sebuah thread mencoba mendapatkan spinlock yang sudah dipegang oleh thread lain, thread tersebut akan terus berputar (**spin**) dalam sebuah loop kecil, berulang kali memeriksa apakah kunci sudah tersedia.

### Karakteristik Utama:

- **Busy Waiting:** CPU tetap aktif bekerja (berputar) saat menunggu kunci.
- **Sangat Cepat:** Cocok untuk penguncian durasi singkat karena tidak ada overhead *context switching*.
- **Konteks Interupsi:** Berbeda dengan mutex, spinlock aman digunakan di dalam interrupt handler karena tidak membuat proses tidur.

**Kapan menggunakan Spinlock?**

- Pilih spinlock jika bagian kode yang dilindungi sangat pendek.
- Gunakan mekanisme ini jika kamu berada dalam konteks yang melarang proses untuk tidur (*sleeping*).

```c
#include <linux/spinlock.h>

spinlock_t my_lock;
spin_lock_init(&my_lock);

// Mengunci
spin_lock(&my_lock);

/* --- CRITICAL SECTION: Mengakses data bersama --- */

// Membuka kunci
spin_unlock(&my_lock);
```

## 3. Mutex: Si Penjaga yang Sabar

**Mutex (Mutual Exclusion)** adalah mekanisme penguncian yang membuat thread tidur jika kunci tidak tersedia.

### Karakteristik Utama:

- **Sleeping Lock:** Jika kunci sedang digunakan, proses yang meminta akan dimasukkan ke dalam antrean tunggu dan CPU dialihkan untuk mengerjakan tugas lain.
- **Efisien untuk Durasi Lama:** Menghemat daya CPU jika waktu tunggu diperkirakan lama.
- **Hanya untuk Konteks Proses:** Mutex tidak boleh digunakan dalam interrupt handler karena interupsi tidak boleh tidur.

> **Analogi:** Jika spinlock adalah orang yang terus mengetuk pintu kamar mandi setiap detik sampai terbuka, mutex adalah orang yang duduk di kursi tunggu, memejamkan mata, dan meminta dipanggil jika kamar mandi sudah kosong.

```c
#include <linux/mutex.h>

struct mutex my_mutex;
mutex_init(&my_mutex);

// Mencoba mengunci (bisa membuat proses tidur)
mutex_lock(&my_mutex);

/* --- CRITICAL SECTION --- */

mutex_unlock(&my_mutex);
```

## 4. Semaphore: Mengelola Kapasitas

**Semaphore** mirip dengan mutex, namun memiliki hitungan (counter). Jika mutex hanya mengizinkan satu akses (biner), semaphore bisa mengizinkan beberapa akses sekaligus hingga batas tertentu.

### Jenis Semaphore:

1. **Binary Semaphore:** Nilainya 0 atau 1 (identik dengan mutex, namun lebih tua dan kurang dioptimasi di Linux modern).
2. **Counting Semaphore:** Digunakan untuk membatasi akses ke sumber daya yang berjumlah banyak (misalnya membatasi hanya 5 proses yang boleh mengakses database secara bersamaan).

**Persamaan Matematika Sederhana:** Jika \\(S\\) adalah nilai semaphore:

- Operasi \\(P(S)\\) (Procurar/Wait): Jika \\(S > 0\\), maka \\(S = S - 1\\). Jika \\(S = 0\\), tunggu.
- Operasi \\(V(S)\\) (Verhogen/Signal): \\(S = S + 1\\).

## 5. RCU (Read-Copy-Update): Teknik Tanpa Kunci untuk Reader

**RCU** adalah mekanisme sinkronisasi tingkat lanjut yang sangat populer di kernel Linux karena performanya yang luar biasa pada sistem dengan banyak CPU (SMP). RCU sangat efektif untuk struktur data yang sering dibaca tetapi jarang dimodifikasi (seperti routing table).

### Cara Kerja RCU:

1. **Read:** Reader mengakses data secara bebas tanpa kunci apa pun. Ini sangat cepat.
2. **Copy:** Writer tidak mengubah data di tempat. Ia menyalin data lama ke area memori baru dan mengubah salinan tersebut.
3. **Update:** Writer mengganti pointer data lama ke data baru secara atomik.
4. **Grace Period:** Data lama tidak langsung dihapus. Kernel menunggu sampai semua reader yang sedang mengakses data lama selesai, baru kemudian memori lama dibebaskan.

> **Analogi:** Seperti mengganti menu di papan tulis kafe. Kamu tidak menghapus papan saat pelanggan sedang membaca. Kamu menulis menu baru di papan lain, lalu dengan cepat menukar posisi papan tersebut saat tidak ada yang melihat secara intens. Papan lama baru dibuang setelah kamu yakin tidak ada lagi pelanggan yang melihatnya.

## Perbandingan Cepat

| Fitur | Spinlock | Mutex | RCU |
| --- | --- | --- | --- |
| **Perilaku Tunggu** | Berputar (busy wait) | Tidur (sleep) | Tidak menunggu (untuk reader) |
| **Konteks Interupsi** | Boleh | Tidak boleh | Boleh (untuk reader) |
| **Overhead** | Rendah (untuk waktu singkat) | Tinggi (karena context switch) | Sangat rendah untuk reader |
| **Kegunaan Utama** | Critical section pendek | Critical section panjang | Data yang sering dibaca |

## Implementasi Nyata: Driver Sensor Suhu

Bayangkan kamu sedang menulis driver untuk sensor suhu yang datanya dibaca oleh ribuan aplikasi setiap detik, tetapi hanya diperbarui oleh satu interrupt handler perangkat keras setiap satu menit.

- **Skenario:** Menggunakan **RCU** adalah pilihan terbaik di sini. Ribuan aplikasi (reader) dapat mengambil nilai suhu secara instan tanpa perlu mengantre kunci, sementara writer (update suhu) hanya perlu melakukan operasi copy-update sesekali.
- **Jika menggunakan Spinlock:** Ribuan aplikasi akan saling berebut kunci, menyebabkan penggunaan CPU melonjak hanya untuk menunggu giliran membaca suhu.

## Mengapa Interrupt Handler Tidak Boleh Tidur?

*Mengapa kita tidak boleh membiarkan sebuah proses tidur (menggunakan mutex) saat sedang menangani interupsi perangkat keras?*

> **Wawasan Penting:** Kernel Linux memperlakukan interupsi dengan prioritas tertinggi. Jika interrupt handler tidur, ia tidak bisa dibangunkan oleh scheduler biasa, dan sistem bisa mengalami deadlock atau macet total karena interupsi lain tidak bisa masuk. Itulah sebabnya di dalam interrupt handler, kita wajib menggunakan **spinlock** jika memerlukan sinkronisasi.
