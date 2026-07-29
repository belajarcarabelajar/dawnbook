## Judul Bab Pertama

> **CATATAN TEMPLATE:** File ini harus DIHAPUS dan diganti dengan chapter asli di `src/content/01_nama-bab.md`. Perhatikan: heading menggunakan `##` (H2), bukan `#` (H1). mdBook otomatis membuat H1 dari SUMMARY.md.

Isi bab di sini.

### Pedoman Format LaTeX & Rumus Matematika (mdBook v0.4.40):
- **Inline Math**: Gunakan `$...$` (dua backslash di file `.md`). Contoh: `$R_{1,t}$` atau `$r$`.
- **Display Math**: Gunakan `$$...$$`. Contoh: `$$\text{NPV} = \sum_{t=1}^{T} \frac{R_{1,t} - R_{0,t}}{(1 + r)^t} - C_{\text{total}}$$`
- **Daftar Variabel di Bawah Rumus**: Setiap simbol variabel WAJIB dibungkus `$...$`:
  - `$R_{1,t}$` : ekspektasi pendapatan...
  - `$r$` : tingkat diskonto...
- **Singkatan / Multi-letter**: Gunakan `\text{NPV}`, `\text{BEP}`, `\text{Guru}` di dalam mode math.

