import { afterEach, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import {
  chromiumArgs,
  injectPrintStyle,
  main,
  parseArgs,
  parsePdfInfo,
  pdfLooksBroken,
  type Runner,
  UsageError,
} from "../../scripts/premium/print-pdf";

// The declarations each selector gets in the page's <style> blocks, so the checks below do
// not depend on how the injected rules are formatted or ordered.
function cssRules(html: string): Map<string, string[]> {
  const rules = new Map<string, string[]>();
  for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    for (const [, selectors, body] of css!.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const decls = body!.split(";").map((d) => d.replace(/\s+/g, " ").trim()).filter(Boolean);
      for (const selector of selectors!.split(",")) {
        const key = selector.trim();
        rules.set(key, [...(rules.get(key) ?? []), ...decls]);
      }
    }
  }
  return rules;
}

function eachHas(rules: Map<string, string[]>, selectors: string[], decl: string) {
  return Object.fromEntries(selectors.map((s) => [s, (rules.get(s) ?? []).includes(decl)]));
}

function allTrue(selectors: string[]) {
  return Object.fromEntries(selectors.map((s) => [s, true]));
}

const READER_CHROME = [
  "#menu-bar",
  ".menu-bar",
  "#menu-bar-hover-placeholder",
  ".nav-chapters",
  ".mobile-nav-chapters",
  "#sidebar",
  ".sidebar",
  "#sidebar-toggle-anchor",
];
const BODY_FONT = ["html", "body", ".content", ".content main"];

