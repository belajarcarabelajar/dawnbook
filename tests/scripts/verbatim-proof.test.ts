import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SCRIPT = path.resolve(import.meta.dir, "../../scripts/premium/verbatim-proof.ts");
const SCRATCH = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch");
const dirs: string[] = [];

afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

interface Fixture {
  pages: string[];
  summary: string;
  chapters: Record<string, string>;
}

function makeFixture(f: Fixture): { textFile: string; bookDir: string; root: string } {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const root = fs.mkdtempSync(path.join(SCRATCH, "verbatim-proof-"));
  dirs.push(root);
  const textFile = path.join(root, "source.txt");
  fs.writeFileSync(textFile, f.pages.join("\f"));
  const bookDir = path.join(root, "book");
  fs.mkdirSync(path.join(bookDir, "src"), { recursive: true });
  fs.writeFileSync(path.join(bookDir, "src/SUMMARY.md"), f.summary);
  for (const [rel, body] of Object.entries(f.chapters)) {
    const full = path.join(bookDir, "src", rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return { textFile, bookDir, root };
}

function runCli(args: string[]): { exitCode: number; stdout: string; stderr: string } {
  const r = Bun.spawnSync(["bun", "run", SCRIPT, ...args], { stdout: "pipe", stderr: "pipe" });
  return { exitCode: r.exitCode, stdout: r.stdout.toString(), stderr: r.stderr.toString() };
}

const TWO_CHAPTERS = "# Summary\n\n- [Bab Satu](content/01_satu.md)\n- [Bab Dua](content/02_dua.md)\n";
const PAGE1 = "Bab Satu\n\nSatu dua tiga empat lima.\n";
const PAGE2 = "Bab Dua\n\nEnam tujuh delapan sembilan sepuluh.\n";

describe("verbatim-proof CLI", () => {
  test("identical text across 2 pages split into 2 chapters exits 0", () => {
    const fx = makeFixture({
      pages: [PAGE1, PAGE2],
      summary: TWO_CHAPTERS,
      chapters: {
        "content/01_satu.md": "## Bab Satu\n\nSatu dua tiga empat lima.\n",
        "content/02_dua.md": "## Bab Dua\n\nEnam tujuh delapan sembilan sepuluh.\n",
      },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.stdout).toContain("tokens pdf=14 book=14 hunks=0 boilerplate_lines=0");
    expect(r.exitCode).toBe(0);
  });

  test("a word dropped from the book exits 1 and names the word and its page", () => {
    const fx = makeFixture({
      pages: [PAGE1, PAGE2],
      summary: TWO_CHAPTERS,
      chapters: {
        "content/01_satu.md": "## Bab Satu\n\nSatu dua tiga empat lima.\n",
        "content/02_dua.md": "## Bab Dua\n\nEnam tujuh sembilan sepuluh.\n",
      },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("hunks=1");
    expect(r.stdout).toMatch(/missing in book \(pdf page 2\): delapan/);
  });

  test("an extra word in the book exits 1 and names the word", () => {
    const fx = makeFixture({
      pages: [PAGE1, PAGE2],
      summary: TWO_CHAPTERS,
      chapters: {
        "content/01_satu.md": "## Bab Satu\n\nSatu dua tiga tambahan empat lima.\n",
        "content/02_dua.md": "## Bab Dua\n\nEnam tujuh delapan sembilan sepuluh.\n",
      },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/extra in book \(pdf page 1\): tambahan/);
  });

  test("a running footer on 3 pages and page numbers are removed and listed", () => {
    const pages = [
      "Alfa beta gama.\n\nRahasia Belajar Efektif\n1\n",
      "Delta epsilon zeta.\n\nRahasia Belajar Efektif\nii\n",
      "Eta teta iota.\n\nRahasia Belajar Efektif\nHalaman 3\n",
    ];
    const fx = makeFixture({
      pages,
      summary: "# Summary\n\n[Isi](isi.md)\n",
      chapters: { "isi.md": "Alfa beta gama.\n\nDelta epsilon zeta.\n\nEta teta iota.\n" },
    });
    const report = path.join(fx.root, "report.md");
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir, "--report", report]);
    expect(r.stdout).toContain("tokens pdf=9 book=9 hunks=0 boilerplate_lines=6");
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("Rahasia Belajar Efektif (3 pages)");
    const md = fs.readFileSync(report, "utf8");
    expect(md).toContain("Rahasia Belajar Efektif");
    expect(md).toContain("Halaman 3");
  });

  test("a header seen on only 2 pages is kept and causes a hunk", () => {
    const pages = ["Kepala Dua Halaman\nAlfa beta.\n", "Kepala Dua Halaman\nGama delta.\n", "Epsilon zeta.\n"];
    const fx = makeFixture({
      pages,
      summary: "# Summary\n\n[Isi](isi.md)\n",
      chapters: { "isi.md": "Alfa beta.\n\nGama delta.\n\nEpsilon zeta.\n" },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toContain("boilerplate_lines=0");
    expect(r.stdout).toMatch(/missing in book \(pdf page 1\): Kepala Dua Halaman/);
  });

  test("Markdown syntax creates no hunks", () => {
    const pages = [
      "Judul Bab\n\nTeks tebal dan miring di sini.\n\nPoin pertama\nPoin kedua\n1. Langkah awal\n\nBaca panduan lengkap sekarang.\n",
      "Nama    Nilai\nAni     90\n\nKutipan bijak.\nKode contoh selesai.\n",
    ];
    const chapter = [
      "# Judul Bab",
      "",
      "<!-- catatan penulis yang tidak dihitung -->",
      "Teks **tebal** dan _miring_ di sini.",
      "",
      "- Poin pertama",
      "* Poin kedua",
      "1. Langkah awal",
      "",
      "Baca [panduan lengkap](https://contoh.id/panduan) sekarang.",
      "",
      "![gambar ilustrasi rak buku](img/rak.png)",
      "",
      "---",
      "",
      "| Nama | Nilai |",
      "|------|:-----:|",
      "| Ani | 90 |",
      "",
      "> Kutipan bijak.",
      "",
      "<div>",
      "`Kode` contoh selesai.",
      "</div>",
      "",
    ].join("\n");
    const fx = makeFixture({ pages, summary: "# Summary\n\n- [Judul Bab](bab.md)\n", chapters: { "bab.md": chapter } });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("chapters are read in SUMMARY order, not alphabetical order", () => {
    const fx = makeFixture({
      pages: ["Pertama datang dulu.\n", "Kedua menyusul kemudian.\n"],
      summary: "# Summary\n\n- [Z](z-pertama.md)\n- [A](a-kedua.md)\n",
      chapters: { "z-pertama.md": "Pertama datang dulu.\n", "a-kedua.md": "Kedua menyusul kemudian.\n" },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("usage errors exit 2", () => {
    expect(runCli([]).exitCode).toBe(2);
    expect(runCli(["--text", "/nonexistent/x.txt"]).exitCode).toBe(2);
    const fx = makeFixture({ pages: [PAGE1], summary: TWO_CHAPTERS, chapters: {} });
    expect(runCli(["--text", fx.textFile, "--book", fx.bookDir]).exitCode).toBe(2);
    expect(runCli(["--text", fx.textFile, "--pdf", fx.textFile, "--book", fx.bookDir]).exitCode).toBe(2);
  });

  test("numbered list markers stay as tokens and match the numbers printed in the PDF", () => {
    const fx = makeFixture({
      pages: ["Daftar langkah.\n1. Satu 2. Dua\n"],
      summary: "# Summary\n\n- [Isi](isi.md)\n",
      chapters: { "isi.md": "Daftar langkah.\n\n1. Satu\n2. Dua\n" },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.stdout).toContain("tokens pdf=6 book=6 hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("a numbered item whose number differs from the PDF exits 1", () => {
    const fx = makeFixture({
      pages: ["Daftar langkah.\n1. Satu 2. Dua\n"],
      summary: "# Summary\n\n- [Isi](isi.md)\n",
      chapters: { "isi.md": "Daftar langkah.\n\n1. Satu\n3. Dua\n" },
    });
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir]);
    expect(r.exitCode).toBe(1);
    expect(r.stdout).toMatch(/changed \(pdf page 1\): pdf \[2\.\] book \[3\.\]/);
  });

  test("PDF bullet glyphs match Markdown list markers and are counted with their pages", () => {
    const pages = [
      "Bekal ke sekolah.\n  \u2022 Satu\n  \u25cf Dua\n",
      "\u2013 Tiga\n- Empat\n\u25c6 Lima\n",
    ];
    const fx = makeFixture({
      pages,
      summary: "# Summary\n\n- [Isi](isi.md)\n",
      chapters: { "isi.md": "Bekal ke sekolah.\n\n- Satu\n* Dua\n+ Tiga\n- Empat\n- Lima\n" },
    });
    const report = path.join(fx.root, "report.md");
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir, "--report", report]);
    expect(r.stdout).toContain("tokens pdf=8 book=8 hunks=0");
    expect(r.stdout).toContain("boilerplate: 5 bullet glyphs");
    expect(r.exitCode).toBe(0);
    const md = fs.readFileSync(report, "utf8");
    expect(md).toMatch(/\u2022.*page 1/);
    expect(md).toMatch(/\u2013.*page 2/);
  });

  function single(pages: string[], chapter: string) {
    const fx = makeFixture({ pages, summary: "# Summary\n\n- [Isi](isi.md)\n", chapters: { "isi.md": chapter } });
    return runCli(["--text", fx.textFile, "--book", fx.bookDir]);
  }

  test("Markdown backslash escapes become the literal character and are never stripped", () => {
    const r = single(["Isi titik ___, lalu *Optional ya.\n"], "Isi titik \\_\\_\\_, lalu \\*Optional ya.\n");
    expect(r.stdout).toContain("tokens pdf=6 book=6 hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("a PDF word hyphenated at a line end is joined with the next line and counted", () => {
    const r = single(["Ajak temen-\ntemen dan cek deadline-\n\nnya hari ini.\n"], "Ajak temen-temen dan cek deadline-nya hari ini.\n");
    expect(r.stdout).toContain("boilerplate: 2 line-end hyphen joins");
    expect(r.stdout).toContain("tokens pdf=7 book=7 hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("emoji clusters are split from adjacent letters on both sides", () => {
    const r = single(["\u2611\ufe0fPengenalan dan \u{1F680} Roket\n"], "\u2611\ufe0f Pengenalan dan \u{1F680}Roket\n");
    expect(r.stdout).toContain("tokens pdf=5 book=5 hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("an edge line on 3 of 10 pages (under 40 percent) is not a running header", () => {
    const pages = Array.from({ length: 10 }, (_, i) => (i < 3 ? "Buku Seri Tiga\n" : "") + `Isi halaman nomor ${"abcdefghij"[i]}.\n`);
    const chapter = pages.join("\n");
    const r = single(pages, chapter);
    expect(r.stdout).toContain("boilerplate_lines=0");
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("a check mark with emoji presentation and plain check marks are content, not bullets", () => {
    const r = single(["\u2714\ufe0f Siap\n\u2714 Juga\n\u2713 Boleh\n\u2022 Satu\n"], "\u2714\ufe0f Siap\n\n\u2714 Juga\n\n\u2713 Boleh\n\n- Satu\n");
    expect(r.stdout).toContain("boilerplate: 1 bullet glyph ");
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("a dash right after an opening bold or italic marker at line start is a list marker", () => {
    const r = single(
      ["Alasan utama.\n- Syarat Lulus\n\u2013 Simulasi Kerja\n"],
      "Alasan utama.\n\n**- Syarat Lulus**\n\n*\u2013 Simulasi Kerja*\n",
    );
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  function acceptFixture(entries: unknown) {
    const fx = makeFixture({
      pages: ["Alfa beta gama.\n", "Delta epsilon zeta eta.\n"],
      summary: "# Summary\n\n- [Isi](isi.md)\n",
      chapters: { "isi.md": "Alfa beti gama.\n\nDelta zeta eta.\n" },
    });
    const accept = path.join(fx.root, "accept.json");
    fs.writeFileSync(accept, JSON.stringify(entries));
    const report = path.join(fx.root, "report.md");
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir, "--accept", accept, "--report", report]);
    return { ...r, report };
  }

  test("hunks listed in --accept are reported with their reason and do not fail the run", () => {
    const r = acceptFixture([
      { page: 1, kind: "changed", tokens: "pdf [beta] book [beti]", reason: "ejaan sumber berbeda" },
      { page: 2, kind: "missing in book", tokens: "epsilon", reason: "kata hilang yang disetujui" },
    ]);
    expect(r.stdout).toContain("hunks=0");
    expect(r.stdout).toContain("accepted=2");
    expect(r.exitCode).toBe(0);
    const md = fs.readFileSync(r.report, "utf8");
    expect(md).toContain("## Accepted differences");
    expect(md).toContain("ejaan sumber berbeda");
    expect(md).toContain("kata hilang yang disetujui");
  });

  test("a hunk not listed in --accept still fails the run", () => {
    const r = acceptFixture([{ page: 1, kind: "changed", tokens: "pdf [beta] book [beti]", reason: "ejaan" }]);
    expect(r.stdout).toContain("hunks=1");
    expect(r.stdout).toContain("accepted=1");
    expect(r.exitCode).toBe(1);
  });

  test("an accept entry that matches no hunk is a stale entry and fails the run", () => {
    const r = acceptFixture([
      { page: 1, kind: "changed", tokens: "pdf [beta] book [beti]", reason: "ejaan" },
      { page: 2, kind: "missing in book", tokens: "epsilon", reason: "disetujui" },
      { page: 2, kind: "extra in book", tokens: "omega", reason: "tidak ada lagi" },
    ]);
    expect(r.stdout).toContain("stale accept entry");
    expect(r.exitCode).toBe(1);
  });

  test("an accept entry without a reason is a usage error", () => {
    const r = acceptFixture([{ page: 2, kind: "missing in book", tokens: "epsilon" }]);
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain("accept entry 1 has no reason");
  });

  test("a line is a page number only at a page edge and within 3 of the page index", () => {
    const pages = Array.from({ length: 8 }, (_, i) => `Isi halaman nomor ${"abcdefgh"[i]}.\n`);
    pages[2] = "Contoh hitung.\nAngka awal.\n24213331212\nAdalah hasilnya.\nSelesai dihitung.\n";
    pages[3] = "Hasil akhir.\n24213331212\n";
    pages[6] = "Isi halaman nomor g.\n7\n";
    pages[7] = "Isi halaman nomor h.\n9\n";
    const chapter = pages.map((p) => p.replace(/^[79]\n/m, "")).join("\n");
    const r = single(pages, chapter);
    expect(r.stdout).toContain("boilerplate_lines=2");
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("a number at a page edge far from the page index is content", () => {
    const pages = Array.from({ length: 7 }, (_, i) => `Isi halaman nomor ${"abcdefg"[i]}.\n`);
    pages[6] = "Isi halaman nomor g.\n40\n";
    const r = single(pages, pages.join("\n"));
    expect(r.stdout).toContain("boilerplate_lines=0");
    expect(r.stdout).toContain("hunks=0");
    expect(r.exitCode).toBe(0);
  });

  test("word bag: a pure reorder leaves the bags equal while the sequence still differs", () => {
    const r = single(["Alfa beta gama delta.\n"], "beta Alfa gama delta.\n");
    expect(r.stdout).toContain("bag: missing_in_book=0 extra_in_book=0");
    expect(r.exitCode).toBe(1);
  });

  test("word bag: a dropped word is counted and listed on stdout and in the report", () => {
    const fx = makeFixture({
      pages: ["Alfa beta gama delta gama.\n"],
      summary: "# Summary\n\n- [Isi](isi.md)\n",
      chapters: { "isi.md": "Alfa beta delta gama.\n" },
    });
    const report = path.join(fx.root, "report.md");
    const r = runCli(["--text", fx.textFile, "--book", fx.bookDir, "--report", report]);
    expect(r.stdout).toContain("bag: missing_in_book=1 extra_in_book=0");
    expect(r.stdout).toMatch(/bag missing_in_book: gama \(1\)/);
    expect(r.exitCode).toBe(1);
    const md = fs.readFileSync(report, "utf8");
    expect(md).toContain("## Word bag difference");
    expect(md).toMatch(/gama.*1/);
  });
});
