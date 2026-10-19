import fs from "node:fs";
import path from "node:path";
import { extractUrls } from "../../scripts/check-book-structure";

export function contentFiles(bookDir: string): string[] {
  const dir = path.join(bookDir, "src/content");
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort() : [];
}

export function sourceTableSection(notes: string): string[] {
  const lines = notes.split("\n");
  const start = lines.findIndex((l) => l.startsWith("## 9. Source table"));
  if (start < 0) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("## "));
  return end < 0 ? rest : rest.slice(0, end);
}

// Without dataRow, every table row after the header row counts, minus separator rows.
export function sourceTableUrls(notes: string, dataRow?: RegExp): string[] {
  const section = sourceTableSection(notes);
  let dataRows: string[];
  if (dataRow) {
    dataRows = section.filter((l) => dataRow.test(l));
  } else {
    const rows = section.filter((l) => l.startsWith("| "));
    const isSeparator = (l: string) => /^\|[\s:|-]+$/.test(l.trim());
    dataRows = rows.slice(1).filter((l) => !isSeparator(l));
  }
  return extractUrls(dataRows.join("\n"));
}
