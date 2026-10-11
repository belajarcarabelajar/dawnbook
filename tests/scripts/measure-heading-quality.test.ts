import { describe, expect, it } from "bun:test";
import {
  measureHeadings,
  formatMeasurement,
  type FilePair,
} from "../../scripts/measure-heading-quality";

// Builds one chapter whose body headings are rewritten from `old` to `next`, same line positions.
function chapter(name: string, pairs: [string, string][]): FilePair {
  const head = "# Judul Bab\n\n";
  return {
    file: `books/x/src/content/${name}`,
    oldText: head + pairs.map(([o]) => `## ${o}\n`).join("\n"),
    newText: head + pairs.map(([, n]) => `## ${n}\n`).join("\n"),
  };
}

describe("connector cap", () => {
  it("fails when one connector exceeds max(4, 15%) of rewritten headings", () => {
    const five = Array.from({ length: 5 }, (_, i) => [`Topik panjang sekali ${i}: Stres`, `Stres dengan ${i}`] as [string, string]);
    const m = measureHeadings([chapter("01_a.md", five)]);
    expect(m.rows).toHaveLength(5);
    expect(m.cap).toBe(4);
    expect(m.over).toEqual(["dengan"]);
    expect(m.fail).toBe(true);
  });

  it("passes when a connector is at the cap", () => {
    const four = Array.from({ length: 4 }, (_, i) => [`Topik panjang sekali ${i}: Stres`, `Stres dengan ${i}`] as [string, string]);
    const m = measureHeadings([chapter("01_a.md", four)]);
    expect(m.over).toEqual([]);
    expect(m.fail).toBe(false);
  });

  it("scales the cap to 15% for large batches", () => {
    const rows = Array.from({ length: 40 }, (_, i) => [`Topik panjang sekali ${i}: Stres`, `Stres ${i}`] as [string, string]);
    expect(measureHeadings([chapter("01_a.md", rows)]).cap).toBe(6);
  });
});

describe("length cap", () => {
  it("fails when more than 50% of new headings are longer than the old", () => {
    const m = measureHeadings([
      chapter("01_a.md", [
        ["A: b", "Aaaaaaaa bbbbbbb"],
        ["C: d", "Cccccccc ddddddd"],
        ["E: f", "Eeeeeeee fffffff"],
        ["Gggggggg: hhhhhhhhh", "Gggg"],
      ]),
    ]);
    expect(m.longerPct).toBe(75);
    expect(m.fail).toBe(true);
  });

  it("passes at exactly 50% longer", () => {
    const m = measureHeadings([
      chapter("01_a.md", [
        ["A: b", "Aaaaaaaa bbbbbbb"],
        ["C: d", "Cccccccc ddddddd"],
        ["Eeeeeeee: ffffffff", "Eeee"],
        ["Gggggggg: hhhhhhhhh", "Gggg"],
      ]),
    ]);
    expect(m.longerPct).toBe(50);
    expect(m.fail).toBe(false);
  });
});

describe("topic label", () => {
  const old = "# 1. Metakognisi Dasar: Apa Itu\n\nIsi.\n";

  it("fails when a chapter title drops the topic named by the old label", () => {
    const m = measureHeadings([
      { file: "books/x/src/content/01_a.md", oldText: old, newText: "# Cara Berpikir Sehari\n\nIsi.\n" },
    ]);
    expect(m.lost).toHaveLength(1);
    expect(m.fail).toBe(true);
    expect(formatMeasurement(m).trimEnd().split("\n").at(-1)).toBe("RULER: FAIL");
  });

  it("passes when the new title keeps the label words", () => {
    const m = measureHeadings([
      { file: "books/x/src/content/01_a.md", oldText: old, newText: "# Metakognisi Dasar Itu Apa\n\nIsi.\n" },
    ]);
    expect(m.lost).toEqual([]);
    expect(m.fail).toBe(false);
    expect(formatMeasurement(m).trimEnd().split("\n").at(-1)).toBe("RULER: PASS");
  });

  it("checks SUMMARY entries as chapter titles", () => {
    const m = measureHeadings([
      {
        file: "books/x/src/SUMMARY.md",
        oldText: "- [Metakognisi Dasar: Apa Itu](content/01_a.md)\n",
        newText: "- [Cara Berpikir Sehari](content/01_a.md)\n",
      },
    ]);
    expect(m.lost).toHaveLength(1);
  });
});
