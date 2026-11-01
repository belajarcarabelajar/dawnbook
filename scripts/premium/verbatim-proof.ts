#!/usr/bin/env bun
/**
 * Proves that an mdBook book folder holds the text of a PDF word for word.
 *
 * Usage:
 *   bun run scripts/premium/verbatim-proof.ts (--pdf <file.pdf> | --text <file.txt>) --book <bookDir> [--report <out.md>]
 *
 * Exit codes: 0 no differences, 1 at least one hunk, 2 usage or I/O error.
 * Output never shows more than 20 tokens of one hunk, because the books are paid content.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_HUNK_TOKENS = 20;
// The report file keeps every hunk; stdout stops here so a wrong PDF cannot stream a whole book.
const MAX_STDOUT_HUNKS = 100;
const RUNNING_MIN_PAGES = 3;
const EDGE_LINES = 2;

class UsageError extends Error {}

export interface BoilerplateLine {
  line: string;
  kind: "page-number" | "running";
  pages: number[];
}

export interface Hunk {
  kind: "missing in book" | "extra in book" | "changed";
  pdfTokens: string[];
  bookTokens: string[];
  page: number;
}

export interface BulletGlyph {
  glyph: string;
  pages: number[];
  count: number;
}

export interface ProofResult {
  pdfTokens: number;
  bookTokens: number;
  hunks: Hunk[];
  boilerplate: BoilerplateLine[];
  boilerplateLines: number;
  bullets: BulletGlyph[];
  bulletCount: number;
}

const PAGE_NUMBER = /^(?:\d+|(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})|(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3})|halaman\s+\d+)$/i;

function isPageNumber(trimmed: string): boolean {
  if (trimmed === "") return false;
  // The roman alternatives are case-locked: "Vi" or "iV" are not page numbers.
  if (/^[ivxlIVXL]+$/.test(trimmed) && trimmed !== trimmed.toLowerCase() && trimmed !== trimmed.toUpperCase()) return false;
  return PAGE_NUMBER.test(trimmed);
}

export function tokenize(text: string): string[] {
  return text.normalize("NFKC").split(/\s+/u).filter((t) => t !== "");
}

/** Removes page numbers and running headers or footers, returning the page texts that remain. */
export function stripBoilerplate(pages: string[]): { pages: string[][]; boilerplate: BoilerplateLine[]; removed: number } {
  const lines = pages.map((p) => p.split(/\r?\n/));
  const drop = lines.map((ls) => ls.map(() => false));
  const found = new Map<string, BoilerplateLine>();
  const note = (line: string, kind: BoilerplateLine["kind"], page: number) => {
    const key = `${kind}\u0000${line}`;
    const entry = found.get(key) ?? { line, kind, pages: [] };
    if (!entry.pages.includes(page)) entry.pages.push(page);
    found.set(key, entry);
  };

  lines.forEach((ls, p) => {
    ls.forEach((l, i) => {
      const t = l.trim();
      if (isPageNumber(t)) {
        drop[p]![i] = true;
        note(t, "page-number", p + 1);
      }
    });
  });

  // Edge positions are taken after page numbers are gone, so a footer above the page number still counts.
  const edgeIndexes = lines.map((ls, p) => {
    const content = ls.map((l, i) => ({ t: l.trim(), i })).filter((x) => x.t !== "" && !drop[p]![x.i]);
    const edges = new Set<number>();
    content.slice(0, EDGE_LINES).forEach((x) => edges.add(x.i));
    content.slice(-EDGE_LINES).forEach((x) => edges.add(x.i));
    return edges;
  });
  const edgePages = new Map<string, Set<number>>();
  edgeIndexes.forEach((edges, p) => {
    for (const i of edges) {
      const t = lines[p]![i]!.trim();
      const set = edgePages.get(t) ?? new Set<number>();
      set.add(p);
      edgePages.set(t, set);
    }
  });
  edgeIndexes.forEach((edges, p) => {
    for (const i of edges) {
      const t = lines[p]![i]!.trim();
      if ((edgePages.get(t)?.size ?? 0) >= RUNNING_MIN_PAGES) {
        drop[p]![i] = true;
        note(t, "running", p + 1);
      }
    }
  });

  const removed = drop.reduce((n, ds) => n + ds.filter(Boolean).length, 0);
  const kept = lines.map((ls, p) => ls.filter((_, i) => !drop[p]![i]));
  return { pages: kept, boilerplate: [...found.values()], removed };
}