describe("injectPrintStyle", () => {
  const page = "<html><head><title>x</title></head><body>b</body></html>";

  test("inserts one style block right before </head>", () => {
    const out = injectPrintStyle(page);
    expect(out.match(/<style>/g)).toHaveLength(1);
    expect(out).toMatch(/^<html><head><title>x<\/title><style>[^<]*<\/style><\/head><body>b<\/body><\/html>$/);
  });

  test("sets an A4 page with 25 mm book margins and a page number at the bottom centre", () => {
    const css = injectPrintStyle(page).replace(/\s+/g, " ");
    expect(css).toMatch(/@page \{ size: A4; margin: 25mm; @bottom-center \{ content: counter\(page\);/);
  });

  test("sets the body text like a book: justified, 12 pt, line spacing 1.5", () => {
    const rules = cssRules(injectPrintStyle(page));
    expect(rules.get("body")).toEqual(expect.arrayContaining(["font-size: 12pt !important", "line-height: 1.5 !important"]));
    const prose = [".content p", ".content li", ".content blockquote"];
    expect(eachHas(rules, prose, "text-align: justify !important")).toEqual(allTrue(prose));
    expect(eachHas(rules, prose, "line-height: 1.5 !important")).toEqual(allTrue(prose));
  });

  test("uses the book font for headings and bold text too, not the web display font", () => {
    const rules = cssRules(injectPrintStyle(page));
    const display = ["h1", "h2", "h3", "h4", "h5", "h6", "strong", "b"];
    expect(eachHas(rules, display, 'font-family: "Open Sans", sans-serif !important')).toEqual(allTrue(display));
  });

  test("hides the chapter's own ## title right after the h1 that mdBook's print page inserts", () => {
    // mdBook 0.5 opens every chapter on print.html with an <h1> of its SUMMARY title (the first
    // one first in <main>, the others after a page-break div), so each title printed twice.
    const rules = cssRules(injectPrintStyle(page));
    const twins = ["main > h1:first-child + h2", 'div[style*="break-before"] + h1 + h2'];
    expect(eachHas(rules, twins, "display: none !important")).toEqual(allTrue(twins));
  });

  test("keeps wide content inside the page instead of a scroll box", () => {
    // Measured 2026-11-01: an unwrapped ```text block in 100 Study Hacks made mdBook's
    // overflow:auto .content box print a scrollbar over the right edge of every page.
    const rules = cssRules(injectPrintStyle(page));
    const boxes = [".content", "#content", ".page", ".page-wrapper", "#page-wrapper", "main", ".table-wrapper"];
    expect(eachHas(rules, boxes, "overflow: visible !important")).toEqual(allTrue(boxes));
    expect(eachHas(rules, ["pre", "pre code"], "white-space: pre-wrap !important")).toEqual(allTrue(["pre", "pre code"]));
    const breakable = ["a", "code", "td", "th"];
    expect(eachHas(rules, breakable, "overflow-wrap: anywhere !important")).toEqual(allTrue(breakable));
  });

  test("hides the web reader chrome so it never prints", () => {
    const rules = cssRules(injectPrintStyle(page));
    expect(eachHas(rules, READER_CHROME, "display: none !important")).toEqual(allTrue(READER_CHROME));
  });

  test("sets Open Sans as the one body font", () => {
    const rules = cssRules(injectPrintStyle(page));
    expect(eachHas(rules, BODY_FONT, 'font-family: "Open Sans", sans-serif !important')).toEqual(
      allTrue(BODY_FONT),
    );
  });

  test("hides each image named with --hide-image", () => {
    const rules = cssRules(injectPrintStyle(page, ["cover.png", "Sampul_1-a.JPG"]));
    const images = ['img[src$="cover.png"]', 'img[src$="Sampul_1-a.JPG"]'];
    expect(eachHas(rules, images, "display: none !important")).toEqual(allTrue(images));
  });

  test("is idempotent", () => {
    const once = injectPrintStyle("<head></head>");
    expect(injectPrintStyle(once)).toBe(once);
    const hiding = injectPrintStyle("<head></head>", ["cover.png"]);
    expect(injectPrintStyle(hiding, ["cover.png"])).toBe(hiding);
  });

  test("throws when the page has no </head>", () => {
    expect(() => injectPrintStyle("<html><body>no head</body></html>")).toThrow(/<\/head>/);
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
      hideImages: [],
    });
  });

  test("reads each --hide-image in order", () => {
    const argv = ["buku-a", "--hide-image", "cover.png", "--out", "a.pdf", "--hide-image", "Sampul_1-a.JPG"];
    expect(parseArgs(argv).hideImages).toEqual(["cover.png", "Sampul_1-a.JPG"]);
  });

  test("reads --cover", () => {
    expect(parseArgs(["buku-a", "--out", "a.pdf", "--cover", "art/Sampul.PNG"]).cover).toBe("art/Sampul.PNG");
  });

  test.each([["sampul.gif"], ["sampul"], ["sampul.svg.txt"]])("refuses --cover %p as a usage error", (file) => {
    const argv = ["buku-a", "--out", "a.pdf", "--cover", file];
    expect(() => parseArgs(argv)).toThrow(UsageError);
    expect(() => parseArgs(argv)).toThrow(/--cover must be a \.svg, \.png or \.jpg file/);
  });

  test.each([["../x.png"], ["a b.png"], ['x".png'], ["x/y.png"], ["x]{}.png"], [""]])(
    "refuses --hide-image %p as a usage error",
    (name) => {
      const argv = ["buku-a", "--out", "a.pdf", "--hide-image", name];
      expect(() => parseArgs(argv)).toThrow(UsageError);
      expect(() => parseArgs(argv)).toThrow(/invalid --hide-image/);
    },
  );

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
    [["buku-a", "--out", "a.pdf", "--hide-image"], /--hide-image needs a value/],
    [["buku-a", "--out", "a.pdf", "--cover"], /--cover needs a value/],
  ])("refuses %p", (argv, message) => {
    expect(() => parseArgs(argv)).toThrow(message);
  });
});

