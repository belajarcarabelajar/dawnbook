// Indexing hygiene check on a finished build (GEMINI.md section 31).
// Usage: bun run scripts/check-indexing-output.ts [outputDir]   (default: ./output)
// Exits 1 and prints one line per problem; exits 0 when the output is clean.
// Run against an old build it fails, which is its positive control.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const BASE = "https://dawnbook.belajarcarabelajar.com";
const INDEXABLE_HUB: Record<string, string> = {
  "index.html": "/",
  "about.html": "/about",
  "contribute.html": "/contribute",
  "donate.html": "/donate",
  "appreciation.html": "/appreciation",
  "statistics.html": "/statistics",
  "dmca.html": "/dmca",
};
const NOINDEX_HUB = ["sign-in.html", "sign-up.html", "offline.html"];
const NOINDEX_META = /<meta\s+name="robots"\s+content="noindex"/i;
// A chapter link that still ends in .html; print, toc and 404 keep their extension by design.
const TOC_HTML_LINK = /href="(?:\.\.\/)*content\/[^"]+\.html(?:#[^"]*)?"/;

function canonicals(html: string): string[] {
  return [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]*)"/gi)].map((m) => m[1]);
}

function resolvesToFile(outputDir: string, href: string): boolean {
  let path = href.split(/[?#]/)[0];
  try {
    path = decodeURIComponent(path);
  } catch {
    // A stray "%" stays raw; the existence check below then reports it.
  }
  const target = join(outputDir, path);
  if (path.endsWith("/")) return existsSync(join(target, "index.html"));
  if (existsSync(target) && statSync(target).isFile()) return true;
  return existsSync(`${target}.html`) || existsSync(join(target, "index.html"));
}

export function checkIndexingOutput(outputDir: string): string[] {
  const problems: string[] = [];
  const read = (rel: string) => readFileSync(join(outputDir, rel), "utf8");

  for (const file of ["404.html", "_redirects"]) {
    if (!existsSync(join(outputDir, file))) problems.push(`missing ${file}: unknown URLs fall back to the home page with 200`);
  }

  for (const [file, path] of Object.entries(INDEXABLE_HUB)) {
    if (!existsSync(join(outputDir, file))) {
      problems.push(`${file}: missing`);
      continue;
    }
    const html = read(file);
    const found = canonicals(html);
    if (found.length !== 1 || found[0] !== `${BASE}${path}`) {
      problems.push(`${file}: canonical ${JSON.stringify(found)}, expected ["${BASE}${path}"]`);
    }
    for (const m of html.matchAll(/href="(\/[^"]*)"/g)) {
      const href = m[1];
      if (href.startsWith("/api/") || href.startsWith("//")) continue;
      if (/\.html(?:[?#]|$)/.test(href.split("?")[0])) problems.push(`${file}: link ${href} points at a redirecting .html URL`);
      else if (!resolvesToFile(outputDir, href)) problems.push(`${file}: link ${href} resolves to no file in the output`);
    }
  }
  for (const file of NOINDEX_HUB) {
    if (existsSync(join(outputDir, file)) && !NOINDEX_META.test(read(file))) problems.push(`${file}: no noindex meta`);
  }

  let chapters: Record<string, string[]> = {};
  try {
    chapters = JSON.parse(read("manifest.json"))?.chapters ?? {};
  } catch {
    problems.push("manifest.json: missing or unreadable");
  }

  const booksDir = join(outputDir, "books");
  const slugs = existsSync(booksDir) ? readdirSync(booksDir).filter((s) => statSync(join(booksDir, s)).isDirectory()) : [];
  let tocFiles = 0;
  for (const slug of slugs) {
    for (const f of readdirSync(join(booksDir, slug)).filter((f) => /^toc-[0-9a-f]+\.js$/.test(f))) {
      tocFiles++;
      if (TOC_HTML_LINK.test(readFileSync(join(booksDir, slug, f), "utf8"))) problems.push(`${slug}/${f}: chapter link still ends in .html`);
    }
    const first = chapters[slug]?.[0];
    if (!first) continue;
    const firstFile = join(outputDir, decodeURIComponent(first));
    if (!existsSync(firstFile)) {
      problems.push(`${slug}: first chapter ${first} missing from the output`);
      continue;
    }
    const html = readFileSync(firstFile, "utf8");
    const found = canonicals(html);
    if (found.length !== 1 || found[0] !== `${BASE}/books/${slug}/`) problems.push(`${slug}: first chapter canonical ${JSON.stringify(found)}, expected the book root`);
    if (!/<meta\s+name="dawnbook-free-chapter"/.test(html)) problems.push(`${slug}: first chapter lacks the dawnbook-free-chapter meta`);
  }
  if (slugs.length > 0 && tocFiles === 0) problems.push("no toc-*.js found in any book: mdBook layout changed?");

  if (existsSync(join(outputDir, "sitemap.xml"))) {
    const sitemap = read("sitemap.xml");
    if (/<changefreq>|<priority>/.test(sitemap)) problems.push("sitemap.xml: still has changefreq or priority");
    const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    if (lastmods.length > 1 && new Set(lastmods).size === 1) problems.push(`sitemap.xml: every lastmod is ${lastmods[0]} (build date, not git)`);
    for (const [slug, list] of Object.entries(chapters)) {
      const first = list?.[0];
      if (!first) continue;
      const loc = `${BASE}${first.replace(/\.html$/, "")}`;
      if (sitemap.includes(`<loc>${loc}</loc>`)) problems.push(`sitemap.xml: lists ${slug} chapter 1, whose canonical is the book root`);
    }
  } else {
    problems.push("sitemap.xml: missing");
  }
  return problems;
}

if (import.meta.main) {
  const outputDir = resolve(process.argv[2] ?? "output");
  const problems = checkIndexingOutput(outputDir);
  if (problems.length > 0) {
    console.error(`Indexing check failed for ${outputDir} (${problems.length} problem(s)):`);
    for (const p of problems.slice(0, 60)) console.error(`  ${p}`);
    if (problems.length > 60) console.error(`  ... and ${problems.length - 60} more`);
    process.exit(1);
  }
  console.log(`Indexing check passed for ${outputDir}.`);
}
