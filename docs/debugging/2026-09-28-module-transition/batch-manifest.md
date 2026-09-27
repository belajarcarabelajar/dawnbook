# Batch Manifest: Investigasi transisi modul (satu round, read-only)

> Kontrak per chunk mengikuti `~/ai-skills/templates/subagent-contract-template.md`.
> Aturan: satu chunk = satu hipotesis = satu owner; scope file disjoint untuk tulis
> (semua chunk read-only, jadi tidak ada write conflict); output = verdict
> `CONFIRMED` / `DISPROVEN` / `INCONCLUSIVE` + bukti (path:line + kutipan max 3 baris).
> Review checkpoint: parent kumpulkan semua laporan, dedupe, selesaikan kontradiksi
> dari bukti, verifikasi mandiri via diff/log/exit code.

| Chunk | Hipotesis | Scope (read-only) | Expected output | Verification |
|---|---|---|---|---|
| C1 | Auth gating (`opacity 0` sampai `fetch /api/auth/me`) memblokir first paint tiap navigasi chapter | `books/shared-script.js:70-219` | Verdict + urutan hide→fetch→reveal | `bun test` repro butir 3 |
| C2 | Tidak ada prefetch/preload/prerender chapter berikutnya | `books/`, `scripts/build.ts`, `scripts/inject-gating.ts`, `books/_template/theme/` (grep `prefetch\|preload\|prerender\|instant`) | Verdict + daftar hit/nol-hit | grep exit status |
| C3 | Tidak ada spinner/skeleton/transisi halaman (FOUC putih) | `books/shared-header.css`, `books/shared-script.js`, `books/_template/theme/` | Verdict + apa yang dirender browser saat reload | repro butir 1–2 |
| C4 | MathJax CDN `defer` + retypeset berulang menyebabkan layout shift/jank pasca-navigasi | `books/_template/theme/head.hbs`, `books/shared-script.js:1-60` | Verdict + urutan typeset vs paint | — |
| C5 | Fetch checkpoint (`/api/progress`, view API, `saveProgress`) di critical path menunda interaktif | `books/shared-script.js:103-186` | Verdict + daftar fetch sinkron-per-navigasi | — |
| C6 | MPA full-document reload tanpa router/SPA/SW = tidak ada transisi mulus secara arsitektural | `scripts/build.ts`, `output/books/*/index.html` (sampel 1), `functions/_middleware.ts` | Verdict + konfirmasi tidak ada client router | — |
| C7 | Font Syne/Epilogue tanpa `display=swap`/preload → FOUT/shift saat chapter load | `apps/hub/src/styles/typography.css`, `book.toml`, sampel output HTML | Verdict + cara font dimuat | — |
| C8 | Media tanpa dimensi/lazy-load → CLS saat chapter load | 1 buku sampel `output/books/*/*.html` + `src/content/*.md` | Verdict + contoh tag img | — |
| C9 | Init sidebar/theme mdBook menyebabkan reflow/flash | mdBook default `book.js`, `books/_template/theme/`, sampel output HTML | Verdict + urutan init | — |
| C10 | `_headers` `no-store` memaksa unduh ulang penuh tiap navigasi | `_headers`, `wrangler.toml` | Verdict + header per rute `/books/*` | `cat _headers` |
| C11 | Rantai CSS/JS render-blocking (`additional-css/js`, `head.hbs`, `sync-template.ts`) | `books/_template/book.toml`, `scripts/sync-template.ts`, `books/_template/theme/head.hbs` | Verdict + daftar aset blocking | — |

- **Fan-out count:** 11 subagent (di atas floor 10; topik mendukung).
- **Chunk boundary check:** [x] tiap chunk satu owner, [x] semua kandidat ter-cover, [x] tidak ada overlap tulis (semua read-only).
- **Re-dispatch rule:** chunk merah/inconclusive di-chunk ulang dan di-dispatch sendirian.
