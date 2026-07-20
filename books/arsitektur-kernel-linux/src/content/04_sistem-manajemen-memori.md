## Sistem Manajemen Memori: Sang Maestro Pengatur Ruang

Bayangkan kamu adalah pengelola gudang raksasa yang menerima ribuan paket setiap detik. Kamu harus memutuskan di mana setiap paket diletakkan, memastikan paket yang sering digunakan mudah dijangkau, dan yang terpenting: memastikan tidak ada dua pengirim yang mencoba menaruh barang di kotak yang sama.

Dalam Linux, peran penting ini dijalankan oleh **sistem manajemen memori**. Fungsinya jauh melampaui pemindahan data sederhana ke RAM; sistem ini merupakan arsitektur kompleks yang memungkinkan komputer menjalankan berbagai aplikasi dengan total kebutuhan memori melebihi kapasitas fisik RAM yang terpasang.

## 1. Konsep Virtual Memory

Mengapa aplikasi tidak langsung menulis data ke alamat fisik RAM? Jika itu terjadi, satu aplikasi yang rusak bisa menghapus data milik aplikasi lain (atau bahkan kernel), menyebabkan sistem mengalami kegagalan (*crash*) seketika.

**Virtual memory** adalah lapisan abstraksi antara aplikasi dan RAM fisik. Setiap proses di Linux berjalan seolah-olah memiliki seluruh rentang alamat memori untuk dirinya sendiri.

> **Analogi:** Bayangkan virtual memory seperti buku alamat pribadi untuk setiap penduduk kota. Setiap orang memiliki catatan alamat "Rumah No. 1". Namun, pada kenyataan fisiknya, Rumah No. 1 milik warga A terletak di Jalan Melati, sedangkan Rumah No. 1 milik warga B berada di Jalan Mawar.

### Keuntungan Virtual Memory:

1. **Isolasi Keamanan:** Setiap proses memiliki ruang steril masing-masing, sehingga Proses A tidak dapat mengintip atau mengganggu isi memori milik Proses B.
2. **Alamat yang Kontinu:** Proses melihat memori sebagai satu blok alamat yang berurutan secara logis, meskipun letak fisiknya di RAM terpencar-pencar di berbagai lokasi.
3. **Kapasitas Memori Lebih Luas:** Memungkinkan pemanfaatan *swap space* di media penyimpanan untuk bertindak sebagai RAM tambahan saat kapasitas fisik mulai menipis.

## 2. Paging: Membagi Memori Menjadi Potongan Kecil

Linux tidak mengelola memori dalam satuan bita per bita karena prosesnya akan sangat lambat. Sebagai gantinya, kernel menerapkan mekanisme **paging**.

Melalui paging, memori dibagi menjadi blok-blok berukuran tetap yang disebut **page** (biasanya sebesar \\( 4\\text{ KB} \\)).

- **Virtual Page:** Representasi ruang alamat logis yang dilihat dan diakses langsung oleh proses.
- **Page Frame:** Blok fisik nyata di dalam memori fisik (RAM) yang menjadi tempat bernaungnya data virtual page.

### Bagaimana Alamat Diterjemahkan?

Saat CPU perlu mengakses data, ia mengandalkan **Memory Management Unit (MMU)** untuk menerjemahkan alamat virtual ke alamat fisik dengan merujuk pada **page table**.

Persamaan sederhana untuk menentukan alamat fisik adalah sebagai berikut:

\\[ \\text{Alamat}_{\\text{Fisik}} = (\\text{Frame Number} \\times \\text{Page Size}) + \\text{Offset} \\]

**Proses Paging:**

1. Proses mengajukan permintaan data pada alamat virtual tertentu.
2. Kernel bertugas memeriksa entri pada *page table* untuk melihat pemetaan alamat tersebut.
3. Jika data target sudah tersedia di RAM, MMU akan langsung memberikan akses ke data.
4. Namun, jika data tidak ditemukan di RAM (masih tersimpan di disk), sistem memicu **page fault** sehingga kernel harus memuat data tersebut ke RAM terlebih dahulu.

Jika sistem terus-menerus mengalami *page fault* akibat RAM yang terlalu penuh, komputer akan terjebak dalam kondisi *thrashing*. Pada kondisi ini, sistem menghabiskan lebih banyak waktu dan daya untuk memindahkan data secara bolak-balik antara RAM dan disk ketimbang mengeksekusi instruksi aplikasi yang sesungguhnya.

## 3. Segmentasi: Perspektif Logis

Meskipun Linux modern lebih mengandalkan paging, konsep **segmentasi** tetap dipertahankan, terutama untuk menjaga kompatibilitas dengan arsitektur x86. Segmentasi membagi memori berdasarkan unit logika, seperti:

- **Code Segment:** Menyimpan seluruh instruksi biner program dan diatur dengan hak akses hanya-baca (read-only) untuk aspek keamanan.
- **Data Segment:** Menjadi tempat penyimpanan variabel global serta data statis yang digunakan sepanjang masa hidup aplikasi.
- **Stack Segment:** Digunakan secara dinamis untuk mengalokasikan variabel lokal dan melacak alamat balik pemanggilan fungsi.

