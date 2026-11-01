import fs from "node:fs";
import path from "node:path";

const REFERENCES_OPEN = '<div class="daftar-pustaka">';
const LABEL = /^\*\*Kekuatan bukti:\*\*\s+([A-Za-z]+)/;
const LEVELS = new Set(["kuat", "sedang", "terbatas"]);
const FENCE_OPEN = /^[ \t]*(`{3,}|~{3,})(.*)$/;
const CALLOUT_OPEN = /^<div class="bukti bukti-[a-z]+">$/;

type Fence = { char: string; length: number };

// dup-defs: allow a one-line helper; the one in scripts/diagrams/extract.ts is private to that module
const isBlank = (line: string) => line.trim() === "";

function fenceOpening(line: string): Fence | null {
  const m = FENCE_OPEN.exec(line);
  if (!m) return null;
  // A backtick in the info string makes the line an inline code span, not a fence.
  if (m[1][0] === "`" && m[2].includes("`")) return null;
  return { char: m[1][0], length: m[1].length };
}

function closesFence(line: string, fence: Fence): boolean {
  const run = line.trim();
  return run.length >= fence.length && [...run].every((c) => c === fence.char);
}

function labelLevel(line: string): string | null {
  const level = LABEL.exec(line)?.[1].toLowerCase();
  return level && LEVELS.has(level) ? level : null;
}

function alreadyWrapped(lines: string[], start: number): boolean {
  let prev = start - 1;
  while (prev >= 0 && isBlank(lines[prev])) prev--;
  return prev >= 0 && CALLOUT_OPEN.test(lines[prev].trim());
}

// An HTML block ends at the first blank line, so the blank lines inside each div
// let pulldown-cmark render the Markdown between them.
function wrapLabels(markdown: string): { text: string; count: number } {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let count = 0;
  let fence: Fence | null = null;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (fence) {
      if (closesFence(line, fence)) fence = null;
      out.push(line);
      i++;
      continue;
    }
    fence = fenceOpening(line);
    // Only a paragraph starting at column 0 after a blank line counts: a label behind a
    // list marker, a ">" or a list-item indent belongs to a list item or a blockquote.
    const level = !fence && (i === 0 || isBlank(lines[i - 1])) ? labelLevel(line) : null;
    let end = i;
    while (level && end < lines.length && !isBlank(lines[end])) end++;
    const paragraph = lines.slice(i, end);
    if (!level || paragraph.some((l) => fenceOpening(l)) || alreadyWrapped(lines, i)) {
      out.push(line);
      i++;
      continue;
    }
    out.push(`<div class="bukti bukti-${level}">`, "", ...paragraph, "", "</div>");
    count++;
    i = end;
  }
  return { text: out.join("\n"), count };
}

function wrapReferences(markdown: string): string | null {
  const lines = markdown.split("\n");
  const title = lines.findIndex((line) => line.startsWith("## "));
  if (title === -1) return null;
  let start = title + 1;
  let end = lines.length;
  while (start < end && isBlank(lines[start])) start++;
  while (end > start && isBlank(lines[end - 1])) end--;
  if (start === end || lines[start].trim() === REFERENCES_OPEN) return null;
  return [...lines.slice(0, title + 1), "", REFERENCES_OPEN, "", ...lines.slice(start, end), "", "</div>", ""].join("\n");
}

export function decoratePremiumBook(bookDir: string): { references: number; labels: number } {
  const contentDir = path.join(bookDir, "src", "content");
  let references = 0;
  let labels = 0;
  if (!fs.existsSync(contentDir)) return { references, labels };

  for (const name of fs.readdirSync(contentDir).sort()) {
    if (!name.endsWith(".md")) continue;
    const file = path.join(contentDir, name);
    const original = fs.readFileSync(file, "utf8");
    const labelled = wrapLabels(original);
    labels += labelled.count;
    let text = labelled.text;
    if (name.endsWith("_referensi.md")) {
      const wrapped = wrapReferences(text);
      if (wrapped !== null) {
        text = wrapped;
        references++;
      }
    }
    if (text !== original) fs.writeFileSync(file, text);
  }
  return { references, labels };
}
