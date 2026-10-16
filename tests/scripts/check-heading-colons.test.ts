import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  stripNonText,
  headingViolates,
  scanContent,
  scanSummary,
  scanToml,
  runSelfTest,
} from "../../scripts/check-heading-colons";

const SCRIPT = path.resolve(import.meta.dir, "../../scripts/check-heading-colons.ts");
const SLOP = "## Harga yang Dibayar: Stres, Kesehatan, dan Tidur";

interface BookFixture {
  title?: string;
  summary?: string;
  chapters?: Record<string, string>;
}

function writeBook(root: string, slug: string, fx: BookFixture = {}) {
  const bookDir = path.join(root, "books", slug);
  const content = path.join(bookDir, "src", "content");
  fs.mkdirSync(content, { recursive: true });
  fs.writeFileSync(
    path.join(bookDir, "book.toml"),
    `[book]\ntitle = "${fx.title ?? "Buku Bersih"}"\nlanguage = "id"\n`,
  );
  fs.writeFileSync(
    path.join(bookDir, "src", "SUMMARY.md"),
    fx.summary ?? "# Summary\n\n- [Bab Satu](content/01_a.md)\n",
  );
  const chapters = fx.chapters ?? { "01_a.md": "# Bab Satu\n\nIsi.\n" };
  for (const [name, body] of Object.entries(chapters)) {
    fs.writeFileSync(path.join(content, name), body);
  }
}

