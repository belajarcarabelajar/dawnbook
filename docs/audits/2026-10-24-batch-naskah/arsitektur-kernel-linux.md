# Arsitektur Kernel Linux

`books/arsitektur-kernel-linux`: 86 temuan.


## `books/arsitektur-kernel-linux/src/content/01_pengantar-arsitektur-kernel-linux.md`

- **Salah ketik**: “hard drive or SSD”
  - Usulan: “hard drive atau SSD”
  - Catatan: Kata "or" dalam bahasa Inggris tertinggal di kalimat berbahasa Indonesia.
- **Salah ketik**: “### Hirarki Sistem”
  - Usulan: “### Hierarki Sistem”
  - Catatan: Bentuk baku menurut KBBI adalah "hierarki".
- **Fakta meragukan**: “Program ini merupakan bagian pertama yang dimuat ke dalam memori saat komputer melakukan *booting*”
  - Usulan: “Program ini dimuat ke dalam memori oleh *bootloader* saat komputer melakukan *booting*”
  - Catatan: Firmware (BIOS/UEFI) dan bootloader dimuat lebih dahulu, sehingga kernel bukan program pertama yang dimuat.
- **Fakta meragukan**: “Lisensi ini membebaskan siapa saja untuk membaca, memodifikasi, dan mendistribusikan ulang kode sumber secara gratis.”
  - Usulan: “Lisensi ini membebaskan siapa saja untuk membaca, memodifikasi, dan mendistribusikan ulang kode sumber, dengan syarat turunannya tetap dirilis di bawah lisensi yang sama.”
  - Catatan: "Free" pada GPL bermakna kebebasan, bukan gratis. Distribusi ulang boleh dikenai biaya.
- **Fakta meragukan**: “mayoritas perangkat Android”
  - Usulan: “seluruh perangkat Android”
  - Catatan: Semua perangkat Android memakai kernel Linux. Kata "mayoritas" menyesatkan; mungkin maksudnya mayoritas perangkat seluler.
- **Istilah tidak konsisten**: “2. **Memory Management**: Mengalokasikan ruang RAM”
  - Usulan: “2. **Memori**: Mengalokasikan ruang RAM”
  - Catatan: Butir lain dalam daftar yang sama memakai nama komponen (CPU, Perangkat Keras), sedangkan butir ini memakai nama fungsi berbahasa Inggris.
- **Istilah tidak konsisten**: “memfasilitasi pembacaan dokumen dari media penyimpanan”
  - Usulan: “memfasilitasi pembacaan dan penulisan file pada media penyimpanan”
  - Catatan: Istilah "dokumen" tidak konsisten dengan "file"/"berkas" yang dipakai di bagian lain. Sistem berkas juga menangani penulisan, bukan hanya pembacaan.
- **Istilah tidak konsisten**: “Apakah aplikasi ini memiliki izin untuk membaca berkas tersebut?”
  - Usulan: “Apakah aplikasi ini memiliki izin untuk membaca file tersebut?”
  - Catatan: Bab ini bergantian memakai "file" dan "berkas". Sebaiknya pilih satu istilah secara konsisten.

## `books/arsitektur-kernel-linux/src/content/02_struktur-monolitik-dan-filosofi-desain.md`

- **Fakta meragukan**: “sehingga meminimalkan latensi komunikasi antar-komponen (IPC)”
  - Usulan: “sehingga komunikasi antar-komponen cukup melalui pemanggilan fungsi langsung tanpa memerlukan IPC”
  - Catatan: Di kernel monolitik, komponen berkomunikasi lewat pemanggilan fungsi langsung. IPC/message passing justru ciri mikrokernel (lihat tabel di bab ini), jadi kalimat ini rancu.
- **Fakta meragukan**: “modul tersebut dapat dilepas dari memori untuk menghemat ruang penyimpanan”
  - Usulan: “modul tersebut dapat dilepas dari memori untuk menghemat penggunaan memori (RAM)”
  - Catatan: Melepas modul membebaskan memori, bukan ruang penyimpanan. Berkas modul tetap ada di disk.
- **Fakta meragukan**: “ukuran file kernelmu akan membengkak hingga gigabyte”
  - Usulan: “ukuran file kernelmu akan membengkak berkali-kali lipat”
  - Catatan: Klaim ukuran hingga gigabyte berlebihan dan meragukan untuk image kernel yang menyertakan semua driver.
