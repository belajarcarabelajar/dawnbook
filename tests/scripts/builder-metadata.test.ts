import { expect, test, describe } from "bun:test";
import { formatIndonesianDate, parseBookMetadata } from "../../scripts/builder/metadata";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("scripts/builder/metadata.ts", () => {
  test("formatIndonesianDate returns empty string for invalid timestamps", () => {
    expect(formatIndonesianDate(0)).toBe("");
    expect(formatIndonesianDate(-1000)).toBe("");
    expect(formatIndonesianDate(null as any)).toBe("");
  });

  test("formatIndonesianDate formats valid timestamps in WIB", () => {
    const ts = new Date("2026-08-01T12:00:00Z").getTime();
    const formatted = formatIndonesianDate(ts);
    expect(formatted).toContain("WIB");
    expect(formatted).toContain("Agustus 2026");
  });

  test("parseBookMetadata handles missing optional files gracefully and falls back to fs stat", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "metadata-test-"));
    try {
      const meta = await parseBookMetadata(tempDir, "test-book");
      expect(meta.formattedTitle).toBe("Test Book");
      expect(meta.author).toBe("Iwan Kurniawan");
      expect(meta.emoji).toBe("📖");
      expect(meta.chapterCount).toBe(0);
      expect(meta.chapters).toEqual([]);
      expect(meta.mtimeMs).toBeGreaterThan(0);
      expect(meta.formattedDate).toContain("WIB");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("parseBookMetadata parses book.toml, SUMMARY.md, and icon.txt", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "metadata-test-full-"));
    try {
      await writeFile(join(tempDir, "book.toml"), 'title = "Custom Title"\nauthors = ["Custom Author"]\n');
      await writeFile(join(tempDir, "icon.txt"), "🚀");
      await mkdir(join(tempDir, "src"));
      await writeFile(
        join(tempDir, "src", "SUMMARY.md"),
        `- [Intro](./README.md)\n- [Chapter 1](./01-intro.md)\n- [Index](./index.md)\n- [Invalid line](invalid)\n`
      );

      const meta = await parseBookMetadata(tempDir, "custom-book");
      expect(meta.formattedTitle).toBe("Custom Title");
      expect(meta.author).toBe("Custom Author");
      expect(meta.emoji).toBe("🚀");
      expect(meta.chapterCount).toBe(4);
      expect(meta.chapters[0]).toBe("/books/custom-book/index.html");
      expect(meta.chapters[1]).toBe("/books/custom-book/01-intro.html");
      expect(meta.chapters[2]).toBe("/books/custom-book/index.html");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("parseBookMetadata falls back when book.toml is missing but SUMMARY.md exists", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "metadata-test-nobook-"));
    try {
      await mkdir(join(tempDir, "src"));
      await writeFile(join(tempDir, "src", "SUMMARY.md"), "- [Intro](./01-intro.md)\n");
      const meta = await parseBookMetadata(tempDir, "no-toml-book");
      expect(meta.formattedTitle).toBe("No Toml Book");
      expect(meta.author).toBe("Iwan Kurniawan");
      expect(meta.chapterCount).toBe(1);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("parseBookMetadata falls back when directory stat throws or optional files fail", async () => {
    const meta = await parseBookMetadata("/nonexistent/path/123", "fallback-book");
    expect(meta.formattedTitle).toBe("Fallback Book");
    expect(meta.author).toBe("Iwan Kurniawan");
    expect(meta.emoji).toBe("📖");
    expect(meta.chapterCount).toBe(0);
    expect(meta.mtimeMs).toBe(0);
    expect(meta.formattedDate).toBe("");
  });
});
