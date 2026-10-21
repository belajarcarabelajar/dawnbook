import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { loadEnv } from "./builder/env";
import { buildAllBooks } from "./builder/mdbook-runner";
import { writeBuiltStats } from "./builder/stats-aggregator";
import { generateSitePages, copyAssets, buildHeaders } from "./builder/template-engine";
import { runHeadingGate } from "./heading-gate";
import { checkCovers, COVER_FILE } from "./check-covers";
import { renderOgCards } from "./render-og-cards";

async function build() {
  await loadEnv();

  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const outputDir = join(rootDir, "output");
  const outputBooksDir = join(outputDir, "books");

  // Fails before the slow mdBook builds: every book needs a cover (GEMINI.md section 27).
  console.log("Checking book covers...");
  const coverViolations = checkCovers(rootDir);
  if (coverViolations.length > 0) {
    for (const v of coverViolations) console.error(`books/${v.book}/${COVER_FILE} [${v.rule}] ${v.message}`);
    process.exit(1);
  }

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(outputBooksDir, { recursive: true });

  const builtBooks = await buildAllBooks(booksDir, outputBooksDir);

  console.log("Computing build-time stats (chapters, contributors)...");
  const builtStats = await writeBuiltStats(rootDir);
  console.log(
    `  → ${builtStats.totalChapters} chapters, ${builtStats.contributors.total} contributors`,
  );

  console.log("Generating premium hub site...");

  await generateSitePages(rootDir, outputDir, builtBooks);

  await copyAssets(rootDir, outputDir);

  // Before inject-gating, which points each page's og:image at its card.
  console.log("Rendering share cards...");
  await renderOgCards(rootDir, outputDir, builtBooks);

  console.log("Applying anti-FOUC script to gated books...");
  await $`bun run scripts/inject-gating.ts`;

  console.log("Generating security headers...");
  await buildHeaders(outputDir);

  console.log("Checking heading colons...");
  const headingGate = runHeadingGate(rootDir);
  if (!headingGate.ok) {
    console.error(headingGate.output);
    process.exit(1);
  }

  console.log("Generating sitemap...");
  await $`bun run scripts/generate-sitemap.ts`;

  console.log("Generating llms.txt...");
  await $`bun run scripts/generate-llmstxt.ts`;

  console.log("Running SEO validation...");
  await $`bun run scripts/check-seo.ts`;

  console.log("Premium Hub site generated successfully.");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
