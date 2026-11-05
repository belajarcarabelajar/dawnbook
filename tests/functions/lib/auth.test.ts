import { expect, test, describe } from "bun:test";
import { extractSessionId, verifySession } from "../../../functions/lib/auth";
import { createMockEnv } from "../../helpers/mocks";

describe("functions/lib/auth.ts", () => {
  const SESSION_HEX = "a".repeat(64);

  test("extractSessionId handles Authorization: Session header", () => {
    const req = new Request("https://example.com", {
      headers: { Authorization: `Session ${SESSION_HEX}` },
    });
    expect(extractSessionId(req)).toBe(SESSION_HEX);

    const reqInvalid = new Request("https://example.com", {
      headers: { Authorization: "Session invalid_hex" },
    });
    expect(extractSessionId(reqInvalid)).toBeNull();
  });

  test("verifySession handles last_seen_at UPDATE failure silently", async () => {
    const env = createMockEnv();

    env.DB.prepare = ((sql: string) => {
      if (sql.includes("UPDATE sessions")) {
        return {
          bind: () => ({
            run: async () => {
              throw new Error("Update failed");
            },
          }),
        } as any;
      }
      return {
        bind: () => ({
          first: async () => ({
            s_id: SESSION_HEX,
            s_user_id: "u1",
            s_expires_at: "2099-01-01T00:00:00.000Z",
            u_id: "u1",
            u_email: "u1@example.com",
            u_name: "U1",
            u_picture: null,
            u_role: "admin",
          }),
        }),
      } as any;
    }) as any;

    const req = new Request("https://example.com", {
      headers: { Cookie: `session_id=${SESSION_HEX}` },
    });
    const session = await verifySession(req, env as any);
    expect(session).not.toBeNull();
    expect(session?.role).toBe("admin");
  });

  function envWithLastSeen(lastSeen: string | null) {
    const env = createMockEnv();
    const updates: unknown[][] = [];
    env.DB.prepare = ((sql: string) => {
      if (sql.includes("UPDATE sessions")) {
        return {
          bind: (...params: unknown[]) => ({
            run: async () => {
              updates.push(params);
              return { success: true };
            },
          }),
        } as any;
      }
      return {
        bind: () => ({
          first: async () => ({
            s_id: SESSION_HEX,
            s_user_id: "u1",
            s_expires_at: "2099-01-01T00:00:00.000Z",
            s_last_seen_at: lastSeen,
            u_id: "u1",
            u_email: "u1@example.com",
            u_name: "U1",
            u_picture: null,
            u_role: "reader",
          }),
        }),
      } as any;
    }) as any;
    return { env, updates };
  }

  const sessionRequest = () =>
    new Request("https://example.com", { headers: { Cookie: `session_id=${SESSION_HEX}` } });

  test("verifySession skips the last_seen_at UPDATE when it is under 5 minutes old", async () => {
    const { env, updates } = envWithLastSeen(new Date(Date.now() - 60_000).toISOString());
    const session = await verifySession(sessionRequest(), env as any);
    expect(session?.sub).toBe("u1");
    expect(updates).toEqual([]);
  });

  test("verifySession writes last_seen_at when it is 6 minutes old", async () => {
    const { env, updates } = envWithLastSeen(new Date(Date.now() - 6 * 60_000).toISOString());
    const session = await verifySession(sessionRequest(), env as any);
    expect(session?.sub).toBe("u1");
    expect(updates).toHaveLength(1);
    expect(updates[0][1]).toBe(SESSION_HEX);
  });

  test("verifySession writes last_seen_at when it is null", async () => {
    const { env, updates } = envWithLastSeen(null);
    await verifySession(sessionRequest(), env as any);
    expect(updates).toHaveLength(1);
  });
});