- **Tata bahasa**: “Administrator sistem dapat menyetel parameter internal secara langsung karena komponen yang saling terhubung”
  - Usulan: “Administrator sistem dapat menyetel parameter internal secara langsung karena komponen-komponennya saling terhubung”
  - Catatan: Klausa setelah 'karena' tidak lengkap karena tidak memiliki predikat.
- **Fakta meragukan**: “seluruh sistem operasi berjalan di dalam **kernel space**”
  - Usulan: “seluruh layanan inti sistem operasi berjalan di dalam **kernel space**”
  - Catatan: Tidak seluruh sistem operasi berjalan di kernel space. Aplikasi dan utilitas tetap berjalan di user space.
- **Kalimat rancu**: “Compiler mampu melakukan optimasi pada seluruh kode kernel secara menyeluruh”
  - Usulan: “Compiler mampu mengoptimasi kode kernel secara menyeluruh”
  - Catatan: Kalimat ini redundan karena 'seluruh' dan 'secara menyeluruh' bermakna sama.

## `books/arsitektur-kernel-linux/src/content/03_manajemen-proses-dan-task-scheduling.md`

- **Tata bahasa**: “Hubungan hierarkis antar-proses dalam sistem.”
  - Usulan: “Hubungan hierarkis antarproses dalam sistem.”
  - Catatan: Menurut PUEBI, bentuk terikat "antar" ditulis serangkai dengan kata dasar yang mengikutinya.
- **Tata bahasa**: “mempengaruhi seberapa cepat”
  - Usulan: “memengaruhi seberapa cepat”
  - Catatan: Bentuk baku menurut KBBI adalah "memengaruhi" karena fonem /p/ luluh.
- **Fakta meragukan**: “Sejak kernel 2.6.23, Linux menggunakan **CFS** sebagai algoritma penjadwalan default.”
  - Usulan: “Sejak kernel 2.6.23 hingga 6.5, Linux menggunakan **CFS** sebagai algoritma penjadwalan default; mulai kernel 6.6, perannya digantikan oleh EEVDF.”
  - Catatan: Klaim ini sudah usang. Sejak Linux 6.6, CFS digantikan oleh scheduler EEVDF.
- **Fakta meragukan**: “Hal ini memungkinkan pencarian dengan kompleksitas waktu $O(\log n)$”
  - Usulan: “Hal ini memungkinkan penyisipan dan penghapusan dengan kompleksitas waktu $O(\log n)$, sementara proses dengan vruntime terkecil (simpul paling kiri) disimpan dalam cache sehingga dapat diambil secara instan”
  - Catatan: CFS menyimpan simpul paling kiri dalam cache (rb_leftmost), sehingga pemilihan proses berikutnya bersifat O(1). Yang berkompleksitas O(log n) adalah operasi penyisipan dan penghapusan.
- **Kalimat rancu**: “| **context switching** | Proses menyimpan status CPU saat ini dan memuat status proses lain untuk multitasking. |”
  - Usulan: “| **context switching** | Mekanisme kernel untuk menyimpan status CPU dari proses yang sedang berjalan lalu memuat status proses lain demi multitasking. |”
  - Catatan: Kata "Proses" di awal ambigu: bisa dibaca sebagai "proses (task)" yang melakukan penyimpanan. Padahal yang melakukannya adalah kernel.
- **Kalimat rancu**: “Kegagalan scheduler dalam hitungan detik saja dapat membuat seluruh sistem terasa membeku”
  - Usulan: “Kegagalan scheduler bahkan dalam hitungan milidetik saja dapat membuat seluruh sistem terasa tersendat”
  - Catatan: Skala waktu "detik" tidak sesuai dengan cara kerja scheduler, yang mengambil keputusan dalam orde mikro- hingga milidetik. Akibatnya, klaim ini rancu.
- **Istilah tidak konsisten**: “Kernel melacak status setiap tugas menggunakan flag dalam `task_struct`:”
  - Usulan: “Kernel melacak status setiap task menggunakan flag dalam `task_struct`:”
  - Catatan: Di bagian sebelumnya istilah yang diperkenalkan adalah "task". Penggunaan "tugas" di sini tidak konsisten.

## `books/arsitektur-kernel-linux/src/content/04_sistem-manajemen-memori.md`

