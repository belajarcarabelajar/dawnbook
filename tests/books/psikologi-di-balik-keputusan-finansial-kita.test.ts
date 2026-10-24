import { describe, expect, test } from "bun:test";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";
import { checkVoice } from "../../scripts/check-voice";

const BOOK = path.resolve(import.meta.dir, "../../books/psikologi-di-balik-keputusan-finansial-kita");

describe("book psikologi-di-balik-keputusan-finansial-kita", () => {
  test("has 12 content chapters plus Referensi with no structural problems", () => {
    const result = checkBookStructure(BOOK);
    expect(result.problems).toEqual([]);
    expect(result.chapters).toBe(13);
  });

  // GEMINI.md section 29: the shared voice caps hold in all 12 content chapters.
  test("all 12 content chapters pass the voice caps", () => {
    expect(checkVoice(BOOK)).toEqual({ chapters: 12, problems: [] });
  });
});
