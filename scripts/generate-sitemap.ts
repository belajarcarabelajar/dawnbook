import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { premiumSlugs } from "../functions/lib/premium";

export interface SitemapItem {
  loc: string;
  lastmod?: string;
}

export interface SitemapOptions {
  outputDir?: string;
  /** Repo-relative path to YYYY-MM-DD of its newest commit; default gitLastmods(cwd). */
  lastmods?: Map<string, string>;
}

const DATE_LINE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Date of the newest commit touching each file under books/, from one git log
 * run. Google trusts <lastmod> only when it is verifiably accurate, and a
 * build file's mtime is the deploy date for every page. Returns an empty map
 * when git is missing or the directory is not a repository.
 */
export function gitLastmods(rootDir: string): Map<string, string> {
  const map = new Map<string, string>();
  let stdout: string;
  try {
    const result = Bun.spawnSync(
      ["git", "-c", "core.quotePath=false", "log", "--format=%cs", "--name-only", "--", "books"],
      { cwd: rootDir, stdout: "pipe", stderr: "ignore" },
    );
    if (result.exitCode !== 0) return map;
    stdout = result.stdout.toString();
  } catch {
    return map;
  }
  let date = "";
  for (const line of stdout.split("\n")) {
    if (!line) continue;
    if (DATE_LINE.test(line)) {
      date = line;
    } else if (date && !map.has(line)) {
      // git log lists newest first, so the first date seen is the newest.
      map.set(line, date);
    }
  }
  return map;
}

function newestWithPrefix(lastmods: Map<string, string>, prefix: string): string | undefined {
  let newest: string | undefined;
  for (const [path, date] of lastmods) {
    if (path.startsWith(prefix) && (!newest || date > newest)) newest = date;
  }
  return newest;
}

function pageLastmod(lastmods: Map<string, string>, relativePath: string): string | undefined {
  let decoded = relativePath;
  try {
    decoded = decodeURIComponent(relativePath);
  } catch {
    // Keep the raw path when it holds a stray "%".
  }
  const chapter = /^\/books\/([^/]+)\/content\/(.+)\.html$/.exec(decoded);
  if (chapter) return lastmods.get(`books/${chapter[1]}/src/content/${chapter[2]}.md`);
  const root = /^\/books\/([^/]+)\/index\.html$/.exec(decoded);
  if (root) return newestWithPrefix(lastmods, `books/${root[1]}/`);
  return undefined;
}

/**
 * Pages of a premium book that may be listed: the book root and its first
 * chapter (first SUMMARY entry in manifest.json). Paths are the decoded
 * `/books/<slug>/...html` form the manifest uses. Without a manifest entry only
 * the root is listed, so a missing manifest never exposes a paid chapter.
 */
async function premiumListablePages(outputDir: string): Promise<Map<string, Set<string>>> {
  let chapters: Record<string, string[]> = {};
  try {
    const manifest = JSON.parse(await readFile(join(outputDir, "manifest.json"), "utf8"));
    chapters = manifest?.chapters ?? {};
  } catch {
    // Fall through with no chapters: premium books keep only their root.
  }
  const listable = new Map<string, Set<string>>();
  for (const slug of premiumSlugs()) {
    const pages = new Set([`/books/${slug}/index.html`]);
    const first = chapters[slug]?.[0];
    if (first) pages.add(first);
    listable.set(slug, pages);
  }
  return listable;
}

export async function generateSitemap(options: SitemapOptions = {}) {
  const rootDir = process.cwd();
  const outputDir = resolve(options.outputDir ?? join(rootDir, "output"));
  const premiumPages = await premiumListablePages(outputDir);
  const lastmods = options.lastmods ?? gitLastmods(rootDir);
  const baseUrl = "https://dawnbook.belajarcarabelajar.com";

  let entries: SitemapItem[] = [];

  // Add static public hub pages
  entries.push({ loc: `${baseUrl}/`, lastmod: newestWithPrefix(lastmods, "") });
  entries.push({ loc: `${baseUrl}/about` });
  entries.push({ loc: `${baseUrl}/contribute` });
  entries.push({ loc: `${baseUrl}/donate` });
  entries.push({ loc: `${baseUrl}/appreciation` });
  entries.push({ loc: `${baseUrl}/statistics` });
  entries.push({ loc: `${baseUrl}/dmca` });

  async function scanDirectory(dir: string) {
    const dirEntries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      dirEntries.map(async (entry) => {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
          const relativePath = fullPath.slice(outputDir.length).replace(/\\/g, "/");
          // Exclude system/utility pages from sitemap
          if (
            relativePath.endsWith("404.html") ||
            relativePath.endsWith("print.html") ||
            relativePath.endsWith("toc.html") ||
            relativePath.startsWith("/admin/")
          ) {
            return;
          }

          const premiumSlug = /^\/books\/([^/]+)\//.exec(relativePath)?.[1];
          const allowed = premiumSlug ? premiumPages.get(premiumSlug) : undefined;
          if (allowed && !allowed.has(relativePath)) return;

          let cleanPath = relativePath;
          if (cleanPath.endsWith("/index.html")) {
            cleanPath = cleanPath.replace(/\/index\.html$/, "/");
          } else if (cleanPath.endsWith(".html")) {
            cleanPath = cleanPath.replace(/\.html$/, "");
          }

          entries.push({
            loc: `${baseUrl}${cleanPath}`,
            lastmod: pageLastmod(lastmods, relativePath),
          });
        }
      })
    );
  }

  try {
    await scanDirectory(join(outputDir, "books"));
  } catch (err) {
    console.warn("Could not read output/books. Has build run?");
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ""}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  await writeFile(join(outputDir, "sitemap.xml"), sitemapContent);
  console.log("✅ sitemap.xml generated with", entries.length, "URLs.");

  const robotsContent = `User-agent: *
Allow: /

# AI Search Crawlers & LLM Indexers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
  await writeFile(join(outputDir, "robots.txt"), robotsContent);
  console.log("✅ robots.txt generated with AI crawler permissions.");
}

if (import.meta.main) {
  generateSitemap().catch(console.error);
}
