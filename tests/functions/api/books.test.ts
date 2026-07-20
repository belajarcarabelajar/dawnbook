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

  test("GET is public and returns books", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", { method: "GET" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);
  });

  test("POST returns 401 without session", async () => {
    mockSession = null;
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "x", chapterTitle: "t", markdownContent: "c" }),
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain("Unauthorized");
  });

  test("POST returns 403 when session.role is not admin", async () => {
    mockSession = { sub: "user_123", role: "reader", publicMetadata: { role: "reader" } };
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "x", chapterTitle: "t", markdownContent: "c" }),
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(403);
  });

  test("POST returns 201 with admin session", async () => {
    mockSession = { sub: "user_123", role: "admin", publicMetadata: { role: "admin" } };
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", {
      method: "POST",
      body: JSON.stringify({ bookSlug: "new-book", chapterTitle: "New Book", markdownContent: "Content" }),
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(201);
  });
});
