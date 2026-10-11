import fs from "node:fs";
import path from "node:path";

export interface Hit {
  line: number;
  text: string;
}

export interface Exempt extends Hit {
  reason: string;
}

export interface ScanResult {
  violations: Hit[];
  exempted: Exempt[];
}

export interface Finding {
  book: string;
  file: string;
  line: number;
  kind: "heading" | "summary" | "title";
  text: string;
  reason?: string;
}

interface SummaryEntry {
  line: number;
  text: string;
  target: string;
}

export class UsageError extends Error {}

const MARKER = /<!--\s*heading-colon-ok:\s*(.*?)\s*-->\s*$/;
// A heading may sit inside blockquotes or a list item, and mdBook still renders it as one.
const CONTAINER = String.raw`(?:>[ \t]*)*(?:(?:[-*+]|\d+[.)])[ \t]+)?`;
const HEADING = new RegExp(String.raw`^ {0,3}${CONTAINER}#{1,6}(?:[ \t]+(.*))?$`);
// A paragraph that is only bold text works as a sub-title, so it follows the same colon rule.
// Longer lines are callouts, not titles, and inline lead-ins such as `**Penting:** teks` do not match.
// Italic emphasis may sit inside the bold (`**Skenario: *Burnout* di Kantor**`), so only a second `**` disqualifies it.
const BOLD_TITLE = /^ {0,3}(?:>[ \t]*)*\*\*(.+?)\*\*[ \t]*(?:<!--.*-->)?[ \t]*$/;
const BOLD_TITLE_MAX = 100;

export function boldTitleInner(line: string): string | null {
  const m = BOLD_TITLE.exec(line);
  if (!m || m[1].length > BOLD_TITLE_MAX || m[1].includes("**")) return null;
  return m[1];
}
// Matches only a single-line <hN>...</hN>, optionally followed by an exemption comment.
const HTML_HEADING = new RegExp(
  String.raw`^ {0,3}${CONTAINER}<h([1-6])(?:[ \t][^>]*)?>(.*)</h\1[ \t]*>[ \t]*(?:<!--.*?-->)?[ \t]*$`,
  "i",
);
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)[ \t]*$/;
const THEMATIC_BREAK = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
// Lines that start a container or non-paragraph block. A paragraph that reaches one is not
// a plain setext candidate, so the scan gives up instead of guessing.
const NON_PARAGRAPH = /^\s*(?:>|(?:[-*+]|\d+[.)])(?:[ \t]|$)|\||<|\[[^\]]*\]:)/;
const FENCE = new RegExp(String.raw`^ {0,3}(?:>[ \t]*)*(\`{3,}|~{3,})(.*)$`);
const SUMMARY_ENTRY = /^\s*[-*+]\s+\[(.*?)\]\(([^)]*)\)/;
const TOML_TITLE = /^\s*title\s*=\s*"((?:[^"\\]|\\.)*)"/;
const CONTENT_PATH = /^books\/([^/]+)\/src\/content\/[^/]+\.md$/;
const TABLE_CAP = 60;
const DETAIL_PER_BOOK = 3;

const DEFAULT_ROOT = path.resolve(import.meta.dir, "..");

// Code spans go first so a `$` inside backticks cannot open a math span. Inline math follows
// the Pandoc rule: the opening `$` is not followed by a space, the closing `$` is not preceded
// by a space and not followed by a digit, so "$5: murah dan $10" stays plain text.
export function stripNonText(text: string): string {
  return text
    .replace(/(`+)(.+?)\1(?!`)/g, "")
    .replace(/\$\$.+?\$\$/g, "")
    .replace(/(?<!\\)\$(?=\S)[^$\n]*?(?<=[^\s\\])\$(?!\d)/g, "");
}

// U+FF1A is the fullwidth colon and reads as a colon in a heading.
export function headingViolates(text: string): boolean {
  return /[:\uFF1A]/.test(stripNonText(text));
}

