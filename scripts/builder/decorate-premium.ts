import fs from "node:fs";
import path from "node:path";

const REFERENCES_OPEN = '<div class="daftar-pustaka">';
// dup-defs: allow a one-line helper; the one in scripts/diagrams/extract.ts is private to that module
const isBlank = (line: string) => line.trim() === "";

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

// Evidence is told in the prose (owner, 2026-11-02), so only the reference list is decorated; check-voice
// refuses a leftover "Kekuatan bukti:" label instead of dressing it up as a callout.
export function decoratePremiumBook(bookDir: string): { references: number } {
  const contentDir = path.join(bookDir, "src", "content");
  let references = 0;
  if (!fs.existsSync(contentDir)) return { references };

  for (const name of fs.readdirSync(contentDir).sort()) {
    if (!name.endsWith("_referensi.md")) continue;
    const file = path.join(contentDir, name);
    const wrapped = wrapReferences(fs.readFileSync(file, "utf8"));
    if (wrapped === null) continue;
    fs.writeFileSync(file, wrapped);
    references++;
  }
  return { references };
}
