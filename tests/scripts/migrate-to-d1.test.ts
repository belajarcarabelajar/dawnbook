import { expect, test, describe } from "bun:test";
import {
  escapeSql,
  escapeSqlNullable,
  parseTitleFromToml,
  parseSubjectLabelFromToml,
  runMigration,
} from "../../scripts/migrate-to-d1";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("scripts/migrate-to-d1.ts unit tests", () => {
  test("parseTitleFromToml extracts title correctly or defaults to Untitled", () => {
    expect(parseTitleFromToml('title = "My Great Book"')).toBe("My Great Book");
    expect(parseTitleFromToml('description = "No title here"')).toBe(
      "Untitled",
    );
    expect(parseTitleFromToml("")).toBe("Untitled");
  });

  test("parseSubjectLabelFromToml extracts subject_label or returns null", () => {
    expect(parseSubjectLabelFromToml('subject_label = "Sains"')).toBe("Sains");
    expect(parseSubjectLabelFromToml('title = "Book"')).toBeNull();
    expect(parseSubjectLabelFromToml("")).toBeNull();
  });

  test("escapeSql handles quotes, null bytes, and non-string inputs", () => {
    expect(escapeSql("O'Reilly\0")).toBe("'O''Reilly'");
    expect(escapeSql("Simple Text")).toBe("'Simple Text'");
    expect(escapeSql(123 as any)).toBe("''");
    expect(escapeSql(null as any)).toBe("''");
  });

  test("escapeSqlNullable formats string literals or NULL", () => {
    expect(escapeSqlNullable("Test")).toBe("'Test'");
    expect(escapeSqlNullable(null)).toBe("NULL");
    expect(escapeSqlNullable(undefined)).toBe("NULL");
    expect(escapeSqlNullable("")).toBe("NULL");
  });

  test("runMigration handles missing books directory gracefully", async () => {
    await runMigration({
      booksDir: "/nonexistent/directory/path/123",
      writeSeedSql: false,
    });
  });

  test("runMigration filters invalid directories, missing book.toml, and missing src/ directory", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "migrate-test-"));
    try {
      // _-prefixed directory (skipped)
      await mkdir(join(tempDir, "_template"));
      // Invalid slug directory (skipped)
      await mkdir(join(tempDir, "invalid slug!"));
      // Missing book.toml directory (skipped)
      await mkdir(join(tempDir, "no-toml-book"));
      // Missing src/ directory (skipped)
      const noSrcDir = join(tempDir, "no-src-book");
      await mkdir(noSrcDir);
      await writeFile(join(noSrcDir, "book.toml"), 'title = "No Src"');

      // Valid book
      const validBookDir = join(tempDir, "valid-book");
      await mkdir(validBookDir);
      await writeFile(
        join(validBookDir, "book.toml"),
        'title = "Valid Book"\nsubject_label = "Tech"',
      );
      await mkdir(join(validBookDir, "src"));
      await writeFile(join(validBookDir, "src", "01.md"), "# Chapter 1");

      const executedCommands: string[] = [];
      await runMigration({
        rootDir: tempDir,
        booksDir: tempDir,
        bookSlug: "valid-book",
        writeSeedSql: false,
        executeCommand: async (cmd) => {
          executedCommands.push(cmd);
        },
      });

      expect(executedCommands.length).toBeGreaterThan(0);
      expect(executedCommands[0]).toContain("valid-book");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("runMigration handles empty dataset and non-directory files", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "migrate-empty-test-"));
    try {
      // Non-directory file
      await writeFile(join(tempDir, "regular-file.txt"), "hello");
      await runMigration({
        rootDir: tempDir,
        booksDir: tempDir,
        writeSeedSql: false,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("runMigration writes seed SQL file and appends chunks when enabled", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "migrate-seedfile-test-"));
    try {
      const validBookDir = join(tempDir, "valid-book");
      await mkdir(validBookDir);
      await writeFile(
        join(validBookDir, "book.toml"),
        'title = "Valid Book"\nsubject_label = "Tech"',
      );
      await mkdir(join(validBookDir, "src"));
      await writeFile(join(validBookDir, "src", "01.md"), "# Chapter 1");
      await mkdir(join(tempDir, "db"));

      const executedCommands: string[] = [];
      await runMigration({
        rootDir: tempDir,
        booksDir: tempDir,
        writeSeedSql: true,
        executeCommand: async (cmd) => {
          executedCommands.push(cmd);
        },
      });

      expect(executedCommands.length).toBeGreaterThan(0);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("runMigration handles chunk execute exceptions", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "migrate-chunkfail-test-"));
    try {
      const validBookDir = join(tempDir, "chunk-fail-book");
      await mkdir(validBookDir);
      await writeFile(
        join(validBookDir, "book.toml"),
        'title = "Chunk Fail Book"',
      );
      await mkdir(join(validBookDir, "src"));
      await writeFile(join(validBookDir, "src", "01.md"), "# Chapter 1");

      let callCount = 0;
      expect(
        runMigration({
          rootDir: tempDir,
          booksDir: tempDir,
          writeSeedSql: false,
          executeCommand: async () => {
            callCount++;
            if (callCount > 1) {
              throw new Error("Chunk Execute Error");
            }
          },
        }),
      ).rejects.toThrow("Chunk Execute Error");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("runMigration handles metadata and chunk execute exceptions", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "migrate-fail-test-"));
    try {
      const validBookDir = join(tempDir, "fail-book");
      await mkdir(validBookDir);
      await writeFile(join(validBookDir, "book.toml"), 'title = "Fail Book"');
      await mkdir(join(validBookDir, "src"));
      await writeFile(join(validBookDir, "src", "01.md"), "# Chapter 1");

      expect(
        runMigration({
          rootDir: tempDir,
          booksDir: tempDir,
          writeSeedSql: false,
          executeCommand: async () => {
            throw new Error("Metadata Execute Error");
          },
        }),
      ).rejects.toThrow("Metadata Execute Error");
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
