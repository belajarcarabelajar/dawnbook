## Manajemen Proses dan Task Scheduling: Jantung dari Multitasking Linux.

Pernahkah kamu membayangkan bagaimana komputermu bisa memutar lagu di Spotify, mengunduh file besar di browser, dan mengedit dokumen di Word secara bersamaan tanpa terasa tersendat? Di balik layar, kernel Linux bekerja seperti seorang konduktor orkestra yang sangat sibuk namun sangat terorganisir.

Dalam bagian ini, kita akan membedah bagaimana Linux mengelola unit kerja terkecilnya, yaitu **proses**, dan bagaimana ia memutuskan siapa yang berhak menggunakan CPU pada detik tertentu melalui **task scheduling**.

## 1. Apa itu Proses dalam Linux?

Secara sederhana, **program** adalah file pasif yang tersimpan di disk (seperti resep masakan), sedangkan **proses** adalah instansi aktif dari program tersebut yang sedang dieksekusi di memori (seperti juru masak yang sedang memasak resep tersebut).

Di Linux, tidak ada perbedaan kaku antara "proses" dan "thread". Keduanya dianggap sebagai **task**. Perbedaannya hanya terletak pada apakah mereka berbagi ruang alamat memori atau tidak.

### Struktur Data task_struct

Setiap proses dalam Linux direpresentasikan oleh sebuah struktur data raksasa di dalam kernel yang disebut `task_struct`. Jika proses adalah seorang warga negara, maka `task_struct` adalah KTP, paspor, dan seluruh rekam medisnya.

Struktur ini didefinisikan di `<linux/sched.h>` dan berisi beberapa informasi penting:

- **State**: Menunjukkan status aktif proses saat ini (seperti berjalan, tidur, atau berhenti).
- **PID (Process ID)**: Nomor identitas unik yang membedakan proses ini dengan proses lainnya.
- **Parent & Children**: Hubungan hierarkis antar-proses dalam sistem.
- **CPU Affinity**: Pengaturan yang menentukan di CPU mana saja proses ini diperbolehkan berjalan.
- **Files Open**: Daftar file yang sedang aktif diakses oleh proses tersebut.
- **Memory Limits**: Batasan alokasi memori yang boleh digunakan oleh proses.

Ketika sebuah sistem menjalankan 1000 proses, kernel harus mengelola 1000 instansi `task_struct` secara real-time.

## 2. Siklus Hidup Proses

Proses di Linux tidak muncul begitu saja. Mereka lahir, bekerja, terkadang beristirahat, dan akhirnya mati.

### Transisi State Proses

Kernel melacak status setiap tugas menggunakan flag dalam `task_struct`:

1. **TASK_RUNNING**: Proses sedang aktif dieksekusi oleh CPU atau berada di antrean *ready* untuk menunggu giliran.
2. **TASK_INTERRUPTIBLE**: Status tidur sementara karena menunggu kejadian tertentu, seperti input dari *keyboard*. Status ini bisa diinterupsi oleh sinyal luar.
3. **TASK_UNINTERRUPTIBLE**: Kondisi tidur yang tidak dapat diinterupsi sinyal, umumnya terjadi ketika proses sedang menunggu operasi I/O dari perangkat keras selesai.
4. **EXIT_ZOMBIE**: Proses telah selesai berjalan, namun metadatanya tetap tertinggal di tabel proses karena induk (*parent*) belum membaca status keluarnya (*exit status*).
5. **EXIT_DEAD**: Fase final ketika seluruh resource task benar-benar dibersihkan oleh sistem.

### Mekanisme Fork dan Copy-on-Write (COW)

Linux menciptakan proses baru melalui system call `fork()`.

> **Analogi Fotokopi Cerdas:** Bayangkan kamu ingin memberikan salinan buku catatan kepada teman. Alih-alih memfotokopi seluruh buku (yang memakan waktu dan biaya), kamu hanya memberikan buku aslimu untuk dibaca bersama. Namun, jika temanmu ingin menulis sesuatu di buku itu, barulah halaman tersebut difotokopi secara instan sehingga ia punya salinan pribadinya. Inilah yang disebut **Copy-on-Write (COW)**.

Mekanisme ini membuat pembuatan proses di Linux sangat cepat dan efisien dalam penggunaan memori.

## 3. Task Scheduling: Mencapai Efisiensi CPU

