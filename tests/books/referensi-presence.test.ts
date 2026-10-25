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

// A citation item is a list item with a year (or n.d./t.t.) in parentheses; each one must
// carry its own link (GEMINI.md section 15, no plain-text citations). Added by plan
// 2026-10-25-dawnbook-later-backlog after 32 such items were found without a link.
function citationsWithoutLink(): string[] {
  const out: string[] = [];
  const slugs = readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
  for (const slug of slugs) {
    const last = lastChapter(slug);
    if (!last || !/referensi/i.test(path.basename(last))) continue;
    const file = path.join(BOOKS_DIR, slug, "src", last);
    if (!existsSync(file)) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (/^\s*([-*]|\d+\.)\s+\S/.test(line) && /\((\d{4}|n\.d\.|t\.t\.)[a-z]?[,)]/.test(line) && !/https?:\/\//.test(line)) {
          out.push(`${slug}/${last}:${i + 1}`);
        }
      });
  }
  return out;
}

describe("Referensi chapter in every book", () => {
  test("every book ends in a Referensi chapter with at least one link", () => {
    expect(booksWithoutReferensi()).toEqual([]);
  });

  test("every citation item in a Referensi chapter carries a link", () => {
    expect(citationsWithoutLink()).toEqual([]);
  });
});
