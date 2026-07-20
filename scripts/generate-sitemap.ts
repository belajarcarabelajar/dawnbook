import { readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isPublicPath } from "../functions/lib/gating.ts";

async function generateSitemap() {
  const rootDir = process.cwd();
  const outputDir = join(rootDir, "output");
  const baseUrl = "https://dawnbook.belajarcarabelajar.com";

  let urls: string[] = [];

  // Add static public hub pages
  urls.push(`${baseUrl}/`);
  urls.push(`${baseUrl}/about.html`);
  urls.push(`${baseUrl}/contribute.html`);
  urls.push(`${baseUrl}/donate.html`);
  urls.push(`${baseUrl}/appreciation.html`);

  async function scanDirectory(dir: string) {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath);
      if (entryStat.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (fullPath.endsWith(".html")) {
        const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
        if (isPublicPath(relativePath)) {
          // Do not include the admin SPA in the sitemap (it's auth-gated client-side).
          if (!relativePath.startsWith("/admin")) {
            urls.push(`${baseUrl}${relativePath}`);
          }
        }
      }
    }
  }

  try {
    await scanDirectory(join(outputDir, "books"));
  } catch (err) {
    console.warn("Could not read output/books. Has build run?");
  }

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`).join("\n")}
</urlset>`;

  await writeFile(join(outputDir, "sitemap.xml"), sitemapContent);
  console.log("✅ sitemap.xml generated with", urls.length, "URLs.");

  const robotsContent = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/

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

generateSitemap().catch(console.error);
