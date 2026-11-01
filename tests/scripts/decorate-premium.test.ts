import { afterAll, afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { decoratePremiumBook } from "../../scripts/builder/decorate-premium";
import { prepareBookForMdbook } from "../../scripts/builder/mdbook-runner";

// Synthetic fixtures only: premium book text never enters this public repo.
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), "dawnbook-decorate-premium-"));
afterAll(() => fs.rmSync(ROOT, { recursive: true, force: true }));

let bookCounter = 0;
function makeBook(files: Record<string, string>, root: string = ROOT, slug = `buku-${++bookCounter}`): string {
  const content = path.join(root, slug, "src", "content");
  fs.mkdirSync(content, { recursive: true });
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(content, name), text);
  return path.join(root, slug);
}

const readChapter = (bookDir: string, name: string) =>
  fs.readFileSync(path.join(bookDir, "src", "content", name), "utf8");

const lines = (...l: string[]) => l.join("\n");

const REFERENCES = lines(
  "## Referensi",
  "",
  "Ahmad, B. (2020). *Judul buku contoh*. Penerbit Contoh.",
  "",
  "### Artikel",
  "",
  "Citra, D. (2019). Judul artikel contoh. *Jurnal Contoh*, 1(2), 3-4.",
  "",
);

const REFERENCES_WRAPPED = lines(
  "## Referensi",
  "",
  '<div class="daftar-pustaka">',
  "",
  "Ahmad, B. (2020). *Judul buku contoh*. Penerbit Contoh.",
  "",
  "### Artikel",
  "",
  "Citra, D. (2019). Judul artikel contoh. *Jurnal Contoh*, 1(2), 3-4.",
  "",
  "</div>",
  "",
);

const PLAIN_CHAPTER = lines(
  "## Bab Biasa",
  "",
  "Paragraf biasa tanpa label.",
  "",
  "## Referensi",
  "",
  "Bab biasa dengan judul Referensi di dalamnya tetap seperti semula.",
  "",
);

const FENCE = "```";

const EVIDENCE = lines(
  "## Bab Bukti",
  "",
  "Paragraf pembuka biasa.",
  "",
  "**Kekuatan bukti:** kuat. Tiga percobaan acak memberi hasil serupa.",
  "",
  "**Kekuatan bukti:** Sedang, karena sampelnya kecil.",
  "",
  "**Kekuatan bukti:** TERBATAS (satu studi kecil)",
  "dengan baris kedua dalam paragraf yang sama.",
  "",
  "- Butir daftar.",
  "- **Kekuatan bukti:** kuat. Label di dalam butir daftar tetap.",
  "",
  "  **Kekuatan bukti:** sedang. Paragraf lanjutan butir daftar tetap.",
  "",
  "> **Kekuatan bukti:** terbatas. Label di dalam kutipan tetap.",
  ">",
  "> **Kekuatan bukti:** kuat. Paragraf kedua kutipan tetap.",
  "",
  "Kalimat yang menyebut **Kekuatan bukti:** sedang di tengah paragraf tetap.",
  "",
  "**Kekuatan bukti:** belum diketahui, jadi tidak dibungkus.",
  "",
  `${FENCE}text`,
  "**Kekuatan bukti:** kuat. Contoh di dalam blok kode tetap.",
  "",
  "**Kekuatan bukti:** sedang. Masih di dalam blok kode.",
  "",
  "baris kode terakhir",
  FENCE,
  "",
  "**Kekuatan bukti:** sedang. Paragraf terakhir tanpa baris kosong penutup.",
);

const EVIDENCE_WRAPPED = lines(
  "## Bab Bukti",
  "",
  "Paragraf pembuka biasa.",
  "",
  '<div class="bukti bukti-kuat">',
  "",
  "**Kekuatan bukti:** kuat. Tiga percobaan acak memberi hasil serupa.",
  "",
  "</div>",
  "",
  '<div class="bukti bukti-sedang">',
  "",
  "**Kekuatan bukti:** Sedang, karena sampelnya kecil.",
  "",
  "</div>",
  "",
  '<div class="bukti bukti-terbatas">',
  "",
  "**Kekuatan bukti:** TERBATAS (satu studi kecil)",
  "dengan baris kedua dalam paragraf yang sama.",
  "",
  "</div>",
  "",
  "- Butir daftar.",
  "- **Kekuatan bukti:** kuat. Label di dalam butir daftar tetap.",
  "",
  "  **Kekuatan bukti:** sedang. Paragraf lanjutan butir daftar tetap.",
  "",
  "> **Kekuatan bukti:** terbatas. Label di dalam kutipan tetap.",
  ">",
  "> **Kekuatan bukti:** kuat. Paragraf kedua kutipan tetap.",
  "",
  "Kalimat yang menyebut **Kekuatan bukti:** sedang di tengah paragraf tetap.",
  "",
  "**Kekuatan bukti:** belum diketahui, jadi tidak dibungkus.",
  "",
  `${FENCE}text`,
  "**Kekuatan bukti:** kuat. Contoh di dalam blok kode tetap.",
  "",
  "**Kekuatan bukti:** sedang. Masih di dalam blok kode.",
  "",
  "baris kode terakhir",
  FENCE,
  "",
  '<div class="bukti bukti-sedang">',
  "",
  "**Kekuatan bukti:** sedang. Paragraf terakhir tanpa baris kosong penutup.",
  "",
  "</div>",
);

