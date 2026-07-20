## Penanganan Interupsi dan Exception: "Sistem Alarm" sang Kernel

Bayangkan kamu sedang asyik membaca buku di ruang tamu, dan tiba-tiba bel pintu berbunyi. Kamu menandai halaman buku tersebut, berdiri, membukakan pintu, menerima paket, lalu kembali duduk dan melanjutkan membaca dari baris yang sama.

Dalam arsitektur Linux, **Interupsi** adalah bel pintu tersebut. Tanpa mekanisme ini, CPU akan terjebak dalam "polling", yaitu terus-menerus memeriksa setiap perangkat keras (seperti mouse, keyboard, atau kartu jaringan) untuk melihat apakah ada data baru, yang mana sangat tidak efisien.

## 1. Definisi: Interupsi vs. Exception

Meskipun keduanya memaksa CPU untuk menghentikan aliran instruksi saat ini dan beralih ke kernel space, mereka memiliki asal-usul yang berbeda:

- **Interupsi (Asinkron)** didorong oleh hardware eksternal secara tidak terduga, misalnya saat kartu jaringan menerima paket data atau hard drive selesai menulis dokumen.
- **Exception (Sinkron)** terjadi langsung akibat eksekusi instruksi oleh CPU itu sendiri (sering disebut interupsi internal), contohnya ketika kode melakukan pembagian dengan nol \\( x / 0 \\) atau memicu *page fault*.

> **Catatan:** Interupsi berurusan dengan dunia luar, sedangkan exception menangani masalah internal saat eksekusi kode.

## 2. Mekanisme Kerja: Dari Sinyal ke Eksekusi

Bagaimana kernel tahu apa yang harus dilakukan saat interupsi datang? Jawabannya ada pada **Interrupt Descriptor Table (IDT)**.

IDT adalah sebuah tabel di memori yang berfungsi sebagai "buku alamat". Setiap jenis interupsi atau exception diberi nomor unik yang disebut **vektor**. Linux menggunakan vektor dari \\( 0 \\) hingga \\( 255 \\).

1. **Sinyal Masuk:** Hardware mengirim sinyal ke *interrupt controller*.
2. **Identifikasi:** CPU menerima sinyal dan melihat nomor vektornya.
3. **Penyimpanan Konteks:** CPU secara otomatis menyimpan register penting (seperti EIP/RIP dan stack pointer) agar bisa kembali lagi nanti.
4. **Lookup IDT:** Kernel mencari alamat fungsi penangan (handler) yang sesuai di dalam IDT.
5. **Eksekusi ISR:** Kernel menjalankan **Interrupt Service Routine (ISR)**.

## 3. Interrupt Service Routine (ISR)

ISR adalah fungsi khusus di dalam kernel yang dirancang untuk menangani interupsi tertentu. Karena ISR berjalan dalam **interrupt context**, ada aturan ketat yang harus diikuti:

- **Harus Cepat:** ISR memblokir proses lain, bahkan terkadang interupsi lainnya. Keterlambatan di sini langsung membuat sistem terasa lambat dan kurang responsif.
- **Tidak Boleh "Tidur" (Blocking):** Berada di interrupt context berarti tidak ada scheduler yang bisa memindahkan tugas. Oleh karena itu, ISR dilarang keras memanggil fungsi yang memicu *sleep*, seperti menunggu input pengguna atau mengunci mutex.
- **Reentrant:** Kode ISR harus dirancang agar aman jika interupsi yang sama terjadi lagi secara berturut-turut.

## 4. Strategi Efisiensi: Top Half dan Bottom Half

Menangani interupsi yang kompleks (seperti memproses paket data jaringan yang besar) di dalam ISR akan membuat sistem lambat. Oleh karena itu, Linux membagi penanganan menjadi dua bagian:

### A. Top Half (Bagian Atas)

Inilah ISR yang sebenarnya. Tugasnya hanya melakukan pekerjaan minimal:

- Mengirimkan sinyal pengakuan (*acknowledge*) kembali ke perangkat keras.
- Menyalin data mentah secara cepat ke dalam kernel buffer.
- Mendelegasikan sisa pekerjaan yang lebih berat ke mekanisme *Bottom Half*.
- Menyelesaikan seluruh rangkaian tindakan ini dalam hitungan mikrodetik agar CPU bisa segera kembali bekerja.

### B. Bottom Half (Bagian Bawah)

Melakukan pekerjaan berat (analisis data, pengiriman ke aplikasi). Bagian ini berjalan saat CPU lebih "santai". Ada beberapa mekanisme:

1. **Softirqs**: Sangat sensitif terhadap waktu dan dijalankan dengan prioritas tinggi, contohnya pada pemrosesan paket jaringan.
2. **Tasklets**: Dibuat di atas softirqs agar lebih mudah dipakai, namun memiliki batasan hanya bisa berjalan di satu CPU dalam satu waktu.
3. **Workqueues**: Menjalankan tugas berat di dalam *process context*, sehingga diizinkan untuk melakukan operasi blocking atau masuk ke mode *sleep*.

Sebagai analogi, bayangkan seorang koki: menerima pesanan (*Top Half*) harus cepat agar pelanggan tidak menunggu lama, sedangkan memasak pesanan tersebut (*Bottom Half*) bisa diselesaikan setelahnya.

## 5. Penanganan Exception (System Errors)

Saat terjadi exception, kernel tidak hanya merespons perangkat keras, tetapi juga menjaga stabilitas sistem.

- **Faults**: Masalah yang masih bisa diperbaiki oleh kernel. Contoh klasiknya adalah *page fault*: ketika data yang diminta ada di swap, kernel akan mengambil data tersebut ke memori fisik dan mengulangi instruksi tanpa membuat aplikasi crash.
- **Traps**: Dipicu secara sengaja untuk kebutuhan debugging atau saat aplikasi memicu *system call*. Eksekusi instruksi berikutnya akan langsung dilanjutkan begitu handler selesai bertugas.
- **Aborts**: Kegagalan fatal pada perangkat keras yang tidak bisa dipulihkan. Kernel terpaksa melakukan panic atau langsung mematikan proses yang bersangkutan demi menjaga kestabilan sistem.

## 6. Contoh Implementasi Teknis (C Code)

Berikut adalah gambaran sederhana bagaimana sebuah device driver mendaftarkan interrupt handler dalam kernel Linux:

```c
#include <linux/interrupt.h>
#include <linux/module.h>

// Fungsi ISR (Top Half)
irqreturn_t my_interrupt_handler(int irq, void *dev_id) {
    printk(KERN_INFO "Interupsi terdeteksi pada IRQ: %d\n", irq);
    
    // Memberitahu kernel bahwa interupsi telah ditangani
    return IRQ_HANDLED;
}

static int __init my_driver_init(void) {
    int irq_line = 11; // Contoh nomor IRQ
    
    // Mendaftarkan handler ke kernel
    if (request_irq(irq_line, my_interrupt_handler, IRQF_SHARED, "my_device", (void *)(my_interrupt_handler))) {
        printk(KERN_ERR "Gagal mendaftarkan IRQ\n");
        return -1;
    }
    return 0;
}

static void __exit my_driver_exit(void) {
    free_irq(11, (void *)(my_interrupt_handler));
}

module_init(my_driver_init);
module_exit(my_driver_exit);
```

## 7. Aplikasi Dunia Nyata: Pengetikan Keyboard

Mari kita lihat apa yang terjadi saat kamu menekan tombol "A" di keyboard:

1. **Sinyal Perangkat Keras**: Kontroler keyboard mendeteksi tekanan tombol dan segera mengirimkan sinyal listrik ke pin *Interrupt Request* (IRQ) pada CPU.
2. **Interupsi CPU**: Prosesor langsung menangguhkan jalannya aplikasi aktif (misalnya browser) dan merujuk ke tabel IDT.
3. **Top Half (Eksekusi Cepat)**: ISR keyboard segera berjalan untuk membaca *scancode* dari port fisik perangkat, menaruhnya di buffer, lalu langsung menyudahi tugasnya.
4. **Bottom Half (Penerjemahan)**: Kernel memproses *scancode* tersebut secara asinkron menjadi karakter 'A' dan memasukkannya ke antrean input terminal atau aplikasi yang sedang fokus.
5. **Melanjutkan Eksekusi**: Browser kembali berjalan normal, dan kamu melihat karakter 'A' muncul di layar monitormu.

Semua ini terjadi dalam hitungan milidetik, memberikan ilusi bahwa komputer melakukan segalanya secara bersamaan.

## Ringkasan Konsep

| Fitur | Interupsi (Hardware) | Exception (Software) |
| --- | --- | --- |
| **Pemicu** | Sinyal eksternal (I/O) | Instruksi CPU (Error/Trap) |
| **Sinkronisasi** | Asinkron (Kapan saja) | Sinkron (Saat instruksi dieksekusi) |
| **Tujuan Utama** | Responsivitas perangkat | Keamanan & Manajemen Error |
| **Konteks** | Interrupt Context | Process Context (umumnya) |

> **Pesan Penting:** Kemampuan Linux mengelola ribuan interupsi per detik dengan efisiensi tinggi melalui pembagian *Top/Bottom Half* adalah alasan mengapa server Linux bisa menangani trafik jaringan yang masif tanpa tumbang.
