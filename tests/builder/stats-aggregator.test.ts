import { expect, test, describe } from "bun:test";
import { join } from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { writeBuiltStats } from "../../scripts/builder/stats-aggregator";

describe("builder: stats-aggregator", () => {
  const tmpDir = join(process.cwd(), "tmp-test-stats-aggregator");

  test("calculates contributors by published book count correctly", async () => {
    await mkdir(join(tmpDir, "books", "book-1", "src"), { recursive: true });
    await mkdir(join(tmpDir, "books", "book-2", "src"), { recursive: true });
    await mkdir(join(tmpDir, "books", "_template", "src"), { recursive: true });
    await mkdir(join(tmpDir, "functions", "lib"), { recursive: true });

    await writeFile(
      join(tmpDir, "books", "book-1", "book.toml"),
      `[book]\ntitle = "Book 1"\nauthors = ["Iwan Kurniawan", "Kania Salsabila"]\n`,
      "utf8"
    );
    await writeFile(
      join(tmpDir, "books", "book-1", "src", "SUMMARY.md"),
      `- [Ch 1](ch1.md)\n- [Ch 2](ch2.md)\n`,
      "utf8"
    );

    await writeFile(
      join(tmpDir, "books", "book-2", "book.toml"),
      `[book]\ntitle = "Book 2"\nauthors = ["Iwan Kurniawan"]\n`,
      "utf8"
    );
    await writeFile(
      join(tmpDir, "books", "book-2", "src", "SUMMARY.md"),
      `- [Ch 1](ch1.md)\n`,
      "utf8"
    );

    // _template should be ignored
    await writeFile(
      join(tmpDir, "books", "_template", "book.toml"),
      `[book]\ntitle = "Template"\nauthors = ["Template Author"]\n`,
      "utf8"
    );

    try {
      const stats = await writeBuiltStats(tmpDir);
      expect(stats.totalChapters).toBe(3);
      expect(stats.contributors.total).toBe(2);
      expect(stats.contributors.top).toEqual([
        { name: "Iwan Kurniawan", books: 2 },
        { name: "Kania Salsabila", books: 1 },
      ]);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });
});
