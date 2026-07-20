import { expect, test, describe, beforeEach, mock } from "bun:test";

import { onRequestPatch } from "../../../functions/api/users/[id]/donation-badge";
import { setDonationBadge } from "../../../functions/lib/db";
import { createMockEnv, setQueryHandler } from "../../helpers/mocks";

// Auth is mocked here to control session per-test. mock.module is global
// across the bun test runner, so this declaration overrides any earlier
// override from sibling test files (slug.test.ts, books.test.ts).
let mockSession: { sub: string; role: "reader" | "admin" } | null = null;

mock.module("../../../functions/lib/auth", () => ({
  verifySession: async () => mockSession,
}));

const TARGET_USER_ID = "u_alice";

function makeEnvWithTarget() {
  const env = createMockEnv();
  // Only the getUserById SELECT matters here — verifySession is mocked.
  setQueryHandler(env, "SELECT", (sql, params) => {
    if (sql.includes("FROM users WHERE id") && params[0] === TARGET_USER_ID) {
      return [{
        id: TARGET_USER_ID,
        google_sub: "g_alice",
        email: "alice@example.com",
        name: "Alice",
        picture: null,
        role: "reader",
        donation_badge: null,
        created_at: "2024-01-01T00:00:00.000Z",
        last_login_at: "2024-01-01T00:00:00.000Z",
      }];
    }
    return [];
  });
  return env;
}

function makeEnvNoTarget() {
  const env = createMockEnv();
  setQueryHandler(env, "SELECT", () => []);
  return env;
}

function makeRequest(body: unknown, userId = TARGET_USER_ID): Request {
  return new Request(`https://example.com/api/users/${userId}/donation-badge`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockSession = null;
});

describe("PATCH /api/users/:id/donation-badge", () => {
  test("admin can set Gold", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: "Gold" }),
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, tier: "Gold" });
  });

  test("admin can set Silver and Bronze", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    for (const tier of ["Silver", "Bronze"]) {
      const env = makeEnvWithTarget();
      const res = await onRequestPatch({
        request: makeRequest({ tier }),
        env,
        params: { id: TARGET_USER_ID },
      } as any);
      expect(res.status).toBe(200);
      expect((await res.json()).tier).toBe(tier);
    }
  });

  test("admin can clear badge with null", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: null }),
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(200);
    expect((await res.json()).tier).toBe(null);
  });

  test("rejects invalid tier with 400", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: "Platinum" }),
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(400);
  });

  test("rejects non-string tier with 400", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: 42 }),
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(400);
  });

  test("rejects malformed JSON with 400", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvWithTarget();
    const req = new Request(`https://example.com/api/users/${TARGET_USER_ID}/donation-badge`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await onRequestPatch({
      request: req,
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(400);
  });

  test("returns 401 when no session", async () => {
    mockSession = null;
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: "Gold" }),
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(401);
  });

  test("returns 403 when session is a reader (not admin)", async () => {
    mockSession = { sub: "u_reader", role: "reader" };
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: "Gold" }),
      env,
      params: { id: TARGET_USER_ID },
    } as any);
    expect(res.status).toBe(403);
  });

  test("returns 404 when target user does not exist", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvNoTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: "Gold" }, "u_does_not_exist"),
      env,
      params: { id: "u_does_not_exist" },
    } as any);
    expect(res.status).toBe(404);
  });

  test("returns 400 when user id is missing", async () => {
    mockSession = { sub: "u_admin", role: "admin" };
    const env = makeEnvWithTarget();
    const res = await onRequestPatch({
      request: makeRequest({ tier: "Gold" }),
      env,
      params: {},
    } as any);
    expect(res.status).toBe(400);
  });
});

describe("setDonationBadge helper", () => {
  test("validates tier whitelist", async () => {
    const env = makeEnvWithTarget();
    await expect(
      setDonationBadge(env.DB, { userId: TARGET_USER_ID, tier: "Platinum" })
    ).rejects.toThrow(/invalid tier/);
  });

  test("allows null to clear badge", async () => {
    const env = makeEnvWithTarget();
    const ok = await setDonationBadge(env.DB, { userId: TARGET_USER_ID, tier: null });
    expect(ok).toBe(true);
  });

  test("updates tier for known user", async () => {
    const env = makeEnvWithTarget();
    const ok = await setDonationBadge(env.DB, { userId: TARGET_USER_ID, tier: "Gold" });
    expect(ok).toBe(true);
  });
});
