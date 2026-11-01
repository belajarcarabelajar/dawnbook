import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { runMigration } from "../../scripts/migrate-to-d1";
import { generateSitePages } from "../../scripts/builder/template-engine";
import { generateSitemap } from "../../scripts/generate-sitemap";
import type { BuiltBook } from "../../scripts/builder/metadata";

const ROOT = join(import.meta.dir, "../..");
const FIXTURE_BOOKS = join(import.meta.dir, "../fixtures/premium-surfaces/books");
const BASE = "https://dawnbook.belajarcarabelajar.com";

const chaptersOf = (slug: string) => [
  `/books/${slug}/content/01_bab-satu.html`,
  `/books/${slug}/content/02_bab-dua.html`,
];

function premiumOnly(slug: string) {
  setPremiumRegistryForTest({
    [slug]: { products: ["prod-uji"], productUrl: "https://example.com/produk" },
  });
}

function book(slug: string): BuiltBook {
  return {
    slug,
    title: `Judul ${slug}`,
    author: "Penulis Uji",
    chapterCount: 2,
    emoji: "📖",
    chapters: chaptersOf(slug),
    mtimeMs: 1,
    formattedDate: "",
  };
}

const temps: string[] = [];
async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "dawnbook-premium-surfaces-"));
  temps.push(dir);
  return dir;
}

afterEach(async () => {
  setPremiumRegistryForTest(null);
  await Promise.all(temps.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

describe("seeder (scripts/migrate-to-d1.ts)", () => {
  test("writes an empty content_md for a premium book and the text for a free one", async () => {
    premiumOnly("buku-premium");
    const root = await tempDir();
    const executed: string[] = [];
    await runMigration({
      rootDir: root,
      booksDir: FIXTURE_BOOKS,
      executeCommand: async (sql) => {
        executed.push(sql);
      },
    });

    const seed = await readFile(join(root, "db", "seed.sql"), "utf8");
    const all = seed + "\n" + executed.join("\n");
    expect(all).not.toContain("PREMIUM-BAB-SATU-TEKS");
    expect(all).not.toContain("PREMIUM-BAB-DUA-TEKS");
    expect(all).toContain("GRATIS-BAB-DUA-TEKS");

    const premiumStmt = seed.split("\n\n").find((s) => s.includes("'buku-premium'"));
    expect(premiumStmt).toBeDefined();
    expect(premiumStmt).toContain("'Buku Premium Uji'");
    expect(premiumStmt).toMatch(/'Uji',\n  '',\n/);
  });
});

describe("hub (scripts/builder/template-engine.ts)", () => {
  async function renderHub(): Promise<{ index: string; manifest: Record<string, unknown> }> {
    premiumOnly("buku-premium");
    const out = await tempDir();
    await generateSitePages(ROOT, out, [book("buku-premium"), book("buku-gratis")], {});
    return {
      index: await readFile(join(out, "index.html"), "utf8"),
      manifest: JSON.parse(await readFile(join(out, "manifest.json"), "utf8")),
    };
  }

  function card(index: string, slug: string): string {
    const start = index.indexOf(`data-slug="${slug}"`);
    expect(start).toBeGreaterThan(-1);
    return index.slice(start, index.indexOf("</a>", start));
  }

  test("manifest lists only the built premium slugs and keeps the existing keys", async () => {
    const { manifest } = await renderHub();
    expect(manifest.premium).toEqual(["buku-premium"]);
    expect(manifest.books).toEqual(["buku-premium", "buku-gratis"]);
    expect((manifest.chapters as Record<string, string[]>)["buku-gratis"]).toEqual(chaptersOf("buku-gratis"));
  });

  test("a premium card shows the Premium label and a free card does not", async () => {
    const { index } = await renderHub();
    expect(card(index, "buku-premium")).toContain("Premium");
    expect(card(index, "buku-premium")).not.toContain("FREE");
    expect(card(index, "buku-gratis")).not.toContain("Premium");
    expect(card(index, "buku-gratis")).toContain("FREE");
  });
});

describe("sitemap (scripts/generate-sitemap.ts)", () => {
  test("lists only the root and chapter 1 of a premium book, every chapter of a free one", async () => {
    premiumOnly("buku-premium");
    const out = await tempDir();
    for (const slug of ["buku-premium", "buku-gratis"]) {
      await mkdir(join(out, "books", slug, "content"), { recursive: true });
      await writeFile(join(out, "books", slug, "index.html"), "<html></html>");
      for (const ch of chaptersOf(slug)) await writeFile(join(out, ch), "<html></html>");
    }
    await writeFile(
      join(out, "manifest.json"),
      JSON.stringify({
        books: ["buku-premium", "buku-gratis"],
        chapters: { "buku-premium": chaptersOf("buku-premium"), "buku-gratis": chaptersOf("buku-gratis") },
      }),
    );

    await generateSitemap({ outputDir: out });
    const xml = await readFile(join(out, "sitemap.xml"), "utf8");

    expect(xml).toContain(`<loc>${BASE}/books/buku-premium/</loc>`);
    expect(xml).toContain(`<loc>${BASE}/books/buku-premium/content/01_bab-satu</loc>`);
    expect(xml).not.toContain("buku-premium/content/02_bab-dua");
    expect(xml).toContain(`<loc>${BASE}/books/buku-gratis/</loc>`);
    expect(xml).toContain(`<loc>${BASE}/books/buku-gratis/content/01_bab-satu</loc>`);
    expect(xml).toContain(`<loc>${BASE}/books/buku-gratis/content/02_bab-dua</loc>`);
  });
});

describe("llms.txt (scripts/generate-llmstxt.ts)", () => {
  test("lists only the root and chapter 1 of a premium book, every chapter of a free one", async () => {
    // Imported lazily so a missing export fails this test alone, not the whole file.
    const { buildLlmsTxt } = await import("../../scripts/generate-llmstxt");
    premiumOnly("buku-premium");
    const txt = buildLlmsTxt({
      books: ["buku-premium", "buku-gratis"],
      chapters: { "buku-premium": chaptersOf("buku-premium"), "buku-gratis": chaptersOf("buku-gratis") },
    });

    expect(txt).toContain(`(${BASE}/books/buku-premium/)`);
    expect(txt).toContain(`(${BASE}/books/buku-premium/content/01_bab-satu.html)`);
    expect(txt).not.toContain("buku-premium/content/02_bab-dua");
    expect(txt).toContain(`(${BASE}/books/buku-gratis/content/01_bab-satu.html)`);
    expect(txt).toContain(`(${BASE}/books/buku-gratis/content/02_bab-dua.html)`);
  });
});
