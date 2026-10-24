import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const BOOK = path.resolve(import.meta.dir, "../../books/filosofi-stoikisme");
const read = (file: string) => readFileSync(path.join(BOOK, "src/content", file), "utf8");
const CH05 = "05_empat-kebajikan-utama-cardinal-virtues-kompas-moral-kaum-stoik.md";

describe("book filosofi-stoikisme attribution fixes", () => {
  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  // The old wording ("Kebaikan utama ... kebodohan") has no matching Seneca passage.
  // Seneca, Letter 31.6 (Gummere): "What then is good? The knowledge of things.
  // What is evil? The lack of knowledge of things."
  test("chapter 5 no longer carries the unsourced Seneca wording", () => {
    expect(read(CH05)).not.toContain("Kebaikan utama adalah kebijaksanaan");
  });

  test("chapter 5 quotes Seneca Letter 31.6 faithfully and names its location", () => {
    const text = read(CH05);
    expect(text).toContain("Pengetahuan tentang segala hal");
    expect(text).toMatch(/Seneca[^\n]*surat 31[^\n]*bagian 6/i);
  });

  test("Referensi names letter 31 section 6 under the Moral Letters entry", () => {
    const ref = read("12_referensi.md");
    const entry = ref.split("\n").find((line) => line.includes("*Moral Letters to Lucilius*"));
    expect(entry).toMatch(/surat 31 bagian 6/i);
  });
});
