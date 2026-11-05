import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { onRequestGet as callbackHandler } from "../../../../functions/api/auth/callback";

// A D1 stand-in backed by a real in-memory SQLite with the production
// migrations, so the SQL the callback sends is actually evaluated (UNIQUE
// constraints included) instead of being answered by canned rows.
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

const STATE_HEX = "d".repeat(32);
const BASE_URL = "https://example.com/api/auth/callback";

type GoogleProfile = { sub: string; email: string; email_verified?: unknown; name?: string; picture?: string };

function installGoogleFetch(profile: GoogleProfile): () => void {
  const original = global.fetch;
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("oauth2.googleapis.com/token")) {
      return Response.json({ access_token: "tok", expires_in: 3600, token_type: "Bearer" });
    }
    if (url.includes("openidconnect.googleapis.com/v1/userinfo")) {
      return Response.json({ email_verified: true, ...profile });
    }
    return new Response("Not Found", { status: 404 });
  }) as unknown as typeof fetch;
  return () => {
    global.fetch = original;
  };
}

async function callGoogleCallback(env: unknown): Promise<Response> {
  const req = new Request(`${BASE_URL}?code=valid_code&state=${STATE_HEX}`, {
    headers: { Cookie: `oauth_state=${STATE_HEX}`, "CF-Connecting-IP": "203.0.113.9" },
  });
  return await callbackHandler({ request: req, env } as any);
}

function insertUser(sqlite: Database, row: { id: string; google_sub: string; email: string; name?: string | null }) {
  sqlite
    .query(
      "INSERT INTO users (id, google_sub, email, name, picture, role, last_login_at) VALUES (?1, ?2, ?3, ?4, NULL, 'reader', '2026-01-01T00:00:00.000Z')",
    )
    .run(row.id, row.google_sub, row.email, row.name ?? null);
}

function users(sqlite: Database) {
  return sqlite.query("SELECT id, google_sub, email, name, picture, last_login_at FROM users ORDER BY id").all() as any[];
}

function sessions(sqlite: Database) {
  return sqlite.query("SELECT id, user_id FROM sessions").all() as any[];
}

