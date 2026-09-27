# Progress Log: Modul-to-Modul Transition Glitch (Desktop)

> Sumber template: `~/ai-skills/templates/progress-log-template.md`.
> Skill: `/home/belajarcarabelajar/ai-skills/Super Ultra Code Plan Implementation.md`.

---

## Task Identity

- **Goal:** Temukan penyebab glitch transisi Modul 1 → Modul 2 di desktop (loading tidak mulus, tanpa smart preloading/spinner) dan isolasi root cause dengan reproducer RED deterministik.
- **Approved scope:** Investigasi read-only. HARD GATE: tidak ada patch produksi sebelum RCA disetujui eksplisit.
- **Started:** 2026-09-28
- **Last updated:** 2026-09-28
- **Status:** `ACTIVE`

---

## Acceptance Criteria

- [ ] Reproducer minimal FAIL deterministik untuk alasan yang dilaporkan (INV-1)
- [ ] Tiap hipotesis C1–C11 punya verdict confirmed/disproven/inconclusive berdasar bukti (INV-2)
- [ ] RCA tertulis: violated invariant + why, diagram Mermaid (INV-3)
- [ ] ⏸️ Approval RCA eksplisit sebelum patch apa pun (INV-4)

---

## Task Breakdown & Checklist

### Phase 1: Artefak investigasi (parent, inline exception)

- [x] **[Step 1.1]** — artefak ditulis
- [x] **[Step 1.2]** — RED deterministik exit 1, 0/4, stabil 3 run

### Phase 2: Fan-out investigasi (11 subagent, satu round)

- [x] **[Step 2.1]** — 11/11 laporan kembali
- [x] **[Step 2.2]** — sintesis + 3 kontradiksi resolved + audit parent

### Phase 3: RCA + approval gate

- [x] RCA + Mermaid di systematic-debugging-log; audit mandiri; ⏸️ approval granted 2026-09-28 (opsi Approve RCA, plan fix)

### Phase 4: Implementasi (sekuensial T1-T3-T2, satu file bersama)

- [x] **[T1]** — optimistic reveal `shared-script.js` (+20/-4); INV-UI-3 RED exit 1 → GREEN exit 0; diff audit parent OK
- [x] **[T3]** — mj-test baru (RED 0/4 exit 1); `mathjax-support=false`, debounce + `e.persisted`, hapus register-sw; sync-template ±50 buku; mj-test GREEN 4/4 exit 0; T1 regresi OK
- [x] **[T2]** — fade + overlay spinner + prefetch next/prev/hover + preconnect/preload/view-transition; INV-UI-1/2/4 RED → GREEN; regresi OK
- [x] **[Red-chunk]** — V4 [P2] preload `crossorigin` mismatch diperbaiki (1 baris) + propagasi; V3 `check-latex-support.ts` diajari provider manual MathJax (script exit 0)
- [x] **[T4]** — repro 8/8 GREEN exit 0; `bun test` 332 pass / 1 fail pre-existing flake (auth ordering, solo GREEN, nol overlap file); V1-V4 fan-out selesai

### Phase 5: Commit + debt sweep

- [x] Commit `fix:` sebagai Iwan Kurniawan
- [ ] Debt sweep multi-select (Step 6)

---

## Current Focus

**Now working on:** Step 1.1 — menulis artefak investigasi.

---

## Decisions & Rejected Options

| Decision | Chosen | Rejected | Reason |
|---|---|---|---|
| Reproducer sebagai cek konten file statis | Bun test atas `shared-script.js`/CSS/`head.hbs`/`_headers` | E2E browser otomatis | Deterministik, tanpa network, membuktikan tidak adanya mekanisme transisi mulus |
| Inline parent untuk artefak | Parent menulis 4 file kecil | Delegasi ke subagent | Kontrak chunk harus ada sebelum dispatch; artefak kecil dan terisolasi |
| Lokasi artefak | `docs/debugging/2026-09-28-module-transition/` | `tests/` atau `/tmp` | Di luar suite permanen, terdokumentasi, mudah dibersihkan |
| Resolusi C2 vs C6 | Keduanya benar di level berbeda | Pilih satu laporan | Hint `rel="next prefetch"` ada di output build (mdBook) tapi nol logika di source; hint lumpuh oleh `no-store` |
| Resolusi klaim C9 "tanpa HTML build" | Ditolak via `ls output/books/` parent | Terima mentah | C6/C11 mengutip file output yang nyata ada; hanya klaim itu yang gugur |
| Resolusi C1 vs C5 | Blocker = auth fetch, bukan checkpoint | Salahkan semua fetch | C5 membuktikan checkpoint fire-and-forget pasca-reveal |

