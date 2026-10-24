# Quotation audit of 54 books (2026-10-25)

Plan: `docs/code-plan/plans/2026-10-24-dawnbook-attribution-fixes.md`, backlog item "same-class audit of the other 54 books".
Scope: every direct quotation attributed to a named person, organisation or work in `books/*/src/content` on `main` b02d9e17, excluding the six books audited on 2026-10-24 (digital-minimalisme, filosofi-stoikisme, literasi-keuangan, metakognisi, neuroplastisitas-dalam-belajar, piaget). Read-only: seven researcher batches plus one leftover batch, each quotation searched on the web (Wikiquote, Quote Investigator, primary texts, publisher pages); the parent re-checked the two gravest findings (UU 24/2007 full text; the five Durant lines).
Method limits: candidates were found by pattern scans, not a full read of every chapter; "UNVERIFIED" means no source was found, not that the quote is false; several "VERIFIED" rows rest on search snippets rather than fetched primary text. Unattributed epigraphs and the book's own callouts were out of scope unless they turned out to be lifted from someone else.

## Totals

| Class | Count |
|---|---|
| VERIFIED or CITED-OK | about 45 |
| MISATTRIBUTED | 15 |
| ALTERED (wording changed or composite shown as verbatim) | 15 |
| UNVERIFIED | 17 |
| Lifted without credit | 5 |

## Problems, by book (file:line on b02d9e17; files are `NN_*.md` under `books/<slug>/src/content/`)

