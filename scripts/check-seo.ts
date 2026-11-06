import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { premiumSlugs } from "../functions/lib/premium";

const SITE = "https://dawnbook.belajarcarabelajar.com";

function safeDecode(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * Sitemap rule for one built page (relative path such as
 * `/books/<slug>/content/01_x.html`). The first chapter of every book
 * (`chapters[slug][0]`, the same definition generate-sitemap.ts and
 * inject-gating.ts use) must be absent, because its canonical is the book root.
 * A free book's other pages must be listed. A premium book lists only its root,
 * so its later chapters must be absent: listing one would advertise paid text.
 * Returns an error or null.
 */
export function sitemapCoverageError(
  relativePath: string,
  sitemapContent: string,
  chapters: Record<string, string[]>,
): string | null {
  const expectedUrl = `${SITE}${relativePath}`;
  const canonicalUrl = expectedUrl.endsWith("/index.html")
    ? expectedUrl.replace(/\/index\.html$/, "/")
    : expectedUrl.endsWith(".html")
      ? expectedUrl.replace(/\.html$/, "")
      : expectedUrl;
  const listed =
    sitemapContent.includes(`<loc>${expectedUrl}</loc>`) ||
    sitemapContent.includes(`<loc>${canonicalUrl}</loc>`);

  const slug = /^\/books\/([^/]+)\//.exec(relativePath)?.[1];
  const first = slug ? chapters[slug]?.[0] : undefined;
  if (first && safeDecode(first) === safeDecode(relativePath)) {
    return listed ? `Chapter 1 ${relativePath} must not be in sitemap.xml (its canonical is the book root)!` : null;
  }

  if (slug && premiumSlugs().includes(slug)) {
    if (relativePath !== `/books/${slug}/index.html`) {
      return listed ? `Premium path ${relativePath} must not be in sitemap.xml!` : null;
    }
    return listed ? null : `Content path ${relativePath} missing from sitemap.xml!`;
  }

  if (!sitemapContent.includes(expectedUrl) && !sitemapContent.includes(canonicalUrl)) {
    return `Content path ${relativePath} missing from sitemap.xml!`;
  }
  return null;
}

async function checkSeo() {
  const rootDir = process.cwd();
  const outputDir = join(rootDir, "output");
  let hasErrors = false;

  const headersPath = join(outputDir, "_headers");
  let headersContent = "";
  try {
    headersContent = await readFile(headersPath, "utf-8");
  } catch (err) {
    console.error("❌ [FAIL] output/_headers missing.");
    hasErrors = true;
  }

  const sitemapPath = join(outputDir, "sitemap.xml");
  let sitemapContent = "";
  try {
    sitemapContent = await readFile(sitemapPath, "utf-8");
    if (!sitemapContent.includes("<lastmod>")) {
      console.error("❌ [FAIL] output/sitemap.xml missing <lastmod> timestamps. (R3)");
      hasErrors = true;
    }
  } catch (err) {
    console.error("❌ [FAIL] output/sitemap.xml missing. (R3)");
    hasErrors = true;
  }

  let manifestChapters: Record<string, string[]> = {};
  try {
    manifestChapters = JSON.parse(await readFile(join(outputDir, "manifest.json"), "utf-8")).chapters ?? {};
  } catch {
    // Without a manifest a premium book may list only its root, as in generate-sitemap.ts.
  }

  async function scanDirectory(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (fullPath.endsWith(".html")) {
          const content = await readFile(fullPath, "utf-8");
          const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");

          // Utility pages excluded from sitemap & checks
          if (
            relativePath.endsWith("404.html") ||
            relativePath.endsWith("print.html") ||
            relativePath.endsWith("toc.html")
          ) {
            return;
          }

          // R1 & R26: Title & Meta Description (Google SERP Standard)
          if (!content.includes("<title>") || !content.includes("</title>")) {
            console.error(`❌ [FAIL] ${relativePath} missing <title>. (R1)`);
            hasErrors = true;
          }
          const descMatches = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["'][^>]*>/i);
          if (!descMatches) {
            console.error(`❌ [FAIL] ${relativePath} missing <meta name="description">. (R1)`);
            hasErrors = true;
          } else {
            const desc = descMatches[1];
            const allDescTags = content.match(/<meta\s+name=["']description["'][^>]*>/gi) || [];
            if (allDescTags.length > 1) {
              console.error(`❌ [FAIL] ${relativePath} contains ${allDescTags.length} duplicate <meta name="description"> tags! (R1)`);
              hasErrors = true;
            }

            // R26 Check 1: Length check (160 char max)
            if (desc.length > 160) {
              console.error(`❌ [FAIL] ${relativePath} description exceeds 160 chars (${desc.length} chars): "${desc}" (R26)`);
              hasErrors = true;
            } else if (desc.length < 60) {
              console.error(`❌ [FAIL] ${relativePath} description is too short (${desc.length} chars): "${desc}" (R26)`);
              hasErrors = true;
            }

            // R26 Check 2: No stray spaces before punctuation
            if (/\s+[.,;:!?]/.test(desc)) {
              console.error(`❌ [FAIL] ${relativePath} description has stray space before punctuation: "${desc}" (R26)`);
              hasErrors = true;
            }

            // R26 Check 3: No chopped single-letter word fragments (e.g. " m..." or " p...")
            if (/\s[a-zA-Z]\.\.\.$/.test(desc)) {
              console.error(`❌ [FAIL] ${relativePath} description truncates in the middle of a word: "${desc}" (R26)`);
              hasErrors = true;
            }
          }

          // R2: Canonical and Hreflang
          if (!content.includes('<link rel="canonical"')) {
            console.error(
              `❌ [FAIL] ${relativePath} missing canonical link. (R2)`,
            );
            hasErrors = true;
          }
          if (
            !content.includes('hreflang="en"') ||
            !content.includes('hreflang="id"')
          ) {
            console.error(
              `❌ [FAIL] ${relativePath} missing hreflang tags. (R2)`,
            );
            hasErrors = true;
          }

          // R6: Structured Data (Valid JSON & BreadcrumbList)
          if (!content.includes("application/ld+json")) {
            console.error(
              `❌ [FAIL] ${relativePath} missing JSON-LD structured data. (R6)`,
            );
            hasErrors = true;
          } else {
            const scriptMatches = content.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi) || [];
            for (const scriptTag of scriptMatches) {
              const innerJson = scriptTag.replace(/<script[^>]*>/i, "").replace(/<\/script>/i, "").trim();
              try {
                const parsed = JSON.parse(innerJson);
                if (parsed.headline && typeof parsed.headline === "string" && parsed.headline.startsWith('"')) {
                  console.error(`❌ [FAIL] ${relativePath} JSON-LD headline contains double-escaped quotes: ${parsed.headline}`);
                  hasErrors = true;
                }
              } catch (jsonErr) {
                console.error(`❌ [FAIL] ${relativePath} contains invalid JSON-LD: ${jsonErr}`);
                hasErrors = true;
              }
            }
          }

          // R7: Image alt text
          const imgMatches = content.match(/<img[^>]*>/g) || [];
          for (const img of imgMatches) {
            if (!img.includes("alt=") || img.includes('alt=""')) {
              console.error(
                `❌ [FAIL] ${relativePath} contains image without descriptive alt text: ${img} (R7)`,
              );
              hasErrors = true;
            }
          }

          // Verify content pages against sitemap.xml (chapter 1 never; premium books: root only)
          const sitemapError = sitemapCoverageError(relativePath, sitemapContent, manifestChapters);
          if (sitemapError) {
            console.error(`❌ [FAIL] ${sitemapError}`);
            hasErrors = true;
          }

          // Verify content page does NOT have noindex in _headers
          if (
            headersContent.includes(relativePath) &&
            headersContent.includes("X-Robots-Tag: noindex")
          ) {
            const headerSection = headersContent.split(relativePath)[1];
            if (
              headerSection &&
              headerSection.startsWith("\n  X-Robots-Tag: noindex")
            ) {
              console.error(
                `❌ [FAIL] Content path ${relativePath} incorrectly marked with X-Robots-Tag: noindex!`,
              );
              hasErrors = true;
            }
          }
        }
      }),
    );
  }

  await scanDirectory(join(outputDir, "books"));

  if (hasErrors) {
    console.error("\\n❌ SEO Validation failed. Please fix the above errors.");
    process.exit(1);
  } else {
    console.log("\\n✅ SEO Validation passed! All rules (R1-R7) satisfied.");
  }
}

if (import.meta.main) {
  checkSeo().catch(console.error);
}
