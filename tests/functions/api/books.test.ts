import { expect, test, describe, beforeEach, mock } from "bun:test";

let mockSession: any = null;
mock.module("../../../functions/lib/auth", () => {
  return {
    verifySession: async () => mockSession,
  };
});

import { onRequest } from "../../../functions/api/books/index";
import { createMockEnv, mockRequest } from "../../helpers/mocks";

describe("API: /api/books", () => {
  beforeEach(() => {
    mockSession = null;
  });

  test("GET supports query parameters for content, status, subject_label, and sort_by", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books?content=true&status=published&subject_label=tech&sort_by=popular", { method: "GET" });
    let response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);

    const reqOldest = mockRequest("https://example.com/api/books?sort_by=oldest", { method: "GET" });
    response = await onRequest({ request: reqOldest, env } as any);
    expect(response.status).toBe(200);
  });

  test("POST returns 400 for invalid JSON body", async () => {
    mockSession = { sub: "user_123", role: "admin" };
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: "invalid-json",
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid JSON body" });
  });

  test("POST returns 400 when required fields are missing", async () => {
    mockSession = { sub: "user_123", role: "admin" };
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "x" }),
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Missing required fields: bookSlug, chapterTitle, markdownContent",
    });
  });

  test("POST returns 400 for invalid or oversized fields", async () => {
    mockSession = { sub: "user_123", role: "admin" };
    const env = createMockEnv();

    // Invalid slug
    let req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "bad slug!", chapterTitle: "t", markdownContent: "c" }),
    });
    let res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(400);

    // Chapter title too long
    req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "slug", chapterTitle: "a".repeat(301), markdownContent: "c" }),
    });
    res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(400);

    // Subject label too long
    req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "slug", chapterTitle: "t", markdownContent: "c", subjectLabel: "a".repeat(101) }),
    });
    res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(400);
  });

  test("POST returns 500 when D1 write or batch fails", async () => {
    mockSession = { sub: "user_123", role: "admin" };
    const env = createMockEnv();

    // Metadata write fails
    env.DB.prepare = mock(() => ({
      bind: mock(() => ({
        run: mock(async () => ({ success: false })),
      })),
    })) as any;

    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "valid-slug", chapterTitle: "t", markdownContent: "c" }),
    });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(500);
  });

  test("returns 405 Method Not Allowed for unsupported methods", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", { method: "PUT" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(405);
  });

  test("returns 500 Internal Server Error on unexpected exception", async () => {
    const env = createMockEnv();
    env.DB.prepare = mock(() => {
      throw new Error("Fatal DB Error");
    });
    const req = mockRequest("https://example.com/api/books", { method: "GET" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(500);
  });
});