**Scheduler** dalam kernel bertugas memilih proses berikutnya yang akan dieksekusi oleh CPU. Hal ini dilakukan untuk mengoptimalkan throughput CPU sekaligus menjaga agar latency sistem tetap rendah bagi pengguna.

### Completely Fair Scheduler (CFS)

Sejak kernel 2.6.23, Linux menggunakan **CFS** sebagai algoritma penjadwalan default. Berbeda dengan scheduler lama yang menggunakan "timeslice" (jatah waktu tetap), CFS berusaha memberikan keadilan yang sempurna dalam pembagian waktu proses.

**Konsep vruntime (Virtual Runtime):** CFS melacak seberapa lama sebuah proses telah berjalan di CPU menggunakan variabel \\(\text{vruntime}\\).

- Proses yang memiliki \\(\text{vruntime}\\) terkecil adalah yang paling "tidak adil" diperlakukan, sehingga ia mendapatkan giliran berikutnya.
- Prioritas (disebut **nice value**) mempengaruhi seberapa cepat \\(\text{vruntime}\\) sebuah proses bertambah.

\\[
\text{vruntime} = \text{vruntime} + \frac{\text{actual\_runtime}}{\text{weight}}
\\]

Jika nilai *nice* tinggi (kurang prioritas), \\(\text{vruntime}\\) bertambah cepat, sehingga ia lebih jarang mendapatkan giliran.

### Struktur Data Red-Black Tree

Untuk mencari proses dengan \\(\text{vruntime}\\) terkecil secara cepat, CFS menyimpan daftar proses yang siap jalan dalam struktur data **red-black tree**. Hal ini memungkinkan pencarian dengan kompleksitas waktu \\(O(\log n)\\), yang tetap kencang meskipun ada ribuan proses.

## 4. Real-world Application & Scenario

Mari kita lihat bagaimana pengetahuan ini diterapkan dalam administrasi sistem dan pengembangan aplikasi.

### Skenario: Mengoptimalkan Web Server

Misalkan kamu menjalankan server database yang sangat berat dan web server yang harus merespons pengguna dengan cepat.

- **Masalah**: Database memakan semua sumber daya CPU, membuat web server terasa lambat.
- **Solusi**: Mengatur **nice value**.
	- Kamu memberikan nice value +10 pada proses database (merendahkan prioritas).
	- Web server tetap pada nilai 0 atau -5 (meningkatkan prioritas).

```bash
# Menjalankan proses database dengan prioritas rendah (nice 10)
nice -n 10 ./start_database.sh

# Mengubah prioritas proses yang sudah berjalan (PID 1234)
renice -n -5 -p 1234
```

### Implementasi Kode: Membuat Child Process

Berikut adalah contoh sederhana dalam bahasa C bagaimana sebuah proses membuat proses baru menggunakan `fork()`.

```c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

int main() {
    pid_t pid;

    // Membuat salinan proses
    pid = fork();

    if (pid < 0) {
        // Gagal melakukan fork
        fprintf(stderr, "Fork Gagal");
        return 1;
    } else if (pid == 0) {
        // Ini adalah child process
        printf("Halo, saya proses anak! PID: %d\n", getpid());
    } else {
        // Ini adalah parent process
        printf("Halo, saya proses induk! PID: %d. Anak saya memiliki PID: %d\n", getpid(), pid);
    }

    return 0;
}
```

## 5. Ringkasan Konsep Kunci

| Konsep | Penjelasan Singkat |
| --- | --- |
| **`task_struct`** | Metadata terpusat yang menyimpan seluruh informasi tentang suatu proses. |
| **context switching** | Proses menyimpan status CPU saat ini dan memuat status proses lain untuk multitasking. |
| **preemption** | Kemampuan kernel untuk menghentikan proses berjalan demi mendahulukan proses dengan prioritas lebih tinggi. |
| **CFS** | Algoritma scheduler default yang memastikan distribusi CPU yang adil berdasarkan \\(\text{vruntime}\\). |
| **zombie process** | Proses yang telah selesai dieksekusi tetapi entri datanya masih tertinggal karena induk belum membaca status keluarnya. |

Manajemen proses yang efisien inilah yang mendasari keandalan Linux saat dijalankan di berbagai perangkat, mulai dari jam tangan pintar hingga superkomputer tercepat di dunia. Kegagalan scheduler dalam hitungan detik saja dapat membuat seluruh sistem terasa membeku akibat terhentinya pergantian tugas di CPU.