- **Fakta meragukan**: “Kernel bertugas memeriksa entri pada *page table* untuk melihat pemetaan alamat tersebut.”
  - Usulan: “MMU memeriksa entri pada *page table* (dibantu TLB) untuk melihat pemetaan alamat tersebut.”
  - Catatan: Penerjemahan alamat dan penelusuran page table dilakukan oleh perangkat keras MMU. Kernel baru terlibat saat terjadi page fault. Langkah ini juga bertentangan dengan paragraf sebelumnya yang menyebut MMU.
- **Fakta meragukan**: “GFP_KERNEL adalah flag yang mengizinkan kernel menunda alokasi jika memori penuh”
  - Usulan: “GFP_KERNEL adalah flag yang mengizinkan alokasi untuk tidur (blocking) sambil kernel berusaha membebaskan memori”
  - Catatan: Makna GFP_KERNEL adalah alokasi boleh tidur atau memblokir, bukan sekadar 'menunda'. Penjelasan yang tepat ini penting agar pembaca tahu bahwa flag tersebut tidak boleh dipakai di konteks atomik.
- **Fakta meragukan**: “mengalokasikan objek-objek kecil secara efisien tanpa memicu fragmentasi”
  - Usulan: “mengalokasikan objek-objek kecil secara efisien dan mengurangi fragmentasi”
  - Catatan: SLAB/SLUB menekan fragmentasi tetapi tidak menghilangkannya sama sekali, jadi klaim 'tanpa memicu fragmentasi' berlebihan.
- **Istilah tidak konsisten**: “Membagi memori ke dalam unit-unit kecil berukuran $4\text{ KB}$ demi”
  - Usulan: “Membagi memori ke dalam unit-unit kecil berukuran tetap (umumnya 4 KB) demi”
  - Catatan: Di bagian 2 ukuran page disebut 'biasanya' 4 KB, sedangkan ringkasan menyajikannya seolah selalu 4 KB. Padahal ada pula huge page dan arsitektur dengan ukuran page lain.

## `books/arsitektur-kernel-linux/src/content/05_system-calls-antarmuka-user-kernel.md`

- **Tata bahasa**: “koordinasi antara software and hardware”
  - Usulan: “koordinasi antara software dan hardware”
  - Catatan: Konjungsi bahasa Inggris "and" tercampur dalam kalimat berbahasa Indonesia.
- **Fakta meragukan**: “syscall(SYS_write, 1, pesan, 35);”
  - Usulan: “syscall(SYS_write, 1, pesan, 34);”
  - Catatan: Panjang string "Memanggil kernel secara langsung!\n" adalah 34 byte. Nilai 35 ikut menulis karakter null ke stdout.
- **Fakta meragukan**: “memuat pustaka sistem `/etc/ld.so.cache`”
  - Usulan: “membaca berkas cache pustaka `/etc/ld.so.cache`”
  - Catatan: ld.so.cache bukan pustaka. Berkas ini adalah cache daftar lokasi pustaka bersama yang dibaca oleh dynamic linker.
- **Fakta meragukan**: “atau menunda eksekusi (`sleep()`)”
  - Usulan: “atau menunda eksekusi (`nanosleep()`)”
  - Catatan: Di Linux, sleep() adalah fungsi pustaka. System call yang sebenarnya adalah nanosleep/clock_nanosleep.
- **Istilah tidak konsisten**: “### Menggunakan C Standard Library (Standard API)”
  - Usulan: “### Menggunakan Standard C Library (Standard API)”
  - Catatan: Sebelumnya bab ini memakai istilah "Standard C Library (glibc)". Sebaiknya pakai satu istilah secara konsisten.

## `books/arsitektur-kernel-linux/src/content/06_penanganan-interupsi-dan-exception.md`

- **Fakta meragukan**: “**Lookup IDT:** Kernel mencari alamat fungsi penangan (handler) yang sesuai di dalam IDT.”
  - Usulan: “**Lookup IDT:** CPU secara otomatis menggunakan nomor vektor sebagai indeks ke IDT untuk menemukan alamat fungsi penangan (handler) yang sesuai.”
  - Catatan: Pencarian entri IDT dilakukan oleh perangkat keras CPU berdasarkan nomor vektor, bukan oleh kode kernel.
