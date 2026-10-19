import fs from "node:fs";
import path from "node:path";
import { escapeHtml, formatSerpDescription } from "./inject-gating";

// Structural checks for one book (GEMINI.md sections 6, 8, 14, 16, 21): SUMMARY and disk agree,
// the chapter title is a level-2 heading equal to the SUMMARY title, no em dash, emoji or "Anda",
// openers survive the site's meta description cut, and no section heading repeats across chapters.

export interface BookStructureResult {
  chapters: number;
  problems: string[];
}

const SUMMARY_ENTRY = /^\s*-\s*\[([^\]]+)\]\(([^)]+)\)/;
const HEADING = /^(#{1,6})[ \t]+(.*?)[ \t]*$/;
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
const FENCE = /^\s{0,3}(`{3,}|~{3,})/;
const LIST_ITEM = /^(?:[-*+]|\d+[.)])\s/;
// One level of balanced parentheses keeps DOIs such as 10.1016/S0140-6736(20)30183-5 whole.
const URL = /https?:\/\/(?:[^\s()|>\]]|\([^\s()|>\]]*\))+/gi;
// Inline link target (one level of balanced parentheses, optional quoted title) or an href value.
const LINK_TARGET = /\]\(\s*((?:[^\s()]|\([^\s()]*\))+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)|\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const ABSOLUTE_HTTP = /^https?:\/\//i;

export function extractUrls(md: string): string[] {
  const seen = new Set<string>();
  for (const m of md.matchAll(URL)) seen.add(m[0].replace(/[.,;:*`"']+$/, ""));
  return [...seen];
}

function plainText(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLinkTargets(md: string): string[] {
  const lines = md.split(/\r?\n/);
  const fenced = fencedLines(lines);
  const text = lines.filter((_, i) => !fenced[i]).join("\n");
  const seen = new Set<string>();
  for (const m of text.matchAll(LINK_TARGET)) seen.add(m[1] ?? m[2] ?? m[3]);
  return [...seen];
}

// A target is fine when it is an absolute http(s) URL, an in-page anchor, a site-root link to another
// book that exists, or a relative link to a chapter of the book (mdBook rewrites .md links to .html,
// so either extension names a source file).
function linkTargetOk(target: string, chapterDir: string, srcDir: string, booksDir: string): boolean {
  if (ABSOLUTE_HTTP.test(target) || target.startsWith("#")) return true;
  const slug = /^\/books\/([a-z0-9-]+)\//.exec(target)?.[1];
  if (slug) return fs.existsSync(path.join(booksDir, slug, "book.toml"));
  if (target.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(target)) return false;
  const filePart = target.split("#")[0];
  if (!/\.(md|html)$/i.test(filePart)) return false;
  const resolved = path.resolve(chapterDir, filePart.replace(/\.html$/i, ".md"));
  return resolved.startsWith(path.resolve(srcDir) + path.sep) && fs.existsSync(resolved);
}

// Same two-step cut as injectSeoAndGating: 155 characters, then 145 if the escaped meta exceeds 160.
function siteMeta(raw: string): string {
  const meta = formatSerpDescription(raw, 155);
  return escapeHtml(meta).length > 160 ? formatSerpDescription(raw, 145) : meta;
}

function firstSentence(raw: string): string {
  const clean = formatSerpDescription(raw, Number.POSITIVE_INFINITY);
  const end = /[.!?](?:\s|$)/.exec(clean);
  return end ? clean.slice(0, end.index + 1) : clean;
}

// True for fence marker lines and every line between them.
function fencedLines(lines: string[]): boolean[] {
  let fence = "";
  return lines.map((line) => {
    const marker = FENCE.exec(line)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = "";
      return true;
    }
    if (marker) fence = marker;
    return Boolean(marker);
  });
}

// Mirrors extractLeadText in inject-gating.ts, which reads only <p> elements of the built page.
function leadText(lines: string[], excluded: boolean[]): string {
  const paras: string[] = [];
  let current: string[] = [];
  let inBlock = false;
  const flush = () => {
    if (current.length) paras.push(current.join(" "));
    current = [];
  };
  lines.forEach((raw, i) => {
    const line = raw.replace(/^(\s{0,3}>\s?)+/, "").trimStart();
    if (excluded[i] || line === "" || HEADING.test(line)) {
      flush();
      inBlock = false;
      return;
    }
    // List items, table rows and raw HTML blocks render without <p> and run until a blank line.
    if (inBlock || LIST_ITEM.test(line) || line.startsWith("|") || line.startsWith("<")) {
      flush();
      inBlock = true;
      return;
    }
    current.push(line);
  });
  flush();
  let combined = "";
  for (const p of paras) {
    const clean = plainText(p);
    if (!clean) continue;
    combined = combined ? `${combined} ${clean}` : clean;
    if (combined.length >= 100) break;
  }
  return combined;
}

function scanLine(where: string, line: string, problems: string[]): void {
  if (line.includes("\u2014")) problems.push(`${where}: em dash`);
  if (EMOJI.test(line)) problems.push(`${where}: emoji`);
}

export function checkBookStructure(bookDir: string): BookStructureResult {
  const problems: string[] = [];
  const srcDir = path.join(bookDir, "src");
  const contentDir = path.join(srcDir, "content");
  const summaryPath = path.join(srcDir, "SUMMARY.md");
  if (!fs.existsSync(summaryPath)) return { chapters: 0, problems: [`src/SUMMARY.md missing in ${bookDir}`] };

  const tomlPath = path.join(bookDir, "book.toml");
  if (fs.existsSync(tomlPath)) {
    const desc = /^description\s*=\s*"([^"]*)"/m.exec(fs.readFileSync(tomlPath, "utf-8"))?.[1];
    if (desc === undefined) problems.push("book.toml: description missing");
    else if (desc.length < 100 || desc.length > 160) {
      problems.push(`book.toml: description is ${desc.length} characters, outside the 100 to 160 range`);
    }
    if (desc && formatSerpDescription(desc, 155).endsWith("...")) {
      problems.push(`book.toml: description (${desc.length} chars) would be truncated in the root page meta description`);
    }
  }

  for (const f of fs.readdirSync(srcDir)) {
    if (f.endsWith(".md") && f !== "SUMMARY.md") problems.push(`src/${f}: stray markdown file in src root`);
  }

  const summaryLines = fs.readFileSync(summaryPath, "utf-8").split(/\r?\n/);
  summaryLines.forEach((line, i) => scanLine(`SUMMARY.md:${i + 1}`, line, problems));
  const entries = summaryLines
    .map((l) => SUMMARY_ENTRY.exec(l))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ title: m[1].trim(), file: path.basename(m[2]) }));

  const onDisk = fs.existsSync(contentDir) ? fs.readdirSync(contentDir).filter((f) => f.endsWith(".md")) : [];
  const listed = new Set(entries.map((e) => e.file));
  for (const f of onDisk) if (!listed.has(f)) problems.push(`${f}: chapter file not in SUMMARY`);

  const headingFiles = new Map<string, string[]>();
  let chapters = 0;
  for (const { title, file } of entries) {
    const full = path.join(contentDir, file);
    if (!fs.existsSync(full)) {
      problems.push(`${file}: listed in SUMMARY but missing on disk`);
      continue;
    }
    chapters++;
    const md = fs.readFileSync(full, "utf-8");
    const lines = md.split(/\r?\n/);
    const fenced = fencedLines(lines);
    const firstIdx = lines.findIndex((l, i) => !fenced[i] && HEADING.test(l));
    const titleMatch = firstIdx >= 0 ? HEADING.exec(lines[firstIdx]) : null;
    const first = titleMatch?.[2] ?? "";
    if (titleMatch?.[1] === "#") problems.push(`${file}: chapter title must be a level-2 heading (##)`);
    if (first !== title) problems.push(`${file}: first heading "${first}" differs from SUMMARY title "${title}"`);

    lines.forEach((line, i) => {
      scanLine(`${file}:${i + 1}`, line, problems);
      if (/\bAnda\b/.test(line)) problems.push(`${file}:${i + 1}: formal pronoun Anda`);
      if (!fenced[i]) {
        for (const target of extractLinkTargets(line)) {
          if (!linkTargetOk(target, contentDir, srcDir, path.dirname(path.resolve(bookDir)))) {
            problems.push(`${file}:${i + 1}: link target "${target}" is not an http(s) URL, an in-page anchor or a chapter file of the book`);
          }
        }
      }
      if (i !== firstIdx && !fenced[i]) {
        const h = HEADING.exec(line);
        if (h) {
          const key = h[2].trim().toLowerCase();
          headingFiles.set(key, [...new Set([...(headingFiles.get(key) ?? []), file])]);
        }
      }
    });

    const lead = leadText(lines, fenced);
    // Rule: the final meta must start with the complete first sentence of the cleaned lead.
    if (lead && !siteMeta(lead).startsWith(firstSentence(lead))) {
      problems.push(`${file}: opener's first sentence would be truncated in the meta description`);
    }
  }

  for (const [heading, files] of headingFiles) {
    if (files.length >= 2) problems.push(`heading "${heading}" repeated in ${files.join(", ")}`);
  }
  return { chapters, problems };
}

if (import.meta.main) {
  const slug = process.argv[2];
  if (!slug) {
    console.error("usage: bun run scripts/check-book-structure.ts <book-slug>");
    process.exit(2);
  }
  const { chapters, problems } = checkBookStructure(path.join(import.meta.dir, "..", "books", slug));
  for (const p of problems) console.log(p);
  console.log(`${slug}: ${chapters} chapters, ${problems.length} problems`);
  process.exit(problems.length ? 1 : 0);
}
