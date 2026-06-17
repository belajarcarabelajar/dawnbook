# 🤖 GEMINI LOCAL CONTEXT & RULES

## 🛑 STRICT DEPLOYMENT RULES (NEVER VIOLATE)

1. **Cloudflare Pages Deployment (`scripts/deploy-website.sh`)**:
   - Jika pengguna menyuruh menjalankan `rtk bash scripts/deploy-website.sh` atau melakukan *deploy* ke Cloudflare Pages, **JANGAN PERNAH MENGGUNAKAN `bun run wrangler`**. *Bun* memiliki *bug* yang menyebabkan unggahan (*upload*) ke Cloudflare Pages gagal secara diam-diam (*silently breaks*).
   - Selalu gunakan `npx` *native* dari ekosistem Node.js dengan membypass PATH (contoh: `PATH=/usr/local/sbin:...`).
   - Eksekusi `wrangler pages deploy` **WAJIB MENYERTAKAN FLAG `--branch main`**. Jika tidak, Cloudflare akan menganggapnya sebagai *Preview Deployment* dan URL produksi utama (`dawnbook.pages.dev`) TIDAK AKAN DIPERBARUI.
   - **BENTUK SKRIP YANG BENAR (WAJIB DIPERTAHANKAN)**:
     ```bash
     export CLOUDFLARE_ACCOUNT_ID=1ec5420a78a852fd25bc2dd915740a71
     PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin npx wrangler pages deploy output --project-name dawnbook --branch main --commit-dirty=true
     ```

2. **Aturan UI/UX & Theming (Toggle Theme)**:
   - *Toggle Theme* situs menggunakan sinkronisasi `localStorage` antara mdBook (`mdbook-theme`) dan Hub/Admin (`theme`).
   - Pemanggilan `localStorage.getItem` atau `setItem` **WAJIB** dibungkus dalam blok `try/catch`. Jika tidak, situs akan hancur/berhenti memuat (*crash*) bagi pengguna dengan Safari Private Mode atau konfigurasi privasi ketat.
   - Sinkronisasi CSS untuk fitur *mdBook* membutuhkan integrasi dengan kelas khusus mdBook (`:root.light`, `:root.rust`, `:root.ayu`) yang dipasangkan ke dalam `tokens.css` berdampingan dengan `[data-theme='light']`.

3. **Etos Kerja Agent**:
   - Ingat aturan ini secara permanen selama berada di dalam monorepo `dawnbook`! Jangan gegabah mengotak-atik skrip *deployment* kecuali secara eksplisit mengubah fungsionalitas dan tetap mempertahankan hukum nomor 1 di atas.