- **Fakta meragukan**: “**Reentrant:** Kode ISR harus dirancang agar aman jika interupsi yang sama terjadi lagi secara berturut-turut.”
  - Usulan: “**Tidak Perlu Reentrant:** Saat sebuah handler berjalan, Linux menonaktifkan jalur IRQ yang sama di semua CPU, sehingga handler tidak akan dipanggil bersarang oleh interupsi yang sama. Meski begitu, data yang dipakai bersama tetap harus dilindungi dengan spinlock.”
  - Catatan: Di Linux, interrupt handler tidak perlu reentrant karena jalur IRQ yang sama di-mask selama handler berjalan.
- **Fakta meragukan**: “segera mengirimkan sinyal listrik ke pin *Interrupt Request* (IRQ) pada CPU”
  - Usulan: “segera mengirimkan sinyal *Interrupt Request* (IRQ) ke *interrupt controller* (misalnya APIC), yang kemudian meneruskannya ke CPU”
  - Catatan: Perangkat tidak terhubung langsung ke pin CPU. Bagian 2 bab ini juga menyebut sinyal dikirim ke interrupt controller, sehingga keterangan ini tidak konsisten.
- **Istilah tidak konsisten**: “| Fitur | Interupsi (Hardware) | Exception (Software) |”
  - Usulan: “| Fitur | Interupsi (Eksternal) | Exception (Internal CPU) |”
  - Catatan: Exception dibangkitkan oleh CPU saat mengeksekusi instruksi. Bab ini juga menyebutnya 'interupsi internal', jadi label 'Software' menyesatkan dan tidak konsisten.
- **Kalimat rancu**: “Saat terjadi exception, kernel tidak hanya merespons perangkat keras, tetapi juga menjaga stabilitas sistem.”
  - Usulan: “Saat terjadi exception, kernel harus menangani kondisi yang muncul dari eksekusi instruksi sekaligus menjaga stabilitas sistem.”
  - Catatan: Exception bukan respons terhadap perangkat keras eksternal, sehingga kalimat ini membingungkan dan bertentangan dengan Bagian 1.
- **Tata bahasa**: “untuk melihat apakah ada data baru, yang mana sangat tidak efisien.”
  - Usulan: “untuk melihat apakah ada data baru. Cara ini sangat tidak efisien.”
  - Catatan: Penggunaan 'yang mana' sebagai penghubung relatif tidak baku dalam bahasa Indonesia.

## `books/arsitektur-kernel-linux/src/content/07_virtual-file-system-vfs.md`

- **Fakta meragukan**: “Menulis ulang superblock ke disk (`write_super`)”
  - Usulan: “Menyinkronkan data file system ke disk (`sync_fs`)”
  - Catatan: Operasi `write_super` sudah dihapus dari `super_operations` sejak kernel 3.6. Fungsi sinkronisasi kini ditangani oleh `sync_fs`.
- **Fakta meragukan**: “fungsi `ext4_file_read()` akan dipanggil”
  - Usulan: “fungsi `ext4_file_read_iter()` akan dipanggil”
  - Catatan: Kernel ext4 tidak memiliki fungsi `ext4_file_read()`. Pembacaan ditangani lewat `read_iter`, yaitu `ext4_file_read_iter`.
- **Fakta meragukan**: “int (*iterate) (struct file *, struct dir_context *);”
  - Usulan: “int (*iterate_shared) (struct file *, struct dir_context *);”
  - Catatan: Anggota `iterate` sudah dihapus dari kernel terbaru. Penggantinya adalah `iterate_shared`.
- **Fakta meragukan**: “VFS secara otomatis akan mengenali dan menggunakan "MyFS" selama fungsi-fungsi di atas terdaftar dengan benar.”
  - Usulan: “VFS akan dapat menggunakan "MyFS" setelah file system tersebut didaftarkan melalui `register_filesystem()` dan operasi-operasi di atas dipasang pada inode/file yang bersangkutan.”
  - Catatan: Mendefinisikan `file_operations` saja tidak cukup agar VFS mengenali file system. File system harus didaftarkan terlebih dahulu dengan `register_filesystem` dan `file_system_type`.
- **Tata bahasa**: “Dentry bertindak menghubungkan nama file”
  - Usulan: “Dentry bertindak sebagai penghubung antara nama file”
  - Catatan: Kata "bertindak" perlu diikuti "sebagai" beserta nomina agar kalimatnya gramatikal.
