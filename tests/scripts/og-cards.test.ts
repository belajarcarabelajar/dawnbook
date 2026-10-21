import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  TITLE_WIDTH,
  cardPages,
  measureTitle,
  missingGlyphs,
  summaryPages,
  renderArt,
  renderCard,
  titleSize,
} from "../../scripts/og/cards";
import { renderBookCards, renderOgCards } from "../../scripts/render-og-cards";
import { ogImagePath } from "../../scripts/og/paths";

const ART_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 630 630" width="630" height="630">' +
  '<rect width="630" height="630" fill="#203040"/><circle cx="315" cy="315" r="160" fill="#e0a040"/></svg>';

function pngSize(png: Buffer): { width: number; height: number } {
  expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

describe("summaryPages", () => {
  test("names pages like mdBook: no ./ or .md, README and index become index, drafts skipped", () => {
    const summary = [
      "# Summary",
      "",
      "- [Pengantar](./README.md)",
      "- [Bab Satu](content/01_satu.md)",
      "    - [Sub Bab](./content/01a_sub.md)",
      "- [Draf]()",
      "- [Indeks](index.md)",
      "- [Bagian](content/README.md)",
    ].join("\n");
    expect(summaryPages(summary)).toEqual([
      { name: "Pengantar", page: "index" },
      { name: "Bab Satu", page: "content/01_satu" },
      { name: "Sub Bab", page: "content/01a_sub" },
      { name: "Indeks", page: "index" },
      { name: "Bagian", page: "content/index" },
    ]);
  });

  test("accepts * and + bullets and decodes URL escapes", () => {
    expect(summaryPages("* [Satu](content/01_satu.md)\n+ [Dua](content/02%20dua.md)\n")).toEqual([
      { name: "Satu", page: "content/01_satu" },
      { name: "Dua", page: "content/02 dua" },
    ]);
  });

  test("skips targets that would leave the book or are not Markdown", () => {
    const summary = "- [a](../../../x.md)\n- [b](/etc/x.md)\n- [c](https://e.com/y.md)\n- [d](notes.txt)\n";
    expect(summaryPages(summary)).toEqual([]);
  });
});

describe("resvg font scan", () => {
  test("every Resvg in the card code turns the system font scan off", () => {
    for (const file of ["scripts/og/cards.ts", "scripts/check-covers.ts"]) {
      const source = readFileSync(join(import.meta.dir, "../..", file), "utf8");
      const calls = source.match(/new Resvg\([^;]*\)/g) ?? [];
      expect(calls.length).toBeGreaterThan(0);
      for (const call of calls) expect(call).toMatch(/RESVG_FONTS|loadSystemFonts: false/);
    }
  });
});

describe("cardPages", () => {
  test("puts the book card first and one card per chapter after it", () => {
    const pages = cardPages(
      { title: "Buku Uji", author: "Iwan Kurniawan", chapterCount: 2 },
      "- [Pengantar](README.md)\n- [Bab Satu](content/01_satu.md)\n",
    );
    expect(pages).toEqual([
      { page: "index", text: { context: "2 bab", title: "Buku Uji", author: "Iwan Kurniawan" } },
      { page: "content/01_satu", text: { context: "Buku Uji", title: "Bab Satu", author: "Iwan Kurniawan" } },
    ]);
  });
});

describe("titleSize", () => {
  // Every character is half the font size wide, so widths are easy to reason about.
  const half = (text: string, size: number) => text.length * size * 0.5;
  const limit = TITLE_WIDTH * 0.96;

  test("keeps the largest size for a short title", () => {
    expect(titleSize("Bab Pendek", half)).toBe(58);
  });

  test("shrinks until the longest word fits the panel", () => {
    const word = "x".repeat(17); // 17 * 58 * 0.5 = 493 px, too wide at 58
    const size = titleSize(word, half);
    expect(half(word, size)).toBeLessThanOrEqual(limit);
    expect(size).toBeLessThan(58);
  });

  test("counts a hyphen as a line-break point, as satori does", () => {
    const piece = "x".repeat(14); // 14 * 58 * 0.5 = 406 px fits; the hyphenated pair does not
    expect(titleSize(`${piece}-${piece}`, half)).toBe(58);
  });

  test("shrinks until the title wraps into at most four lines", () => {
    const title = Array.from({ length: 10 }, () => "kata").join(" ") + " " + "panjang ".repeat(8).trim();
    const size = titleSize(title, half);
    expect(size).toBeLessThan(58);
  });

  test("with the real font, long Indonesian words fit the panel", () => {
    for (const word of ["Perkembangan", "Neuroplastisitas", "Microteaching"]) {
      expect(measureTitle(word, titleSize(word))).toBeLessThanOrEqual(limit);
    }
  });
});

describe("missingGlyphs", () => {
  test("the title font draws Greek beta and the minus sign, the body font does not draw beta", () => {
    expect(missingGlyphs("Peluruhan Beta Minus (β−)", "title")).toEqual([]);
    expect(missingGlyphs("Beta (β)", "body")).toEqual(["β"]);
    expect(missingGlyphs("Café", "body")).toEqual([]);
  });

  test("reports characters outside every subset", () => {
    expect(missingGlyphs("Ikigai 生き甲斐", "title")).toEqual(["生", "き", "甲", "斐"]);
  });
});

describe("renderCard", () => {
  test("renders a 1200x630 PNG, the same bytes for the same inputs", async () => {
    const art = renderArt(ART_SVG);
    expect(pngSize(art)).toEqual({ width: 630, height: 630 });
    const text = { context: "Peluruhan Beta (Beta Decay)", title: "Mekanisme Peluruhan Beta Minus (β−)", author: "Iwan Kurniawan" };
    const first = await renderCard(text, art);
    const second = await renderCard(text, art);
    expect(pngSize(first)).toEqual({ width: CARD_WIDTH, height: CARD_HEIGHT });
    expect(first.equals(second)).toBe(true);
  });
});

describe("renderBookCards", () => {
  test("writes one card per page to the paths inject-gating looks up", async () => {
    const root = await mkdtemp(join(tmpdir(), "og-cards-"));
    try {
      const bookDir = join(root, "books", "buku-uji");
      await mkdir(join(bookDir, "src"), { recursive: true });
      await writeFile(join(bookDir, "cover.svg"), ART_SVG);
      await writeFile(join(bookDir, "src", "SUMMARY.md"), "- [Bab Satu](content/01_satu.md)\n- [Bab Dua](content/02_dua.md)\n");
      const out = join(root, "output");
      const book = { slug: "buku-uji", title: "Buku Uji", author: "Iwan Kurniawan", chapterCount: 2 };
      const files = await renderBookCards(root, book, (page) => join(out, ogImagePath(book.slug, page)));
      expect(files).toEqual([
        join(out, "og/buku-uji/index.png"),
        join(out, "og/buku-uji/content/01_satu.png"),
        join(out, "og/buku-uji/content/02_dua.png"),
      ]);
      for (const f of files) {
        expect(existsSync(f)).toBe(true);
        expect(pngSize(await readFile(f))).toEqual({ width: CARD_WIDTH, height: CARD_HEIGHT });
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("renderOgCards", () => {
  test("writes every card of every book under output/og", async () => {
    const root = await mkdtemp(join(tmpdir(), "og-cards-all-"));
    try {
      const books = [];
      for (const slug of ["buku-a", "buku-b"]) {
        const bookDir = join(root, "books", slug);
        await mkdir(join(bookDir, "src"), { recursive: true });
        await writeFile(join(bookDir, "cover.svg"), ART_SVG);
        await writeFile(join(bookDir, "src", "SUMMARY.md"), "- [Bab Satu](content/01_satu.md)\n");
        books.push({ slug, title: `Judul ${slug}`, author: "Iwan Kurniawan", chapterCount: 1 });
      }
      const out = join(root, "output");
      expect(await renderOgCards(root, out, books)).toBe(4);
      for (const slug of ["buku-a", "buku-b"]) {
        expect(existsSync(join(out, ogImagePath(slug, "index")))).toBe(true);
        expect(existsSync(join(out, ogImagePath(slug, "content/01_satu")))).toBe(true);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  test("fails for a book without a cover", async () => {
    const root = await mkdtemp(join(tmpdir(), "og-cards-fail-"));
    try {
      const book = { slug: "tanpa-cover", title: "Tanpa Cover", author: "Iwan Kurniawan", chapterCount: 1 };
      await expect(renderOgCards(root, join(root, "output"), [book])).rejects.toThrow(/cover\.svg/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
