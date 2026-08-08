/**
 * scripts/check-d1-rate-limit.ts
 *
 * Integration check: executes the real rate-limit UPSERT statement
 * (functions/lib/rate-limit.ts, RATE_LIMIT_UPSERT_SQL) against an actual D1
 * instance. The Bun unit-test mocks never evaluate SQL, so this is the only
 * automated place where syntax/runtime errors in the statement surface.
 *
 * It targets a LOCAL, in-memory D1 instance via miniflare (the same SQLite-
 * backed D1 engine `wrangler d1 ... --local` uses): a real SQLite engine
 * with no credentials, no network, and no writes to production. CI runs it
 * after installing dependencies; the deploy workflow applies migrations to
 * the remote database separately.
 *
 * Why miniflare rather than shelling out to `wrangler d1 ... --local`: the
 * CLI boots a full Workers runtime to serve the statement, which is heavier
 * and environment-sensitive; miniflare exposes the identical D1 bindings
 * directly from Node/Bun. The full migration set (db/migrations/*.sql) is
 * applied first so the check also guards the schema the UPSERT depends on.
 *
 * Usage:
 *   bun run scripts/check-d1-rate-limit.ts
 */

import { Miniflare } from "miniflare";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  RATE_LIMIT_GC_SQL,
  RATE_LIMIT_UPSERT_SQL,
} from "../functions/lib/rate-limit";

/**
 * Strips SQL comments (full-line and trailing `--`) and returns the
 * executable statements. miniflare's D1 exec rejects multi-line statements,
 * so each statement is later collapsed to a single line. No migration string
 * literal contains `--` or `;`, so this naive split is safe for this repo.
 */
function splitStatements(sql: string): string[] {
  return sql
    .split("\n")
    // Drop full-line comments, then truncate trailing `-- ...` comments.
    .filter((line) => !line.trim().startsWith("--"))
    .map((line) => line.replace(/\s*--.*$/, ""))
    .join("\n")
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);
}

interface CountRow {
  count: number;
  window_start: number;
  expires_at: number;
}

async function main() {
  // In-memory D1 ("ci-check-db") — nothing is persisted to disk, so parallel
  // CI jobs and repeated local runs can never collide or pollute anything.
  const mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('ok') } }",
    d1Databases: { DB: "ci-check-db" },
    compatibilityDate: "2026-07-14",
    d1Persist: false,
  });
  const db = await mf.getD1Database("DB");
  const probeKey = `ci-check:${process.pid}:${Date.now()}`;

  try {
    // 0. Apply the full migration set (idempotent IF NOT EXISTS) so the
    //    check exercises the real schema the UPSERT depends on. miniflare's
    //    D1 exec rejects multi-line statements, so each statement is
    //    normalized to a single line before being submitted.
    console.log("Applying migrations to in-memory D1...");
    const migrations = (
      await readdir("db/migrations")
    )
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const file of migrations) {
      const raw = await readFile(join("db/migrations", file), "utf8");
      for (const statement of splitStatements(raw)) {
        await db.exec(statement.replace(/\s+/g, " "));
      }
    }

    // 1. Fresh insert: no row exists -> count must be 1.
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 600;
    console.log("1. Fresh insert...");
    const fresh = await db
      .prepare(RATE_LIMIT_UPSERT_SQL)
      .bind(probeKey, now, expiresAt)
      .first<CountRow>();
    if (!fresh || fresh.count !== 1) {
      throw new Error(`fresh insert expected count=1, got ${JSON.stringify(fresh)}`);
    }
    console.log("   ✅ count=1");

    // 2. In-window increment: same key, unexpired -> count must become 2.
    console.log("2. In-window increment...");
    const incremented = await db
      .prepare(RATE_LIMIT_UPSERT_SQL)
      .bind(probeKey, now, expiresAt)
      .first<CountRow>();
    if (!incremented || incremented.count !== 2) {
      throw new Error(`increment expected count=2, got ${JSON.stringify(incremented)}`);
    }
    console.log("   ✅ count=2");

    // 3. Expired-window reset: seed a stale row (count=5, expired window),
    //    then the UPSERT must reset to count=1 with the new window.
    console.log("3. Expired-window reset...");
    const past = now - 3600;
    // The probe key already exists from steps 1-2, so clear it before seeding
    // the deliberately stale row (count=5, expired window).
    await db.prepare("DELETE FROM rate_limits WHERE key = ?").bind(probeKey).run();
    await db
      .prepare(
        "INSERT INTO rate_limits (key, count, window_start, expires_at) VALUES (?, ?, ?, ?)",
      )
      .bind(probeKey, 5, past, past)
      .run();
    const reset = await db
      .prepare(RATE_LIMIT_UPSERT_SQL)
      .bind(probeKey, now, expiresAt)
      .first<CountRow>();
    if (!reset || reset.count !== 1 || reset.window_start !== now || reset.expires_at !== expiresAt) {
      throw new Error(
        `expired reset expected count=1 + new window, got ${JSON.stringify(reset)}`,
      );
    }
    console.log("   ✅ reset to count=1 with new window");

    // 4. Optional GC: delete only fully-expired rows (the 0007 migration's
    //    periodic GC job). Seed one expired + one live row, run the real GC
    //    statement, and assert exactly the expired row is removed.
    console.log("4. GC of fully-expired rows...");
    const gcExpiredKey = `${probeKey}:gc-expired`;
    const gcLiveKey = `${probeKey}:gc-live`;
    // Reuse `past` (now - 3600) from the expired-window-reset step above.
    await db
      .prepare(
        "INSERT INTO rate_limits (key, count, window_start, expires_at) VALUES (?, ?, ?, ?)",
      )
      .bind(gcExpiredKey, 1, past, past)
      .run();
    await db
      .prepare(
        "INSERT INTO rate_limits (key, count, window_start, expires_at) VALUES (?, ?, ?, ?)",
      )
      .bind(gcLiveKey, 1, now, expiresAt)
      .run();
    await db.prepare(RATE_LIMIT_GC_SQL).bind(now).run();
    const remaining = await db
      .prepare("SELECT key FROM rate_limits WHERE key IN (?, ?)")
      .bind(gcExpiredKey, gcLiveKey)
      .all<{ key: string }>();
    const remainingKeys = remaining.results.map((r) => r.key);
    if (remainingKeys.includes(gcExpiredKey) || !remainingKeys.includes(gcLiveKey)) {
      throw new Error(
        `GC expected only the live row to survive, got ${JSON.stringify(remainingKeys)}`,
      );
    }
    console.log("   ✅ expired row removed, live row kept");

    console.log(
      "\n✅ Rate-limit UPSERT + GC verified against real D1 (fresh/increment/expired-reset/gc).",
    );
  } finally {
    // 4. Best-effort cleanup. The DB is in-memory so this is cosmetic (it
    //    mirrors the hygiene the statements follow elsewhere), and it must
    //    never mask the real failure — e.g. when a migration failed before
    //    `rate_limits` existed, the DELETE would throw "no such table".
    try {
      await db.prepare("DELETE FROM rate_limits WHERE key = ?").bind(probeKey).run();
    } catch {
      // Cleanup failure is secondary to whatever the try block reported.
    }
    await mf.dispose();
  }
}

main().catch((err) => {
  console.error("❌ Integration check failed:", err);
  process.exit(1);
});