- **Tata bahasa**: “mulai dari teks editor hingga web browser”
  - Usulan: “mulai dari editor teks hingga web browser”
  - Catatan: Bahasa Indonesia memakai susunan diterangkan–menerangkan, jadi yang tepat "editor teks".
- **Istilah tidak konsisten**: “Kamu cukup menghubungkan kabel charger ke adaptor ini”
  - Usulan: “Kamu cukup menghubungkan kabel pengisi daya ke adaptor ini”
  - Catatan: Paragraf sebelumnya memakai istilah "pengisi daya", sedangkan kalimat ini memakai "charger".
- **Istilah tidak konsisten**: “Aplikasi membaca folder jarak jauh ini”
  - Usulan: “Aplikasi membaca direktori jarak jauh ini”
  - Catatan: Bab ini konsisten memakai istilah "direktori", termasuk pada kalimat sebelumnya, sehingga "folder" sebaiknya diseragamkan.

## `books/arsitektur-kernel-linux/src/content/08_arsitektur-device-driver.md`

- **Istilah tidak konsisten**: “inti dari sebuah driver karakter adalah struktur data”
  - Usulan: “inti dari sebuah character driver adalah struktur data”
  - Catatan: Di bagian lain bab ini selalu dipakai istilah "character driver", jadi sebaiknya istilahnya diseragamkan.
- **Kalimat rancu**: “misalnya menghindari gerakan berlebih pada *head* mekanis piringan hard disk”
  - Usulan: “misalnya menggabungkan dan mengurutkan permintaan agar penulisan lebih efisien”
  - Catatan: Skenario ini membahas USB flash drive, yang tidak memiliki head mekanis. Contoh hard disk di sini membingungkan pembaca.
- **Fakta meragukan**: “*Device driver* beroperasi sepenuhnya di dalam *Kernel Space*.”
  - Usulan: “Sebagian besar *device driver* beroperasi di dalam *Kernel Space*.”
  - Catatan: Ada juga driver yang berjalan di user space, misalnya melalui UIO, libusb, atau FUSE. Klaim "sepenuhnya" terlalu mutlak.

## `books/arsitektur-kernel-linux/src/content/09_networking-stack-di-dalam-kernel.md`

- **Fakta meragukan**: “mengambil paket secara kolektif langsung dari memori NIC”
  - Usulan: “mengambil paket secara kolektif dari ring buffer di RAM yang telah diisi NIC melalui DMA”
  - Catatan: Dengan DMA, NIC menulis paket ke ring buffer di memori utama, sehingga polling NAPI membaca dari RAM, bukan dari memori internal NIC.
- **Fakta meragukan**: “lalu menyalin data dari buffer DMA (Direct Memory Access) kartu jaringan ke memori utama (RAM) sistem”
  - Usulan: “lalu mengaitkannya dengan buffer DMA (Direct Memory Access) di memori utama (RAM) yang sudah berisi data paket”
  - Catatan: Buffer DMA sudah berada di RAM. Driver modern umumnya membungkus buffer itu ke dalam skb tanpa menyalin ulang. Kalimat ini juga bertentangan dengan klaim zero-copy di bagian sebelumnya.
- **Istilah tidak konsisten**: “menggunakan mekanisme interupsi NAPI”
  - Usulan: “menggunakan mekanisme polling NAPI”
  - Catatan: Di bagian 3A, NAPI dijelaskan sebagai mekanisme yang menonaktifkan interupsi dan beralih ke polling. Menyebutnya 'mekanisme interupsi' tidak konsisten dengan penjelasan tersebut.
- **Istilah tidak konsisten**: “dengan sistem panggilan (*system call*)”
  - Usulan: “dengan panggilan sistem (*system call*)”
  - Catatan: Padanan baku untuk system call adalah 'panggilan sistem'. Susunan 'sistem panggilan' membalik makna.
- **Istilah tidak konsisten**: “memanggil sistem panggilan seperti”
  - Usulan: “memanggil panggilan sistem seperti”
  - Catatan: Padanan baku untuk system call adalah 'panggilan sistem'.
- **Kalimat rancu**: “tantangan utama bagi kernel adalah efisiensi pemrosesan jutaan paket per detik secara efisien”
  - Usulan: “tantangan utama bagi kernel adalah memproses jutaan paket per detik secara efisien”
  - Catatan: Kata 'efisiensi' dan 'secara efisien' muncul berulang dalam satu kalimat sehingga kalimat menjadi rancu.
