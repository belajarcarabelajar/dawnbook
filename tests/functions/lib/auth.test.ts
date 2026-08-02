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

    // We must mock both SELECT and UPDATE correctly
    env.DB.prepare = (sql: string) => {
      if (sql.includes("UPDATE sessions")) {
        return {
          bind: () => ({
            run: async () => {
              throw new Error("Update failed");
            },
          }),
        } as any;
      }
      if (sql.includes("SELECT") && sql.includes("FROM sessions s")) {
        return {
          bind: () => ({
            first: async () => {
              return {
                s_id: SESSION_HEX,
                s_user_id: "u1",
                s_expires_at: "2099-01-01T00:00:00.000Z",
                u_id: "u1",
                u_email: "u1@example.com",
                u_name: "U1",
                u_picture: null,
                u_role: "admin",
              };
            },
          }),
        } as any;
      }
      return {
        bind: () => ({
          first: async () => null,
          run: async () => ({ success: true }),
        }),
      } as any;
    };

    const req = new Request("https://example.com", {
      headers: { Cookie: `session_id=${SESSION_HEX}` },
    });
    const session = await verifySession(req, env as any);
    expect(session).not.toBeNull();
    expect(session?.role).toBe("admin");
  });
});
