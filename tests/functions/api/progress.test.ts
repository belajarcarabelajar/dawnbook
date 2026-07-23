import { expect, test, describe, beforeEach, mock } from "bun:test";

// Force `verifySession` to be a no-op that we control per-test. mock.module
// is global across the bun test runner, so this declaration overrides any
// earlier override from sibling test files (slug.test.ts, books.test.ts).
let mockSession: any = null;
mock.module("../../../functions/lib/auth", () => {
  return {
    verifySession: async () => mockSession,
  };
});

import { onRequest } from "../../../functions/api/progress";
import { createMockEnv, mockRequest, setQueryHandler, setRunHandler } from "../../helpers/mocks";

beforeEach(() => {
  mockSession = null;
});

const SID = "a".repeat(64);

const makeUserRow = (overrides: Partial<{ expires_at: string }> = {}) => ({
  s_id: SID,
  s_user_id: "u_123",
  s_expires_at: overrides.expires_at ?? "2099-01-01T00:00:00.000Z",
  s_created_at: "2024-01-01T00:00:00.000Z",
  s_last_seen_at: "2024-01-01T00:00:00.000Z",
  s_user_agent: null,
  s_ip: null,
  u_id: "u_123",
  u_email: "alice@example.com",
  u_name: "Alice",
  u_picture: null,
  u_role: "reader",
  u_donation_badge: null,
  u_created_at: "2024-01-01T00:00:00.000Z",
  u_last_login_at: "2024-01-01T00:00:00.000Z",
});