describe("main", () => {
  const made: string[] = [];
  afterEach(() => {
    for (const dir of made.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
  });

  function fixture(pages: number, text: string, coverPages = 1, coverText = "LANCAR NUGAS") {
    const root = fs.mkdtempSync("/tmp/print-pdf-test-");
    made.push(root);
    const booksDir = path.join(root, "books");
    fs.mkdirSync(path.join(booksDir, "buku-a"), { recursive: true });
    const calls: { cmd: string[]; cwd?: string; env?: Record<string, string | undefined> }[] = [];
    let workDir = "";
    let readerScriptAtPrint: boolean | undefined;
    let printHtmlAtPrint: string | undefined;
    let coverDirAtPrint: Record<string, string> | undefined;
    const run: Runner = (cmd, opts) => {
      calls.push({ cmd, cwd: opts.cwd, env: opts.env });
      const bin = path.basename(cmd[0]!);
      if (bin === "mdbook") {
        workDir = cmd[cmd.indexOf("-d") + 1]!;
        fs.mkdirSync(workDir, { recursive: true });
        fs.writeFileSync(path.join(workDir, "print.html"), "<html><head></head><body>x</body></html>");
        // Like the real build, mdBook also copies the reader script one level up.
        fs.writeFileSync(path.join(workDir, "..", "shared-script.js"), "/* reader script */");
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      if (bin === "chromium") {
        const page = cmd[cmd.length - 1]!.slice("file://".length);
        const pdf = cmd.find((a) => a.startsWith("--print-to-pdf="))!.slice("--print-to-pdf=".length);
        if (path.basename(page) === "cover.html") {
          const dir = path.dirname(page);
          coverDirAtPrint = Object.fromEntries(
            fs.readdirSync(dir).map((name) => [name, fs.readFileSync(path.join(dir, name), "utf8")]),
          );
          fs.writeFileSync(pdf, "%PDF-cover");
          return { exitCode: 0, stdout: "", stderr: "" };
        }
        readerScriptAtPrint = fs.existsSync(path.join(workDir, "..", "shared-script.js"));
        printHtmlAtPrint = fs.readFileSync(path.join(workDir, "print.html"), "utf8");
        fs.writeFileSync(pdf, "%PDF-fake");
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      if (bin === "pdfinfo") {
        const n = path.basename(cmd[1]!) === "cover.pdf" ? coverPages : pages;
        return { exitCode: 0, stdout: `Pages: ${n}\nPage size: 595 x 842 pts (A4)\n`, stderr: "" };
      }
      if (bin === "pdftotext") {
        return { exitCode: 0, stdout: path.basename(cmd[1]!) === "cover.pdf" ? coverText : text, stderr: "" };
      }
      if (bin === "pdfunite") {
        const inputs = cmd.slice(1, -1).map((p) => fs.readFileSync(p, "utf8"));
        fs.writeFileSync(cmd[cmd.length - 1]!, inputs.join("+"));
        return { exitCode: 0, stdout: "", stderr: "" };
      }
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
    return {
      root,
      booksDir,
      calls,
      logs,
      deps,
      workDir: () => workDir,
      readerScriptAtPrint: () => readerScriptAtPrint,
      printHtmlAtPrint: () => printHtmlAtPrint,
      coverDirAtPrint: () => coverDirAtPrint,
    };
  }

  function tempDirsLeft(root: string): string[] {
    return fs.readdirSync(root).filter((name) => name.startsWith("dawnbook-print-"));
  }

  test("exits 1 before running anything when the cover file is missing", () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "hilang.png");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(f.calls).toHaveLength(0);
    expect(fs.existsSync(out)).toBe(false);
    expect(tempDirsLeft(f.root)).toEqual([]);
    expect(f.logs.join("\n")).toContain(`cover file not found: ${cover}`);
  });

  test("exits 1 with the same message when a folder in the cover path is a file", () => {
    // Bun's statSync throws ENOTDIR here even with throwIfNoEntry: false (measured 2026-11-01).
    const f = fixture(12, "Bab 1");
    fs.writeFileSync(path.join(f.root, "berkas"), "x");
    const cover = path.join(f.root, "berkas", "sampul.png");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(f.calls).toHaveLength(0);
    expect(f.logs.join("\n")).toContain(`cover file not found: ${cover}`);
  });

  test("prints the cover first, from cover.html in its own folder next to a copy of the image", () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "Sampul.PNG");
    fs.writeFileSync(cover, "png-bytes");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);

    const temp = path.resolve(f.workDir(), "../..");
    const chromes = f.calls.filter((c) => path.basename(c.cmd[0]!) === "chromium");
    expect(chromes).toHaveLength(2);
    expect(chromes[0]!.cwd).toBe(path.join(temp, "cover"));
    expect(chromes[0]!.cmd[chromes[0]!.cmd.length - 1]).toBe(`file://${path.join(temp, "cover", "cover.html")}`);
    expect(chromes[0]!.cmd).toContain(`--print-to-pdf=${path.join(temp, "cover.pdf")}`);
    expect(chromes[1]!.cmd[chromes[1]!.cmd.length - 1]).toBe(`file://${path.join(f.workDir(), "print.html")}`);
    expect(f.coverDirAtPrint()).toEqual({
      "cover.html":
        '<!doctype html><html><head><meta charset="utf-8"><style>@page { size: A4; margin: 0; } ' +
        "html, body { margin: 0; padding: 0; } img { display: block; width: 210mm; height: 297mm; " +
        'object-fit: cover; }</style></head><body><img src="cover.png"></body></html>',
      "cover.png": "png-bytes",
    });
  });

  test("puts the cover before the book with pdfunite and copies the merged PDF to --out", () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "out", "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);

    const bins = f.calls.map((c) => path.basename(c.cmd[0]!));
    expect(bins.filter((b) => b === "pdfunite")).toHaveLength(1);
    // Last, so it runs only after the book PDF passed pdfinfo and pdftotext.
    expect(bins[bins.length - 1]).toBe("pdfunite");
    const unite = f.calls[f.calls.length - 1]!.cmd.slice(1).map((p) => path.basename(p));
    expect(unite).toEqual(["cover.pdf", "book.pdf", "final.pdf"]);
    expect(fs.readFileSync(out, "utf8")).toBe("%PDF-cover+%PDF-fake");
    expect(f.logs.join("\n")).toMatch(/13 pages/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("exits 1 and writes no PDF when the cover prints to more than one page", () => {
    const f = fixture(12, "Bab 1", 2);
    const cover = path.join(f.root, "sampul.jpg");
    fs.writeFileSync(cover, "jpg-bytes");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.calls.some((c) => path.basename(c.cmd[0]!) === "pdfunite")).toBe(false);
    expect(f.logs.join("\n")).toMatch(/cover.*2 pages/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("exits 1 and writes no PDF when the cover printed as Chromium's error page", () => {
    // A one-page ERR_FILE_NOT_FOUND print passes the 1-page check, so the cover text is read too.
    const f = fixture(12, "Bab 1", 1, "Your file couldn’t be accessed\nERR_FILE_NOT_FOUND");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.logs.join("\n")).toMatch(/cover.*error page/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("hides the images named by --hide-image in the printed page", () => {
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    const argv = ["buku-a", "--out", out, "--books-dir", f.booksDir, "--hide-image", "cover.png"];
    expect(main(argv, f.deps)).toBe(0);
    const rules = cssRules(f.printHtmlAtPrint() ?? "");
    expect(rules.get('img[src$="cover.png"]') ?? []).toContain("display: none !important");
  });

  test("removes the reader script before printing, so its redirect cannot replace the page", () => {
    // Measured 2026-11-01: with ../shared-script.js present, Chromium printed a one-page
    // ERR_FILE_NOT_FOUND page instead of the book; a copy without it printed 91 pages.
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(0);
    expect(f.readerScriptAtPrint()).toBe(false);
  });

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
    expect(fs.existsSync(f.workDir())).toBe(false);
    expect(f.logs.join("\n")).toMatch(/12 pages.*A4/);
  });

  test("builds two levels inside its temp dir, so the theme's ../../ paths stay inside it", () => {
    // book.toml reaches the shared CSS through ../../apps/...; mdBook resolves that from the
    // -d folder, so a -d folder directly under /tmp made mdBook try to create /apps (2026-11-01).
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    expect(main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(0);
    const temp = path.resolve(f.workDir(), "../..");
    expect(path.dirname(temp)).toBe(f.root);
    expect(path.basename(temp).startsWith("dawnbook-print-buku-a-")).toBe(true);
    expect(fs.existsSync(temp)).toBe(false);
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
