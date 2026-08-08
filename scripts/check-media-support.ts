import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

async function checkMediaSupport() {
  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const buildScriptPath = join(rootDir, "scripts/build.ts");
  const sharedCssPath = join(booksDir, "shared-header.css");

  let hasErrors = false;

  // 1. Verify CSS support contract
  const cssContent = await readFile(sharedCssPath, "utf-8");
  if (!cssContent.includes(".embed-responsive")) {
    console.error(
      `❌ [FAIL] shared-header.css is missing '.embed-responsive' class`,
    );
    hasErrors = true;
  }
  if (
    !cssContent.includes("img {") ||
    !cssContent.includes("max-width: 100%")
  ) {
    console.error(
      `❌ [FAIL] shared-header.css is missing responsive 'img' constraints`,
    );
    hasErrors = true;
  }

  // 2. Verify mdBook configs for raw-html disablements
  async function scanDirectory(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.name === "book.toml") {
          const tomlContent = await readFile(fullPath, "utf-8");
          // Check for common flags that might strip HTML if another preprocessor were added.
          // mdBook passes HTML by default. We just want to make sure it's not explicitly disabled.
          if (
            tomlContent.includes("no-html = true") ||
            tomlContent.includes("strip-html = true")
          ) {
            console.error(
              `❌ [FAIL] ${fullPath} explicitly disables raw HTML passthrough.`,
            );
            hasErrors = true;
          }
        } else if (fullPath.endsWith(".md")) {
          // 3. Verify media usage in Markdown files
          const mdContent = await readFile(fullPath, "utf-8");

          // Flag youtube.com (should be youtube-nocookie.com)
          if (mdContent.includes("youtube.com/embed")) {
            console.error(
              `❌ [FAIL] ${fullPath} contains disallowed youtube.com embed. Use youtube-nocookie.com instead.`,
            );
            hasErrors = true;
          }

          // Flag un-wrapped iframes
          if (
            mdContent.includes("<iframe") &&
            !mdContent.includes("embed-responsive")
          ) {
            console.warn(
              `⚠️ [WARN] ${fullPath} contains an <iframe> not wrapped in .embed-responsive class.`,
            );
            hasErrors = true;
          }

          // Flag missing loading="lazy"
          if (
            mdContent.includes("<iframe") &&
            !mdContent.includes('loading="lazy"') &&
            !mdContent.includes("loading='lazy'")
          ) {
            console.error(
              `❌ [FAIL] ${fullPath} contains an <iframe> without loading="lazy" attribute.`,
            );
            hasErrors = true;
          }
        }
      }),
    );
  }

  await scanDirectory(booksDir);

  // 4. Verify CSP directives against the single source of truth
  //    (functions/lib/security-headers.ts). Previously this grepped the
  //    template-engine source, which broke when the CSP moved to a shared
  //    constant (F-105).
  const { CONTENT_SECURITY_POLICY } = await import(
    "../functions/lib/security-headers.ts"
  );
  if (!CONTENT_SECURITY_POLICY.includes("img-src 'self' data: https:")) {
    console.error(
      `❌ [FAIL] CSP _headers missing 'img-src \\'self\\' data: https:'`,
    );
    hasErrors = true;
  }
  if (!CONTENT_SECURITY_POLICY.includes("media-src 'self' https:")) {
    console.error(
      `❌ [FAIL] CSP _headers missing 'media-src \\'self\\' https:'`,
    );
    hasErrors = true;
  }
  if (!CONTENT_SECURITY_POLICY.includes("https://www.youtube-nocookie.com")) {
    console.error(
      `❌ [FAIL] CSP _headers missing 'youtube-nocookie.com' in frame-src`,
    );
    hasErrors = true;
  }

  if (hasErrors) {
    console.error(
      "\n❌ Media embed support audit failed. Please fix the above errors.",
    );
    process.exit(1);
  } else {
    console.log("\n✅ All media embed support checks passed.");
  }
}

checkMediaSupport().catch(console.error);
