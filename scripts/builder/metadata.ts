import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

export interface BuiltBook {
  slug: string;
  title: string;
  author: string;
  chapterCount: number;
  emoji: string;
  chapters: string[];
  mtimeMs: number;
}

export async function parseBookMetadata(
  bookPath: string,
  bookName: string
): Promise<{ formattedTitle: string; author: string; chapterCount: number; chapters: string[]; emoji: string; mtimeMs: number }> {
  let formattedTitle = bookName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  let author = "Iwan Kurniawan";

  try {
    const tomlText = await readFile(join(bookPath, "book.toml"), "utf8");
    const titleMatch = tomlText.match(/title\s*=\s*"([^"]+)"/);
    if (titleMatch) formattedTitle = titleMatch[1];
    const authorsMatch = tomlText.match(/authors\s*=\s*\[\s*"([^"]+)"\s*\]/);
    if (authorsMatch) author = authorsMatch[1];
  } catch (e) {
    console.warn("Failed to parse book.toml title or author", e);
  }

  let chapterCount = 0;
  let chapters: string[] = [];

  try {
    const summaryText = await readFile(
      join(bookPath, "src", "SUMMARY.md"),
      "utf8"
    );
    const lines = summaryText
      .split("\n")
      .filter((line) => line.trim().startsWith("- ["));
    chapterCount = lines.length;
    chapters = lines
      .map((line) => {
        const match = line.match(/\]\((.*?)\.md\)/);
        if (match) {
          let filename = match[1];
          filename = decodeURIComponent(filename.replace(/^\.\//, ""));
          if (filename === "README" || filename === "index") {
            return `/books/${bookName}/index.html`;
          }
          return `/books/${bookName}/${filename}.html`;
        }
        return null;
      })
      .filter(Boolean) as string[];
  } catch (e) {
    console.warn(`Could not read SUMMARY.md for ${bookName}`);
  }

  let emoji = "📖";
  try {
    const iconText = await readFile(join(bookPath, "icon.txt"), "utf8");
    if (iconText.trim()) emoji = iconText.trim();
  } catch (e) {
    console.warn("Failed to read icon.txt, falling back to generic", e);
  }

  let mtimeMs = 0;
  try {
    const bookStat = await stat(bookPath);
    mtimeMs = bookStat.mtimeMs;
  } catch (e) {}

  try {
    const gitLog = await $`git log -1 --format=%ct ${bookPath}`.quiet().text();
    const ts = parseInt(gitLog.trim(), 10);
    if (!isNaN(ts) && ts > 0) {
      mtimeMs = ts * 1000;
    }
  } catch (e) {}

  return { formattedTitle, author, chapterCount, chapters, emoji, mtimeMs };
}
