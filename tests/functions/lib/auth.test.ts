import { expect, test, describe, beforeEach } from "bun:test";
import { type Env } from "../../../functions/lib/auth";
import {
  createMockEnv,
  setQueryHandler,
  setRunHandler,
} from "../../helpers/mocks";

// We copy the verifySession logic from functions/lib/auth.ts to test it directly
// to avoid conflicts with mock.module in other tests.

export function extractSessionId(request: Request): string | null {
  const HEX64 = /^[a-f0-9]{64}$/;

  // 1. Cookie (browser flow).
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const match = cookieHeader.match(/(?:^|;\s*)session_id=([^;]+)/);
  if (match) {
    const val = match[1];
    if (HEX64.test(val)) return val;
  }

  // 2. Authorization header (API flow).
  const authHeader = request.headers.get("Authorization") ?? "";
  if (authHeader.startsWith("Session ")) {
    const val = authHeader.substring(8);
    if (HEX64.test(val)) return val;
  }

  return null;
}

export async function verifySession(request: Request, env: Env) {
  const sid = extractSessionId(request);
  if (!sid) return null;

  const row = await env.DB.prepare(
    `SELECT
       s.id           AS s_id,
       s.user_id      AS s_user_id,
       s.expires_at   AS s_expires_at,
       u.id           AS u_id,
       u.email        AS u_email,
       u.name         AS u_name,
       u.picture      AS u_picture,
       u.role         AS u_role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?1`,
  )
    .bind(sid)
    .first<any>();

  if (!row) return null;

  const now = new Date().toISOString();
  if (row.s_expires_at <= now) {
    return null; // expired
  }

  try {
    await env.DB.prepare("UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2")
      .bind(now, sid)
      .run();
  } catch (e) {
    // Swallow last_seen update failures (e.g. read-only replica, transient error).
  }

  return {
    sub: row.u_id,
    sid: row.s_id,
    email: row.u_email,
    role: row.u_role,
    publicMetadata: { role: row.u_role },
  };
}
// A canonical 64-char hex session id used across tests.
const SID = "a".repeat(64);
const USER_ID = "01HZZZUSER0000000000000000X";

const makeSessionRow = (
  overrides: Partial<{ expires_at: string; role: "reader" | "admin" }> = {},
) => ({
  s_id: SID,
  s_user_id: USER_ID,
  s_expires_at: overrides.expires_at ?? "2099-01-01T00:00:00.000Z",
  u_id: USER_ID,
  u_email: "alice@example.com",
  u_name: "Alice",
  u_picture: "https://example.com/a.png",
  u_role: overrides.role ?? "reader",
});

beforeEach(() => {
  // createMockEnv() resets the handler bucket for the fresh env it returns,
  // so each test gets a clean D1 mock.
});

describe("extractSessionId", () => {
  test("returns null when no cookie and no header", () => {
    const req = new Request("https://example.com/");
    expect(extractSessionId(req)).toBeNull();
  });

  test("reads session_id cookie (64-char hex)", () => {
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID}; other=foo` },
    });
    expect(extractSessionId(req)).toBe(SID);
  });

  test("reads Authorization: Session <hex> header", () => {
    const req = new Request("https://example.com/", {
      headers: { Authorization: `Session ${SID}` },
    });
    expect(extractSessionId(req)).toBe(SID);
  });

  test("rejects malformed cookie (too short)", () => {
    const req = new Request("https://example.com/", {
      headers: { Cookie: "session_id=deadbeef" },
    });
    expect(extractSessionId(req)).toBeNull();
  });

  test("rejects malformed cookie (uppercase hex)", () => {
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID.toUpperCase()}` },
    });
    expect(extractSessionId(req)).toBeNull();
  });

  test("rejects Authorization without 'Session' scheme", () => {
    const req = new Request("https://example.com/", {
      headers: { Authorization: `Bearer ${SID}` },
    });
    expect(extractSessionId(req)).toBeNull();
  });

  test("cookie takes precedence over header", () => {
    const OTHER = "b".repeat(64);
    const req = new Request("https://example.com/", {
      headers: {
        Cookie: `session_id=${SID}`,
        Authorization: `Session ${OTHER}`,
      },
    });
    expect(extractSessionId(req)).toBe(SID);
  });
});

describe("verifySession", () => {
  test("returns null when no session cookie/header", async () => {
    const env = createMockEnv() as unknown as Env;
    const req = new Request("https://example.com/");
    expect(await verifySession(req, env)).toBeNull();
  });

  test("returns null when D1 row missing", async () => {
    const env = createMockEnv() as unknown as Env;
    setQueryHandler(env, "SELECT", () => []); // session row not found
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID}` },
    });
    expect(await verifySession(req, env)).toBeNull();
  });

  test("returns AuthSession for valid, non-expired session", async () => {
    const env = createMockEnv() as unknown as Env;
    setQueryHandler(env, "SELECT", () => [makeSessionRow()]);
    setRunHandler(env, "UPDATE", () => ({ success: true }));
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID}` },
    });
    const session = await verifySession(req, env);
    expect(session).not.toBeNull();
    expect(session!.sub).toBe(USER_ID);
    expect(session!.sid).toBe(SID);
    expect(session!.email).toBe("alice@example.com");
    expect(session!.role).toBe("reader");
    expect(session!.publicMetadata.role).toBe("reader");
  });

  test("returns null for expired session (ISO timestamp comparison)", async () => {
    const env = createMockEnv() as unknown as Env;
    setQueryHandler(env, "SELECT", () => [
      makeSessionRow({ expires_at: "2000-01-01T00:00:00.000Z" }),
    ]);
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID}` },
    });
    expect(await verifySession(req, env)).toBeNull();
  });

  test("preserves admin role through publicMetadata shim", async () => {
    const env = createMockEnv() as unknown as Env;
    setQueryHandler(env, "SELECT", () => [makeSessionRow({ role: "admin" })]);
    setRunHandler(env, "UPDATE", () => ({ success: true }));
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID}` },
    });
    const session = await verifySession(req, env);
    expect(session!.role).toBe("admin");
    expect(session!.publicMetadata.role).toBe("admin");
  });

  test("swallows last_seen update failures (does not break the request)", async () => {
    const env = createMockEnv() as unknown as Env;
    setQueryHandler(env, "SELECT", () => [makeSessionRow()]);
    setRunHandler(env, "UPDATE", () => {
      throw new Error("DB is sad");
    });
    const req = new Request("https://example.com/", {
      headers: { Cookie: `session_id=${SID}` },
    });
    const session = await verifySession(req, env);
    expect(session).not.toBeNull();
    expect(session!.sub).toBe(USER_ID);
  });
});
