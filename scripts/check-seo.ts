import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { isPublicPath } from "../functions/lib/gating.ts";

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
  } catch (err) {
    console.error("❌ [FAIL] output/sitemap.xml missing. (R3)");
    hasErrors = true;
  }

  async function scanDirectory(dir: string) {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const entryStat = await stat(fullPath);
      
      if (entryStat.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (fullPath.endsWith(".html")) {
        const content = await readFile(fullPath, "utf-8");
        const relativePath = fullPath.split("output")[1].replace(/\\/g, "/");
        const isPublic = isPublicPath(relativePath);

        // Bypass admin checks and toc.html
        if (relativePath.startsWith("/admin") || relativePath.startsWith("/.clerk") || relativePath.endsWith("toc.html")) {
            continue;
        }

        if (isPublic) {
          // R1: Title & Meta Description
          if (!content.includes("<title>") || !content.includes("</title>")) {
            console.error(`❌ [FAIL] ${relativePath} missing <title>. (R1)`);
            hasErrors = true;
          }
          if (!content.includes("<meta name=\"description\"")) {
            console.error(`❌ [FAIL] ${relativePath} missing <meta name="description">. (R1)`);
            hasErrors = true;
          }

          // R2: Canonical and Hreflang
          if (!content.includes("<link rel=\"canonical\"")) {
            console.error(`❌ [FAIL] ${relativePath} missing canonical link. (R2)`);
            hasErrors = true;
          }
          if (!content.includes("hreflang=\"en\"") || !content.includes("hreflang=\"id\"")) {
            console.error(`❌ [FAIL] ${relativePath} missing hreflang tags. (R2)`);
            hasErrors = true;
          }

          // R6: Structured Data
          if (!content.includes("application/ld+json")) {
            console.error(`❌ [FAIL] ${relativePath} missing JSON-LD structured data. (R6)`);
            hasErrors = true;
          }

          // R7: Image alt text
          const imgMatches = content.match(/<img[^>]*>/g) || [];
          for (const img of imgMatches) {
            if (!img.includes("alt=") || img.includes("alt=\"\"")) {
              console.error(`❌ [FAIL] ${relativePath} contains image without descriptive alt text: ${img} (R7)`);
              hasErrors = true;
            }
          }
        } else {
          // R4: Gated paths MUST NOT appear in sitemap.xml
          const url = `https://dawnbook.pages.dev${relativePath}`;
          if (sitemapContent.includes(url)) {
            console.error(`❌ [FAIL] Gated path ${relativePath} found in sitemap.xml! (R4)`);
            hasErrors = true;
          }

          // R4: Gated paths MUST have X-Robots-Tag: noindex in _headers
          if (!headersContent.includes(relativePath) || !headersContent.includes("X-Robots-Tag: noindex")) {
             // Let's do a more robust check: does headersContent contain relativePath followed by noindex?
             const headerSection = headersContent.split(relativePath)[1];
             if (!headerSection || !headerSection.includes("X-Robots-Tag: noindex")) {
                 console.error(`❌ [FAIL] Gated path ${relativePath} missing X-Robots-Tag: noindex in _headers! (R4)`);
                 hasErrors = true;
             }
          }
        }
      }
    }
  }

  await scanDirectory(join(outputDir, "books"));

  if (hasErrors) {
    console.error("\\n❌ SEO Validation failed. Please fix the above errors.");
    process.exit(1);
  } else {
    console.log("\\n✅ SEO Validation passed! All rules (R1-R7) satisfied.");
  }
}

checkSeo().catch(console.error);