// The Markdown side writes these as unordered list markers, which stripMarkdown removes.
const BULLET = /^(\s*)(?:([\u2022\u25CF\u25AA\u25E6\u25A0\u25A1\u27A2\u25BA\u2713\u2714\u2756\u25C6])\uFE0F?\s*|([-\u2013])\s+)/u;

/** Removes one leading bullet glyph per line and records which glyphs were removed on which pages. */
export function stripBullets(pages: string[][]): { pages: string[][]; bullets: BulletGlyph[]; count: number } {
  const found = new Map<string, BulletGlyph>();
  let count = 0;
  const kept = pages.map((ls, p) =>
    ls.map((l) => {
      const m = BULLET.exec(l);
      if (!m) return l;
      const glyph = m[2] ?? m[3]!;
      const entry = found.get(glyph) ?? { glyph, pages: [], count: 0 };
      entry.count++;
      if (!entry.pages.includes(p + 1)) entry.pages.push(p + 1);
      found.set(glyph, entry);
      count++;
      return m[1] + l.slice(m[0].length);
    }),
  );
  return { pages: kept, bullets: [...found.values()], count };
}

/** Strips Markdown syntax only, so the words a reader sees are what remains. */
export function stripMarkdown(md: string): string {
  const withoutComments = md.replace(/<!--[\s\S]*?-->/g, " ");
  const out: string[] = [];
  for (const raw of withoutComments.split(/\r?\n/)) {
    let line = raw;
    if (/^\s*<\/?div\b[^>]*>\s*$/i.test(line)) continue;
    if (/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line) || /^\s*\|\s*:?-+:?\s*\|\s*$/.test(line)) continue;
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) continue;
    line = line.replace(/^\s{0,3}#{1,6}(\s+|$)/, "").replace(/\s+#+\s*$/, "");
    line = line.replace(/^\s*(>\s?)+/, "");
    // Ordered markers stay: the PDF prints the same number in front of the item.
    line = line.replace(/^\s*[-*+]\s+/, "");
    if (/^\s*\|/.test(line)) line = line.replace(/\|/g, " ");
    line = line.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
    line = line.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
    line = line.replace(/`+/g, "");
    line = line.replace(/(^|[\s(\["'])[*_]+(?=\S)/g, "$1");
    line = line.replace(/(?<=\S)[*_]+(?=$|[\s.,;:!?)\]"'])/g, "");
    out.push(line);
  }
  return out.join("\n");
}

export function readBookChapters(bookDir: string): string[] {
  const srcDir = path.join(bookDir, "src");
  const summaryPath = path.join(srcDir, "SUMMARY.md");
  if (!fs.existsSync(summaryPath)) throw new Error(`SUMMARY.md not found: ${summaryPath}`);
  const summary = fs.readFileSync(summaryPath, "utf8");
  const files: string[] = [];
  for (const m of summary.matchAll(/\]\(([^)\s]+?\.md)(?:#[^)]*)?\)/g)) {
    const rel = decodeURIComponent(m[1]!);
    if (!files.includes(rel)) files.push(rel);
  }
  if (files.length === 0) throw new Error(`no chapter links in ${summaryPath}`);
  return files.map((rel) => {
    const full = path.join(srcDir, rel);
    if (!fs.existsSync(full)) throw new Error(`chapter listed in SUMMARY.md not found: ${full}`);
    return fs.readFileSync(full, "utf8");
  });
}

function diffTokens(a: string[], b: string[]): Array<{ kind: "a" | "c" | "d"; a1: number; a2: number; b1: number; b2: number }> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "verbatim-proof-"));
  try {
    const fa = path.join(dir, "pdf.tok");
    const fb = path.join(dir, "book.tok");
    fs.writeFileSync(fa, a.length ? a.join("\n") + "\n" : "");
    fs.writeFileSync(fb, b.length ? b.join("\n") + "\n" : "");
    const r = Bun.spawnSync(["diff", fa, fb], { stdout: "pipe", stderr: "pipe" });
    if (r.exitCode !== 0 && r.exitCode !== 1) throw new Error(`diff failed: ${r.stderr.toString().trim()}`);
    const out: Array<{ kind: "a" | "c" | "d"; a1: number; a2: number; b1: number; b2: number }> = [];
    for (const line of r.stdout.toString().split("\n")) {
      const m = /^(\d+)(?:,(\d+))?([acd])(\d+)(?:,(\d+))?$/.exec(line);
      if (!m) continue;
      const a1 = Number(m[1]);
      const b1 = Number(m[4]);
      out.push({ kind: m[3] as "a" | "c" | "d", a1, a2: m[2] ? Number(m[2]) : a1, b1, b2: m[5] ? Number(m[5]) : b1 });
    }
    return out;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function proveVerbatim(pdfPages: string[], chapters: string[]): ProofResult {
  const stripped = stripBoilerplate(pdfPages);
  const { boilerplate, removed } = stripped;
  const { pages, bullets, count: bulletCount } = stripBullets(stripped.pages);
  const pdfTokens: string[] = [];
  const pdfPageOf: number[] = [];
  pages.forEach((ls, p) => {
    for (const t of tokenize(ls.join("\n"))) {
      pdfTokens.push(t);
      pdfPageOf.push(p + 1);
    }
  });
  const bookTokens = tokenize(chapters.map(stripMarkdown).join("\n"));
  const pageAt = (oneBased: number) => pdfPageOf[Math.min(Math.max(oneBased, 1), pdfPageOf.length) - 1] ?? 1;

  const hunks: Hunk[] = diffTokens(pdfTokens, bookTokens).map((h) => {
    if (h.kind === "d") {
      return { kind: "missing in book", pdfTokens: pdfTokens.slice(h.a1 - 1, h.a2), bookTokens: [], page: pageAt(h.a1) };
    }
    if (h.kind === "a") {
      return { kind: "extra in book", pdfTokens: [], bookTokens: bookTokens.slice(h.b1 - 1, h.b2), page: pageAt(h.a1) };
    }
    return {
      kind: "changed",
      pdfTokens: pdfTokens.slice(h.a1 - 1, h.a2),
      bookTokens: bookTokens.slice(h.b1 - 1, h.b2),
      page: pageAt(h.a1),
    };
  });
  return {
    pdfTokens: pdfTokens.length,
    bookTokens: bookTokens.length,
    hunks,
    boilerplate,
    boilerplateLines: removed,
    bullets,
    bulletCount,
  };
}

function clip(tokens: string[], max: number): string {
  const shown = tokens.slice(0, max).join(" ");
  return tokens.length > max ? `${shown} ... (+${tokens.length - max} tokens)` : shown;
}

export function formatHunk(h: Hunk): string {
  const head = `${h.kind} (pdf page ${h.page})`;
  if (h.kind === "missing in book") return `${head}: ${clip(h.pdfTokens, MAX_HUNK_TOKENS)}`;
  if (h.kind === "extra in book") return `${head}: ${clip(h.bookTokens, MAX_HUNK_TOKENS)}`;
  const half = MAX_HUNK_TOKENS / 2;
  return `${head}: pdf [${clip(h.pdfTokens, half)}] book [${clip(h.bookTokens, half)}]`;
}

function summaryLine(r: ProofResult): string {
  return `tokens pdf=${r.pdfTokens} book=${r.bookTokens} hunks=${r.hunks.length} boilerplate_lines=${r.boilerplateLines}`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function renderReport(r: ProofResult, source: string, bookDir: string): string {
  const out = [
    "# Verbatim proof report",
    "",
    `- Source: \`${source}\``,
    `- Book: \`${bookDir}\``,
    `- Result: ${r.hunks.length === 0 ? "identical" : "differences found"}`,
    `- \`${summaryLine(r)}\``,
    "",
    "## Removed boilerplate",
    "",
  ];
  if (r.boilerplate.length === 0 && r.bullets.length === 0) out.push("None.");
  for (const b of r.boilerplate) out.push(`- \`${b.line}\`: ${b.kind}, ${plural(b.pages.length, "page")} (${b.pages.join(", ")})`);
  for (const b of r.bullets) {
    out.push(`- \`${b.glyph}\`: ${plural(b.count, "bullet glyph")} on ${b.pages.length === 1 ? "page" : "pages"} ${b.pages.join(", ")}`);
  }
  out.push("", "## Hunks", "");
  if (r.hunks.length === 0) out.push("None.");
  r.hunks.forEach((h, i) => out.push(`${i + 1}. ${formatHunk(h)}`));
  return out.join("\n") + "\n";
}

