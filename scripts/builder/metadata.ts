import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function formatIndonesianDate(ms: number): string {
  if (!ms || ms <= 0) return "";
  const date = new Date(ms);
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const day = wibDate.getUTCDate();
  const monthName = MONTHS_ID[wibDate.getUTCMonth()];
  const year = wibDate.getUTCFullYear();

  const hours = String(wibDate.getUTCHours()).padStart(2, "0");
  const minutes = String(wibDate.getUTCMinutes()).padStart(2, "0");

  return `${day} ${monthName} ${year}, ${hours}.${minutes} WIB`;
}

export interface BuiltBook {
  slug: string;
  title: string;
  author: string;
  chapterCount: number;
  emoji: string;
  chapters: string[];
  mtimeMs: number;
  formattedDate: string;
}

export async function parseBookMetadata(
  bookPath: string,
  bookName: string
): Promise<{ formattedTitle: string; author: string; chapterCount: number; chapters: string[]; emoji: string; mtimeMs: number; formattedDate: string }> {
  let formattedTitle = bookName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  let author = "Iwan Kurniawan";

  try {
    const tomlText = await readFile(join(bookPath, "book.toml"), "utf8");
    const titleMatch = tomlText.match(/title\s*=\s*"([^"]+)"/);
    if (titleMatch) formattedTitle = titleMatch[1];
    const cleanedToml = tomlText
      .split("\n")
      .map((line) => line.replace(/#.*$/, ""))
      .join("\n");
    const authorsMatch = cleanedToml.match(/authors\s*=\s*\[([\s\S]*?)\]/);
    if (authorsMatch) {
      const names = authorsMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, "").trim())
        .filter(Boolean);
      if (names.length > 0) {
        author = Array.from(new Set(names)).join(", ");
      }
    }
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

  let pinnedMs = 0;
  try {
    const releaseDatesText = await readFile(join(process.cwd(), "release-dates.json"), "utf8");
    const releaseDates = JSON.parse(releaseDatesText);
    if (releaseDates[bookName] && typeof releaseDates[bookName] === "number") {
      pinnedMs = releaseDates[bookName];
    }
  } catch (e) {}

  let gitCommitMs = 0;
  try {
    // Get initial commit timestamp (release date) of the book content
    const gitLogSrc = await $`git log --reverse --format=%ct ${join(bookPath, "src")}`.quiet().text();
    const firstLine = gitLogSrc.trim().split("\n")[0];
    const ts = parseInt(firstLine, 10);
    if (!isNaN(ts) && ts > 0) {
      gitCommitMs = ts * 1000;
    }
  } catch (e) {}

  if (gitCommitMs === 0) {
    try {
      const gitLogDir = await $`git log --reverse --format=%ct ${bookPath}`.quiet().text();
      const firstLine = gitLogDir.trim().split("\n")[0];
      const ts = parseInt(firstLine, 10);
      if (!isNaN(ts) && ts > 0) {
        gitCommitMs = ts * 1000;
      }
    } catch (e) {}
  }

  let fileCreationMs = 0;
  try {
    const fileStat = await stat(join(bookPath, "book.toml"));
    const birth = fileStat.birthtimeMs > 0 ? fileStat.birthtimeMs : 0;
    const mtime = fileStat.mtimeMs > 0 ? fileStat.mtimeMs : 0;
    if (birth > 0 && mtime > 0) {
      fileCreationMs = Math.min(birth, mtime);
    } else {
      fileCreationMs = birth || mtime || 0;
    }
  } catch (e) {}

  let mtimeMs = 0;
  if (pinnedMs > 0) {
    mtimeMs = pinnedMs;
  } else if (gitCommitMs > 0 && fileCreationMs > 0) {
    mtimeMs = Math.min(gitCommitMs, fileCreationMs);
  } else {
    mtimeMs = gitCommitMs || fileCreationMs || 0;
  }

  if (mtimeMs === 0) {
    try {
      const bookStat = await stat(bookPath);
      mtimeMs = bookStat.mtimeMs;
    } catch (e) {}
  }

  const formattedDate = formatIndonesianDate(mtimeMs);
  return { formattedTitle, author, chapterCount, chapters, emoji, mtimeMs, formattedDate };
}

