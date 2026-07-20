## Keamanan Kernel: Namespaces dan Cgroups

Selamat datang di jantung teknologi containerization modern. Jika kamu pernah bertanya-tanya bagaimana Docker atau Kubernetes dapat menjalankan ratusan aplikasi pada satu mesin tanpa saling mengganggu, jawabannya bukan karena sihir, melainkan berkat dua fitur fundamental dalam Kernel Linux: **Namespaces** dan **Control Groups (Cgroups)**.

Dalam arsitektur kernel, keamanan bukan hanya soal enkripsi atau password, tetapi juga tentang **isolasi** dan **pembatasan**. Mari kita bedah bagaimana kernel membangun dinding virtual serta mengatur alokasi resource untuk menciptakan lingkungan yang aman dan efisien.

## 1. Konsep Dasar: Si Dinding dan Si Akuntan

Untuk memahami perbedaan peran keduanya, bayangkan sebuah gedung apartemen:

- **Namespaces (Si Dinding):** Memastikan penghuni Kamar A tidak bisa mengintip isi Kamar B. Dengan demikian, mereka seolah berada di dunia terpisah meskipun menempati gedung yang sama.
- **Cgroups (Si Akuntan):** Menjaga agar penghuni Kamar A tidak memakai semua jatah air atau listrik gedung, sehingga penghuni lain tidak kehabisan daya.

> **Insight Utama:** Namespaces menentukan **apa yang bisa dilihat** oleh sebuah proses, sedangkan Cgroups menentukan **seberapa banyak resource** yang bisa digunakan oleh proses tersebut.

## 2. Linux Namespaces: Isolasi Pandangan

Namespaces membungkus resource system global ke dalam abstraksi yang membuatnya tampak eksklusif bagi proses di dalamnya. Saat ini, ada beberapa jenis namespace utama di Kernel Linux:

### A. PID Namespace (Process ID)

Menyediakan isolasi untuk process ID. Di dalam namespace ini, sebuah aplikasi merasa menjadi proses nomor 1 (PID 1 atau `init`), padahal di host system, ia mungkin memiliki PID 4502.

- **Manfaat Keamanan:** Proses di dalam container tidak dapat melihat atau mengirim sinyal (`kill`) ke proses di luar lingkungannya.

### B. Network Namespace (NET)

Mengisolasi networking stack, termasuk network interface, IP address, routing table, dan port.

- **Penerapan:** Kamu bisa menjalankan dua web server yang keduanya mendengarkan pada port 80 di mesin yang sama tanpa konflik, asalkan berada di NET namespace yang berbeda.

### C. Mount Namespace (MNT)

Mengisolasi mount point dari file system. Proses hanya bisa melihat struktur direktori yang diberikan kepadanya.

- **Analogi:** Seperti memberikan kacamata kuda pada proses; ia hanya melihat jalan di depannya (direktori `/`) dan tidak tahu ada direktori lain di luarnya.

### D. User Namespace (USER)

Jenis yang paling penting untuk keamanan. Ini memungkinkan sebuah proses memiliki hak akses `root` di dalam namespace, tetapi hanya menjadi non-privileged user di host system.

- Sebagai ilustrasi, bayangkan jika aplikasimu diretas. Dengan User Namespace, peretas yang mendapatkan akses "root" di dalam container tetap tidak memiliki kekuatan untuk merusak host kernel.

### E. UTS Namespace

Memungkinkan isolasi hostname dan domain name.

## 3. Control Groups (Cgroups): Pembatasan Resource

Jika Namespaces mencegah proses mengintip tetangganya, Cgroups mencegah proses menggunakan seluruh memori atau CPU system. Cgroups bekerja melalui mekanisme **Controllers**.

### Controller Utama dalam Cgroups:

1. **Memory Controller:** Membatasi alokasi RAM. Ketika proses melewati batas tersebut, kernel akan menghentikannya (lewat OOM killer) demi menjaga kestabilan system.
2. **CPU Controller:** Mengatur pembagian waktu CPU untuk sekelompok proses.
3. **BlkIO Controller:** Membatasi bandwidth saat mengakses disk (Input/Output).
4. **PIDs Controller:** Membatasi jumlah maksimal proses baru yang bisa dibuat untuk mencegah *fork bomb*.

### Rumus Pembagian CPU Sederhana:

Jika kita memiliki dua grup (A dan B) dengan bobot CPU (\\( w \\)):

