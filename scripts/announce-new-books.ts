/**
 * Announces newly deployed books in the Dawnbook Telegram group (GEMINI.md section 28):
 * one plain-text message per book with its first chapter's page title and link.
 *
 * CI (`.github/workflows/deploy.yml`) saves the live `manifest.json` before
 * `pages deploy` and runs this script after the deploy succeeds. A slug that is
 * in the new build but not in that snapshot is a new book, so each book is
 * announced once, by the first deploy that ships it.
 *
 *   bun run scripts/announce-new-books.ts --before <live-manifest.json> [--after output/manifest.json]
 *   bun run scripts/announce-new-books.ts --slug <slug> [--slug <slug>]   # announce by hand
 *   add --dry-run to print the messages without sending
 *
 * Needs TELEGRAM_BOT_TOKEN and DAWNBOOK_TELEGRAM_CHAT_ID; without them it logs
 * and exits 0 (removing either secret is the kill switch). One attempt per
 * book, no retry, at most MAX_ANNOUNCEMENTS messages per run.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export const SITE_URL = "https://dawnbook.belajarcarabelajar.com";
export const MAX_ANNOUNCEMENTS = 3;
const REQUEST_TIMEOUT_MS = 20_000;

export interface BookInfo {
  slug: string;
  bookTitle: string;
  chapterTitle: string;
  url: string;
}

function slugList(manifest: unknown): string[] | null {
  const books = (manifest as { books?: unknown } | null)?.books;
  if (!Array.isArray(books) || !books.every((b) => typeof b === "string")) return null;
  return books;
}

export function findNewSlugs(before: unknown, after: unknown): string[] {
  const live = slugList(before);
  if (!live || live.length === 0) {
    throw new Error("live manifest baseline has no books; refusing to treat every book as new");
  }
  const built = slugList(after);
  if (!built) throw new Error("build manifest has no books array");
  const known = new Set(live);
  return built.filter((slug) => !known.has(slug));
}

// The owner's chosen format (2026-10-21): the first chapter's page title as
// mdBook writes it ("<chapter> - <book>"), a blank line, and that chapter's
// link without `.html`, so Telegram previews the page under it.
export function formatAnnouncement(book: BookInfo): string {
  return `${book.chapterTitle} - ${book.bookTitle}\n\n${book.url}`;
}

export function chapterUrl(slug: string, summaryPath: string): string {
  const page = summaryPath.replace(/^\.\//, "").replace(/\.md$/, "");
  if (page === "README" || page === "index") return `${SITE_URL}/books/${slug}/`;
  return `${SITE_URL}/books/${slug}/${page}`;
}

export async function readBookInfo(rootDir: string, slug: string): Promise<BookInfo> {
  const bookDir = join(rootDir, "books", slug);
  const tomlPath = join(bookDir, "book.toml");
  if (!existsSync(tomlPath)) throw new Error(`books/${slug}/book.toml not found`);
  const title = (await readFile(tomlPath, "utf8")).match(/^\s*title\s*=\s*"((?:[^"\\]|\\.)*)"/m);
  if (!title) throw new Error(`books/${slug}/book.toml has no title`);
  const summary = await readFile(join(bookDir, "src", "SUMMARY.md"), "utf8");
  const first = summary.match(/^\s*- \[(.+)\]\(([^)\s]+\.md)\)/m);
  if (!first) throw new Error(`books/${slug}/src/SUMMARY.md has no chapter link`);
  return {
    slug,
    bookTitle: title[1].replace(/\\(["\\])/g, "$1"),
    chapterTitle: first[1],
    url: chapterUrl(slug, first[2]),
  };
}

async function sendMessage(
  token: string,
  chatId: string,
  text: string,
  fetchImpl: typeof fetch,
): Promise<void> {
  const redact = (s: string) => s.split(token).join("<token>");
  let res: Response;
  try {
    res = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw new Error(redact(err instanceof Error ? err.message : String(err)));
  }
  const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!res.ok || !body.ok) {
    throw new Error(redact(`Telegram ${res.status}: ${body.description ?? "no description"}`));
  }
}

interface Options {
  before?: string;
  after: string;
  slugs: string[];
  dryRun: boolean;
}

function parseArgs(argv: string[]): Options | string {
  const opts: Options = { after: "output/manifest.json", slugs: [], dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--before" || arg === "--after" || arg === "--slug") {
      const value = argv[++i];
      if (!value) return `${arg} needs a value`;
      if (arg === "--before") opts.before = value;
      else if (arg === "--after") opts.after = value;
      else opts.slugs.push(value);
    } else return `unknown argument: ${arg}`;
  }
  if (!opts.before && opts.slugs.length === 0) return "pass --before <live-manifest.json> or --slug <slug>";
  return opts;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function main(
  argv: string[],
  deps: {
    rootDir?: string;
    env?: Record<string, string | undefined>;
    fetch?: typeof fetch;
    log?: (message: string) => void;
  } = {},
): Promise<number> {
  const rootDir = deps.rootDir ?? process.cwd();
  const env = deps.env ?? process.env;
  const fetchImpl = deps.fetch ?? fetch;
  const log = deps.log ?? console.log;

  const opts = parseArgs(argv);
  if (typeof opts === "string") {
    log(`announce-new-books: ${opts}`);
    return 2;
  }

  let slugs: string[];
  if (opts.slugs.length > 0) {
    slugs = opts.slugs;
  } else {
    try {
      const before = await readJson(resolve(rootDir, opts.before!));
      const after = await readJson(resolve(rootDir, opts.after));
      slugs = findNewSlugs(before, after);
    } catch (err) {
      log(`::error::announce-new-books: ${err instanceof Error ? err.message : err}`);
      log("Nothing was sent. Announce a new book by hand with --slug <slug>.");
      return 1;
    }
  }

  if (slugs.length === 0) {
    log("announce-new-books: no new books in this deploy.");
    return 0;
  }
  if (slugs.length > MAX_ANNOUNCEMENTS) {
    log(
      `::error::announce-new-books: ${slugs.length} books look new (${slugs.join(", ")}), ` +
        `more than ${MAX_ANNOUNCEMENTS}. Nothing was sent; announce them by hand with --slug if this is right.`,
    );
    return 1;
  }

  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.DAWNBOOK_TELEGRAM_CHAT_ID;
  if (!opts.dryRun && (!token || !chatId)) {
    log(
      "announce-new-books: TELEGRAM_BOT_TOKEN or DAWNBOOK_TELEGRAM_CHAT_ID is not set; " +
        `skipping the announcement of ${slugs.join(", ")}.`,
    );
    return 0;
  }

  let failed = 0;
  for (const slug of slugs) {
    try {
      const text = formatAnnouncement(await readBookInfo(rootDir, slug));
      if (opts.dryRun) {
        log(`--- ${slug} (dry run, not sent)\n${text}`);
        continue;
      }
      await sendMessage(token!, chatId!, text, fetchImpl);
      log(`announce-new-books: announced ${slug}.`);
    } catch (err) {
      failed++;
      log(`::error::announce-new-books: ${slug}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return failed > 0 ? 1 : 0;
}

if (import.meta.main) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
