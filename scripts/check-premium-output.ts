// Deploy guard: a build made without the private premium checkout has no
// books/<slug>/ output, and deploying it would delete those books from production.
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { premiumSlugs } from "../functions/lib/premium";

export function checkPremiumOutput(outputDir: string, slugs: string[]): string[] {
  return slugs.filter((slug) => !existsSync(join(outputDir, "books", slug, "index.html")));
}

if (import.meta.main) {
  const outputDir = join(resolve(import.meta.dir, ".."), "output");
  const missing = checkPremiumOutput(outputDir, premiumSlugs());
  for (const slug of missing) console.error(`missing premium book in output: books/${slug}/index.html`);
  process.exit(missing.length > 0 ? 1 : 0);
}
