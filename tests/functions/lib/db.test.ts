import { expect, test, describe, beforeEach } from "bun:test";
import {
  getUserByGoogleSub,
  upsertGoogleUser,
  setDonationBadge,
  type UserRow,
} from "../../../functions/lib/db";
import {
  createMockEnv,
  setQueryHandler,
  setRunHandler,
} from "../../helpers/mocks";

beforeEach(() => {
  // createMockEnv() resets the handler bucket for the fresh env it returns
});

const makeUserRow = (overrides: Partial<UserRow> = {}): UserRow => ({
  id: "u_1",
  google_sub: "google_sub_123",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/pic.png",
  role: "reader",
  donation_badge: null,
  created_at: "2024-01-01T00:00:00.000Z",
  last_login_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

describe("getUserByGoogleSub", () => {
  test("returns null when user not found", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const result = await getUserByGoogleSub(env.DB, "nonexistent");
    expect(result).toBeNull();
  });

  test("returns user row when user found", async () => {
    const env = createMockEnv();
    const mockUser = makeUserRow();
    setQueryHandler(env, "SELECT", (sql, params) => {
      if (params[0] === "google_sub_123") return [mockUser];
      return [];
    });

    const result = await getUserByGoogleSub(env.DB, "google_sub_123");
    expect(result).toEqual(mockUser);
  });
});

describe("upsertGoogleUser", () => {
  test("throws if user not found after upsert", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []); // returning no rows for getUserByGoogleSub

    expect(
      upsertGoogleUser(env.DB, {
        id: "u_1",
        google_sub: "google_sub_123",
        email: "test@example.com",
        name: "Test User",
        picture: "https://example.com/pic.png",
      })
    ).rejects.toThrow("upsertGoogleUser: row not found after upsert");
  });

  test("inserts new user and returns the row", async () => {
    const env = createMockEnv();
    const mockUser = makeUserRow();

    let insertCalled = false;
    let updateCalled = false;

    setRunHandler(env, "", (sql) => {
      const upperSql = sql.trimStart().toUpperCase();
      if (upperSql.startsWith("INSERT")) insertCalled = true;
      if (upperSql.startsWith("UPDATE")) updateCalled = true;
      return { success: true };
    });

    setQueryHandler(env, "SELECT", (sql, params) => {
      if (params[0] === "google_sub_123") {
        return [mockUser];
      }
      return [];
    });

    const result = await upsertGoogleUser(env.DB, {
      id: "u_1",
      google_sub: "google_sub_123",
      email: "test@example.com",
      name: "Test User",
      picture: "https://example.com/pic.png",
    });

    expect(insertCalled).toBe(true);
    expect(updateCalled).toBe(true);
    expect(result).toEqual(mockUser);
  });
});

describe("setDonationBadge", () => {
  test("rejects invalid tiers", async () => {
    const env = createMockEnv();

    expect(
      setDonationBadge(env.DB, { userId: "u_1", tier: "Diamond" })
    ).rejects.toThrow('setDonationBadge: invalid tier "Diamond"');
  });

  test("returns false if user not found", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []); // returning no rows for getUserById

    const result = await setDonationBadge(env.DB, { userId: "u_1", tier: "Gold" });
    expect(result).toBe(false);
  });

  test("returns true and updates user on success", async () => {
    const env = createMockEnv();
    const mockUser = makeUserRow();

    let updateCalled = false;
    let bindTier = "";
    setRunHandler(env, "UPDATE", (sql, params) => {
      updateCalled = true;
      bindTier = params[0];
      return { success: true };
    });

    setQueryHandler(env, "SELECT", (sql, params) => {
      if (params[0] === "u_1") return [mockUser];
      return [];
    });

    const result = await setDonationBadge(env.DB, { userId: "u_1", tier: "Silver" });

    expect(updateCalled).toBe(true);
    expect(bindTier).toBe("Silver");
    expect(result).toBe(true);
  });

  test("allows clearing the badge with null", async () => {
    const env = createMockEnv();
    const mockUser = makeUserRow();

    let updateCalled = false;
    let bindTier: any = "dummy";
    setRunHandler(env, "UPDATE", (sql, params) => {
      updateCalled = true;
      bindTier = params[0];
      return { success: true };
    });

    setQueryHandler(env, "SELECT", (sql, params) => {
      if (params[0] === "u_1") return [mockUser];
      return [];
    });

    const result = await setDonationBadge(env.DB, { userId: "u_1", tier: null });

    expect(updateCalled).toBe(true);
    expect(bindTier).toBe(null);
    expect(result).toBe(true);
  });
});
