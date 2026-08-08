/**
 * functions/lib/rate-limit.ts
 *
 * Fixed-window rate limiting for Cloudflare Pages Functions, backed by D1.
 *
 * Why D1 rather than in-memory state: Pages Functions isolates are stateless
 * and recycled under load, so a per-isolate Map counter gives unreliable
 * coverage. D1's `INSERT ... ON CONFLICT ... RETURNING` performs the window
 * increment atomically in a single statement — safe under concurrent
 * requests and, because expired windows reset inside the statement itself,
 * it requires no background GC for correctness.
 *
 * Cloudflare best-practice notes:
 *  - Key on `CF-Connecting-IP` (populated by Cloudflare) for anonymous
 *    endpoints; key on the *verified* user id for authenticated endpoints so
 *    the quota follows the principal, not a shared/rotating IP.
 *  - Fail open: if D1 is unavailable the request is allowed through and an
 *    error is logged, so rate limiting never becomes an availability risk.
 *  - 429 responses carry `Retry-After` plus `X-RateLimit-*` headers so
 *    clients can back off and observability tools can read the quota.
 */

export interface RateLimitOptions {
  /** Namespace for the counter, e.g. "auth/callback". Keeps routes isolated. */
  route: string;
  /** Maximum number of requests allowed per window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
  /**
   * Verified principal id (e.g. session.sub). When provided the counter is
   * keyed by user; otherwise it falls back to the client IP.
   */
  userKey?: string | null;
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Unix seconds when the current window resets. */
  resetAt: number;
  /** Seconds the client should wait before retrying (0 when ok). */
  retryAfter: number;
}

interface RateLimitRow {
  count: number;
  window_start: number;
  expires_at: number;
}

/**
 * The atomic fixed-window increment. A single statement: inserts the first
 * counter row, or — on key conflict — increments unless the stored window has
 * expired, in which case it resets. Expired windows therefore need no
 * background GC.
 *
 * Exported so the CI integration check (scripts/check-d1-rate-limit.ts) can
 * execute the exact same statement against a real D1 instance — the Bun unit
 * mocks never evaluate SQL, so that check is the only place syntax/runtime
 * errors in this statement would surface.
 */
export const RATE_LIMIT_UPSERT_SQL = `INSERT INTO rate_limits (key, count, window_start, expires_at)
VALUES (?1, 1, ?2, ?3)
ON CONFLICT(key) DO UPDATE SET
  count        = CASE WHEN rate_limits.expires_at <= ?2 THEN 1 ELSE rate_limits.count + 1 END,
  window_start = CASE WHEN rate_limits.expires_at <= ?2 THEN ?2 ELSE rate_limits.window_start END,
  expires_at   = CASE WHEN rate_limits.expires_at <= ?2 THEN ?3 ELSE rate_limits.expires_at END
RETURNING count, window_start, expires_at`;

/**
 * The optional periodic GC job the 0007 migration comment mentions: removes
 * rows whose window has fully expired (`expires_at < now`). Expired windows
 * already reset inline on the next request, so GC is pure hygiene — it keeps
 * the table from growing unboundedly with keys that are never used again.
 *
 * Exported so scripts/check-d1-rate-limit.ts (CI) and scripts/gc-rate-limits.ts
 * (the standalone periodic job) execute the exact same statement.
 */
export const RATE_LIMIT_GC_SQL = `DELETE FROM rate_limits WHERE expires_at < ?1`;

/**
 * Runs the GC delete against a D1 instance. Returns the number of rows
 * removed. Never throws — a failure (e.g. unapplied migration) is logged at
 * warn and reported as 0 so a periodic job can keep running on the next tick.
 */
export async function gcExpiredRateLimits(
  db: D1Database,
  now: number = Math.floor(Date.now() / 1000)
): Promise<number> {
  try {
    const res = await db.prepare(RATE_LIMIT_GC_SQL).bind(now).run();
    return res.meta?.changes ?? 0;
  } catch (err) {
    console.warn(
      "[rate-limit] GC delete failed; expired rows will be retried next run:",
      err
    );
    return 0;
  }
}

function counterKey(request: Request, userKey?: string | null): string {
  if (userKey) return `u:${userKey}`;
  const ip = request.headers.get("CF-Connecting-IP");
  return `ip:${ip ?? "unknown"}`;
}

/**
 * Atomically increments the counter for the request's bucket and reports
 * whether the request is still within quota. Never throws — all failures
 * fail open so the underlying API is not taken down by the limiter.
 */
export async function checkRateLimit(
  db: D1Database,
  request: Request,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + opts.windowSeconds;
  const fullKey = `${opts.route}:${counterKey(request, opts.userKey)}`;

  try {
    const row = await db
      .prepare(RATE_LIMIT_UPSERT_SQL)
      .bind(fullKey, now, expiresAt)
      .first<RateLimitRow>();

    // The row could not be read back (e.g. unusual D1 behaviour): fail open.
    if (!row) return okResult(opts.limit, now);

    return {
      ok: row.count <= opts.limit,
      limit: opts.limit,
      remaining: Math.max(0, opts.limit - row.count),
      resetAt: row.expires_at,
      retryAfter: Math.max(0, row.expires_at - now),
    };
  } catch (err) {
    // Fail open, but log at warn so an unapplied migration (0007) or a D1
    // outage is visible without spamming error-level logs on every request.
    console.warn(
      "[rate-limit] D1 counter failed; allowing request (is migration 0007 applied?):",
      err
    );
    return okResult(opts.limit, now);
  }
}

/**
 * Convenience wrapper: returns a 429 Response when the request is over
 * quota, or null when it is allowed through.
 */
export async function enforceRateLimit(
  env: { DB: D1Database },
  request: Request,
  opts: RateLimitOptions
): Promise<Response | null> {
  const result = await checkRateLimit(env.DB, request, opts);
  if (result.ok) return null;

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      retry_after: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Retry-After": String(result.retryAfter),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
      },
    }
  );
}

function okResult(limit: number, now: number): RateLimitResult {
  return { ok: true, limit, remaining: limit, resetAt: now, retryAfter: 0 };
}
