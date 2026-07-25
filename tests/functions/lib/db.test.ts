import { expect, test, describe, it } from "bun:test";
import {
  getUserByGoogleSub,
  getUserByEmail,
  getUserById,
  generateUserId,
  getSessionWithUser,
  type UserRow,
} from "../../../functions/lib/db";
import { createMockEnv, setQueryHandler } from "../../helpers/mocks";

const mockUser: UserRow = {
  id: "user_123",
  google_sub: "google_123",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/pic.png",
  role: "reader",
  donation_badge: null,
  created_at: "2024-01-01T00:00:00.000Z",
  last_login_at: "2024-01-01T00:00:00.000Z",
};

describe("User fetch methods in db.ts", () => {
  describe("getUserByGoogleSub", () => {
    test("returns user when found", async () => {
      const env = createMockEnv();
      setQueryHandler(env, "SELECT", (sql, params) => {
        expect(sql).toContain("WHERE google_sub = ?1");
        expect(params).toEqual(["google_123"]);
        return [mockUser];
      });

      const user = await getUserByGoogleSub(env.DB, "google_123");
      expect(user).toEqual(mockUser);
    });

    test("returns null when not found", async () => {
      const env = createMockEnv();
      setQueryHandler(env, "SELECT", () => []);

      const user = await getUserByGoogleSub(env.DB, "google_123");
      expect(user).toBeNull();
    });
  });

  describe("getUserByEmail", () => {
    test("returns user when found", async () => {
      const env = createMockEnv();
      setQueryHandler(env, "SELECT", (sql, params) => {
        expect(sql).toContain("WHERE email = ?1");
        expect(params).toEqual(["test@example.com"]);
        return [mockUser];
      });

      const user = await getUserByEmail(env.DB, "test@example.com");
      expect(user).toEqual(mockUser);
    });

    test("returns null when not found", async () => {
      const env = createMockEnv();
      setQueryHandler(env, "SELECT", () => []);

      const user = await getUserByEmail(env.DB, "test@example.com");
      expect(user).toBeNull();
    });
  });

  describe("getUserById", () => {
    test("returns user when found", async () => {
      const env = createMockEnv();
      setQueryHandler(env, "SELECT", (sql, params) => {
        expect(sql).toContain("WHERE id = ?1");
        expect(params).toEqual(["user_123"]);
        return [mockUser];
      });

      const user = await getUserById(env.DB, "user_123");
      expect(user).toEqual(mockUser);
    });

    test("returns null when not found", async () => {
      const env = createMockEnv();
      setQueryHandler(env, "SELECT", () => []);

      const user = await getUserById(env.DB, "user_123");
      expect(user).toBeNull();
    });
  });
});

describe("generateUserId", () => {
  it("should generate a 32-character hex string", () => {
    const id = generateUserId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(32);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("should generate unique ids", () => {
    const id1 = generateUserId();
    const id2 = generateUserId();
    expect(id1).not.toEqual(id2);
  });
});

describe("getSessionWithUser", () => {
  test("returns null if session is not found", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const result = await getSessionWithUser(env.DB, "missing-session-id");
    expect(result).toBeNull();
  });

  test("returns correctly mapped SessionWithUser object", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => [{
      s_id: "test-session-id",
      s_user_id: "test-user-id",
      s_expires_at: "2024-01-01T00:00:00.000Z",
      s_created_at: "2023-01-01T00:00:00.000Z",
      s_last_seen_at: "2023-01-02T00:00:00.000Z",
      s_user_agent: "Mozilla/5.0",
      s_ip: "127.0.0.1",
      u_id: "test-user-id",
      u_google_sub: "test-google-sub",
      u_email: "test@example.com",
      u_name: "Test User",
      u_picture: "https://example.com/pic.png",
      u_role: "reader",
      u_donation_badge: "Gold",
      u_created_at: "2023-01-01T00:00:00.000Z",
      u_last_login_at: "2023-01-02T00:00:00.000Z",
    }]);

    const result = await getSessionWithUser(env.DB, "test-session-id");

    expect(result).not.toBeNull();
    expect(result!.session).toEqual({
      id: "test-session-id",
      user_id: "test-user-id",
      expires_at: "2024-01-01T00:00:00.000Z",
      created_at: "2023-01-01T00:00:00.000Z",
      last_seen_at: "2023-01-02T00:00:00.000Z",
      user_agent: "Mozilla/5.0",
      ip: "127.0.0.1",
    });

    expect(result!.user).toEqual({
      id: "test-user-id",
      google_sub: "test-google-sub",
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/pic.png",
      role: "reader",
      donation_badge: "Gold",
      created_at: "2023-01-01T00:00:00.000Z",
      last_login_at: "2023-01-02T00:00:00.000Z",
    });
  });

  test("handles null optional fields properly", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => [{
      s_id: "test-session-id",
      s_user_id: "test-user-id",
      s_expires_at: "2024-01-01T00:00:00.000Z",
      s_created_at: "2023-01-01T00:00:00.000Z",
      s_last_seen_at: "2023-01-02T00:00:00.000Z",
      s_user_agent: null,
      s_ip: null,
      u_id: "test-user-id",
      u_google_sub: "test-google-sub",
      u_email: "test@example.com",
      u_name: null,
      u_picture: null,
      u_role: "reader",
      u_donation_badge: null,
      u_created_at: "2023-01-01T00:00:00.000Z",
      u_last_login_at: "2023-01-02T00:00:00.000Z",
    }]);

    const result = await getSessionWithUser(env.DB, "test-session-id");

    expect(result).not.toBeNull();
    expect(result!.session.user_agent).toBeNull();
    expect(result!.session.ip).toBeNull();
    expect(result!.user.name).toBeNull();
    expect(result!.user.picture).toBeNull();
    expect(result!.user.donation_badge).toBeNull();
  });
});
