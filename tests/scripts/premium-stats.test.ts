import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setPremiumRegistryForTest } from "../../functions/lib/premium";
import { writeBuiltStats } from "../../scripts/builder/stats-aggregator";

const temps: string[] = [];

afterEach(async () => {
  setPremiumRegistryForTest(null);
  await Promise.all(temps.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function addBook(root: string, slug: string, author: string, chapters: number) {
  await mkdir(join(root, "books", slug, "src"), { recursive: true });
  await writeFile(join(root, "books", slug, "book.toml"), `[book]\ntitle = "${slug}"\nauthors = ["${author}"]\n`);
  const lines = Array.from({ length: chapters }, (_, i) => `- [Bab ${i + 1}](content/0${i + 1}_bab.md)`);
  await writeFile(join(root, "books", slug, "src", "SUMMARY.md"), lines.join("\n") + "\n");
}

describe("built stats skip premium books", () => {
  test("a premium book adds no chapters and no contributor credit", async () => {
    const root = await mkdtemp(join(tmpdir(), "dawnbook-premium-stats-"));
    temps.push(root);
    await mkdir(join(root, "functions", "lib"), { recursive: true });
    await addBook(root, "buku-gratis", "Penulis Gratis", 2);
    await addBook(root, "buku-premium", "Penulis Premium", 5);
    setPremiumRegistryForTest({
      "buku-premium": { products: ["prod-uji"], productUrl: "https://example.com/produk" },
    });

    const stats = await writeBuiltStats(root);

    expect(stats.totalChapters).toBe(2);
    expect(stats.contributors).toEqual({ total: 1, top: [{ name: "Penulis Gratis", books: 1 }] });
    const written = await readFile(join(root, "functions", "lib", "built-stats.ts"), "utf8");
    expect(written).toContain("BUILT_TOTAL_CHAPTERS = 2;");
    expect(written).not.toContain("Penulis Premium");
  });
});
