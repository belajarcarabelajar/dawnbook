import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Every book credits its sources: the last chapter in SUMMARY.md is a Referensi
// chapter (file name contains "referensi") that holds at least one link
// (GEMINI.md section 15). Added after the 2026-10-24 attribution audit.
const BOOKS_DIR = path.resolve(import.meta.dir, "../../books");

function lastChapter(slug: string): string | null {
  const summary = path.join(BOOKS_DIR, slug, "src", "SUMMARY.md");
  if (!existsSync(summary)) return null;
  const targets = [...readFileSync(summary, "utf8").matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1]);
  return targets.at(-1) ?? null;
}

function booksWithoutReferensi(): string[] {
  const slugs = readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .filter((slug) => existsSync(path.join(BOOKS_DIR, slug, "src", "SUMMARY.md")));
  return slugs
    .filter((slug) => {
      const last = lastChapter(slug);
      if (!last || !/referensi/i.test(path.basename(last))) return true;
      const file = path.join(BOOKS_DIR, slug, "src", last);
      return !existsSync(file) || !/https?:\/\//.test(readFileSync(file, "utf8"));
    })
    .sort();
}

describe("Referensi chapter in every book", () => {
  test("every book ends in a Referensi chapter with at least one link", () => {
    expect(booksWithoutReferensi()).toEqual([]);
  });
});
