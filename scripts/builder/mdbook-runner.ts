import { readdir, stat, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { BuiltBook, parseBookMetadata } from "./metadata";

export async function prepareBookForMdbook(
  booksDir: string,
  tmpBooksDir: string,
  bookName: string
): Promise<void> {
  const srcBookPath = join(booksDir, bookName);
  const tmpBookPath = join(tmpBooksDir, bookName);

  await $`rm -rf ${tmpBookPath}`;
  await mkdir(tmpBookPath, { recursive: true });
  await $`cp -r ${srcBookPath}/* ${tmpBookPath}/`;

  const sharedAssets = ["shared-header.css", "shared-script.js"];
  for (const asset of sharedAssets) {
    try {
      await $`cp ${join(booksDir, asset)} ${join(tmpBooksDir, asset)}`;
    } catch {}
  }
}

export async function buildAllBooks(
  booksDir: string,
  outputBooksDir: string
): Promise<BuiltBook[]> {
  const entries = await readdir(booksDir, { withFileTypes: true });
  const builtBooks: BuiltBook[] = [];

  console.log("Synchronizing book configurations from _template...");
  await $`bun run scripts/sync-template.ts`;

  console.log("Checking media embed support across all books...");
  await $`bun run scripts/check-media-support.ts`;

  const tmpBooksDir = join(process.cwd(), ".build-tmp");

  for (const entry of entries) {
    const bookPath = join(booksDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      if (!/^[a-zA-Z0-9_-]+$/.test(entry.name)) {
        console.warn(`Skipping invalid directory name: ${entry.name}`);
        continue;
      }

      try {
        await stat(join(bookPath, "book.toml"));
      } catch {
        continue;
      }

      const tmpBookPath = join(tmpBooksDir, entry.name);
      await prepareBookForMdbook(booksDir, tmpBooksDir, entry.name);

      console.log(`Building book: ${entry.name}`);
      const destPath = join(outputBooksDir, entry.name);

      try {
        await $`mdbook build ${tmpBookPath} -d ${destPath}`;
        const meta = await parseBookMetadata(bookPath, entry.name);

        builtBooks.push({
          slug: entry.name,
          title: meta.formattedTitle,
          author: meta.author,
          chapterCount: meta.chapterCount,
          emoji: meta.emoji,
          chapters: meta.chapters,
          mtimeMs: meta.mtimeMs,
        });
        console.log(`Successfully built: ${entry.name}`);
      } catch (error) {
        console.error(`Failed to build book: ${entry.name}`, error);
        process.exit(1);
      }
    }
  }

  builtBooks.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return builtBooks;
}
