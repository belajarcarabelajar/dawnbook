import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import path from "node:path";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { checkBookStructure, runStructureGate } from "../../scripts/check-book-structure";
import { main as headingColonsMain } from "../../scripts/check-heading-colons";
import { findRepeatedHeadings } from "../../scripts/check-repeated-headings";
import { runVoiceGate } from "../../scripts/check-voice";

const ROOT = path.resolve(import.meta.dir, "../fixtures/premium");
const BOOKS = path.join(ROOT, "books");
const FREE_OK = "premium-bebas";
const BROKEN = "premium-rusak";
const FREE_IMAGES = "gratis-gambar";

function markPremium(...slugs: string[]): void {
  setPremiumRegistryForTest(Object.fromEntries(slugs.map((s) => [s, { products: [], productUrl: "" }])));
}

const bookOf = (problems: string[], slug: string) => problems.filter((p) => p.startsWith(`${slug}/`));

let logSpy: ReturnType<typeof spyOn>;
beforeEach(() => {
  logSpy = spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  setPremiumRegistryForTest(null);
  logSpy.mockRestore();
});

describe("premium book with house-rule breaches", () => {
  test("structure passes when marked premium", () => {
    expect(checkBookStructure(path.join(BOOKS, FREE_OK), { premium: true })).toEqual({ chapters: 3, problems: [] });
  });

  test("structure fails the content rules when not premium", () => {
    const { problems } = checkBookStructure(path.join(BOOKS, FREE_OK));
    const text = problems.join("\n");
    expect(text).toContain("02_dua.md:5: em dash");
    expect(text).toContain("02_dua.md:5: emoji");
    expect(text).toContain("03_tiga.md:5: formal pronoun Anda");
    expect(text).toContain("01_satu.md: opener's first sentence would be truncated");
    expect(text).toContain('heading "ringkasan" repeated');
    expect(text).not.toContain("link target");
  });

  test("structure gate reads the registry", () => {
    markPremium(FREE_OK, BROKEN);
    expect(bookOf(runStructureGate(BOOKS).problems, FREE_OK)).toEqual([]);
    setPremiumRegistryForTest(null);
    expect(bookOf(runStructureGate(BOOKS).problems, FREE_OK).length).toBeGreaterThan(0);
  });

  test("voice gate skips it when premium and flags it otherwise", () => {
    expect(bookOf(runVoiceGate(BOOKS).problems, FREE_OK)).toContain(`${FREE_OK}/01_satu.md: Kalau dipikir-pikir x1 (max 0)`);
    markPremium(FREE_OK);
    expect(bookOf(runVoiceGate(BOOKS).problems, FREE_OK)).toEqual([]);
  });

  test("heading-colon checker skips it when premium and flags it otherwise", () => {
    expect(headingColonsMain(["--root", ROOT, "--books", FREE_OK])).toBe(1);
    markPremium(FREE_OK);
    expect(headingColonsMain(["--root", ROOT, "--books", FREE_OK])).toBe(0);
    expect(headingColonsMain(["--root", ROOT, "--books", FREE_IMAGES])).toBe(0);
  });

  test("repeated-heading check skips it when premium and flags it otherwise", () => {
    expect(findRepeatedHeadings(ROOT).map((r) => [r.slug, r.heading])).toEqual([[FREE_OK, "ringkasan"]]);
    markPremium(FREE_OK);
    expect(findRepeatedHeadings(ROOT)).toEqual([]);
  });
});

describe("premium book with technical problems", () => {
  test("still fails the technical rules", () => {
    const { problems } = checkBookStructure(path.join(BOOKS, BROKEN), { premium: true });
    expect(problems).toEqual([
      "book.toml: description is 90 characters, outside the 100 to 160 range",
      '01_satu.md: first heading "Judul di Bab" differs from SUMMARY title "Judul di Daftar"',
      '01_satu.md:5: link target "02_tidak-ada.md" is not an http(s) URL, an in-page anchor or a chapter file of the book',
      '01_satu.md:7: link target "../images/public/hilang.png" is not an http(s) URL, an in-page anchor or a chapter file of the book',
    ]);
  });
});

describe("images in free books", () => {
  test("an existing image passes and a missing one fails", () => {
    expect(checkBookStructure(path.join(BOOKS, FREE_IMAGES)).problems).toEqual([
      '01_satu.md:7: link target "../images/hilang.png" is not an http(s) URL, an in-page anchor or a chapter file of the book',
    ]);
  });
});
