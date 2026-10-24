import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
    ]);
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
