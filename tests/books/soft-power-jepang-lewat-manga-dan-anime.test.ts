import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { checkBookStructure, extractUrls } from "../../scripts/check-book-structure";

const ROOT = path.resolve(import.meta.dir, "../..");
const BOOK = path.join(ROOT, "books/soft-power-jepang-lewat-manga-dan-anime");
const NOTES = path.join(ROOT, "docs/code-plan/plans/research-soft-power-jepang-lewat-manga-dan-anime.md");

function contentFiles(): string[] {
  const dir = path.join(BOOK, "src/content");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];
}

describe("book soft-power-jepang-lewat-manga-dan-anime", () => {
  test("has 12 content chapters plus Referensi with no structural problems", () => {
    const result = checkBookStructure(BOOK);
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(13);
    expect(contentFiles().at(-1)).toBe("13_referensi.md");
  });

  test("every chapter stays inside the house byte budget", () => {
    const files = contentFiles();
    expect(files.length).toBe(13);
    for (const f of files) {
      const size = fs.statSync(path.join(BOOK, "src/content", f)).size;
      const isRef = f === "13_referensi.md";
      const max = isRef ? 12000 : 9000;
      const min = isRef ? 3000 : 5500;
      expect({ f, ok: size >= min && size <= max }).toEqual({ f, ok: true });
    }
  });

  test("every URL in the book comes from the research notes source table", () => {
    const allowed = new Set(extractUrls(fs.readFileSync(NOTES, "utf-8")));
    const used = contentFiles().flatMap((f) => extractUrls(fs.readFileSync(path.join(BOOK, "src/content", f), "utf-8")));
    expect(used.length).toBeGreaterThan(20);
    expect(used.filter((u) => !allowed.has(u))).toEqual([]);
  });
});
