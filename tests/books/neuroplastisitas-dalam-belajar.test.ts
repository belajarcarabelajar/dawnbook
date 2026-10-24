import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const BOOK = path.resolve(import.meta.dir, "../../books/neuroplastisitas-dalam-belajar");
const CH05 = path.join(BOOK, "src/content/05_neurogenesis-kelahiran-sel-saraf-baru.md");

// The "Studi Supir Taksi London" section, up to the next heading.
function taxiSection(): string {
  const text = readFileSync(CH05, "utf8");
  const start = text.indexOf("### Studi Supir Taksi London");
  expect(start).toBeGreaterThan(-1);
  const end = text.indexOf("\n### ", start + 1);
  return text.slice(start, end === -1 ? undefined : end);
}

describe("book neuroplastisitas-dalam-belajar", () => {
  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  // Maguire et al. (2000), PNAS 97(8): MRI grey-matter volume, not neuron birth.
  test("taxi study is not presented as evidence of new neurons", () => {
    const s = taxiSection();
    expect(s).not.toMatch(/bukti[^.]*neurogenesis/i);
    expect(s).not.toMatch(/memicu kelahiran/i);
    expect(s).toMatch(/volume/i);
  });

  test("taxi study keeps the hedge that neurogenesis is only a possible mechanism", () => {
    expect(taxiSection()).toMatch(/neurogenesis[^.]*mungkin/i);
  });

  test("no unsourced 25.000 jalan figure and no 'jauh lebih besar' overstatement", () => {
    const s = taxiSection();
    expect(s).not.toContain("25.000 jalan");
    expect(s).not.toContain("jauh lebih besar");
  });
});