| Book | Where | Quote (start) / claim | Class | Evidence |
|---|---|---|---|---|
| sistem-peringatan-dini-early-warning-system | 04:13 | quoted as UU 24/2007: "... wajib mengintegrasikan sistem peringatan dini" | ALTERED (text not in the law) | UU 24/2007 full text (jdih.kemenkeu.go.id): 0 hits for "mengintegrasikan"; Pasal 33 lists the three stages only; the first sentence matches PP 21/2008 Pasal 3 |
| sistem-peringatan-dini-early-warning-system | 05:5-6 | four EWS elements | MISATTRIBUTED (UNESCO) | UN/ISDR, *Developing Early Warning Systems: A Checklist* (EWC III, 2006) |
| virtue-ethics-aristoteles | 01:17, 05:11 (no hedge); 02:75, 04:73, 12:80 (hedged) | "Kita adalah apa yang kita kerjakan berulang kali" | MISATTRIBUTED | Will Durant, *The Story of Philosophy* (1926); Wikiquote Aristotle, Misattributed |
| resiliensi-dan-ketangguhan | 03:38 | "Antara stimulus dan respons, ada sebuah ruang" (Frankl) | MISATTRIBUTED | quoteinvestigator.com/2018/02/18/response |
| resiliensi-dan-ketangguhan | 08:16 | "Ukuran kecerdasan adalah kemampuan untuk berubah" (Einstein) | MISATTRIBUTED | Wikiquote Einstein, no source before 2008-2013 |
| resiliensi-dan-ketangguhan | 12:98 | "Kita tidak naik ke tingkat harapan kita..." (Archilochus) | MISATTRIBUTED (weak) | not in the fragments; modern Navy SEAL line |
| resiliensi-dan-ketangguhan | 09:90, 10:107 | Lou Holtz; Frankl "hidup tidak pernah dibuat tak tertahankan" | UNVERIFIED | no primary source |
| resiliensi-dan-ketangguhan | 04:11 | "Bukan peristiwa itu sendiri..." (Stoic, unnamed) | ALTERED | Epictetus, Enchiridion 5 |
| gegar-budaya | 12:104 | "Dunia adalah sebuah buku..." (St. Augustine) | MISATTRIBUTED | quoteinvestigator.com/2025/09/25/world-book |
| mekanisme-koping-dan-manajemen-stres | 07:82; also quarter-life-crisis 09:91 | "Kamu tidak bisa menghentikan ombak..." (Kabat-Zinn) | MISATTRIBUTED (partly) | poster caption of Swami Satchidananda that Kabat-Zinn quotes |
| mekanisme-koping-dan-manajemen-stres | 09:5 | Warren Buffett "mengatakan tidak pada hampir semua hal" | UNVERIFIED | no primary source |
| mekanisme-koping-dan-manajemen-stres | 03:11 | Kabat-Zinn mindfulness definition | VERIFIED, wrong work cited | Kabat-Zinn 2003 is not in Referensi |
| aerodinamika-dan-desain-airfoil | 12:210 | quote "mengacu pada prinsip George Box" | ALTERED (author's sentence) | Box: "all models are wrong, but some are useful" |
| psikologi-bencana-dan-manajemen-panik | 06:112 | Theodore Roosevelt "hal terbaik ... hal yang benar" | MISATTRIBUTED | Wikiquote Roosevelt, Disputed (1910 advertisement) |
| psikologi-bencana-dan-manajemen-panik | 10:19 | Gabor Maté on trauma | ALTERED | "Trauma is not what happens to you..." |
| psikologi-bencana-dan-manajemen-panik | 12:66 | "Prinsip Hebbian: neurons that fire together, wire together" | borderline | phrase by Carla Shatz (1992) |
| neurobiologi-motivasi-dopamin | 12:28 | "Prinsip Hebb: Neurons that fire together, wire together" | MISATTRIBUTED (wording) | Keysers and Gazzola 2014 (PMC4006178) |
| geopolitik-dalam-sejarah-piala-dunia | 02:23 | first-person "quote" of the fascist regime (1934) | ALTERED (invented text in quote format) | labelled "pesan implisit"; no source |
| geopolitik-dalam-sejarah-piala-dunia | 06:53 | Gen. Videla on the 1978 victory | UNVERIFIED | no source found |
| geopolitik-dalam-sejarah-piala-dunia | 03:68 | "perang tanpa peluru" vs "perang tanpa tembakan" (01:9) | consistency | Orwell, "The Sporting Spirit" (1945) |
| ekonomi-laissez-faire | 05:11 | "Pemerintah yang terbaik..." (Jefferson or Thoreau, hedged) | MISATTRIBUTED (hedged) | monticello.org spurious quotation |
| psikologi-positif | 01:5 | Seligman | ALTERED | *Authentic Happiness* p. 4; not in Referensi |
| psikologi-positif | 05:109 | Csikszentmihalyi on happiness | ALTERED (minor, cut unmarked) | *Flow* (1990) |
| psikologi-positif | 03:18, 08:14 | Fredrickson; Emmons | UNVERIFIED | paraphrases set as quotes |
| state-of-flow | 10:75 | "Group Flow" quote (Csikszentmihalyi) | UNVERIFIED, likely fabricated | the chapter credits group flow to Sawyer at line 9 |
| state-of-flow | 02:43, 02:13 | interviewee lines; a question in quotes | ALTERED; UNVERIFIED | Wikipedia Flow: "It was like floating" |
| eksistensialisme-dan-makna-hidup | 03:57 | Camus "dunia yang tidak bebas" | UNVERIFIED | Wikiquote Camus, Disputed |
| eksistensialisme-dan-kehendak-bebas | 02:40, 03:15, 06:13, 09:12, 10:9 | Sartre (four paraphrases shown verbatim) | ALTERED | *Existentialism Is a Humanism*; *Being and Nothingness* |
| eksistensialisme-dan-kehendak-bebas | 08:9 | Nietzsche will to power | ALTERED (composite of two works) | BGE 13 plus Zarathustra |
| menemukan-tujuan-hidup-ikigai | 02:46 | Gandhi "kehilangan dirimu dalam pelayanan" | UNVERIFIED (disputed) | Wikiquote Gandhi, Disputed |
| multiple-intelligences | 09:65 | Emerson "Alam tidak pernah terburu-buru" | UNVERIFIED (credit likely wrong) | not in Emerson's works; web credits Lao Tzu, also unsourced |
| multiple-intelligences | 11:5 | Howard Gardner, five lines | UNVERIFIED (likeliest fabrication) | no source, no page |
| teori-gaya-kelekatan | 02:93 | Bowlby "What cannot be spoken..." | ALTERED | "What cannot be communicated to the [m]other..." |
| teori-gaya-kelekatan | 12:100 | Brené Brown | VERIFIED, not in Referensi | brenebrown.com |
| peluruhan-beta | 06:18-20 | Pauli "sesuatu yang mengerikan" framed as the 1930 letter | ALTERED (framing) | not in the letter; reported remark (Reines) |
| fungsi-manajemen-poac | 08:118 | Drucker "apa yang tidak bisa diukur..." | UNVERIFIED (likely false) | no source |
| fungsi-manajemen-poac | 01:11 | management definition (unsigned) | UNVERIFIED | probably George Terry |
| quarter-life-crisis | 12:3 | Chinese "krisis" = bahaya + peluang | MISATTRIBUTED (myth) | Victor Mair, pinyin.info/chinese/crisis.html |
| quarter-life-crisis | 04:11 | Arnett paraphrase in quote format | UNVERIFIED as a quote | Arnett 2000 in Referensi |
| pembelajaran-multidisiplin | 10:49 | "Kolaborasi interdisipliner telah membuka jalan..." | LIFTED without credit | UltiDent Scientific blog, 2023-06-19 |
| pembelajaran-multidisiplin | 05:57 | "Sinergi yang muncul..." | UNVERIFIED | no source found |
| metodologi-microteaching | 13:96; 11:17; 05:49 | Joubert; Rick Tate (via Blanchard); Albers (inference) | LIFTED without credit, plus added sentences | wist.info Joubert; Blanchard LinkedIn post |
| relief-karmawibhangga-dan-hukum-sebab-akibat | 03:77 | "Sesuai dengan benih yang ditanam..." | LIFTED without credit | Samyutta Nikaya I p. 227 |

Clean or verified books with no problem found: arsitektur-kernel-linux (Torvalds 1991 verified), sistem-modul-rust, neurobiologi-sistem-vestibular, logika-dan-penalaran-kritis, bias-kognitif, matriks-keputusan-decision-matrix, struktur-pasar-dan-persaingan, teori-teori-kepribadian, soft-power-jepang-lewat-manga-dan-anime, tonsilektomi, kenapa-kita-gampang-percaya-hoax, psikologi-di-balik-keputusan-finansial-kita, nudge-theory, elastisitas-harga-permintaan-dan-penawaran, sejarah-evolusi-drama-korea, teori-permainan-game-theory, saat-dia-suka-tapi-kamu-tidak, kecerdasan-interpersonal, kenapa-kebiasaan-susah-diubah (Maltz verified), memahami-algoritma-x-untuk-pembaca, pelajaran-hidup-dari-harvest-moon-back-to-nature, siklus-hidrologi-mikrofisika-awan, human-capital-theory, strategi-manajemen-kelas-proaktif, pejorasi-dan-ameliorasi, kenapa-kita-suka-menunda-nunda, iklan-digital-dan-penargetan-algoritma, pengaruh-uang-terhadap-kebahagiaan (pattern scans found no named quotations in the last four).
Not re-checked here: analisis-ekspresif-9-summers-10-autumns novel quotes (page-cited; novel text not available) and the classroom transcripts of sistem-pengendalian-topik (checked against the article on 2026-10-24).
