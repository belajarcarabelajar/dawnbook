import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

// Regression guard for the 2026-10-24 batch audit fixes (plan 2026-10-25-dawnbook-audit-fixes, task T9).
// `o` is a text the fixes removed: it must not come back. `n` is a fixed text that still contains the old
// wording, so the fixed text itself must still be there. When a chapter is rewritten on purpose, update the data file.
type Entry = { f: string; o?: string; n?: string };
const ROOT = path.resolve(import.meta.dir, "../..");
const data = JSON.parse(readFileSync(path.join(import.meta.dir, "audit-fixes-2026-10-24.data.json"), "utf8")) as {
  books: Record<string, Entry[]>;
};
const cache = new Map<string, string>();
function read(rel: string): string {
  let text = cache.get(rel);
  if (text === undefined) {
    text = readFileSync(path.join(ROOT, rel), "utf8");
    cache.set(rel, text);
  }
  return text;
}

describe("audit fixes of 2026-10-24 stay applied", () => {
  for (const [book, entries] of Object.entries(data.books)) {
    test(`${book}: no fixed text comes back`, () => {
      const problems: string[] = [];
      for (const e of entries) {
        const text = read(e.f);
        if (e.o !== undefined && text.includes(e.o)) problems.push(`${e.f}: old text is back: ${e.o.slice(0, 80)}`);
        if (e.n !== undefined && !text.includes(e.n)) problems.push(`${e.f}: fixed text is missing: ${e.n.slice(0, 80)}`);
      }
      expect(problems).toEqual([]);
    });
  }
});
