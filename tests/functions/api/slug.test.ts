import { expect, test, describe, mock } from "bun:test";

let mockSession: any = null;
mock.module("../../../functions/lib/auth", () => {
  return {
    verifyClerkSession: async () => mockSession,
  };
});

import { onRequest } from "../../../functions/api/books/[slug]";
import { createMockEnv, mockRequest } from "../../helpers/mocks";

describe("API: /api/books/[slug]", () => {
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

  describe("DELETE", () => {
    test("returns 401 if unauthorized", async () => {
      mockSession = null;
      const env = createMockEnv();
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });
      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized: valid Clerk session required" });
    });

    test("returns 403 if user is not admin", async () => {
      mockSession = { sub: "user_regular" };
      const env = createMockEnv();
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });
      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ error: "Forbidden: Administrator access required" });
    });

    test("returns 200 on successful deletion by admin", async () => {
      mockSession = { sub: "user_123", publicMetadata: { role: "admin" } };
      const env = createMockEnv();
      const req = mockRequest("https://example.com/api/books/my-slug", { method: "DELETE" });

      const response = await onRequest({ request: req, env, params: { slug: "my-slug" } } as any);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, message: "Book deleted successfully" });
    });

    test("returns 500 if database deletion fails", async () => {
      mockSession = { sub: "user_123", publicMetadata: { role: "admin" } };
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
