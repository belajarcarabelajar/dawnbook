import fs from "node:fs";
import path from "node:path";
import { findDiagramBlocks, type DiagramBlock } from "./diagrams/extract";
import { cachePath, diagramKey } from "./diagrams/cache";

export interface DiagramViolation {
  book: string;
  file: string;
  line: number;
  rule: string;
  message: string;
}

const ALLOWED_TYPE =
  /^(?:flowchart|graph|sequenceDiagram|stateDiagram-v2|pie|quadrantChart|xychart|xychart-beta|timeline)(?![\w-])/;
const MAX_PER_FILE = 3;
// An inline SVG never shrinks below 0.75 of its natural width, and the reading column is 750 px.
export const MAX_NATURAL_WIDTH = 1000;
const EM_DASH = String.fromCodePoint(0x2014);
const OPEN_QUOTE = String.fromCodePoint(0x201c);
const CLOSE_QUOTE = String.fromCodePoint(0x201d);

// Width from the root element's viewBox only; nested svg elements carry their own, unrelated viewBox.
function rootViewBoxWidth(svg: string): number | null {
  const root = /<svg\b[^>]*>/i.exec(svg);
  const viewBox = root && /\sviewBox\s*=\s*["']([^"']*)["']/i.exec(root[0]);
  if (!viewBox) return null;
  const width = Number(viewBox[1].trim().split(/[\s,]+/)[2]);
  return Number.isFinite(width) ? width : null;
}

// Separates an optional leading `---` front-matter block, which holds YAML, from the diagram syntax after it.
function splitFrontMatter(source: string): { front: string[]; body: string[] } {
  const lines = source.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  if (lines[i]?.trim() !== "---") return { front: [], body: lines };
  const start = ++i;
  while (i < lines.length && lines[i].trim() !== "---") i++;
  return { front: lines.slice(start, i), body: lines.slice(i + 1) };
}

function firstKeywordLine(body: string[]): string {
  return body.map((l) => l.trim()).find((t) => t !== "" && !t.startsWith("%%")) ?? "";
}

// Splits on commas outside double quotes, so a quoted category may hold a comma.
function splitList(text: string): string[] {
  const items: string[] = [];
  let current = "";
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    if (ch === "," && !quoted) {
      items.push(current.trim());
      current = "";
    } else current += ch;
  }
  if (current.trim() !== "" || items.length > 0) items.push(current.trim());
  return items;
}

const isQuoted = (text: string) => /^"[^"]*"$/.test(text);

interface XyFindings {
  unquoted: string[];
  decimal: string[];
  thousands: string[];
  count: string[];
}

function checkXychart(body: string[]): XyFindings {
  const found: XyFindings = { unquoted: [], decimal: [], thousands: [], count: [] };
  let categories: number | null = null;
  const series: { kind: string; values: number }[] = [];
  for (const raw of body) {
    const line = raw.trim();
    const title = /^title\b\s*(.*)$/.exec(line);
    if (title && !isQuoted(title[1])) found.unquoted.push(`title ${title[1]}`);
    const axis = /^([xy]-axis)\b\s*(.*)$/.exec(line);
    if (axis) {
      let rest = axis[2];
      const quotedTitle = /^"[^"]*"/.exec(rest);
      if (quotedTitle) rest = rest.slice(quotedTitle[0].length).trim();
      else if (rest !== "" && !rest.startsWith("[") && !/^-?\d/.test(rest)) {
        found.unquoted.push(`${axis[1]} title ${rest.split(/\s*[[\d]/)[0]}`);
        rest = rest.includes("[") ? rest.slice(rest.indexOf("[")) : "";
      }
      const list = /^\[(.*)\]$/.exec(rest);
      if (axis[1] === "x-axis" && list) {
        const items = splitList(list[1]);
        categories = items.length;
        for (const item of items) if (!isQuoted(item)) found.unquoted.push(`category ${item}`);
      }
    }
    const data = /^(bar|line)\b[^[]*\[(.*)\]$/.exec(line);
    if (data) {
      // A comma decimal also splits into extra values, so it is reported as a decimal, not a count.
      if (/\d,\d/.test(data[2])) found.decimal.push(`${data[1]} [${data[2]}]`);
      else {
        const values = splitList(data[2]);
        // An Indonesian thousands separator such as 1.500 parses as the decimal 1.5.
        for (const value of values) if (/^-?\d+\.\d{3}$/.test(value)) found.thousands.push(`${data[1]} ${value}`);
        series.push({ kind: data[1], values: values.length });
      }
    }
  }
  if (categories !== null) {
    for (const s of series) {
      if (s.values !== categories) found.count.push(`${s.kind} has ${s.values} values for ${categories} categories`);
    }
  }
  return found;
}