\\[ \\text{Share untuk Grup A} = \\frac{w_A}{w_A + w_B} \\]

Dengan Cgroups, kernel memastikan distribusi ini ditepati dengan presisi milidetik.

## 4. Implementasi Teknis: Praktik Langsung

Mari kita lihat bagaimana kernel mengeksekusi isolasi ini menggunakan perintah tingkat rendah.

### Membuat Namespace Baru

Di Linux, kita bisa menggunakan command `unshare` untuk membuat namespace secara manual:

```bash
# Membuat shell baru dengan PID dan Mount namespace terisolasi
# --fork memastikan shell baru menjadi child process
# --mount-proc secara otomatis melakukan mount direktori /proc baru
sudo unshare --fork --pid --mount-proc bash

# Di dalam shell baru, cek PID
ps aux
```

*Hasilnya: Kamu akan melihat bahwa shell tersebut memiliki PID 1, seolah-olah sistem baru saja booting.*

### Mengatur Cgroups (v2)

Cgroups diatur melalui virtual file system di `/sys/fs/cgroup`. Berikut cara membatasi memori secara manual:

```bash
# Membuat group baru bernama 'limit_edukasi'
sudo mkdir /sys/fs/cgroup/limit_edukasi

# Mengatur batas memori maksimum 100MB
echo "100M" | sudo tee /sys/fs/cgroup/limit_edukasi/memory.max

# Memasukkan shell process saat ini ke dalam group tersebut
echo $$ | sudo tee /sys/fs/cgroup/limit_edukasi/cgroup.procs
```

Sekarang, apa pun yang kamu jalankan di shell tersebut tidak akan bisa menggunakan memori lebih dari 100MB.

## 5. Real-World Application: Bagaimana Docker Menggunakannya?

Teknologi container seperti Docker sebenarnya merupakan wrapper yang elegan di atas Namespaces dan Cgroups.

Skenario: Kamu menjalankan sebuah aplikasi microservice berbasis Node.js.

1. **Docker Engine** meminta kernel membuat **Namespaces** (PID, NET, MNT) agar aplikasi merasa berjalan sendirian.
2. **Docker Engine** membuat direktori di **Cgroups** untuk membatasi RAM aplikasi tersebut agar tidak mengganggu database yang berjalan di sebelahnya.
3. **Kernel Linux** bertindak sebagai polisi yang menegakkan aturan isolasi dan pembatasan tersebut secara real-time.

> **Penting:** Tanpa kedua fitur ini, biaya menjalankan cloud computing akan sangat mahal karena setiap aplikasi harus berjalan di atas Virtual Machine (VM) yang berat dan memakan banyak kernel resource.

## 6. Evolusi: Cgroups v1 vs Cgroups v2

Kernel Linux terus berkembang. Saat ini, industri sedang beralih ke **Cgroups v2**.

- **Cgroups v1:** Memiliki hierarchy terpisah untuk setiap controller (CPU sendiri, Memory sendiri), yang sering kali menyebabkan inkonsistensi.
- **Cgroups v2:** Menggunakan "Unified Hierarchy". Semua controller berada dalam satu struktur tree yang sama. Ini lebih sederhana, lebih aman, dan memungkinkan koordinasi yang lebih baik antara pembatasan memori dan I/O.

## Ringkasan Konsep

| Fitur | Fungsi Utama | Fokus Keamanan |
| --- | --- | --- |
| **Namespaces** | Isolasi Pandangan | Mencegah akses data atau proses antarlingkungan |
| **Cgroups** | Resource Management | Mencegah serangan *Denial of Service* (DoS) lokal |

Perlu dicatat bahwa jika sebuah proses di dalam container berhasil mengeksploitasi kernel bug, Namespaces tidak selalu dapat melindunginya. Oleh karena itu, keamanan kernel dirancang sebagai pertahanan berlapis, di mana Namespaces dan Cgroups bekerja bersama fitur lain seperti seccomp dan AppArmor untuk menjaga integritas sistem.

Dengan memahami Namespaces dan Cgroups, kamu kini memahami fondasi dari infrastruktur cloud modern. Pemahaman ini membuatmu tidak hanya menjadi pengguna container biasa, tetapi juga seseorang yang mengerti cara kerja kernel dalam menjaga ketertiban di tengah ribuan proses yang berjalan bersamaan.
