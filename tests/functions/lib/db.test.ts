import { expect, test, describe } from "bun:test";
import {
  getUserByEmail,
  getUserByGoogleSub,
  upsertGoogleUser,
  createSession,
  getSessionWithUser,
  generateUserId,
} from "../../../functions/lib/db";
import { createMockEnv } from "../../helpers/mocks";

describe("functions/lib/db.ts unit tests", () => {
  test("getUserByGoogleSub fetches user by google_sub", async () => {
    const env = createMockEnv();
    env.DB.prepare = (sql: string) => {
      if (sql.includes("WHERE google_sub =")) {
        return {
          bind: () => ({
            first: async () => ({ id: "u_google", google_sub: "g_123" }),
          }),
        } as any;
      }
      return { bind: () => ({ first: async () => null }) } as any;
    };

    const user = await getUserByGoogleSub(env.DB, "g_123");
    expect(user).not.toBeNull();
    expect(user?.id).toBe("u_google");
  });

  test("getUserByEmail fetches user by email", async () => {
    const env = createMockEnv();
    env.DB.prepare = (sql: string) => {
      if (sql.includes("WHERE email =")) {
        return {
          bind: () => ({
            first: async () => ({ id: "u_email", email: "test@example.com" }),
          }),
        } as any;
      }
      return { bind: () => ({ first: async () => null }) } as any;
    };

    const user = await getUserByEmail(env.DB, "test@example.com");
    expect(user).not.toBeNull();
    expect(user?.id).toBe("u_email");
  });

  test("upsertGoogleUser throws if getUserByGoogleSub returns null after update", async () => {
    const env = createMockEnv();
    env.DB.prepare = () => {
      return {
        bind: () => ({
          run: async () => ({ success: true }),
          first: async () => null, // row not found after upsert
        }),
      } as any;
    };

    expect(
      upsertGoogleUser(env.DB, {
        id: "u1",
        google_sub: "g1",
        email: "e@e.com",
        name: "Name",
        picture: null,
      })
    ).rejects.toThrow("upsertGoogleUser: row not found after upsert");
  });

  test("createSession throws if insert returning returns null", async () => {
    const env = createMockEnv();
    env.DB.prepare = () => {
      return {
        bind: () => ({
          first: async () => null, // row not found after insert
        }),
      } as any;
    };

    expect(
      createSession(env.DB, {
        id: "s1",
        user_id: "u1",
        expires_at: "2099-01-01T00:00:00.000Z",
      })
    ).rejects.toThrow("createSession: row not found after insert");
  });

  test("getSessionWithUser returns mapped SessionWithUser object or null", async () => {
    const env = createMockEnv();
    env.DB.prepare = (sql: string) => {
      if (sql.includes("FROM sessions s")) {
        return {
          bind: (sessionId: string) => ({
            first: async () => {
              if (sessionId !== "s1") return null;
              return {
                s_id: "s1",
                s_user_id: "u1",
                s_expires_at: "2099-01-01T00:00:00.000Z",
                s_created_at: "2024-01-01T00:00:00.000Z",
                s_last_seen_at: "2024-01-01T00:00:00.000Z",
                s_user_agent: "agent",
                s_ip: "1.1.1.1",
                u_id: "u1",
                u_google_sub: "g1",
                u_email: "u1@example.com",
                u_name: "U1",
                u_picture: null,
                u_role: "reader",
                u_donation_badge: "Gold",
                u_created_at: "2024-01-01T00:00:00.000Z",
                u_last_login_at: "2024-01-01T00:00:00.000Z",
              };
            },
          }),
        } as any;
      }
      return { bind: () => ({ first: async () => null }) } as any;
    };

    const res = await getSessionWithUser(env.DB, "s1");
    expect(res).not.toBeNull();
    expect(res?.session.id).toBe("s1");
    expect(res?.user.id).toBe("u1");

    const nullRes = await getSessionWithUser(env.DB, "nonexistent");
    expect(nullRes).toBeNull();
  });

  test("generateUserId generates a 32-char hex string", () => {
    const uid = generateUserId();
    expect(uid).toMatch(/^[a-f0-9]{32}$/);
  });
});