- **Salah ketik**: “Frame Framing”
  - Usulan: “Framing”
  - Catatan: Kata 'Frame' dan 'Framing' bermakna sama, sehingga frasa ini redundan.

## `books/arsitektur-kernel-linux/src/content/10_mekanisme-sinkronisasi-kernel.md`

- **Fakta meragukan**: “Operasi $P(S)$ (Procurar/Wait)”
  - Usulan: “Operasi $P(S)$ (Proberen/Wait)”
  - Catatan: Huruf P pada notasi Dijkstra berasal dari bahasa Belanda "proberen" (mencoba), sepasang dengan "verhogen" untuk V. "Procurar" adalah kata Spanyol/Portugis dan tidak berkaitan dengan notasi ini.
- **Tata bahasa**: “Di saat yang hampir bersamaan”
  - Usulan: “Pada saat yang hampir bersamaan”
  - Catatan: Untuk keterangan waktu, preposisi yang tepat adalah "pada"; "di" dipakai untuk keterangan tempat.
- **Fakta meragukan**: “Nilainya 0 atau 1 (identik dengan mutex, namun lebih tua dan kurang dioptimasi di Linux modern).”
  - Usulan: “Nilainya 0 atau 1 (mirip dengan mutex, tetapi tanpa konsep kepemilikan kunci, lebih tua, dan kurang dioptimasi di Linux modern).”
  - Catatan: Semafor biner tidak identik dengan mutex. Mutex memiliki kepemilikan: hanya pemegang kunci yang boleh membukanya. Semafor tidak memiliki aturan ini.
- **Kalimat rancu**: “Writer mengganti pointer data lama ke data baru secara atomik.”
  - Usulan: “Writer mengalihkan pointer dari data lama ke data baru secara atomik.”
  - Catatan: Susunan kalimat asli rancu: tidak jelas apakah yang diganti pointer-nya atau datanya.
- **Kalimat rancu**: “lalu dengan cepat menukar posisi papan tersebut saat tidak ada yang melihat secara intens”
  - Usulan: “lalu dengan cepat menukar posisi papan tersebut”
  - Catatan: Frasa "saat tidak ada yang melihat secara intens" membingungkan. Frasa ini juga menyesatkan, karena pada RCU penggantian pointer dilakukan tanpa menunggu pembaca berhenti. Penantian baru terjadi saat grace period sebelum data lama dibebaskan.
- **Istilah tidak konsisten**: “proses yang meminta akan dimasukkan ke dalam antrean tunggu”
  - Usulan: “thread yang meminta akan dimasukkan ke dalam antrean tunggu”
  - Catatan: Judul dan definisi bagian ini memakai istilah "thread", tetapi butir ini berganti ke "proses". Sebaiknya istilah diseragamkan.

## `books/arsitektur-kernel-linux/src/content/11_keamanan-kernel-namespaces-dan-cgroups.md`

- **Fakta meragukan**: “Dengan Cgroups, kernel memastikan distribusi ini ditepati dengan presisi milidetik.”
  - Usulan: “Dengan Cgroups, kernel membagi waktu CPU secara proporsional sesuai bobot tersebut ketika terjadi perebutan CPU.”
  - Catatan: Bobot CPU (cpu.weight/shares) hanya berlaku proporsional saat CPU diperebutkan. Klaim 'presisi milidetik' berlebihan dan tidak akurat.
- **Istilah tidak konsisten**: “**BlkIO Controller:** Membatasi bandwidth saat mengakses disk (Input/Output).”
  - Usulan: “**IO Controller (blkio di Cgroups v1):** Membatasi bandwidth saat mengakses disk (Input/Output).”
  - Catatan: Nama 'blkio' hanya ada di v1. Di Cgroups v2, yang dipakai pada contoh praktik bab ini, controller tersebut bernama 'io'.
- **Fakta meragukan**: “peretas yang mendapatkan akses "root" di dalam container tetap tidak memiliki kekuatan untuk merusak host kernel.”
  - Usulan: “peretas yang mendapatkan akses "root" di dalam container tidak otomatis memiliki hak root di host system.”
  - Catatan: Klaim ini terlalu absolut dan bertentangan dengan bagian akhir bab yang mengakui bahwa eksploitasi bug kernel tetap mungkin terjadi.