function run(args: string[], cwd?: string) {
  const r = Bun.spawnSync([process.execPath, "run", SCRIPT, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    code: r.exitCode,
    out: r.stdout.toString(),
    err: r.stderr.toString(),
  };
}

function git(root: string, ...args: string[]) {
  const r = Bun.spawnSync(["git", ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" },
  });
  if (r.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.toString()}`);
  return r.stdout.toString();
}

function commitBase(root: string) {
  git(root, "init", "-q");
  git(root, "config", "user.name", "Test");
  git(root, "config", "user.email", "test@example.invalid");
  git(root, "config", "commit.gpgsign", "false");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "base");
}

describe("check-heading-colons", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "heading-colons-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  describe("pure functions", () => {
    it("removes code spans and inline math", () => {
      expect(stripNonText("Fungsi `a: b` dan $f: A$ selesai")).toBe("Fungsi  dan  selesai");
    });

    it("flags a colon heading and a trailing colon", () => {
      expect(headingViolates("Harga yang Dibayar: Stres")).toBe(true);
      expect(headingViolates("Komponen SMART:")).toBe(true);
    });

    it("passes clean text and colons only inside code or math", () => {
      expect(headingViolates("Harga yang Dibayar")).toBe(false);
      expect(headingViolates("Memakai `dict: str` di Python")).toBe(false);
      expect(headingViolates("Fungsi $f: A \\to B$")).toBe(false);
    });

    it("treats an escaped numbered heading as normal text", () => {
      expect(headingViolates("5\\. Judul: X")).toBe(true);
      expect(headingViolates("5\\. Judul X")).toBe(false);
    });

    it("scanContent reports line numbers and ignores fenced code", () => {
      const md = ["# Bersih", "", "```", "## Di dalam: kode", "```", "", "### Dua: Bagian", ""].join("\n");
      const r = scanContent(md);
      expect(r.violations).toEqual([{ line: 7, text: "Dua: Bagian" }]);
      expect(r.exempted).toEqual([]);
    });

    it("scanContent ignores a tilde fence and resumes after it closes", () => {
      const md = ["~~~", "# a: b", "~~~", "# c: d"].join("\n");
      expect(scanContent(md).violations).toEqual([{ line: 4, text: "c: d" }]);
    });

    it("scanContent sees headings inside blockquotes and list items", () => {
      const md = [
        "> ### Panduan: Respons",
        "> > ## Dalam: Kutipan Bersarang",
        "- ## Daftar: Satu",
        "1. ### Nomor: Dua",
        "> ### Bersih",
        "",
      ].join("\n");
      expect(scanContent(md).violations).toEqual([
        { line: 1, text: "Panduan: Respons" },
        { line: 2, text: "Dalam: Kutipan Bersarang" },
        { line: 3, text: "Daftar: Satu" },
        { line: 4, text: "Nomor: Dua" },
      ]);
    });

    it("scanContent ignores a fence opened inside a blockquote", () => {
      const md = ["> ```bash", "> # catatan: skrip", "> ```", "> ### Nyata: Judul"].join("\n");
      expect(scanContent(md).violations).toEqual([{ line: 4, text: "Nyata: Judul" }]);
    });

    it("scanContent does not treat hashtags or list text as headings", () => {
      const md = ["- #hashtag: ramai", "- item: biasa", "> kutipan: biasa", "#tanpa-spasi: x"].join("\n");
      expect(scanContent(md).violations).toEqual([]);
    });

    it("scanContent flags a whole-line bold title that carries a colon", () => {
      const md = [
        "**Skenario: Siang hari yang membosankan**",
        "> **Studi Kasus: Tim Pengembang**",
        "**Analogi: Pilot** <!-- heading-colon-ok: kutipan judul resmi -->",
        "",
      ].join("\n");
      const r = scanContent(md);
      expect(r.violations).toEqual([
        { line: 1, text: "Skenario: Siang hari yang membosankan" },
        { line: 2, text: "Studi Kasus: Tim Pengembang" },
      ]);
      expect(r.exempted).toEqual([{ line: 3, text: "Analogi: Pilot", reason: "kutipan judul resmi" }]);
    });

    it("scanContent flags a bold title that holds italic emphasis, and keeps two bold blocks alone", () => {
      const md = [
        "**Skenario: *Burnout* di Tempat Kerja**",
        "> **Refleksi Kritis: Alokasi Modal Manusia vs *Brain Drain***",
        "**Satu: bold** dan **Dua: bold**",
        "",
      ].join("\n");
      expect(scanContent(md).violations).toEqual([
        { line: 1, text: "Skenario: *Burnout* di Tempat Kerja" },
        { line: 2, text: "Refleksi Kritis: Alokasi Modal Manusia vs *Brain Drain*" },
      ]);
    });

    it("scanContent flags a bold sub-title alone on a blockquote line, but not blockquote lead-ins or labels", () => {
      const md = [
        "> **Analogi: Klub**",
        "",
        "> **Analogi: Klub**",
        "> Teks kutipan di baris berikutnya.",
        "",
        "> **Penting:** teks sesudahnya",
        "",
        "> **Contoh Soal:**",
        "",
      ].join("\n");
      expect(scanContent(md).violations).toEqual([
        { line: 1, text: "Analogi: Klub" },
        { line: 3, text: "Analogi: Klub" },
      ]);
    });

    it("scanContent leaves inline bold lead-ins, trailing-colon labels, long callouts and fences alone", () => {
      const long = `**Penting: ${"kalimat panjang ".repeat(8)}**`;
      const md = [
        "**Penting:** teks sesudahnya di baris yang sama",
        "**Contoh Soal:**",
        "**Tanpa colon sama sekali**",
        "**Awal: bold** lalu teks lain",
        long,
        "```",
        "**Di dalam: kode**",
        "```",
        "",
      ].join("\n");
      expect(scanContent(md).violations).toEqual([]);
    });

    it("scanContent exempts only with a non-empty reason", () => {
      const md = [
        "## A: B <!-- heading-colon-ok: kutipan judul resmi -->",
        "## C: D <!-- heading-colon-ok:  -->",
        "## E <!-- heading-colon-ok: tidak perlu -->",
      ].join("\n");
      const r = scanContent(md);
      expect(r.exempted).toEqual([{ line: 1, text: "A: B", reason: "kutipan judul resmi" }]);
      expect(r.violations).toEqual([{ line: 2, text: "C: D" }]);
    });

    it("scanSummary reads nested and star bullets only", () => {
      const md = [
        "# Summary: bagian",
        "",
        "- [Bab: Satu](content/a.md)",
        "  * [Sub: Dua](content/b.md)",
        "- [Bersih](content/c.md)",
        "Teks: biasa",
      ].join("\n");
      expect(scanSummary(md).violations).toEqual([
        { line: 3, text: "Bab: Satu" },
        { line: 4, text: "Sub: Dua" },
      ]);
    });

    it("scanToml reads the title line", () => {
      expect(scanToml('[book]\ntitle = "Judul: Sub"\n').violations).toEqual([
        { line: 2, text: "Judul: Sub" },
      ]);
      expect(scanToml('[book]\ntitle = "Judul Sub"\ndescription = "a: b"\n').violations).toEqual([]);
    });

    it("self-test passes with the real detector and names a broken fixture", () => {
      expect(runSelfTest()).toEqual([]);
      const blind = runSelfTest(() => false);
      expect(blind.length).toBeGreaterThan(0);
      expect(blind.join(" ")).toContain("Harga yang Dibayar");
    });
  });

  describe("detector gaps", () => {
    describe("setext headings", () => {
      it("flags a colon in a text line underlined with = or -", () => {
        expect(scanContent("Judul: X\n=======\n").violations).toEqual([{ line: 1, text: "Judul: X" }]);
        expect(scanContent("Isi.\n\nSub: Y\n---\n").violations).toEqual([{ line: 3, text: "Sub: Y" }]);
        expect(scanContent("Judul: X\n=\n").violations).toEqual([{ line: 1, text: "Judul: X" }]);
      });

      it("passes a setext heading without a colon or with the colon in code or math", () => {
        expect(scanContent("Judul Bersih\n=======\n").violations).toEqual([]);
        expect(scanContent("Pakai `a: b`\n---\n").violations).toEqual([]);
        expect(scanContent("Fungsi $f: A$\n---\n").violations).toEqual([]);
      });

      it("joins a multi-line paragraph and reports its first line", () => {
        const md = "Awal paragraf\nJudul: X\n---\n";
        expect(scanContent(md).violations).toEqual([{ line: 1, text: "Awal paragraf Judul: X" }]);
      });

      it("ignores a --- that has a blank line or nothing above it", () => {
        expect(scanContent("Teks: biasa\n\n---\n").violations).toEqual([]);
        expect(scanContent("---\n\nIsi.\n").violations).toEqual([]);
        expect(scanContent("---\n---\n").violations).toEqual([]);
      });

      it("ignores YAML front matter", () => {
        expect(scanContent("---\ntitle: x\nbab: 1\n---\n\n# Bab\n").violations).toEqual([]);
      });

      it("ignores fenced code and the line after an ATX heading", () => {
        expect(scanContent("```\nJudul: X\n---\n```\n").violations).toEqual([]);
        expect(scanContent("~~~\nJudul: X\n===\n~~~\n").violations).toEqual([]);
        expect(scanContent("## Bersih\n---\n").violations).toEqual([]);
      });

      it("does not read table rows, list items, quotes, link definitions, HTML or code as setext", () => {
        const cases = [
          "| a: b | c |\n|---|---|\n| 1 | 2 |\n",
          "| a: b |\n---\n",
          "- item: a\n---\n",
          "1. item: a\n---\n",
          "> kutipan: a\n---\n",
          "[ref]: http://example.invalid\n---\n",
          "[^1]: catatan: a\n---\n",
          "<div>a: b</div>\n---\n",
          "    kode: x\n---\n",
          "- item\nlanjutan: a\n---\n",
        ];
        for (const md of cases) expect(scanContent(md).violations).toEqual([]);
      });

      it("honours the exemption marker on the text line", () => {
        const r = scanContent("Judul: X <!-- heading-colon-ok: kutipan resmi -->\n===\n");
        expect(r.violations).toEqual([]);
        expect(r.exempted).toEqual([{ line: 1, text: "Judul: X", reason: "kutipan resmi" }]);
      });

      it("keeps ordering by line next to ATX headings", () => {
        const md = ["# A: satu", "", "B: dua", "===", "", "### C: tiga"].join("\n");
        expect(scanContent(md).violations.map((v) => v.line)).toEqual([1, 3, 6]);
      });
    });

    describe("HTML headings", () => {
      it("flags a one-line <hN> heading with a colon", () => {
        expect(scanContent("<h2>Label: Sub</h2>\n").violations).toEqual([{ line: 1, text: "Label: Sub" }]);
        expect(scanContent('<h3 id="x">A: B</h3>\n').violations).toEqual([{ line: 1, text: "A: B" }]);
        expect(scanContent("<H1>A: B</H1>\n").violations).toEqual([{ line: 1, text: "A: B" }]);
        expect(scanContent("> <h4>A: B</h4>\n").violations).toEqual([{ line: 1, text: "A: B" }]);
      });

      it("ignores colons in attributes, tags and <code>, and clean headings", () => {
        expect(scanContent('<h2><a href="http://example.invalid"></a>Bersih</h2>\n').violations).toEqual([]);
        expect(scanContent("<h2>Bersih</h2>\n").violations).toEqual([]);
        expect(scanContent("<h2>Pakai <code>a: b</code></h2>\n").violations).toEqual([]);
      });

      it("does not treat other tags, mismatched tags or fenced lines as headings", () => {
        expect(scanContent("<h7>a: b</h7>\n").violations).toEqual([]);
        expect(scanContent("<h2>a: b</h3>\n").violations).toEqual([]);
        expect(scanContent("<p>a: b</p>\n").violations).toEqual([]);
        expect(scanContent("```html\n<h2>a: b</h2>\n```\n").violations).toEqual([]);
      });

      it("honours the exemption marker after the closing tag", () => {
        const r = scanContent("<h2>A: B</h2> <!-- heading-colon-ok: kutipan resmi -->\n");
        expect(r.violations).toEqual([]);
        expect(r.exempted).toEqual([{ line: 1, text: "A: B", reason: "kutipan resmi" }]);
      });
    });

    describe("fullwidth colon", () => {
      it("counts U+FF1A as a colon", () => {
        expect(headingViolates("Judul：X")).toBe(true);
        expect(headingViolates("Judul：")).toBe(true);
        expect(scanContent("## Judul： X\n").violations).toEqual([{ line: 1, text: "Judul： X" }]);
      });

      it("still ignores it inside code or math", () => {
        expect(headingViolates("Pakai `a：b`")).toBe(false);
        expect(headingViolates("Fungsi $f： A$")).toBe(false);
      });
    });

    describe("inline math boundaries", () => {
      it("keeps money-like dollar signs as plain text", () => {
        expect(stripNonText("Harga $5: murah dan $10")).toBe("Harga $5: murah dan $10");
        expect(headingViolates("Harga $5: murah dan $10")).toBe(true);
        expect(headingViolates("Biaya $5-$10: murah")).toBe(true);
        expect(headingViolates("Harga \\$5: murah")).toBe(true);
        expect(scanContent("## Harga $5: murah dan $10\n").violations).toEqual([
          { line: 1, text: "Harga $5: murah dan $10" },
        ]);
      });

      it("does not open math before a space or close it after a space", () => {
        expect(headingViolates("A $ x: y $ B")).toBe(true);
        expect(headingViolates("A $x: y $ B")).toBe(true);
      });

      it("still strips real inline math, including one-character math", () => {
        expect(headingViolates("Fungsi $f: A \\to B$")).toBe(false);
        expect(stripNonText("Nilai $x$ dan $y: z$ selesai")).toBe("Nilai  dan  selesai");
        expect(headingViolates("Biaya $5$: murah")).toBe(true);
      });
    });

    it("self-test fixtures cover the closed gaps", () => {
      const blind = runSelfTest(() => false).join(" ");
      expect(blind).toContain("Judul: X");
      expect(blind).toContain("<h2>");
      expect(blind).toContain("：");
      expect(blind).toContain("$5");
      expect(runSelfTest()).toEqual([]);
    });

    it("the scan CLI exits 1 and names a setext and an HTML heading", () => {
      writeBook(tmp, "gap", {
        chapters: { "01_a.md": "# Bab\n\nIsi.\n\nJudul: X\n======\n\n<h2>Label: Sub</h2>\n" },
      });
      const r = run(["--root", tmp]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("01_a.md:5");
      expect(r.out).toContain("01_a.md:8");
    });
  });

  describe("scan CLI", () => {
    it("exits 0 for a clean book", () => {
      writeBook(tmp, "bersih");
      const r = run(["--root", tmp]);
      expect(r.code).toBe(0);
      expect(r.out).toContain("TOTAL: 0 violations");
    });

    it("does not count a books/ subdirectory without book.toml as a book", () => {
      writeBook(tmp, "bersih");
      fs.mkdirSync(path.join(tmp, "books", "apps", "hub", "src", "styles"), { recursive: true });
      const r = run(["--root", tmp, "--json"]);
      expect(r.code).toBe(0);
      expect(JSON.parse(r.out).totals.booksScanned).toBe(1);
    });

    it("exits 1 and prints file:line and heading text for a colon heading", () => {
      writeBook(tmp, "slop", { chapters: { "01_a.md": `# Bab Satu\n\n${SLOP}\n` } });
      const r = run(["--root", tmp]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("books/slop/src/content/01_a.md:3");
      expect(r.out).toContain("Harga yang Dibayar: Stres, Kesehatan, dan Tidur");
      expect(r.out).toContain("TOTAL: 1 violations");
    });

    it("flags a trailing colon", () => {
      writeBook(tmp, "b", { chapters: { "01_a.md": "# Bab\n\n## Komponen SMART:\n" } });
      expect(run(["--root", tmp]).code).toBe(1);
    });

    it("passes a colon only inside a code span", () => {
      writeBook(tmp, "b", { chapters: { "01_a.md": "# Bab\n\n## Memakai `dict: str`\n" } });
      expect(run(["--root", tmp]).code).toBe(0);
    });

    it("ignores a colon heading inside a fenced block", () => {
      writeBook(tmp, "b", {
        chapters: { "01_a.md": "# Bab\n\n```md\n## Judul: Sub\n```\n" },
      });
      expect(run(["--root", tmp]).code).toBe(0);
    });

    it("flags a SUMMARY entry", () => {
      writeBook(tmp, "b", { summary: "# Summary\n\n- [Bab: Satu](content/01_a.md)\n" });
      const r = run(["--root", tmp]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("books/b/src/SUMMARY.md:3");
    });

    it("flags a book.toml title", () => {
      writeBook(tmp, "b", { title: "Judul: Sub" });
      const r = run(["--root", tmp]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("books/b/book.toml:2");
    });

    it("lists an exempted heading separately and still fails an empty reason", () => {
      writeBook(tmp, "ok", {
        chapters: { "01_a.md": "# Bab\n\n## A: B <!-- heading-colon-ok: judul resmi -->\n" },
      });
      const ok = run(["--root", tmp]);
      expect(ok.code).toBe(0);
      expect(ok.out).toContain("EXEMPTED");
      expect(ok.out).toContain("judul resmi");

      writeBook(tmp, "empty", {
        chapters: { "01_a.md": "# Bab\n\n## A: B <!-- heading-colon-ok: -->\n" },
      });
      expect(run(["--root", tmp]).code).toBe(1);
    });

    it("ignores books/_template", () => {
      writeBook(tmp, "_template", { title: "Judul: Sub" });
      writeBook(tmp, "bersih");
      expect(run(["--root", tmp]).code).toBe(0);
    });

    it("restricts to --books and rejects an unknown slug with exit 2", () => {
      writeBook(tmp, "slop", { chapters: { "01_a.md": `${SLOP}\n` } });
      writeBook(tmp, "bersih");
      expect(run(["--root", tmp, "--books", "bersih"]).code).toBe(0);
      expect(run(["--root", tmp, "--books", "slop"]).code).toBe(1);
      const bad = run(["--root", tmp, "--books", "tidak-ada"]);
      expect(bad.code).toBe(2);
      expect(bad.err).toContain("tidak-ada");
    });

    it("rejects an unknown flag with exit 2", () => {
      const r = run(["--root", tmp, "--bogus"]);
      expect(r.code).toBe(2);
      expect(r.err).toContain("--bogus");
    });

    it("emits machine-readable output with --json", () => {
      writeBook(tmp, "slop", { chapters: { "01_a.md": `${SLOP}\n` } });
      const r = run(["--root", tmp, "--json"]);
      expect(r.code).toBe(1);
      const data = JSON.parse(r.out);
      expect(data.totals.violations).toBe(1);
      expect(data.violations[0]).toMatchObject({ book: "slop", line: 1, kind: "heading" });
    });

    it("never writes any book file", () => {
      writeBook(tmp, "slop", { chapters: { "01_a.md": `${SLOP}\n` } });
      const file = path.join(tmp, "books/slop/src/content/01_a.md");
      const before = fs.statSync(file).mtimeMs;
      run(["--root", tmp]);
      expect(fs.readFileSync(file, "utf8")).toBe(`${SLOP}\n`);
      expect(fs.statSync(file).mtimeMs).toBe(before);
    });

    it("works from an unrelated cwd without --root only via the script location", () => {
      const r = run(["--self-test"], tmp);
      expect(r.code).toBe(0);
    });
  });

  describe("--self-test", () => {
    it("exits 0 and reports the positive control", () => {
      const r = run(["--self-test"]);
      expect(r.code).toBe(0);
      expect(r.out).toContain("self-test ok");
    });
  });

  describe("--diff-guard", () => {
    it("passes when only a heading line changed", () => {
      writeBook(tmp, "b", { chapters: { "01_a.md": "# Bab\n\nIsi.\n\n## Lama\n\nTeks.\n" } });
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/content/01_a.md"),
        "# Bab\n\nIsi.\n\n## Baru\n\nTeks.\n",
      );
      const r = run(["--root", tmp, "--diff-guard", "HEAD"]);
      expect(r.code).toBe(0);
    });

    it("passes when only a whole-line bold title changed", () => {
      writeBook(tmp, "b", {
        chapters: { "01_a.md": "# Bab\n\n**Skenario: Lama**\n\nTeks.\n" },
      });
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/content/01_a.md"),
        "# Bab\n\n**Skenario Baru**\n\nTeks.\n",
      );
      expect(run(["--root", tmp, "--diff-guard", "HEAD"]).code).toBe(0);
    });

    it("passes for SUMMARY entry and book.toml title changes", () => {
      writeBook(tmp, "b");
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/SUMMARY.md"),
        "# Summary\n\n- [Bab Baru](content/01_a.md)\n",
      );
      fs.writeFileSync(
        path.join(tmp, "books/b/book.toml"),
        '[book]\ntitle = "Judul Baru"\nlanguage = "id"\n',
      );
      expect(run(["--root", tmp, "--diff-guard", "HEAD"]).code).toBe(0);
    });

    it("fails when a body line changed", () => {
      writeBook(tmp, "b", { chapters: { "01_a.md": "# Bab\n\nIsi lama.\n" } });
      commitBase(tmp);
      fs.writeFileSync(path.join(tmp, "books/b/src/content/01_a.md"), "# Bab\n\nIsi baru.\n");
      const r = run(["--root", tmp, "--diff-guard", "HEAD"]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("books/b/src/content/01_a.md");
    });

    it("fails when a hash comment inside a fenced block changed", () => {
      writeBook(tmp, "b", {
        chapters: { "01_a.md": "# Bab\n\n```sh\n# lama\n```\n" },
      });
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/content/01_a.md"),
        "# Bab\n\n```sh\n# baru\n```\n",
      );
      expect(run(["--root", tmp, "--diff-guard", "HEAD"]).code).toBe(1);
    });

    it("fails when a non-title line of book.toml changed", () => {
      writeBook(tmp, "b");
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/book.toml"),
        '[book]\ntitle = "Buku Bersih"\nlanguage = "en"\n',
      );
      expect(run(["--root", tmp, "--diff-guard", "HEAD"]).code).toBe(1);
    });

    it("limits the diff to --books slugs", () => {
      writeBook(tmp, "a", { chapters: { "01_a.md": "# Bab\n\nIsi.\n" } });
      writeBook(tmp, "b", { chapters: { "01_a.md": "# Bab\n\nIsi.\n" } });
      commitBase(tmp);
      fs.writeFileSync(path.join(tmp, "books/b/src/content/01_a.md"), "# Bab\n\nBadan beda.\n");
      expect(run(["--root", tmp, "--diff-guard", "HEAD", "--books", "a"]).code).toBe(0);
      expect(run(["--root", tmp, "--diff-guard", "HEAD", "--books", "b"]).code).toBe(1);
    });

    it("exits 2 for an unknown ref", () => {
      writeBook(tmp, "b");
      commitBase(tmp);
      const r = run(["--root", tmp, "--diff-guard", "no-such-ref"]);
      expect(r.code).toBe(2);
      expect(r.err).toContain("no-such-ref");
    });
  });

  describe("--diff-guard --allow-body", () => {
    const A = "books/b/src/content/01_a.md";
    const B = "books/b/src/content/02_b.md";
    const twoChapters = {
      summary: "# Summary\n\n- [A](content/01_a.md)\n- [B](content/02_b.md)\n",
      chapters: {
        "01_a.md": "# Bab A\n\nIsi lama A.\n",
        "02_b.md": "# Bab B\n\nIsi lama B.\n",
      },
    };
    const edit = (rel: string, body: string) => fs.writeFileSync(path.join(tmp, rel), body);
    const guard = (...extra: string[]) => run(["--root", tmp, "--diff-guard", "HEAD", ...extra]);

    it("passes a body line change in an allowed file and lists it", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit(A, "# Bab A\n\nIsi baru A.\n");
      const r = guard("--allow-body", A);
      expect(r.code).toBe(0);
      expect(r.out).toContain(`diff-guard: ok (body edits allowed in: ${A})`);
    });

    it("still fails the same change in a file that is not allowed", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit(A, "# Bab A\n\nIsi baru A.\n");
      edit(B, "# Bab B\n\nIsi baru B.\n");
      const r = guard("--allow-body", A);
      expect(r.code).toBe(1);
      expect(r.out).toContain(B);
      expect(r.out).not.toContain(`${A}:`);
    });

    it("accepts an allowed file whose diff has only heading changes", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit(A, "# Bab A Baru\n\nIsi lama A.\n");
      const r = guard("--allow-body", A);
      expect(r.code).toBe(0);
      expect(r.out).toContain("body edits allowed in");
    });

    it("allows two files and lists both", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit(A, "# Bab A\n\nIsi baru A.\n");
      edit(B, "# Bab B\n\nIsi baru B.\n");
      const r = guard("--allow-body", A, "--allow-body", B);
      expect(r.code).toBe(0);
      expect(r.out).toContain(A);
      expect(r.out).toContain(B);
      expect(r.out).toContain("body edits allowed in");
    });

    it("exits 2 when the allowed path is not in the diff", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit(A, "# Bab A\n\nIsi baru A.\n");
      const r = guard("--allow-body", A, "--allow-body", B);
      expect(r.code).toBe(2);
      expect(r.err).toContain(B);
    });

    it("exits 2 for a path that is not a chapter under books/*/src/content", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit("books/b/src/SUMMARY.md", "# Summary\n\n- [A Baru](content/01_a.md)\n- [B](content/02_b.md)\n");
      for (const bad of [
        "books/b/src/SUMMARY.md",
        "books/b/book.toml",
        "books/b/src/content/note.txt",
        "books/b/src/content/sub/01_a.md",
        "scripts/x.md",
      ]) {
        const r = guard("--allow-body", bad);
        expect(r.code).toBe(2);
        expect(r.err).toContain(bad);
      }
    });

    it("exits 2 when the flag has no value", () => {
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      const r = guard("--allow-body");
      expect(r.code).toBe(2);
      expect(r.err).toContain("--allow-body");
    });

    it("exits 2 when used without --diff-guard", () => {
      writeBook(tmp, "b", twoChapters);
      const r = run(["--root", tmp, "--allow-body", A]);
      expect(r.code).toBe(2);
      expect(r.err).toContain("--diff-guard");
      expect(run(["--root", tmp, "--parity-base", "HEAD", "--allow-body", A]).code).toBe(2);
    });

    it("works with --books and rejects a path outside the selected books", () => {
      writeBook(tmp, "a", { chapters: { "01_a.md": "# Bab\n\nIsi lama.\n" } });
      writeBook(tmp, "b", twoChapters);
      commitBase(tmp);
      edit("books/a/src/content/01_a.md", "# Bab\n\nIsi baru.\n");
      edit(A, "# Bab A\n\nIsi baru A.\n");
      expect(guard("--books", "b", "--allow-body", A).code).toBe(0);
      const r = guard("--books", "b", "--allow-body", "books/a/src/content/01_a.md");
      expect(r.code).toBe(2);
      expect(r.err).toContain("books/a/src/content/01_a.md");
    });
  });

  describe("--parity-base", () => {
    const paired = {
      summary: "# Summary\n\n- [Bab Satu: Awal](content/01_a.md)\n",
      chapters: { "01_a.md": "# Bab Satu: Awal\n\nIsi.\n" },
    };

    it("fails when SUMMARY and first heading diverge after a rewrite", () => {
      writeBook(tmp, "b", paired);
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/SUMMARY.md"),
        "# Summary\n\n- [Bab Satu Awal](content/01_a.md)\n",
      );
      fs.writeFileSync(
        path.join(tmp, "books/b/src/content/01_a.md"),
        "# Awal Bab Satu\n\nIsi.\n",
      );
      const r = run(["--root", tmp, "--parity-base", "HEAD"]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("01_a.md");
    });

    it("passes when both change identically", () => {
      writeBook(tmp, "b", paired);
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/SUMMARY.md"),
        "# Summary\n\n- [Bab Satu Awal](content/01_a.md)\n",
      );
      fs.writeFileSync(
        path.join(tmp, "books/b/src/content/01_a.md"),
        "# Bab Satu Awal\n\nIsi.\n",
      );
      expect(run(["--root", tmp, "--parity-base", "HEAD"]).code).toBe(0);
    });

    it("skips chapters that were not paired at the base", () => {
      writeBook(tmp, "b", {
        summary: "# Summary\n\n- [Judul SUMMARY](content/01_a.md)\n",
        chapters: { "01_a.md": "# Judul Heading\n\nIsi.\n" },
      });
      commitBase(tmp);
      fs.writeFileSync(
        path.join(tmp, "books/b/src/content/01_a.md"),
        "# Judul Heading Baru\n\nIsi.\n",
      );
      expect(run(["--root", tmp, "--parity-base", "HEAD"]).code).toBe(0);
    });

    it("exits 2 for an unknown ref", () => {
      writeBook(tmp, "b", paired);
      commitBase(tmp);
      expect(run(["--root", tmp, "--parity-base", "no-such-ref"]).code).toBe(2);
    });
  });

  describe("--dup-guard", () => {
    it("fails when a new duplicate ## heading appears", () => {
      writeBook(tmp, "b", {
        summary: "# Summary\n\n- [A](content/01_a.md)\n- [B](content/02_b.md)\n",
        chapters: {
          "01_a.md": "# A\n\n## Ringkasan\n",
          "02_b.md": "# B\n\n## Penutup\n",
        },
      });
      commitBase(tmp);
      fs.writeFileSync(path.join(tmp, "books/b/src/content/02_b.md"), "# B\n\n## Ringkasan\n");
      const r = run(["--root", tmp, "--dup-guard", "HEAD"]);
      expect(r.code).toBe(1);
      expect(r.out).toContain("b");
    });

    it("passes when duplicates do not increase", () => {
      writeBook(tmp, "b", {
        summary: "# Summary\n\n- [A](content/01_a.md)\n- [B](content/02_b.md)\n",
        chapters: {
          "01_a.md": "# A\n\n## Ringkasan\n",
          "02_b.md": "# B\n\n## Ringkasan\n",
        },
      });
      commitBase(tmp);
      fs.writeFileSync(path.join(tmp, "books/b/src/content/02_b.md"), "# B\n\n## Penutup\n");
      expect(run(["--root", tmp, "--dup-guard", "HEAD"]).code).toBe(0);
    });

    it("exits 2 for an unknown ref", () => {
      writeBook(tmp, "b");
      commitBase(tmp);
      expect(run(["--root", tmp, "--dup-guard", "no-such-ref"]).code).toBe(2);
    });
  });
});
