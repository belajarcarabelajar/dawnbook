/**
 * scripts/gc-rate-limits.ts
 *
 * The optional periodic GC job the 0007 migration comment mentions: deletes
 * `rate_limits` rows whose window has fully expired (`expires_at < now`), so
 * the counter table cannot grow unboundedly with keys that are never used
 * again. Expired windows already reset inline on the next request, so GC is
 * pure hygiene — correctness never depends on it.
 *
 * Cloudflare Pages Functions can no longer host scheduled handlers
 * (`functions/_scheduled.ts` was removed during the Pages → Workers
 * unification; wrangler rejects such files), so this is a standalone script
 * to run from a scheduler of your choice (GitHub Actions cron, a cron on a
 * box with wrangler, etc.). It needs the same D1 access as the deploy
 * script: a Cloudflare API token with D1 edit permissions.
 *
 * Usage:
 *   bun run scripts/gc-rate-limits.ts                  # production D1
 *   D1_DB_NAME=other-db bun run scripts/gc-rate-limits.ts
 *
 * It shells out to `wrangler d1 execute ... --remote --json` so the exact
 * statement (RATE_LIMIT_GC_SQL from functions/lib/rate-limit.ts) runs against
 * the real database and the deleted-row count is reported from D1's meta.
 *
 * Env: CLOUDFLARE_API_TOKEN (or CF_API_TOKEN) + CLOUDFLARE_ACCOUNT_ID, same
 * as scripts/deploy-website.sh. Not found in the environment → clear error.
 *
 * Safety: GC removes only rows with `expires_at < now`. The UPSERT resets
 * expired windows inline (`expires_at <= now`), so if a request races this
 * delete the outcome is correct either way: GC-first → the next UPSERT is a
 * fresh INSERT; request-first → the new row carries a future `expires_at`
 * and never matches the predicate. GC is therefore safe under concurrency.
 */

import { $ } from "bun";
import { RATE_LIMIT_GC_SQL } from "../functions/lib/rate-limit";

const DB_NAME = process.env.D1_DB_NAME || "dawnbook-db";

interface D1StatementResult {
  results: unknown[];
  success: boolean;
  meta?: { changes?: number };
}

function fail(message: string): never {
  console.error(`❌ ${message}`);
  process.exit(1);
}

async function main() {
  if (!process.env.CLOUDFLARE_API_TOKEN && !process.env.CF_API_TOKEN) {
    fail(
      "CLOUDFLARE_API_TOKEN / CF_API_TOKEN not set. Source the same env the " +
        "deploy script uses (see scripts/deploy-website.sh) and retry.",
    );
  }
  if (!process.env.CLOUDFLARE_ACCOUNT_ID && !process.env.CF_ACCOUNT_ID) {
    fail(
      "CLOUDFLARE_ACCOUNT_ID / CF_ACCOUNT_ID not set. `wrangler d1 execute " +
        "--remote` needs the account id too — source the deploy env and retry.",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  // RATE_LIMIT_GC_SQL uses a single ?1 placeholder; substitute the literal
  // now (an integer — no injection surface) because `wrangler d1 execute
  // --command` takes raw SQL rather than bind parameters.
  const sql = RATE_LIMIT_GC_SQL.replace("?1", String(now));

  console.log(
    `🗑️  Deleting fully-expired rate_limits rows (expires_at < ${now}, ${new Date(now * 1000).toISOString()})…`,
  );

  let raw: string;
  try {
    raw = (
      await $`npx wrangler d1 execute ${DB_NAME} --remote --json --command=${sql}`.quiet()
    ).stdout.toString();
  } catch (err) {
    fail(
      `wrangler d1 execute failed: ${
        (err as Error).message.split("\n").slice(0, 3).join(" ")
      }`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail("could not parse wrangler JSON output");
  }
  if (!Array.isArray(parsed)) {
    fail(`unexpected wrangler JSON output (expected an array): ${raw.slice(0, 200)}`);
  }

  const results = parsed as D1StatementResult[];
  const deleted = results.reduce((sum, r) => sum + (r.meta?.changes ?? 0), 0);
  console.log(`✅ GC complete: ${deleted} row(s) removed from ${DB_NAME}.`);
}

main().catch((err) => {
  console.error("❌ GC job failed:", err);
  process.exit(1);
});
