import { expect, test, describe } from "bun:test";
import { escapeSql, escapeSqlNullable } from "../../scripts/migrate-to-d1";

describe("SQLite Migration SQL Injection Prevention (scripts/migrate-to-d1.ts)", () => {
  test("escapeSql safely doubles single quotes and wraps value in single quotes", () => {
    const maliciousInput = "book'; DROP TABLE books; --";
    const escaped = escapeSql(maliciousInput);
    expect(escaped).toBe("'book''; DROP TABLE books; --'");
  });

  test("escapeSql strips null bytes to prevent string truncation attacks", () => {
    const inputWithNull = "title\0with_null";
    const escaped = escapeSql(inputWithNull);
    expect(escaped).toBe("'titlewith_null'");
  });

  test("escapeSqlNullable converts null/undefined to NULL literal", () => {
    expect(escapeSqlNullable(null)).toBe("NULL");
    expect(escapeSqlNullable(undefined)).toBe("NULL");
    expect(escapeSqlNullable("Science")).toBe("'Science'");
  });

  test("handles normal strings cleanly", () => {
    expect(escapeSql("Introduction to Rust")).toBe("'Introduction to Rust'");
  });
});
