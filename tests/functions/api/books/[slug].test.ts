import { describe, it, expect, beforeEach, mock, afterAll } from "bun:test";

let mockSession: any = null;
// bun's mock.module is process-global: snapshot the real module first and
// restore it in afterAll so later files (lib/auth.test.ts) see real code.
const realAuth = { ...(await import("../../../../functions/lib/auth")) };
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

// Mirrors D1 column selection, so a row only carries the columns the SQL names
// and a test can see whether the handler asked for content_md at all.
function selectColumns(sql: string, row: Record<string, unknown>) {
  const upper = sql.toUpperCase();
  const cols = sql
    .slice(upper.indexOf("SELECT") + "SELECT".length, upper.indexOf(" FROM "))
    .split(",")
    .map((c) => c.trim());
  return Object.fromEntries(cols.filter((c) => c in row).map((c) => [c, row[c]]));
}

async function getBookAs(session: unknown, row: Record<string, unknown>) {
  mockSession = session;
  const env = createMockEnv();
  setQueryHandler(env, "SELECT", (sql) => [selectColumns(sql, row)]);
  const request = mockRequest(
    `https://dawnbook.belajarcarabelajar.com/api/books/${row.slug}`,
    { method: "GET" }
  );
  const response = await onRequest({ request, env, params: { slug: row.slug } } as any);
  return { status: response.status, book: (await response.json()).book };
}

describe("GET /api/books/:slug content_md access", () => {
  beforeEach(() => {
    mockSession = null;
  });

  it("omits content_md for anonymous callers", async () => {
    const { status, book } = await getBookAs(null, PUBLISHED_BOOK);
    expect(status).toBe(200);
    expect(book.slug).toBe("published-book");
    expect(book.title).toBe("Published");
    expect(Object.keys(book)).not.toContain("content_md");
  });

  it("omits content_md for reader sessions", async () => {
    const { status, book } = await getBookAs({ sub: "reader_1", role: "reader" }, PUBLISHED_BOOK);
    expect(status).toBe(200);
    expect(book.slug).toBe("published-book");
    expect(Object.keys(book)).not.toContain("content_md");
  });

  it("returns content_md to admins, including drafts", async () => {
    const admin = { sub: "admin_1", role: "admin" };
    const published = await getBookAs(admin, PUBLISHED_BOOK);
    expect(published.book.content_md).toBe("# Published content");
    const draft = await getBookAs(admin, DRAFT_BOOK);
    expect(draft.book.content_md).toBe("# Secret draft content");
  });
});

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
    // The SQL never asks for the book text on behalf of a non-admin.
    expect(capturedSql).not.toContain("content_md");
    expect((await response.json()).book).toMatchObject({ slug: "published-book" });
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

afterAll(() => {
  mock.module("../../../../functions/lib/auth", () => realAuth);
});
