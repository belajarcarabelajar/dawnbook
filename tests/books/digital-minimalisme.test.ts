import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const BOOK = path.resolve(import.meta.dir, "../../books/digital-minimalisme");
const CONTENT = path.join(BOOK, "src/content");

function chapter(prefix: string): string {
  const name = readdirSync(CONTENT).find((f) => f.startsWith(`${prefix}_`));
  if (!name) throw new Error(`chapter ${prefix} not found`);
  return readFileSync(path.join(CONTENT, name), "utf8");
}

describe("book digital-minimalisme quotation attribution", () => {
  // "You are the product" is traced to Andrew Lewis (blue_beetle) on MetaFilter, 26 August 2010.
  test("chapter 02 credits the 'you are the product' line to Andrew Lewis", () => {
    const text = chapter("02");
    const line = text.split("\n").find((l) => l.includes("kamu bukan pelanggan"));
    expect(line).toBeDefined();
    expect(line).toContain("Andrew Lewis");
    expect(line).toContain("MetaFilter");
  });

  test("Referensi lists the MetaFilter comment by Andrew Lewis", () => {
    const ref = chapter("12");
    expect(ref).toContain("Lewis, A.");
    expect(ref).toContain("https://www.metafilter.com/95152/Userdriven-discontent#3256046");
  });

  // No verifiable author for the servant/master proverb: not presented as a quotation.
  test("chapter 02 does not present the servant/master saying as a quotation", () => {
    const text = chapter("02");
    expect(text).not.toContain("\"Teknologi adalah pelayan");
    expect(text).not.toMatch(/^>.*pelayan yang sangat baik/m);
  });

  // No source for the "great tools" line: not presented as a quotation.
  test("chapter 05 does not present the 'alat yang hebat' line as a quotation", () => {
    const text = chapter("05");
    expect(text).not.toContain("\"Alat yang hebat");
    expect(text).not.toMatch(/^>.*Alat yang hebat/m);
  });

  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });
});
