import { mock } from "bun:test";

/**
 * In-memory D1 mock. Each `prepare(sql).bind(...).first()` or `.run()` call
 * delegates to a handler registered via `setQueryHandler`. The default
 * behaviour (no handler) returns empty results so tests that do not care
 * about DB responses still work.
 *
 * Usage:
 *   const env = createMockEnv();
 *   setQueryHandler(env, "SELECT", (sql, params) => [{ id: "u1" }]);
 *   setRunHandler(env, "INSERT", () => ({ success: true }));
 */
type QueryHandler = (sql: string, params: any[]) => any;
type RunHandler = (sql: string, params: any[]) => { success: boolean; meta?: any };

const handlers: Map<string, { query: QueryHandler; run: RunHandler }> = new Map();

export function setQueryHandler(env: ReturnType<typeof createMockEnv>, sqlPrefix: string, handler: QueryHandler) {
  const h = handlers.get(identityKey(env)) ?? { query: defaultQuery, run: defaultRun };
  h.query = (sql, params) => sql.trimStart().toUpperCase().startsWith(sqlPrefix.toUpperCase()) ? handler(sql, params) : defaultQuery(sql, params);
  handlers.set(identityKey(env), h);
}

export function setRunHandler(env: ReturnType<typeof createMockEnv>, sqlPrefix: string, handler: RunHandler) {
  const h = handlers.get(identityKey(env)) ?? { query: defaultQuery, run: defaultRun };
  h.run = (sql, params) => sql.trimStart().toUpperCase().startsWith(sqlPrefix.toUpperCase()) ? handler(sql, params) : defaultRun(sql, params);
  handlers.set(identityKey(env), h);
}

function identityKey(env: any): string {
  return env.__id ??= Math.random().toString(36).slice(2);
}

const defaultQuery: QueryHandler = () => [];
const defaultRun: RunHandler = () => ({ success: true });

export const mockD1Database: D1Database = {
  prepare: mock((sql: string) => {
    const bound: { params: any[] } = { params: [] };
    const api = {
      bind: (...params: any[]) => {
        bound.params = params;
        return api;
      },
      all: mock(async () => {
        const h = handlers.get(currentKey);
        const rows = h ? h.query(sql, bound.params) : defaultQuery(sql, bound.params);
        return { results: rows, success: true, meta: {} };
      }),
      first: mock(async () => {
        const h = handlers.get(currentKey);
        const rows = h ? h.query(sql, bound.params) : defaultQuery(sql, bound.params);
        return rows[0] ?? null;
      }),
      run: mock(async () => {
        const h = handlers.get(currentKey);
        return h ? h.run(sql, bound.params) : defaultRun(sql, bound.params);
      }),
      raw: mock(async () => [] as any),
    };
    return api as any;
  }),
  batch: mock(async (statements: any[]) => statements.map(() => ({ success: true }))),
  exec: mock(async (_sql: string) => ({ count: 0, duration: 0 })),
  dump: mock(async () => new ArrayBuffer(0)),
  withSession: mock(async (_id: string) => null),
} as unknown as D1Database;

let currentKey: string = "";

export const createMockEnv = (overrides: Partial<{ DB: D1Database; GOOGLE_CLIENT_ID: string; GOOGLE_CLIENT_SECRET: string }> = {}) => {
  const env: any = {
    DB: mockD1Database,
    GOOGLE_CLIENT_ID: "test_client_id",
    GOOGLE_CLIENT_SECRET: "test_client_secret",
    ...overrides,
  };
  currentKey = identityKey(env);
  return env as any;
};

/**
 * @deprecated Use createMockEnv({ DB: mockD1Database }) and set handlers via
 * setQueryHandler / setRunHandler. Kept for migration period so existing
 * tests that still mock CLERK_* env vars compile.
 */
export const mockRequest = (url: string, init?: RequestInit, country?: string) => {
  const req = new Request(url, init) as any;
  req.cf = { country: country || "US" };
  return req;
};

/**
 * @deprecated Replaced by per-test D1 handlers (setQueryHandler). Will be
 * removed once the last Clerk-era test is migrated.
 */
export const mockFetch = mock(async (req: Request | string, _init?: RequestInit) => {
  const url = typeof req === "string" ? req : req.url;
  if (url.includes(".well-known/jwks.json")) {
    return new Response("Not Found", { status: 404 });
  }
  if (url.includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "mock_access_token" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.includes("openidconnect.googleapis.com/v1/userinfo")) {
    return new Response(
      JSON.stringify({
        sub: "google_sub_123",
        email: "tester@example.com",
        email_verified: true,
        name: "Test User",
        picture: "https://example.com/pic.png",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
  if (url.includes("accounts.google.com/o/oauth2/v2/auth")) {
    return new Response("ok", { status: 200 });
  }
  return new Response("Not Found", { status: 404 });
});

global.fetch = mockFetch as any;
