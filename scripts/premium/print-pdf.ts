#!/usr/bin/env bun
/**
 * Prints a premium book to the A4 PDF sold in the store.
 *
 * Usage:
 *   bun run scripts/premium/print-pdf.ts <slug> --out <file.pdf> [--books-dir <dir>]
 *     [--cover <file.svg|.png|.jpg>] [--hide-image <basename>]... [--restrict]
 *
 * --books-dir defaults to books/ of this repo, which scripts/premium-sync.ts fills. As in the web
 *   build, shared-header.css and shared-script.js are taken from this folder too.
 * --cover prints that image alone as page 1, filling the A4 page with no margin.
 * --hide-image (repeatable) hides every <img> whose src ends in <basename>, for a cover that
 *   already sits inside chapter 1.
 * --restrict saves the PDF with AES-256, an empty open password, text extraction and changes not
 *   allowed, printing allowed. Reader apps honour this as a request; it is not protection.
 * Why (owner, 2026-11-01): the web header and fonts leaked into the PDF, and a cover inside
 *   chapter 1 flowed with the text and left page 1 almost empty.
 * Exit codes: 0 success, 1 failure, 2 usage error.
 *
 * Needs mdbook, chromium, pdfinfo, pdftotext and uv. uv runs scripts/premium/finish-pdf.py with
 * pikepdf pinned to PIKEPDF_VERSION below (pikepdf bundles qpdf, so no system package is added).
 *
 * Steps:
 *   1. With --cover: the image is copied into <temp>/cover next to a one-image cover.html,
 *      Chromium prints that to <temp>/cover.pdf, and pdfinfo must report exactly 1 page.
 *   2. The book is prepared exactly like the web build: prepareBookForMdbook copies it to
 *      .build-tmp-pdf/<slug> in this repo, and inlineDiagramsInBook replaces each Mermaid block
 *      with its cached SVG. A diagram without a cached SVG fails the print with the web build's
 *      message.
 *   3. `mdbook build .build-tmp-pdf/<slug> -d <fresh mkdtemp dir under /tmp>/build/<slug>` (two
 *      levels deep, because book.toml reaches shared CSS through ../../apps/...) with
 *      MDBOOK_OUTPUT__HTML__PRINT__ENABLE=true. The template turns print.html off, and book.toml
 *      must never be edited (GEMINI.md section 1), so the env var switches it on.
 *   4. Insert the print <style> before </head> of the built print.html (A4 with 25 mm margins and
 *      page numbers, the reader chrome hidden, Open Sans, justified 12 pt text, page-break rules,
 *      the --hide-image rules) and the watermark: "belajarcarabelajar.com" drawn as paths, fixed
 *      on every page at 6 % opacity. The cover has its own page and gets no watermark.
 *   5. Headless Chromium prints that page to book.pdf with chapter bookmarks, run with cwd set to
 *      the build dir.
 *   6. pdfinfo must report more than 1 page and pdftotext must not show Chromium's error page.
 *   7. finish-pdf.py puts the cover in front and, with --restrict, encrypts. Its JSON line must
 *      show the book's pages (plus 1 with a cover), at least 1 bookmark, and encryption exactly
 *      when --restrict was given; anything else exits 1 and writes no PDF.
 *   8. pdftotext of the finished book pages must not hold "belajarcarabelajar.com" more often than
 *      the prepared Markdown does; otherwise the watermark leaked into the text layer.
 *   9. The PDF is copied to --out; the temp dir and the prepared copy are removed.
 *
 * Measured traps (2026-11-01):
 *   - Chromium here cannot read files under ~/.cache (where TMPDIR points on this machine).
 *     It prints a one-page "Your file couldn't be accessed / ERR_FILE_NOT_FOUND" PDF and
 *     still exits 0, so the work dir is always under /tmp and the PDF is always checked.
 *   - A /tmp folder created by an earlier shell sometimes failed the same way while a fresh
 *     mkdtemp folder worked, so every run makes its own new mkdtemp dir.
 *
 * Nothing here prints book text: only page counts, sizes and command errors.
 *
 * Release: scripts/premium/release-pdfs.ts prints every revised premium book with each deploy and
 * overwrites member/<slug>.pdf in R2 in place; it makes no backup objects.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { prepareBookForMdbook } from "../builder/mdbook-runner";
import { markdownFiles } from "../diagrams/books";
import { inlineDiagramsInBook } from "../diagrams/inline";
import { UsageError, tail } from "./cli";

// The web reader's header, sidebar and chapter arrows, none of which belongs on paper.
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
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
// A --hide-image name is pasted into a double-quoted CSS attribute selector, so a quote,
// bracket or brace in it would break out of the rule.
const IMAGE_NAME_RE = /^[A-Za-z0-9._-]+$/;
const COVER_EXTS = [".svg", ".png", ".jpg"];
const ERROR_PAGE_MARKERS = ["ERR_FILE_NOT_FOUND", "couldn't be accessed"];
const USAGE =
  "usage: bun run scripts/premium/print-pdf.ts <slug> --out <file.pdf> [--books-dir <dir>] " +
  "[--cover <file.svg|.png|.jpg>] [--hide-image <basename>]... [--restrict]";
const REPO_ROOT = path.resolve(import.meta.dir, "../..");
// Repo-local like the web build's .build-tmp/, so the theme's ../shared-header.css and
// ../../apps/... resolve from the prepared copy exactly as they do in the web build.
const PREPARED_DIR = ".build-tmp-pdf";
// The latest pikepdf release on 2026-11-01; the one place the version is pinned.
export const PIKEPDF_VERSION = "10.17.0";
const FINISH_SCRIPT = path.join(import.meta.dir, "finish-pdf.py");
const WATERMARK_TEXT = "belajarcarabelajar.com";
const WATERMARK_DIV = '<div class="pdf-watermark"></div>';

export { UsageError };

export type Runner = (
  cmd: string[],
  opts: { cwd?: string; env?: Record<string, string | undefined> },
) => { exitCode: number; stdout: string; stderr: string };

export interface PrintArgs {
  slug: string;
  out: string;
  booksDir?: string;
  cover?: string;
  hideImages: string[];
  restrict: boolean;
}

export interface Deps {
  run: Runner;
  tmpRoot: string;
  repoRoot: string;
  mdbook: string;
  chromium: string;
  uv: string | null;
  log: (line: string) => void;
  error: (line: string) => void;
}

export function injectPrintStyle(html: string, hideImages: string[] = []): string {
  // Book layout asked for by the owner (2026-11-01): 25 mm margins, justified text, line
  // spacing 1.5, a 12 pt body, one font for text, headings and bold (the web stylesheet sets
  // a display font on headings and bold with !important; this later rule wins), and a page
  // number at the bottom centre (CSS page margin boxes, Chromium 131 and later).
  const rules = [
    '@page { size: A4; margin: 25mm; @bottom-center { content: counter(page); font-family: "Open Sans", sans-serif; font-size: 9pt; color: #555555; } }',
    `${READER_CHROME.join(", ")} { display: none !important; }`,
    'html, body, .content, .content main { font-family: "Open Sans", sans-serif !important; }',
    'h1, h2, h3, h4, h5, h6, strong, b { font-family: "Open Sans", sans-serif !important; }',
    "body { font-size: 12pt !important; line-height: 1.5 !important; }",
    ".content p, .content li, .content blockquote { text-align: justify !important; line-height: 1.5 !important; hyphens: auto; }",
    // The hanging indent of the reference list (books/shared-header.css) needs ragged lines; the
    // justify rule above would otherwise win.
    ".content .daftar-pustaka p { text-align: left !important; }",
    // No heading alone at the foot of a page, no figure, table or callout cut in two, and at
    // least 2 lines of a paragraph on each side of a break.
    "h1, h2, h3, h4 { break-after: avoid; }",
    "img, svg, table, pre, figure, .bukti { break-inside: avoid; }",
    "p, li { orphans: 2; widows: 2; }",
    // mdBook 0.5 opens every chapter on print.html with an <h1> of its SUMMARY title, and the
    // chapter's own ## title (equal to it, enforced by check-book-structure) follows: hide the twin.
    'main > h1:first-child + h2, div[style*="break-before"] + h1 + h2 { display: none !important; }',
    // An unwrapped code block wider than the 160 mm text column turned mdBook's overflow:auto
    // .content box into a scroll box, and its scrollbar printed over the right edge of every
    // page (100 Study Hacks, 2026-11-01). Wide content wraps instead, and no box scrolls.
    ".content, #content, .page, .page-wrapper, #page-wrapper, main, .table-wrapper { overflow: visible !important; }",
    "pre, pre code { white-space: pre-wrap !important; }",
    "a, code, td, th { overflow-wrap: anywhere !important; }",
    ...hideImages.map((name) => `img[src$="${name}"] { display: none !important; }`),
  ];
  const style = `<style>${rules.join("\n")}</style>`;
  if (html.includes(style)) return html;
  const at = html.indexOf("</head>");
  if (at < 0) throw new Error("print.html has no </head>, cannot add the print style");
  return html.slice(0, at) + style + html.slice(at);
}

let watermark: string | undefined;

// Outlines only: resvg turns the text into paths, so the site name never enters the PDF text
// layer, where copying and screen readers would meet it on every page.
export function watermarkSvg(): string {
  if (watermark !== undefined) return watermark;
  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">' +
    '<text x="500" y="500" text-anchor="middle" dominant-baseline="central" transform="rotate(-30 500 500)" ' +
    `font-family="Noto Sans" font-weight="700" font-size="80" fill="#000" fill-opacity="0.06">${WATERMARK_TEXT}</text></svg>`;
  // Unlike the share cards (GEMINI.md section 27), this SVG holds text, so resvg needs the
  // system fonts.
  const svg = new Resvg(source, { font: { loadSystemFonts: true, defaultFontFamily: "Noto Sans" } }).toString();
  // Without a usable font resvg draws nothing, and the PDF would ship without its watermark.
  if (!svg.includes("<path")) throw new Error("the watermark rendered no outlines; install the Noto Sans font");
  watermark = svg;
  return svg;
}

// Chromium repeats a position: fixed element on every printed page. print-color-adjust keeps the
// background image even where a print setting drops backgrounds.
export function injectWatermark(html: string, svg: string): string {
  if (html.includes(WATERMARK_DIV)) return html;
  const body = /<body\b[^>]*>/.exec(html);
  if (!body) throw new Error("print.html has no <body>, cannot add the watermark");
  const head = html.indexOf("</head>");
  if (head < 0 || head > body.index) throw new Error("print.html has no </head> before <body>, cannot add the watermark");
  const url = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
  const style =
    "<style>.pdf-watermark { position: fixed; inset: 0; pointer-events: none; z-index: 0; " +
    `background: url("${url}") center / 75% auto no-repeat; ` +
    "print-color-adjust: exact; -webkit-print-color-adjust: exact; }</style>";
  const afterBody = body.index + body[0].length;
  return html.slice(0, head) + style + html.slice(head, afterBody) + WATERMARK_DIV + html.slice(afterBody);
}

export function chromiumArgs(htmlPath: string, outPath: string, opts: { outline?: boolean } = {}): string[] {
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=20000",
    // PDF bookmarks from the headings, for the book pass; the cover page has none.
    ...(opts.outline ? ["--generate-pdf-document-outline"] : []),
    `--print-to-pdf=${outPath}`,
    `file://${htmlPath}`,
  ];
}

export function pdfLooksBroken(pages: number, text: string): string | null {
  const plain = text.replaceAll("’", "'");
  const marker = ERROR_PAGE_MARKERS.find((m) => plain.includes(m));
  if (marker) return `PDF is Chromium's error page (it contains "${marker}"), not the book`;
  if (pages <= 1) return `PDF has only ${pages} page(s); a book prints to more than 1 page`;
  return null;
}

export function parsePdfInfo(stdout: string): { pages: number; size: string } {
  const pages = /^Pages:\s+(\d+)\s*$/m.exec(stdout);
  const size = /^Page size:\s+(.+?)\s*$/m.exec(stdout);
  return { pages: pages ? Number(pages[1]) : 0, size: size ? size[1]! : "unknown" };
}

export function parseArgs(argv: string[]): PrintArgs {
  const positional: string[] = [];
  const hideImages: string[] = [];
  let out: string | undefined;
  let booksDir: string | undefined;
  let cover: string | undefined;
  let restrict = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--out" || arg === "--books-dir" || arg === "--cover" || arg === "--hide-image") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`${arg} needs a value`);
      if (arg === "--out") out = value;
      else if (arg === "--books-dir") booksDir = value;
      else if (arg === "--cover") cover = value;
      else if (IMAGE_NAME_RE.test(value)) hideImages.push(value);
      else {
        throw new UsageError(
          `invalid --hide-image ${JSON.stringify(value)}: use letters, digits, dot, dash and underscore only`,
        );
      }
    } else if (arg === "--restrict") {
      restrict = true;
    } else if (arg.startsWith("-")) {
      throw new UsageError(`unknown option ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  if (positional.length === 0) throw new UsageError("missing book slug");
  if (positional.length > 1) throw new UsageError(`expected one slug, got ${positional.length}`);
  const slug = positional[0]!;
  if (!SLUG_RE.test(slug)) throw new UsageError(`invalid slug ${JSON.stringify(slug)}`);
  if (out === undefined) throw new UsageError("missing --out <file.pdf>");
  if (!out.toLowerCase().endsWith(".pdf")) throw new UsageError("--out must end in .pdf");
  if (cover !== undefined && !COVER_EXTS.includes(path.extname(cover).toLowerCase())) {
    throw new UsageError("--cover must be a .svg, .png or .jpg file");
  }
  return { slug, out, booksDir, cover, hideImages, restrict };
}

const spawnRunner: Runner = (cmd, opts) => {
  const res = Bun.spawnSync(cmd, {
    cwd: opts.cwd,
    env: opts.env,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 300_000,
  });
  return {
    exitCode: res.exitCode ?? 1,
    stdout: res.stdout.toString(),
    stderr: res.stderr.toString(),
  };
};

function defaultDeps(): Deps {
  return {
    run: spawnRunner,
    tmpRoot: "/tmp",
    repoRoot: REPO_ROOT,
    mdbook: process.env.MDBOOK ?? path.join(os.homedir(), ".cargo/bin/mdbook"),
    chromium: process.env.CHROMIUM_PATH ?? "chromium",
    uv: Bun.which("uv"),
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  };
}

function siteNameCount(text: string): number {
  return text.toLowerCase().split(WATERMARK_TEXT).length - 1;
}

// finish-pdf.py reads the saved file back, so its one JSON line describes what was written.
function finishProblem(stdout: string, pages: number, restrict: boolean): string | null {
  let result: unknown;
  try {
    result = JSON.parse(stdout.trim().split("\n").pop() ?? "");
  } catch {
    result = null;
  }
  if (typeof result !== "object" || result === null) return "finish-pdf printed no result line";
  const { pages: got, outline, encrypted } = result as Record<string, unknown>;
  if (got !== pages) return `the finished PDF has ${String(got)} pages, expected ${pages}`;
  if (typeof outline !== "number" || outline < 1) return "the finished PDF has no bookmarks";
  if (restrict && encrypted !== true) {
    return "--restrict was asked but the finished PDF is not encrypted; refusing to ship an unrestricted file";
  }
  if (!restrict && encrypted !== false) return "the finished PDF is encrypted although --restrict was not given";
  return null;
}

export async function main(argv: string[], deps: Deps = defaultDeps()): Promise<number> {
  let args: PrintArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    deps.error(`print-pdf: ${err.message}\n${USAGE}`);
    return 2;
  }
  const booksDir = path.resolve(args.booksDir ?? path.join(deps.repoRoot, "books"));
  const bookDir = path.join(booksDir, args.slug);
  if (!fs.existsSync(bookDir)) {
    deps.error(`print-pdf: book folder not found: ${bookDir} (run scripts/premium-sync.ts first?)`);
    return 1;
  }
  const cover = args.cover === undefined ? undefined : path.resolve(args.cover);
  if (cover !== undefined && !(fs.existsSync(cover) && fs.statSync(cover).isFile())) {
    deps.error(`print-pdf: cover file not found: ${cover}`);
    return 1;
  }
  // Checked before any work: every PDF goes through the finishing step, so without uv a print
  // could only end unfinished, and never as an unrestricted file when --restrict was asked.
  if (deps.uv === null) {
    deps.error("print-pdf: uv not found; it runs the pikepdf finishing step (install it: sudo pacman -S uv)");
    return 1;
  }
  const out = path.resolve(args.out);
  const preparedBooks = path.join(deps.repoRoot, PREPARED_DIR);
  const work = fs.mkdtempSync(path.join(deps.tmpRoot, `dawnbook-print-${args.slug}-`));
  try {
    const book = { booksDir, slug: args.slug, preparedBooks };
    const opts = { cover, hideImages: args.hideImages, restrict: args.restrict, uv: deps.uv };
    return await printBook(book, work, out, opts, deps);
  } catch (err) {
    deps.error(`print-pdf: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(path.join(preparedBooks, args.slug), { recursive: true, force: true });
  }
}

async function printBook(
  book: { booksDir: string; slug: string; preparedBooks: string },
  temp: string,
  out: string,
  opts: { cover?: string; hideImages: string[]; restrict: boolean; uv: string },
  deps: Deps,
): Promise<number> {
  // The cover goes first, so a cover that does not fit one page fails before the slow book build.
  const coverPdf = opts.cover === undefined ? undefined : printCover(opts.cover, temp, deps);
  if (coverPdf === null) return 1;
  // The web build's own preparation, so a diagram or a build-time decoration cannot reach one
  // output only. A diagram without a cached SVG throws here, with the web build's message.
  await prepareBookForMdbook(book.booksDir, book.preparedBooks, book.slug);
  const prepared = path.join(book.preparedBooks, book.slug);
  inlineDiagramsInBook(prepared, path.join(book.booksDir, book.slug), deps.repoRoot);
  const siteNamesInBook = markdownFiles(path.join(prepared, "src")).reduce(
    (n, file) => n + siteNameCount(fs.readFileSync(file, "utf8")),
    0,
  );
  // book.toml reaches the shared CSS through ../../apps/..., which mdBook resolves from the -d
  // folder. Building two levels inside the temp dir keeps those writes inside it; a -d folder
  // directly under /tmp made mdBook try to create /apps and fail (2026-11-01).
  const work = path.join(temp, "build", book.slug);
  const build = deps.run([deps.mdbook, "build", prepared, "-d", work], {
    env: { ...process.env, MDBOOK_OUTPUT__HTML__PRINT__ENABLE: "true" },
  });
  if (build.exitCode !== 0) {
    deps.error(`print-pdf: mdbook build failed (exit ${build.exitCode})\n${tail(build.stderr)}`);
    return 1;
  }
  // mdBook also copies the Dawnbook reader script (paywall, progress, redirects) one level up,
  // and print.html loads it from there. In Chromium its redirect replaced the page with a
  // one-page ERR_FILE_NOT_FOUND print (measured 2026-11-01), so the PDF is printed without it.
  fs.rmSync(path.join(path.dirname(work), "shared-script.js"), { force: true });
  const html = path.join(work, "print.html");
  if (!fs.existsSync(html)) {
    deps.error(`print-pdf: mdbook wrote no print.html in ${work}`);
    return 1;
  }
  const styled = injectPrintStyle(fs.readFileSync(html, "utf8"), opts.hideImages);
  fs.writeFileSync(html, injectWatermark(styled, watermarkSvg()));

  const pdf = path.join(work, "book.pdf");
  const chrome = deps.run([deps.chromium, ...chromiumArgs(html, pdf, { outline: true })], { cwd: work });
  if (chrome.exitCode !== 0 || !fs.existsSync(pdf)) {
    deps.error(`print-pdf: chromium failed (exit ${chrome.exitCode})\n${tail(chrome.stderr)}`);
    return 1;
  }

  const info = deps.run(["pdfinfo", pdf], {});
  if (info.exitCode !== 0) {
    deps.error(`print-pdf: pdfinfo failed (exit ${info.exitCode})\n${tail(info.stderr)}`);
    return 1;
  }
  const { pages, size } = parsePdfInfo(info.stdout);
  const text = deps.run(["pdftotext", pdf, "-"], {});
  if (text.exitCode !== 0) {
    deps.error(`print-pdf: pdftotext failed (exit ${text.exitCode})`);
    return 1;
  }
  const broken = pdfLooksBroken(pages, text.stdout);
  if (broken) {
    deps.error(`print-pdf: ${broken}`);
    return 1;
  }

  // --no-project: a pyproject.toml in a parent folder must not turn this into a project sync.
  const final = path.join(temp, "final.pdf");
  const finish = deps.run(
    [
      opts.uv,
      "run",
      "--no-project",
      "--quiet",
      "--with",
      `pikepdf==${PIKEPDF_VERSION}`,
      "python3",
      "-I",
      FINISH_SCRIPT,
      pdf,
      final,
      ...(coverPdf === undefined ? [] : ["--cover", coverPdf]),
      ...(opts.restrict ? ["--restrict"] : []),
    ],
    {},
  );
  if (finish.exitCode !== 0 || !fs.existsSync(final)) {
    deps.error(`print-pdf: finish-pdf failed (exit ${finish.exitCode})\n${tail(finish.stderr)}`);
    return 1;
  }
  const total = pages + (coverPdf === undefined ? 0 : 1);
  const problem = finishProblem(finish.stdout, total, opts.restrict);
  if (problem) {
    deps.error(`print-pdf: ${problem}`);
    return 1;
  }

  // Book pages only: with a cover, page 1 is the cover, whose own artwork may name the site.
  // pdftotext reads a copy-restricted PDF (probe 2026-11-01).
  const finalText = deps.run(["pdftotext", ...(coverPdf === undefined ? [] : ["-f", "2"]), final, "-"], {});
  if (finalText.exitCode !== 0) {
    deps.error(`print-pdf: pdftotext failed on the finished PDF (exit ${finalText.exitCode})`);
    return 1;
  }
  const siteNamesInPdf = siteNameCount(finalText.stdout);
  if (siteNamesInPdf > siteNamesInBook) {
    deps.error(
      `print-pdf: watermark leaked into the text layer: the PDF text names ${WATERMARK_TEXT} ` +
        `${siteNamesInPdf} times, the book text ${siteNamesInBook} times`,
    );
    return 1;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(final, out);
  deps.log(`print-pdf: wrote ${out}: ${total} pages, page size ${size}${opts.restrict ? ", copy restricted" : ""}`);
  return 0;
}

// The cover gets a page of its own with no margin: placed inside chapter 1 it flowed with the
// text and left page 1 almost empty.
function printCover(cover: string, temp: string, deps: Deps): string | null {
  const dir = path.join(temp, "cover");
  fs.mkdirSync(dir);
  // Copied, so Chromium reads it from the fresh temp dir (see the measured traps above).
  const image = `cover${path.extname(cover).toLowerCase()}`;
  fs.copyFileSync(cover, path.join(dir, image));
  const html = path.join(dir, "cover.html");
  fs.writeFileSync(html, coverPage(image));
  const pdf = path.join(temp, "cover.pdf");
  const chrome = deps.run([deps.chromium, ...chromiumArgs(html, pdf)], { cwd: dir });
  if (chrome.exitCode !== 0 || !fs.existsSync(pdf)) {
    deps.error(`print-pdf: chromium failed on the cover (exit ${chrome.exitCode})\n${tail(chrome.stderr)}`);
    return null;
  }
  const info = deps.run(["pdfinfo", pdf], {});
  if (info.exitCode !== 0) {
    deps.error(`print-pdf: pdfinfo failed on the cover (exit ${info.exitCode})\n${tail(info.stderr)}`);
    return null;
  }
  const { pages } = parsePdfInfo(info.stdout);
  if (pages !== 1) {
    deps.error(`print-pdf: the cover printed to ${pages} pages; it must fill exactly 1 page`);
    return null;
  }
  // Chromium's one-page ERR_FILE_NOT_FOUND print passes the page check, so read the text too.
  const text = deps.run(["pdftotext", pdf, "-"], {});
  const plain = text.stdout.replaceAll("’", "'");
  const marker = ERROR_PAGE_MARKERS.find((m) => plain.includes(m));
  if (text.exitCode !== 0 || marker) {
    deps.error(`print-pdf: the cover printed as Chromium's error page${marker ? ` ("${marker}")` : ""}, not the image`);
    return null;
  }
  return pdf;
}

function coverPage(image: string): string {
  return (
    '<!doctype html><html><head><meta charset="utf-8"><style>@page { size: A4; margin: 0; } ' +
    "html, body { margin: 0; padding: 0; } img { display: block; width: 210mm; height: 297mm; " +
    `object-fit: cover; }</style></head><body><img src="${image}"></body></html>`
  );
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
