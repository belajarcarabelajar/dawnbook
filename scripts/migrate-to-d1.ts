/**
 * scripts/migrate-to-d1.ts
 *
 * One-time seed script that traverses books/ (skipping _-prefixed dirs),
 * reads each book.toml and src/*.md, and emits idempotent INSERT ... ON CONFLICT
 * SQL applied via `wrangler d1 execute dawnbook-db`.
 *
 * Usage:  bun run scripts/migrate-to-d1.ts
 */

import { readdir, stat, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { $ } from "bun";

interface BookRow {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published";
  content_md: string;
  created_at: string;
  updated_at: string;
}

/**
 * Minimal TOML parser — extracts `title = "..."` from the [book] section.
 * Full TOML parsing is unnecessary for this limited use case.
 */
function parseTitleFromToml(tomlContent: string): string {
  const match = tomlContent.match(/^title\s*=\s*"([^"]+)"/m);
  return match ? match[1] : "Untitled";
}

/**
 * Escapes single quotes for safe SQL string embedding.
 */
function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

async function main() {
  const rootDir = process.cwd();
  const booksDir = join(rootDir, "books");
  const now = new Date().toISOString();

  const entries = await readdir(booksDir);
  const rows: BookRow[] = [];

  for (const entry of entries) {
    // Skip _-prefixed directories (e.g., _template)
    if (entry.startsWith("_")) continue;

    const bookPath = join(booksDir, entry);
    const bookStat = await stat(bookPath);
    if (!bookStat.isDirectory()) continue;

    // Validate slug format
    if (!/^[a-zA-Z0-9_-]+$/.test(entry)) {
      console.warn(`⚠️  Skipping invalid directory name: ${entry}`);
      continue;
    }

    // Must have a book.toml
    const tomlPath = join(bookPath, "book.toml");
    try {
      await stat(tomlPath);
    } catch {
      console.warn(`⚠️  Skipping ${entry}: no book.toml found`);
      continue;
    }

    const tomlContent = await readFile(tomlPath, "utf-8");
    const title = parseTitleFromToml(tomlContent);

    // Read and concatenate all .md files from src/ (excluding SUMMARY.md)
    const srcDir = join(bookPath, "src");
    let combinedMd = "";

    try {
      const mdFiles = (await readdir(srcDir, { recursive: true }))
        .filter((f) => f.endsWith(".md") && !f.endsWith("SUMMARY.md"))
        .sort();

      for (const mdFile of mdFiles) {
        const mdContent = await readFile(join(srcDir, mdFile), "utf-8");
        combinedMd += `\n\n<!-- Chapter: ${basename(mdFile, ".md")} -->\n\n${mdContent}`;
      }
    } catch {
      console.warn(`⚠️  Skipping ${entry}: cannot read src/ directory`);
      continue;
    }

    // Use slug as deterministic ID for idempotency
    rows.push({
      id: entry,
      slug: entry,
      title,
      status: "published", // Existing file-based books are considered published
      content_md: combinedMd.trim(),
      created_at: now,
      updated_at: now,
    });

    console.log(`📖 Prepared: ${entry} → "${title}" (${combinedMd.length} chars)`);
  }

  if (rows.length === 0) {
    console.log("No books found to seed.");
    return;
  }

  // Build idempotent SQL statements
  const statements = rows.map((row) => {
    return `INSERT INTO books (id, slug, title, status, content_md, created_at, updated_at)
VALUES (
  '${escapeSql(row.id)}',
  '${escapeSql(row.slug)}',
  '${escapeSql(row.title)}',
  '${escapeSql(row.status)}',
  '${escapeSql(row.content_md)}',
  '${escapeSql(row.created_at)}',
  '${escapeSql(row.updated_at)}'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  content_md = excluded.content_md,
  updated_at = excluded.updated_at;`;
  });

  const fullSql = statements.join("\n\n");

  // Write SQL to a temp file for wrangler execution
  const tmpSqlPath = join(rootDir, "db", "seed.sql");
  await Bun.write(tmpSqlPath, fullSql);
  console.log(`\n📝 Wrote seed SQL to ${tmpSqlPath} (${rows.length} book(s))`);

  // Execute via wrangler d1
  console.log("🚀 Applying seed to D1 (dawnbook-db)...");
  try {
    await $`npx wrangler d1 execute dawnbook-db --remote --file=${tmpSqlPath} --yes`;
    console.log("✅ Seed applied successfully.");
  } catch (error) {
    console.error("❌ Failed to apply seed:", error);
    console.log("\n💡 To apply locally instead, run:");
    console.log(`   wrangler d1 execute dawnbook-db --local --file=${tmpSqlPath}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
