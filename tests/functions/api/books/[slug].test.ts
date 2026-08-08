import { describe, it, expect, beforeEach, mock } from "bun:test";

let mockSession: any = null;
mock.module("../../../../functions/lib/auth", () => {
  return {
    verifySession: async () => mockSession,
  };
});

import { onRequest } from "../../../../functions/api/books/[slug]";
import {
  createMockEnv,
  mockRequest,
  setQueryHandler,
} from "../../../../tests/helpers/mocks";

const PUBLISHED_BOOK = {
  id: "published-1",
  slug: "published-book",
  title: "Published",
  status: "published",
  content_md: "# Published content",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  subject_label: null,
  view_count: 0,
};

const DRAFT_BOOK = {
  ...PUBLISHED_BOOK,
  id: "draft-1",
  slug: "draft-book",
  title: "Draft",
  status: "draft",
  content_md: "# Secret draft content",
};

describe("GET /api/books/:slug", () => {
  beforeEach(() => {
    mockSession = null;
  });

  it("returns a published book to anonymous callers", async () => {
    const env = createMockEnv();
    let capturedSql = "";
    setQueryHandler(env, "SELECT", (sql, _params) => {
      capturedSql = sql;
      return [PUBLISHED_BOOK];
    });

    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/published-book",
      { method: "GET" }
    );
    const response = await onRequest({ request, env, params: { slug: "published-book" } } as any);

    expect(response.status).toBe(200);
    // Anonymous callers are constrained to published books at the SQL level.
    expect(capturedSql).toContain("status = 'published'");
    // Published books still expose their content (the M1 boundary only hides drafts).
    expect((await response.json()).book).toMatchObject({
      slug: "published-book",
      content_md: "# Published content",
    });
  });

  it("returns 404 for a draft book to anonymous callers", async () => {
    const env = createMockEnv();
    let capturedSql = "";
    setQueryHandler(env, "SELECT", (sql, _params) => {
      capturedSql = sql;
      // The status='published' constraint excludes the draft row.
      return [];
    });

    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/draft-book",
      { method: "GET" }
    );
    const response = await onRequest({ request, env, params: { slug: "draft-book" } } as any);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Book not found" });
    expect(capturedSql).toContain("status = 'published'");
  });

  it("returns a draft book to authenticated admins", async () => {
    mockSession = { sub: "admin_1", role: "admin" };
    const env = createMockEnv();
    let capturedSql = "";
    setQueryHandler(env, "SELECT", (sql, _params) => {
      capturedSql = sql;
      return [DRAFT_BOOK];
    });

    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/draft-book",
      { method: "GET" }
    );
    const response = await onRequest({ request, env, params: { slug: "draft-book" } } as any);

    expect(response.status).toBe(200);
    // Admins query without the published-only constraint.
    expect(capturedSql).not.toContain("status = 'published'");
    expect((await response.json()).book.status).toBe("draft");
  });

  it("returns 404 for a missing book to admins", async () => {
    mockSession = { sub: "admin_1", role: "admin" };
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/unknown",
      { method: "GET" }
    );
    const response = await onRequest({ request, env, params: { slug: "unknown" } } as any);

    expect(response.status).toBe(404);
  });

  it("returns 400 for an invalid slug format", async () => {
    const env = createMockEnv();
    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/bad%20slug!",
      { method: "GET" }
    );
    const response = await onRequest({ request, env, params: { slug: "bad slug!" } } as any);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid slug format" });
  });
});

describe("DELETE /api/books/:slug", () => {
  beforeEach(() => {
    mockSession = null;
  });

  it("returns 401 when no session exists", async () => {
    const env = createMockEnv();
    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/some-book",
      { method: "DELETE" }
    );
    const response = await onRequest({ request, env, params: { slug: "some-book" } } as any);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "Unauthorized: valid session required",
    });
  });

  it("returns 403 when the session user is not an admin", async () => {
    mockSession = { sub: "reader_1", role: "reader" };
    const env = createMockEnv();
    const request = mockRequest(
      "https://dawnbook.belajarcarabelajar.com/api/books/some-book",
      { method: "DELETE" }
    );
    const response = await onRequest({ request, env, params: { slug: "some-book" } } as any);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Forbidden: Administrator access required",
    });
  });
});
