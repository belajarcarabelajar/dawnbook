## Proses Booting dan Inisialisasi Sistem: Dari Biner ke Operasional.

Bayangkan sebuah gedung pencakar langit yang gelap gulita. Proses booting adalah saat sakelar utama dinyalakan, lift mulai diprogram, petugas keamanan menempati posnya, dan akhirnya pintu depan dibuka untuk umum. Dalam dunia Linux, proses ini merupakan rangkaian alur yang sangat presisi, dimulai dari kode mesin tingkat rendah hingga terbentuknya user space yang interaktif.

Bab ini membahas perjalanan kernel Linux sejak dimuat di memori hingga menjalankan proses pertama yang mengendalikan seluruh sistem.

## 1. Titik Awal: Serah Terima dari Bootloader

Sebelum kernel mengambil kendali, **bootloader** (seperti GRUB atau systemd-boot) bertugas menyiapkan lingkungan awal. Bootloader memuat file kernel (biasanya bernama `vmlinuz`) dan file system sementara bernama **initramfs** (*initial RAM file system*) ke dalam memori RAM.

Pada titik ini, CPU masih berada dalam mode terbatas. Begitu kernel selesai dimuat, bootloader menyerahkan kendali sepenuhnya dengan melakukan lompatan (*jump*) ke alamat memori tempat kode kernel berada.

> **Analogi:** Jika sistem komputer diibaratkan sebagai pertunjukan teater, bootloader adalah kru panggung yang menyiapkan properti, sedangkan kernel adalah sutradara yang baru tiba untuk memimpin jalannya pertunjukan.

## 2. Dekompresi Kernel (Self-Extraction)

File kernel `vmlinuz` biasanya disimpan dalam keadaan terkompresi untuk menghemat ruang penyimpanan. Oleh karena itu, langkah pertama kernel saat berjalan adalah melakukan dekompresi mandiri.

- **Tahap Low-level**: Menyiapkan lingkungan eksekusi awal menggunakan kode assembly (seperti `head.S`).
- **Dekompresi**: Rutinitas dekompresi mengekstrak image kernel yang sebenarnya ke dalam memori.
- Pesan `Uncompressing Linux... Ok, booting the kernel` menandakan bahwa proses ekstraksi ini sedang berlangsung.

## 3. Fungsi start_kernel(): Jantung Inisialisasi

Setelah kernel selesai diekstrak, eksekusi beralih ke fungsi `start_kernel()` pada berkas `init/main.c`. Ini merupakan fungsi terpenting dalam arsitektur Linux karena menjadi pusat dimulainya inisialisasi seluruh subsistem kernel.

Beberapa langkah utama di dalam `start_kernel()` meliputi:

1. **Setup Arsitektur (`setup_arch`)**: Mengidentifikasi arsitektur CPU dan mendeteksi fitur spesifik perangkat keras yang digunakan.
2. **Memory Management (`mm_init`)**: Langkah ini membangun *page table* serta menginisialisasi *memory allocator* seperti Buddy System dan SLAB.
3. **Interrupt Handling (`trap_init` & `init_IRQ`)**: Menyiapkan mekanisme bagi perangkat keras untuk mengirimkan sinyal interupsi ke kernel.
4. **Scheduler (`sched_init`)**: Menginisialisasi *scheduler* utama agar sistem dapat mendukung multitasking.
5. Fungsi `time_init()` akan mengalibrasi *system clock* untuk menjaga sinkronisasi waktu internal.

Sebagai ilustrasi, jika kernel gagal melakukan inisialisasi *memory management*, setiap aplikasi akan saling tumpang dian dalam RAM, memicu kegagalan sistem secara instan.

## 4. Mounting Root File System dan Initramfs

Sebelum kernel dapat menjalankan program apa pun, akses ke *file system* mutlak diperlukan. Di sini muncul masalah klasik: driver untuk membaca media penyimpanan sering kali disimpan di dalam media penyimpanan itu sendiri.

Untuk mengatasi kendala tersebut, Linux memanfaatkan **initramfs**:

