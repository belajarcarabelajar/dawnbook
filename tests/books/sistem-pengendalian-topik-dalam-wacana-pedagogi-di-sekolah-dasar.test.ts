import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkBookStructure } from "../../scripts/check-book-structure";

const SLUG = "sistem-pengendalian-topik-dalam-wacana-pedagogi-di-sekolah-dasar";
const BOOK = path.resolve(import.meta.dir, "../../books", SLUG);
const CONTENT = path.join(BOOK, "src/content");
const chapters = readdirSync(CONTENT).filter((f) => f.endsWith(".md")).sort();
const read = (file: string) => readFileSync(path.join(CONTENT, file), "utf8");

// The book retells Marliana (2017), whose title it shares; it must never pass
// that study off as its own research.
const OWNERSHIP = /penelitian ini|studi ini|temuan utama/i;

describe(`book ${SLUG}`, () => {
  test("has no structural problems", () => {
    expect(checkBookStructure(BOOK).problems).toEqual([]);
  });

  test("the first chapter and the methodology chapter credit Marliana", () => {
    const first = chapters[0];
    const method = chapters.find((f) => f.startsWith("03_"));
    expect(method).toBeDefined();
    expect(read(first)).toContain("Marliana");
    expect(read(method as string)).toContain("Marliana");
  });

  test("no sentence claims the research as the book's own", () => {
    const offenders: string[] = [];
    for (const file of chapters) {
      read(file)
        .split("\n")
        .forEach((line, i) => {
          for (const sentence of line.split(/(?<=[.!?])\s+/)) {
            if (OWNERSHIP.test(sentence) && !sentence.includes("Marliana")) {
              offenders.push(`${file}:${i + 1}: ${sentence.trim()}`);
            }
          }
        });
    }
    expect(offenders).toEqual([]);
  });
});
