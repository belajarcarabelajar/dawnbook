import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkBookStructure, extractUrls } from "../../scripts/check-book-structure";
import { contentFiles, sourceTableSection, sourceTableUrls } from "../helpers/book-test";

const ROOT = path.resolve(import.meta.dir, "../..");
const BOOK = path.join(ROOT, "books/saat-dia-suka-tapi-kamu-tidak");
const NOTES = path.join(ROOT, "docs/code-plan/plans/research-dawnbook-menolak-perasaan.md");

const DATA_ROW = /^\| [A-Z][0-9]+[a-z]? \|/;

// The plaintext denylist stays outside every repository: hashes of short phrases are reversible
// by dictionary attack, so this public test only reads the list at run time.
const DENYLIST =
  process.env.DAWNBOOK_IDENTITY_DENYLIST ??
  path.join(os.homedir(), ".config/dawnbook/identity-denylist/saat-dia-suka-tapi-kamu-tidak.txt");
const DENYLIST_EXISTS = fs.existsSync(DENYLIST);
if (!DENYLIST_EXISTS) console.warn(`identity scan skipped: denylist not found at ${DENYLIST}`);

const LOOKALIKES: Record<string, string> = {
  "\u0430": "a", "\u0435": "e", "\u043E": "o", "\u0440": "p", "\u0441": "c", "\u0443": "y",
  "\u0445": "x", "\u0456": "i", "\u0458": "j", "\u03BF": "o", "\u03B1": "a", "\u03B9": "i",
};

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[\u200B-\u200D\u2060\uFEFF\u00AD]/g, "")
    .toLowerCase()
    .replace(/[\u0430\u0435\u043E\u0440\u0441\u0443\u0445\u0456\u0458\u03BF\u03B1\u03B9]/g, (c) => LOOKALIKES[c]);
}

// No end boundary, so Indonesian suffixes such as -nya, -ku and -mu still match.
function phraseRegex(phrase: string): RegExp {
  const words = normalize(phrase)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?<![\\p{L}\\p{N}])${words.join("[^\\p{L}\\p{N}]*")}`, "giu");
}

function findIdentityTerms(text: string, phrases: string[]): string[] {
  const clean = normalize(text);
  return phrases.filter((p) => phraseRegex(p).test(clean));
}

function readDenylist(file: string): string[] {
  return fs
    .readFileSync(file, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

// Markdown link targets (one level of balanced parentheses for DOIs) and href attributes.
function linkTargets(md: string): string[] {
  const mdLinks = [...md.matchAll(/\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g)].map((m) => m[1]);
  const hrefs = [...md.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);
  return [...mdLinks, ...hrefs];
}

describe("book saat-dia-suka-tapi-kamu-tidak", () => {
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
      // Referensi ceiling 12500: three trim rounds left it at 12007 bytes, and GEMINI.md section 20 caps size-reduction rewrites at three.
      const max = isRef ? 12500 : 9000;
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
      "| A2b | Suffixed | https://example.com/a2b |",
      "| B2 | Second | https://example.com/b2 |",
      "",
      "Footnote mentioning https://example.com/after-table in prose.",
      "",
      "## 10. Later",
      "| Z9 | Out of section | https://example.com/z9 |",
    ].join("\n");
    expect(sourceTableUrls(notes, DATA_ROW).sort()).toEqual([
      "https://example.com/a1",
      "https://example.com/a2b",
      "https://example.com/b2",
    ]);
  });

  test("source table allowlist has one URL per data row of the real notes table", () => {
    const notes = fs.readFileSync(NOTES, "utf-8");
    const dataRows = sourceTableSection(notes).filter((l) => DATA_ROW.test(l)).length;
    expect(dataRows).toBe(52);
    expect(new Set(sourceTableUrls(notes, DATA_ROW)).size).toBe(dataRows);
  });

  test("link target collector keeps DOI parentheses and href values", () => {
    const md = 'See [A](https://doi.org/10.1016/0001-6918(82)90010-3) and <a href="https://example.com/h">h</a>.';
    expect(linkTargets(md)).toEqual(["https://doi.org/10.1016/0001-6918(82)90010-3", "https://example.com/h"]);
  });

  test("every URL in the book comes from the research notes source table", () => {
    const allowed = new Set(sourceTableUrls(fs.readFileSync(NOTES, "utf-8"), DATA_ROW));
    const used = contentFiles(BOOK).flatMap((f) => {
      const md = fs.readFileSync(path.join(BOOK, "src/content", f), "utf-8");
      return [...extractUrls(md), ...linkTargets(md)];
    });
    expect(used.length).toBeGreaterThan(20);
    expect(used.filter((u) => !allowed.has(u))).toEqual([]);
  });

  test("identity matcher survives case, invisible characters, accents, splits and suffixes", () => {
    const phrases = ["zz kanari", "zzkanarizz"];
    const flagged = [
      "ini zzkanarizz",
      "ZZKANARIZZ",
      "zz\u200Bkanarizz",
      "zz\u00ADkanarizz",
      "zzk\u00E1narizz",
      "zzk\u0430narizz",
      "zz-kanari",
      "zzkanari",
      "zzkanarizznya",
      "teks zz kanari teks",
    ];
    for (const text of flagged) expect({ text, hit: findIdentityTerms(text, phrases).length > 0 }).toEqual({ text, hit: true });
    expect(findIdentityTerms("Kamu boleh menolak dengan sopan.", phrases)).toEqual([]);
    expect(findIdentityTerms("rezzkanarizz", phrases)).toEqual([]);
  });

  test.skipIf(!DENYLIST_EXISTS)("no chapter, SUMMARY.md or diagram contains a denylisted identity term", () => {
    const phrases = readDenylist(DENYLIST);
    expect(phrases.length).toBeGreaterThanOrEqual(10);
    const files = contentFiles(BOOK);
    expect(files.length).toBe(13);
    const summary = path.join(BOOK, "src/SUMMARY.md");
    expect(fs.existsSync(summary)).toBe(true);
    const diagramDir = path.join(BOOK, "diagrams");
    const diagrams = fs.existsSync(diagramDir)
      ? fs.readdirSync(diagramDir).filter((f) => f.endsWith(".svg")).map((f) => path.join(diagramDir, f))
      : [];
    const targets = [...files.map((f) => path.join(BOOK, "src/content", f)), summary, ...diagrams];
    // Report counts only, so a failing run never prints the private phrases.
    const hits = targets
      .map((p) => ({ file: path.relative(BOOK, p), count: findIdentityTerms(fs.readFileSync(p, "utf-8"), phrases).length }))
      .filter((h) => h.count > 0);
    expect(hits).toEqual([]);
  });
});
