import { describe, it, expect, mock } from "bun:test";
import {
  checkRateLimit,
  enforceRateLimit,
} from "../../../functions/lib/rate-limit";
import { createMockEnv, setQueryHandler } from "../../helpers/mocks";

const WINDOW = 600;

const makeRows = (count: number) => {
  const now = Math.floor(Date.now() / 1000);
  return [{ count, window_start: now, expires_at: now + WINDOW }];
};

const requestWithIp = (ip = "203.0.113.9") =>
  new Request("https://example.com/api/books", { headers: { "CF-Connecting-IP": ip } });

describe("checkRateLimit / enforceRateLimit", () => {
  it("allows a request that is within quota", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "INSERT", () => makeRows(1));

    const res = await enforceRateLimit(env, requestWithIp(), {
      route: "test",
      limit: 30,
      windowSeconds: WINDOW,
    });
    expect(res).toBeNull();
  });

  it("returns 429 with Retry-After and X-RateLimit-* headers when over quota", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "INSERT", () => makeRows(31)); // limit is 30

    const res = await enforceRateLimit(env, requestWithIp(), {
      route: "test",
      limit: 30,
      windowSeconds: WINDOW,
    });
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
    expect(res!.headers.get("Retry-After")).toBeTruthy();
    expect(res!.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(res!.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(Number(res!.headers.get("X-RateLimit-Reset"))).toBeGreaterThan(0);
    expect((await res!.json()).error).toBe("Rate limit exceeded");
  });

  it("keys the counter by verified user id when userKey is provided", async () => {
    const env = createMockEnv();
    const seen: string[] = [];
    setQueryHandler(env, "INSERT", (sql, params) => {
      seen.push(params[0] as string);
      return makeRows(1);
    });

    const result = await checkRateLimit(env.DB, requestWithIp(), {
      route: "progress",
      limit: 120,
      windowSeconds: WINDOW,
      userKey: "user_123",
    });
    expect(result.ok).toBe(true);
    expect(seen[0]).toBe("progress:u:user_123");
  });

  it("keys the counter by client IP when no userKey is provided", async () => {
    const env = createMockEnv();
    const seen: string[] = [];
    setQueryHandler(env, "INSERT", (sql, params) => {
      seen.push(params[0] as string);
      return makeRows(1);
    });

    const result = await checkRateLimit(env.DB, requestWithIp("198.51.100.7"), {
      route: "books-view",
      limit: 120,
      windowSeconds: WINDOW,
    });
    expect(result.ok).toBe(true);
    expect(seen[0]).toBe("books-view:ip:198.51.100.7");
  });

  it("guards the atomic upsert shape (inline window reset + RETURNING)", async () => {
    // The D1 mock never evaluates SQL, so pin the statement structure here to
    // catch regressions in the expired-window reset logic.
    const env = createMockEnv();
    let capturedSql = "";
    setQueryHandler(env, "INSERT", (sql) => {
      capturedSql = sql;
      return makeRows(1);
    });

    await checkRateLimit(env.DB, requestWithIp(), {
      route: "test",
      limit: 30,
      windowSeconds: WINDOW,
    });

    expect(capturedSql).toContain("INSERT INTO rate_limits");
    expect(capturedSql).toContain("ON CONFLICT(key) DO UPDATE SET");
    expect(capturedSql).toContain("CASE WHEN rate_limits.expires_at <= ?2 THEN 1");
    expect(capturedSql).toContain("RETURNING count, window_start, expires_at");
  });

  it("fails open (allows the request) when D1 throws", async () => {
    const env = createMockEnv();
    env.DB.prepare = mock(() => {
      throw new Error("D1 unavailable");
    }) as any;

    const res = await enforceRateLimit(env, requestWithIp(), {
      route: "test",
      limit: 30,
      windowSeconds: WINDOW,
    });
    expect(res).toBeNull();

    // The same holds when D1 returns no row (unexpected empty result).
    const env2 = createMockEnv();
    setQueryHandler(env2, "INSERT", () => []);
    const res2 = await enforceRateLimit(env2, requestWithIp(), {
      route: "test",
      limit: 30,
      windowSeconds: WINDOW,
    });
    expect(res2).toBeNull();
  });
});
