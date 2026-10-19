import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkBookStructure, extractLinkTargets, extractUrls } from "../../scripts/check-book-structure";

const dirs: string[] = [];

function makeBook(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "book-structure-"));
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

const OPENER = "Kamu mungkin mengenal Doraemon sejak kecil, tetapi jarang yang tahu bahwa robot kucing itu pernah diangkat menjadi duta resmi Jepang.";

const LONG_NO_STOP =
  "Pada suatu masa ketika televisi hitam putih masih menjadi barang mewah di banyak rumah tangga Jepang, sebuah serial animasi tentang robot kecil bernama Atom mulai tayang dan mengubah cara orang menonton";

function chapter(title: string, opener = OPENER): string {
  return `## ${title}\n\n${opener} Kalimat kedua menjelaskan lebih jauh.\n\n### Rincian ${title}\n\nIsi bagian.\n`;
}

function validBook(): Record<string, string> {
  return {
    "src/SUMMARY.md": "# Summary\n\n- [Bab Pertama](content/01_bab-pertama.md)\n- [Bab Kedua](content/02_bab-kedua.md)\n",
    "src/content/01_bab-pertama.md": chapter("Bab Pertama"),
    "src/content/02_bab-kedua.md": chapter("Bab Kedua"),
  };
}

describe("checkBookStructure", () => {
  test("a well-formed book has no problems and reports its chapter count", () => {
    const result = checkBookStructure(makeBook(validBook()));
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(2);
  });

  test("flags a SUMMARY entry whose file is missing", () => {
    const files = validBook();
    delete files["src/content/02_bab-kedua.md"];
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("02_bab-kedua.md") && p.includes("missing"))).toBe(true);
  });

  test("flags a chapter file that SUMMARY does not list", () => {
    const files = { ...validBook(), "src/content/03_liar.md": chapter("Liar") };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("03_liar.md") && p.includes("not in SUMMARY"))).toBe(true);
  });

  test("flags a stray markdown file in the src root", () => {
    const files = { ...validBook(), "src/1.md": "draft" };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("src/1.md"))).toBe(true);
  });

  test("flags a first heading that differs from the SUMMARY title", () => {
    const files = { ...validBook(), "src/content/01_bab-pertama.md": chapter("Judul Lain") };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("01_bab-pertama.md") && p.includes("first heading"))).toBe(true);
  });

  test("flags an em dash", () => {
    const files = { ...validBook(), "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\nSatu \u2014 dua.\n" };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("02_bab-kedua.md") && p.includes("em dash"))).toBe(true);
  });

  test("flags an em dash in SUMMARY.md", () => {
    const files = {
      ...validBook(),
      "src/SUMMARY.md": "# Summary\n\n- [Bab \u2014 satu](content/01_bab-pertama.md)\n- [Bab Kedua](content/02_bab-kedua.md)\n",
      "src/content/01_bab-pertama.md": chapter("Bab \u2014 satu"),
    };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems).toContain("SUMMARY.md:3: em dash");
  });

  test("flags an emoji in SUMMARY.md", () => {
    const files = { ...validBook(), "src/SUMMARY.md": `# Summary \u{1F4DA}\n\n${validBook()["src/SUMMARY.md"].split("\n\n")[1]}` };
    expect(checkBookStructure(makeBook(files)).problems).toEqual(["SUMMARY.md:1: emoji"]);
  });

  test("flags an emoji in a chapter", () => {
    const files = { ...validBook(), "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\nSeru \u{1F389}.\n" };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("02_bab-kedua.md") && p.includes("emoji"))).toBe(true);
  });

  test("keeps accented Latin letters such as Pokémon legal", () => {
    const files = { ...validBook(), "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\nPokémon dan café.\n" };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([]);
  });

  test("flags the formal pronoun Anda but not words that contain it", () => {
    const bad = { ...validBook(), "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\nAnda bisa mencoba.\n" };
    expect(checkBookStructure(makeBook(bad)).problems.some((p) => p.includes("Anda"))).toBe(true);
    const ok = { ...validBook(), "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\nPandangan, andalan, dan Andaikan saja.\n" };
    expect(checkBookStructure(makeBook(ok)).problems).toEqual([]);
  });

  test("flags an opener whose meta description would be truncated", () => {
    const long =
      "Pada suatu masa ketika televisi hitam putih masih menjadi barang mewah di banyak rumah tangga Jepang, sebuah serial animasi tentang robot kecil bernama Atom mulai tayang dan mengubah cara orang menonton.";
    const files = { ...validBook(), "src/content/01_bab-pertama.md": chapter("Bab Pertama", long) };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("01_bab-pertama.md") && p.includes("opener"))).toBe(true);
  });

  test("flags an opener that only the 145-character re-cut for escaped ampersands truncates", () => {
    const opener =
      "Studio animasi besar Jepang kini meniru cara kerja perusahaan teknologi lewat divisi R&D, sesi Q&A, dan kemitraan dengan AT&T bagi distribusi global.";
    expect(opener.length).toBe(149);
    const files = { ...validBook(), "src/content/01_bab-pertama.md": chapter("Bab Pertama", opener) };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("01_bab-pertama.md") && p.includes("opener"))).toBe(true);
  });

  test("accepts an opener that ends with a real ellipsis within 155 characters", () => {
    const opener =
      "Kamu mungkin mengira anime hanya hiburan anak, tetapi coba tanyakan pada diplomat Jepang yang pernah membawa Doraemon ke acara resmi...";
    const files = { ...validBook(), "src/content/01_bab-pertama.md": chapter("Bab Pertama", opener) };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([]);
  });

  test("reads the opener after stripping markdown emphasis and links", () => {
    const opener =
      "Kamu mungkin mengenal *Doraemon* sejak kecil, tetapi jarang yang tahu bahwa [robot kucing](https://www.mofa.go.jp/announce/announce/2008/3/0319-3.html) itu pernah menjadi duta resmi Jepang.";
    expect(opener.length).toBeGreaterThan(155);
    const files = { ...validBook(), "src/content/01_bab-pertama.md": chapter("Bab Pertama", opener) };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([]);
  });

  test("flags a book.toml description the root page meta would truncate", () => {
    const long =
      "Telusuri cara Jepang membawa budayanya ke dunia lewat manga dan anime, dari Astro Boy dan Cool Japan sampai streaming, wisata, dan harga di balik suksesnya.";
    const files = { ...validBook(), "book.toml": `[book]\ntitle = "Buku Uji"\ndescription = "${long}"\n` };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("book.toml") && p.includes("description"))).toBe(true);
  });

  test("accepts a book.toml description that fits the root page meta", () => {
    const ok = "Panduan singkat tentang cara Jepang membawa budayanya ke dunia lewat manga dan anime, dari Astro Boy sampai layanan streaming.";
    const files = { ...validBook(), "book.toml": `[book]\ntitle = "Buku Uji"\ndescription = "${ok}"\n` };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([]);
  });

  test("builds the opener from paragraphs only, skipping a leading list", () => {
    const md =
      "## Bab Pertama\n\n" +
      "- Doraemon menjadi duta anime resmi Jepang\n- Astro Boy tayang pertama kali\n- Pokemon menembus pasar Amerika Serikat\n\n" +
      `${LONG_NO_STOP}.\n`;
    const files = { ...validBook(), "src/content/01_bab-pertama.md": md };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("01_bab-pertama.md") && p.includes("opener"))).toBe(true);
  });

  test("counts paragraph text above the title in the opener", () => {
    const md = `${LONG_NO_STOP}.\n\n${chapter("Bab Pertama")}`;
    const files = { ...validBook(), "src/content/01_bab-pertama.md": md };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("01_bab-pertama.md") && p.includes("opener"))).toBe(true);
  });

  test("flags a level-1 chapter title", () => {
    const files = { ...validBook(), "src/content/01_bab-pertama.md": `#${chapter("Bab Pertama").slice(2)}` };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems).toEqual(["01_bab-pertama.md: chapter title must be a level-2 heading (##)"]);
  });

  test("ignores heading-like lines inside fenced code when checking repeats", () => {
    const fence = "\n```bash\n## install deps\nbun install\n```\n";
    const files = {
      ...validBook(),
      "src/content/01_bab-pertama.md": chapter("Bab Pertama") + fence,
      "src/content/02_bab-kedua.md": chapter("Bab Kedua") + fence,
    };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([]);
  });

  test("flags a book.toml without a description", () => {
    const files = { ...validBook(), "book.toml": `[book]\ntitle = "Buku Uji"\n` };
    expect(checkBookStructure(makeBook(files)).problems).toEqual(["book.toml: description missing"]);
  });

  test("flags a book.toml description shorter than 100 characters", () => {
    const files = { ...validBook(), "book.toml": `[book]\ntitle = "Buku Uji"\ndescription = "Buku singkat tentang manga."\n` };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([
      "book.toml: description is 27 characters, outside the 100 to 160 range",
    ]);
  });

  test("reports a missing SUMMARY.md", () => {
    const files = validBook();
    delete files["src/SUMMARY.md"];
    const result = checkBookStructure(makeBook(files));
    expect(result.chapters).toBe(0);
    expect(result.problems.some((p) => p.includes("SUMMARY.md missing"))).toBe(true);
  });

  test("does not count chapter titles as repeated headings", () => {
    const files = {
      "src/SUMMARY.md": "# Summary\n\n- [Bab Sama](content/01_bab-pertama.md)\n- [Bab Sama](content/02_bab-kedua.md)\n",
      "src/content/01_bab-pertama.md": "## Bab Sama\n\n" + OPENER + "\n\n### Rincian A\n\nIsi.\n",
      "src/content/02_bab-kedua.md": "## Bab Sama\n\n" + OPENER + "\n\n### Rincian B\n\nIsi.\n",
    };
    expect(checkBookStructure(makeBook(files)).problems).toEqual([]);
  });

  test("flags a regional-indicator flag as emoji", () => {
    const files = { ...validBook(), "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\nBendera \u{1F1EF}\u{1F1F5}.\n" };
    expect(checkBookStructure(makeBook(files)).problems).toEqual(["02_bab-kedua.md:9: emoji"]);
  });

  test("flags a scheme-less doi.org link target in a chapter", () => {
    const files = { ...validBook(), "src/content/01_bab-pertama.md": chapter("Bab Pertama") + "\nLihat [studi](doi.org/10.1/zz).\n" };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.filter((p) => p.includes("link target"))).toEqual([
      '01_bab-pertama.md:9: link target "doi.org/10.1/zz" is not an http(s) URL, an in-page anchor or a chapter file of the book',
    ]);
  });

  test("flags a www. link target and a protocol-relative href", () => {
    const body = chapter("Bab Pertama") + '\nLihat [situs](www.example.org/a) dan <a href="//example.org">ini</a>.\n';
    const { problems } = checkBookStructure(makeBook({ ...validBook(), "src/content/01_bab-pertama.md": body }));
    const flagged = problems.filter((p) => p.includes("link target"));
    expect(flagged.some((p) => p.includes('"www.example.org/a"'))).toBe(true);
    expect(flagged.some((p) => p.includes('"//example.org"'))).toBe(true);
  });

  test("flags a relative link to a chapter file the book does not have", () => {
    const body = chapter("Bab Pertama") + "\nLihat [bab hilang](09_tidak-ada.md).\n";
    const { problems } = checkBookStructure(makeBook({ ...validBook(), "src/content/01_bab-pertama.md": body }));
    expect(problems.some((p) => p.includes('"09_tidak-ada.md"'))).toBe(true);
  });

  test("accepts uppercase-scheme URLs, anchors and relative chapter links", () => {
    const body =
      chapter("Bab Pertama") +
      "\nLihat [A](HTTPS://Example.org/a), [B](#rincian), [C](02_bab-kedua.md), [D](02_bab-kedua.html#x) dan [E](../content/02_bab-kedua.md).\n" +
      '\n<a href="https://example.org/b">F</a>\n\n```text\n[G](doi.org/10.1/kode)\n```\n';
    const { problems } = checkBookStructure(makeBook({ ...validBook(), "src/content/01_bab-pertama.md": body }));
    expect(problems).toEqual([]);
  });

  test("accepts a site-root link to another existing book but flags other root paths", () => {
    const lib = fs.mkdtempSync(path.join(os.tmpdir(), "book-library-"));
    dirs.push(lib);
    fs.mkdirSync(path.join(lib, "digital-minimalisme"));
    fs.writeFileSync(path.join(lib, "digital-minimalisme", "book.toml"), "[book]\n");
    const book = path.join(lib, "buku-ini");
    const files = {
      ...validBook(),
      "src/content/01_bab-pertama.md":
        chapter("Bab Pertama") +
        "\nLihat [A](/books/digital-minimalisme/), [B](/books/digital-minimalisme/content/01_x.html#a), " +
        "[C](/books/), [D](/other/path) dan [E](/books/salah-ketik/).\n",
    };
    for (const [rel, body] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(book, rel)), { recursive: true });
      fs.writeFileSync(path.join(book, rel), body);
    }
    const flagged = checkBookStructure(book)
      .problems.filter((p) => p.includes("link target"))
      .map((p) => /"([^"]+)"/.exec(p)?.[1]);
    expect(flagged).toEqual(["/books/", "/other/path", "/books/salah-ketik/"]);
  });

  test("flags a closer heading repeated in two chapters", () => {
    const files = {
      ...validBook(),
      "src/content/01_bab-pertama.md": chapter("Bab Pertama") + "\n### Ringkasan\n\nA.\n",
      "src/content/02_bab-kedua.md": chapter("Bab Kedua") + "\n### Ringkasan\n\nB.\n",
    };
    const { problems } = checkBookStructure(makeBook(files));
    expect(problems.some((p) => p.includes("ringkasan") && p.includes("repeated"))).toBe(true);
  });
});