interface Args {
  pdf?: string;
  text?: string;
  book?: string;
  report?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    const key = ({ "--pdf": "pdf", "--text": "text", "--book": "book", "--report": "report" } as const)[flag as "--pdf"];
    const value = argv[i + 1];
    if (!key || value === undefined || value.startsWith("--")) throw new UsageError(`bad argument: ${flag}`);
    if (args[key] !== undefined) throw new UsageError(`repeated argument: ${flag}`);
    args[key] = value;
    i++;
  }
  if ((args.pdf === undefined) === (args.text === undefined)) throw new UsageError("give exactly one of --pdf or --text");
  if (args.book === undefined) throw new UsageError("--book is required");
  return args;
}

function readPdfPages(args: Args): string[] {
  if (args.text !== undefined) {
    if (!fs.existsSync(args.text)) throw new Error(`text file not found: ${args.text}`);
    return fs.readFileSync(args.text, "utf8").split("\f");
  }
  if (!fs.existsSync(args.pdf!)) throw new Error(`PDF not found: ${args.pdf}`);
  const r = Bun.spawnSync(["pdftotext", "-layout", args.pdf!, "-"], { stdout: "pipe", stderr: "pipe" });
  if (r.exitCode !== 0) throw new Error(`pdftotext failed (exit ${r.exitCode}): ${r.stderr.toString().trim()}`);
  return r.stdout.toString().split("\f");
}

