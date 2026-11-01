// Deploy guard: a build made without the private premium checkout has no
// books/<slug>/ output, and deploying it would delete those books from production.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { premiumSlugs } from "../functions/lib/premium";

// Same rule as the free-chapter test in functions/lib/premium.ts; sitemap and
// llms.txt list manifest.chapters[slug][0] as free, so the two must agree.
const FREE_CHAPTER = /^(?:01|chapter_1)(?!\d)/;

function readManifestChapters(outputDir: string): Record<string, string[]> | null {
  try {
    const manifest = JSON.parse(readFileSync(join(outputDir, "manifest.json"), "utf8"));
    return manifest?.chapters ?? null;
  } catch {
    return null;
  }
}

function chapterHtmlCount(dir: string): number {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".html")).length;
  } catch {
    return 0;
  }
}

/** One message per problem, each starting with `<slug>:`. Empty when the output is complete. */
export function checkPremiumOutput(outputDir: string, slugs: string[]): string[] {
  if (slugs.length === 0) return [];
  const chapters = readManifestChapters(outputDir);
  const problems: string[] = [];
  for (const slug of slugs) {
    const bookDir = join(outputDir, "books", slug);
    if (!existsSync(join(bookDir, "index.html"))) {
      problems.push(`${slug}: books/${slug}/index.html is missing`);
    }
    if (chapterHtmlCount(join(bookDir, "content")) === 0) {
      problems.push(`${slug}: books/${slug}/content/ has no chapter html (partial build)`);
    }
    const first = chapters?.[slug]?.[0];
    if (!first) {
      problems.push(`${slug}: no chapters for this slug in manifest.json`);
    } else if (!FREE_CHAPTER.test(basename(first))) {
      problems.push(`${slug}: first manifest chapter ${first} is not a free chapter (01_* or chapter_1)`);
    }
  }
  return problems;
}

if (import.meta.main) {
  const outputDir = join(resolve(import.meta.dir, ".."), "output");
  const problems = checkPremiumOutput(outputDir, premiumSlugs());
  for (const p of problems) console.error(`premium output: ${p}`);
  process.exit(problems.length > 0 ? 1 : 0);
}
