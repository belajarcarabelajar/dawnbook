import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { syncPremiumBooks } from "../../scripts/premium-sync";
import { checkPremiumOutput } from "../../scripts/check-premium-output";

const ROOT = join(homedir(), ".cache/tmp/dawnbook-scratch/premium-sync-test");
const REPO = join(import.meta.dir, "../..");

let sourceDir: string;
let booksDir: string;

function write(path: string, text: string) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, text);
}

beforeEach(() => {
  rmSync(ROOT, { recursive: true, force: true });
  sourceDir = join(ROOT, "premium");
  booksDir = join(ROOT, "books");
  mkdirSync(join(sourceDir, "books"), { recursive: true });
  mkdirSync(booksDir, { recursive: true });
});

afterEach(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

const ignoredAll = () => true;

describe("syncPremiumBooks", () => {
  test("copies a book tree from the private checkout", () => {
    write(join(sourceDir, "books/rahasia/book.toml"), "[book]\n");
    write(join(sourceDir, "books/rahasia/src/content/01_awal.md"), "## Awal\n");

    const result = syncPremiumBooks({ sourceDir, booksDir, slugs: ["rahasia"], isIgnored: ignoredAll });

    expect(result).toEqual({ copied: ["rahasia"], skipped: [] });
    expect(readFileSync(join(booksDir, "rahasia/book.toml"), "utf8")).toBe("[book]\n");
    expect(readFileSync(join(booksDir, "rahasia/src/content/01_awal.md"), "utf8")).toBe("## Awal\n");
  });

  test("replaces the old copy, so a chapter removed upstream is gone", () => {
    write(join(sourceDir, "books/rahasia/src/content/01_awal.md"), "baru\n");
    write(join(booksDir, "rahasia/src/content/01_awal.md"), "lama\n");
    write(join(booksDir, "rahasia/src/content/02_dihapus.md"), "basi\n");

    syncPremiumBooks({ sourceDir, booksDir, slugs: ["rahasia"], isIgnored: ignoredAll });

    expect(readFileSync(join(booksDir, "rahasia/src/content/01_awal.md"), "utf8")).toBe("baru\n");
    expect(existsSync(join(booksDir, "rahasia/src/content/02_dihapus.md"))).toBe(false);
  });

  test("skips a slug whose source folder is missing", () => {
    const result = syncPremiumBooks({ sourceDir, booksDir, slugs: ["tidak-ada"], isIgnored: ignoredAll });

    expect(result).toEqual({ copied: [], skipped: ["tidak-ada"] });
    expect(existsSync(join(booksDir, "tidak-ada"))).toBe(false);
  });

  test("throws for a slug whose books folder is not git-ignored and copies nothing", () => {
    write(join(sourceDir, "books/rahasia/book.toml"), "[book]\n");
    const asked: string[] = [];

    expect(() =>
      syncPremiumBooks({
        sourceDir,
        booksDir,
        slugs: ["rahasia"],
        isIgnored: (p) => {
          asked.push(p);
          return false;
        },
      }),
    ).toThrow(/rahasia/);
    expect(asked).toEqual(["books/rahasia/"]);
    expect(existsSync(join(booksDir, "rahasia"))).toBe(false);
  });
});

describe("checkPremiumOutput", () => {
  let out: string;

  function book(slug: string, chapters: string[]) {
    write(join(out, `books/${slug}/index.html`), "<html></html>");
    for (const c of chapters) write(join(out, `books/${slug}/content/${c}`), "<html></html>");
  }

  function manifest(chapters: Record<string, string[]>) {
    write(join(out, "manifest.json"), JSON.stringify({ chapters }));
  }

  const firstOf = (slug: string, file: string) => [`/books/${slug}/content/${file}`];

  beforeEach(() => {
    out = join(ROOT, "output");
  });

  test("passes a complete build whose first chapter is free", () => {
    book("ada", ["01_awal.html", "02_lanjut.html"]);
    book("lama", ["chapter_1.html"]);
    manifest({ ada: firstOf("ada", "01_awal.html"), lama: firstOf("lama", "chapter_1.html") });

    expect(checkPremiumOutput(out, ["ada", "lama"])).toEqual([]);
  });

  test("checks nothing, not even the manifest, when no slug is registered", () => {
    expect(checkPremiumOutput(out, [])).toEqual([]);
  });

  test("reports a premium slug without index.html", () => {
    mkdirSync(join(out, "books/kosong"), { recursive: true });
    manifest({ kosong: firstOf("kosong", "01_awal.html") });

    const problems = checkPremiumOutput(out, ["kosong"]);
    expect(problems.some((p) => p.startsWith("kosong:") && p.includes("index.html"))).toBe(true);
  });

  test("reports a partial build with an index but no chapter html", () => {
    book("separuh", []);
    manifest({ separuh: firstOf("separuh", "01_awal.html") });

    const problems = checkPremiumOutput(out, ["separuh"]);
    expect(problems.length).toBeGreaterThan(0);
    expect(problems.every((p) => p.startsWith("separuh:"))).toBe(true);
    expect(problems.some((p) => p.includes("content/"))).toBe(true);
  });

  test("reports a first manifest chapter the middleware would not treat as free", () => {
    for (const file of ["010_awal.html", "chapter_10.html", "02_awal.html", "pengantar.html"]) {
      rmSync(out, { recursive: true, force: true });
      book("salah", [file]);
      manifest({ salah: firstOf("salah", file) });

      const problems = checkPremiumOutput(out, ["salah"]);
      expect(problems.some((p) => p.startsWith("salah:") && p.includes(file))).toBe(true);
    }
  });

  test("reports a slug that is missing from the manifest or a missing manifest", () => {
    book("ada", ["01_awal.html"]);
    expect(checkPremiumOutput(out, ["ada"]).some((p) => p.startsWith("ada:") && p.includes("manifest"))).toBe(true);

    manifest({});
    expect(checkPremiumOutput(out, ["ada"]).some((p) => p.startsWith("ada:") && p.includes("manifest"))).toBe(true);
  });
});

describe("premium-sync CLI", () => {
  function run(args: string[]) {
    const emptyDir = join(ROOT, "empty-premium");
    mkdirSync(emptyDir, { recursive: true });
    return Bun.spawnSync(["bun", "run", "scripts/premium-sync.ts", ...args], {
      cwd: REPO,
      env: { ...process.env, DAWNBOOK_PREMIUM_DIR: emptyDir },
      stdout: "pipe",
      stderr: "pipe",
    });
  }

  test("exits 0 and skips every registered book when the private source is missing", () => {
    const registered = Object.keys(JSON.parse(readFileSync(join(REPO, "data/premium-books.json"), "utf-8")).books);
    const r = run([]);
    expect(r.exitCode).toBe(0);
    const out = r.stdout.toString();
    if (registered.length === 0) expect(out).toContain("no premium books registered");
    for (const slug of registered) expect(out).toContain(`skipped ${slug} (source missing)`);
  });

  test("exits 2 for a --slug that is not in the registry", () => {
    const r = run(["--slug", "not-registered"]);
    expect(r.exitCode).toBe(2);
  });
});
