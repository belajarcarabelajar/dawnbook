import { describe, expect, it, afterEach } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findRepeatedHeadings, normalizeHeading } from "../../scripts/check-repeated-headings";

const roots: string[] = [];

function makeRoot(chapters: Record<string, string>, slug = "buku-uji"): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "repeated-headings-"));
  roots.push(root);
  const content = path.join(root, "books", slug, "src", "content");
  fs.mkdirSync(content, { recursive: true });
  fs.writeFileSync(path.join(root, "books", slug, "book.toml"), '[book]\ntitle = "Buku Uji"\n');
  for (const [name, body] of Object.entries(chapters)) fs.writeFileSync(path.join(content, name), body);
  return root;
}

afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

describe("normalizeHeading", () => {
  it("drops numbering, letter labels, escapes and case", () => {
    expect(normalizeHeading("3\\. Membangun Relasi")).toBe("membangun relasi");
    expect(normalizeHeading("B. Membangun Relasi")).toBe("membangun relasi");
    expect(normalizeHeading("Membangun   Relasi ")).toBe("membangun relasi");
  });
});

describe("findRepeatedHeadings", () => {
  const chapter = (h: string) => `# Bab\n\n## ${h}\n\nIsi.\n`;

  it("reports a heading that repeats in three chapters of one book", () => {
    const root = makeRoot({
      "01_a.md": chapter("Kesimpulan"),
      "02_b.md": chapter("1. Kesimpulan"),
      "03_c.md": chapter("Kesimpulan"),
      "04_d.md": chapter("Unik"),
    });
    const r = findRepeatedHeadings(root);
    expect(r).toEqual([{ slug: "buku-uji", heading: "kesimpulan", files: ["01_a.md", "02_b.md", "03_c.md"] }]);
  });

  it("ignores a heading that appears in only two chapters", () => {
    const root = makeRoot({ "01_a.md": chapter("Kesimpulan"), "02_b.md": chapter("Kesimpulan") });
    expect(findRepeatedHeadings(root)).toEqual([]);
  });

  it("counts chapters, not occurrences, so a repeat inside one chapter is fine", () => {
    const root = makeRoot({ "01_a.md": "# Bab\n\n## X\n\n## X\n\n## X\n" });
    expect(findRepeatedHeadings(root)).toEqual([]);
  });

  it("ignores headings inside fenced code", () => {
    const fenced = "# Bab\n\n```\n## Kesimpulan\n```\n";
    const root = makeRoot({ "01_a.md": fenced, "02_b.md": fenced, "03_c.md": fenced });
    expect(findRepeatedHeadings(root)).toEqual([]);
  });

  it("honors a custom minimum", () => {
    const root = makeRoot({ "01_a.md": chapter("Kesimpulan"), "02_b.md": chapter("Kesimpulan") });
    expect(findRepeatedHeadings(root, 2).length).toBe(1);
  });
});
