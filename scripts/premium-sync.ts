// Copies premium books from the private checkout into gitignored books/<slug>/
// before a build. A copy, not a symlink: the build scripts walk books/ with
// isDirectory(), which is false for a symlink.
import { cpSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { premiumSlugs } from "../functions/lib/premium";

export type SyncOptions = {
  sourceDir: string;
  booksDir: string;
  slugs: string[];
  isIgnored: (relPath: string) => boolean;
};

export type SyncResult = { copied: string[]; skipped: string[] };

export function syncPremiumBooks(opts: SyncOptions): SyncResult {
  // Every slug is checked before anything is copied, so one trackable folder
  // stops the whole sync instead of leaving premium text half-copied.
  for (const slug of opts.slugs) {
    if (!opts.isIgnored(`books/${slug}/`)) {
      throw new Error(`books/${slug}/ is not git-ignored; premium text would become trackable. Add it to .gitignore.`);
    }
  }

  const result: SyncResult = { copied: [], skipped: [] };
  for (const slug of opts.slugs) {
    const src = join(opts.sourceDir, "books", slug);
    if (!existsSync(src)) {
      console.warn(`warning: premium book ${slug} not found at ${src}; skipped`);
      result.skipped.push(slug);
      continue;
    }
    const dest = join(opts.booksDir, slug);
    rmSync(dest, { recursive: true, force: true });
    cpSync(src, dest, { recursive: true });
    result.copied.push(slug);
  }
  return result;
}

export function defaultPremiumDir(repoRoot: string): string {
  return process.env.DAWNBOOK_PREMIUM_DIR || resolve(repoRoot, "..", "dawnbook-premium");
}

export function gitIsIgnored(repoRoot: string): (relPath: string) => boolean {
  // Exit 0 means ignored; 1 (not ignored) and 128 (git error) both fail closed.
  return (relPath) =>
    Bun.spawnSync(["git", "check-ignore", "-q", relPath], { cwd: repoRoot, stdout: "ignore", stderr: "ignore" })
      .exitCode === 0;
}

/** The sync with the CLI defaults, printing one line per slug. Throws on a slug that is not git-ignored. */
export function syncPremiumBooksForRepo(repoRoot: string, slugs: string[] = premiumSlugs()): SyncResult {
  if (slugs.length === 0) {
    console.log("no premium books registered");
    return { copied: [], skipped: [] };
  }
  const result = syncPremiumBooks({
    sourceDir: defaultPremiumDir(repoRoot),
    booksDir: join(repoRoot, "books"),
    slugs,
    isIgnored: gitIsIgnored(repoRoot),
  });
  for (const slug of result.copied) console.log(`copied ${slug}`);
  for (const slug of result.skipped) console.log(`skipped ${slug} (source missing)`);
  return result;
}

function parseSlugs(argv: string[]): string[] | null {
  const slugs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== "--slug" || !argv[i + 1] || argv[i + 1].startsWith("--")) return null;
    slugs.push(argv[++i]);
  }
  return slugs;
}

if (import.meta.main) {
  const repoRoot = resolve(import.meta.dir, "..");
  const requested = parseSlugs(process.argv.slice(2));
  if (requested === null) {
    console.error("usage: bun run scripts/premium-sync.ts [--slug <slug>]...");
    process.exit(2);
  }
  const registered = premiumSlugs();
  const unknown = requested.filter((s) => !registered.includes(s));
  if (unknown.length > 0) {
    console.error(`not in data/premium-books.json: ${unknown.join(", ")}`);
    process.exit(2);
  }
  try {
    syncPremiumBooksForRepo(repoRoot, requested.length > 0 ? requested : registered);
  } catch (err) {
    console.error(`error: ${(err as Error).message}`);
    process.exit(1);
  }
}
