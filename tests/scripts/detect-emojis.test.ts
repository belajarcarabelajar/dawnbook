import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { scanAndCleanFile, scanBook, EmojiMatch } from "../../scripts/detect-emojis";

describe("detect-emojis", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "detect-emojis-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("scanAndCleanFile", () => {
    it("should detect emojis without modifying the file when shouldFix=false", async () => {
      const filePath = path.join(tmpDir, "test.md");
      const initialContent = "Hello 🌍!\nThis is a test 🧪.";
      await fs.promises.writeFile(filePath, initialContent, "utf8");

      const matches = await scanAndCleanFile(filePath, "test-book", false);

      expect(matches).toHaveLength(2);
      expect(matches[0].emoji).toBe("🌍");
      expect(matches[0].lineNumber).toBe(1);
      expect(matches[1].emoji).toBe("🧪");
      expect(matches[1].lineNumber).toBe(2);

      const fileContent = await fs.promises.readFile(filePath, "utf8");
      expect(fileContent).toBe(initialContent);
    });

    it("should strip emojis and clean up spaces when shouldFix=true", async () => {
      const filePath = path.join(tmpDir, "test.md");
      // Intentionally placing spaces around emojis to test cleanup
      const initialContent = "Hello 🌍  World!\nTesting   🧪\nEnd of line  🚀 ";
      await fs.promises.writeFile(filePath, initialContent, "utf8");

      const matches = await scanAndCleanFile(filePath, "test-book", true);

      expect(matches).toHaveLength(3);

      const fileContent = await fs.promises.readFile(filePath, "utf8");
      // Double spaces "  " replaced by " " and trailing space removed.
      expect(fileContent).toBe("Hello World!\nTesting\nEnd of line");
    });

    it("should return empty matches for a file with no emojis", async () => {
      const filePath = path.join(tmpDir, "clean.md");
      const initialContent = "No emojis here.\nJust text.";
      await fs.promises.writeFile(filePath, initialContent, "utf8");

      const matches = await scanAndCleanFile(filePath, "test-book", false);

      expect(matches).toHaveLength(0);
    });

    it("should ignore ENOENT errors and return empty matches", async () => {
      const filePath = path.join(tmpDir, "does-not-exist.md");
      const matches = await scanAndCleanFile(filePath, "test-book", false);

      expect(matches).toHaveLength(0);
    });
  });

  describe("scanBook", () => {
    it("should scan a book structure correctly", async () => {
      const bookSlug = "test-book";
      const bookDir = path.join(tmpDir, bookSlug);
      const srcDir = path.join(bookDir, "src");
      const contentDir = path.join(srcDir, "content");

      // Setup directory structure
      await fs.promises.mkdir(contentDir, { recursive: true });

      // Create files
      const summaryPath = path.join(srcDir, "SUMMARY.md");
      const chap1Path = path.join(contentDir, "chap1.md");
      const chap2Path = path.join(contentDir, "chap2.md");

      await fs.promises.writeFile(summaryPath, "# Summary 📖\n- [Chap 1](content/chap1.md)", "utf8");
      await fs.promises.writeFile(chap1Path, "Chapter 1 with emoji 🚀.", "utf8");
      await fs.promises.writeFile(chap2Path, "Chapter 2 clean.", "utf8");

      const matches = await scanBook(bookSlug, tmpDir, false);

      // Should find matches in SUMMARY.md and chap1.md
      expect(matches).toHaveLength(2);

      const summaryMatch = matches.find(m => m.filePath === summaryPath);
      expect(summaryMatch).toBeDefined();
      expect(summaryMatch?.emoji).toBe("📖");

      const chap1Match = matches.find(m => m.filePath === chap1Path);
      expect(chap1Match).toBeDefined();
      expect(chap1Match?.emoji).toBe("🚀");
    });

    it("should handle books with no emojis", async () => {
      const bookSlug = "clean-book";
      const bookDir = path.join(tmpDir, bookSlug);
      const srcDir = path.join(bookDir, "src");
      const contentDir = path.join(srcDir, "content");

      await fs.promises.mkdir(contentDir, { recursive: true });
      await fs.promises.writeFile(path.join(srcDir, "SUMMARY.md"), "# Summary", "utf8");
      await fs.promises.writeFile(path.join(contentDir, "chap1.md"), "Chapter 1", "utf8");

      const matches = await scanBook(bookSlug, tmpDir, false);

      expect(matches).toHaveLength(0);
    });

    it("should return empty array for non-existent book directory", async () => {
      const matches = await scanBook("non-existent", tmpDir, false);
      expect(matches).toHaveLength(0);
    });

    it("should not fail if content directory is missing", async () => {
      const bookSlug = "no-content-book";
      const bookDir = path.join(tmpDir, bookSlug);
      const srcDir = path.join(bookDir, "src");

      await fs.promises.mkdir(srcDir, { recursive: true });
      await fs.promises.writeFile(path.join(srcDir, "SUMMARY.md"), "# Summary 📖", "utf8");

      const matches = await scanBook(bookSlug, tmpDir, false);

      expect(matches).toHaveLength(1);
      expect(matches[0].emoji).toBe("📖");
    });
  });
});
