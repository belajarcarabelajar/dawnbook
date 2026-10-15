import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import type { Browser } from "puppeteer";
import { listBooks, markdownFiles, toPosix } from "./diagrams/books";
import { cachePath, diagramId, diagramKey, loadRenderConfig } from "./diagrams/cache";
import { findDiagramBlocks } from "./diagrams/extract";
import { finalizeSvg, readAccText, type AccText } from "./diagrams/postprocess";

export interface RenderOptions {
  book?: string;
  check?: boolean;
  prune?: boolean;
  force?: boolean;
  executablePath?: string;
}

export interface RenderResult {
  rendered: string[];
  cached: number;
  missing: string[];
  orphans: string[];
  pruned: string[];
}

export class DiagramRenderError extends Error {
  constructor(
    readonly problems: string[],
    readonly result: RenderResult,
  ) {
    super(problems.join("\n"));
    this.name = "DiagramRenderError";
  }
}

interface Job {
  bookDir: string;
  key: string;
  source: string;
  acc: AccText;
  where: string;
}

interface BookScan {
  slug: string;
  bookDir: string;
  keys: Set<string>;
  firstUse: Job[];
}

const DEFAULT_EXECUTABLE = "/usr/bin/chromium";
const CONCURRENCY = 3;

function scanBook(root: string, booksDir: string, slug: string, problems: string[]): BookScan {
  const bookDir = join(booksDir, slug);
  const scan: BookScan = { slug, bookDir, keys: new Set(), firstUse: [] };
  for (const file of markdownFiles(join(bookDir, "src"))) {
    const rel = toPosix(relative(booksDir, file));
    for (const block of findDiagramBlocks(readFileSync(file, "utf8"))) {
      const where = `${rel}:${block.startLine}`;
      const acc = readAccText(block.source);
      if (!acc) {
        problems.push(`${where} diagram has no accTitle/accDescr; add both lines (in Indonesian) inside the mermaid block`);
        continue;
      }
      const key = diagramKey(block.source, root);
      if (scan.keys.has(key)) continue;
      scan.keys.add(key);
      scan.firstUse.push({ bookDir, key, source: block.source, acc, where });
    }
  }
  return scan;
}

function messageOf(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" | ");
}

async function renderJobs(root: string, jobs: Job[], executablePath: string, booksDir: string, result: RenderResult): Promise<string[]> {
  const { config, css } = loadRenderConfig(root);
  // renderMermaid in mermaid-cli 12.0.0 has no CSS option; the mmdc -C flag passes the file as themeCSS too.
  const mermaidConfig = { ...config, themeCSS: css };
  const [{ default: puppeteer }, { renderMermaid }] = await Promise.all([
    import("puppeteer"),
    import("@mermaid-js/mermaid-cli"),
  ]);
  const failures: string[] = [];
  const browser: Browser = await puppeteer.launch({ executablePath, headless: true });
  try {
    const svgByKey = new Map<string, Promise<string>>();
    const render = (job: Job): Promise<string> => {
      let pending = svgByKey.get(job.key);
      if (!pending) {
        pending = renderMermaid(browser, job.source, "svg", {
          mermaidConfig,
          backgroundColor: "transparent",
          fontEmbed: false,
          svgId: diagramId(job.key),
        }).then((out) => finalizeSvg(new TextDecoder().decode(out.data), { id: diagramId(job.key), acc: job.acc }));
        svgByKey.set(job.key, pending);
      }
      return pending;
    };
    let next = 0;
    const worker = async () => {
      while (next < jobs.length) {
        const job = jobs[next++];
        try {
          const svg = await render(job);
          const file = cachePath(job.bookDir, job.key);
          mkdirSync(dirname(file), { recursive: true });
          writeFileSync(file, svg);
          result.rendered.push(toPosix(relative(booksDir, file)));
        } catch (error) {
          failures.push(`${job.where} ${messageOf(error)}`);
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  } finally {
    await browser.close();
  }
  return failures;
}

export async function renderBooks(root: string, opts: RenderOptions = {}): Promise<RenderResult> {
  const booksDir = join(root, "books");
  const result: RenderResult = { rendered: [], cached: 0, missing: [], orphans: [], pruned: [] };
  const problems: string[] = [];
  const scans = listBooks(root, opts.book, { filterOnly: true }).map((slug) => scanBook(root, booksDir, slug, problems));
  // Fail before pruning or rendering, so a block without acc text never changes the cache.
  if (problems.length > 0) throw new DiagramRenderError(problems, result);

  const jobs: Job[] = [];
  for (const scan of scans) {
    for (const job of scan.firstUse) {
      if (!opts.force && existsSync(cachePath(scan.bookDir, job.key))) result.cached++;
      else if (opts.check) result.missing.push(job.where);
      else jobs.push(job);
    }
    const diagramsDir = join(scan.bookDir, "diagrams");
    if (!existsSync(diagramsDir)) continue;
    for (const name of readdirSync(diagramsDir).sort()) {
      if (!name.endsWith(".svg") || scan.keys.has(basename(name, ".svg"))) continue;
      const rel = `${scan.slug}/diagrams/${name}`;
      result.orphans.push(rel);
      // Check mode stays read-only so CI can run it without touching the tree.
      if (opts.prune && !opts.check) {
        rmSync(join(diagramsDir, name));
        result.pruned.push(rel);
      }
    }
  }

  if (jobs.length > 0) {
    const executablePath = opts.executablePath ?? process.env.PUPPETEER_EXECUTABLE_PATH ?? DEFAULT_EXECUTABLE;
    const failures = await renderJobs(root, jobs, executablePath, booksDir, result);
    result.rendered.sort();
    if (failures.length > 0) throw new DiagramRenderError(failures.sort(), result);
  }
  return result;
}

function parseArgs(argv: string[]): { root: string; opts: RenderOptions } {
  const opts: RenderOptions = {};
  let root = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--root" || arg === "--book") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new Error(`${arg} needs a value`);
      if (arg === "--root") root = resolve(value);
      else opts.book = value;
    } else if (arg === "--check") opts.check = true;
    else if (arg === "--prune") opts.prune = true;
    else if (arg === "--force") opts.force = true;
    else throw new Error(`unknown argument "${arg}"`);
  }
  return { root, opts };
}

function summary(result: RenderResult): string {
  return `rendered ${result.rendered.length}, cached ${result.cached}, missing ${result.missing.length}, orphans ${result.orphans.length}, pruned ${result.pruned.length}`;
}

function report(result: RenderResult): void {
  for (const file of result.rendered) console.log(`rendered ${file}`);
  for (const where of result.missing) console.log(`${where} has no cached SVG; run bun run diagrams:render`);
  for (const file of result.orphans) {
    console.log(result.pruned.includes(file) ? `pruned ${file}` : `orphan ${file} (delete it with --prune)`);
  }
  console.log(summary(result));
}

async function main(): Promise<number> {
  try {
    const { root, opts } = parseArgs(process.argv.slice(2));
    const result = await renderBooks(root, opts);
    report(result);
    return opts.check && result.missing.length > 0 ? 1 : 0;
  } catch (error) {
    if (error instanceof DiagramRenderError) {
      for (const problem of error.problems) console.error(problem);
      report(error.result);
    } else {
      console.error(messageOf(error));
    }
    return 1;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
