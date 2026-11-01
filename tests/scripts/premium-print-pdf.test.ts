import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  chromiumArgs,
  injectA4,
  main,
  parseArgs,
  parsePdfInfo,
  pdfLooksBroken,
  type Runner,
} from "../../scripts/premium/print-pdf";

const A4_RULE = "<style>@page { size: A4; margin: 15mm; }</style>";

describe("injectA4", () => {
  test("inserts the A4 page rule right before </head>", () => {
    const out = injectA4("<html><head><title>x</title></head><body>b</body></html>");
    expect(out).toBe(`<html><head><title>x</title>${A4_RULE}</head><body>b</body></html>`);
  });

  test("is idempotent", () => {
    const once = injectA4("<head></head>");
    expect(injectA4(once)).toBe(once);
  });

  test("throws when the page has no </head>", () => {
    expect(() => injectA4("<html><body>no head</body></html>")).toThrow(/<\/head>/);
  });
});

describe("chromiumArgs", () => {
  test("prints the page headless to the given PDF without header or footer", () => {
    expect(chromiumArgs("/tmp/x/print.html", "/tmp/x/out.pdf")).toEqual([
      "--headless=new",
      "--disable-gpu",
      "--no-pdf-header-footer",
      "--virtual-time-budget=20000",
      "--print-to-pdf=/tmp/x/out.pdf",
      "file:///tmp/x/print.html",
    ]);
  });
});

describe("pdfLooksBroken", () => {
  test("accepts a multi-page PDF with ordinary text", () => {
    expect(pdfLooksBroken(42, "Bab 1\nIsi buku")).toBeNull();
  });

  test("refuses a one-page PDF", () => {
    expect(pdfLooksBroken(1, "Bab 1")).toMatch(/1 page/);
  });

  test("refuses Chromium's ERR_FILE_NOT_FOUND page", () => {
    expect(pdfLooksBroken(3, "Your file couldn't be accessed\nERR_FILE_NOT_FOUND")).toMatch(
      /ERR_FILE_NOT_FOUND/,
    );
  });

  test("refuses the error page when the apostrophe is curly", () => {
    expect(pdfLooksBroken(3, "Your file couldn’t be accessed")).toMatch(/couldn't be accessed/);
  });
});

describe("parsePdfInfo", () => {
  test("reads the page count and page size", () => {
    const info = "Title: x\nPages:           57\nPage size:       595.92 x 842.88 pts (A4)\n";
    expect(parsePdfInfo(info)).toEqual({ pages: 57, size: "595.92 x 842.88 pts (A4)" });
  });

  test("gives 0 pages when pdfinfo printed no page count", () => {
    expect(parsePdfInfo("Syntax Error: broken\n")).toEqual({ pages: 0, size: "unknown" });
  });
});

describe("parseArgs", () => {
  test("reads the slug and --out", () => {
    expect(parseArgs(["buku-a", "--out", "/tmp/a.pdf"])).toEqual({
      slug: "buku-a",
      out: "/tmp/a.pdf",
      booksDir: undefined,
    });
  });

  test("reads --books-dir", () => {
    expect(parseArgs(["--books-dir", "/x/books", "buku-a", "--out", "a.pdf"]).booksDir).toBe(
      "/x/books",
    );
  });

  test.each([
    [[] as string[], /slug/],
    [["buku-a"], /--out/],
    [["buku-a", "--out"], /--out/],
    [["buku-a", "b", "--out", "a.pdf"], /one slug/],
    [["buku-a", "--out", "a.pdf", "--color"], /--color/],
    [["../etc", "--out", "a.pdf"], /slug/],
    [["buku-a", "--out", "a.txt"], /\.pdf/],
    [["buku-a", "--out", "a.pdf", "--books-dir"], /--books-dir/],
  ])("refuses %p", (argv, message) => {
    expect(() => parseArgs(argv)).toThrow(message);
  });
});

describe("main", () => {
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  function fixture(pages: number, text: string) {
    const root = fs.mkdtempSync("/tmp/print-pdf-test-");
    made.push(root);
    const booksDir = path.join(root, "books");
    fs.mkdirSync(path.join(booksDir, "buku-a"), { recursive: true });
    const calls: { cmd: string[]; cwd?: string; env?: Record<string, string | undefined> }[] = [];
    let workDir = "";
    const run: Runner = (cmd, opts) => {
      calls.push({ cmd, cwd: opts.cwd, env: opts.env });
      const bin = path.basename(cmd[0]!);
      if (bin === "mdbook") {
        workDir = cmd[cmd.indexOf("-d") + 1]!;
        fs.writeFileSync(path.join(workDir, "print.html"), "<html><head></head><body>x</body></html>");
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      if (bin === "chromium") {
        const flag = cmd.find((a) => a.startsWith("--print-to-pdf="))!;
        fs.writeFileSync(flag.slice("--print-to-pdf=".length), "%PDF-fake");
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      if (bin === "pdfinfo") {
        return { exitCode: 0, stdout: `Pages: ${pages}\nPage size: 595 x 842 pts (A4)\n`, stderr: "" };
      }
      if (bin === "pdftotext") return { exitCode: 0, stdout: text, stderr: "" };
      throw new Error(`unexpected command ${cmd.join(" ")}`);
    };
    const logs: string[] = [];
    const deps = {
      run,
      tmpRoot: root,
      mdbook: "/opt/bin/mdbook",
      chromium: "chromium",
      log: (s: string) => logs.push(s),
      error: (s: string) => logs.push(s),
    };
    return { root, booksDir, calls, logs, deps, workDir: () => workDir };
  }

  test("builds, prints, validates, copies the PDF and removes its temp dir", () => {
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "out", "buku-a.pdf");
    const code = main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps);

    expect(code).toBe(0);
    expect(fs.readFileSync(out, "utf8")).toBe("%PDF-fake");
    const mdbook = f.calls[0]!;
    expect(mdbook.cmd.slice(0, 3)).toEqual(["/opt/bin/mdbook", "build", path.join(f.booksDir, "buku-a")]);
    expect(mdbook.env?.MDBOOK_OUTPUT__HTML__PRINT__ENABLE).toBe("true");
    const chrome = f.calls[1]!;
    expect(chrome.cwd).toBe(f.workDir());
    expect(path.dirname(f.workDir())).toBe(f.root);
    expect(fs.existsSync(f.workDir())).toBe(false);
    expect(f.logs.join("\n")).toMatch(/12 pages.*A4/);
  });

  test("exits 1 and leaves no output when Chromium printed its error page", () => {
    const f = fixture(1, "Your file couldn't be accessed\nERR_FILE_NOT_FOUND");
    const out = path.join(f.root, "buku-a.pdf");
    const code = main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps);

    expect(code).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(fs.existsSync(f.workDir())).toBe(false);
  });

  test("exits 1 when the book folder is missing", () => {
    const f = fixture(12, "Bab 1");
    const code = main(["buku-b", "--out", path.join(f.root, "b.pdf"), "--books-dir", f.booksDir], f.deps);
    expect(code).toBe(1);
    expect(f.calls).toHaveLength(0);
  });

  test("exits 2 on a usage error", () => {
    const f = fixture(12, "Bab 1");
    expect(main(["buku-a"], f.deps)).toBe(2);
    expect(f.calls).toHaveLength(0);
  });
});
