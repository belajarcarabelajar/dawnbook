import { expect, test, describe, beforeEach, mock } from "bun:test";
import {
  createMockEnv,
  setQueryHandler,
  setRunHandler,
} from "../../helpers/mocks";

// We need to bypass the mock for testing the *actual* verifySession implementation
// in the file that defines it, while other API tests override it using mock.module
// Bun 1.1+ caches modules, so mock.module can poison this test if it runs after others.
// We can use a query string to import a fresh unmocked version of the file.
import * as realAuth from "../../../functions/lib/auth.ts?unmocked";
const { extractSessionId, verifySession } = realAuth;
type Env = realAuth.Env;

// A canonical 64-char hex session id used across tests.
const SID = "a".repeat(64);
const USER_ID = "01HZZZUSER0000000000000000X";

const makeSessionRow = (overrides: Partial<{ expires_at: string; role: "reader" | "admin" }> = {}) => ({
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