- **Kalimat rancu**: “Namespaces tidak selalu dapat melindunginya”
  - Usulan: “Namespaces tidak selalu dapat melindungi host system”
  - Catatan: Kata ganti '-nya' ambigu dan seolah merujuk pada proses penyerang, padahal yang dimaksud adalah host atau sistem.
- **Istilah tidak konsisten**: “Namespaces membungkus resource system global”
  - Usulan: “Namespaces membungkus resource sistem global”
  - Catatan: Bab mencampur 'system' dan 'sistem' (misalnya 'kestabilan system', 'CPU system' di satu tempat, tetapi 'integritas sistem' di tempat lain). Sebaiknya diseragamkan menjadi 'sistem'.
- **Istilah tidak konsisten**: “demi menjaga kestabilan system”
  - Usulan: “demi menjaga kestabilan sistem”
  - Catatan: Penggunaan istilah tidak konsisten dengan 'sistem' di bagian lain bab.
- **Istilah tidak konsisten**: “seluruh memori atau CPU system”
  - Usulan: “seluruh memori atau CPU sistem”
  - Catatan: Penggunaan istilah tidak konsisten dengan 'sistem' di bagian lain bab.
- **Kalimat rancu**: “Virtual Machine (VM) yang berat dan memakan banyak kernel resource”
  - Usulan: “Virtual Machine (VM) yang berat karena masing-masing menjalankan kernel dan sistem operasinya sendiri”
  - Catatan: Frasa 'memakan banyak kernel resource' kabur. Beban VM berasal dari kernel dan OS terpisah pada setiap VM.

## `books/arsitektur-kernel-linux/src/content/12_proses-booting-dan-inisialisasi-sistem.md`

- **Fakta meragukan**: “Pesan `Uncompressing Linux... Ok, booting the kernel` menandakan bahwa proses ekstraksi ini sedang berlangsung.”
  - Usulan: “Pesan `Uncompressing Linux... done, booting the kernel.` menandakan bahwa proses ekstraksi telah selesai dan kernel mulai dijalankan.”
  - Catatan: Teks pesan aslinya memakai "done". Pesan ini juga menandai bahwa dekompresi sudah selesai, bukan sedang berlangsung.
- **Tata bahasa**: “Rutinitas dekompresi mengekstrak image kernel”
  - Usulan: “Rutin dekompresi mengekstrak image kernel”
  - Catatan: "Rutinitas" berarti kebiasaan sehari-hari. Padanan istilah *routine* dalam pemrograman adalah "rutin".
- **Fakta meragukan**: “setiap aplikasi akan saling tumpang tindih di dalam RAM, memicu kegagalan sistem secara instan”
  - Usulan: “kernel tidak dapat mengalokasikan memori sehingga proses boot berhenti, bahkan sebelum aplikasi apa pun sempat dijalankan”
  - Catatan: Inisialisasi memori terjadi sebelum ada aplikasi user space, jadi ilustrasi aplikasi yang saling tumpang tindih keliru.
- **Fakta meragukan**: “Setelah driver penyimpanan aktif, kernel menjalankan **switch root**”
  - Usulan: “Setelah driver penyimpanan aktif, program init di dalam initramfs menjalankan **switch root**”
  - Catatan: switch_root dijalankan oleh program user space di initramfs, bukan langsung oleh kernel.
- **Fakta meragukan**: “Kernel menggunakan lingkungan sementara ini untuk memuat driver esensial”
  - Usulan: “Program di dalam lingkungan sementara ini (misalnya udev atau skrip init initramfs) memuat driver esensial”
  - Catatan: Pemuatan modul dari initramfs dilakukan oleh program user space awal, bukan oleh kernel secara langsung.
- **Salah ketik**: “di harddisk (misalnya ext4 atau xfs)”
  - Usulan: “di hard disk (misalnya ext4 atau XFS)”
  - Catatan: Penulisan yang benar adalah "hard disk" (atau "diska keras"). Nama file system ditulis XFS.
- **Kalimat rancu**: “Kamu bisa membaca log tersebut melalui perintah:”
  - Usulan: “Kamu bisa membaca log kernel (kernel ring buffer) melalui perintah:”
  - Catatan: "Log tersebut" tidak merujuk ke apa pun yang disebut sebelumnya.
