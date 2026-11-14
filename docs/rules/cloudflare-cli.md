# Cloudflare CLI and code search: original notes

Moved verbatim from `GEMINI.md` on 2026-11-15, when the always-loaded instruction files were compacted under the 150k-character limit. `GEMINI.md` keeps the binding summary of each rule and points here; each heading below names the `GEMINI.md` section the text belongs to. Read this file before the work its pointer in `GEMINI.md` names. In the moved text, "this section" and "this file" mean the `GEMINI.md` section named in the heading.

## Original trailing blocks of GEMINI.md

## Cloudflare: WAJIB pakai `cf`, bukan `wrangler` (ditambahkan 2026-09-29)

`cf` (Cloudflare CLI v1.0.0-beta.5) terpasang global di `~/.local/bin/cf` dan
mencakup 3.000+ operasi API. Untuk **semua** operasi Cloudflare, pakai `cf`.
Jangan pakai `wrangler` / `npx wrangler` / `bunx wrangler`, kecuali pada empat
kondisi di bawah.

**Auth sudah otomatis.** `~/cloudflare/.env` memuat `CLOUDFLARE_API_TOKEN` dan
`CLOUDFLARE_ACCOUNT_ID`, yang di-load `~/.bashrc` untuk shell interaktif.
Tidak perlu `cf auth login`. Kalau `cf` bilang tidak terautentikasi, cek
`cf auth whoami`. Jangan pernah mencetak nilai token.

### Tetap pakai `wrangler`: hanya empat kondisi

Alasannya sudah diukur, bukan dugaan:

1. **CI / GitHub Actions.** Runner tidak punya `cf` terpasang. Perintah
   `wrangler` di `.github/workflows` dibiarkan apa adanya.
2. **`wrangler pages dev`.** Tidak ada padanan di `cf`. `cf pages` hanya punya
   `deploy` dan `projects`; `cf pages dev` keluar dengan exit 1.
3. **Worker esbuild / Rust / Python.** `cf` sendiri mendelegasikan ke wrangler
   untuk kasus ini secara sengaja (pengumuman Cloudflare 2026-09-28).
4. **`scripts/deploy-website.sh`.** Skrip deploy memakai `bunx wrangler`
   (versi dari `bun.lock`) untuk `d1 migrations apply` dan `pages deploy`
   (direct upload). Jalankan lewat skrip itu; jangan ganti dengan `cf`.

### Cari command, jangan menebak nama

`cf` punya 3.000+ perintah. Wajib mencari, bukan menebak:

```bash
cf cli search "list d1 databases"    # JSON berisi command yang cocok
```

### Empat jebakan yang sudah diukur

1. **Grup resource memakai bentuk jamak**: `buckets`, `namespaces`,
   `projects`, `accounts`, `zones`. Bentuk tunggal tidak ada.
   Salah: `cf r2 bucket list` (exit 1). Benar: `cf r2 buckets list` (exit 0).
2. **Grup tanpa subcommand hanya mencetak help, dan exit 0.**
   `cf zones` keluar 0 tanpa satu pun request API. Yang benar: `cf zones list`.
3. **Exit 0 tidak selalu berarti berhasil.** `cf init` tanpa argumen mencetak
   kotak `Error` tetapi tetap exit 0. Periksa isi output, bukan hanya `$?`.
4. **`cf dev` menolak argumen.** `cf dev --port 8799` ditolak; `cf` mendeteksi
   `vite` dan menyuruh menjalankan `npx vite` langsung untuk opsi Vite.

### Output bawaan adalah JSON

Jangan memakai `--json` seperti pada wrangler; `cf` sudah JSON secara default.
Saring dengan `jq` (terpasang, jq 1.8.2):

```bash
cf d1 list    | jq -r '.[].name'
cf zones list | jq -r '.[].name'
cf kv namespaces list | jq -r '.[].title // .[].id'
```

**Revert blok ini:** hapus bagian ini dari file, atau kembalikan utuh dari
backup `<file>.bak-cf-20260929`.

## Tool Pencarian Kode: ripgrep, tgrep, grep (Audit 2026-09-30)

Gunakan **ripgrep (`rg`)** sebagai alat pencarian utama di seluruh repo ini:
- Path: `/usr/bin/rg` via symlink `~/.local/bin/rg` dengan global `--smart-case` dan `--max-columns=200` (`~/.config/ripgrep/config`).
- Hindari `tgrep` untuk pola < 3 karakter atau jika repo belum di-index (`tgrep` jatuh ke linear scan 150x lebih lambat).
- DILARANG menjalankan `tgrep` pada `/tmp` (memicu kernel SIGBUS crash).
- `grep` otomatis mengalihkan query direktori ke `tgrep` bila aman dan mendelegasikan ke GNU grep untuk stdin, single file, dan path volatile (`/tmp`, `/proc`).