Dalam arsitektur Linux, model segmentasi umumnya dibuat rata (*flat model*). Seluruh segmen menunjuk ke rentang alamat virtual yang sama, memungkinkan mekanisme paging untuk mengambil alih kendali penuh atas manajemen memori.

## 4. Alokasi Memori Kernel: SLAB dan SLUB

Di dalam kernel, berbagai objek (seperti deskriptor proses atau struktur file) sangat sering dialokasikan dan dilepaskan. Jika kernel memakai metode alokasi umum setiap kali membutuhkan memori berukuran kecil, fragmentasi memori akan cepat terjadi.

Untuk mengatasi masalah ini, Linux menerapkan **SLAB allocator** (serta penerusnya yang bernama **SLUB allocator**).

### Konsep SLAB

Cara kerja SLAB mirip dengan nampan cetakan kue. Kernel menyediakan cetakan memori khusus yang sudah memiliki slot-slot dengan ukuran presisi untuk objek tertentu.

- **Cache:** Tempat penyimpanan khusus yang didedikasikan untuk tipe objek tertentu, seperti `task_struct`.
- **Slab:** Satu atau lebih halaman memori fisik berurutan yang dibagi-bagi menjadi beberapa slot objek siap pakai.

**Mengapa SLUB?** Saat ini, **SLUB** bertindak sebagai *allocator* standar pada Linux modern. Sebagai versi yang lebih ringkas (*lean*) dibanding SLAB, ia menawarkan efisiensi tinggi pada sistem dengan banyak inti prosesor (*multi-core*) karena memangkas beban manajemen metadata yang kompleks.

> **Penting:** Mekanisme SLAB dan SLUB menjamin memori tidak sekadar dialokasikan, melainkan juga didaur ulang dengan cepat tanpa perlu mencari ruang kosong baru dari awal setiap kali objek dibuat.

## 5. Implementasi Teknis: Contoh Kode

Saat mengembangkan driver atau modul kernel, kamu tidak dapat menggunakan fungsi standar `malloc()` layaknya pada aplikasi di *user space*. Sebagai gantinya, kamu harus menggunakan fungsi khusus seperti `kmalloc()` atau `vmalloc()`.

```c
#include <linux/slab.h> // Header untuk kmalloc

struct my_device_data {
    int id;
    char name[32];
};

void example_allocation(void) {
    struct my_device_data *data;

    // Mengalokasikan memori menggunakan kmalloc (berurutan secara fisik)
    // GFP_KERNEL adalah flag yang mengizinkan kernel menunda alokasi jika memori penuh
    data = kmalloc(sizeof(struct my_device_data), GFP_KERNEL);

    if (!data) {
        printk(KERN_ERR "Gagal mengalokasikan memori!\n");
        return;
    }

    // Menggunakan memori
    data->id = 1;
    
    // Bebaskan memori setelah selesai untuk mencegah kebocoran memori (memory leak)
    kfree(data);
}
```

## 6. Aplikasi Dunia Nyata: Memahami OOM Killer

Pernahkah kamu menjalankan terlalu banyak aplikasi (seperti membuka puluhan tab peramban secara bersamaan) hingga salah satu aplikasi tiba-tiba tertutup sendiri? Peristiwa tersebut merupakan hasil kerja dari **Out-Of-Memory (OOM) Killer**.

Saat kapasitas RAM benar-benar habis dan sistem tidak lagi sanggup melakukan paging, kernel terpaksa mengambil keputusan kritis: memilih proses mana yang harus dihentikan demi menyelamatkan seluruh sistem dari kegagalan total.

**Cara Kerja OOM Killer:**

1. Kernel menghitung dan memberikan nilai `oom_score` ke setiap proses yang sedang berjalan.
2. Proses dengan konsumsi memori besar namun bukan merupakan proses sistem yang kritis akan mendapatkan skor lebih tinggi.
3. Kernel kemudian mengirimkan sinyal penutupan paksa `SIGKILL` ke proses dengan skor tertinggi agar memori segera terbebas.

## Ringkasan Singkat

- **Virtual Memory:** Memberikan ilusi ketersediaan ruang alamat yang luas, terisolasi, dan aman bagi setiap proses yang berjalan.
- **Paging:** Membagi memori ke dalam unit-unit kecil berukuran \\( 4\\text{ KB} \\) demi menyederhanakan pemetaan ke alamat fisik RAM.
- **SLAB dan SLUB:** Bertindak sebagai manajer memori internal kernel yang mengalokasikan objek-objek kecil secara efisien tanpa memicu fragmentasi.
- **Manajemen Memori:** Berperan menjaga keseimbangan dinamis antara performa kecepatan akses data dan pemanfaatan penyimpanan sekunder (*swap space*).

Di bab berikutnya, kita akan mempelajari bagaimana aplikasi berinteraksi dengan kernel melalui **System Calls: Antarmuka User-Kernel**.
