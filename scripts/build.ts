import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { $ } from "bun";
import { loadEnv } from "./builder/env";
import { buildAllBooks } from "./builder/mdbook-runner";
import { writeBuiltStats } from "./builder/stats-aggregator";
import { generateSitePages, copyAssets, buildHeaders } from "./builder/template-engine";
import { runHeadingGate } from "./heading-gate";
import { checkCovers, COVER_FILE } from "./check-covers";
import { runVoiceGate } from "./check-voice";
import { runStructureGate } from "./check-book-structure";
import { checkIndexingOutput } from "./check-indexing-output";
import { renderOgCards } from "./render-og-cards";
import { normalizeTocLinks } from "./builder/normalize-toc-links";
import { syncPremiumBooksForRepo } from "./premium-sync";
import { PREMIUM_MEDIA_DIR, stagePremiumMedia } from "./premium/move-media";
import { premiumSlugs } from "../functions/lib/premium";

async function build() {
  await loadEnv();

  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const outputDir = join(rootDir, "output");
  const outputBooksDir = join(outputDir, "books");

  // Premium books come from the private checkout and must be in books/ before any gate reads it.
  console.log("Syncing premium books...");
  try {
    syncPremiumBooksForRepo(rootDir);
  } catch (err) {
    console.error(`Premium sync failed: ${(err as Error).message}`);
    process.exit(1);
  }

  // Fails before the slow mdBook builds: every book needs a cover (GEMINI.md section 27).
  console.log("Checking book covers...");
  const coverViolations = checkCovers(rootDir);
  if (coverViolations.length > 0) {
    for (const v of coverViolations) console.error(`books/${v.book}/${COVER_FILE} [${v.rule}] ${v.message}`);
    process.exit(1);
  }

  // Section 29 scaffolds ("Perhatikan", "Menariknya", "bab berikutnya", ...) fail the build (GEMINI.md section 29).
  console.log("Checking chapter voice...");
  const voiceGate = runVoiceGate(booksDir);
  if (!voiceGate.ok) {
    for (const p of voiceGate.problems) console.error(`books/${p}`);
    process.exit(1);
  }

  // Chapter title level and SUMMARY match, repeated section headings, openers that the meta cut
  // truncates, and the other per-book structure rules (GEMINI.md section 24).
  console.log("Checking book structure...");
  const structureGate = runStructureGate(booksDir);
  if (!structureGate.ok) {
    for (const p of structureGate.problems) console.error(`books/${p}`);
    process.exit(1);
  }

  // Ensure output directories exist
  await mkdir(outputDir, { recursive: true });
  await mkdir(outputBooksDir, { recursive: true });

  const builtBooks = await buildAllBooks(booksDir, outputBooksDir);

  // Premium images are served from R2 after the access check (GEMINI.md section 30), so the
  // Pages output must not carry them; deploy-website.sh uploads the staging folder.
  const media = stagePremiumMedia({ outputDir, stagingDir: join(rootDir, PREMIUM_MEDIA_DIR), slugs: premiumSlugs() });
  console.log(`Staged premium images in ${PREMIUM_MEDIA_DIR}/: ${media.moved.join(", ") || "none"}`);

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

  console.log("Normalizing sidebar links in toc JS...");
  const toc = await normalizeTocLinks(outputBooksDir);
  console.log(`  → ${toc.files} toc files, ${toc.changed} changed`);
  if (builtBooks.length > 0 && toc.files === 0) {
    console.error(
      "No toc-*.js file found under output/books although books were built: the mdBook sidebar layout changed, so its .html links would not be normalized.",
    );
    process.exit(1);
  }

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

  console.log("Checking indexing signals in output...");
  const indexingProblems = checkIndexingOutput(outputDir);
  if (indexingProblems.length > 0) {
    console.error(`Indexing check failed: ${indexingProblems.length} problem(s)`);
    for (const p of indexingProblems.slice(0, 60)) console.error(`  ${p}`);
    if (indexingProblems.length > 60) console.error(`  ... and ${indexingProblems.length - 60} more`);
    process.exit(1);
  }
  console.log("  → indexing check passed");

  console.log("Premium Hub site generated successfully.");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
