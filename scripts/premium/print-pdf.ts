#!/usr/bin/env bun
/**
 * Prints a premium book to the A4 PDF sold in the store.
 *
 * Usage:
 *   bun run scripts/premium/print-pdf.ts <slug> --out <file.pdf> [--books-dir <dir>]
 *     [--cover <file.svg|.png|.jpg>] [--hide-image <basename>]...
 *
 * --books-dir defaults to books/ of this repo, which scripts/premium-sync.ts fills.
 * --cover prints that image alone as page 1, filling the A4 page with no margin.
 * --hide-image (repeatable) hides every <img> whose src ends in <basename>, for a cover that
 *   already sits inside chapter 1.
 * Why (owner, 2026-11-01): the web header and fonts leaked into the PDF, and a cover inside
 *   chapter 1 flowed with the text and left page 1 almost empty.
 * Exit codes: 0 success, 1 failure, 2 usage error.
 *
 * Steps:
 *   1. With --cover: the image is copied into <temp>/cover next to a one-image cover.html,
 *      Chromium prints that to <temp>/cover.pdf, and pdfinfo must report exactly 1 page.
 *   2. `mdbook build books/<slug> -d <fresh mkdtemp dir under /tmp>/build/<slug>` (two levels
 *      deep, because book.toml reaches shared CSS through ../../apps/...) with
 *      MDBOOK_OUTPUT__HTML__PRINT__ENABLE=true. The template turns print.html off, and
 *      book.toml must never be edited (GEMINI.md section 1), so the env var switches it on.
 *   3. Insert one print <style> before </head> of the built print.html: `@page { size: A4;
 *      margin: 15mm; }`, the reader chrome (menu bar, sidebar, chapter arrows) hidden, Open Sans
 *      as the one body font, and the --hide-image rules.
 *   4. Headless Chromium prints that page to book.pdf, run with cwd set to the build dir.
 *   5. pdfinfo must report more than 1 page and pdftotext must not show Chromium's error page.
 *   6. With --cover: `pdfunite cover.pdf book.pdf final.pdf` puts the cover in front.
 *   7. The PDF is copied to --out and the temp dir is removed.
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
 * Uploading the PDF to R2 is a separate step that needs the owner's approval. Back up the
 * old object first, then:
 *   cf r2 objects put member/<slug>.pdf --bucket-name bcb-admin-media --file <pdf> --content-type application/pdf
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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
  "[--cover <file.svg|.png|.jpg>] [--hide-image <basename>]...";
const REPO_ROOT = path.resolve(import.meta.dir, "../..");

export class UsageError extends Error {}

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
}

export interface Deps {
  run: Runner;
  tmpRoot: string;
  mdbook: string;
  chromium: string;
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

export function chromiumArgs(htmlPath: string, outPath: string): string[] {
  return [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=20000",
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
  return { slug, out, booksDir, cover, hideImages };
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
    mdbook: process.env.MDBOOK ?? path.join(os.homedir(), ".cargo/bin/mdbook"),
    chromium: process.env.CHROMIUM_PATH ?? "chromium",
    log: (line) => console.log(line),
    error: (line) => console.error(line),
  };
}

function tail(text: string, lines = 20): string {
  return text.trimEnd().split("\n").slice(-lines).join("\n");
}

export function main(argv: string[], deps: Deps = defaultDeps()): number {
  let args: PrintArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    if (!(err instanceof UsageError)) throw err;
    deps.error(`print-pdf: ${err.message}\n${USAGE}`);
    return 2;
  }
  const bookDir = path.resolve(args.booksDir ?? path.join(REPO_ROOT, "books"), args.slug);
  if (!fs.existsSync(bookDir)) {
    deps.error(`print-pdf: book folder not found: ${bookDir} (run scripts/premium-sync.ts first?)`);
    return 1;
  }
  const cover = args.cover === undefined ? undefined : path.resolve(args.cover);
  if (cover !== undefined && !(fs.existsSync(cover) && fs.statSync(cover).isFile())) {
    deps.error(`print-pdf: cover file not found: ${cover}`);
    return 1;
  }
  const out = path.resolve(args.out);
  const work = fs.mkdtempSync(path.join(deps.tmpRoot, `dawnbook-print-${args.slug}-`));
  try {
    return printBook(bookDir, work, out, { cover, hideImages: args.hideImages }, deps);
  } catch (err) {
    deps.error(`print-pdf: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

function printBook(
  bookDir: string,
  temp: string,
  out: string,
  opts: { cover?: string; hideImages: string[] },
  deps: Deps,
): number {
  // The cover goes first, so a cover that does not fit one page fails before the slow book build.
  const coverPdf = opts.cover === undefined ? undefined : printCover(opts.cover, temp, deps);
  if (coverPdf === null) return 1;
  // book.toml reaches the shared CSS through ../../apps/..., which mdBook resolves from the -d
  // folder. Building two levels inside the temp dir keeps those writes inside it; a -d folder
  // directly under /tmp made mdBook try to create /apps and fail (2026-11-01).
  const work = path.join(temp, "build", path.basename(bookDir));
  const build = deps.run([deps.mdbook, "build", bookDir, "-d", work], {
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
  fs.writeFileSync(html, injectPrintStyle(fs.readFileSync(html, "utf8"), opts.hideImages));

  const pdf = path.join(work, "book.pdf");
  const chrome = deps.run([deps.chromium, ...chromiumArgs(html, pdf)], { cwd: work });
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

  let result = pdf;
  let total = pages;
  if (coverPdf !== undefined) {
    const merged = path.join(temp, "final.pdf");
    const unite = deps.run(["pdfunite", coverPdf, pdf, merged], {});
    if (unite.exitCode !== 0 || !fs.existsSync(merged)) {
      deps.error(`print-pdf: pdfunite failed (exit ${unite.exitCode})\n${tail(unite.stderr)}`);
      return 1;
    }
    result = merged;
    total = pages + 1;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(result, out);
  deps.log(`print-pdf: wrote ${out}: ${total} pages, page size ${size}`);
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

if (import.meta.main) process.exit(main(process.argv.slice(2)));
