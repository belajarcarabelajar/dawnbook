import { readdir, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

export interface SitemapItem {
  loc: string;
  lastmod: string;
  changefreq?: string;
  priority?: string;
}

export async function generateSitemap() {
  const rootDir = process.cwd();
  const outputDir = join(rootDir, "output");
  const baseUrl = "https://dawnbook.belajarcarabelajar.com";
  const todayIso = new Date().toISOString().split("T")[0];

  let entries: SitemapItem[] = [];

  // Add static public hub pages
  entries.push({ loc: `${baseUrl}/`, lastmod: todayIso, changefreq: "daily", priority: "1.0" });
  entries.push({ loc: `${baseUrl}/about`, lastmod: todayIso, changefreq: "monthly", priority: "0.7" });
  entries.push({ loc: `${baseUrl}/contribute`, lastmod: todayIso, changefreq: "monthly", priority: "0.7" });
  entries.push({ loc: `${baseUrl}/donate`, lastmod: todayIso, changefreq: "monthly", priority: "0.7" });
  entries.push({ loc: `${baseUrl}/appreciation`, lastmod: todayIso, changefreq: "monthly", priority: "0.7" });
  entries.push({ loc: `${baseUrl}/statistics`, lastmod: todayIso, changefreq: "weekly", priority: "0.7" });
  entries.push({ loc: `${baseUrl}/dmca`, lastmod: todayIso, changefreq: "monthly", priority: "0.5" });

  async function scanDirectory(dir: string) {
    const dirEntries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      dirEntries.map(async (entry) => {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".html")) {
          const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
          // Exclude system/utility pages from sitemap
          if (
            relativePath.endsWith("404.html") ||
            relativePath.endsWith("print.html") ||
            relativePath.endsWith("toc.html") ||
            relativePath.startsWith("/admin/")
          ) {
            return;
          }

          let cleanPath = relativePath;
          let priority = "0.8";
          if (cleanPath.endsWith("/index.html")) {
            cleanPath = cleanPath.replace(/\/index\.html$/, "/");
            priority = "0.9";
          } else if (cleanPath.endsWith(".html")) {
            cleanPath = cleanPath.replace(/\.html$/, "");
          }

          let fileLastmod = todayIso;
          try {
            const fileStat = await stat(fullPath);
            if (fileStat.mtime) {
              fileLastmod = new Date(fileStat.mtime).toISOString().split("T")[0];
            }
          } catch {
            // fallback to todayIso
          }

          entries.push({
            loc: `${baseUrl}${cleanPath}`,
            lastmod: fileLastmod,
            changefreq: "weekly",
            priority,
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
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq || "weekly"}</changefreq>
    <priority>${e.priority || "0.8"}</priority>
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
