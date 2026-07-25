import { expect, test, describe, mock, beforeEach } from "bun:test";

let mockSession: any = null;
mock.module("../../../functions/lib/auth", () => {
  return {
    verifySession: async () => mockSession,
  };
});

import { onRequest } from "../../../functions/api/books/[slug]";
import { createMockEnv, mockRequest, setQueryHandler } from "../../helpers/mocks";

describe("API: /api/books/[slug]", () => {
  beforeEach(() => {
    mockSession = null;
  });

  test("GET returns 400 for invalid slug", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books/invalid slug!", { method: "GET" });
    const response = await onRequest({ request: req, env, params: { slug: "invalid slug!" } } as any);
    expect(response.status).toBe(400);
  });

  test("GET returns 404 for unknown slug", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books/unknown-slug", { method: "GET" });
    const response = await onRequest({ request: req, env, params: { slug: "unknown-slug" } } as any);
    expect(response.status).toBe(404);
  });

  test("GET returns 200 and book details when found", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => [
      { id: "b1", slug: "known-slug", title: "Known Book", status: "published" },
    ]);
    const req = mockRequest("https://example.com/api/books/known-slug", { method: "GET" });
    const response = await onRequest({ request: req, env, params: { slug: "known-slug" } } as any);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.book.title).toBe("Known Book");
  });

  test("returns 405 Method Not Allowed for unsupported HTTP methods", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books/known-slug", { method: "PUT" });
    const response = await onRequest({ request: req, env, params: { slug: "known-slug" } } as any);
    expect(response.status).toBe(405);
    const body = await response.json();
    expect(body.error).toBe("Method not allowed");
  });

  test("returns 500 Internal Server Error when DB query throws exception", async () => {
    const env = createMockEnv();
    env.DB.prepare = mock(() => {
      throw new Error("DB Error");
    });
    const req = mockRequest("https://example.com/api/books/known-slug", { method: "GET" });
    const response = await onRequest({ request: req, env, params: { slug: "known-slug" } } as any);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal server error");
  });

  describe("DELETE", () => {
    test("returns 401 if unauthorized", async () => {
      mockSession = null;
      const env = createMockEnv();
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });
      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain("Unauthorized");
    });

    test("returns 403 if user is not admin", async () => {
      mockSession = { sub: "user_regular", role: "reader", publicMetadata: { role: "reader" } };
      const env = createMockEnv();
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });
      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Forbidden: Administrator access required" });
    });

    test("returns 200 on successful deletion by admin (role from session)", async () => {
      mockSession = { sub: "user_123", role: "admin", publicMetadata: { role: "admin" } };
      const env = createMockEnv();
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });

      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, message: "Book deleted successfully" });
    });

    test("returns 500 if database deletion fails", async () => {
      mockSession = { sub: "user_123", role: "admin", publicMetadata: { role: "admin" } };
      const env = createMockEnv();
      // Only override the DB for this test
      env.DB = {
        prepare: mock(() => ({
          bind: mock(() => ({
            run: mock(async () => ({ success: false }))
          }))
        }))
      } as any;
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });

      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: "Database deletion failed" });
    });
  });
});
