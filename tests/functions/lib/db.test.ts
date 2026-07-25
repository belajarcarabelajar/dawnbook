import { expect, test, describe, it } from "bun:test";
import {
  getUserByGoogleSub,
  getUserByEmail,
  getUserById,
  generateUserId,
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
