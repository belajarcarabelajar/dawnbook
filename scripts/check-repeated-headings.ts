import fs from "node:fs";
import path from "node:path";

// GEMINI.md section 21: no structural element may repeat verbatim across the chapters of one book.
// The check counts chapters, not occurrences, and starts at three so a coincidental pair stays legal.
export const DEFAULT_MIN_CHAPTERS = 3;

export interface RepeatedHeading {
  slug: string;
  heading: string;
  files: string[];
}

const FENCE = /^ {0,3}(?:>[ \t]*)*(`{3,}|~{3,})/;
const HEADING = /^ {0,3}(?:>[ \t]*)*#{2,6}[ \t]+(.*?)[ \t]*$/;

export function normalizeHeading(text: string): string {
  return text
    .replace(/<!--.*?-->/g, "")
    .replace(/^\d+\\?\.\s*/, "")
    .replace(/^[A-Za-z]\.\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function headingsOf(md: string): Set<string> {
  const out = new Set<string>();
  let fence: string | null = null;
  for (const line of md.split(/\r?\n/)) {
    const f = FENCE.exec(line);
    if (f) {
      if (fence === null) fence = f[1][0];
      else if (f[1][0] === fence) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const m = HEADING.exec(line);
    if (m) out.add(normalizeHeading(m[1]));
  }
  out.delete("");
  return out;
}

export function findRepeatedHeadings(root: string, min = DEFAULT_MIN_CHAPTERS): RepeatedHeading[] {
  const booksDir = path.join(root, "books");
  const found: RepeatedHeading[] = [];
  if (!fs.existsSync(booksDir)) return found;
  for (const slug of fs.readdirSync(booksDir).sort()) {
    const contentDir = path.join(booksDir, slug, "src", "content");
    if (!fs.existsSync(contentDir)) continue;
    const byHeading = new Map<string, string[]>();
    for (const file of fs.readdirSync(contentDir).filter((f) => f.endsWith(".md")).sort()) {
      for (const h of headingsOf(fs.readFileSync(path.join(contentDir, file), "utf-8"))) {
        byHeading.set(h, [...(byHeading.get(h) ?? []), file]);
      }
    }
    for (const [heading, files] of byHeading) {
      if (files.length >= min) found.push({ slug, heading, files });
    }
  }
  return found.sort((a, b) => b.files.length - a.files.length || a.slug.localeCompare(b.slug));
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf("--root");
  const root = rootIdx >= 0 ? path.resolve(args[rootIdx + 1]) : path.resolve(import.meta.dir, "..");
  const repeated = findRepeatedHeadings(root);
  for (const r of repeated) {
    console.log(`${r.slug}: "${r.heading}" repeats in ${r.files.length} chapters (${r.files.join(", ")})`);
  }
  console.log(`TOTAL: ${repeated.length} repeated headings (same text in ${DEFAULT_MIN_CHAPTERS}+ chapters of one book)`);
  process.exit(repeated.length === 0 ? 0 : 1);
}