describe("extractUrls", () => {
  test("returns markdown link targets once each, in order", () => {
    const md = "Lihat [A](https://a.example/x) dan [B](https://doi.org/10.1/abc), lalu [A lagi](https://a.example/x).";
    expect(extractUrls(md)).toEqual(["https://a.example/x", "https://doi.org/10.1/abc"]);
  });

  test("keeps one level of balanced parentheses inside a URL", () => {
    const md = "Lihat [Lancet](https://doi.org/10.1016/S0140-6736(20)30183-5) dan https://doi.org/10.1016/S0140-6736(20)30183-5.";
    expect(extractUrls(md)).toEqual(["https://doi.org/10.1016/S0140-6736(20)30183-5"]);
  });

  test("strips trailing emphasis, backtick and quote characters", () => {
    const md = "**https://a.example/x** `https://b.example/y` \"https://c.example/z\" 'https://d.example/w'";
    expect(extractUrls(md)).toEqual(["https://a.example/x", "https://b.example/y", "https://c.example/z", "https://d.example/w"]);
  });

  test("also returns bare URLs from a markdown table cell", () => {
    const md = "| A1 | Nye 1990 | https://doi.org/10.2307/1148580 |\n| C1 | AJA | https://aja.gr.jp/download/air2025samary_en |";
    expect(extractUrls(md)).toEqual(["https://doi.org/10.2307/1148580", "https://aja.gr.jp/download/air2025samary_en"]);
  });

  test("matches the scheme case-insensitively", () => {
    expect(extractUrls("Lihat [x](HTTPS://Example.org/a) dan Http://b.example/c.")).toEqual([
      "HTTPS://Example.org/a",
      "Http://b.example/c",
    ]);
  });
});

