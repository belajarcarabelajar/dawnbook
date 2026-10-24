import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Referensi chapters must not send readers to scans or lending copies of
// in-copyright books. An archive.org/details/<id> page is an Internet Archive
// item (a scan to borrow or download), so it is allowed only for works in the
// public domain, listed below with the reason. Link an in-copyright book to the
// publisher's page or a library catalogue record instead. Snapshots of web
// pages (web.archive.org/web/...) are a different service and are not checked.
// Added by Task U1 of plan 2026-10-24-dawnbook-attribution-fixes.
// Each entry: [item id, reason it is public domain], e.g. "published in 1930 or
// earlier (US)" or the public-domain statement on the item page. Empty as of
// 2026-10-24: Krom 1920 is public domain, but its old item id
// (beschrijvingvanb01krom) no longer exists on archive.org, so it now links to
// a catalogue record instead.
const ALLOWLIST: ReadonlyMap<string, string> = new Map<string, string>([]);

const BOOKS_DIR = path.resolve(import.meta.dir, "../../books");

function lastChapter(slug: string): string | null {
  const summary = path.join(BOOKS_DIR, slug, "src", "SUMMARY.md");
  if (!existsSync(summary)) return null;
  const targets = [...readFileSync(summary, "utf8").matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1]);
  return targets.at(-1) ?? null;
}

function offendingLinks(): string[] {
  const slugs = readdirSync(BOOKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
  const out: string[] = [];
  for (const slug of slugs) {
    const last = lastChapter(slug);
    if (!last) continue;
    const file = path.join(BOOKS_DIR, slug, "src", last);
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/(?<![\w.])(?:www\.)?archive\.org\/details\/([^\s)\]/?#]+)/g)) {
        if (!ALLOWLIST.has(m[1])) out.push(`${slug}/src/${last}:${i + 1} ${m[1]}`);
      }
    });
  }
  return out;
}

describe("Referensi links", () => {
  test("archive.org/details links point only to public-domain works", () => {
    expect(offendingLinks()).toEqual([]);
  });

  test("every allowlist entry states why the work is public domain", () => {
    for (const [id, reason] of ALLOWLIST) {
      expect(reason.length, id).toBeGreaterThan(20);
    }
  });
});
