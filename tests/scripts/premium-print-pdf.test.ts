import { afterEach, beforeAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { diagramKey } from "../../scripts/diagrams/cache";
import {
  chromiumArgs,
  injectPrintStyle,
  injectWatermark,
  main,
  parseArgs,
  parsePdfInfo,
  pdfLooksBroken,
  PIKEPDF_VERSION,
  type Runner,
  UsageError,
  watermarkSvg,
} from "../../scripts/premium/print-pdf";

const REPO_ROOT = path.join(import.meta.dir, "..", "..");
const FENCE = "```";

// The first watermarkSvg() call scans the system fonts for resvg: 10.7 s with a cold font cache
// on this machine (867 files), 65 ms warm (measured 2026-11-02). Warm it once here, so no test
// that prints a page runs into the 5 s test timeout.
beforeAll(() => {
  watermarkSvg();
}, 60_000);

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

// A 40 dpi grayscale A4 page as pdftoppm writes it (binary PGM). The watermark page carries a
// 120 x 40 block of 240, the flat colour of the 6 % black watermark on white paper; the
// measured real page 1 held 396 such pixels in the centre band, the same page without the
// watermark 36.
function pgmPage(watermark: boolean): Buffer {
  const [w, h] = [331, 468];
  const px = Buffer.alloc(w * h, 255);
  if (watermark) {
    for (let y = 214; y < 254; y++) px.fill(240, y * w + 105, y * w + 225);
  }
  return Buffer.concat([Buffer.from(`P5\n${w} ${h}\n255\n`, "latin1"), px]);
}

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
    const breakable = ["a", "code"];
    expect(eachHas(rules, breakable, "overflow-wrap: anywhere !important")).toEqual(allTrue(breakable));
  });

  test("wraps table cells between words, never inside a word", () => {
    // Owner, 2026-11-02: "anywhere" on td/th let Chromium shrink each column to about one letter, so
    // "Penelitian" printed as "Pen / eliti / an". break-word keeps each word whole in the column width.
    const rules = cssRules(injectPrintStyle(page));
    for (const cell of ["td", "th"]) {
      expect(rules.get(cell) ?? []).toContain("overflow-wrap: break-word !important");
      expect(rules.get(cell) ?? []).toContain("word-break: normal !important");
      expect(rules.get(cell) ?? []).not.toContain("overflow-wrap: anywhere !important");
      expect(rules.get(cell) ?? []).toContain("vertical-align: top !important");
    }
    expect(rules.get("table") ?? []).toContain("width: 100% !important");
    expect(rules.get("table") ?? []).toContain("font-size: 10pt !important");
  });

  test("keeps a link or code word whole inside a table cell too", () => {
    // Measured 2026-11-02: with "a { anywhere }" alone, a column of linked tool names in Lancar Nugas
    // shrank to "Lucidc / hart" and "BioRe / nder".
    const rules = cssRules(injectPrintStyle(page));
    const inCells = ["td a", "th a", "td code", "th code"];
    expect(eachHas(rules, inCells, "overflow-wrap: break-word !important")).toEqual(allTrue(inCells));
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

  test("keeps the reference list left aligned, so the justify rule cannot undo its hanging indent", () => {
    const rules = cssRules(injectPrintStyle(page));
    expect(rules.get(".content .daftar-pustaka p") ?? []).toContain("text-align: left !important");
  });

  test("keeps headings with their text, blocks whole, and at least 2 lines together", () => {
    const rules = cssRules(injectPrintStyle(page));
    const headings = ["h1", "h2", "h3", "h4"];
    expect(eachHas(rules, headings, "break-after: avoid")).toEqual(allTrue(headings));
    const blocks = ["img", "svg", "table", "pre", "figure"];
    expect(eachHas(rules, blocks, "break-inside: avoid")).toEqual(allTrue(blocks));
    const lines = ["p", "li"];
    expect(eachHas(rules, lines, "orphans: 2")).toEqual(allTrue(lines));
    expect(eachHas(rules, lines, "widows: 2")).toEqual(allTrue(lines));
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

  test("asks for PDF bookmarks from the headings when the outline option is on", () => {
    const args = chromiumArgs("/tmp/x/print.html", "/tmp/x/out.pdf", { outline: true });
    expect(args).toContain("--generate-pdf-document-outline");
    expect(args[args.length - 1]).toBe("file:///tmp/x/print.html");
  });
});

describe("watermarkSvg", () => {
  test("draws the site name as paths only, so it never enters the PDF text layer", () => {
    const svg = watermarkSvg();
    expect(svg).toContain("<path");
    expect(svg).not.toContain("<text");
    expect(svg).not.toContain("belajarcarabelajar");
  });

  test("is black at 6 percent opacity, along the A4 diagonal from corner to corner", () => {
    const svg = watermarkSvg();
    expect(svg).toContain('fill="#000000"');
    expect(svg).toContain('fill-opacity="0.06"');
    // The view box is the whole A4 sheet in millimetres.
    expect(svg).toMatch(/<svg width="210" height="297" viewBox="0 0 210 297"/);
    // rotate(-atan(297/210)) as a matrix: cos = 1/sqrt(3) = 0.57735, sin = sqrt(2/3) = 0.81650.
    expect(svg).toMatch(/matrix\(0\.5773\d* -0\.8165\d* 0\.8165\d* 0\.5773\d* /);
  });

  test("spans at least 90 percent of the sheet each way and stays on the sheet", () => {
    // Owner, 2026-11-02: the old -30 degree mark was too small and did not run corner to corner.
    const box = new Resvg(watermarkSvg()).getBBox();
    expect(box).toBeDefined();
    const { x, y, width, height } = box!;
    expect(width).toBeGreaterThanOrEqual(0.9 * 210);
    expect(height).toBeGreaterThanOrEqual(0.9 * 297);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(y).toBeGreaterThanOrEqual(0);
    expect(x + width).toBeLessThanOrEqual(210);
    expect(y + height).toBeLessThanOrEqual(297);
  });
});

describe("injectWatermark", () => {
  const page = '<html><head><title>x</title></head><body class="light no-js">b</body></html>';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L1 1"/></svg>';

  test("puts one watermark element right after the opening <body> tag", () => {
    const out = injectWatermark(page, svg);
    expect(out).toContain('<body class="light no-js"><div class="pdf-watermark"></div>b</body>');
    expect(out.match(/class="pdf-watermark"/g)).toHaveLength(1);
  });

  test("covers the whole sheet: the page background in the margins, a fixed layer over the text", () => {
    // Chromium clips a position: fixed element to the page area inside the margins, and paints an
    // @page background over the whole sheet with its origin at the page area (probed 2026-11-02),
    // so both carry the same sheet-sized image shifted back by the 25 mm margin and line up.
    const out = injectWatermark(page, svg);
    const at = out.indexOf(".pdf-watermark {");
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(out.indexOf("</head>"));
    const rule = out.slice(at, out.indexOf("}", at));
    for (const decl of ["position: fixed", "inset: 0", "pointer-events: none", "z-index: 0"]) {
      expect(rule).toContain(decl);
    }
    const sheet = 'url\\("data:image/svg\\+xml;base64,([A-Za-z0-9+/=]+)"\\) -25mm -25mm \\/ 210mm 297mm no-repeat';
    const layer = new RegExp(`background: ${sheet}`).exec(rule);
    expect(Buffer.from(layer?.[1] ?? "", "base64").toString("utf8")).toBe(svg);
    const pageAt = out.indexOf("@page {", out.indexOf("<style>"));
    const pageRule = out.slice(pageAt, out.indexOf("}", pageAt));
    expect(new RegExp(`background: ${sheet}`).exec(pageRule)?.[1]).toBe(layer?.[1]);
    // An opaque page area hides the page background under the text, so the mark is not doubled there.
    expect(out).toContain("html { background-color: #ffffff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }");
  });

  test("is idempotent", () => {
    const once = injectWatermark(page, svg);
    expect(injectWatermark(once, svg)).toBe(once);
  });

  test("throws when the page has no <body> or no </head>", () => {
    expect(() => injectWatermark("<html><head></head></html>", svg)).toThrow(/<body/);
    expect(() => injectWatermark("<html><body>b</body></html>", svg)).toThrow(/<\/head>/);
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
      restrict: false,
    });
  });

  test("reads --restrict", () => {
    expect(parseArgs(["buku-a", "--restrict", "--out", "a.pdf"]).restrict).toBe(true);
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

  interface FixtureOptions {
    // What the fake finish-pdf.py reports or does instead of the normal result.
    finish?: { exitCode?: number; stdout?: string; result?: Record<string, unknown> };
    // pdftotext output for the finished PDF; defaults to the book text.
    finalText?: string;
    // The page pdftoppm rasterises from the finished PDF; defaults to one with the watermark.
    page?: Buffer;
  }

  function fixture(pages: number, text: string, coverPages = 1, coverText = "LANCAR NUGAS", options: FixtureOptions = {}) {
    const root = fs.mkdtempSync("/tmp/print-pdf-test-");
    made.push(root);
    // The fixture root stands in for the repo root: the diagram cache key reads these files.
    const keyDir = path.join(root, "scripts", "diagrams");
    fs.mkdirSync(keyDir, { recursive: true });
    for (const name of ["render-config.json", "theme.css"]) {
      fs.copyFileSync(path.join(REPO_ROOT, "scripts", "diagrams", name), path.join(keyDir, name));
    }
    fs.writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ devDependencies: { "@mermaid-js/mermaid-cli": "12.0.0" } }),
    );
    const booksDir = path.join(root, "books");
    const bookDir = path.join(booksDir, "buku-a");
    const chapterPath = path.join(bookDir, "src", "content", "01_bab.md");
    fs.mkdirSync(path.dirname(chapterPath), { recursive: true });
    fs.writeFileSync(path.join(bookDir, "book.toml"), '[book]\ntitle = "Buku A"\n');
    fs.writeFileSync(path.join(bookDir, "src", "SUMMARY.md"), "# Ringkasan\n\n- [Bab 1](content/01_bab.md)\n");
    fs.writeFileSync(chapterPath, "## Bab 1\n\nIsi bab.\n");
    fs.writeFileSync(path.join(booksDir, "shared-header.css"), "/* shared header */");
    fs.writeFileSync(path.join(booksDir, "shared-script.js"), "/* reader script */");
    const calls: { cmd: string[]; cwd?: string; env?: Record<string, string | undefined> }[] = [];
    let workDir = "";
    let readerScriptAtPrint: boolean | undefined;
    let printHtmlAtPrint: string | undefined;
    let coverDirAtPrint: Record<string, string> | undefined;
    let chapterAtBuild: string | undefined;
    let sharedCssAtBuild: boolean | undefined;
    const run: Runner = (cmd, opts) => {
      calls.push({ cmd, cwd: opts.cwd, env: opts.env });
      const bin = path.basename(cmd[0]!);
      if (bin === "mdbook") {
        const source = cmd[2]!;
        const chapter = path.join(source, "src", "content", "01_bab.md");
        chapterAtBuild = fs.existsSync(chapter) ? fs.readFileSync(chapter, "utf8") : undefined;
        // The theme's ../shared-header.css is read from beside the book that mdbook builds.
        sharedCssAtBuild = fs.existsSync(path.join(source, "..", "shared-header.css"));
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
        const file = path.basename(cmd.find((a) => a.endsWith(".pdf"))!);
        const out = file === "cover.pdf" ? coverText : file === "final.pdf" ? (options.finalText ?? text) : text;
        return { exitCode: 0, stdout: out, stderr: "" };
      }
      if (bin === "uv") {
        // Stands in for finish-pdf.py: the cover (if any) goes in front of the book.
        const script = cmd.findIndex((a) => a.endsWith("finish-pdf.py"));
        const [book, final] = [cmd[script + 1]!, cmd[script + 2]!];
        const coverAt = cmd.indexOf("--cover");
        const cover = coverAt < 0 ? undefined : cmd[coverAt + 1]!;
        if (options.finish?.exitCode) {
          return { exitCode: options.finish.exitCode, stdout: "", stderr: "finish-pdf: PdfError: broken xref" };
        }
        const parts = [...(cover ? [fs.readFileSync(cover, "utf8")] : []), fs.readFileSync(book, "utf8")];
        fs.writeFileSync(final, parts.join("+"));
        const result = { pages: pages + (cover ? 1 : 0), outline: 3, encrypted: cmd.includes("--restrict") };
        const stdout = options.finish?.stdout ?? `${JSON.stringify({ ...result, ...options.finish?.result })}\n`;
        return { exitCode: 0, stdout, stderr: "" };
      }
      if (bin === "pdftoppm") {
        // With -singlefile, pdftoppm writes <prefix>.pgm.
        fs.writeFileSync(`${cmd[cmd.length - 1]!}.pgm`, options.page ?? pgmPage(true));
        return { exitCode: 0, stdout: "", stderr: "" };
      }
      throw new Error(`unexpected command ${cmd.join(" ")}`);
    };
    const logs: string[] = [];
    const deps = {
      run,
      tmpRoot: root,
      repoRoot: root,
      mdbook: "/opt/bin/mdbook",
      chromium: "chromium",
      uv: "/usr/bin/uv" as string | null,
      log: (s: string) => logs.push(s),
      error: (s: string) => logs.push(s),
    };
    return {
      root,
      booksDir,
      chapterPath,
      calls,
      logs,
      deps,
      workDir: () => workDir,
      readerScriptAtPrint: () => readerScriptAtPrint,
      printHtmlAtPrint: () => printHtmlAtPrint,
      coverDirAtPrint: () => coverDirAtPrint,
      chapterAtBuild: () => chapterAtBuild,
      sharedCssAtBuild: () => sharedCssAtBuild,
    };
  }

  // A chapter holding one Mermaid block, optionally with its SVG in the book's diagram cache.
  function addDiagram(f: ReturnType<typeof fixture>, cached: boolean) {
    const source = "flowchart TD\n  A[Mulai] --> B[Selesai]";
    const svg = '<svg viewBox="0 0 10 10"><title>t</title></svg>';
    const chapter = `## Bab 1\n\nIsi bab.\n\n${FENCE}mermaid\n${source}\n${FENCE}\n\nPenutup.\n`;
    fs.writeFileSync(f.chapterPath, chapter);
    if (cached) {
      const svgPath = path.join(f.booksDir, "buku-a", "diagrams", `${diagramKey(source, f.root)}.svg`);
      fs.mkdirSync(path.dirname(svgPath), { recursive: true });
      fs.writeFileSync(svgPath, `${svg}\n`);
    }
    return { chapter, svg };
  }

  const preparedCopy = (f: ReturnType<typeof fixture>) => path.join(f.root, ".build-tmp-pdf", "buku-a");

  test("prints the book as the web build prepares it, with each diagram inlined from its cache", async () => {
    const f = fixture(12, "Bab 1");
    const { chapter, svg } = addDiagram(f, true);
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(0);

    const mdbook = f.calls.find((c) => path.basename(c.cmd[0]!) === "mdbook")!;
    expect(mdbook.cmd.slice(0, 3)).toEqual(["/opt/bin/mdbook", "build", preparedCopy(f)]);
    expect(f.chapterAtBuild()).toContain(`<div class="dawnbook-diagram">${svg}</div>`);
    expect(f.chapterAtBuild()).not.toContain(`${FENCE}mermaid`);
    expect(f.sharedCssAtBuild()).toBe(true);
    // The prepared copy is removed afterwards, and the source book is never touched.
    expect(fs.existsSync(preparedCopy(f))).toBe(false);
    expect(fs.readFileSync(f.chapterPath, "utf8")).toBe(chapter);
  });

  test("exits 1 with the diagram cache message and runs no mdbook when a diagram has no cached SVG", async () => {
    const f = fixture(12, "Bab 1");
    addDiagram(f, false);
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(1);

    expect(f.calls.some((c) => path.basename(c.cmd[0]!) === "mdbook")).toBe(false);
    expect(f.logs.join("\n")).toMatch(
      /buku-a\/src\/content\/01_bab\.md:\d+ has no cached SVG [0-9a-f]{12}\.svg; run: bun run diagrams:render --book buku-a/,
    );
    expect(fs.existsSync(out)).toBe(false);
    expect(fs.existsSync(preparedCopy(f))).toBe(false);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  function tempDirsLeft(root: string): string[] {
    return fs.readdirSync(root).filter((name) => name.startsWith("dawnbook-print-"));
  }

  test("exits 1 before running anything when the cover file is missing", async () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "hilang.png");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(f.calls).toHaveLength(0);
    expect(fs.existsSync(out)).toBe(false);
    expect(tempDirsLeft(f.root)).toEqual([]);
    expect(f.logs.join("\n")).toContain(`cover file not found: ${cover}`);
  });

  test("exits 1 with the same message when a folder in the cover path is a file", async () => {
    // Bun's statSync throws ENOTDIR here even with throwIfNoEntry: false (measured 2026-11-01).
    const f = fixture(12, "Bab 1");
    fs.writeFileSync(path.join(f.root, "berkas"), "x");
    const cover = path.join(f.root, "berkas", "sampul.png");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(f.calls).toHaveLength(0);
    expect(f.logs.join("\n")).toContain(`cover file not found: ${cover}`);
  });

  test("prints the cover first, from cover.html in its own folder next to a copy of the image", async () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "Sampul.PNG");
    fs.writeFileSync(cover, "png-bytes");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);

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

  test("finishes with finish-pdf.py under uv, cover first, then copies the result to --out", async () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "out", "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);

    const bins = f.calls.map((c) => path.basename(c.cmd[0]!));
    expect(bins).not.toContain("pdfunite");
    // After the book PDF passed pdfinfo and pdftotext; only the text layer and watermark checks
    // of the result follow.
    expect(bins.slice(-3)).toEqual(["uv", "pdftotext", "pdftoppm"]);
    const temp = path.resolve(f.workDir(), "../..");
    expect(f.calls[f.calls.length - 3]!.cmd).toEqual([
      "/usr/bin/uv",
      "run",
      "--no-project",
      "--quiet",
      "--with",
      `pikepdf==${PIKEPDF_VERSION}`,
      "python3",
      "-I",
      path.join(REPO_ROOT, "scripts", "premium", "finish-pdf.py"),
      path.join(f.workDir(), "book.pdf"),
      path.join(temp, "final.pdf"),
      "--cover",
      path.join(temp, "cover.pdf"),
    ]);
    expect(PIKEPDF_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(fs.readFileSync(out, "utf8")).toBe("%PDF-cover+%PDF-fake");
    expect(f.logs.join("\n")).toMatch(/13 pages/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("asks Chromium for bookmarks on the book pass only, not on the cover", async () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);
    const chromes = f.calls.filter((c) => path.basename(c.cmd[0]!) === "chromium");
    expect(chromes.map((c) => c.cmd.includes("--generate-pdf-document-outline"))).toEqual([false, true]);
  });

  test("prints the watermark on the book pages but not on the cover", async () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);
    expect(f.printHtmlAtPrint()).toContain('<body><div class="pdf-watermark"></div>x</body>');
    expect(f.printHtmlAtPrint()).toContain(".pdf-watermark {");
    expect(JSON.stringify(f.coverDirAtPrint())).not.toContain("pdf-watermark");
  });

  test("passes --restrict to the finish step and ships the encrypted result", async () => {
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--restrict"], f.deps)).toBe(0);
    const finish = f.calls.find((c) => path.basename(c.cmd[0]!) === "uv")!.cmd;
    expect(finish.slice(-3)).toEqual([path.join(f.workDir(), "book.pdf"), expect.stringMatching(/final\.pdf$/), "--restrict"]);
    expect(fs.readFileSync(out, "utf8")).toBe("%PDF-fake");
  });

  test("never ships an unrestricted file when --restrict was asked", async () => {
    const f = fixture(12, "Bab 1", 1, "LANCAR NUGAS", { finish: { result: { encrypted: false } } });
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--restrict"], f.deps)).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.logs.join("\n")).toMatch(/--restrict.*not encrypted/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test.each([
    ["a page count other than the book plus the cover", { result: { pages: 12 } }, /12 pages, expected 13/],
    ["no bookmarks", { result: { outline: 0 } }, /no bookmarks/],
    ["no result line", { stdout: "done\n" }, /no result line/],
    ["a failed run", { exitCode: 1 }, /finish-pdf failed \(exit 1\)[\s\S]*PdfError: broken xref/],
  ])("exits 1 and writes no PDF when the finish step reports %s", async (_, finish, message) => {
    const f = fixture(12, "Bab 1", 1, "LANCAR NUGAS", { finish });
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.logs.join("\n")).toMatch(message);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("exits 1 with an install hint and runs nothing when uv is missing", async () => {
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    const deps = { ...f.deps, uv: null };
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--restrict"], deps)).toBe(1);
    expect(f.calls).toHaveLength(0);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.logs.join("\n")).toMatch(/uv not found.*sudo pacman -S uv/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("exits 1 when the site name is in the PDF text more often than the book text writes it", async () => {
    // A watermark drawn as text would put the site name into the text layer once per page.
    const finalText = "Bab 1\nbelajarcarabelajar.com\nLihat belajarcarabelajar.com.\nbelajarcarabelajar.com\n";
    const f = fixture(12, "Bab 1", 1, "LANCAR NUGAS", { finalText });
    fs.writeFileSync(f.chapterPath, "## Bab 1\n\nLihat belajarcarabelajar.com.\n");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(1);
    expect(f.logs.join("\n")).toContain("watermark leaked into the text layer");
    expect(fs.existsSync(out)).toBe(false);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("accepts the site name as often as the book text writes it, reading the book pages only", async () => {
    const f = fixture(12, "Bab 1", 1, "belajarcarabelajar.com", { finalText: "Lihat BelajarCaraBelajar.com." });
    fs.writeFileSync(f.chapterPath, "## Bab 1\n\nLihat belajarcarabelajar.com.\n");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);
    // Page 1 is the cover, whose own text may name the site.
    const temp = path.resolve(f.workDir(), "../..");
    expect(f.calls[f.calls.length - 2]!.cmd).toEqual(["pdftotext", "-f", "2", path.join(temp, "final.pdf"), "-"]);
  });

  test("exits 1 and writes no PDF when the printed page shows no watermark", async () => {
    // A Chromium that drops the fixed background prints pages with no watermark ink at all.
    const f = fixture(12, "Bab 1", 1, "LANCAR NUGAS", { page: pgmPage(false) });
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--restrict"], f.deps)).toBe(1);
    expect(f.logs.join("\n")).toContain("the watermark is missing from the printed pages");
    expect(fs.existsSync(out)).toBe(false);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("checks the watermark on a 40 dpi gray render of the first book page of the finished PDF", async () => {
    const f = fixture(12, "Bab 1");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(0);
    const temp = path.resolve(f.workDir(), "../..");
    const final = path.join(temp, "final.pdf");
    const prefix = path.join(temp, "watermark-check");
    const pdftoppm = ["pdftoppm", "-r", "40", "-gray", "-singlefile"];
    expect(f.calls[f.calls.length - 1]!.cmd).toEqual([...pdftoppm, "-f", "2", "-l", "2", final, prefix]);

    // Without a cover, page 1 is the first book page.
    const g = fixture(12, "Bab 1");
    expect(await main(["buku-a", "--out", path.join(g.root, "b.pdf"), "--books-dir", g.booksDir], g.deps)).toBe(0);
    const gTemp = path.resolve(g.workDir(), "../..");
    expect(g.calls[g.calls.length - 1]!.cmd).toEqual([
      ...pdftoppm,
      "-f",
      "1",
      "-l",
      "1",
      path.join(gTemp, "final.pdf"),
      path.join(gTemp, "watermark-check"),
    ]);
  });

  test("exits 1 and writes no PDF when the cover prints to more than one page", async () => {
    const f = fixture(12, "Bab 1", 2);
    const cover = path.join(f.root, "sampul.jpg");
    fs.writeFileSync(cover, "jpg-bytes");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.calls.some((c) => path.basename(c.cmd[0]!) === "uv")).toBe(false);
    expect(f.logs.join("\n")).toMatch(/cover.*2 pages/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("exits 1 and writes no PDF when the cover printed as Chromium's error page", async () => {
    // A one-page ERR_FILE_NOT_FOUND print passes the 1-page check, so the cover text is read too.
    const f = fixture(12, "Bab 1", 1, "Your file couldn’t be accessed\nERR_FILE_NOT_FOUND");
    const cover = path.join(f.root, "sampul.svg");
    fs.writeFileSync(cover, "<svg/>");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir, "--cover", cover], f.deps)).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(f.logs.join("\n")).toMatch(/cover.*error page/);
    expect(tempDirsLeft(f.root)).toEqual([]);
  });

  test("hides the images named by --hide-image in the printed page", async () => {
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    const argv = ["buku-a", "--out", out, "--books-dir", f.booksDir, "--hide-image", "cover.png"];
    expect(await main(argv, f.deps)).toBe(0);
    const rules = cssRules(f.printHtmlAtPrint() ?? "");
    expect(rules.get('img[src$="cover.png"]') ?? []).toContain("display: none !important");
  });

  test("removes the reader script before printing, so its redirect cannot replace the page", async () => {
    // Measured 2026-11-01: with ../shared-script.js present, Chromium printed a one-page
    // ERR_FILE_NOT_FOUND page instead of the book; a copy without it printed 91 pages.
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(0);
    expect(f.readerScriptAtPrint()).toBe(false);
  });

  test("builds, prints, validates, copies the PDF and removes its temp dir", async () => {
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "out", "buku-a.pdf");
    const code = await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps);

    expect(code).toBe(0);
    expect(fs.readFileSync(out, "utf8")).toBe("%PDF-fake");
    const mdbook = f.calls[0]!;
    expect(mdbook.cmd.slice(0, 3)).toEqual(["/opt/bin/mdbook", "build", preparedCopy(f)]);
    expect(mdbook.env?.MDBOOK_OUTPUT__HTML__PRINT__ENABLE).toBe("true");
    const chrome = f.calls[1]!;
    expect(chrome.cwd).toBe(f.workDir());
    expect(fs.existsSync(f.workDir())).toBe(false);
    expect(f.logs.join("\n")).toMatch(/12 pages.*A4/);
  });

  test("builds two levels inside its temp dir, so the theme's ../../ paths stay inside it", async () => {
    // book.toml reaches the shared CSS through ../../apps/...; mdBook resolves that from the
    // -d folder, so a -d folder directly under /tmp made mdBook try to create /apps (2026-11-01).
    const f = fixture(12, "Bab 1");
    const out = path.join(f.root, "buku-a.pdf");
    expect(await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps)).toBe(0);
    const temp = path.resolve(f.workDir(), "../..");
    expect(path.dirname(temp)).toBe(f.root);
    expect(path.basename(temp).startsWith("dawnbook-print-buku-a-")).toBe(true);
    expect(fs.existsSync(temp)).toBe(false);
  });

  test("exits 1 and leaves no output when Chromium printed its error page", async () => {
    const f = fixture(1, "Your file couldn't be accessed\nERR_FILE_NOT_FOUND");
    const out = path.join(f.root, "buku-a.pdf");
    const code = await main(["buku-a", "--out", out, "--books-dir", f.booksDir], f.deps);

    expect(code).toBe(1);
    expect(fs.existsSync(out)).toBe(false);
    expect(fs.existsSync(f.workDir())).toBe(false);
  });

  test("exits 1 when the book folder is missing", async () => {
    const f = fixture(12, "Bab 1");
    const code = await main(["buku-b", "--out", path.join(f.root, "b.pdf"), "--books-dir", f.booksDir], f.deps);
    expect(code).toBe(1);
    expect(f.calls).toHaveLength(0);
  });

  test("exits 2 on a usage error", async () => {
    const f = fixture(12, "Bab 1");
    expect(await main(["buku-a"], f.deps)).toBe(2);
    expect(f.calls).toHaveLength(0);
  });
});
