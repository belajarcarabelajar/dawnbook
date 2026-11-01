import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { type PremiumEntry, setPremiumRegistryForTest } from "../../functions/lib/premium";
import { type Deps, main, type Runner } from "../../scripts/premium/release-pdfs";

const BUCKET = "bcb-admin-media";
const PRINT_SCRIPT = "scripts/premium/print-pdf.ts";

let root: string;

beforeEach(() => {
  root = fs.mkdtempSync(path.join("/tmp", "release-pdfs-test-"));
  fs.mkdirSync(path.join(root, "books"));
  fs.mkdirSync(path.join(root, "tmp"));
});

afterEach(() => {
  setPremiumRegistryForTest(null);
  fs.rmSync(root, { recursive: true, force: true });
});

const booksDir = () => path.join(root, "books");
const tmpRoot = () => path.join(root, "tmp");

function entry(edition?: 2026): PremiumEntry {
  return { products: ["P-test"], productUrl: "https://example.com/p", ...(edition ? { edition } : {}) };
}

function book(slug: string, files: { cover?: boolean; printJson?: string } = {}) {
  const dir = path.join(booksDir(), slug);
  fs.mkdirSync(dir, { recursive: true });
  if (files.cover !== false) fs.writeFileSync(path.join(dir, "print-cover.svg"), "<svg/>");
  if (files.printJson !== undefined) fs.writeFileSync(path.join(dir, "print.json"), files.printJson);
}

