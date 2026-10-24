import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const BOOK = path.resolve(import.meta.dir, "../../books/analisis-ekspresif-9-summers-10-autumns");
const CONTENT = path.join(BOOK, "src/content");

// Owner budget (plan 2026-10-24-dawnbook-attribution-fixes, Task G1): a page-cited
// quote from the novel is at most 40 words, and all of them together at most 600.
const MAX_WORDS_PER_QUOTE = 40;
const MAX_WORDS_TOTAL = 600;

// A quote is text of at least 20 characters inside curly or straight double quotes,
// followed on the same line within 60 characters by "Hlm" (the page cite).
const QUOTE_WITH_PAGE = /(?:“([^”\n]{20,})”|"([^"\n]{20,})")[^\n]{0,60}?Hlm/g;

interface Quote {
  where: string;
  words: number;
}

function pageCitedQuotes(): Quote[] {
  const quotes: Quote[] = [];
  for (const file of readdirSync(CONTENT).filter((f) => f.endsWith(".md")).sort()) {
    const lines = readFileSync(path.join(CONTENT, file), "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(QUOTE_WITH_PAGE)) {
        const text = m[1] ?? m[2] ?? "";
        quotes.push({ where: `${file}:${i + 1}`, words: text.trim().split(/\s+/).filter(Boolean).length });
      }
    });
  }
  return quotes;
}

describe("book analisis-ekspresif-9-summers-10-autumns", () => {
  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  test(`page-cited quotes stay within ${MAX_WORDS_PER_QUOTE} words each and ${MAX_WORDS_TOTAL} in total`, () => {
    const quotes = pageCitedQuotes();
    const total = quotes.reduce((sum, q) => sum + q.words, 0);
    const tooLong = quotes.filter((q) => q.words > MAX_WORDS_PER_QUOTE).map((q) => `${q.where} (${q.words} words)`);
    expect({ tooLong, total, withinTotal: total <= MAX_WORDS_TOTAL }).toEqual({
      tooLong: [],
      total,
      withinTotal: true,
    });
  });
});

// Hlm. 35 says "Kebijakan Ibu menyelamatkan kami semua"; the analysis must not add "pengorbanan" (debt sweep U3a).
describe("analisis-ekspresif-9-summers-10-autumns wording", () => {
  test("chapter 12 does not add 'pengorbanan' to Ibu's wisdom", () => {
    const file = readdirSync(CONTENT).find((f) => f.startsWith("12_"))!;
    expect(readFileSync(path.join(CONTENT, file), "utf-8")).not.toContain("Kebijakan dan pengorbanan Ibu");
  });
});
