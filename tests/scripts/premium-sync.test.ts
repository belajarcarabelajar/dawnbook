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
  test("reports a premium slug without index.html and not one with it", () => {
    const out = join(ROOT, "output");
    write(join(out, "books/ada/index.html"), "<html></html>");
    mkdirSync(join(out, "books/kosong"), { recursive: true });

    expect(checkPremiumOutput(out, ["ada", "kosong", "hilang"])).toEqual(["kosong", "hilang"]);
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

  test("exits 0 with an empty registry", () => {
    const r = run([]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toString()).toContain("no premium books registered");
  });

  test("exits 2 for a --slug that is not in the registry", () => {
    const r = run(["--slug", "not-registered"]);
    expect(r.exitCode).toBe(2);
  });
});
