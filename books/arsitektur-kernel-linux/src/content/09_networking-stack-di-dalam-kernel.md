## Networking Stack di dalam Kernel

Pernahkah kamu membayangkan apa yang terjadi dalam sepersekian milidetik ketika menekan "Enter" pada peramban web hingga halaman muncul? Di balik layar, Kernel Linux melakukan orkestrasi yang sangat kompleks untuk memproses data yang datang dari kabel serat optik atau sinyal Wi-Fi hingga sampai ke aplikasi yang kamu gunakan.

Networking Stack (tumpukan protokol jaringan) di Linux adalah salah satu mahakarya rekayasa perangkat keras dan lunak yang paling efisien di dunia. Bagian ini akan membawa kamu menelusuri jalur "perjalanan paket" dari saat ia menyentuh perangkat keras hingga diterjemahkan menjadi informasi yang bermakna bagi aplikasi.

## 1. Analogi: Sistem Logistik Internasional

Bayangkan Networking Stack sebagai sistem pengiriman paket internasional:

1. **Network Interface Card (NIC)**: Berperan sebagai pelabuhan fisik tempat kapal (paket data) merapat pertama kali.
2. **Driver Jaringan**: Petugas bongkar muat yang bertugas memindahkan kontainer dari dermaga ke atas truk pengangkut.
3. **Lapisan IP (Network)**: Ini adalah pusat sortir logistik. Bagian ini bertugas memeriksa label alamat tujuan pada setiap kontainer untuk menentukan rute berikutnya.
4. **Lapisan Transport (TCP/UDP)**: Bertindak seperti kurir pengantar. Lapisan ini memastikan seluruh isi kontainer utuh tanpa kerusakan, lalu membuka segelnya.
5. **Socket**: Titik akhir pengiriman, layaknya pintu rumahmu di mana kurir menyerahkan paket secara langsung.

## 2. Struktur Data Utama: sk_buff (Socket Buffer)

Sebelum kita membahas jalurnya, kita harus mengenal **`sk_buff`**. Ini adalah struktur data inti dalam subsistem jaringan kernel.

> **Intisari:** `sk_buff` (atau sering disebut `skb`) adalah sebuah objek yang membungkus paket data selama perjalanannya di dalam kernel. Alih-alih menyalin data paket berkali-kali (yang akan sangat lambat), kernel hanya memberikan pointer (petunjuk) ke `skb` ini dari satu lapisan ke lapisan berikutnya.

Setiap kali paket melewati lapisan baru (misal dari IP ke TCP), kernel hanya menggeser pointer di dalam `skb` untuk mengekspos header protokol yang relevan. Ini adalah teknik **Zero-Copy** internal yang membuat Linux sangat cepat.

## 3. Jalur Data Masuk (Packet Ingress)

Mari kita telusuri bagaimana paket mengalir dari luar ke dalam aplikasi.

### A. Lapisan Fisik & Driver (L2 - Link Layer)

Saat bit-bit listrik atau cahaya tiba di kartu jaringan (NIC):

1. **Hardware Interrupt**: Ketika bit data mendarat, NIC mengirimkan sinyal interupsi fisik ke CPU sebagai pemberitahuan bahwa ada data baru yang harus diambil.
2. **NAPI (New API)**: Guna mencegah "Interrupt Storm" (kondisi di mana CPU kewalahan akibat terlalu banyak interupsi fisik), kernel modern menggunakan mekanisme NAPI. Driver jaringan akan menonaktifkan interupsi sementara waktu dan beralih ke mode **polling** untuk mengambil paket secara kolektif langsung dari memori NIC.
3. **Alokasi `skb`**: Driver membuat objek `sk_buff` baru, lalu menyalin data dari buffer DMA (Direct Memory Access) kartu jaringan ke memori utama (RAM) sistem.
4. **SoftIRQ**: Setelah menyalin data, driver memicu interupsi lunak (`NET_RX_SOFTIRQ`). Langkah ini memungkinkan pemrosesan paket berikutnya berlangsung secara asinkron di latar belakang, membebaskan CPU agar tidak tertahan terlalu lama pada level penanganan perangkat keras (*interrupt handler*).

### B. Lapisan Jaringan (L3 - IP Layer)

Paket kemudian diserahkan ke fungsi `ip_rcv()`:

1. **Integrity Check**: Kernel memvalidasi *checksum* untuk memastikan paket data yang diterima tidak mengalami kerusakan atau korupsi selama transmisi.
2. **Netfilter (Prerouting)**: Titik evaluasi awal di mana aturan penyaringan seperti `iptables` atau `nftables` mulai bekerja memeriksa paket.
3. **Routing Decision**: Kernel akan menentukan tujuan paket dengan mengevaluasi alamat IP penerima.
   - Jika paket ditujukan untuk mesin lain, aliran data dialihkan ke jalur pemrosesan *forwarding*.
   - Jika paket ditujukan untuk sistem lokal kita, alurnya akan dilanjutkan ke fungsi `ip_local_deliver()`.

### C. Lapisan Transport (L4 - TCP/UDP)

Kernel melihat header protokol (TCP atau UDP) dan memanggil fungsi yang sesuai (misal: `tcp_v4_rcv()`):

