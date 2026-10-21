/**
 * Renders the share card of every book page into `output/og/<slug>/<page>.png`
 * (GEMINI.md section 27). `scripts/build.ts` calls renderOgCards after mdBook
 * and before inject-gating, which points each page's og:image at its card.
 *
 *   bun run og:preview <slug> [--out <dir>]   # render one book's cards to look at them
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { cardPages, renderArt, renderCard } from "./og/cards";
import { ogImagePath } from "./og/paths";
import { COVER_FILE } from "./check-covers";
import { parseBookMetadata } from "./builder/metadata";

export interface CardBook {
  slug: string;
  title: string;
  author: string;
  chapterCount: number;
}

/** Renders every card of one book; `fileFor` maps a card page (`index`, `content/01_x`) to its output file. */
export async function renderBookCards(
  rootDir: string,
  book: CardBook,
  fileFor: (page: string) => string,
): Promise<string[]> {
  const bookDir = path.join(rootDir, "books", book.slug);
  const art = renderArt(await readFile(path.join(bookDir, COVER_FILE), "utf8"));
  const summary = await readFile(path.join(bookDir, "src", "SUMMARY.md"), "utf8");
  const written: string[] = [];
  for (const { page, text } of cardPages(book, summary)) {
    const file = fileFor(page);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, await renderCard(text, art));
    written.push(file);
  }
  return written;
}

export async function renderOgCards(rootDir: string, outputDir: string, books: CardBook[]): Promise<number> {
  const started = performance.now();
  let count = 0;
  for (const book of books) {
    const fileFor = (page: string) => path.join(outputDir, ogImagePath(book.slug, page));
    count += (await renderBookCards(rootDir, book, fileFor)).length;
  }
  console.log(`  → ${count} share cards for ${books.length} books in ${((performance.now() - started) / 1000).toFixed(1)} s`);
  return count;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");
  const slug = args.find((a, i) => !a.startsWith("--") && (outIndex < 0 || i !== outIndex + 1));
  if (!slug) {
    console.error("usage: bun run og:preview <slug> [--out <dir>]");
    process.exit(2);
  }
  const rootDir = process.cwd();
  const meta = await parseBookMetadata(path.join(rootDir, "books", slug), slug);
  const outDir = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(tmpdir(), "dawnbook-og-preview", slug);
  const files = await renderBookCards(
    rootDir,
    { slug, title: meta.formattedTitle, author: meta.author, chapterCount: meta.chapterCount },
    (page) => path.join(outDir, `${page}.png`),
  );
  for (const f of files) console.log(f);
}
