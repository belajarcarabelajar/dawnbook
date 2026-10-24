import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { checkBookStructure, extractUrls } from "../../scripts/check-book-structure";
import { checkVoice } from "../../scripts/check-voice";
import { contentFiles, sourceTableSection, sourceTableUrls } from "../helpers/book-test";

const ROOT = path.resolve(import.meta.dir, "../..");
const BOOK = path.join(ROOT, "books/soft-power-jepang-lewat-manga-dan-anime");
const NOTES = path.join(ROOT, "docs/code-plan/plans/research-soft-power-jepang-lewat-manga-dan-anime.md");

describe("book soft-power-jepang-lewat-manga-dan-anime", () => {
  test("has 12 content chapters plus Referensi with no structural problems", () => {
    const result = checkBookStructure(BOOK);
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(13);
    expect(contentFiles(BOOK).at(-1)).toBe("13_referensi.md");
  });

  test("every chapter stays inside the house byte budget", () => {
    const files = contentFiles(BOOK);
    expect(files.length).toBe(13);
    for (const f of files) {
      const size = fs.statSync(path.join(BOOK, "src/content", f)).size;
      const isRef = f === "13_referensi.md";
      const max = isRef ? 12000 : 9000;
      const min = isRef ? 3000 : 5500;
      expect({ f, ok: size >= min && size <= max }).toEqual({ f, ok: true });
    }
  });

  test("source table allowlist ignores URLs mentioned only in prose", () => {
    const notes = [
      "## 8. Prose",
      "See https://example.com/prose-only for context.",
      "",
      "## 9. Source table (only these URLs)",
      "",
      "| ID | Source | URL |",
      "|---|---|---|",
      "| A1 | First | https://example.com/a1 |",
      "| B2 | Second | https://example.com/b2 |",
      "",
      "Footnote mentioning https://example.com/after-table in prose.",
      "",
      "## 10. Later",
      "| Z9 | Out of section | https://example.com/z9 |",
    ].join("\n");
    expect(sourceTableUrls(notes).sort()).toEqual(["https://example.com/a1", "https://example.com/b2"]);
  });

  test("source table allowlist has one URL per data row of the real notes table", () => {
    const notes = fs.readFileSync(NOTES, "utf-8");
    const dataRows = sourceTableSection(notes).filter((l) => /^\| [A-Z][0-9a-z]* \|/.test(l)).length;
    expect(dataRows).toBe(71);
    expect(new Set(sourceTableUrls(notes)).size).toBe(dataRows);
  });

  test("every URL in the book comes from the research notes source table", () => {
    const allowed = new Set(sourceTableUrls(fs.readFileSync(NOTES, "utf-8")));
    const used = contentFiles(BOOK).flatMap((f) => extractUrls(fs.readFileSync(path.join(BOOK, "src/content", f), "utf-8")));
    expect(used.length).toBeGreaterThan(20);
    expect(used.filter((u) => !allowed.has(u))).toEqual([]);
  });

  // GEMINI.md section 29: the shared voice caps hold in all 12 content chapters.
  test("all 12 content chapters pass the voice caps", () => {
    expect(checkVoice(BOOK)).toEqual({ chapters: 12, problems: [] });
  });
});