1. **Port Lookup**: Kernel memindai tabel pencarian untuk menemukan socket aktif yang terasosiasi dengan nomor port tujuan paket tersebut.
2. **Protocol State Machine**: Khusus untuk protokol TCP, kernel akan mengelola status koneksi, melacak nomor urut (*sequence numbers*), mengirimkan konfirmasi (*acknowledgments* / ACK), serta mengatur ukuran jendela transmisi (*windowing*).

### D. Lapisan Aplikasi (User Space)

1. **Penyimpanan di Buffer**: Setelah terbebas dari seluruh header protokol, payload data bersih ditempatkan pada **Receive Buffer** milik socket yang bersangkutan.
2. **Pemanggilan oleh Aplikasi**: Aplikasi di *user space* yang sedang menunggu dengan sistem panggilan (*system call*) seperti `read()` atau `recv()` akan dibangunkan (*woken up*) guna menyalin data dari *kernel space* ke *user space*.

## 4. Arsitektur Netfilter: "Polisi" di Tengah Jalan

Di sepanjang jalur ini, terdapat **Netfilter Hooks**. Ini adalah titik-titik di mana kernel mengizinkan modul lain (seperti firewall) untuk memeriksa, mengubah, atau membuang paket.

\\[
\begin{aligned}
\text{Packet In} &\rightarrow \text{PREROUTING} \rightarrow \text{INPUT} \rightarrow \text{Local Process} \\\\
&\rightarrow \text{OUTPUT} \rightarrow \text{POSTROUTING} \rightarrow \text{Packet Out}
\end{aligned}
\\]

Sebagai catatan tambahan, aturan firewall yang terlalu kompleks dapat menurunkan performa. Karena setiap paket harus dievaluasi di setiap *hook*, aturan yang rumit atau terlalu banyak akan menambah latensi secara keseluruhan pada pemrosesan jaringan.

## 5. Jalur Data Keluar (Packet Egress)

Proses ini adalah kebalikan dari Ingress:

1. **Application**: Aplikasi memicu proses pengiriman dengan memanggil sistem panggilan seperti `send()` atau `write()`.
2. **Socket**: Payload data disalin dari ruang pengguna (*user space*) ke ruang kernel (*kernel space*), kemudian dibungkus di dalam objek `skb`.
3. **Transport Layer**: Penambahan header protokol TCP atau UDP dilakukan pada tahap ini untuk memastikan kontrol pengiriman.
4. **Network Layer**: Kernel menyisipkan header IP dan membuat keputusan perutean (*routing decision*) untuk menentukan antarmuka (*interface*) fisik mana yang akan dilewati paket untuk keluar.
5. **QDisc (Queuing Discipline)**: Sebelum diteruskan ke driver kartu jaringan, paket ditempatkan dalam antrean penjadwalan. Di sinilah kernel melakukan manajemen lalu lintas (*traffic control*), seperti memprioritaskan paket VoIP yang sensitif terhadap latensi dibandingkan transfer berkas berukuran besar.
6. **Driver & NIC**: Data dipindahkan ke *ring buffer* pada kartu jaringan sebelum akhirnya ditransmisikan secara fisik ke media kabel atau nirkabel.

## 6. Contoh Teknis: Mengintip Statistik Stack

Kita dapat memantau bagaimana kernel memproses paket melalui sistem berkas `/proc`.

```bash
# Melihat statistik pemrosesan paket per CPU
cat /proc/net/softnet_stat

# Melihat jumlah paket yang masuk/keluar pada tiap interface
cat /proc/net/dev

# Melihat penggunaan socket saat ini
cat /proc/net/sockstat
```

### Real-World Use Case: High-Performance Web Server

Pada server dengan trafik sangat tinggi (seperti Nginx atau Node.js), pengembang sering melakukan **Kernel Tuning** pada networking stack:

- **`net.core.somaxconn`**: Menentukan batas maksimum antrean koneksi masuk (*backlog*). Dengan memperbesar nilai ini, kita dapat mencegah penolakan koneksi baru ketika server menerima lonjakan beban trafik yang sangat tinggi secara tiba-tiba.
- **`net.ipv4.tcp_fin_timeout`**: Mengatur durasi waktu tunggu socket dalam status `FIN-WAIT-2` sebelum ditutup sepenuhnya. Mempercepat proses pembersihan ini sangat berguna untuk membebaskan memori sistem lebih cepat dari socket yang sudah tidak aktif.

## 7. Ringkasan Visual Jalur Paket

| Lapisan | Komponen Utama | Fungsi Kunci |
| --- | --- | --- |
| **User Space** | Application | `socket()`, `bind()`, `send()`, `recv()` |
| **Transport** | TCP / UDP | Segmentasi, Flow Control, Error Recovery |
| **Network** | IP / ICMP | Routing, Addressing, Fragmentation |
| **Link Layer** | NIC Driver / NAPI | Interrupt Handling, DMA, Frame Framing |
| **Physical** | Network Card | Bit transmission (Electrical/Optical) |

> **Pelajaran Penting:** Networking stack Linux didesain untuk efisiensi maksimum dengan meminimalkan penyalinan data (*zero-copy philosophy*) dan menggunakan mekanisme interupsi yang cerdas (NAPI) untuk menangani beban kerja modern.

Pada era kecepatan internet modern yang mencapai 100Gbps+, tantangan utama bagi kernel adalah efisiensi pemrosesan jutaan paket per detik secara efisien tanpa membebani kinerja CPU secara berlebihan.