export function main(argv: string[]): number {
  try {
    const args = parseArgs(argv);
    const pages = readPdfPages(args);
    if (!fs.existsSync(args.book!)) throw new Error(`book folder not found: ${args.book}`);
    const chapters = readBookChapters(args.book!);
    const result = proveVerbatim(pages, chapters);

    // Page numbers are one per page, so stdout gives their count and the report lists them.
    const pageNumbers = result.boilerplate.filter((b) => b.kind === "page-number");
    if (pageNumbers.length > 0) console.log(`boilerplate: ${plural(pageNumbers.length, "page-number line")} (listed in --report)`);
    if (result.bulletCount > 0) console.log(`boilerplate: ${plural(result.bulletCount, "bullet glyph")} (listed in --report)`);
    for (const b of result.boilerplate.filter((x) => x.kind === "running")) {
      console.log(`boilerplate: ${b.line} (${plural(b.pages.length, "page")})`);
    }
    result.hunks.slice(0, MAX_STDOUT_HUNKS).forEach((h, i) => console.log(`hunk ${i + 1}: ${formatHunk(h)}`));
    if (result.hunks.length > MAX_STDOUT_HUNKS) {
      console.log(`... ${result.hunks.length - MAX_STDOUT_HUNKS} more hunks, see --report`);
    }
    if (args.report !== undefined) {
      fs.mkdirSync(path.dirname(path.resolve(args.report)), { recursive: true });
      fs.writeFileSync(args.report, renderReport(result, args.pdf ?? args.text!, args.book!));
    }
    console.log(summaryLine(result));
    return result.hunks.length === 0 ? 0 : 1;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(err instanceof UsageError ? `usage error: ${msg}\n${USAGE}` : `error: ${msg}`);
    return 2;
  }
}

const USAGE =
  "usage: bun run scripts/premium/verbatim-proof.ts (--pdf <file.pdf> | --text <file.txt>) --book <bookDir> [--report <out.md>]";

if (import.meta.main) process.exit(main(process.argv.slice(2)));
