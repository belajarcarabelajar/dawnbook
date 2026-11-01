import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { handleBcbSso, onRequest } from "../../../../functions/api/auth/bcb";
import { signSsoToken } from "../../../../functions/lib/bcb-sso";
import fixture from "../../../fixtures/sso/token.json";

// Real in-memory SQLite with the production migrations, so UNIQUE and
// ON CONFLICT behave as in D1 instead of being answered by canned rows.
const MIGRATIONS = join(import.meta.dir, "../../../../db/migrations");

function createSqliteD1() {
  const sqlite = new Database(":memory:");
  for (const file of ["0006_user_oauth.sql", "0007_rate_limit.sql"]) {
    sqlite.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  const db = {
    prepare(sql: string) {
      let params: unknown[] = [];
      const stmt = {
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
    },
  };
  return { sqlite, db };
}

const NOW = 1893456000;
const EMAIL = "pembeli@contoh.id";
const NONCE_A = "AAAAAAAAAAAAAAAAAAAAAA";

async function tokenFor(opts: { secret?: string; exp?: number; nonce?: string } = {}) {
  return await signSsoToken(
    opts.secret ?? fixture.secret,
    EMAIL,
    opts.exp ?? NOW + 60,
    opts.nonce ?? NONCE_A,
  );
}

// 43 base64url characters, the shape /api/auth/bcb/start issues.
const STATE = "S".repeat(21) + "-_" + "t".repeat(20);
const OTHER_STATE = "O".repeat(43);
const CLEAR_STATE = "bcb_sso_state=; Path=/api/auth/bcb; Max-Age=0; HttpOnly; Secure; SameSite=Lax";

function ssoRequest(
  token: string,
  next?: string,
  method = "GET",
  state: { cookie?: string | null; s?: string | null } = {},
): Request {
  const cookie = state.cookie === undefined ? STATE : state.cookie;
  const s = state.s === undefined ? STATE : state.s;
  const url = new URL("https://example.com/api/auth/bcb");
  url.searchParams.set("t", token);
  if (next !== undefined) url.searchParams.set("next", next);
  if (s !== null) url.searchParams.set("s", s);
  const headers: Record<string, string> = { "CF-Connecting-IP": "203.0.113.9", "User-Agent": "uji-agen" };
  if (cookie !== null) headers.Cookie = `dawnbook_lang=id; bcb_sso_state=${cookie}`;
  return new Request(url, { method, headers });
}

function setCookies(res: Response): string[] {
  return res.headers.getSetCookie();
}

function users(sqlite: Database) {
  return sqlite.query("SELECT id, google_sub, email, name, picture, role FROM users ORDER BY id").all() as any[];
}

function sessions(sqlite: Database) {
  return sqlite.query("SELECT id, user_id, user_agent, ip, expires_at FROM sessions").all() as any[];
}

function sessionCookie(res: Response): string | null {
  const match = (res.headers.get("Set-Cookie") ?? "").match(/session_id=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

function errorCode(res: Response): string | null {
  const loc = new URL(res.headers.get("Location")!);
  expect(loc.pathname).toBe("/sign-in");
  return loc.searchParams.get("error");
}

describe("/api/auth/bcb store hand-off", () => {
  let consoleSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test("valid token for a new email creates a bcb: user, a session and redirects to next", async () => {
    const { sqlite, db } = createSqliteD1();
    const res = await handleBcbSso(
      ssoRequest(await tokenFor(), "/premium/buku/bab-1"),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://example.com/premium/buku/bab-1");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const rows = users(sqlite);
    expect(rows).toEqual([
      expect.objectContaining({ google_sub: "bcb:pembeli@contoh.id", email: EMAIL, name: null, picture: null, role: "reader" }),
    ]);
    const sid = sessionCookie(res);
    expect(sid).not.toBeNull();
    expect(setCookies(res)).toEqual([
      `session_id=${sid}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
      CLEAR_STATE,
    ]);
    const sess = sessions(sqlite);
    expect(sess).toHaveLength(1);
    expect(sess[0]).toMatchObject({ id: sid, user_id: rows[0].id, user_agent: "uji-agen", ip: "203.0.113.9" });
    expect(sess[0].expires_at).toBe(new Date((NOW + 2592000) * 1000).toISOString());
  });

  test("existing Google user with the same email keeps its id and google_sub", async () => {
    const { sqlite, db } = createSqliteD1();
    sqlite
      .query("INSERT INTO users (id, google_sub, email, name, role) VALUES ('u_google', 'g-123', ?1, 'Pembeli', 'reader')")
      .run(EMAIL);

    const res = await handleBcbSso(
      ssoRequest(await tokenFor(), "/"),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );

    expect(res.status).toBe(302);
    expect(users(sqlite)).toEqual([
      expect.objectContaining({ id: "u_google", google_sub: "g-123", email: EMAIL, name: "Pembeli" }),
    ]);
    expect(sessions(sqlite)).toEqual([expect.objectContaining({ id: sessionCookie(res), user_id: "u_google" })]);
  });

  test("the same token used twice is refused the second time with no second session", async () => {
    const { sqlite, db } = createSqliteD1();
    const env = { DB: db, BCB_SSO_SECRET: fixture.secret } as any;
    const token = await tokenFor();

    const first = await handleBcbSso(ssoRequest(token, "/"), env, NOW);
    expect(sessionCookie(first)).not.toBeNull();

    const second = await handleBcbSso(ssoRequest(token, "/"), env, NOW + 1);
    expect(second.status).toBe(302);
    expect(errorCode(second)).toBe("sso_invalid");
    expect(sessionCookie(second)).toBeNull();
    expect(second.headers.get("Cache-Control")).toBe("no-store");
    expect(sessions(sqlite)).toHaveLength(1);
    const used = sqlite.query("SELECT key, expires_at FROM rate_limits").all() as any[];
    expect(used).toEqual([{ key: `sso:${NONCE_A}`, expires_at: NOW + 600 }]);
  });

  test("expired token is refused with sso_invalid", async () => {
    const { sqlite, db } = createSqliteD1();
    const res = await handleBcbSso(
      ssoRequest(await tokenFor({ exp: NOW })),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );
    expect(errorCode(res)).toBe("sso_invalid");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(users(sqlite)).toEqual([]);
    expect(sessions(sqlite)).toEqual([]);
  });

  test("token signed with another secret is refused and does not burn the nonce", async () => {
    const { sqlite, db } = createSqliteD1();
    const forged = await tokenFor({ secret: "rahasia-palsu-yang-panjangnya-cukup-000000" });
    const res = await handleBcbSso(ssoRequest(forged), { DB: db, BCB_SSO_SECRET: fixture.secret } as any, NOW);
    expect(errorCode(res)).toBe("sso_invalid");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(sessions(sqlite)).toEqual([]);
    expect(sqlite.query("SELECT key FROM rate_limits").all()).toEqual([]);
  });

  test("missing secret redirects with sso_unavailable", async () => {
    const { sqlite, db } = createSqliteD1();
    const res = await handleBcbSso(ssoRequest(await tokenFor()), { DB: db } as any, NOW);
    expect(res.status).toBe(302);
    expect(errorCode(res)).toBe("sso_unavailable");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(sessions(sqlite)).toEqual([]);
  });

  test("secret shorter than 32 characters redirects with sso_unavailable", async () => {
    const { db } = createSqliteD1();
    const res = await handleBcbSso(
      ssoRequest(await tokenFor()),
      { DB: db, BCB_SSO_SECRET: "x".repeat(31) } as any,
      NOW,
    );
    expect(errorCode(res)).toBe("sso_unavailable");
  });

  test("next=%2F%09%2Fevil.com (encoded tab) keeps the Location on the request origin", async () => {
    const { db } = createSqliteD1();
    const token = await tokenFor();
    const req = new Request(`https://example.com/api/auth/bcb?t=${token}&next=%2F%09%2Fevil.com&s=${STATE}`, {
      headers: { Cookie: `bcb_sso_state=${STATE}` },
    });
    const res = await handleBcbSso(req, { DB: db, BCB_SSO_SECRET: fixture.secret } as any, NOW);
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("Location")!).origin).toBe("https://example.com");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  test("admin user with the token's email gets no session and the nonce stays used", async () => {
    const { sqlite, db } = createSqliteD1();
    sqlite
      .query("INSERT INTO users (id, google_sub, email, role) VALUES ('u_admin', 'g-admin', ?1, 'admin')")
      .run(EMAIL);

    const res = await handleBcbSso(
      ssoRequest(await tokenFor(), "/"),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );

    expect(res.status).toBe(302);
    expect(errorCode(res)).toBe("sso_invalid");
    expect(sessionCookie(res)).toBeNull();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(sessions(sqlite)).toEqual([]);
    expect(sqlite.query("SELECT key FROM rate_limits").all()).toEqual([{ key: `sso:${NONCE_A}` }]);
  });

  for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "/\t/evil.example"]) {
    test(`next=${next} redirects to /`, async () => {
      const { db } = createSqliteD1();
      const res = await handleBcbSso(
        ssoRequest(await tokenFor(), next),
        { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
        NOW,
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("Location")).toBe("https://example.com/");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    });
  }

  for (const [name, state] of [
    ["no state cookie", { cookie: null }],
    ["no s parameter", { s: null }],
    ["neither cookie nor s", { cookie: null, s: null }],
    ["cookie and s that differ", { s: OTHER_STATE }],
    ["malformed s equal to the cookie", { cookie: "pendek", s: "pendek" }],
    ["s with a character outside base64url", { cookie: STATE.slice(0, 42) + "=", s: STATE.slice(0, 42) + "=" }],
  ] as const) {
    test(`valid token with ${name} is refused before the nonce is burned`, async () => {
      const { sqlite, db } = createSqliteD1();
      const res = await handleBcbSso(
        ssoRequest(await tokenFor(), "/premium/buku/bab-1", "GET", state),
        { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
        NOW,
      );
      expect(res.status).toBe(302);
      expect(errorCode(res)).toBe("sso_invalid");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(setCookies(res)).toEqual([CLEAR_STATE]);
      expect(users(sqlite)).toEqual([]);
      expect(sessions(sqlite)).toEqual([]);
      expect(sqlite.query("SELECT key FROM rate_limits").all()).toEqual([]);
    });
  }

  test("a token refused for a missing state still works with the matching state afterwards", async () => {
    const { sqlite, db } = createSqliteD1();
    const env = { DB: db, BCB_SSO_SECRET: fixture.secret } as any;
    const token = await tokenFor();
    const refused = await handleBcbSso(ssoRequest(token, "/", "GET", { cookie: null }), env, NOW);
    expect(errorCode(refused)).toBe("sso_invalid");
    const accepted = await handleBcbSso(ssoRequest(token, "/"), env, NOW);
    expect(sessionCookie(accepted)).not.toBeNull();
    expect(sessions(sqlite)).toHaveLength(1);
  });

  test("the state cookie is cleared on token, secret and method failures", async () => {
    const { db } = createSqliteD1();
    const expired = await handleBcbSso(
      ssoRequest(await tokenFor({ exp: NOW })),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );
    const noSecret = await handleBcbSso(ssoRequest(await tokenFor()), { DB: db } as any, NOW);
    const post = await handleBcbSso(
      ssoRequest(await tokenFor(), "/", "POST"),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );
    for (const res of [expired, noSecret, post]) expect(setCookies(res)).toEqual([CLEAR_STATE]);
  });

  test("POST is refused with 405 and no-store", async () => {
    const { sqlite, db } = createSqliteD1();
    const res = await handleBcbSso(
      ssoRequest(await tokenFor(), "/", "POST"),
      { DB: db, BCB_SSO_SECRET: fixture.secret } as any,
      NOW,
    );
    expect(res.status).toBe(405);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(sessions(sqlite)).toEqual([]);
  });

  test("onRequest is wired to the handler and refuses a token signed for another clock", async () => {
    const { db } = createSqliteD1();
    // exp far in the past relative to the real clock, so onRequest (which
    // reads Date.now()) must refuse it.
    const res = await onRequest({
      request: ssoRequest(await tokenFor({ exp: 1000 })),
      env: { DB: db, BCB_SSO_SECRET: fixture.secret },
    } as any);
    expect(errorCode(res)).toBe("sso_invalid");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