describe("API: /api/progress", () => {
  test("GET returns 401 without session cookie", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);
    const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", { method: "GET" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(401);
  });

  test("POST returns 201 with valid session and appends to completed_paths", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => [makeUserRow()]); // session lookup
    setRunHandler(env, "UPDATE", () => ({ success: true }));
    setRunHandler(env, "INSERT", () => ({ success: true }));
    const req = mockRequest("https://example.com/api/progress", {
      method: "POST",
      headers: { Cookie: `session_id=${SID}` },
      body: JSON.stringify({
        bookSlug: "test-book",
        path: "/books/test-book/ch1.html",
        completed_path: "/books/test-book/ch1.html",
      }),
    });

    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.completed_paths).toEqual(["/books/test-book/ch1.html"]);
  });

  test("GET returns existing completed_paths", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    // Override DB to return the existing progress row when auth passes.
    env.DB = {
      prepare: mock((sql: string) => {
        const s = sql.toUpperCase();
        const api: any = {
          bind: () => api,
          all: async () => ({ results: [] }),
          first: async () => {
            if (s.includes("FROM SESSIONS")) return makeUserRow();
            return { last_read_path: "/books/test-book/ch1.html", completed_paths: '["/books/test-book/ch1.html"]' };
          },
          run: async () => ({ success: true }),
        };
        return api;
      }),
      batch: async () => [{ success: true }],
    } as any;

    const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", {
      method: "GET",
      headers: { Cookie: `session_id=${SID}` },
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.path).toBe("/books/test-book/ch1.html");
    expect(data.completed_paths).toEqual(["/books/test-book/ch1.html"]);
  });

  test("GET with no bookSlug handles invalid JSON in completed_paths gracefully", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    env.DB = {
      prepare: mock((sql: string) => {
        const s = sql.toUpperCase();
        const api: any = {
          bind: () => api,
          all: async () => {
            if (s.includes("FROM SESSIONS")) return { results: [makeUserRow()] };
            if (s.includes("FROM READING_PROGRESS")) {
              return {
                results: [
                  { book_slug: "bad-json-book", last_read_path: "/x", completed_paths: 'not json' },
                ],
              };
            }
            return { results: [] };
          },
          first: async () => (s.includes("FROM SESSIONS") ? makeUserRow() : null),
          run: async () => ({ success: true }),
        };
        return api;
      }),
      batch: async () => [{ success: true }],
    } as any;
    const req = mockRequest("https://example.com/api/progress", {
      method: "GET",
      headers: { Cookie: `session_id=${SID}` },
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.progress).toHaveLength(1);
    expect(data.progress[0].book_slug).toBe("bad-json-book");
    expect(data.progress[0].completed_paths).toEqual([]);
  });

  test("GET with bookSlug handles invalid JSON in completed_paths gracefully", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    env.DB = {
      prepare: mock((sql: string) => {
        const s = sql.toUpperCase();
        const api: any = {
          bind: () => api,
          all: async () => ({ results: [] }),
          first: async () => {
            if (s.includes("FROM SESSIONS")) return makeUserRow();
            return { last_read_path: "/books/test-book/ch1.html", completed_paths: '{bad json' };
          },
          run: async () => ({ success: true }),
        };
        return api;
      }),
      batch: async () => [{ success: true }],
    } as any;

    const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", {
      method: "GET",
      headers: { Cookie: `session_id=${SID}` },
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.path).toBe("/books/test-book/ch1.html");
    expect(data.completed_paths).toEqual([]);
  });

  test("POST handles existing invalid JSON in completed_paths gracefully", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    env.DB = {
      prepare: mock((sql: string) => {
        const s = sql.toUpperCase();
        const api: any = {
          bind: () => api,
          all: async () => ({ results: [] }),
          first: async () => {
            if (s.includes("FROM SESSIONS")) return makeUserRow();
            if (s.includes("FROM READING_PROGRESS")) {
              return { completed_paths: 'invalid json here' };
            }
            return null;
          },
          run: async () => ({ success: true }),
        };
        return api;
      }),
      batch: async () => [{ success: true }],
    } as any;

    const req = mockRequest("https://example.com/api/progress", {
      method: "POST",
      headers: { Cookie: `session_id=${SID}` },
      body: JSON.stringify({
        bookSlug: "test-book",
        path: "/books/test-book/ch1.html",
        completed_path: "/books/test-book/ch1.html",
      }),
    });

    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    // Because it gracefully falls back to [], it should only have the newly added completed_path.
    expect(data.completed_paths).toEqual(["/books/test-book/ch1.html"]);
  });

  test("GET with no bookSlug returns all progress for user", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    env.DB = {
      prepare: mock((sql: string) => {
        const s = sql.toUpperCase();
        const api: any = {
          bind: () => api,
          all: async () => {
            if (s.includes("FROM SESSIONS")) return { results: [makeUserRow()] };
            if (s.includes("FROM READING_PROGRESS")) {
              return {
                results: [
                  { book_slug: "a", last_read_path: "/x", completed_paths: '["/x"]' },
                  { book_slug: "b", last_read_path: "/y", completed_paths: "[]" },
                ],
              };
            }
            return { results: [] };
          },
          first: async () => (s.includes("FROM SESSIONS") ? makeUserRow() : null),
          run: async () => ({ success: true }),
        };
        return api;
      }),
      batch: async () => [{ success: true }],
    } as any;
    const req = mockRequest("https://example.com/api/progress", {
      method: "GET",
      headers: { Cookie: `session_id=${SID}` },
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.progress).toHaveLength(2);
    expect(data.progress[0].book_slug).toBe("a");
    expect(data.progress[0].completed_paths).toEqual(["/x"]);
  });

  test("POST with invalid bookSlug returns 400", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => [makeUserRow()]);
    const req = mockRequest("https://example.com/api/progress", {
      method: "POST",
      headers: { Cookie: `session_id=${SID}` },
      body: JSON.stringify({ bookSlug: "INVALID SLUG!", path: "/x" }),
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(400);
  });

  test("POST with invalid path returns 400", async () => {
    mockSession = { sub: "u_123", role: "reader", sid: SID, email: "alice@example.com" };
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => [makeUserRow()]);
    const req = mockRequest("https://example.com/api/progress", {
      method: "POST",
      headers: { Cookie: `session_id=${SID}` },
      body: JSON.stringify({ bookSlug: "valid", path: "no-leading-slash" }),
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(400);
  });
});