// A label opens at a quote right after a shape bracket or edge pipe (`[/` and `[\` included) and closes at
// a quote right before a closing bracket, slash or pipe; any quote between those two is label text.
function flowLabelHasStraightQuote(line: string): boolean {
  let inLabel = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] !== '"') continue;
    if (!inLabel) {
      const before = line[i - 1] ?? "";
      inLabel = "[({|>".includes(before) || ("/\\".includes(before) && line[i - 2] === "[");
    } else if ("])}|/\\".includes(line[i + 1] ?? "")) inLabel = false;
    else return true;
  }
  return false;
}

function hasStraightQuoteInText(first: string, body: string[]): boolean {
  const lines = body.map((l) => l.trim()).filter((t) => !t.startsWith("%%"));
  if (/^(?:flowchart|graph)\b/.test(first)) return lines.some(flowLabelHasStraightQuote);
  if (/^(?:sequenceDiagram|timeline)\b/.test(first)) {
    return lines.some((t) => t.includes(":") && t.slice(t.indexOf(":") + 1).includes('"'));
  }
  return false;
}

function blockRules(source: string): [string, string][] {
  const out: [string, string][] = [];
  const { front, body } = splitFrontMatter(source);
  const first = firstKeywordLine(body);
  if (!ALLOWED_TYPE.test(first)) {
    out.push(["type-not-allowed", `"${first.split(/\s/)[0]}" is not an allowed diagram type (GEMINI.md section 25)`]);
  }
  const lines = source.split("\n");
  if (!lines.some((l) => /^\s*accTitle\s*:\s*\S/.test(l))) out.push(["missing-acc-title", "add an accTitle: line in Indonesian"]);
  if (!lines.some((l) => /^\s*accDescr\s*:\s*\S/.test(l) || /^\s*accDescr\s*\{/.test(l))) {
    out.push(["missing-acc-descr", "add an accDescr: line in Indonesian"]);
  }
  if (source.includes("{{")) out.push(["double-brace", "remove {{, mdBook expands it even inside the SVG"]);
  if (/\p{Extended_Pictographic}/u.test(source)) out.push(["emoji", "remove the emoji"]);
  if (source.includes(EM_DASH)) out.push(["em-dash", "replace the em dash with a comma, colon or hyphen"]);
  if (/\bAnda\b/.test(source)) out.push(["anda", 'use "kamu", never "Anda"']);
  if (source.includes("$")) out.push(["dollar", "remove $, it starts math in the chapter page"]);
  if (hasStraightQuoteInText(first, body)) {
    out.push(["straight-quote", `use curly quotes ${OPEN_QUOTE} ${CLOSE_QUOTE} inside label text; a straight " is dropped or breaks the parse`]);
  }
  if (source.includes("%%{") || front.some((l) => /^\s*config\s*:/.test(l))) {
    out.push(["config-override", "remove the directive; the render config in scripts/diagrams/render-config.json is locked"]);
  }
  if (/^xychart/.test(first)) {
    const xy = checkXychart(body);
    if (xy.unquoted.length > 0) out.push(["xychart-unquoted", `quote every title, axis title and category: ${xy.unquoted.join("; ")}`]);
    if (xy.decimal.length > 0) {
      out.push(["xychart-decimal", `write 2170.2 with a dot decimal, no thousands separator, and ", " between values: ${xy.decimal.join("; ")}`]);
    }
    if (xy.thousands.length > 0) {
      out.push(["xychart-thousands", `write 1500 without a separator, or round the decimal (2 decimals at most): ${xy.thousands.join("; ")}`]);
    }
    if (xy.count.length > 0) out.push(["xychart-count", `one value per category: ${xy.count.join("; ")}`]);
  }
  return out;
}

function isFirstBlock(lines: string[], block: DiagramBlock): boolean {
  return lines.slice(0, block.startLine - 1).every((l) => l.trim() === "" || /^#{1,6}\s/.test(l));
}

function listBooks(root: string, only?: string): string[] {
  const booksDir = path.join(root, "books");
  if (only !== undefined) {
    if (!fs.existsSync(path.join(booksDir, only, "book.toml"))) {
      throw new Error(`no book "${only}" (expected ${path.join("books", only, "book.toml")})`);
    }
    return [only];
  }
  if (!fs.existsSync(booksDir)) return [];
  return fs
    .readdirSync(booksDir)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."))
    .filter((name) => fs.existsSync(path.join(booksDir, name, "book.toml")))
    .sort();
}

function markdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

const toPosix = (p: string) => p.split(path.sep).join("/");

export function checkDiagrams(root: string, opts: { book?: string } = {}): { violations: DiagramViolation[]; orphans: string[] } {
  const violations: DiagramViolation[] = [];
  const orphans: string[] = [];
  for (const book of listBooks(root, opts.book)) {
    const bookDir = path.join(root, "books", book);
    const usedKeys = new Set<string>();
    for (const full of markdownFiles(path.join(bookDir, "src"))) {
      const file = toPosix(path.relative(bookDir, full));
      const markdown = fs.readFileSync(full, "utf8");
      const blocks = findDiagramBlocks(markdown);
      const lines = markdown.split("\n");
      const report = (block: DiagramBlock, rule: string, message: string) =>
        violations.push({ book, file, line: block.startLine, rule, message });
      const keysInFile = new Set<string>();
      blocks.forEach((block, index) => {
        for (const [rule, message] of blockRules(block.source)) report(block, rule, message);
        if (isFirstBlock(lines, block)) {
          report(block, "first-block", "put a prose paragraph before the diagram; the first paragraph feeds the meta description");
        }
        const key = diagramKey(block.source, root);
        if (keysInFile.has(key)) report(block, "duplicate", "the same diagram already appears earlier in this file");
        keysInFile.add(key);
        if (index === MAX_PER_FILE) {
          report(block, "too-many", `${blocks.length} diagrams in one file; the limit is ${MAX_PER_FILE}`);
        }
        usedKeys.add(key);
        const svgFile = cachePath(bookDir, key);
        if (!fs.existsSync(svgFile)) {
          report(block, "cache-miss", `no cached SVG ${key}.svg; run bun run diagrams:render --book ${book}`);
        } else {
          const width = rootViewBoxWidth(fs.readFileSync(svgFile, "utf8"));
          if (width === null) {
            report(block, "too-wide", `cached SVG ${key}.svg is missing its root viewBox, so its natural width is unknown; run bun run diagrams:render --book ${book}`);
          } else if (width > MAX_NATURAL_WIDTH) {
            report(
              block,
              "too-wide",
              `natural width ${width} px exceeds ${MAX_NATURAL_WIDTH} px; use flowchart TD for long chains, fewer participants, or shorter labels`,
            );
          }
        }
      });
    }
    const diagramsDir = path.join(bookDir, "diagrams");
    if (fs.existsSync(diagramsDir)) {
      for (const name of fs.readdirSync(diagramsDir).sort()) {
        if (name.endsWith(".svg") && !usedKeys.has(name.slice(0, -".svg".length))) {
          orphans.push(toPosix(path.join("books", book, "diagrams", name)));
        }
      }
    }
  }
  return { violations, orphans };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const valueOf = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const root = path.resolve(valueOf("--root") ?? process.cwd());
  const { violations, orphans } = checkDiagrams(root, { book: valueOf("--book") });
  for (const v of violations) console.log(`${v.book}/${v.file}:${v.line} [${v.rule}] ${v.message}`);
  for (const o of orphans) console.log(`WARN orphan ${o} (no block uses it; bun run diagrams:render --prune deletes it)`);
  console.log(`TOTAL: ${violations.length} diagram violations, ${orphans.length} orphaned SVGs`);
  process.exit(violations.length === 0 ? 0 : 1);
}
