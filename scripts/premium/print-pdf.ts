#!/usr/bin/env bun
/**
 * Prints a premium book to the A4 PDF sold in the store.
 *
 * Usage:
 *   bun run scripts/premium/print-pdf.ts <slug> --out <file.pdf> [--books-dir <dir>]
 *
 * --books-dir defaults to books/ of this repo, which scripts/premium-sync.ts fills.
 * Exit codes: 0 success, 1 failure, 2 usage error.
 *
 * Steps:
 *   1. `mdbook build books/<slug> -d <fresh mkdtemp dir under /tmp>` with
 *      MDBOOK_OUTPUT__HTML__PRINT__ENABLE=true. The template turns print.html off, and
 *      book.toml must never be edited (GEMINI.md section 1), so the env var switches it on.
 *   2. Insert `@page { size: A4; margin: 15mm; }` before </head> of the built print.html.
 *   3. Headless Chromium prints that page to a PDF, run with cwd set to the temp dir.
 *   4. pdfinfo must report more than 1 page and pdftotext must not show Chromium's error page.
 *   5. The PDF is copied to --out and the temp dir is removed.
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

const A4_RULE = "<style>@page { size: A4; margin: 15mm; }</style>";
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const ERROR_PAGE_MARKERS = ["ERR_FILE_NOT_FOUND", "couldn't be accessed"];
const USAGE = "usage: bun run scripts/premium/print-pdf.ts <slug> --out <file.pdf> [--books-dir <dir>]";
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
}

export interface Deps {
  run: Runner;
  tmpRoot: string;
  mdbook: string;
  chromium: string;
  log: (line: string) => void;
  error: (line: string) => void;
}

export function injectA4(html: string): string {
  if (html.includes(A4_RULE)) return html;
  const at = html.indexOf("</head>");
  if (at < 0) throw new Error("print.html has no </head>, cannot add the A4 page rule");
  return html.slice(0, at) + A4_RULE + html.slice(at);
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
  let out: string | undefined;
  let booksDir: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--out" || arg === "--books-dir") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`${arg} needs a value`);
      if (arg === "--out") out = value;
      else booksDir = value;
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
  return { slug, out, booksDir };
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
  const out = path.resolve(args.out);
  const work = fs.mkdtempSync(path.join(deps.tmpRoot, `dawnbook-print-${args.slug}-`));
  try {
    return printBook(bookDir, work, out, deps);
  } catch (err) {
    deps.error(`print-pdf: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

function printBook(bookDir: string, work: string, out: string, deps: Deps): number {
  const build = deps.run([deps.mdbook, "build", bookDir, "-d", work], {
    env: { ...process.env, MDBOOK_OUTPUT__HTML__PRINT__ENABLE: "true" },
  });
  if (build.exitCode !== 0) {
    deps.error(`print-pdf: mdbook build failed (exit ${build.exitCode})\n${tail(build.stderr)}`);
    return 1;
  }
  const html = path.join(work, "print.html");
  if (!fs.existsSync(html)) {
    deps.error(`print-pdf: mdbook wrote no print.html in ${work}`);
    return 1;
  }
  fs.writeFileSync(html, injectA4(fs.readFileSync(html, "utf8")));

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

  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.copyFileSync(pdf, out);
  deps.log(`print-pdf: wrote ${out}: ${pages} pages, page size ${size}`);
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
