import { describe, it, expect, mock, setSystemTime, afterEach } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { onRequest } from "../../../../../functions/api/books/[slug]/view";
import { createMockEnv, setQueryHandler } from "../../../../helpers/mocks";

// Real in-memory SQLite with the production migrations, so the dedupe UPSERT,
// the view_count UPDATE and batch rollback behave as in D1.
const MIGRATIONS = join(import.meta.dir, "../../../../../db/migrations");

function createSqliteD1() {
  const sqlite = new Database(":memory:");
  for (const file of ["0001_init.sql", "0004_book_subject_label.sql", "0005_book_view_count.sql", "0007_rate_limit.sql"]) {
    sqlite.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  sqlite.exec(
    "INSERT INTO books (id, slug, title, status, content_md, created_at, updated_at) " +
      "VALUES ('test-book', 'test-book', 'T', 'published', '', 'x', 'x')",
  );
  const makeStmt = (sql: string) => {
    let params: unknown[] = [];
    const stmt = {
      sql,
      get params() {
        return params;
      },
      bind(...p: unknown[]) {
        params = p;
        return stmt;
      },
      async first<T>() {
        return (sqlite.query(sql).get(...(params as any[])) as T) ?? null;
      },
      async all<T>() {
        return { results: sqlite.query(sql).all(...(params as any[])) as T[], success: true, meta: {} };
      },
      async run() {
        const res = sqlite.query(sql).run(...(params as any[]));
        return { success: true, meta: { changes: res.changes } };
      },
    };
    return stmt;
  };
  const db = {
    prepare: makeStmt,
    // D1 runs a batch as one transaction: any failing statement throws and
    // rolls back every statement in it.
    async batch(stmts: ReturnType<typeof makeStmt>[]) {
      return sqlite.transaction(() =>
        stmts.map((s) => {
          const q = sqlite.query(s.sql);
          const results = q.all(...(s.params as any[]));
          return { results, success: true, meta: {} };
        }),
      )();
    },
  };
  return { sqlite, env: { DB: db } as any };
}

const viewCount = (sqlite: Database) =>
  (sqlite.query("SELECT view_count FROM books WHERE slug = 'test-book'").get() as { view_count: number }).view_count;

function viewRequest(ip = "203.0.113.9") {
  return new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
    method: "POST",
    headers: { "X-Requested-With": "XMLHttpRequest", "CF-Connecting-IP": ip },
  });
}

const post = (env: any, ip?: string) => onRequest({ request: viewRequest(ip), env, params: { slug: "test-book" } } as any);

describe("POST /api/books/[slug]/view against SQLite D1", () => {
  afterEach(() => setSystemTime());

  it("does not consume the 24h allowance when the view_count update fails, so a retry counts", async () => {
    const { sqlite, env } = createSqliteD1();
    sqlite.exec(
      "CREATE TRIGGER fail_view BEFORE UPDATE OF view_count ON books BEGIN SELECT RAISE(ABORT, 'boom'); END;",
    );

    const failed = await post(env);
    expect(failed.status).toBe(500);
    expect(viewCount(sqlite)).toBe(0);
    expect(sqlite.query("SELECT key FROM rate_limits WHERE key LIKE 'books-view:test-book:%'").all()).toEqual([]);

    sqlite.exec("DROP TRIGGER fail_view");
    const retry = await post(env);
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ success: true });
    expect(viewCount(sqlite)).toBe(1);
  });

  it("counts one view per viewer per book per 24 hours", async () => {
    const { sqlite, env } = createSqliteD1();
    const t0 = new Date("2030-01-01T00:00:00Z");
    setSystemTime(t0);

    const first = await post(env);
    expect(await first.json()).toEqual({ success: true });
    const second = await post(env);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({ success: true, counted: false });
    expect(viewCount(sqlite)).toBe(1);

    // The dedupe key format must not change, or live 24h windows reset on deploy.
    expect(sqlite.query("SELECT key FROM rate_limits WHERE key LIKE 'books-view:test-book:%'").all()).toEqual([
      { key: "books-view:test-book:ip:203.0.113.9" },
    ]);

    await post(env, "198.51.100.7");
    expect(viewCount(sqlite)).toBe(2);

    setSystemTime(new Date(t0.getTime() + 86400 * 1000 + 1000));
    const nextDay = await post(env);
    expect(await nextDay.json()).toEqual({ success: true });
    expect(viewCount(sqlite)).toBe(3);
  });

  it("counts concurrent requests from the same viewer once", async () => {
    const { sqlite, env } = createSqliteD1();
    const responses = await Promise.all([post(env), post(env), post(env)]);
    const bodies = await Promise.all(responses.map((r) => r.json()));
    expect(bodies.filter((b) => b.counted === false)).toHaveLength(2);
    expect(viewCount(sqlite)).toBe(1);
  });
});

describe("POST /api/books/[slug]/view", () => {
  it("allows requests with a valid X-Requested-With header", async () => {
    const env = createMockEnv();
    let queryExecuted = false;

    const prepare = env.DB.prepare;
    env.DB.prepare = mock((sql: string) => {
      const stmt = prepare(sql);
      const bind = stmt.bind;
      stmt.bind = (...params: any[]) => {
        if (sql.startsWith("UPDATE") && sql.includes("view_count") && params[0] === "test-book") {
          queryExecuted = true;
        }
        return bind(...params);
      };
      return stmt;
    });

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const context = {
      request,
      env,
      params: { slug: "test-book" },
      waitUntil: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(200);
    expect(queryExecuted).toBe(true);
  });

  it("blocks requests with an invalid X-Requested-With header", async () => {
    const env = createMockEnv();

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: {
        "X-Requested-With": "InvalidValue",
      },
    });

    const context = {
      request,
      env,
      params: { slug: "test-book" },
      waitUntil: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: "Forbidden: Invalid CSRF protection header" });
  });

  it("blocks requests with missing X-Requested-With header", async () => {
    const env = createMockEnv();

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
    });

    const context = {
      request,
      env,
      params: { slug: "test-book" },
      waitUntil: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: "Forbidden: Invalid CSRF protection header" });
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    const env = createMockEnv();
    const now = Math.floor(Date.now() / 1000);
    // Over the 120/10min per-IP limit.
    setQueryHandler(env, "INSERT", () => [{ count: 121, window_start: now, expires_at: now + 600 }]);

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: "Rate limit exceeded" });
  });

  it("returns 405 Method Not Allowed when method is not POST", async () => {
    const env = createMockEnv();
    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", { method: "GET" });
    const response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "Method not allowed" });
  });

  it("returns 400 Bad Request for invalid slug format", async () => {
    const env = createMockEnv();
    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/bad%20slug!/view", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const response = await onRequest({ request, env, params: { slug: "bad slug!" } } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid slug format" });
  });

  it("returns 500 Internal Server Error when D1 update fails or throws", async () => {
    const env = createMockEnv();
    env.DB.batch = mock(async (stmts: any[]) => stmts.map(() => ({ success: false, results: [] })));

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    let response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to update view count" });

    // DB Exception
    env.DB.prepare = mock(() => {
      throw new Error("DB Error");
    });
    response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});
