import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadPremiumRegistry, setPremiumRegistryForTest } from "../../functions/lib/premium";
import { BOOK_VOICE_CONFIG, VOICE_CAPS, checkVoice, runVoiceGate, voiceViolations } from "../../scripts/check-voice";

const SCRIPT = path.resolve(import.meta.dir, "../../scripts/check-voice.ts");
const dirs: string[] = [];

function makeDir(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "dawnbook-voice-"));
  dirs.push(root);
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return root;
}

afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
  setPremiumRegistryForTest(null);
});

const CLEAN = "Si petani berhenti sebentar dan mengusap kening. Kamu tahu artinya: sudah waktunya istirahat.";
const PANDUAN = { word: "panduan", max: 2, firstChapterMax: 4 };

function runCli(args: string[]): { exitCode: number; stdout: string } {
  const r = Bun.spawnSync(["bun", "run", SCRIPT, ...args], { stdout: "pipe", stderr: "pipe" });
  return { exitCode: r.exitCode, stdout: r.stdout.toString() };
}

describe("voiceViolations generic caps", () => {
  test("VOICE_CAPS lists the seven generic caps with their limits", () => {
    expect(VOICE_CAPS.map((c) => [c.label, c.max])).toEqual([
      ["Kalau dipikir-pikir", 0],
      ["Menurut panduan", 0],
      ["tulis panduan", 0],
      ["mirip dengan", 1],
      ["stock connector", 0],
      ["bab berikutnya", 0],
      ["tokoh kita", 2],
      ["crutch words", 4],
      ["diperhatikan opener", 0],
      ["bridge heading", 0],
      ["chapter announcement", 2],
      ["evidence label", 0],
      ["Rujukan: tag", 0],
    ]);
  });

  test("an evidence label or a Rujukan: tag before a link is flagged, prose about evidence is not", () => {
    const label = "**Kekuatan bukti:** terbatas, satu studi kecil. Rujukan: [Studi](https://example.org/a).";
    expect(voiceViolations("05_x.md", label)).toEqual(["evidence label x1 (max 0)", "Rujukan: tag x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "**Kekuatan bukti**: sedang.")).toEqual(["evidence label x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Kekuatan bukti dari studi itu masih tipis.")).toEqual([]);
    expect(voiceViolations("05_x.md", "- **Peta Rujukan:** kontak pos kesehatan.")).toEqual([]);
  });

  test("cooked prose passes", () => {
    expect(voiceViolations("05_x.md", CLEAN)).toEqual([]);
  });

  test("each zero cap flags a single case-insensitive hit", () => {
    expect(voiceViolations("05_x.md", "KALAU DIPIKIR-PIKIR, ladang itu sepi.")).toEqual(["Kalau dipikir-pikir x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "menurut Panduan, benih tumbuh.")).toEqual(["Menurut panduan x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Begitu tulis panduan itu.")).toEqual(["tulis panduan x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Bab berikutnya membahas sapi.")).toEqual(["bab berikutnya x1 (max 0)"]);
  });

  test("every stock connector variant counts, and a neighbouring phrase does not", () => {
    const md = "Perhatikan ini. Di situlah letak soalnya. Menariknya begitu. Ada satu detail. Ada satu catatan.";
    expect(voiceViolations("05_x.md", md)).toEqual(["stock connector x5 (max 0)"]);
    expect(voiceViolations("05_x.md", "Ada satu hal yang kamu ingat. Di situ ladangnya.")).toEqual([]);
  });

  test("stock connectors match whole words only, so ordinary verbs pass", () => {
    const md = "Ia memperhatikan cuaca, hal itu diperhatikan warga, dan ia memperhatikannya lagi pada satu detail kecil.";
    expect(voiceViolations("05_x.md", md)).toEqual([]);
    expect(voiceViolations("05_x.md", "Perhatikan, ini penting.")).toEqual(["stock connector x1 (max 0)"]);
  });

  test("inflected stock connectors count, so the -lah and -nya forms do not slip through", () => {
    expect(voiceViolations("05_x.md", "Perhatikanlah cuaca itu.")).toEqual(["stock connector x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Di situlah letaknya masalah.")).toEqual(["stock connector x1 (max 0)"]);
  });

  test("bab berikutnya needs a word boundary, so sebab berikutnya passes", () => {
    expect(voiceViolations("05_x.md", "Sebab berikutnya ialah hujan.")).toEqual([]);
    expect(voiceViolations("05_x.md", "Bab berikutnya membahas hujan.")).toEqual(["bab berikutnya x1 (max 0)"]);
  });

  test("mirip dengan allows one and flags two", () => {
    expect(voiceViolations("05_x.md", "Ini mirip dengan ladang.")).toEqual([]);
    expect(voiceViolations("05_x.md", "Ini mirip dengan ladang, itu mirip dengan kandang.")).toEqual(["mirip dengan x2 (max 1)"]);
  });

  test("tokoh kita allows two and flags three", () => {
    expect(voiceViolations("05_x.md", "tokoh kita lelah, tokoh kita tidur")).toEqual([]);
    expect(voiceViolations("05_x.md", "tokoh kita lelah, tokoh kita tidur, tokoh kita bangun")).toEqual(["tokoh kita x3 (max 2)"]);
  });
});

describe("crutch words and near-miss scaffolds", () => {
  test("tetap, pun, bahkan and justru are capped at 4 per chapter together", () => {
    expect(voiceViolations("05_x.md", "Ia tetap datang. Kamu pun ikut. Bahkan hujan. Justru itu. Ia tetap pergi.")).toEqual([
      "crutch words x5 (max 4)",
    ]);
    expect(voiceViolations("05_x.md", "Ia tetap datang. Kamu pun ikut. Bahkan hujan. Justru itu.")).toEqual([]);
  });

  test("indefinite compounds with pun and technical fixed terms with tetap are not crutch words", () => {
    const md = "Apa pun, siapa pun, di mana pun, berapa pun, kapan pun. Biaya tetap, aset tetap, pola pikir tetap. Ia tetap datang.";
    expect(voiceViolations("05_x.md", md)).toEqual([]);
  });

  test("\"pola pikir tetap\" (fixed mindset) is a term, not a crutch word", () => {
    const four = "Ia tetap datang. Kamu pun ikut. Bahkan hujan. Justru itu.";
    expect(voiceViolations("05_x.md", four + " Pola pikir tetap berbeda.")).toEqual([]);
    expect(voiceViolations("05_x.md", four + " Ia tetap pergi.")).toEqual(["crutch words x5 (max 4)"]);
  });

  test("words inside a link target are not counted", () => {
    const four = "Ia tetap datang. Kamu pun ikut. Bahkan hujan. Justru itu.";
    expect(voiceViolations("05_x.md", four + " Lihat [aturan](https://x.example/Berpenghasilan-Tetap.html).")).toEqual([]);
    expect(voiceViolations("05_x.md", four + " Ia tetap pergi.")).toEqual(["crutch words x5 (max 4)"]);
  });

  test("crutch words inside a fenced code block are not counted", () => {
    const md = "Teks.\n\n```text\ntetap pun bahkan justru tetap\n```\n";
    expect(voiceViolations("05_x.md", md)).toEqual([]);
  });

  test("Kalau or Jika diperhatikan is a stock connector", () => {
    expect(voiceViolations("05_x.md", "Kalau diperhatikan, polanya sama.")).toEqual(["diperhatikan opener x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Jika diperhatikan, polanya sama.")).toEqual(["diperhatikan opener x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Hal ini perlu diperhatikan.")).toEqual([]);
  });

  test("a heading that starts with Menuju is a bridge heading", () => {
    expect(voiceViolations("05_x.md", "### Menuju Ruang Cerita\n\nTeks.")).toEqual(["bridge heading x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Kita bergerak menuju ruang cerita.")).toEqual([]);
  });

  test("chapter announcements are capped at 2", () => {
    const two = "Pada bab ini kita mulai. Dalam bab ini ada contoh.";
    expect(voiceViolations("05_x.md", two)).toEqual([]);
    expect(voiceViolations("05_x.md", two + " Bab ini akan selesai.")).toEqual(["chapter announcement x3 (max 2)"]);
  });
});

describe("voice-ok exemption marker", () => {
  test("a line ending with a voice-ok marker and a reason is not counted", () => {
    const md = '> "Lihat Ibu, perhatikan ke Ibu." <!-- voice-ok: verbatim classroom transcript -->\n\nKalimat biasa.';
    expect(voiceViolations("08_x.md", md)).toEqual([]);
  });

  test("a marker without a reason does not exempt the line", () => {
    expect(voiceViolations("08_x.md", "Perhatikan ini. <!-- voice-ok: -->")).toEqual(["stock connector x1 (max 0)"]);
  });

  test("the marker exempts only its own line", () => {
    const md = "Perhatikan ini.\n\nKutipan. <!-- voice-ok: transkrip -->";
    expect(voiceViolations("08_x.md", md)).toEqual(["stock connector x1 (max 0)"]);
  });
});

describe("voiceViolations source word", () => {
  test("without a configured source word the word is not capped", () => {
    expect(voiceViolations("05_x.md", "panduan panduan panduan panduan panduan")).toEqual([]);
  });

  test("a configured source word is capped per chapter, as a whole word", () => {
    const opts = { sourceWord: PANDUAN };
    expect(voiceViolations("05_x.md", "panduan dan Panduan", opts)).toEqual([]);
    expect(voiceViolations("05_x.md", "panduan, Panduan, panduan.", opts)).toEqual(["panduan x3 (max 2)"]);
    expect(voiceViolations("05_x.md", "panduannya, berpanduan, panduan", opts)).toEqual([]);
  });

  test("chapter 01 gets its own allowance when one is configured", () => {
    const opts = { sourceWord: PANDUAN };
    expect(voiceViolations("01_x.md", "panduan panduan panduan panduan", opts)).toEqual([]);
    expect(voiceViolations("01_x.md", "panduan panduan panduan panduan panduan", opts)).toEqual(["panduan x5 (max 4)"]);
    const noFirst = { sourceWord: { word: "panduan", max: 2 } };
    expect(voiceViolations("01_x.md", "panduan panduan panduan", noFirst)).toEqual(["panduan x3 (max 2)"]);
  });

  test("the Harvest Moon book is configured with panduan, max 2, chapter 01 max 4", () => {
    expect(BOOK_VOICE_CONFIG["pelajaran-hidup-dari-harvest-moon-back-to-nature"]).toEqual({ sourceWord: PANDUAN });
  });
});

describe("checkVoice", () => {
  test("counts content chapters, skips Referensi and Daftar Pustaka, and prefixes problems with the file", () => {
    const book = makeDir({
      "src/content/01_awal.md": CLEAN,
      "src/content/02_tengah.md": "Kalau dipikir-pikir, begitu.",
      "src/content/03_referensi.md": "Kalau dipikir-pikir, perhatikan, menariknya.",
      "src/content/04_daftar-pustaka.md": "Bab berikutnya.",
    });
    expect(checkVoice(book)).toEqual({ chapters: 2, problems: ["02_tengah.md: Kalau dipikir-pikir x1 (max 0)"] });
  });

  test("skips only files whose name starts with referensi or daftar-pustaka", () => {
    const book = makeDir({
      "src/content/12_referensi-dan-daftar-pustaka-akademik.md": "Menariknya.",
      "src/content/15_kesimpulan-saran-dan-referensi-ilmiah.md": "Kalau dipikir-pikir, begitu.",
    });
    expect(checkVoice(book)).toEqual({
      chapters: 1,
      problems: ["15_kesimpulan-saran-dan-referensi-ilmiah.md: Kalau dipikir-pikir x1 (max 0)"],
    });
  });

  test("passes the book options through to every chapter", () => {
    const book = makeDir({ "src/content/02_tengah.md": "panduan panduan panduan" });
    expect(checkVoice(book).problems).toEqual([]);
    expect(checkVoice(book, { sourceWord: PANDUAN }).problems).toEqual(["02_tengah.md: panduan x3 (max 2)"]);
  });
});

describe("check-voice CLI", () => {
  function library(): string {
    return makeDir({
      "bersih/book.toml": "",
      "bersih/src/content/01_a.md": CLEAN,
      "bersih/src/content/02_referensi.md": "Menariknya.",
      "kotor/book.toml": "",
      "kotor/src/content/01_a.md": CLEAN,
      "kotor/src/content/02_b.md": "Perhatikan ladang itu.",
    });
  }

  test("exits 1 with a per-chapter report on a book with a violation", () => {
    const { exitCode, stdout } = runCli(["--books-dir", library(), "kotor"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("02_b.md: stock connector x1 (max 0)");
    expect(stdout).toContain("kotor: 2 chapters, 1 problems");
  });

  test("exits 0 on a clean book", () => {
    const { exitCode, stdout } = runCli(["--books-dir", library(), "bersih"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("bersih: 1 chapters, 0 problems");
  });

  test("--all checks every book in the library", () => {
    const { exitCode, stdout } = runCli(["--books-dir", library(), "--all"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("bersih: 1 chapters, 0 problems");
    expect(stdout).toContain("kotor: 2 chapters, 1 problems");
  });

  test("a book with no checkable chapters fails instead of passing vacuously", () => {
    const lib = makeDir({ "kosong/book.toml": "", "kosong/src/content/01_referensi.md": "Menariknya." });
    const { exitCode, stdout } = runCli(["--books-dir", lib, "kosong"]);
    expect(exitCode).toBe(1);
    expect(stdout).toContain("kosong: no checkable chapters");
  });

  test("every configured book exists in the real library and passes", () => {
    const slugs = Object.keys(BOOK_VOICE_CONFIG);
    expect(slugs.length).toBeGreaterThan(0);
    const { exitCode, stdout } = runCli(slugs);
    expect(stdout).not.toContain("no checkable chapters");
    expect(exitCode).toBe(0);
  });

  test("exits 2 on an unknown slug or no arguments", () => {
    expect(runCli(["--books-dir", library(), "tidak-ada"]).exitCode).toBe(2);
    expect(runCli([]).exitCode).toBe(2);
  });
});

describe("runVoiceGate (build step)", () => {
  test("passes a library where every book is clean and skips _template", () => {
    const lib = makeDir({
      "bersih/src/content/01_a.md": CLEAN,
      "_template/src/content/01_a.md": "Menariknya, ini templat.",
    });
    expect(runVoiceGate(lib)).toEqual({ ok: true, problems: [] });
  });

  test("fails with book-prefixed problems when one book has a scaffold", () => {
    const lib = makeDir({
      "bersih/src/content/01_a.md": CLEAN,
      "kotor/src/content/01_a.md": CLEAN,
      "kotor/src/content/02_b.md": "Bab berikutnya membahas hujan.",
    });
    expect(runVoiceGate(lib)).toEqual({ ok: false, problems: ["kotor/02_b.md: bab berikutnya x1 (max 0)"] });
  });

  test("fails on a book with no checkable chapters", () => {
    const lib = makeDir({ "kosong/src/content/01_referensi.md": "Menariknya." });
    expect(runVoiceGate(lib)).toEqual({ ok: false, problems: ["kosong: no checkable chapters"] });
  });
});

describe("contrast framing (GEMINI.md section 29 item 9), every checked book", () => {
  const SANDWICH = "Itu temuan awal yang bukan jaminan tetapi petunjuk.";
  const TRAILING = "Itu temuan awal, bukan jaminan.";
  const CONTRAST = {};

  test("bukan ... tetapi/tapi/melainkan/namun in one sentence is flagged, case-insensitive", () => {
    expect(voiceViolations("05_x.md", SANDWICH, CONTRAST)).toEqual(["contrast framing (bukan ..., tetapi) x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "BUKAN hafalan TAPI latihan.", CONTRAST)).toEqual(["contrast framing (bukan ..., tetapi) x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Ini bukan soal waktu melainkan niat.", CONTRAST)).toEqual(["contrast framing (bukan ..., tetapi) x1 (max 0)"]);
    expect(voiceViolations("05_x.md", "Ini bukan soal waktu namun niat.", CONTRAST)).toEqual(["contrast framing (bukan ..., tetapi) x1 (max 0)"]);
  });

  test("bukan and tetapi in two different sentences are not one contrast", () => {
    expect(voiceViolations("05_x.md", "Ini bukan soal waktu. Tetapi kamu tetap belajar.", CONTRAST)).toEqual([]);
  });

  test("the trailing , bukan form is flagged", () => {
    expect(voiceViolations("05_x.md", TRAILING, CONTRAST)).toEqual(["trailing ', bukan' x1 (max 0)"]);
  });

  test("a plain negation passes", () => {
    expect(voiceViolations("05_x.md", "Cara ini belum diuji pada mahasiswa dan bukan untuk anak kecil.", CONTRAST)).toEqual([]);
  });

  test("free books are checked too, without any option", () => {
    expect(voiceViolations("05_x.md", `${SANDWICH}\n\n${TRAILING}`)).toEqual([
      "contrast framing (bukan ..., tetapi) x1 (max 0)",
      "trailing ', bukan' x1 (max 0)",
    ]);
  });

  test("a tag question ending in , bukan? passes", () => {
    expect(voiceViolations("05_x.md", "Rasanya akrab, bukan? Ucapan itu terasa hangat.")).toEqual([]);
    expect(voiceViolations("05_x.md", "Kamu mencintai tanah air, bukan ?")).toEqual([]);
  });

  test("a fenced code block (a mermaid diagram) is not counted", () => {
    const fence = '```mermaid\nflowchart TD\n    B --> C["Gali kepentingan, bukan sekadar posisi"]\n    accDescr: Ringkasan, bukan temuan, tetapi penalaran.\n```';
    expect(voiceViolations("05_x.md", `Teks biasa.\n\n${fence}\n`)).toEqual([]);
  });

  test("a chapter heading with , Bukan is flagged like prose", () => {
    expect(voiceViolations("05_x.md", "## Membeli Pengalaman, Bukan Barang\n\nTeks.")).toEqual(["trailing ', bukan' x1 (max 0)"]);
  });

  test("a blockquote line is a quoted template and is not counted", () => {
    expect(voiceViolations("05_x.md", `> ${SANDWICH}\n>   ${TRAILING}\n\nTeks biasa.`, CONTRAST)).toEqual([]);
    expect(voiceViolations("05_x.md", `  > ${TRAILING}`, CONTRAST)).toEqual([]);
  });

  test("a voice-ok marker exempts its line", () => {
    expect(voiceViolations("05_x.md", `${SANDWICH} <!-- voice-ok: kutipan sumber -->`, CONTRAST)).toEqual([]);
    expect(voiceViolations("05_x.md", `${TRAILING} <!-- voice-ok: kutipan sumber -->`, CONTRAST)).toEqual([]);
  });

  test("runVoiceGate flags free and edition-2026 books and skips verbatim premium books", () => {
    setPremiumRegistryForTest({
      revisi: { products: ["P-x"], productUrl: "https://example.com/p", edition: 2026 },
      verbatim: { products: ["P-y"], productUrl: "https://example.com/q" },
    });
    const body = `${SANDWICH}\n\n${TRAILING}`;
    const lib = makeDir({
      "gratis/src/content/01_a.md": body,
      "revisi/src/content/01_a.md": body,
      "verbatim/src/content/01_a.md": body,
    });
    expect(runVoiceGate(lib)).toEqual({
      ok: false,
      problems: [
        "gratis/01_a.md: contrast framing (bukan ..., tetapi) x1 (max 0)",
        "gratis/01_a.md: trailing ', bukan' x1 (max 0)",
        "revisi/01_a.md: contrast framing (bukan ..., tetapi) x1 (max 0)",
        "revisi/01_a.md: trailing ', bukan' x1 (max 0)",
      ],
    });
  });

  test("the CLI flags a registered edition-2026 book and a free one", () => {
    const revised = Object.entries(loadPremiumRegistry()).find(([, e]) => e.edition === 2026)?.[0];
    expect(revised).toBeDefined();
    const lib = makeDir({
      [`${revised}/src/content/01_a.md`]: TRAILING,
      "gratis/src/content/01_a.md": TRAILING,
    });
    const flagged = runCli(["--books-dir", lib, revised as string]);
    expect(flagged.exitCode).toBe(1);
    expect(flagged.stdout).toContain("01_a.md: trailing ', bukan' x1 (max 0)");
    const free = runCli(["--books-dir", lib, "gratis"]);
    expect(free.exitCode).toBe(1);
    expect(free.stdout).toContain("gratis: 1 chapters, 1 problems");
  });
});
