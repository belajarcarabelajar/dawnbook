import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, spyOn, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { checkBookStructure, runStructureGate } from "../../scripts/check-book-structure";
import { main as headingColonsMain } from "../../scripts/check-heading-colons";
import { findRepeatedHeadings } from "../../scripts/check-repeated-headings";
import { runVoiceGate } from "../../scripts/check-voice";

const FIXTURE = path.resolve(import.meta.dir, "../fixtures/premium");
// The copy-rules check refuses a committed U+2014, so the fixture holds a token and the test
// writes the real character into a scratch copy that the gates read.
const ROOT = path.join(os.homedir(), ".cache/tmp/dawnbook-scratch/premium-gates-test");
const BOOKS = path.join(ROOT, "books");
const EM_DASH_TOKEN = "{{EM_DASH}}";
const EMOJI_TOKEN = "{{EMOJI}}";

function copyWithEmDash(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) copyWithEmDash(full);
    else if (entry.name.endsWith(".md")) {
      fs.writeFileSync(full, fs.readFileSync(full, "utf-8").replaceAll(EM_DASH_TOKEN, "\u2014").replaceAll(EMOJI_TOKEN, "\u{1F642}"));
    }
  }
}

beforeAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
  fs.cpSync(FIXTURE, ROOT, { recursive: true });
  copyWithEmDash(ROOT);
});
afterAll(() => {
  fs.rmSync(ROOT, { recursive: true, force: true });
});
const FREE_OK = "premium-bebas";
const BROKEN = "premium-rusak";
const FREE_IMAGES = "gratis-gambar";

function markPremium(...slugs: string[]): void {
  setPremiumRegistryForTest(Object.fromEntries(slugs.map((s) => [s, { products: [], productUrl: "" }])));
}

const bookOf = (problems: string[], slug: string) => problems.filter((p) => p.startsWith(`${slug}/`));

let logSpy: ReturnType<typeof spyOn>;
beforeEach(() => {
  logSpy = spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  setPremiumRegistryForTest(null);
  logSpy.mockRestore();
});

describe("premium book with house-rule breaches", () => {
  test("the scratch copy carries a real em dash and no token", () => {
    const md = fs.readFileSync(path.join(BOOKS, FREE_OK, "src/content/02_dua.md"), "utf-8");
    expect(md).toContain("\u2014");
    expect(md).not.toContain(EM_DASH_TOKEN);
  });

  test("structure passes when marked premium", () => {
    expect(checkBookStructure(path.join(BOOKS, FREE_OK), { premium: true })).toEqual({ chapters: 3, problems: [] });
  });

  test("structure fails the content rules when not premium", () => {
    const { problems } = checkBookStructure(path.join(BOOKS, FREE_OK));
    const text = problems.join("\n");
    expect(text).toContain("02_dua.md:5: em dash");
    expect(text).toContain("02_dua.md:5: emoji");
    expect(text).toContain("03_tiga.md:5: formal pronoun Anda");
    expect(text).toContain("01_satu.md: opener's first sentence would be truncated");
    expect(text).toContain('heading "ringkasan" repeated');
    expect(text).not.toContain("link target");
  });

  test("structure gate reads the registry", () => {
    markPremium(FREE_OK, BROKEN);
    expect(bookOf(runStructureGate(BOOKS).problems, FREE_OK)).toEqual([]);
    setPremiumRegistryForTest(null);
    expect(bookOf(runStructureGate(BOOKS).problems, FREE_OK).length).toBeGreaterThan(0);
  });

  test("voice gate skips it when premium and flags it otherwise", () => {
    expect(bookOf(runVoiceGate(BOOKS).problems, FREE_OK)).toContain(`${FREE_OK}/01_satu.md: Kalau dipikir-pikir x1 (max 0)`);
    markPremium(FREE_OK);
    expect(bookOf(runVoiceGate(BOOKS).problems, FREE_OK)).toEqual([]);
  });

  test("heading-colon checker skips it when premium and flags it otherwise", () => {
    expect(headingColonsMain(["--root", ROOT, "--books", FREE_OK])).toBe(1);
    markPremium(FREE_OK);
    expect(headingColonsMain(["--root", ROOT, "--books", FREE_OK])).toBe(0);
    expect(headingColonsMain(["--root", ROOT, "--books", FREE_IMAGES])).toBe(0);
  });

  test("repeated-heading check skips it when premium and flags it otherwise", () => {
    expect(findRepeatedHeadings(ROOT).map((r) => [r.slug, r.heading])).toEqual([[FREE_OK, "ringkasan"]]);
    markPremium(FREE_OK);
    expect(findRepeatedHeadings(ROOT)).toEqual([]);
  });
});

describe("premium book with technical problems", () => {
  test("still fails the technical rules", () => {
    const { problems } = checkBookStructure(path.join(BOOKS, BROKEN), { premium: true });
    expect(problems).toEqual([
      "book.toml: description is 90 characters, outside the 100 to 160 range",
      '01_satu.md: first heading "Judul di Bab" differs from SUMMARY title "Judul di Daftar"',
      '01_satu.md:5: link target "02_tidak-ada.md" is not an http(s) URL, an in-page anchor or a chapter file of the book',
      '01_satu.md:7: link target "../images/public/hilang.png" is not an http(s) URL, an in-page anchor or a chapter file of the book',
    ]);
  });
});

describe("images in free books", () => {
  test("an existing image passes and a missing one fails", () => {
    expect(checkBookStructure(path.join(BOOKS, FREE_IMAGES)).problems).toEqual([
      '01_satu.md:7: link target "../images/hilang.png" is not an http(s) URL, an in-page anchor or a chapter file of the book',
    ]);
  });
});

describe("link schemes", () => {
  // Kept outside ROOT/books so the library-wide gate tests above never see this book.
  function linkBook(body: string): string {
    const dir = path.join(ROOT, "links", "tautan");
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, "src/content"), { recursive: true });
    fs.writeFileSync(path.join(dir, "src/SUMMARY.md"), "# Summary\n\n- [Bab Tautan](content/01_satu.md)\n");
    fs.writeFileSync(
      path.join(dir, "src/content/01_satu.md"),
      `## Bab Tautan\n\nBab ini berisi teks sintetis yang cukup panjang untuk menjadi pembuka yang wajar bagi pembaca uji coba ini.\n\n${body}\n`,
    );
    return dir;
  }

  test("a mailto link with a plausible address passes", () => {
    expect(checkBookStructure(linkBook("Tulis ke [redaksi](mailto:redaksi@contoh.id).")).problems).toEqual([]);
  });

  test("javascript, file, data and a mailto without an address still fail", () => {
    const targets = ["javascript:alert(1)", "file:///etc/passwd", "data:text/html,x", "mailto:redaksi"];
    const { problems } = checkBookStructure(linkBook(targets.map((t) => `[x](${t})`).join("\n\n")));
    expect(problems.map((p) => /link target "([^"]*)"/.exec(p)?.[1])).toEqual(targets);
  });
});