describe("extractLinkTargets", () => {
  test("returns inline link targets and href values once each, in document order", () => {
    const md =
      '[a](HTTPS://Example.org/a) <a href="//example.org">b</a> [c](doi.org/10.1/zz) ' +
      "<a href='www.example.org/a'>d</a> [e](#bagian) [f](02_bab.md) [g](doi.org/10.1/zz)";
    expect(extractLinkTargets(md)).toEqual([
      "HTTPS://Example.org/a",
      "//example.org",
      "doi.org/10.1/zz",
      "www.example.org/a",
      "#bagian",
      "02_bab.md",
    ]);
  });

  test("keeps a DOI with one level of parentheses whole and strips a quoted title", () => {
    const md = '[Snyder](https://doi.org/10.1016/0022-1031(82)90052-X "Judul") dan [x](www.example.org/a \'t\')';
    expect(extractLinkTargets(md)).toEqual(["https://doi.org/10.1016/0022-1031(82)90052-X", "www.example.org/a"]);
  });

  test("ignores link targets inside fenced code blocks", () => {
    const md = "[a](#satu)\n\n```md\n[b](doi.org/10.1/kode)\n<a href=\"//x.example\">c</a>\n```\n\n[d](#dua)";
    expect(extractLinkTargets(md)).toEqual(["#satu", "#dua"]);
  });
});