function fakePdf(slug: string): Uint8Array {
  return new TextEncoder().encode(`%PDF-1.7\n% fake print of ${slug}\n`);
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function argAfter(cmd: string[], flag: string): string | undefined {
  const i = cmd.indexOf(flag);
  return i < 0 ? undefined : cmd[i + 1];
}

function printSlug(cmd: string[]): string | undefined {
  const i = cmd.findIndex((c) => c.endsWith(PRINT_SCRIPT));
  return i < 0 ? undefined : cmd[i + 1];
}

interface Fake {
  calls: string[][];
  bucket: Map<string, Uint8Array>;
  out: string[];
  err: string[];
  run: Runner;
}

// Stands in for print-pdf (writes a small PDF to --out) and for cf r2 (an in-memory bucket),
// so no browser, bun subprocess or network runs in a test.
function makeFake(
  opts: { failPrint?: string[]; printWrites?: Record<string, string | null>; failPut?: string[]; corruptGet?: string[] } = {},
): Fake {
  const enc = new TextEncoder();
  const fake: Fake = { calls: [], bucket: new Map(), out: [], err: [], run: () => ({ exitCode: 1, stdout: new Uint8Array(), stderr: "" }) };
  fake.run = (cmd) => {
    fake.calls.push([...cmd]);
    const slug = printSlug(cmd);
    if (slug !== undefined) {
      if (opts.failPrint?.includes(slug)) {
        return { exitCode: 1, stdout: new Uint8Array(), stderr: "print-pdf: mdbook build failed (exit 1)" };
      }
      const written = opts.printWrites && slug in opts.printWrites ? opts.printWrites[slug] : fakePdf(slug);
      if (written !== null && written !== undefined) fs.writeFileSync(argAfter(cmd, "--out")!, written);
      return { exitCode: 0, stdout: enc.encode(`print-pdf: wrote ${argAfter(cmd, "--out")}: 3 pages\n`), stderr: "" };
    }
    if (cmd[0] === "cf" && cmd[3] === "put") {
      if (opts.failPut?.some((s) => cmd[4] === `member/${s}.pdf`)) {
        return { exitCode: 1, stdout: new Uint8Array(), stderr: "upload refused" };
      }
      fake.bucket.set(cmd[4]!, new Uint8Array(fs.readFileSync(argAfter(cmd, "--file")!)));
      return { exitCode: 0, stdout: enc.encode("{}"), stderr: "" };
    }
    if (cmd[0] === "cf" && cmd[3] === "get") {
      const body = fake.bucket.get(cmd[4]!);
      if (body === undefined) return { exitCode: 1, stdout: new Uint8Array(), stderr: "object not found" };
      const corrupt = opts.corruptGet?.some((s) => cmd[4] === `member/${s}.pdf`);
      return { exitCode: 0, stdout: corrupt ? Uint8Array.from([...body, 0x0a]) : body, stderr: "" };
    }
    return { exitCode: 127, stdout: new Uint8Array(), stderr: `unexpected command: ${cmd.join(" ")}` };
  };
  return fake;
}

function deps(fake: Fake): Deps {
  return {
    run: fake.run,
    tmpRoot: tmpRoot(),
    bun: "bun",
    log: (line) => fake.out.push(line),
    error: (line) => fake.err.push(line),
  };
}

function cfCalls(fake: Fake): string[][] {
  return fake.calls.filter((cmd) => cmd[0] === "cf");
}

function printCalls(fake: Fake): string[][] {
  return fake.calls.filter((cmd) => printSlug(cmd) !== undefined);
}

// The summary line printed for a book at the end of the run ("release-pdfs: <slug>: ...").
function summary(fake: Fake, slug: string): string | undefined {
  return fake.out.filter((l) => l.startsWith(`release-pdfs: ${slug}: `)).at(-1);
}

describe("release-pdfs", () => {
  test("prints each revised premium book with its cover and the copy restriction, uploads it to member/<slug>.pdf and checks the stored copy", () => {
    book("book-a");
    book("book-b");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026) });
    const fake = makeFake();

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(0);

    const prints = printCalls(fake);
    expect(prints.map((cmd) => printSlug(cmd))).toEqual(["book-a", "book-b"]);
    for (const cmd of prints) {
      const slug = printSlug(cmd)!;
      expect(argAfter(cmd, "--books-dir")).toBe(booksDir());
      expect(argAfter(cmd, "--cover")).toBe(path.join(booksDir(), slug, "print-cover.svg"));
      expect(cmd).toContain("--restrict");
      expect(argAfter(cmd, "--out")).toEndWith(".pdf");
    }
    const [outA, outB] = prints.map((cmd) => argAfter(cmd, "--out")!);
    expect(cfCalls(fake)).toEqual([
      ["cf", "r2", "objects", "put", "member/book-a.pdf", "--bucket-name", BUCKET, "--file", outA!, "--content-type", "application/pdf"],
      ["cf", "r2", "objects", "get", "member/book-a.pdf", "--bucket-name", BUCKET],
      ["cf", "r2", "objects", "put", "member/book-b.pdf", "--bucket-name", BUCKET, "--file", outB!, "--content-type", "application/pdf"],
      ["cf", "r2", "objects", "get", "member/book-b.pdf", "--bucket-name", BUCKET],
    ]);
    expect([...fake.bucket.keys()]).toEqual(["member/book-a.pdf", "member/book-b.pdf"]);
    expect(summary(fake, "book-a")).toBe(`release-pdfs: book-a: ok, member/book-a.pdf sha256 ${sha256(fakePdf("book-a"))}`);
    expect(summary(fake, "book-b")).toBe(`release-pdfs: book-b: ok, member/book-b.pdf sha256 ${sha256(fakePdf("book-b"))}`);
  });

  test("a stored copy whose sha256 differs from the printed PDF fails that book and the run exits 1", () => {
    book("book-a");
    book("book-b");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026) });
    const fake = makeFake({ corruptGet: ["book-a"] });

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(summary(fake, "book-a")).toStartWith("release-pdfs: book-a: failed: sha256 mismatch");
    expect(summary(fake, "book-b")).toStartWith("release-pdfs: book-b: ok");
  });

  test("a failed print does not stop the next book, and the failed book is never uploaded", () => {
    book("book-a");
    book("book-b");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026) });
    const fake = makeFake({ failPrint: ["book-a"] });

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(printCalls(fake).map((cmd) => printSlug(cmd))).toEqual(["book-a", "book-b"]);
    expect(cfCalls(fake).map((cmd) => `${cmd[3]} ${cmd[4]}`)).toEqual(["put member/book-b.pdf", "get member/book-b.pdf"]);
    expect(summary(fake, "book-a")).toBe("release-pdfs: book-a: failed: print-pdf exited 1");
    expect(summary(fake, "book-b")).toStartWith("release-pdfs: book-b: ok");
  });

  test("a print that exits 0 but leaves no PDF, or a file that is not a PDF, fails that book and is never uploaded", () => {
    book("book-a");
    book("book-b");
    book("book-c");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026), "book-c": entry(2026) });
    const fake = makeFake({ printWrites: { "book-a": null, "book-b": "<html>Your file couldn't be accessed</html>" } });

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(cfCalls(fake).map((cmd) => `${cmd[3]} ${cmd[4]}`)).toEqual(["put member/book-c.pdf", "get member/book-c.pdf"]);
    expect(summary(fake, "book-a")).toBe("release-pdfs: book-a: failed: print-pdf wrote no PDF");
    expect(summary(fake, "book-b")).toBe("release-pdfs: book-b: failed: print-pdf wrote no PDF");
    expect(summary(fake, "book-c")).toStartWith("release-pdfs: book-c: ok");
  });

  test("skips a premium book without edition 2026 or without print-cover.svg and releases the others", () => {
    book("revised");
    book("verbatim");
    book("no-cover", { cover: false });
    setPremiumRegistryForTest({ revised: entry(2026), verbatim: entry(), "no-cover": entry(2026) });
    const fake = makeFake();

    // A revised book without its cover fails the run, so a deploy never leaves its PDF stale silently.
    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(printCalls(fake).map((cmd) => printSlug(cmd))).toEqual(["revised"]);
    expect(cfCalls(fake).map((cmd) => cmd[4])).toEqual(["member/revised.pdf", "member/revised.pdf"]);
    expect(summary(fake, "verbatim")).toBe("release-pdfs: verbatim: skipped: not edition 2026");
    expect(summary(fake, "no-cover")).toBe("release-pdfs: no-cover: failed: no print-cover.svg");
  });

  test("passes every image named in print.json to print-pdf as --hide-image", () => {
    book("book-a", { printJson: JSON.stringify({ hideImages: ["lancar-nugas-sampul.png", "logo.png"] }) });
    setPremiumRegistryForTest({ "book-a": entry(2026) });
    const fake = makeFake();

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(0);

    const cmd = printCalls(fake)[0]!;
    expect(cmd.flatMap((arg, i) => (arg === "--hide-image" ? [cmd[i + 1]] : []))).toEqual([
      "lancar-nugas-sampul.png",
      "logo.png",
    ]);
  });

  test("a print.json that is not valid JSON or has no list of names fails that book before printing it", () => {
    book("book-a", { printJson: "{not json" });
    book("book-b", { printJson: JSON.stringify({ hideImages: "logo.png" }) });
    book("book-c");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026), "book-c": entry(2026) });
    const fake = makeFake();

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(printCalls(fake).map((cmd) => printSlug(cmd))).toEqual(["book-c"]);
    expect(summary(fake, "book-a")).toStartWith("release-pdfs: book-a: failed: print.json");
    expect(summary(fake, "book-b")).toStartWith("release-pdfs: book-b: failed: print.json");
    expect(summary(fake, "book-c")).toStartWith("release-pdfs: book-c: ok");
  });

  test("a usage error exits 2 and runs nothing", () => {
    book("book-a");
    setPremiumRegistryForTest({ "book-a": entry(2026) });
    for (const argv of [["--bogus"], ["--books-dir"], ["--books-dir", "--dry-run"], ["book-a"]]) {
      const fake = makeFake();
      expect({ argv, code: main(argv, deps(fake)), calls: fake.calls }).toEqual({ argv, code: 2, calls: [] });
    }
  });

  test("a --books-dir that does not exist fails the run instead of skipping every book", () => {
    setPremiumRegistryForTest({ "book-a": entry(2026) });
    const fake = makeFake();

    expect(main(["--books-dir", path.join(root, "missing")], deps(fake))).toBe(1);

    expect(fake.calls).toEqual([]);
  });

  test("removes its temp files at the end, also when a book failed", () => {
    book("book-a");
    book("book-b");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026) });
    const fake = makeFake({ failPut: ["book-b"] });

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(printCalls(fake)).toHaveLength(2);
    expect(fs.readdirSync(tmpRoot())).toEqual([]);
  });

  test("--dry-run prints and checks every book but issues no cf command", () => {
    book("book-a");
    book("book-b");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026) });
    const fake = makeFake();

    expect(main(["--books-dir", booksDir(), "--dry-run"], deps(fake))).toBe(0);

    expect(printCalls(fake).map((cmd) => printSlug(cmd))).toEqual(["book-a", "book-b"]);
    expect(cfCalls(fake)).toEqual([]);
    expect(fake.bucket.size).toBe(0);
    expect(summary(fake, "book-a")).toBe(`release-pdfs: book-a: ok (dry run, not uploaded), sha256 ${sha256(fakePdf("book-a"))}`);
    expect(summary(fake, "book-b")).toBe(`release-pdfs: book-b: ok (dry run, not uploaded), sha256 ${sha256(fakePdf("book-b"))}`);
  });

  test("a failed upload fails that book without reading it back, and the next book still goes out", () => {
    book("book-a");
    book("book-b");
    setPremiumRegistryForTest({ "book-a": entry(2026), "book-b": entry(2026) });
    const fake = makeFake({ failPut: ["book-a"] });

    expect(main(["--books-dir", booksDir()], deps(fake))).toBe(1);

    expect(cfCalls(fake).map((cmd) => `${cmd[3]} ${cmd[4]}`)).toEqual([
      "put member/book-a.pdf",
      "put member/book-b.pdf",
      "get member/book-b.pdf",
    ]);
    expect(summary(fake, "book-a")).toBe("release-pdfs: book-a: failed: upload exited 1");
    expect(summary(fake, "book-b")).toStartWith("release-pdfs: book-b: ok");
  });
});
