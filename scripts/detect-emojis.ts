import fs from "node:fs";
import path from "node:path";

// Unicode property escape for visual emoji detection
const EMOJI_REGEX = /\p{Extended_Pictographic}/gu;

export interface EmojiMatch {
  bookSlug: string;
  filePath: string;
  lineNumber: number;
  emoji: string;
  lineContent: string;
}

export async function scanAndCleanFile(
  filePath: string,
  bookSlug: string,
  shouldFix: boolean,
): Promise<EmojiMatch[]> {
  const matches: EmojiMatch[] = [];
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    const lines = content.split("\n");
    let fileModified = false;

    const newLines = lines.map((line, index) => {
      const foundEmojis = line.match(EMOJI_REGEX);
      if (foundEmojis && foundEmojis.length > 0) {
        foundEmojis.forEach((emoji) => {
          matches.push({
            bookSlug,
            filePath,
            lineNumber: index + 1,
            emoji,
            lineContent: line.trim(),
          });
        });

        if (shouldFix) {
          fileModified = true;
          // Strip emojis and clean double spaces if left behind
          let cleaned = line.replace(EMOJI_REGEX, "").replace(/  +/g, " ");
          // Clean trailing spaces before end of line
          cleaned = cleaned.replace(/\s+$/g, "");
          return cleaned;
        }
      }
      return line;
    });

    if (shouldFix && fileModified) {
      await fs.promises.writeFile(filePath, newLines.join("\n"), "utf8");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  return matches;
}

export async function scanBook(
  bookSlug: string,
  booksDir: string,
  shouldFix: boolean,
): Promise<EmojiMatch[]> {
  const bookDir = path.join(booksDir, bookSlug);
  const matches: EmojiMatch[] = [];

  try {
    const stats = await fs.promises.stat(bookDir);
    if (!stats.isDirectory()) return matches;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return matches;
    throw error;
  }

  const promises: Promise<EmojiMatch[]>[] = [];

  // Check SUMMARY.md
  const summaryPath = path.join(bookDir, "src", "SUMMARY.md");
  promises.push(scanAndCleanFile(summaryPath, bookSlug, shouldFix));

  // Check content directory
  const contentDir = path.join(bookDir, "src", "content");
  try {
    const dirents = await fs.promises.readdir(contentDir, {
      withFileTypes: true,
    });
    for (const dirent of dirents) {
      if (dirent.isFile() && dirent.name.endsWith(".md")) {
        promises.push(
          scanAndCleanFile(
            path.join(contentDir, dirent.name),
            bookSlug,
            shouldFix,
          ),
        );
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const results = await Promise.all(promises);
  for (const res of results) {
    matches.push(...res);
  }

  return matches;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes("--fix");
  const filteredArgs = args.filter((a) => a !== "--fix");
  const targetSlug = filteredArgs[0];

  const rootDir = process.cwd();
  const booksDir = path.join(rootDir, "books");

  console.log(
    `🔍 Starting Dawnbook Emoji Audit ${shouldFix ? "(AUTO-FIX MODE ACTIVE)" : ""}...\n`,
  );

  let bookSlugs: string[] = [];

  if (targetSlug) {
    console.log(`📌 Target Book Specified: ${targetSlug}`);
    bookSlugs = [targetSlug];
  } else {
    // Priority order: check neurobiologi-motivasi-dopamin first, then all others
    let allEntries: fs.Dirent[] = [];
    try {
      allEntries = await fs.promises.readdir(booksDir, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }

    const validBooks = allEntries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith("_") &&
          !entry.name.startsWith("."),
      )
      .map((entry) => entry.name);

    if (validBooks.includes("neurobiologi-motivasi-dopamin")) {
      bookSlugs = [
        "neurobiologi-motivasi-dopamin",
        ...validBooks.filter((b) => b !== "neurobiologi-motivasi-dopamin"),
      ];
    } else {
      bookSlugs = validBooks;
    }
  }

  // To preserve output order while running concurrently, we await all and then log
  const bookPromises = bookSlugs.map((slug) =>
    scanBook(slug, booksDir, shouldFix),
  );
  const bookResults = await Promise.all(bookPromises);

  const allMatches: EmojiMatch[] = [];

  for (let i = 0; i < bookSlugs.length; i++) {
    const slug = bookSlugs[i];
    const bookMatches = bookResults[i];

    if (bookMatches.length > 0) {
      console.log(
        `❌ [${shouldFix ? "FIXED EMOJI" : "FOUND EMOJI"}] Book: ${slug} (${bookMatches.length} emoji(s))`,
      );
      bookMatches.forEach((m) => {
        const relativePath = path.relative(rootDir, m.filePath);
        console.log(
          `   - ${relativePath}:${m.lineNumber} -> ${m.emoji} | "${m.lineContent}"`,
        );
      });
      allMatches.push(...bookMatches);
    } else {
      console.log(`✅ [CLEAN] Book: ${slug}`);
    }
  }

  console.log("\n========================================");
  console.log(
    `📊 Audit Summary: ${allMatches.length} total emoji(s) ${shouldFix ? "stripped/cleaned" : "found"} across ${bookSlugs.length} book(s).`,
  );
  console.log("========================================\n");

  if (!shouldFix && allMatches.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module || (typeof import.meta !== "undefined" && import.meta.main)) {
  main().catch((error) => {
    console.error("An error occurred:", error);
    process.exit(1);
  });
}