// Marks every line that is a fence delimiter or sits inside a fenced block.
function fenceMask(lines: string[]): boolean[] {
  const mask: boolean[] = [];
  let open: { ch: string; len: number } | null = null;
  for (const line of lines) {
    const m = FENCE.exec(line);
    if (!open) {
      if (m && !(m[1][0] === "`" && m[2].includes("`"))) {
        open = { ch: m[1][0], len: m[1].length };
        mask.push(true);
      } else {
        mask.push(false);
      }
      continue;
    }
    mask.push(true);
    if (m && m[1][0] === open.ch && m[1].length >= open.len && m[2].trim() === "") {
      open = null;
    }
  }
  return mask;
}

function classify(text: string, fullLine: string, line: number, out: ScanResult) {
  const marker = MARKER.exec(fullLine);
  const body = stripMarker(text);
  if (!headingViolates(body)) return;
  if (marker && marker[1] !== "") {
    out.exempted.push({ line, text: body, reason: marker[1] });
  } else {
    out.violations.push({ line, text: body });
  }
}

// Index of the closing delimiter of a YAML front matter block, or -1 when there is none.
function frontMatterEnd(lines: string[]): number {
  if (!/^---[ \t]*$/.test(lines[0] ?? "")) return -1;
  for (let j = 1; j < lines.length; j++) {
    if (/^(?:---|\.\.\.)[ \t]*$/.test(lines[j])) return j;
  }
  return -1;
}

// If lines[i] underlines a plain paragraph, returns that paragraph's first line index and text.
function setextAt(lines: string[], skip: boolean[], i: number): { top: number; text: string } | null {
  if (skip[i] || !SETEXT_UNDERLINE.test(lines[i])) return null;
  const para: string[] = [];
  let top = i;
  for (let k = i - 1; k >= 0; k--) {
    const l = lines[k];
    if (skip[k] || l.trim() === "" || HEADING.test(l) || THEMATIC_BREAK.test(l) || SETEXT_UNDERLINE.test(l)) break;
    if (NON_PARAGRAPH.test(l)) return null;
    para.unshift(l.trim());
    top = k;
  }
  if (para.length === 0 || /^(?: {4}|\t)/.test(lines[top])) return null;
  return { top, text: para.join(" ") };
}

export function scanContent(md: string): ScanResult {
  const lines = md.split(/\r?\n/);
  const mask = fenceMask(lines);
  const fm = frontMatterEnd(lines);
  const skip = mask.map((m, i) => m || i <= fm);
  const out: ScanResult = { violations: [], exempted: [] };
  lines.forEach((line, i) => {
    if (mask[i]) return;
    const m = HEADING.exec(line);
    if (m) {
      classify(m[1] ?? "", line, i + 1, out);
      return;
    }
    const h = HTML_HEADING.exec(line);
    if (h) {
      classify(h[2].replace(/<code\b[^>]*>.*?<\/code>/gi, "").replace(/<[^>]*>/g, ""), line, i + 1, out);
      return;
    }
    const s = setextAt(lines, skip, i);
    if (s) {
      classify(s.text, lines[i - 1], s.top + 1, out);
      return;
    }
    const b = boldTitleInner(line);
    // A trailing colon (`**Contoh Soal:**`) is a plain label; only `Label: Subjudul` is the pattern.
    if (b !== null && /[:：]\s*\S/.test(b)) classify(b, line, i + 1, out);
  });
  return out;
}

export function parseSummaryEntries(md: string): SummaryEntry[] {
  const entries: SummaryEntry[] = [];
  md.split(/\r?\n/).forEach((line, i) => {
    const m = SUMMARY_ENTRY.exec(line);
    if (m) {
      const target = m[2].trim().replace(/^\.\//, "");
      entries.push({ line: i + 1, text: m[1], target });
    }
  });
  return entries;
}

export function scanSummary(md: string): ScanResult {
  const out: ScanResult = { violations: [], exempted: [] };
  md.split(/\r?\n/).forEach((line, i) => {
    const m = SUMMARY_ENTRY.exec(line);
    if (m) classify(m[1], line, i + 1, out);
  });
  return out;
}

export function scanToml(toml: string): ScanResult {
  const out: ScanResult = { violations: [], exempted: [] };
  const lines = toml.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = TOML_TITLE.exec(lines[i]);
    if (m) {
      classify(m[1], lines[i], i + 1, out);
      break;
    }
  }
  return out;
}

