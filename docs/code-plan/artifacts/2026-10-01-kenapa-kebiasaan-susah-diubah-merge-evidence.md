# Merge Evidence: PR #126 feat(books): add Kenapa Kebiasaan Susah Diubah? (12 modul)

Tanggal merge: 2026-10-01T17:09:58Z. Session: `dawnbook-kenapa-kebiasaan-susah-diubah` (state final: `merged`, terminal).

## Urutan Evidence

| Langkah | Perintah | Exit | Hasil |
|---|---|---|---|
| Verifikasi pra-merge (tree 227eb3a, sebelum artefak/plan) | `bun run build` | 0 | 687 chapters, SEO R1-R7 passed, sitemap 748 URL |
| Verifikasi pasca perubahan metadata.ts (tree 7b83e5d, konten build identik) | `bun run build` | 0 | SEO R1-R7 passed; kartu hub `data-created-at=1790872339899` |
| Rebase check | `git fetch origin main` + `git merge-base --is-ancestor origin/main HEAD` | 0 | origin/main sudah leluhur HEAD (0 commit tertinggal); tidak ada rebase yang diperlukan (flag `surface` global menyala karena 3 sesi lain mendarat di repo lain) |
| Merge | `gh pr merge 126 --merge` | 0 | MERGED 2026-10-01T17:09:58Z; commit merge `6af9f64` |
| Registry | `bun scripts/pr-registry.mjs state ... merged` | 0 | state terminal `merged` |
| Verifikasi pasca-merge pada base baru (repo utama, main = 6af9f64) | `git pull --ff-only` + `bun run build` | 0 | SEO R1-R7 passed; `output/books/kenapa-kebiasaan-susah-diubah` ada |
| Seed D1 (FU-4, pasca-merge) | `bun run scripts/migrate-to-d1.ts` (kredensial dari ~/cloudflare/.env) | 0 | "All seeds applied successfully" |
| Verifikasi D1 | `cf d1 query b537a5d1-... --sql "SELECT ... WHERE slug='kenapa-kebiasaan-susah-diubah'"` | 0 | 1 baris: subject_label Psikologi, content_md 91.305 byte, view_count 0 |

## Commit yang Mendarat Lewat PR #126

- `227eb3a` feat(books): add Kenapa Kebiasaan Susah Diubah? (12 modul)
- `117de46` docs(plan): simpan pr body dan review report sebagai artifacts
- `7b83e5d` fix(builder): terima format pinnedMs pada release-dates.json; tandai plan Complete

## Catatan Penting

Branch sesi dipotong dari local main (5f94c4d) karena origin/main tertinggal 3 commit dari lokal (pekerjaan sesi buku sebelumnya yang belum ter-push: `f562123`, `30602cc`, `5f94c4d`). Merge PR #126 sekaligus menerbitkan ketiga commit tersebut ke origin/main; tidak ada commit baru yang dibuat langsung di base branch.

## Debt Sweep (2026-10-01, keempat item dipilih user)

- [x] FU-1 audit emoji otomatis: `bun run scripts/detect-emojis.ts books/kenapa-kebiasaan-susah-diubah` exit 0, 0 emoji.
- [x] FU-2 metadata.ts menerima objek `{pinnedMs}`; diverifikasi via build exit 0 dan kartu hub.
- [x] FU-3 kartu hub & manifest: manifest.json 12 chapter, penulis, timestamp PUEBI "1 Oktober 2026, 23.32 WIB".
- [x] FU-4 seed D1 pasca-merge: sukses, baris D1 terverifikasi via query cf.

Sisa debt (di-backlog plan, tidak dijadwalkan): preprocessor `mdbook-dawnbook` tidak terpasang lokal (warning non-fatal); standalone `tsc --noEmit` tidak berlaku di repo (tidak ada script typecheck).
