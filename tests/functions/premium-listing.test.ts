import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { onRequest as booksRequest } from "../../functions/api/books/index";
import { onRequest as statsRequest } from "../../functions/api/stats";
import { getBooks } from "../../functions/lib/db";
import { premiumSlugExclusion, setPremiumRegistryForTest } from "../../functions/lib/premium";

// Real in-memory SQLite with the production migrations, so the listing SQL
// runs as it does in D1.
const MIGRATIONS = join(import.meta.dir, "../../db/migrations");

function monthsAgo(n: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - n, 10, 12)).toISOString();
}

const PREMIUM_CREATED = new Date().toISOString();
const FREE_NEWEST = monthsAgo(3);
const FREE_OLDEST = monthsAgo(5);

function createSqliteD1(premiumCreated = PREMIUM_CREATED) {
  const sqlite = new Database(":memory:");
  for (const file of ["0001_init.sql", "0004_book_subject_label.sql", "0005_book_view_count.sql", "0006_user_oauth.sql"]) {
    sqlite.exec(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  const insert = sqlite.prepare(
    "INSERT INTO books (id, slug, title, status, content_md, created_at, updated_at, subject_label, view_count) " +
      "VALUES (?1, ?1, ?2, 'published', '', ?3, ?3, ?4, ?5)",
  );
  insert.run("buku-premium", "Premium", premiumCreated, "Label Premium Saja", 1000);
  insert.run("buku-gratis-a", "Gratis A", FREE_NEWEST, "Psikologi", 7);
  insert.run("buku-gratis-b", "Gratis B", FREE_OLDEST, "Psikologi", 5);
  const makeStmt = (sql: string) => {
    let params: unknown[] = [];
    const stmt = {
      bind(...p: unknown[]) {
        params = p;
        return stmt;
      },
      async first<T>() {
        return (sqlite.query(sql).get(...(params as any[])) as T) ?? null;
      },
      async all<T>() {
        return { results: sqlite.query(sql).all(...(params as any[])) as T[], success: true, meta: {} };
      },
    };
    return stmt;
  };
  return { DB: { prepare: makeStmt } as any };
}

const get = (url: string) => new Request(url, { method: "GET" });
const slugsOf = (books: { slug: string }[]) => books.map((b) => b.slug).sort();

beforeEach(() =>
  setPremiumRegistryForTest({ "buku-premium": { products: ["P-x"], productUrl: "https://example.com/p" } }),
);
afterEach(() => setPremiumRegistryForTest(null));

describe("GET /api/books hides premium books", () => {
  it("leaves premium books out of the anonymous list", async () => {
    const env = createSqliteD1();
    const res = await booksRequest({ request: get("https://dawnbook.belajarcarabelajar.com/api/books"), env } as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { books: { slug: string }[] };
    expect(slugsOf(body.books)).toEqual(["buku-gratis-a", "buku-gratis-b"]);
  });

  it("leaves premium books out of a subject-filtered list", async () => {
    const env = createSqliteD1();
    const url = "https://dawnbook.belajarcarabelajar.com/api/books?subject_label=Label%20Premium%20Saja";
    const res = await booksRequest({ request: get(url), env } as any);
    expect(((await res.json()) as { books: unknown[] }).books).toEqual([]);
  });

  it("still lists premium books for an admin caller", async () => {
    const env = createSqliteD1();
    const books = await getBooks(env.DB, { isAdmin: true });
    expect(slugsOf(books)).toEqual(["buku-gratis-a", "buku-gratis-b", "buku-premium"]);
  });

  it("lists every published book when the registry is empty", async () => {
    setPremiumRegistryForTest({});
    const env = createSqliteD1();
    const books = await getBooks(env.DB, {});
    expect(slugsOf(books)).toEqual(["buku-gratis-a", "buku-gratis-b", "buku-premium"]);
  });
});

describe("GET /api/stats hides premium books", () => {
  async function stats(premiumCreated?: string) {
    const env = createSqliteD1(premiumCreated);
    const res = await statsRequest({ request: get("https://dawnbook.belajarcarabelajar.com/api/stats"), env } as any);
    expect(res.status).toBe(200);
    return (await res.json()) as any;
  }

  it("counts only free books and their subjects", async () => {
    const body = await stats();
    expect(body.content.total_books).toBe(2);
    expect(body.content.by_subject).toEqual([{ label: "Psikologi", count: 2 }]);
  });

  it("sums views and dates over free books only", async () => {
    const body = await stats();
    expect(body.engagement.total_views).toBe(12);
    expect(body.engagement.first_release).toBe(FREE_OLDEST);
    expect(body.engagement.last_release).toBe(FREE_NEWEST);
    expect(body.engagement.published_this_month).toBe(0);
    const timelineTotal = body.engagement.monthly_timeline.reduce((n: number, m: { count: number }) => n + m.count, 0);
    expect(timelineTotal).toBe(2);
  });

  it("ignores a premium book that is the oldest row", async () => {
    const body = await stats(monthsAgo(8));
    expect(body.engagement.first_release).toBe(FREE_OLDEST);
    expect(body.engagement.last_release).toBe(FREE_NEWEST);
  });
});

describe("premiumSlugExclusion", () => {
  it("numbers its placeholders from the given parameter", () => {
    setPremiumRegistryForTest({
      "buku-a": { products: ["P-a"], productUrl: "https://example.com/a" },
      "buku-b": { products: ["P-b"], productUrl: "https://example.com/b" },
    });
    expect(premiumSlugExclusion(3)).toEqual({ sql: "slug NOT IN (?3, ?4)", params: ["buku-a", "buku-b"] });
  });

  it("gives an empty condition for an empty registry", () => {
    setPremiumRegistryForTest({});
    expect(premiumSlugExclusion(1)).toEqual({ sql: "", params: [] });
  });
});