const SELF_TEST_FIXTURES: { md: string; flagged: boolean }[] = [
  { md: "## Harga yang Dibayar: Stres, Kesehatan, dan Tidur", flagged: true },
  { md: "## Komponen SMART:", flagged: true },
  { md: "## Harga yang Dibayar", flagged: false },
  { md: "## Memakai `dict: str` di Python", flagged: false },
  { md: "```\n## Di dalam: kode\n```", flagged: false },
  { md: "Judul: X\n=======", flagged: true },
  { md: "<h2>Label: Sub</h2>", flagged: true },
  { md: "## Judul\uFF1A Sub", flagged: true },
  { md: "## Harga $5: murah dan $10", flagged: true },
  { md: "## Fungsi $f: A \\to B$", flagged: false },
];

export function runSelfTest(
  detect: (md: string) => boolean = (md) => scanContent(md).violations.length > 0,
): string[] {
  const failures: string[] = [];
  for (const fx of SELF_TEST_FIXTURES) {
    if (detect(fx.md) !== fx.flagged) {
      const first = fx.md.split("\n")[0];
      failures.push(`fixture "${first}" should be ${fx.flagged ? "flagged" : "clean"}`);
    }
  }
  return failures;
}

export function listBooks(root: string): string[] {
  const booksDir = path.join(root, "books");
  if (!fs.existsSync(booksDir)) return [];
  return fs
    .readdirSync(booksDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_") && !e.name.startsWith("."))
    .filter((e) => fs.existsSync(path.join(booksDir, e.name, "book.toml")))
    .map((e) => e.name)
    .sort();
}

function readIfExists(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export interface BookScan {
  violations: Finding[];
  exempted: Finding[];
}

export function scanBook(root: string, slug: string): BookScan {
  const result: BookScan = { violations: [], exempted: [] };
  const add = (rel: string, kind: Finding["kind"], r: ScanResult) => {
    for (const v of r.violations) result.violations.push({ book: slug, file: rel, kind, ...v });
    for (const e of r.exempted) result.exempted.push({ book: slug, file: rel, kind, ...e });
  };

  const bookRel = `books/${slug}`;
  const toml = readIfExists(path.join(root, bookRel, "book.toml"));
  if (toml !== null) add(`${bookRel}/book.toml`, "title", scanToml(toml));

  const summary = readIfExists(path.join(root, bookRel, "src", "SUMMARY.md"));
  if (summary !== null) add(`${bookRel}/src/SUMMARY.md`, "summary", scanSummary(summary));

  const contentDir = path.join(root, bookRel, "src", "content");
  let names: string[] = [];
  try {
    names = fs.readdirSync(contentDir).filter((n) => n.endsWith(".md")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  for (const name of names) {
    const md = readIfExists(path.join(contentDir, name));
    if (md !== null) add(`${bookRel}/src/content/${name}`, "heading", scanContent(md));
  }
  return result;
}

function git(root: string, args: string[]): string {
  const r = Bun.spawnSync(["git", ...args], { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (r.exitCode !== 0) {
    throw new UsageError(`git ${args.join(" ")} failed: ${r.stderr.toString().trim()}`);
  }
  return r.stdout.toString();
}

function verifyRef(root: string, ref: string) {
  if (ref.startsWith("-")) throw new UsageError(`invalid git ref: ${ref}`);
  const r = Bun.spawnSync(["git", "rev-parse", "--verify", "--quiet", `${ref}^{commit}`], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (r.exitCode !== 0) throw new UsageError(`unknown git ref: ${ref}`);
}

// One git process for all blobs: spawning per chapter would be thousands of processes.
function catBlobs(root: string, ref: string, paths: string[]): Map<string, string | null> {
  const out = new Map<string, string | null>();
  if (paths.length === 0) return out;
  const input = paths.map((p) => `${ref}:${p}\n`).join("");
  const r = Bun.spawnSync(["git", "cat-file", "--batch"], {
    cwd: root,
    stdin: Buffer.from(input),
    stdout: "pipe",
    stderr: "pipe",
  });
  if (r.exitCode !== 0) {
    throw new UsageError(`git cat-file failed: ${r.stderr.toString().trim()}`);
  }
  const buf = Buffer.from(r.stdout);
  let pos = 0;
  for (const p of paths) {
    const nl = buf.indexOf(0x0a, pos);
    const header = buf.subarray(pos, nl).toString();
    pos = nl + 1;
    if (header.endsWith(" missing")) {
      out.set(p, null);
      continue;
    }
    const size = Number(header.split(" ")[2]);
    out.set(p, buf.subarray(pos, pos + size).toString("utf8"));
    pos += size + 1;
  }
  return out;
}

function baseFiles(root: string, ref: string): string[] {
  return git(root, ["-c", "core.quotepath=off", "ls-tree", "-r", "--name-only", ref, "--", "books"])
    .split("\n")
    .filter(Boolean);
}

const clip = (s: string) => (s.length > 100 ? `${s.slice(0, 100)}...` : s);

export function diffGuard(
  root: string,
  ref: string,
  slugs: string[] | null,
  allowBody: string[] = [],
): string[] {
  verifyRef(root, ref);
  for (const p of allowBody) {
    const slug = CONTENT_PATH.exec(p)?.[1];
    if (slug === undefined || slug.startsWith("_")) {
      throw new UsageError(`--allow-body needs a chapter path under books/*/src/content: ${p}`);
    }
    if (slugs && !slugs.includes(slug)) {
      throw new UsageError(`--allow-body path is outside the selected books: ${p}`);
    }
  }
  const bodyOk = new Set(allowBody);
  const paths = slugs ? slugs.map((s) => `books/${s}`) : ["books"];
  const diff = git(root, [
    "-c",
    "core.quotepath=off",
    "diff",
    "-U0",
    "--no-renames",
    "--no-color",
    "--no-ext-diff",
    ref,
    "--",
    ...paths,
  ]);

  const failures: string[] = [];
  const masks = new Map<string, boolean[]>();
  const oldBlobs = new Map<string, string | null>();
  const maskFor = (side: "old" | "new", file: string): boolean[] => {
    const key = `${side}:${file}`;
    let mask = masks.get(key);
    if (!mask) {
      let text: string | null;
      if (side === "new") {
        text = readIfExists(path.join(root, file));
      } else {
        if (!oldBlobs.has(file)) oldBlobs.set(file, catBlobs(root, ref, [file]).get(file) ?? null);
        text = oldBlobs.get(file) ?? null;
      }
      mask = fenceMask((text ?? "").split(/\r?\n/));
      masks.set(key, mask);
    }
    return mask;
  };

  const allowed = (file: string, text: string, side: "old" | "new", lineNo: number): boolean => {
    if (bodyOk.has(file)) return true;
    if (CONTENT_PATH.test(file)) {
      return (HEADING.test(text) || boldTitleInner(text) !== null) && !maskFor(side, file)[lineNo - 1];
    }
    if (/^books\/[^/]+\/src\/SUMMARY\.md$/.test(file)) return SUMMARY_ENTRY.test(text);
    if (/^books\/[^/]+\/book\.toml$/.test(file)) return TOML_TITLE.test(text);
    return false;
  };

  let file = "";
  let inHunk = false;
  let oldNo = 0;
  let newNo = 0;
  const inDiff = new Set<string>();
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const m = /^diff --git a\/.* b\/(.*)$/.exec(line);
      file = m ? m[1] : "";
      inDiff.add(file);
      inHunk = false;
      continue;
    }
    if (!inHunk && !line.startsWith("@@")) {
      if (/^(new|deleted) file mode /.test(line)) failures.push(`${file}: file added or deleted`);
      if (line.startsWith("Binary files ")) failures.push(`${file}: binary change`);
      continue;
    }
    const h = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (h) {
      inHunk = true;
      oldNo = Number(h[1]);
      newNo = Number(h[2]);
      continue;
    }
    if (line.startsWith("+")) {
      const text = line.slice(1);
      if (!allowed(file, text, "new", newNo)) failures.push(`${file}:${newNo} +${clip(text)}`);
      newNo++;
    } else if (line.startsWith("-")) {
      const text = line.slice(1);
      if (!allowed(file, text, "old", oldNo)) failures.push(`${file}:${oldNo} -${clip(text)}`);
      oldNo++;
    }
  }
  // A stale allowance must fail loudly instead of silently widening a later guard run.
  for (const p of bodyOk) {
    if (!inDiff.has(p)) throw new UsageError(`--allow-body path is not in the diff against ${ref}: ${p}`);
  }
  return failures;
}

function firstHeading(md: string): string | null {
  const lines = md.split(/\r?\n/);
  const mask = fenceMask(lines);
  for (let i = 0; i < lines.length; i++) {
    if (mask[i]) continue;
    const m = HEADING.exec(lines[i]);
    if (m) return stripMarker(m[1] ?? "");
  }
  return null;
}

function stripMarker(text: string): string {
  const m = MARKER.exec(text);
  return (m ? text.slice(0, m.index) : text).trim();
}

export function parityGuard(root: string, ref: string, slugs: string[] | null): string[] {
  verifyRef(root, ref);
  const files = baseFiles(root, ref);
  const baseSlugs = new Set<string>();
  for (const f of files) {
    const m = /^books\/([^/]+)\/src\/SUMMARY\.md$/.exec(f);
    if (m && !m[1].startsWith("_")) baseSlugs.add(m[1]);
  }
  const targets = slugs ? slugs.filter((s) => baseSlugs.has(s)) : [...baseSlugs].sort();

  const failures: string[] = [];
  for (const slug of targets) {
    const src = `books/${slug}/src`;
    const oldSummary = catBlobs(root, ref, [`${src}/SUMMARY.md`]).get(`${src}/SUMMARY.md`) ?? "";
    const oldEntries = parseSummaryEntries(oldSummary);
    const oldPaths = oldEntries.map((e) => `${src}/${e.target}`);
    const oldChapters = catBlobs(root, ref, oldPaths);

    const newSummary = readIfExists(path.join(root, src, "SUMMARY.md"));
    if (newSummary === null) continue;
    const newText = new Map<string, string>();
    for (const e of parseSummaryEntries(newSummary)) {
      if (!newText.has(e.target)) newText.set(e.target, stripMarker(e.text));
    }

    const seen = new Set<string>();
    for (const e of oldEntries) {
      if (seen.has(e.target)) continue;
      seen.add(e.target);
      const oldMd = oldChapters.get(`${src}/${e.target}`);
      if (oldMd == null) continue;
      const oldHead = firstHeading(oldMd);
      if (oldHead === null || oldHead !== e.text.trim()) continue;

      const newMd = readIfExists(path.join(root, src, e.target));
      const newEntry = newText.get(e.target);
      if (newMd === null || newEntry === undefined) continue;
      const newHead = firstHeading(newMd);
      if (newHead !== newEntry) {
        failures.push(
          `${src}/${e.target}: SUMMARY "${clip(newEntry)}" vs first heading "${clip(newHead ?? "(none)")}"`,
        );
      }
    }
  }
  return failures;
}

function dupCount(md: string[]): number {
  const counts = new Map<string, number>();
  for (const text of md) {
    const lines = text.split(/\r?\n/);
    const mask = fenceMask(lines);
    lines.forEach((line, i) => {
      if (mask[i]) return;
      const m = /^ {0,3}##(?!#)[ \t]+(.*)$/.exec(line);
      if (m) {
        const t = stripMarker(m[1]);
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    });
  }
  let dups = 0;
  for (const n of counts.values()) if (n > 1) dups += n - 1;
  return dups;
}

export function dupGuard(root: string, ref: string, slugs: string[] | null): string[] {
  verifyRef(root, ref);
  const files = baseFiles(root, ref);
  const baseByBook = new Map<string, string[]>();
  for (const f of files) {
    const m = /^books\/([^/]+)\/src\/content\/[^/]+\.md$/.exec(f);
    if (m && !m[1].startsWith("_")) {
      const list = baseByBook.get(m[1]) ?? [];
      list.push(f);
      baseByBook.set(m[1], list);
    }
  }
  const targets = slugs ?? [...new Set([...baseByBook.keys(), ...listBooks(root)])].sort();

  const failures: string[] = [];
  for (const slug of targets) {
    const basePaths = baseByBook.get(slug) ?? [];
    const baseBlobs = catBlobs(root, ref, basePaths);
    const before = dupCount(basePaths.map((p) => baseBlobs.get(p) ?? ""));

    const contentDir = path.join(root, "books", slug, "src", "content");
    let names: string[] = [];
    try {
      names = fs.readdirSync(contentDir).filter((n) => n.endsWith(".md"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const after = dupCount(names.map((n) => fs.readFileSync(path.join(contentDir, n), "utf8")));
    if (after > before) failures.push(`${slug}: duplicate ## headings ${before} -> ${after}`);
  }
  return failures;
}

interface Options {
  root: string;
  books: string[] | null;
  json: boolean;
  selfTest: boolean;
  diffGuard?: string;
  allowBody: string[];
  parityBase?: string;
  dupGuard?: string;
}

export function parseArgs(argv: string[]): Options {
  const opts: Options = { root: DEFAULT_ROOT, books: null, json: false, selfTest: false, allowBody: [] };
  const value = (i: number, flag: string): string => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith("--")) throw new UsageError(`${flag} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--json":
        opts.json = true;
        break;
      case "--self-test":
        opts.selfTest = true;
        break;
      case "--root":
        opts.root = path.resolve(value(i, a));
        i++;
        break;
      case "--books":
        opts.books = value(i, a).split(",").map((s) => s.trim()).filter(Boolean);
        i++;
        break;
      case "--diff-guard":
        opts.diffGuard = value(i, a);
        i++;
        break;
      case "--allow-body":
        opts.allowBody.push(value(i, a));
        i++;
        break;
      case "--parity-base":
        opts.parityBase = value(i, a);
        i++;
        break;
      case "--dup-guard":
        opts.dupGuard = value(i, a);
        i++;
        break;
      default:
        throw new UsageError(`unknown argument: ${a}`);
    }
  }
  return opts;
}

function pad(s: string, n: number) {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function printScan(opts: Options, slugs: string[]): number {
  const violations: Finding[] = [];
  const exempted: Finding[] = [];
  for (const slug of slugs) {
    const r = scanBook(opts.root, slug);
    violations.push(...r.violations);
    exempted.push(...r.exempted);
  }
  const kinds = { heading: 0, summary: 0, title: 0 };
  for (const v of violations) kinds[v.kind]++;

  const perBook = slugs
    .map((book) => {
      const own = violations.filter((v) => v.book === book);
      return { book, violations: own.length, files: new Set(own.map((v) => v.file)).size };
    })
    .filter((b) => b.violations > 0)
    .sort((a, b) => b.violations - a.violations || a.book.localeCompare(b.book));

  const totals = { violations: violations.length, ...kinds, exempted: exempted.length, booksScanned: slugs.length };

  if (opts.json) {
    console.log(JSON.stringify({ books: perBook, violations, exempted, totals }, null, 2));
    return violations.length > 0 ? 1 : 0;
  }

  if (perBook.length > 0) {
    const w = Math.max(4, ...perBook.slice(0, TABLE_CAP).map((b) => b.book.length));
    console.log(`${pad("book", w)} | violations | files`);
    for (const b of perBook.slice(0, TABLE_CAP)) {
      console.log(`${pad(b.book, w)} | ${pad(String(b.violations), 10)} | ${b.files}`);
    }
    if (perBook.length > TABLE_CAP) console.log(`... and ${perBook.length - TABLE_CAP} more books`);
    console.log("");
    for (const b of perBook.slice(0, TABLE_CAP)) {
      console.log(`${b.book}:`);
      for (const v of violations.filter((x) => x.book === b.book).slice(0, DETAIL_PER_BOOK)) {
        console.log(`  ${v.file}:${v.line}  ${v.text}`);
      }
    }
    console.log("");
  }

  if (exempted.length > 0) {
    console.log(`EXEMPTED (${exempted.length}):`);
    for (const e of exempted) console.log(`  ${e.file}:${e.line}  ${e.text}  [${e.reason}]`);
    console.log("");
  }

  console.log(
    `TOTAL: ${totals.violations} violations (${kinds.heading} chapter headings, ${kinds.summary} SUMMARY entries, ${kinds.title} book.toml titles), ${totals.exempted} exempted, ${slugs.length} books scanned`,
  );
  return violations.length > 0 ? 1 : 0;
}

function resolveSlugs(opts: Options): string[] {
  const all = listBooks(opts.root);
  if (!opts.books) return all;
  for (const s of opts.books) {
    if (!all.includes(s)) throw new UsageError(`unknown book slug: ${s}`);
  }
  return opts.books;
}

function reportGuard(opts: Options, mode: string, failures: string[], note = ""): number {
  if (opts.json) {
    console.log(JSON.stringify({ mode, ok: failures.length === 0, failures }, null, 2));
  } else if (failures.length === 0) {
    console.log(`${mode}: ok${note}`);
  } else {
    console.log(`${mode}: FAILED (${failures.length})`);
    for (const f of failures) console.log(`  ${f}`);
  }
  return failures.length > 0 ? 1 : 0;
}

export function main(argv: string[]): number {
  try {
    const opts = parseArgs(argv);
    if (opts.allowBody.length > 0 && opts.diffGuard === undefined) {
      throw new UsageError("--allow-body only works together with --diff-guard");
    }

    if (opts.selfTest) {
      const failures = runSelfTest();
      if (failures.length > 0) {
        for (const f of failures) console.error(`self-test failed: ${f}`);
        return 2;
      }
      console.log("self-test ok");
      return 0;
    }

    const slugs = resolveSlugs(opts);
    const guardArgs: [string | undefined, string, typeof diffGuard][] = [
      [opts.diffGuard, "diff-guard", diffGuard],
      [opts.parityBase, "parity-base", parityGuard],
      [opts.dupGuard, "dup-guard", dupGuard],
    ];
    const active = guardArgs.filter(([ref]) => ref !== undefined);
    if (active.length === 0) return printScan(opts, slugs);

    let code = 0;
    for (const [ref, mode, fn] of active) {
      const allowBody = mode === "diff-guard" ? [...new Set(opts.allowBody)] : [];
      const failures = fn(opts.root, ref as string, opts.books, allowBody);
      const note = allowBody.length > 0 ? ` (body edits allowed in: ${allowBody.join(", ")})` : "";
      code = Math.max(code, reportGuard(opts, mode, failures, note));
    }
    return code;
  } catch (error) {
    if (error instanceof UsageError) {
      console.error(error.message);
      return 2;
    }
    throw error;
  }
}

if (import.meta.main) {
  process.exitCode = main(process.argv.slice(2));
}