describe("decoratePremiumBook: evidence labels", () => {
  test("wraps each top-level label paragraph in a callout of its level and leaves lists, quotes and code alone", () => {
    const book = makeBook({ "02_bukti.md": EVIDENCE });

    const result = decoratePremiumBook(book);

    expect(readChapter(book, "02_bukti.md")).toBe(EVIDENCE_WRAPPED);
    expect(result).toEqual({ references: 0, labels: 4 });
  });
});

describe("decoratePremiumBook: reference list", () => {
  test("wraps everything below the title of a *_referensi.md chapter in a daftar-pustaka div", () => {
    const book = makeBook({ "12_referensi.md": REFERENCES, "03_bab-biasa.md": PLAIN_CHAPTER });

    const result = decoratePremiumBook(book);

    expect(readChapter(book, "12_referensi.md")).toBe(REFERENCES_WRAPPED);
    expect(readChapter(book, "03_bab-biasa.md")).toBe(PLAIN_CHAPTER);
    expect(result).toEqual({ references: 1, labels: 0 });
  });
});

describe("decoratePremiumBook: second run", () => {
  test("changes nothing and reports nothing new", () => {
    const book = makeBook({ "02_bukti.md": EVIDENCE, "12_referensi.md": REFERENCES });

    expect(decoratePremiumBook(book)).toEqual({ references: 1, labels: 4 });
    const second = decoratePremiumBook(book);

    expect(second).toEqual({ references: 0, labels: 0 });
    expect(readChapter(book, "02_bukti.md")).toBe(EVIDENCE_WRAPPED);
    expect(readChapter(book, "12_referensi.md")).toBe(REFERENCES_WRAPPED);
  });
});

describe("shared book stylesheet", () => {
  const css = fs.readFileSync(path.resolve(import.meta.dir, "../../books/shared-header.css"), "utf8");
  const rule = (selector: string) => {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const body = new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css)?.[1];
    if (body === undefined) throw new Error(`no rule for ${selector} in books/shared-header.css`);
    return body;
  };

  // WCAG 2 relative luminance and contrast ratio.
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const contrast = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const hsl = (h: number, s: number, l: number) => {
    const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round((l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
    };
    return [f(0), f(8), f(4)];
  };
  // --bg of the five themes in mdBook 0.5.4 theme/css/variables.css.
  const THEME_BG: Record<string, number[]> = {
    light: hsl(0, 0, 100),
    rust: hsl(60, 9, 87),
    coal: hsl(200, 7, 8),
    navy: hsl(226, 23, 11),
    ayu: hsl(210, 25, 8),
  };

  test("sets a 1.27 cm hanging indent, left aligned, on reference entries", () => {
    const body = rule(".daftar-pustaka p");
    expect(body).toContain("padding-left: 1.27cm;");
    expect(body).toContain("text-indent: -1.27cm;");
    expect(body).toContain("text-align: left;");
    expect(body).toContain("margin: 0 0 0.6em 0;");
  });

  test("draws the evidence callout with a level border on the quote background", () => {
    const body = rule(".bukti");
    // design-tells: allow this test asserts the evidence-level stripe rule of shared-header.css
    expect(body).toContain("border-left: 4px solid;");
    expect(body).toContain("background: var(--quote-bg);");
    expect(rule(".bukti p")).toContain("margin: 0;");
  });

  test.each(["kuat", "sedang", "terbatas"])("gives the %s border at least 3:1 contrast on all five theme backgrounds", (level) => {
    const colour = /border-left-color:\s*#([0-9a-f]{6});/i.exec(rule(`.bukti-${level}`))?.[1];
    expect(colour).toBeDefined();
    const rgb = [0, 2, 4].map((i) => parseInt(colour!.slice(i, i + 2), 16));
    for (const [theme, bg] of Object.entries(THEME_BG)) {
      expect({ theme, ok: contrast(rgb, bg) >= 3 }).toEqual({ theme, ok: true });
    }
  });
});

describe("prepareBookForMdbook", () => {
  afterEach(() => setPremiumRegistryForTest(null));

  test("decorates the prepared copy of an edition 2026 premium book only, never its source", async () => {
    const booksDir = fs.mkdtempSync(path.join(ROOT, "books-"));
    const tmpBooksDir = fs.mkdtempSync(path.join(ROOT, "build-tmp-"));
    const slugs = ["buku-edisi", "buku-verbatim", "buku-gratis"];
    for (const slug of slugs) makeBook({ "02_bukti.md": EVIDENCE, "12_referensi.md": REFERENCES }, booksDir, slug);
    for (const asset of ["shared-header.css", "shared-script.js"]) fs.writeFileSync(path.join(booksDir, asset), "");
    setPremiumRegistryForTest({
      "buku-edisi": { products: [], productUrl: "", edition: 2026 },
      "buku-verbatim": { products: [], productUrl: "" },
    });

    for (const slug of slugs) await prepareBookForMdbook(booksDir, tmpBooksDir, slug);

    const edisi = path.join(tmpBooksDir, "buku-edisi");
    expect(readChapter(edisi, "02_bukti.md")).toBe(EVIDENCE_WRAPPED);
    expect(readChapter(edisi, "12_referensi.md")).toBe(REFERENCES_WRAPPED);
    for (const slug of ["buku-verbatim", "buku-gratis"]) {
      expect(readChapter(path.join(tmpBooksDir, slug), "02_bukti.md")).toBe(EVIDENCE);
      expect(readChapter(path.join(tmpBooksDir, slug), "12_referensi.md")).toBe(REFERENCES);
    }
    for (const slug of slugs) {
      expect(readChapter(path.join(booksDir, slug), "02_bukti.md")).toBe(EVIDENCE);
      expect(readChapter(path.join(booksDir, slug), "12_referensi.md")).toBe(REFERENCES);
    }
  });
});
