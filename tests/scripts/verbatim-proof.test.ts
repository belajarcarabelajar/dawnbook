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
      "\u2013 Tiga\n- Empat\n\u2714 Lima\n",
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
});
