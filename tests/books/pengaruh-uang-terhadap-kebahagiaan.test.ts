import { describe, expect, test } from "bun:test";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";
import { checkVoice } from "../../scripts/check-voice";

const BOOK = path.resolve(import.meta.dir, "../../books/pengaruh-uang-terhadap-kebahagiaan");

describe("book pengaruh-uang-terhadap-kebahagiaan", () => {
  test("has 11 content chapters plus Referensi with no structural problems", () => {
    const result = checkBookStructure(BOOK);
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(12);
  });

  // GEMINI.md section 29: the shared voice caps hold in all 11 content chapters.
  test("all 11 content chapters pass the voice caps", () => {
    expect(checkVoice(BOOK)).toEqual({ chapters: 11, problems: [] });
  });
});
