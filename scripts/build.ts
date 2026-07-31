import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { loadEnv } from "./builder/env";
import { buildAllBooks } from "./builder/mdbook-runner";
import { generateSitePages, copyAssets, buildHeaders } from "./builder/template-engine";

async function build() {
  await loadEnv();

  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const outputDir = join(rootDir, "output");
  const outputBooksDir = join(outputDir, "books");

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(outputBooksDir, { recursive: true });

  const builtBooks = await buildAllBooks(booksDir, outputBooksDir);

  console.log("Generating premium hub site...");

  await generateSitePages(rootDir, outputDir, builtBooks);

  await copyAssets(rootDir, outputDir);

  console.log("Applying anti-FOUC script to gated books...");
  await $`bun run scripts/inject-gating.ts`;

  console.log("Generating security headers...");
  await buildHeaders(outputDir);

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
