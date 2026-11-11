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

import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { onRequest } from "../../../../functions/api/books/[slug]";
import { onRequest as onViewRequest } from "../../../../functions/api/books/[slug]/view";
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

// A D1 stand-in over in-memory SQLite with the rate_limits migration, so the
// real counter SQL decides whether a view is counted.
function viewDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(readFileSync(join(import.meta.dir, "../../../../db/migrations/0007_rate_limit.sql"), "utf8"));
  sqlite.exec("CREATE TABLE books (slug TEXT PRIMARY KEY, view_count INTEGER NOT NULL DEFAULT 0)");
  sqlite.exec("INSERT INTO books (slug) VALUES ('buku-a'), ('buku-b')");
  const db = {
    // D1 runs a batch as one transaction: a failing statement rolls back all.
    async batch(stmts: { sql: string; params: unknown[] }[]) {
      return sqlite.transaction(() =>
        stmts.map((s) => ({ results: sqlite.query(s.sql).all(...(s.params as any[])), success: true, meta: {} })),
      )();
    },
    prepare(sql: string) {
      let params: unknown[] = [];
      const stmt = {
        sql,
        get params() {
          return params;
        },
        bind(...p: unknown[]) {
          params = p;
          return stmt;
        },
        async first<T>() {
          return (sqlite.query(sql).get(...(params as any[])) as T) ?? null;
        },
        async run() {
          const res = sqlite.query(sql).run(...(params as any[]));
          return { success: true, meta: { changes: res.changes } };
        },
      };
      return stmt;
    },
  };
  const views = (slug: string) =>
    (sqlite.query("SELECT view_count FROM books WHERE slug = ?1").get(slug) as { view_count: number }).view_count;
  return { db, views };
}

async function postView(db: unknown, slug: string, ip: string) {
  const request = new Request(`https://dawnbook.belajarcarabelajar.com/api/books/${slug}/view`, {
    method: "POST",
    headers: { "X-Requested-With": "XMLHttpRequest", "CF-Connecting-IP": ip },
  });
  return await onViewRequest({ request, env: { DB: db }, params: { slug } } as any);
}

describe("POST /api/books/:slug/view once per IP per book per day", () => {
  it("counts the first view and not a repeat from the same IP", async () => {
    const { db, views } = viewDb();

    const first = await postView(db, "buku-a", "203.0.113.5");
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ success: true });
    expect(views("buku-a")).toBe(1);

    const repeat = await postView(db, "buku-a", "203.0.113.5");
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toEqual({ success: true, counted: false });
    expect(views("buku-a")).toBe(1);
  });

  it("counts another IP and another book separately", async () => {
    const { db, views } = viewDb();

    await postView(db, "buku-a", "203.0.113.5");
    await postView(db, "buku-a", "198.51.100.7");
    await postView(db, "buku-b", "203.0.113.5");

    expect(views("buku-a")).toBe(2);
    expect(views("buku-b")).toBe(1);
  });

  it("counts the same IP again after 24 hours", async () => {
    const { db, views } = viewDb();
    const realNow = Date.now;
    try {
      const start = realNow();
      Date.now = () => start;
      await postView(db, "buku-a", "203.0.113.5");
      Date.now = () => start + 86_400_000 + 1000;
      await postView(db, "buku-a", "203.0.113.5");
    } finally {
      Date.now = realNow;
    }
    expect(views("buku-a")).toBe(2);
  });
});

afterAll(() => {
  mock.module("../../../../functions/lib/auth", () => realAuth);
});