- **Fakta meragukan**: “jika panggilan `kernel_execve` gagal mengeksekusi `init`, sistem akan langsung menghentikan seluruh aktivitas”
  - Usulan: “jika `kernel_execve` gagal mengeksekusi semua kandidat init secara berurutan, sistem akan menghentikan seluruh aktivitas”
  - Catatan: Kernel mencoba kandidat berikutnya lebih dahulu. Panic "No working init found" baru terjadi setelah semua kandidat gagal.
- **Istilah tidak konsisten**: “Kernel mencari file eksekusi init”
  - Usulan: “Kernel mencari berkas eksekusi init”
  - Catatan: Bab ini memakai "file" dan "berkas" secara bergantian. Sebaiknya pilih salah satu dan gunakan secara konsisten.

## `books/arsitektur-kernel-linux/src/content/13_referensi.md`

- **Fakta meragukan**: “Stancevic, O. (2016). Namespaces in operation: Part 7: Network namespaces.”
  - Usulan: “Edge, J. (2014). Namespaces in operation, part 7: Network namespaces.”
  - Catatan: Artikel LWN 580893 ditulis oleh Jake Edge dan terbit Januari 2014, bukan oleh Stancevic pada 2016.
- **Fakta meragukan**: “Wright, C. P., Martino, M., & Zadok, E. (2003). Linux security modules: General security support for the Linux kernel. *Proceedings of the 11th USENIX Security Symposium*”
  - Usulan: “Wright, C., Cowan, C., Smalley, S., Morris, J., & Kroah-Hartman, G. (2002). Linux security modules: General security support for the Linux kernel. *Proceedings of the 11th USENIX Security Symposium*”
  - Catatan: Makalah LSM ditulis oleh Wright, Cowan, Smalley, Morris, dan Kroah-Hartman. Simposium ke-11 itu berlangsung pada 2002.
- **Fakta meragukan**: “Price, D. (2004). Solaris zones: Operating system support for consolidating commercial workloads.”
  - Usulan: “Price, D., & Tucker, A. (2004). Solaris zones: Operating system support for consolidating commercial workloads.”
  - Catatan: Makalah LISA 2004 ini ditulis bersama Andrew Tucker.
- **Fakta meragukan**: “Torvalds, L. (1997). Linux: A free UNIX-386 kernel. *USENIX Annual Technical Conference*, 27-37.”
  - Catatan: Rujukan ini meragukan karena tidak dikenal sebagai makalah USENIX ATC 1997. Mohon verifikasi sumbernya; karya Torvalds tahun 1997 adalah tesis "Linux: A Portable Operating System".
- **Fakta meragukan**: “Merrifield, T., & Tahiliani, H. R. (2013). Conversion to micro-kernels.”
  - Catatan: Rujukan ini tidak dapat diverifikasi dan berpotensi fiktif. Periksa kembali judul, penulis, dan DOI-nya.
- **Fakta meragukan**: “Srinivasan, R., & Gopalan, K. (2013). Linux cgroups: Resource management, isolation, and control.”
  - Catatan: Rujukan ini tidak dapat diverifikasi dan berpotensi fiktif. Periksa keberadaan artikel dan DOI-nya.
- **Kalimat rancu**: “Molnar, I. (2007). Completely Fair Scheduler. *Linux kernel mailing list*. [https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html]”
  - Usulan: “Molnar, I. (2007). CFS Scheduler. *Linux kernel documentation*. [https://www.kernel.org/doc/html/latest/scheduler/sched-design-CFS.html]”
  - Catatan: Sumber disebut "Linux kernel mailing list", tetapi tautannya mengarah ke dokumentasi kernel, bukan arsip milis.
- **Istilah tidak konsisten**: “Kerrisk, M. (2010). *The Linux programming interface: A Linux and UNIX system programming handbook*. No Starch Press.”
  - Catatan: Ini buku, bukan artikel jurnal, tetapi diletakkan di bagian "Artikel Jurnal Ilmiah". Hal yang sama berlaku untuk Rosen dan Vahalia.
- **Istilah tidak konsisten**: “Tanenbaum, A. S., & Bos, H. (2014). *Modern operating systems* (4th ed.). Pearson Education.

Silberschatz”
  - Catatan: Urutan entri tidak alfabetis: Silberschatz seharusnya sebelum Tanenbaum. Di bagian artikel, Srinivasan seharusnya sebelum Stancevic.
