import { expect, test, describe } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";

describe("Database Migrations", () => {
  test("schema definition includes required constraints", () => {
    const sqlPath = join(import.meta.dir, "../../db/migrations/0001_init.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    
    // Books table constraints
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS books");
    expect(sql).toContain("UNIQUE NOT NULL");
    expect(sql).toContain("DEFAULT 'draft'");
  });
});
