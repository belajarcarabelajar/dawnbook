import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { runStructureGate } from "../../scripts/check-book-structure";
import { main as headingColonsMain } from "../../scripts/check-heading-colons";
import { findRepeatedHeadings } from "../../scripts/check-repeated-headings";
import { runVoiceGate } from "../../scripts/check-voice";

// Both books are copies of the synthetic premium fixture, so they carry the same breaches:
// an em dash, an emoji, "Anda", a colon heading, "Kalau dipikir-pikir", a long opener and
// "Ringkasan" in all three chapters.
const FIXTURE = path.resolve(import.meta.dir, "../fixtures/premium/books/premium-bebas");
const ROOT = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch/premium-edition-gates-test");
const BOOKS = path.join(ROOT, "books");
const REVISED = "premium-edisi";
const VERBATIM = "premium-verbatim";

function copyBook(slug: string): void {
  const dir = path.join(BOOKS, slug);
  fs.cpSync(FIXTURE, dir, { recursive: true });
  const content = path.join(dir, "src/content");
  for (const name of fs.readdirSync(content)) {
    const file = path.join(content, name);
    // The copy-rules check refuses a committed U+2014, so the fixture holds tokens.
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf-8").replaceAll("{{EM_DASH}}", "\u2014").replaceAll("{{EMOJI}}", "\u{1F642}"),
    );
  }
}

beforeAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
  copyBook(REVISED);
  copyBook(VERBATIM);
});
afterAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
});

let logSpy: ReturnType<typeof spyOn>;
beforeEach(() => {
  logSpy = spyOn(console, "log").mockImplementation(() => {});
  setPremiumRegistryForTest({
    [REVISED]: { products: [], productUrl: "", edition: 2026 },
    [VERBATIM]: { products: [], productUrl: "" },
  });
});
afterEach(() => {
  setPremiumRegistryForTest(null);
  logSpy.mockRestore();
});

const bookOf = (problems: string[], slug: string) => problems.filter((p) => p.startsWith(`${slug}/`));

describe("premium books with and without edition 2026", () => {
  test("structure gate checks the revised book and skips the verbatim one", () => {
    const { problems } = runStructureGate(BOOKS);
    const revised = bookOf(problems, REVISED).join("\n");
    expect(revised).toContain("02_dua.md:5: em dash");
    expect(revised).toContain("02_dua.md:5: emoji");
    expect(revised).toContain("03_tiga.md:5: formal pronoun Anda");
    expect(revised).toContain('heading "ringkasan" repeated');
    expect(bookOf(problems, VERBATIM)).toEqual([]);
  });

  test("voice gate checks the revised book and skips the verbatim one", () => {
    const { problems } = runVoiceGate(BOOKS);
    expect(bookOf(problems, REVISED)).toContain(`${REVISED}/01_satu.md: Kalau dipikir-pikir x1 (max 0)`);
    expect(bookOf(problems, VERBATIM)).toEqual([]);
  });

  test("heading-colon checker checks the revised book and skips the verbatim one", () => {
    expect(headingColonsMain(["--root", ROOT, "--books", REVISED])).toBe(1);
    expect(headingColonsMain(["--root", ROOT, "--books", VERBATIM])).toBe(0);
  });

  test("repeated-heading check reports the revised book only", () => {
    expect(findRepeatedHeadings(ROOT).map((r) => [r.slug, r.heading])).toEqual([[REVISED, "ringkasan"]]);
  });
});
