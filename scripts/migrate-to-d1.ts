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
  subject_label: string | null;
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

function parseSubjectLabelFromToml(tomlContent: string): string | null {
  const match = tomlContent.match(/^subject_label\s*=\s*"([^"]+)"/m);
  return match ? match[1] : null;
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
    const subject_label = parseSubjectLabelFromToml(tomlContent);

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
      subject_label,
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
    const subjectLabelSql = row.subject_label ? `'${escapeSql(row.subject_label)}'` : "NULL";
    return `INSERT INTO books (id, slug, title, status, subject_label, content_md, created_at, updated_at)
VALUES (
  '${escapeSql(row.id)}',
  '${escapeSql(row.slug)}',
  '${escapeSql(row.title)}',
  '${escapeSql(row.status)}',
  ${subjectLabelSql},
  '${escapeSql(row.content_md)}',
  '${escapeSql(row.created_at)}',
  '${escapeSql(row.updated_at)}'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  subject_label = excluded.subject_label,
  content_md = excluded.content_md,
  updated_at = excluded.updated_at;`;
  });

  const fullSql = statements.join("\n\n");

  // Write SQL to a temp file for wrangler execution
  const tmpSqlPath = join(rootDir, "db", "seed.sql");
  await Bun.write(tmpSqlPath, fullSql);
  console.log(`\n📝 Wrote seed SQL to ${tmpSqlPath} (${rows.length} book(s))`);

  // Execute via wrangler d1 book-by-book using --command to avoid SQLITE_TOOBIG and silent execution failures
  console.log("🚀 Applying seed to D1 (dawnbook-db) book-by-book...");
  for (const row of rows) {
    const subjectLabelSql = row.subject_label ? `'${escapeSql(row.subject_label)}'` : "NULL";
    
    // Chunk size 30,000 characters (30 KB)
    const chunkSize = 30000;
    const content = row.content_md;
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }

    console.log(`Applying seed for book: ${row.slug} (${chunks.length} chunks)...`);
    
    // 1. Initial insert/update metadata (setting content_md = '')
    const initialSql = `INSERT INTO books (id, slug, title, status, subject_label, content_md, created_at, updated_at)
VALUES (
  '${escapeSql(row.id)}',
  '${escapeSql(row.slug)}',
  '${escapeSql(row.title)}',
  '${escapeSql(row.status)}',
  ${subjectLabelSql},
  '',
  '${escapeSql(row.created_at)}',
  '${escapeSql(row.updated_at)}'
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  subject_label = excluded.subject_label,
  content_md = '',
  updated_at = excluded.updated_at;`;

    try {
      console.log(`  - Inserting metadata...`);
      await $`npx wrangler d1 execute dawnbook-db --remote --command=${initialSql}`;
    } catch (error) {
      console.error(`❌ Failed to apply metadata for ${row.slug}:`, error);
      process.exit(1);
    }

    // 2. Append chunks sequentially
    let chunkIndex = 1;
    for (const chunk of chunks) {
      const chunkSql = `UPDATE books SET content_md = content_md || '${escapeSql(chunk)}' WHERE slug = '${escapeSql(row.slug)}';`;
      try {
        console.log(`  - Appending chunk ${chunkIndex}/${chunks.length}...`);
        await $`npx wrangler d1 execute dawnbook-db --remote --command=${chunkSql}`;
      } catch (error) {
        console.error(`❌ Failed to append chunk ${chunkIndex} for ${row.slug}:`, error);
        process.exit(1);
      }
      chunkIndex++;
    }
  }
  console.log("✅ All seeds applied successfully.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
