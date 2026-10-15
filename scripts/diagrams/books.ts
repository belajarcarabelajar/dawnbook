import fs from "node:fs";
import path from "node:path";

export const toPosix = (p: string) => p.split(path.sep).join("/");

const isListedBook = (booksDir: string, name: string) =>
  !name.startsWith("_") && !name.startsWith(".") && fs.existsSync(path.join(booksDir, name, "book.toml"));

export interface ListBooksOptions {
  // render-diagrams applies the "_" and "." skip to `only` as well and lists nothing when books/ is missing;
  // check-diagrams accepts any `only` that has a book.toml. Each keeps its own unknown-book message.
  filterOnly?: boolean;
}

export function listBooks(root: string, only?: string, { filterOnly = false }: ListBooksOptions = {}): string[] {
  const booksDir = path.join(root, "books");
  if (only !== undefined && !filterOnly) {
    if (!fs.existsSync(path.join(booksDir, only, "book.toml"))) {
      throw new Error(`no book "${only}" (expected ${path.join("books", only, "book.toml")})`);
    }
    return [only];
  }
  if (!fs.existsSync(booksDir)) return [];
  const books = (only === undefined ? fs.readdirSync(booksDir).sort() : [only]).filter((name) => isListedBook(booksDir, name));
  if (only !== undefined && books.length === 0) {
    throw new Error(`book "${only}" not found under ${booksDir} (needs a book.toml)`);
  }
  return books;
}

export function markdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}