function sessionCookie(res: Response): string | null {
  const match = (res.headers.get("Set-Cookie") ?? "").match(/session_id=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

describe("/api/auth/callback account linking", () => {
  let restoreFetch: () => void = () => {};
  let consoleSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    consoleSpy = spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    restoreFetch();
    consoleSpy.mockRestore();
  });

  test("new Google user is created and gets a session", async () => {
    const { sqlite, db } = createSqliteD1();
    restoreFetch = installGoogleFetch({ sub: "g-new", email: "baru@contoh.id", name: "Baru" });

    const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://example.com/");
    const rows = users(sqlite);
    expect(rows).toHaveLength(1);
    expect(rows[0].google_sub).toBe("g-new");
    expect(rows[0].email).toBe("baru@contoh.id");
    const sid = sessionCookie(res);
    expect(sid).not.toBeNull();
    expect(sessions(sqlite)).toEqual([{ id: sid, user_id: rows[0].id }]);
  });

  test("existing Google user keeps the same row and gets a session", async () => {
    const { sqlite, db } = createSqliteD1();
    insertUser(sqlite, { id: "u_lama", google_sub: "g-lama", email: "lama@contoh.id", name: "Nama Lama" });
    restoreFetch = installGoogleFetch({ sub: "g-lama", email: "lama@contoh.id", name: "Nama Baru" });

    const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://example.com/");
    const rows = users(sqlite);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("u_lama");
    expect(rows[0].google_sub).toBe("g-lama");
    expect(rows[0].name).toBe("Nama Baru");
    expect(sessions(sqlite)).toEqual([{ id: sessionCookie(res), user_id: "u_lama" }]);
  });

  test("store user (bcb: sub) is linked to the Google sub on a case-different email", async () => {
    const { sqlite, db } = createSqliteD1();
    insertUser(sqlite, { id: "u_toko", google_sub: "bcb:pembeli@contoh.id", email: "pembeli@contoh.id" });
    restoreFetch = installGoogleFetch({
      sub: "g-pembeli",
      email: "Pembeli@Contoh.id",
      name: "Pembeli",
      picture: "https://example.com/p.png",
    });

    const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://example.com/");
    const rows = users(sqlite);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("u_toko");
    expect(rows[0].google_sub).toBe("g-pembeli");
    expect(rows[0].name).toBe("Pembeli");
    expect(rows[0].picture).toBe("https://example.com/p.png");
    expect(rows[0].last_login_at).not.toBe("2026-01-01T00:00:00.000Z");
    expect(sessions(sqlite)).toEqual([{ id: sessionCookie(res), user_id: "u_toko" }]);
  });

  for (const [label, emailVerified] of [
    ["false", false],
    ["missing", undefined],
    ["the string \"true\"", "true"],
  ] as const) {
    test(`email_verified ${label}: store user is not linked, account_conflict, no session`, async () => {
      const { sqlite, db } = createSqliteD1();
      insertUser(sqlite, { id: "u_toko", google_sub: "bcb:pembeli@contoh.id", email: "pembeli@contoh.id" });
      const before = users(sqlite);
      restoreFetch = installGoogleFetch({ sub: "g-penyerang", email: "pembeli@contoh.id", email_verified: emailVerified });

      const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

      expect(res.status).toBe(302);
      const loc = new URL(res.headers.get("Location")!);
      expect(loc.pathname).toBe("/sign-in");
      expect(loc.searchParams.get("error")).toBe("account_conflict");
      expect(sessionCookie(res)).toBeNull();
      expect(sessions(sqlite)).toEqual([]);
      expect(users(sqlite)).toEqual(before);
    });
  }

  for (const [label, emailVerified] of [
    ["false", false],
    ["missing", undefined],
    ["the string \"true\"", "true"],
  ] as const) {
    test(`email_verified ${label}: a new account is refused with email_unverified, no user, no session`, async () => {
      const { sqlite, db } = createSqliteD1();
      restoreFetch = installGoogleFetch({ sub: "g-baru", email: "baru@contoh.id", email_verified: emailVerified });

      const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

      expect(res.status).toBe(302);
      const loc = new URL(res.headers.get("Location")!);
      expect(loc.pathname).toBe("/sign-in");
      expect(loc.searchParams.get("error")).toBe("email_unverified");
      expect(sessionCookie(res)).toBeNull();
      expect(users(sqlite)).toEqual([]);
      expect(sessions(sqlite)).toEqual([]);
    });
  }

  test("existing Google user with email_verified false still signs in", async () => {
    const { sqlite, db } = createSqliteD1();
    insertUser(sqlite, { id: "u_lama", google_sub: "g-lama", email: "lama@contoh.id" });
    restoreFetch = installGoogleFetch({ sub: "g-lama", email: "lama@contoh.id", email_verified: false });

    const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://example.com/");
    expect(sessions(sqlite)).toEqual([{ id: sessionCookie(res), user_id: "u_lama" }]);
  });

  test("malformed oauth_redirect cookie falls back to / with one session", async () => {
    const { sqlite, db } = createSqliteD1();
    restoreFetch = installGoogleFetch({ sub: "g-new", email: "baru@contoh.id" });
    const req = new Request(`${BASE_URL}?code=valid_code&state=${STATE_HEX}`, {
      headers: { Cookie: `oauth_state=${STATE_HEX}; oauth_redirect=%E0%A4%A`, "CF-Connecting-IP": "203.0.113.9" },
    });

    const res = await callbackHandler({
      request: req,
      env: { DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" },
    } as any);

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("https://example.com/");
    const sid = sessionCookie(res);
    expect(sid).not.toBeNull();
    expect(sessions(sqlite)).toEqual([{ id: sid, user_id: users(sqlite)[0].id }]);
  });

  test("email held by another Google sub is refused with account_conflict and no session", async () => {
    const { sqlite, db } = createSqliteD1();
    insertUser(sqlite, { id: "u_pemilik", google_sub: "g-pemilik", email: "bersama@contoh.id" });
    restoreFetch = installGoogleFetch({ sub: "g-lain", email: "bersama@contoh.id" });

    const res = await callGoogleCallback({ DB: db, GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret" });

    expect(res.status).toBe(302);
    const loc = new URL(res.headers.get("Location")!);
    expect(loc.pathname).toBe("/sign-in");
    expect(loc.searchParams.get("error")).toBe("account_conflict");
    expect(sessionCookie(res)).toBeNull();
    expect(sessions(sqlite)).toEqual([]);
    expect(users(sqlite)).toEqual([
      expect.objectContaining({ id: "u_pemilik", google_sub: "g-pemilik", email: "bersama@contoh.id" }),
    ]);
  });
});
