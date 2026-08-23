import { expect, test, describe, beforeEach, mock, spyOn } from "bun:test";

let mockSession: any = null;
mock.module("../../../functions/lib/auth", () => {
  return {
    verifySession: async () => mockSession,
  };
});

import { onRequest } from "../../../functions/api/books/index";
import { createMockEnv, mockRequest, setQueryHandler } from "../../helpers/mocks";

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

  test("GET as anonymous only ever returns published books, ignoring the status param", async () => {
    const env = createMockEnv();
    const seen: { sql: string; params: unknown[] }[] = [];
    setQueryHandler(env, "SELECT", (sql, params) => {
      seen.push({ sql, params });
      return [{ id: "1", slug: "b", title: "t", status: "published" }];
    });

    // Even an explicit status=draft request must be coerced to published.
    const req = mockRequest("https://example.com/api/books?status=draft", { method: "GET" });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(200);
    expect(seen).toHaveLength(1);
    expect(seen[0].sql).toContain("status = ?1");
    expect(seen[0].params).toEqual(["published"]);
  });

  test("GET as reader only returns published books", async () => {
    mockSession = { sub: "user_123", role: "reader" };
    const env = createMockEnv();
    const seen: { sql: string; params: unknown[] }[] = [];
    setQueryHandler(env, "SELECT", (sql, params) => {
      seen.push({ sql, params });
      return [];
    });

    const req = mockRequest("https://example.com/api/books?status=draft", { method: "GET" });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(200);
    expect(seen[0].params).toEqual(["published"]);
  });

  test("GET as admin respects the status filter", async () => {
    mockSession = { sub: "admin_1", role: "admin" };
    const env = createMockEnv();
    const seen: { sql: string; params: unknown[] }[] = [];
    setQueryHandler(env, "SELECT", (sql, params) => {
      seen.push({ sql, params });
      return [];
    });

    const req = mockRequest("https://example.com/api/books?status=draft", { method: "GET" });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(200);
    expect(seen[0].sql).toContain("status = ?1");
    expect(seen[0].params).toEqual(["draft"]);
  });

  test("GET as admin with no status filter returns all books", async () => {
    mockSession = { sub: "admin_1", role: "admin" };
    const env = createMockEnv();
    const seen: { sql: string; params: unknown[] }[] = [];
    setQueryHandler(env, "SELECT", (sql, params) => {
      seen.push({ sql, params });
      return [];
    });

    const req = mockRequest("https://example.com/api/books", { method: "GET" });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(200);
    expect(seen[0].sql).not.toContain("status =");
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

  test("POST returns 401 when no session exists", async () => {
    mockSession = null;
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "slug", chapterTitle: "t", markdownContent: "c" }),
    });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized: valid session required" });
  });

  test("POST returns 403 when session user is not admin", async () => {
    mockSession = { sub: "user_123", role: "reader" };
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "slug", chapterTitle: "t", markdownContent: "c" }),
    });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden: Administrator access required" });
  });

  test("POST returns 400 when markdownContent is too long", async () => {
    mockSession = { sub: "user_123", role: "admin" };
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "slug", chapterTitle: "t", markdownContent: "a".repeat(5000001) }),
    });
    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "markdownContent too long" });
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
    let res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(500);

    // Batch write fails
    const envBatchFail = createMockEnv();
    envBatchFail.DB.batch = mock(async () => [{ success: false }]) as any;
    const reqBatch = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "valid-slug", chapterTitle: "t", markdownContent: "c" }),
    });
    res = await onRequest({ request: reqBatch, env: envBatchFail } as any);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Database chunk write failed" });
  });

  test("POST returns 201 Created on successful book creation with chunked content", async () => {
    mockSession = { sub: "user_123", role: "admin" };
    const env = createMockEnv();

    const longContent = "A".repeat(35000); // Triggers multiple chunks
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({
        bookSlug: "my-new-book",
        chapterTitle: "Chapter 1",
        markdownContent: longContent,
        subjectLabel: "Teknologi",
      }),
    });

    const res = await onRequest({ request: req, env } as any);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.book.slug).toBe("my-new-book");
    expect(body.book.title).toBe("Chapter 1");
    expect(body.book.subject_label).toBe("Teknologi");
  });

  test("returns 405 Method Not Allowed for unsupported methods", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", { method: "PUT" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(405);
  });

  test("returns 500 Internal Server Error on unexpected exception", async () => {
    const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
    try {
      const env = createMockEnv();
      env.DB.prepare = mock(() => {
        throw new Error("Fatal DB Error");
      });

      // GET request error handling
      const reqGet = mockRequest("https://example.com/api/books", { method: "GET" });
      const responseGet = await onRequest({ request: reqGet, env } as any);
      expect(responseGet.status).toBe(500);
      expect(await responseGet.json()).toEqual({ error: "Internal server error" });

      // POST request error handling
      mockSession = { sub: "user_123", role: "admin" };
      const reqPost = mockRequest("https://example.com/api/books", {
        method: "POST",
        body: JSON.stringify({ bookSlug: "slug", chapterTitle: "t", markdownContent: "c" }),
      });
      const responsePost = await onRequest({ request: reqPost, env } as any);
      expect(responsePost.status).toBe(500);
      expect(await responsePost.json()).toEqual({ error: "Internal server error" });

      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
