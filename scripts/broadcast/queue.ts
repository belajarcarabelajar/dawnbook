/**
 * Queue of the old-book broadcast (GEMINI.md section 28): the books that were
 * live before the new-book announcement started, oldest first, each with the
 * same message the new-book announcement would send. Built once and frozen in
 * the state file, so a later deploy never reorders it.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { formatAnnouncement, readBookInfo } from "../announce-new-books";
import { parseBookMetadata } from "../builder/metadata";
import type { QueueItem } from "./state";

// 2026-10-21 00.00 WIB, when the new-book announcement started.
export const OLD_BOOK_CUTOFF_MS = Date.UTC(2026, 9, 20, 17, 0, 0);

export async function hubReleaseMs(rootDir: string, slug: string): Promise<number> {
  // The date the Hub card shows; parseBookMetadata reads release-dates.json from process.cwd().
  return (await parseBookMetadata(join(rootDir, "books", slug), slug)).mtimeMs;
}

export async function buildQueue(opts: {
  rootDir: string;
  liveManifest: unknown;
  releaseMs: (slug: string) => Promise<number>;
}): Promise<QueueItem[]> {
  const books = (opts.liveManifest as { books?: unknown } | null)?.books;
  if (!Array.isArray(books) || books.length === 0 || !books.every((b) => typeof b === "string")) {
    throw new Error("live manifest has no books; refusing to build an empty queue");
  }
  const old: { slug: string; ms: number }[] = [];
  for (const slug of books as string[]) {
    if (!existsSync(join(opts.rootDir, "books", slug, "book.toml"))) {
      throw new Error(`books/${slug}/book.toml not found`);
    }
    const ms = await opts.releaseMs(slug);
    if (!Number.isFinite(ms) || ms <= 0) throw new Error(`${slug}: release time ${ms} is not a positive time`);
    if (ms < OLD_BOOK_CUTOFF_MS) old.push({ slug, ms });
  }
  old.sort((x, y) => x.ms - y.ms || (x.slug < y.slug ? -1 : x.slug > y.slug ? 1 : 0));
  const queue: QueueItem[] = [];
  for (const { slug } of old) {
    const info = await readBookInfo(opts.rootDir, slug);
    queue.push({ slug, text: formatAnnouncement(info), url: info.url });
  }
  return queue;
}
