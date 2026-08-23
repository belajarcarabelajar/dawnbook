import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { mkdir, rm, readFile } from "node:fs/promises";
import { join } from "node:path";
import { generateSitemap } from "../../scripts/generate-sitemap";

describe("Generate Sitemap (scripts/generate-sitemap.ts)", () => {
  const rootDir = process.cwd();
  const outputDir = join(rootDir, "output");
  const booksDir = join(outputDir, "books");
  const testBookDir = join(booksDir, "test-book");

  test("script source formats URLs correctly", () => {
    const scriptPath = join(import.meta.dir, "../../scripts/generate-sitemap.ts");
    const script = readFileSync(scriptPath, "utf-8");

    // Check that it includes the base URL
    expect(script).toContain("https://dawnbook.belajarcarabelajar.com");
    // Check that it generates urlset XML
    expect(script).toContain("<urlset");
  });

  test("generateSitemap outputs sitemap.xml and robots.txt with HTML URLs", async () => {
    await mkdir(testBookDir, { recursive: true });
    const sampleHtmlPath = join(testBookDir, "chapter1.html");
    const excluded404Path = join(testBookDir, "404.html");
    await Bun.write(sampleHtmlPath, "<html><body>Chapter 1</body></html>");
    await Bun.write(excluded404Path, "<html><body>404</body></html>");

    try {
      await generateSitemap();

      const sitemapPath = join(outputDir, "sitemap.xml");
      const robotsPath = join(outputDir, "robots.txt");

      expect(existsSync(sitemapPath)).toBe(true);
      expect(existsSync(robotsPath)).toBe(true);

      const sitemapContent = await readFile(sitemapPath, "utf-8");
      const robotsContent = await readFile(robotsPath, "utf-8");

      expect(sitemapContent).toContain("<urlset");
      expect(sitemapContent).toContain("https://dawnbook.belajarcarabelajar.com/books/test-book/chapter1");
      expect(sitemapContent).not.toContain("404.html");

      expect(robotsContent).toContain("User-agent: *");
      expect(robotsContent).toContain("Sitemap: https://dawnbook.belajarcarabelajar.com/sitemap.xml");
    } finally {
      await rm(testBookDir, { recursive: true, force: true });
    }
  });
});
