import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "../..");
const notFoundPath = join(repoRoot, "public/404.html");
const redirectsPath = join(repoRoot, "public/_redirects");

const readText = (path: string): string => (existsSync(path) ? readFileSync(path, "utf-8") : "");

const chapterFileFor = (urlPath: string): string | null => {
  const match = /^\/books\/([^/]+)\/content\/([^/]+)$/.exec(urlPath);
  if (!match) return null;
  return join(repoRoot, "books", match[1], "src/content", `${match[2]}.md`);
};

const redirectRules = (): string[] =>
  readText(redirectsPath)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));

describe("Root 404 page (public/404.html)", () => {
  test("exists", () => {
    expect(existsSync(notFoundPath)).toBe(true);
  });

  test("is an Indonesian page titled Halaman tidak ditemukan", () => {
    const html = readText(notFoundPath);
    expect(html).toContain('<html lang="id">');
    expect(html).toMatch(/<title>[^<]*Halaman tidak ditemukan[^<]*<\/title>/);
  });

  test("links back to the home page and loads the hub stylesheets", () => {
    const html = readText(notFoundPath);
    expect(html).toContain('<a href="/">');
    expect(html).toContain('href="/typography.css"');
    expect(html).toContain('href="/HubLayout.css"');
  });

  test("has no scripts and no canonical link", () => {
    const html = readText(notFoundPath);
    expect(html).not.toBe("");
    expect(html).not.toContain("<script");
    expect(html).not.toContain('rel="canonical"');
  });

  test("has no em dash, no emoji and no Anda", () => {
    const html = readText(notFoundPath);
    expect(html).not.toBe("");
    expect(html).not.toContain("—");
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(html).not.toMatch(/\bAnda\b/);
  });
});

describe("Redirect rules (public/_redirects)", () => {
  test("exists and holds at least one rule", () => {
    expect(existsSync(redirectsPath)).toBe(true);
    expect(redirectRules().length).toBeGreaterThan(0);
  });

  test("every rule is 'source destination 301'", () => {
    for (const line of redirectRules()) {
      expect(line).toMatch(/^(\S+) (\S+) 301$/);
    }
  });

  test("has no duplicate source and at most 2000 rules", () => {
    const sources = redirectRules().map((line) => line.split(" ")[0]);
    expect(new Set(sources).size).toBe(sources.length);
    expect(sources.length).toBeLessThanOrEqual(2000);
  });

  test("every destination is an existing chapter and no source is one", () => {
    for (const line of redirectRules()) {
      const [source, destination] = line.split(" ");
      const destinationFile = chapterFileFor(destination);
      expect(destinationFile).not.toBeNull();
      expect(existsSync(destinationFile as string)).toBe(true);
      const sourceFile = chapterFileFor(source);
      if (sourceFile) expect(existsSync(sourceFile)).toBe(false);
    }
  });

  test("contains the two moved chapter URLs with search impressions", () => {
    const rules = redirectRules();
    expect(rules).toContain(
      "/books/filosofi-stoikisme/content/09_amor-fati-menerima-takdir-tanpa-protes /books/filosofi-stoikisme/content/09_amor-fati-mencintai-takdir 301",
    );
    expect(rules).toContain(
      "/books/matriks-keputusan-decision-matrix/content/06_langkah-3-pembagian-bobot-pada-kriteria /books/matriks-keputusan-decision-matrix/content/06_langkah-3-pemberian-bobot-pada-kriteria 301",
    );
  });
});