---

## Blockers

| Blocker | Waiting on | Unblock by |
|---|---|---|
| (belum ada) | | |

---

## Error Ledger

| Task | Step | Classification | Exit | Root cause | Retry used | Fallback used | Status |
|---|---|---|---|---|---|---|---|
| INV-UI-3 kalibrasi | 1.2 | test | 1 (false-pass awal) | Anchor string `/api/auth/me` cocok dengan komentar baris ~66 sebelum statement hide | 0/1 | Ganti anchor ke `fetch('/api/auth/me'` vs hide statement | `DONE` (RED sejati 4/4) |
| Suite auth flake | T4 | pre-existing (test isolation) | 1 di suite, 0 solo | `verifySession last_seen_at` role admin-vs-reader; lolos saat file dijalankan sendiri; nol overlap file dengan diff (hanya `books/*`, `scripts/inject-gating.ts`) | 1/1 | none (di luar scope; kandidat debt sweep) | `FAILED-ISOLATED` |

---

## Evidence Trail

| Checkpoint | Command | Exit | Evidence |
|---|---|---|---|
| Repro RED deterministik | `bun test docs/debugging/2026-09-28-module-transition/transition-repro.test.ts` | 1 | 0 pass, 4 fail (INV-UI-1..4), stabil 3 run |
| Parent audit C2 (grep prefetch source) | `grep -rni prefetch/... books/*.js books/*.css books/_template/ scripts/build.ts scripts/inject-gating.ts` | 0 baris cocok | Nol logika prefetch milik Dawnbook |
| Parent audit output sample | `grep rel=prefetch/MathJax/links` output aerodinamika 01 | 0 | `rel="next prefetch"` mdBook ada; MathJax 2.7.9 defer + 2.7.1 async duplikat; `register-sw.js` yatim (404) |
| T1 GREEN | `bun test .../transition-repro.test.ts -t 'INV-UI-3'` | 0 | 1 pass; diff hanya `books/shared-script.js` +20/-4 |
| T3 GREEN | `bun test .../transition-mathjax.test.ts` | 0 | 4 pass / 11 expect; propagasi 55 file uniform |
| T2 GREEN | `bun test .../transition-repro.test.ts` (full) | 0 | 4 pass; INV-UI-1/2/4 menyusul T1 |
| Red-chunk fix | `bun run scripts/check-latex-support.ts` | 0 | All checks passed (KaTeX strict warn pre-existing) |
| Final repro | `bun test docs/debugging/2026-09-28-module-transition/` | 0 | 8 pass, 0 fail, 15 expect |
| Final suite | `bun test` | 1 | 332 pass, 13 skip, 1 fail pre-existing flake (auth ordering) |

---

## Follow-Up Backlog (Session-Close Debt Sweep)

| # | Follow-up (outcome + path + finish line) | Class | `defer: <ceiling>, <upgrade-trigger>` | Status |
|---|---|---|---|---|
| F1 | Strengthen INV-UI-3 to assert conditional hide (`isInternalChapterNav`) in `transition-repro.test.ts`; finish line: test fails if hide unconditional, passes now | `NOW` | — | `DONE` (8/8 GREEN, 17 expects; 0 hits pre-fix proven) |
| F2 | Force `reveal()` on `pageshow` persisted in gating IIFE `books/shared-script.js` (close bfcache cold-opacity window); finish line: repro GREEN + manual reasoning note | `NOW` | — | `DECLINED` by user 2026-09-28, kept in backlog |
| F3 | Fix auth suite ordering flake `tests/functions/lib/auth.test.ts` (passes solo, fails in suite) | `LATER` | `defer: tests/functions/*, next auth-area change` | `OPEN` |
| F4 | Media CLS audit for image-heavy books (C8 sampled imageless book only) | `LATER` | `defer: books/*/src/content with images, next media audit` | `OPEN` |
| F5 | Publish plan mirror to vault (`plan-publish.mjs`; no vault in this env) | `LATER` | `defer: vault availability, next plan execution` | `OPEN` |

---

## Session Log

| Session | Summary | Next |
|---|---|---|
| 2026-09-28 | Skill loaded, klasifikasi Bounded+debug, artefak ditulis | RED repro, fan-out C1–C11 |
| 2026-09-28 | 11/11 laporan + audit parent → RCA tertulis, HARD GATE approval | Tunggu keputusan RCA; tanpa patch |
| 2026-09-28 | RCA approved → plan validated OK → T1+T3+T2 GREEN → red-chunk (P2, latex-script) → T4 verifikasi | Commit + debt sweep |
