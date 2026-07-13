> **AI Agent Instruction**: Please analyze the directory structure and file contents below. Once you understand the repository's purpose, **rename this markdown report file** to a highly descriptive name that reflects its contents (e.g., `dawnbook-architecture-report.md`, `backend-api-structure.md`, etc.). After renaming, please also copy the final renamed file to `~/Downloads/`.

# Directory Structure of `dawnbook`

```text
dawnbook
├── .github
│   ├── CODEOWNERS
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── pull_request_template.md
│   └── workflows
│       └── deploy.yml
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE-CONTENT
├── README.md
├── apple-touch-icon.png
├── apps
│   ├── admin
│   │   ├── README.md
│   │   ├── bun.lock
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── public
│   │   │   ├── favicon.svg
│   │   │   └── icons.svg
│   │   ├── src
│   │   │   ├── App.css
│   │   │   ├── App.tsx
│   │   │   ├── assets
│   │   │   │   ├── hero.png
│   │   │   │   ├── react.svg
│   │   │   │   └── vite.svg
│   │   │   ├── components
│   │   │   │   ├── Dashboard.css
│   │   │   │   └── Dashboard.tsx
│   │   │   ├── index.css
│   │   │   ├── main.tsx
│   │   │   ├── services
│   │   │   │   └── book-service.ts
│   │   │   └── styles
│   │   │       ├── tokens.css
│   │   │       └── typography.css
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── vite.config.ts
│   └── hub
│       └── src
│           ├── components
│           │   └── HubLayout.css
│           ├── scripts
│           │   └── i18n-runtime.js
│           └── styles
│               ├── tokens.css
│               └── typography.css
├── archive
│   └── fixed_image.png
├── books
│   ├── _template
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── introduction.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── arsitektur-kernel-linux
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-arsitektur-kernel-linux.md
│   │   │       ├── 02_struktur-monolitik-dan-filosofi-desain.md
│   │   │       ├── 03_manajemen-proses-dan-task-scheduling.md
│   │   │       ├── 04_sistem-manajemen-memori.md
│   │   │       ├── 05_system-calls-antarmuka-user-kernel.md
│   │   │       ├── 06_penanganan-interupsi-dan-exception.md
│   │   │       ├── 07_virtual-file-system-vfs.md
│   │   │       ├── 08_arsitektur-device-driver.md
│   │   │       ├── 09_networking-stack-di-dalam-kernel.md
│   │   │       ├── 10_mekanisme-sinkronisasi-kernel.md
│   │   │       ├── 11_keamanan-kernel-namespaces-dan-cgroups.md
│   │   │       ├── 12_proses-booting-dan-inisialisasi-sistem.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── bias-kognitif
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-bias-kognitif.md
│   │   │       ├── 02_heuristik-akar-dari-bias.md
│   │   │       ├── 03_bias-konfirmasi-confirmation-bias.md
│   │   │       ├── 04_efek-jangkar-anchoring-effect-pesona-informasi-pertama.md
│   │   │       ├── 05_bias-ketersediaan-availability-heuristic.md
│   │   │       ├── 06_efek-dunning-kruger-paradoks-ketidaktahuan.md
│   │   │       ├── 07_kekeliruan-biaya-tertanam-sunk-cost-fallacy.md
│   │   │       ├── 08_efek-halo-dan-efek-tanduk-ketika-satu-kesan-mengubah-segalanya.md
│   │   │       ├── 09_bias-kelompok-in-group-bias-dinamika-kita-vs-mereka.md
│   │   │       ├── 10_bias-retrospeksi-hindsight-bias-fenomena-aku-sudah-tahu-itu-bakal-terjadi.md
│   │   │       ├── 11_dampak-bias-dalam-pengambilan-keputusan.md
│   │   │       ├── 12_teknik-mitigasi-dan-debiasing-melawan-arus-insting-untuk-keputusan-lebih-jernih.md
│   │   │       ├── 13_membangun-objektivitas-berkelanjutan-seni-melihat-dunia-tanpa-filter.md
│   │   │       └── 14_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── digital-minimalisme
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pendahuluan-digital-minimalisme-mengambil-kendali-.md
│   │   │       ├── 02_psikologi-di-balik-ekonomi-perhatian-mengapa-layar.md
│   │   │       ├── 03_menentukan-nilai-nilai-inti-kehidupan.md
│   │   │       ├── 04_metode-digital-declutter-pembersihan-total.md
│   │   │       ├── 05_prinsip-optimalisasi-penggunaan-alat-seni-menajamk.md
│   │   │       ├── 06_pentingnya-kesendirian-dan-refleksi-menemukan-kemb.md
│   │   │       ├── 07_membangun-rekreasi-berkualitas-tinggi-menemukan-ke.md
│   │   │       ├── 08_menjinakkan-gangguan-manajemen-komunikasi-dan-noti.md
│   │   │       ├── 09_digital-minimalisme-dalam-lingkungan-kerja-menguba.md
│   │   │       ├── 10_menjaga-keberlanjutan-gaya-hidup-menanam-akar-digi.md
│   │   │       └── 11_keberlanjutan-gaya-hidup-minimalis-menjaga-api-tet.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── eksistensialisme-dan-makna-hidup
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-eksistensialisme-menemukan-diri-di-dunia-yang-tak-bertuan.md
│   │   │       ├── 02_akar-historis-kierkegaard-dan-nietzsche.md
│   │   │       ├── 03_menghadapi-absurditas-dunia-pelajaran-dari-albert-camus.md
│   │   │       ├── 04_kebebasan-radikal-dan-beban-tanggung-jawab.md
│   │   │       ├── 05_kecemasan-angst-sebagai-gerbang-kesadaran.md
│   │   │       ├── 06_autentisitas-vs-bad-faith-keyakinan-buruk-menanggalkan-topeng-menjadi-diri.md
│   │   │       ├── 07_nietzsche-dan-transformasi-nilai.md
│   │   │       ├── 08_logoterapi-menemukan-makna-dalam-penderitaan.md
│   │   │       ├── 09_relasi-antarmanusia-antara-konflik-dan-kehadiran.md
│   │   │       ├── 10_eksistensialisme-feminis-menjadi-perempuan.md
│   │   │       ├── 11_menciptakan-makna-di-dunia-modern-menjadi-autentik-di-tengah-deru-digital.md
│   │   │       ├── 12_kesimpulan.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── filosofi-stoikisme
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengenalan-stoikisme-seni-menavigasi-badai-kehidupan.md
│   │   │       ├── 02_sejarah-dan-evolusi-stoikisme-dari-teras-athena-ke-istana-romawi.md
│   │   │       ├── 03_konsep-utama-dikotomi-kendali.md
│   │   │       ├── 04_tiga-pilar-stoikisme-logika-fisika-dan-etika.md
│   │   │       ├── 05_empat-kebajikan-utama-cardinal-virtues-kompas-moral-kaum-stoik.md
│   │   │       ├── 06_hidup-selaras-dengan-alam-living-in-accordance-with-nature.md
│   │   │       ├── 07_memahami-pathe-ketika-emosi-menjadi-penyakit-jiwa.md
│   │   │       ├── 08_latihan-praktis-premeditatio-malorum.md
│   │   │       ├── 09_amor-fati-mencintai-takdir.md
│   │   │       ├── 10_memento-mori-kesadaran-akan-kefanaan.md
│   │   │       └── 11_tiga-tokoh-besar-stoikisme-romawi-dari-budak-hingga-kaisar.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── fungsi-manajemen-poac
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pendahuluan-memahami-esensi-manajemen-dan-poac.md
│   │   │       ├── 02_planning-menentukan-arah-dan-tujuan-organisasi.md
│   │   │       ├── 03_teknik-perencanaan-dan-pengambilan-keputusan.md
│   │   │       ├── 04_organizing-membangun-struktur-dan-pembagian-kerja.md
│   │   │       ├── 05_delegasi-wewenang-dan-alokasi-sumber-daya.md
│   │   │       ├── 06_actuating-menggerakkan-roda-organisasi.md
│   │   │       ├── 07_kepemimpinan-dan-motivasi-dalam-pelaksanaan.md
│   │   │       ├── 08_controlling-memastikan-kesesuaian-dengan-rencana.md
│   │   │       ├── 09_tindakan-korektif-dan-evaluasi-kinerja.md
│   │   │       ├── 10_siklus-manajemen-keterkaitan-antar-fungsi-poac.md
│   │   │       ├── 11_poac-di-era-digital-dan-manajemen-modern.md
│   │   │       ├── 12_studi-kasus-penerapan-poac.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── kecerdasan-interpersonal
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_fondasi-kecerdasan-interpersonal.md
│   │   │       ├── 02_seni-mendengar-aktif-dan-empati.md
│   │   │       ├── 03_komunikasi-verbal-dan-non-verbal-yang-efektif.md
│   │   │       ├── 04_memahami-berbagai-gaya-kerja-dan-kepribadian.md
│   │   │       ├── 05_kolaborasi-lintas-departemen-cross-functional.md
│   │   │       ├── 06_manajemen-konflik-dan-resolusi-masalah.md
│   │   │       ├── 07_persuasi-dan-memberi-pengaruh-tanpa-otoritas.md
│   │   │       ├── 08_memberi-dan-menerima-umpan-balik-feedback.md
│   │   │       ├── 09_fasilitasi-rapat-dan-diskusi-kolaboratif.md
│   │   │       ├── 10_membangun-kepercayaan-dan-keamanan-psikologis.md
│   │   │       ├── 11_etika-komunikasi-digital-dan-kolaborasi-virtual.md
│   │   │       ├── 12_kepemimpinan-interpersonal-dalam-tim-t-shaped.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── literasi-keuangan
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-literasi-keuangan.md
│   │   │       ├── 02_konsep-dasar-keuangan-pribadi.md
│   │   │       ├── 03_anggaran-dan-perencanaan-keuangan.md
│   │   │       ├── 04_menabung-dan-berinvestasi.md
│   │   │       ├── 05_manajemen-utang-yang-sehat.md
│   │   │       ├── 06_pentingnya-kredit-dan-skor-kredit.md
│   │   │       ├── 07_asuransi-dan-manajemen-risiko.md
│   │   │       ├── 08_perencanaan-pensiun.md
│   │   │       ├── 09_mencapai-tujuan-keuangan.md
│   │   │       ├── 10_mengenali-dan-menghindari-penipuan-keuangan.md
│   │   │       └── 11_perencanaan-pajak-dasar.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── logika-dan-penalaran-kritis
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_dasar-dasar-berpikir-kritis.md
│   │   │       ├── 02_logika-deduktif-vs-induktif-memahami-kepastian-dan-probabilitas.md
│   │   │       ├── 03_anatomi-argumen-premis-dan-konklusi.md
│   │   │       ├── 04_apa-itu-sesat-pikir-logical-fallacy.md
│   │   │       ├── 05_memahami-bias-kognitif-kacamata-buram-otak-kita.md
│   │   │       ├── 06_analisis-hubungan-sebab-akibat-mengurai-benang-kusut-peristiwa.md
│   │   │       ├── 07_evaluasi-bukti-dan-kredibilitas-sumber-menjadi-detektif-di-era-post-truth.md
│   │   │       ├── 08_bahasa-dan-retorika-dalam-penalaran.md
│   │   │       ├── 09_pemecahan-masalah-secara-sistematis.md
│   │   │       ├── 10_penalaran-etis-dan-pengambilan-keputusan-di-mana-logika-bertemu-nurani.md
│   │   │       ├── 11_memahami-medan-perang-misinformasi-vs-disinformasi.md
│   │   │       └── 12_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── matriks-keputusan-decision-matrix
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_matriks-keputusan-decision-matrix.md
│   │   │       ├── 02_manfaat-dan-kegunaan-matriks-keputusan.md
│   │   │       ├── 03_anatomi-dan-komponen-utama-membedah-struktur-matriks-keputusan.md
│   │   │       ├── 04_langkah-1-identifikasi-alternatif-pilihan.md
│   │   │       ├── 05_langkah-2-menentukan-kriteria-penilaian.md
│   │   │       ├── 06_langkah-3-pemberian-bobot-pada-kriteria.md
│   │   │       ├── 07_langkah-4-menentukan-skala-dan-sistem-penilaian.md
│   │   │       ├── 08_langkah-5-perhitungan-skor-berbobot.md
│   │   │       ├── 09_analisis-sensitivitas-dan-validasi-hasil.md
│   │   │       ├── 10_variasi-matriks-pugh-dan-unweighted-matrix.md
│   │   │       ├── 11_menghindari-bias-dan-kesalahan-umum.md
│   │   │       ├── 12_studi-kasus-implementasi-dalam-dunia-nyata.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── menemukan-tujuan-hidup-ikigai
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pendahuluan-memahami-konsep-ikigai.md
│   │   │       ├── 02_empat-pilar-utama-ikigai.md
│   │   │       ├── 03_zona-persimpangan-mengurai-makna-ikigai.md
│   │   │       ├── 04_eksplorasi-diri.md
│   │   │       ├── 05_mengidentifikasi-kekuatan.md
│   │   │       ├── 06_berperan-bagi-dunia.md
│   │   │       ├── 07_menciptakan-nilai.md
│   │   │       ├── 08_menyusun-peta-ikigai-pribadi.md
│   │   │       ├── 09_hidup-dengan-ikigai.md
│   │   │       ├── 10_kisah-inspiratif-dan-contoh-nyata.md
│   │   │       ├── 11_refleksi-berkelanjutan.md
│   │   │       └── 12_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── metakognisi
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-metakognisi-mengenal-konsep-belajar-cara-belajar.md
│   │   │       ├── 02_komponen-komponen-metakognisi-pengetahuan-deklaratif-prosedural-dan-ko.md
│   │   │       ├── 03_proses-metakognitif-inti-siklus-perencanaan-pemantauan-dan-evaluasi.md
│   │   │       ├── 04_strategi-metakognitif-praktis-mengasah-keterampilan-belajar.md
│   │   │       ├── 05_dampak-metakognisi-meningkatkan-pemahaman-dan-prestasi-akademik.md
│   │   │       ├── 06_mengembangkan-kesadaran-metakognitif-latihan-untuk-pikiran.md
│   │   │       ├── 07_metakognisi-dalam-pemecahan-masalah-kunci-berpikir-sistematis.md
│   │   │       ├── 08_aplikasi-metakognisi-lintas-bidang-contoh-dalam-matematika-sains-dan-b.md
│   │   │       ├── 09_mengatasi-hambatan-dalam-latihan-metakognisi.md
│   │   │       ├── 10_metakognisi-dan-pembelajaran-regulasi-diri-menuju-pembelajar-mandiri.md
│   │   │       └── 11_studi-kasus-dan-aplikasi-nyata-metakognisi-dalam-aksi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── multiple-intelligences
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_fondasi-teori-kecerdasan-majemuk.md
│   │   │       ├── 02_kecerdasan-linguistik.md
│   │   │       ├── 03_kecerdasan-logis-matematis.md
│   │   │       ├── 04_kecerdasan-spasial.md
│   │   │       ├── 05_kecerdasan-kinestetik-jasmani.md
│   │   │       ├── 06_kecerdasan-musikal.md
│   │   │       ├── 07_kecerdasan-interpersonal.md
│   │   │       ├── 08_kecerdasan-intrapersonal.md
│   │   │       ├── 09_kecerdasan-naturalis.md
│   │   │       ├── 10_kecerdasan-eksistensial.md
│   │   │       ├── 11_implementasi-teori-kecerdasan-majemuk.md
│   │   │       ├── 12_kritik-evaluasi-masa-depan.md
│   │   │       ├── 13_melihat-kacamata-kritis.md
│   │   │       ├── 14_strategi-mengembangkan.md
│   │   │       └── 15_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── neuroplastisitas-dalam-belajar
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-neuroplastisitas-keajaiban-otak-yang-ter.md
│   │   │       ├── 02_anatomi-pembelajaran-neuron-dan-sinapsis.md
│   │   │       ├── 03_mekanisme-pembentukan-jalur-saraf-bagaimana-otak-m.md
│   │   │       ├── 04_prinsip-hebbian-fire-together-wire-together.md
│   │   │       ├── 05_neurogenesis-kelahiran-sel-saraf-baru.md
│   │   │       ├── 06_faktor-lingkungan-yang-memacu-plastisitas.md
│   │   │       ├── 07_peran-fokus-dan-atensi-dalam-perubahan-otak-sang-p.md
│   │   │       ├── 08_psikologi-belajar-growth-mindset-vs-fixed-mindset.md
│   │   │       ├── 09_jembatan-sains-bagaimana-mindset-mengubah-otak.md
│   │   │       ├── 10_strategi-belajar-berbasis-neuroplastisitas-menguki.md
│   │   │       ├── 11_dampak-gaya-hidup-terhadap-efisiensi-sinaptik.md
│   │   │       ├── 12_1-memahami-anatomi-plateu-mengapa-kita-stuck.md
│   │   │       └── 13_masa-depan-pendidikan-berbasis-neurosains-merevolu.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── nudge-theory
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-nudge-theory.md
│   │   │       ├── 02_dual-process-theory-sistem-1-dan-sistem-2.md
│   │   │       ├── 03_prinsip-libertarian-paternalisme-keseimbangan-antara-kebebasan-dan-kesejahteraan.md
│   │   │       ├── 04_kekuatan-pilihan-standar-defaults.md
│   │   │       ├── 05_mengantisipasi-kesalahan-expect-error.md
│   │   │       ├── 06_umpan-balik-feedback-yang-efektif.md
│   │   │       ├── 07_pemetaan-mapping-dari-pilihan-ke-hasil.md
│   │   │       ├── 08_menyederhanakan-pilihan-yang-kompleks.md
│   │   │       ├── 09_struktur-insentif-dan-salience-membuat-yang-penting-menjadi-terlihat.md
│   │   │       ├── 10_nudge-vs-sludge-etika-dalam-desain.md
│   │   │       ├── 11_studi-kasus-kesehatan-keuangan-dan-lingkungan.md
│   │   │       ├── 12_metodologi-merancang-nudge-basic-framework.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── pembelajaran-multidisiplin
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-pembelajaran-multidisiplin.md
│   │   │       ├── 02_membedakan-multidisiplin-interdisiplin-dan-transdisiplin.md
│   │   │       ├── 03_manfaat-dan-keunggulan-pembelajaran-multidisiplin.md
│   │   │       ├── 04_tantangan-dan-hambatan-dalam-pembelajaran-multidisiplin.md
│   │   │       ├── 05_strategi-efektif-mengimplementasikan-pembelajaran-multidisiplin.md
│   │   │       ├── 06_mengembangkan-keterampilan-esensial-pembelajaran-multidisiplin.md
│   │   │       ├── 07_peran-teknologi-dalam-mendukung-pembelajaran-multidisiplin.md
│   │   │       ├── 08_desain-kurikulum-dan-program-multidisiplin.md
│   │   │       ├── 09_asesmen-dan-evaluasi-dalam-konteks-multidisiplin.md
│   │   │       ├── 10_studi-kasus-penerapan-pembelajaran-multidisiplin.md
│   │   │       ├── 11_masa-depan-pembelajaran-multidisiplin-dan-tren-yang-muncul.md
│   │   │       └── 12_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── piaget
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-jean-piaget-dan-genetika-epistemologi.md
│   │   │       ├── 02_konsep-dasar-skema-dan-struktur-kognitif.md
│   │   │       ├── 03_proses-adaptasi-asimilasi-dan-akomodasi.md
│   │   │       ├── 04_ekuilibrasi-dinamika-keseimbangan-berpikir.md
│   │   │       ├── 05_tahap-sensorimotor-membangun-dunia-lewat-indra-dan-gerak.md
│   │   │       ├── 06_tahap-praoperasional-dunia-simbol-dan-imajinasi.md
│   │   │       ├── 07_tahap-operasional-konkret-ketika-logika-mulai-berakar.md
│   │   │       ├── 08_tahap-operasional-formal-gerbang-menuju-pemikiran-tanpa-batas.md
│   │   │       ├── 09_peran-lingkungan-fisik-dalam-perkembangan.md
│   │   │       ├── 10_implikasi-teori-piaget-dalam-strategi-pembelajaran.md
│   │   │       ├── 11_kritik-terhadap-teori-piaget.md
│   │   │       └── 12_ringkasan-dan-sintesis-perkembangan-anak.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── psikologi-positif
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-psikologi-positif-memahami-sisi-terang-manusia.md
│   │   │       ├── 02_model-kesejahteraan-perma-lima-pilar-menuju-kehidupan-yang-berkembang-flourishing.md
│   │   │       ├── 03_emosi-positif-dan-teori-broaden-and-build.md
│   │   │       ├── 04_kekuatan-karakter-dan-kebajikan-via-strengths.md
│   │   │       ├── 05_konsep-flow-pengalaman-optimal.md
│   │   │       ├── 06_growth-mindset-rahasia-di-balik-potensi-tanpa-batas.md
│   │   │       ├── 07_resiliensi-dan-pertumbuhan-pasca-trauma-seni-menemukan-kekuatan-dalam-retakan.md
│   │   │       ├── 08_kekuatan-rasa-syukur-gratitude.md
│   │   │       ├── 09_optimisme-dan-gaya-penjelasan-seni-berbicara-pada-diri-sendiri.md
│   │   │       ├── 10_hubungan-sosial-yang-positif-jembatan-menuju-kesejahteraan.md
│   │   │       ├── 11_makna-dan-tujuan-hidup-meaning-in-life.md
│   │   │       ├── 12_penerapan-psikologi-positif-dalam-kehidupan-sehari-hari.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── quarter-life-crisis
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_memahami-quarter-life-crisis.md
│   │   │       ├── 02_mengenali-gejala-dan-tanda-tanda-utama-quarter-life-crisis.md
│   │   │       ├── 03_penyebab-utama-di-balik-krisis-usia-20-an.md
│   │   │       ├── 04_psikologi-perkembangan-dewasa-muda-memahami-fase-emerging-adulthood.md
│   │   │       ├── 05_kecemasan-karier-dan-tekanan-pekerjaan-impian.md
│   │   │       ├── 06_dampak-media-sosial-dan-perbandingan-sosial-perangkap-highlight-reel-di-usia-20-an.md
│   │   │       ├── 07_kemandirian-finansial-dan-tekanan-ekonomi.md
│   │   │       ├── 08_krisis-identitas-dan-pencarian-makna-hidup-menemukan-kompas-di-tengah-badai-pilihan.md
│   │   │       ├── 09_strategi-koping-dan-manajemen-stres-navigasi-di-tengah-badai-quarter-life-crisis.md
│   │   │       ├── 10_membangun-resiliensi-dan-ketangguhan-mental-menjadi-baja-yang-melentur.md
│   │   │       ├── 11_kapan-harus-mencari-bantuan-profesional.md
│   │   │       ├── 12_mengubah-krisis-menjadi-transformasi-positif-menemukan-versi-terbaik-dirimu.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── resiliensi-dan-ketangguhan
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_dasar-dasar-resiliensi-dan-ketangguhan.md
│   │   │       ├── 02_pola-pikir-berkembang-growth-mindset-pondasi-utama-resiliensi.md
│   │   │       ├── 03_kecerdasan-emosional-dalam-krisis-menavigasi-badai-tanpa-kehilangan-arah.md
│   │   │       ├── 04_seni-membingkai-ulang-cognitive-reframing.md
│   │   │       ├── 05_grit-kekuatan-gairah-dan-ketekunan.md
│   │   │       ├── 06_self-compassion-belas-kasih-pada-diri-sendiri.md
│   │   │       ├── 07_membangun-jaring-pengaman-sosial-mengapa-kita-tidak-bisa-tangguh-sendirian.md
│   │   │       ├── 08_fleksibilitas-kognitif-dan-adaptasi-seni-menjadi-air-di-dunia-yang-terus-berubah.md
│   │   │       ├── 09_manajemen-stres-dan-pemulihan-energi.md
│   │   │       ├── 10_menemukan-makna-di-balik-tantangan-seni-bertumbuh-melalui-badai.md
│   │   │       ├── 11_protokol-jurnal-resiliensi-harian.md
│   │   │       ├── 12_visi-masa-depan-yang-tangguh-menjadikan-resiliensi-sebagai-gaya-hidup.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── sejarah-evolusi-drama-korea
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_akar-awal-era-drama-radio-dan-kelahiran-televisi.md
│   │   │       ├── 02_era-hitam-putih-dan-formasi-dasar-1960-an-kelahiran-sang-raksasa-layar-kaca.md
│   │   │       ├── 03_revolusi-tv-berwarna-dan-ekspansi-genre-1970-an-1980-an.md
│   │   │       ├── 04_kebangkitan-stasiun-swasta-dan-era-persaingan-1990-an.md
│   │   │       ├── 05_gelombang-hallyu-pertama-ledakan-di-asia-awal-2000-an.md
│   │   │       ├── 06_modernisasi-narasi-komedi-romantis-dan-melodrama-modern.md
│   │   │       ├── 07_era-digital-dan-aksesibilitas-global-2010-an.md
│   │   │       ├── 08_revolusi-platform-ott-dan-produksi-original-2016-sekarang.md
│   │   │       ├── 09_diversifikasi-konten-adaptasi-webtoon-dan-eksperimen-genre.md
│   │   │       ├── 10_ekosistem-produksi-peran-penulis-skenario-dan-strategi-ost.md
│   │   │       ├── 11_dampak-budaya-diplomasi-soft-power-dan-masa-depan-k-drama.md
│   │   │       └── 12_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── shared-header.css
│   ├── shared-script.js
│   ├── sistem-modul-rust
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengenalan-sistem-modul-rust.md
│   │   │       ├── 02_deklarasi-modul-dengan-kata-kunci-mod.md
│   │   │       ├── 03_kontrol-akses-dan-visibilitas-dengan-pub.md
│   │   │       ├── 04_memisahkan-modul-ke-dalam-file-terpisah.md
│   │   │       ├── 05_mengelola-kompleksitas-hierarki-modul-dengan-folder.md
│   │   │       ├── 06_memahami-pohon-modul-module-tree.md
│   │   │       ├── 07_penyederhanaan-scope-dengan-kata-kunci-use.md
│   │   │       ├── 08_navigasi-hierarki-dengan-super-dan-self.md
│   │   │       ├── 09_re-exporting-dengan-pub-use-menciptakan-antarmuka-yang-elegan.md
│   │   │       ├── 10_perbandingan-struktur-mod-rs-vs-pola-modern.md
│   │   │       ├── 11_filosofi-organisasi-analogi-perpustakaan-kota.md
│   │   │       ├── 12_filosofi-organisasi-kode-di-rust.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── state-of-flow
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pengantar-state-of-flow.md
│   │   │       ├── 02_mihaly-csikszentmihalyi-dan-sejarah-flow.md
│   │   │       ├── 03_sembilan-karakteristik-kondisi-flow.md
│   │   │       ├── 04_neurobiologi-di-balik-kondisi-alir.md
│   │   │       ├── 05_pemicu-masuk-ke-kondisi-flow.md
│   │   │       ├── 06_model-tantangan-vs-keterampilan.md
│   │   │       ├── 07_flow-dan-peningkatan-produktivitas.md
│   │   │       ├── 08_penghambat-utama-kondisi-flow.md
│   │   │       ├── 09_teknik-praktis-memasuki-state-of-flow.md
│   │   │       ├── 10_flow-dalam-konteks-tim-dan-organisasi.md
│   │   │       ├── 11_sisi-gelap-dan-risiko-kondisi-flow.md
│   │   │       ├── 12_masa-depan-riset-state-of-flow.md
│   │   │       └── 13_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   ├── teori-teori-kepribadian
│   │   ├── book.toml
│   │   ├── icon.txt
│   │   ├── src
│   │   │   ├── SUMMARY.md
│   │   │   └── content
│   │   │       ├── 01_pendahuluan-memahami-kepribadian.md
│   │   │       ├── 02_pendekatan-psikodinamika-freud-dan-pengikutnya.md
│   │   │       ├── 03_pendekatan-humanistik-aktualisasi-diri-dan-pertumbuhan.md
│   │   │       ├── 04_pendekatan-behavioristik-dan-belajar-sosial.md
│   │   │       ├── 05_pendekatan-trait-sifat-sifat-kepribadian.md
│   │   │       ├── 06_pendekatan-kognitif-peran-pikiran-dalam-kepribadian.md
│   │   │       ├── 07_pendekatan-biologis-dan-evolusioner-dalam-teori-kepribadian.md
│   │   │       ├── 08_pengukuran-dan-penilaian-kepribadian.md
│   │   │       ├── 09_integrasi-dan-perbandingan-teori-kepribadian.md
│   │   │       ├── 10_aplikasi-teori-kepribadian-dalam-kehidupan-nyata.md
│   │   │       ├── 11_asesmen-kepribadian-dan-aplikasinya.md
│   │   │       └── 12_referensi.md
│   │   └── theme
│   │       ├── favicon.png
│   │       └── favicon.svg
│   └── virtue-ethics-aristoteles
│       ├── book.toml
│       ├── icon.txt
│       ├── src
│       │   ├── SUMMARY.md
│       │   └── content
│       │       ├── 01_pengantar-etika-kebajikan-menjadi-pribadi-yang-baik.md
│       │       ├── 02_akar-filosofis-aristoteles-dan-tradisi-klasik.md
│       │       ├── 03_konsep-eudaimonia-melampaui-sekadar-kesenangan.md
│       │       ├── 04_arete-definisi-dan-jenis-jenis-keutamaan.md
│       │       ├── 05_habituasi-membentuk-karakter-melalui-kebiasaan.md
│       │       ├── 06_doktrin-jalan-tengah-the-golden-mean-seni-menemukan-keseimbangan-moral.md
│       │       ├── 07_phronesis-sang-navigasi-dalam-labirin-kehidupan.md
│       │       ├── 08_kesatuan-karakter-dan-integritas-harmoni-di-balik-keutamaan.md
│       │       ├── 09_konteks-sosial-kebajikan-dalam-komunitas-polis.md
│       │       ├── 10_etika-kebajikan-vs-teori-etika-modern.md
│       │       ├── 11_kebangkitan-etika-kebajikan-kontemporer-menemukan-kembali-jiwa-dalam-moralitas.md
│       │       ├── 12_panduan-praktis.md
│       │       └── 13_referensi.md
│       └── theme
│           ├── favicon.png
│           └── favicon.svg
├── build-icons
│   └── app.png
├── bun.lock
├── data
│   └── subject-labels.json
├── db
│   ├── migrations
│   │   ├── 0001_init.sql
│   │   ├── 0002_progress.sql
│   │   ├── 0003_progress_completion.sql
│   │   ├── 0004_book_subject_label.sql
│   │   └── 0005_book_view_count.sql
│   ├── seed.sql
│   ├── seed_0.sql
│   ├── seed_2.sql
│   ├── seed_3.sql
│   ├── seed_4.sql
│   ├── seed_5.sql
│   ├── seed_6.sql
│   ├── seed_7.sql
│   ├── seed_8.sql
│   └── seed_9.sql
├── docs
│   ├── ADMIN_AUDIT.md
│   ├── ADMIN_DESIGN_REQUIREMENTS_MAP.md
│   ├── CORS_AUDIT_REPORT.md
│   ├── DESIGN_REQUIREMENTS_MAP.md
│   ├── GITIGNORE_AUDIT_REPORT.md
│   ├── LATEX_SUPPORT_AUDIT.md
│   ├── MDBOOK_RULES_AUDIT_REPORT.md
│   ├── MDBOOK_SEO_AUDIT_REPORT.md
│   ├── MDBOOK_SEO_RULES.md
│   ├── MEDIA_EMBED_AUDIT.md
│   ├── MOBILE_AUDIT.md
│   ├── MOBILE_AUDIT_REPORT.md
│   ├── NAVIGATION_AUDIT_REPORT.md
│   ├── REORG_PLAN.md
│   ├── SECRET_AUDIT_REPORT.md
│   ├── SECRET_ROTATION_RUNBOOK.md
│   ├── SECURITY_AUDIT_REPORT.md
│   ├── SEO_Rules_and_Criteria.md
│   ├── TDD_AUDIT_REPORT.md
│   ├── THEME_TOGGLE_AUDIT_REPORT.md
│   ├── UIUX_AUDIT_REPORT.md
│   ├── audits
│   │   ├── error-handling-logging-audit.md
│   │   └── findings
│   │       ├── navigation-audit-findings.json
│   │       ├── security-audit-findings.json
│   │       ├── theme-toggle-audit-findings.json
│   │       └── uiux-audit-findings.json
│   ├── cors-audit-findings.json
│   ├── pake-build.md
│   └── secret-audit-findings.json
├── functions
│   ├── _middleware.ts
│   ├── admin
│   │   └── [[catchall]].ts
│   ├── api
│   │   ├── books
│   │   │   ├── [slug]
│   │   │   │   └── view.ts
│   │   │   ├── [slug].ts
│   │   │   └── index.ts
│   │   └── progress.ts
│   └── lib
│       ├── auth.ts
│       ├── gating.ts
│       └── i18n.ts
├── i18n
│   ├── en.json
│   └── id.json
├── package.json
├── patch_shared.js
├── patch_shared2.js
├── patch_shared3.js
├── patch_sw.js
├── public
│   ├── icons
│   │   ├── icon-192.svg
│   │   └── icon-512.svg
│   ├── offline.html
│   ├── pake-compat.js
│   └── sw.js
├── raw_md
│   ├── 1.md
│   ├── 10.md
│   ├── 11.md
│   ├── 2.md
│   ├── 3.md
│   ├── 4.md
│   ├── 5.md
│   ├── 6.md
│   ├── 7.md
│   ├── 8.md
│   ├── 9.md
│   └── teori-teori-kepribadian
│       ├── 1.md
│       ├── 10.md
│       ├── 11.md
│       ├── 2.md
│       ├── 3.md
│       ├── 4.md
│       ├── 5.md
│       ├── 6.md
│       ├── 7.md
│       ├── 8.md
│       └── 9.md
├── remove_pwa.js
├── scripts
│   ├── build.ts
│   ├── check-latex-support.ts
│   ├── check-media-support.ts
│   ├── check-seo-live.sh
│   ├── check-seo.ts
│   ├── deploy-website.sh
│   ├── fix_anda.js
│   ├── fix_chapters.js
│   ├── generate-build-icons.js
│   ├── generate-sitemap.ts
│   ├── inject-gating.ts
│   ├── migrate-to-d1.ts
│   ├── public
│   │   ├── icons
│   │   │   ├── icon-192.svg
│   │   │   └── icon-512.svg
│   │   ├── manifest.webmanifest
│   │   ├── offline.html
│   │   ├── register-sw.js
│   │   └── sw.js
│   ├── rename_bab.js
│   ├── scaffold-mdbook.py
│   ├── set-user-badge.ts
│   ├── sync-template.ts
│   ├── test-gating.js
│   ├── test-gating.sh
│   └── test-i18n.sh
├── simulate.js
├── test-post.js
├── test-sw.js
├── tests
│   ├── admin
│   │   ├── book-service.test.ts
│   │   └── security.test.ts
│   ├── books
│   │   └── shared-script.test.ts
│   ├── db
│   │   └── migrations.test.ts
│   ├── fixtures
│   │   ├── gated_chapter.html
│   │   └── public_chapter.html
│   ├── functions
│   │   ├── api
│   │   │   ├── books.test.ts
│   │   │   ├── progress.test.ts
│   │   │   └── slug.test.ts
│   │   ├── gating.test.ts
│   │   └── lib
│   │       └── i18n.test.ts
│   ├── helpers
│   │   └── mocks.ts
│   ├── scripts
│   │   ├── build.test.ts
│   │   ├── generate-sitemap.test.ts
│   │   └── inject-gating.test.ts
│   └── seo
└── wrangler.toml
```
