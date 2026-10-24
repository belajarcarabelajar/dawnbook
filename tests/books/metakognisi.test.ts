import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const BOOK = path.resolve(import.meta.dir, "../../books/metakognisi");
const read = (file: string) => readFileSync(path.join(BOOK, "src/content", file), "utf8");

const CH05 = "05_dampak-metakognisi-meningkatkan-pemahaman-dan-prestasi-akademik.md";
const CH07 = "07_metakognisi-dalam-pemecahan-masalah-kunci-berpikir-sistematis.md";
const CH10 = "10_metakognisi-dan-pembelajaran-regulasi-diri-menuju-pembelajar-mandiri.md";
const REF = "12_referensi.md";

describe("book metakognisi attribution fixes", () => {
  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  // No source was found for these two lines, so they must not be presented as quotations.
  test("chapter 7 problem-solving line is not a quotation", () => {
    expect(read(CH07)).not.toMatch(/^>\s*"Cara memecahkan masalah/m);
    expect(read(CH07)).not.toMatch(/"[^"\n]*dimulai jauh sebelum[^"\n]*"/);
  });

  test("chapter 10 self-regulation line is not a quotation", () => {
    expect(read(CH10)).not.toMatch(/^>\s*"Pembelajaran regulasi diri merupakan/m);
    expect(read(CH10)).not.toMatch(/"[^"\n]*pola pikir dasar[^"\n]*"/);
  });

  // Ohtani & Hisasaka (2018) found a weak overall correlation, not a strong one.
  test("chapter 5 no longer claims a strong correlation and cites the meta-analysis", () => {
    const ch = read(CH05);
    expect(ch).not.toContain("korelasi kuat");
    expect(ch).toContain("Ohtani");
    expect(ch).toContain("lemah");
  });

  test("Referensi lists Ohtani and Hisasaka (2018) with its DOI", () => {
    const ref = read(REF);
    expect(ref).toContain("Ohtani, K., & Hisasaka, T. (2018)");
    expect(ref).toContain("https://doi.org/10.1007/s11409-018-9183-8");
  });

  test("chapter 5 does not call the procrastination effect proven", () => {
    expect(read(CH05)).not.toMatch(/terbukti menekan dorongan/);
  });
});