- **Initramfs** merupakan *file system* minimal yang dimuat langsung ke RAM oleh bootloader.
- Kernel menggunakan lingkungan sementara ini untuk memuat driver esensial, seperti driver NVMe atau RAID.
- Setelah driver penyimpanan aktif, kernel menjalankan **switch root** untuk memindahkan direktori root (`/`) ke partisi *file system* utama di harddisk (misalnya ext4 atau xfs).

## 5. Kelahiran Proses Pertama: PID 1

Begitu inisialisasi selesai, kernel memanggil fungsi `rest_init()`. Fungsi ini membuat sebuah *kernel thread* baru yang ditugaskan menjadi **Proses Nomor 1 (PID 1)**.

Kernel mencari file eksekusi init secara berurutan pada lokasi berikut:

1. `/sbin/init`
2. `/etc/init`
3. `/bin/init`
4. `/bin/sh` (digunakan sebagai cadangan terakhir)

> **Catatan Penting:** PID 1 merupakan induk dari seluruh proses yang berjalan di Linux. Jika PID 1 terhenti atau gagal dieksekusi, sistem akan langsung mengalami **kernel panic**.

## Aplikasi Praktis: Menganalisis Urutan Booting

Sebagai administrator sistem atau pengembang kernel, kamu perlu memantau proses inisialisasi ini untuk memastikan semua berjalan lancar.

### Membaca Log Menggunakan Perintah dmesg

Kamu bisa membaca log tersebut melalui perintah:

```bash
dmesg | less
```

Output perintah ini menampilkan catatan waktu (dalam detik) terhitung sejak booting dimulai:

```
[    0.000000] Linux version 5.15.0-generic ...
[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0 root=UUID=... ro quiet splash
[    0.542103] Initializing cgroup subsys cpu
[    1.234567] pci 0000:00:01.0: [8086:1901] type 00 class 0x060400
```

### Memeriksa Proses PID 1

Kamu dapat memverifikasi bahwa proses pertama yang berjalan pada distribusi modern umumnya adalah `systemd`:

```bash
ps -p 1 -o comm=
# Output: systemd
```

## Alur Proses Booting secara Ringkas

1. **Power On**: BIOS/UEFI menjalankan POST (Power-On Self-Test) untuk memeriksa kesiapan perangkat keras.
2. **Bootloader**: GRUB memuat kernel Linux beserta `initramfs` ke memori RAM.
3. **Dekompresi kernel**: Kernel membongkar dirinya sendiri secara mandiri di RAM.
4. **Inisialisasi subsistem**: Fungsi `start_kernel()` mengaktifkan alokasi memori, scheduler, CPU, dan interrupt handler.
5. **Memuat driver**: Kernel membaca modul driver esensial dari initramfs.
6. **Mount root**: Sistem beralih ke partisi *root file system* yang sesungguhnya di disk.
7. **Eksekusi init**: Kernel menjalankan program `/sbin/init` sebagai PID 1.
8. Layanan sistem lainnya (jaringan, GUI, daemon) mulai dijalankan oleh PID 1 di tingkat user space.

## Hambatan Sistem: Kernel Panic

Apabila salah satu tahapan di atas gagal (misalnya karena kernel tidak mendeteksi root partition atau berkas init mengalami kerusakan), sistem tidak dapat melanjutkan proses.

\\\\[
\\\\text{Fungsi Init Gagal} \\\\rightarrow \\\\text{panic('No working init found. Try passing init= bootarg.')}
\\\\]

Pada kode sumber kernel, jika panggilan `kernel_execve` gagal mengeksekusi `init`, sistem akan langsung menghentikan seluruh aktivitas. Kondisi kegagalan fatal inilah yang disebut sebagai **kernel panic**.

Kejadian kernel panic yang ditandai dengan layar hitam dan pesan error saat proses boot biasanya disebabkan oleh kegagalan kernel dalam melakukan switch root atau adanya kerusakan pada struktur file system.

## Kesimpulan

Memahami proses booting membantu kita mengerti hierarki kendali di dalam sistem operasi, melampaui sekadar mengetahui cara komputer menyala. Kernel Linux bekerja dengan sangat efisien pada detik-detik awal peluncuran untuk memastikan bahwa saat kamu melihat layar login, seluruh infrastruktur sistem di bawahnya telah siap melayani perintahmu.
