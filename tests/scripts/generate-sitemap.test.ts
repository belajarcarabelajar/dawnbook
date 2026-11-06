import { expect, test, describe } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as sitemap from "../../scripts/generate-sitemap";

const { generateSitemap } = sitemap;

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
    // Check that it includes static hub pages
    expect(script).toContain("${baseUrl}/dmca");
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
      // test-book has no git history, so its page carries no lastmod.
      expect(urlBlock(sitemapContent, "https://dawnbook.belajarcarabelajar.com/books/test-book/chapter1")).not.toContain(
        "<lastmod>",
      );
      expect(sitemapContent).not.toContain("404.html");

      expect(robotsContent).toContain("User-agent: *");
      expect(robotsContent).toContain("Sitemap: https://dawnbook.belajarcarabelajar.com/sitemap.xml");
    } finally {
      await rm(testBookDir, { recursive: true, force: true });
    }
  });
});

const BASE = "https://dawnbook.belajarcarabelajar.com";

function urlBlock(xml: string, loc: string): string {
  const match = new RegExp(`<url>\\s*<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>[\\s\\S]*?</url>`).exec(xml);
  if (!match) throw new Error(`no <url> block for ${loc}`);
  return match[0];
}

describe("sitemap git lastmod", () => {
  async function buildFixture(): Promise<string> {
    const outputDir = await mkdtemp(join(tmpdir(), "sitemap-git-lastmod-"));
    await mkdir(join(outputDir, "books", "alpha", "content"), { recursive: true });
    await mkdir(join(outputDir, "books", "beta", "content"), { recursive: true });
    await Bun.write(join(outputDir, "books", "alpha", "index.html"), "<html></html>");
    await Bun.write(join(outputDir, "books", "alpha", "content", "01_pembuka.html"), "<html></html>");
    await Bun.write(join(outputDir, "books", "alpha", "content", "02_lanjut.html"), "<html></html>");
    await Bun.write(join(outputDir, "books", "beta", "index.html"), "<html></html>");
    await Bun.write(join(outputDir, "books", "beta", "content", "01_spasi jalan.html"), "<html></html>");
    await Bun.write(join(outputDir, "books", "beta", "content", "02_tanpa.html"), "<html></html>");
    return outputDir;
  }

  const lastmods = new Map([
    ["books/alpha/src/content/01_pembuka.md", "2026-02-10"],
    ["books/alpha/src/content/02_lanjut.md", "2026-01-05"],
    ["books/alpha/book.toml", "2026-04-20"],
    ["books/beta/src/content/01_spasi jalan.md", "2026-05-15"],
  ]);

  test("git lastmod: injected map sets chapter, book root and hub root dates", async () => {
    const outputDir = await buildFixture();
    try {
      await generateSitemap({ outputDir, lastmods });
      const xml = await readFile(join(outputDir, "sitemap.xml"), "utf-8");
      expect(urlBlock(xml, `${BASE}/books/alpha/content/01_pembuka`)).toContain("<lastmod>2026-02-10</lastmod>");
      expect(urlBlock(xml, `${BASE}/books/alpha/content/02_lanjut`)).toContain("<lastmod>2026-01-05</lastmod>");
      expect(urlBlock(xml, `${BASE}/books/alpha/`)).toContain("<lastmod>2026-04-20</lastmod>");
      expect(urlBlock(xml, `${BASE}/books/beta/`)).toContain("<lastmod>2026-05-15</lastmod>");
      expect(urlBlock(xml, `${BASE}/`)).toContain("<lastmod>2026-05-15</lastmod>");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("git lastmod: chapter file name with a space maps to its source file", async () => {
    const outputDir = await buildFixture();
    try {
      await generateSitemap({ outputDir, lastmods });
      const xml = await readFile(join(outputDir, "sitemap.xml"), "utf-8");
      const block = xml.split("<url>").find((b) => b.includes("01_spasi"));
      expect(block).toBeDefined();
      expect(block).toContain("<lastmod>2026-05-15</lastmod>");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("git lastmod: pages without a key carry no lastmod", async () => {
    const outputDir = await buildFixture();
    try {
      await generateSitemap({ outputDir, lastmods });
      const xml = await readFile(join(outputDir, "sitemap.xml"), "utf-8");
      expect(urlBlock(xml, `${BASE}/books/beta/content/02_tanpa`)).not.toContain("<lastmod>");
      expect(urlBlock(xml, `${BASE}/about`)).not.toContain("<lastmod>");
      expect(urlBlock(xml, `${BASE}/dmca`)).not.toContain("<lastmod>");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("git lastmod: empty map gives no lastmod anywhere", async () => {
    const outputDir = await buildFixture();
    try {
      await generateSitemap({ outputDir, lastmods: new Map() });
      const xml = await readFile(join(outputDir, "sitemap.xml"), "utf-8");
      expect(xml).toContain(`<loc>${BASE}/</loc>`);
      expect(xml).not.toContain("<lastmod>");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("git lastmod: output has no changefreq and no priority", async () => {
    const outputDir = await buildFixture();
    try {
      await generateSitemap({ outputDir, lastmods });
      const xml = await readFile(join(outputDir, "sitemap.xml"), "utf-8");
      expect(xml).not.toContain("<changefreq>");
      expect(xml).not.toContain("<priority>");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("git lastmod: gitLastmods maps each path to its newest commit date", async () => {
    const repo = await mkdtemp(join(tmpdir(), "sitemap-git-repo-"));
    const git = (args: string[], date?: string) => {
      const env: Record<string, string> = { ...process.env } as Record<string, string>;
      if (date) {
        env.GIT_AUTHOR_DATE = date;
        env.GIT_COMMITTER_DATE = date;
      }
      const r = Bun.spawnSync(["git", "-c", "user.name=Test", "-c", "user.email=test@example.com", ...args], {
        cwd: repo,
        env,
      });
      if (r.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr.toString()}`);
    };
    try {
      git(["init", "-q"]);
      await mkdir(join(repo, "books", "alpha", "src", "content"), { recursive: true });
      await Bun.write(join(repo, "books", "alpha", "src", "content", "01_a.md"), "one\n");
      await Bun.write(join(repo, "books", "alpha", "src", "content", "02_b.md"), "two\n");
      await Bun.write(join(repo, "README.md"), "outside books\n");
      git(["add", "-A"]);
      git(["commit", "-q", "--no-verify", "-m", "first"], "2026-01-02T10:00:00");
      await Bun.write(join(repo, "books", "alpha", "src", "content", "01_a.md"), "one changed\n");
      git(["add", "-A"]);
      git(["commit", "-q", "--no-verify", "-m", "second"], "2026-03-04T10:00:00");

      const map = sitemap.gitLastmods(repo);
      expect(map.get("books/alpha/src/content/01_a.md")).toBe("2026-03-04");
      expect(map.get("books/alpha/src/content/02_b.md")).toBe("2026-01-02");
      expect(map.has("README.md")).toBe(false);
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });

  test("git lastmod: gitLastmods returns an empty map outside a git repository", async () => {
    const dir = await mkdtemp(join(tmpdir(), "sitemap-no-git-"));
    try {
      const map = sitemap.gitLastmods(dir);
      expect(map.size).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
