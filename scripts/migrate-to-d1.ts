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
export function parseTitleFromToml(tomlContent: string): string {
  const match = tomlContent.match(/^title\s*=\s*"([^"]+)"/m);
  return match ? match[1] : "Untitled";
}

export function parseSubjectLabelFromToml(tomlContent: string): string | null {
  const match = tomlContent.match(/^subject_label\s*=\s*"([^"]+)"/m);
  return match ? match[1] : null;
}

/**
 * Escapes strings for safe SQLite string literal embedding against SQL injection.
 * Strips null bytes and doubles single quotes per SQLite specification.
 */
export function escapeSql(value: string): string {
  if (typeof value !== "string") return "''";
  return "'" + value.replace(/\0/g, "").replace(/'/g, "''") + "'";
}

export function escapeSqlNullable(value: string | null | undefined): string {
  if (!value) return "NULL";
  return escapeSql(value);
}

export interface MigrationOptions {
  rootDir?: string;
  booksDir?: string;
  bookSlug?: string;
  executeCommand?: (cmd: string) => Promise<void>;
  writeSeedSql?: boolean;
}

export async function runMigration(options: MigrationOptions = {}) {
  const rootDir = options.rootDir ?? process.cwd();
  const booksDir = options.booksDir ?? join(rootDir, "books");
  const targetSlug = options.bookSlug ?? process.env.BOOK_SLUG;
  const now = new Date().toISOString();

  let entries: string[] = [];
  try {
    entries = await readdir(booksDir);
  } catch {
    console.warn(`⚠️  Cannot read books directory: ${booksDir}`);
    return;
  }

  if (targetSlug) {
    entries = entries.filter((e) => e === targetSlug);
    console.log(`Filtering migrations to target only: ${targetSlug}`);
  }

  // Concurrently filter out non-directories and files starting with "_"
  const validEntries = (
    await Promise.all(
      entries.map(async (entry) => {
        if (entry.startsWith("_")) return null;

        const bookPath = join(booksDir, entry);
        try {
          const bookStat = await stat(bookPath);
          if (!bookStat.isDirectory()) return null;
          return entry;
        } catch {
          return null;
        }
      }),
    )
  ).filter((e): e is string => e !== null);

  const rows: BookRow[] = [];

  for (const entry of validEntries) {
    const bookPath = join(booksDir, entry);
    if (!/^[a-zA-Z0-9_-]+$/.test(entry)) {
      console.warn(`⚠️  Skipping invalid directory name: ${entry}`);
      continue;
    }

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

    const srcDir = join(bookPath, "src");
    let combinedMd = "";

    try {
      const mdFiles = (await readdir(srcDir, { recursive: true }))
        .filter((f) => f.endsWith(".md") && !f.endsWith("SUMMARY.md"))
        .sort();

      const mdContents = await Promise.all(
        mdFiles.map((mdFile) => readFile(join(srcDir, mdFile), "utf-8")),
      );

      for (let i = 0; i < mdFiles.length; i++) {
        combinedMd += `\n\n<!-- Chapter: ${basename(mdFiles[i], ".md")} -->\n\n${mdContents[i]}`;
      }
    } catch {
      console.warn(`⚠️  Skipping ${entry}: cannot read src/ directory`);
      continue;
    }

    rows.push({
      id: entry,
      slug: entry,
      title,
      status: "published",
      subject_label,
      content_md: combinedMd.trim(),
      created_at: now,
      updated_at: now,
    });

    console.log(
      `📖 Prepared: ${entry} → "${title}" (${combinedMd.length} chars)`,
    );
  }

  if (rows.length === 0) {
    console.log("No books found to seed.");
    return;
  }

  const statements = rows.map((row) => {
    return `INSERT INTO books (id, slug, title, status, subject_label, content_md, created_at, updated_at)
VALUES (
  ${escapeSql(row.id)},
  ${escapeSql(row.slug)},
  ${escapeSql(row.title)},
  ${escapeSql(row.status)},
  ${escapeSqlNullable(row.subject_label)},
  ${escapeSql(row.content_md)},
  ${escapeSql(row.created_at)},
  ${escapeSql(row.updated_at)}
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  subject_label = excluded.subject_label,
  content_md = excluded.content_md,
  updated_at = excluded.updated_at;`;
  });

  const fullSql = statements.join("\n\n");

  if (options.writeSeedSql !== false) {
    const tmpSqlPath = join(rootDir, "db", "seed.sql");
    await Bun.write(tmpSqlPath, fullSql);
    console.log(`\n📝 Wrote seed SQL to ${tmpSqlPath} (${rows.length} book(s))`);
  }

  const execFn =
    options.executeCommand ??
    (async (commandSql: string) => {
      await $`npx wrangler d1 execute dawnbook-db --remote --command=${commandSql}`;
    });

  console.log("🚀 Applying seed to D1 (dawnbook-db) book-by-book...");
  for (const row of rows) {
    const chunkSize = 30000;
    const content = row.content_md;
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.substring(i, i + chunkSize));
    }

    console.log(
      `Applying seed for book: ${row.slug} (${chunks.length} chunks)...`,
    );

    const initialSql = `INSERT INTO books (id, slug, title, status, subject_label, content_md, created_at, updated_at)
VALUES (
  ${escapeSql(row.id)},
  ${escapeSql(row.slug)},
  ${escapeSql(row.title)},
  ${escapeSql(row.status)},
  ${escapeSqlNullable(row.subject_label)},
  '',
  ${escapeSql(row.created_at)},
  ${escapeSql(row.updated_at)}
)
ON CONFLICT(slug) DO UPDATE SET
  title = excluded.title,
  status = excluded.status,
  subject_label = excluded.subject_label,
  content_md = '',
  updated_at = excluded.updated_at;`;

    try {
      console.log(`  - Inserting metadata...`);
      await execFn(initialSql);
    } catch (error) {
      console.error(`❌ Failed to apply metadata for ${row.slug}:`, error);
      throw error;
    }

    let chunkIndex = 1;
    for (const chunk of chunks) {
      const chunkSql = `UPDATE books SET content_md = content_md || ${escapeSql(chunk)} WHERE slug = ${escapeSql(row.slug)};`;
      try {
        console.log(`  - Appending chunk ${chunkIndex}/${chunks.length}...`);
        await execFn(chunkSql);
      } catch (error) {
        console.error(
          `❌ Failed to append chunk ${chunkIndex} for ${row.slug}:`,
          error,
        );
        throw error;
      }
      chunkIndex++;
    }
  }
  console.log("✅ All seeds applied successfully.");
}

if (import.meta.main) {
  runMigration().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
