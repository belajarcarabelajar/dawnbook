import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import type { D1Database } from "@cloudflare/workers-types";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkPremiumAccess,
  isPremiumPublicPage,
  loadPremiumRegistry,
  premiumSlugOf,
  premiumSlugs,
  setPremiumRegistryForTest,
  type PremiumEntry,
} from "../../../functions/lib/premium";

const ENTRY_A: PremiumEntry = { products: ["P-A"], productUrl: "https://x/a" };

type EntitlementRow = {
  email: string;
  product_id: string;
  kind: "member" | "lms" | "unduhan" | "tautan";
  revoked_at: string | null;
};

type FakeD1 = { db: D1Database; calls: { sql: string; params: unknown[] }[] };

// Evaluates the bound parameters against in-memory rows: ?1 is the email,
// ?2..?n are the book's products. Comparison is exact on purpose (stricter
// than the real COLLATE NOCASE), so a missing normalisation shows up as a refusal.
function fakeD1(entitlements: EntitlementRow[], allowlist: string[]): FakeD1 {
  const calls: { sql: string; params: unknown[] }[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          return {
            async first() {
              calls.push({ sql, params });
              const [email, ...products] = params as string[];
              const viaEntitlement = entitlements.some(
                (r) =>
                  r.email === email &&
                  r.revoked_at === null &&
                  (r.kind === "member" || (r.kind === "unduhan" && products.includes(r.product_id))),
              );
              const viaAllowlist = allowlist.includes(email);
              return viaEntitlement || viaAllowlist ? { ok: 1 } : null;
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, calls };
}

const ROWS: EntitlementRow[] = [
  { email: "member@example.test", product_id: "P-OTHER", kind: "member", revoked_at: null },
  { email: "buyer@x.com", product_id: "P-A", kind: "unduhan", revoked_at: null },
  { email: "revoked@example.test", product_id: "P-A", kind: "unduhan", revoked_at: "2026-10-01T00:00:00Z" },
  { email: "other@example.test", product_id: "P-B", kind: "unduhan", revoked_at: null },
];
const ALLOW = ["staff@example.test"];

beforeEach(() => setPremiumRegistryForTest({ "buku-a": ENTRY_A }));
afterEach(() => setPremiumRegistryForTest(null));

describe("registry", () => {
  test("test seam replaces the registry and premiumSlugs lists its keys", () => {
    expect(loadPremiumRegistry()).toEqual({ "buku-a": ENTRY_A });
    expect(premiumSlugs()).toEqual(["buku-a"]);
  });

  test("null restores the bundled registry from data/premium-books.json", () => {
    setPremiumRegistryForTest({ "buku-a": { products: ["P-A"], productUrl: "https://x/a" } });
    setPremiumRegistryForTest(null);
    const bundled = JSON.parse(readFileSync(join(import.meta.dir, "../../../data/premium-books.json"), "utf-8")).books;
    expect(loadPremiumRegistry()).toEqual(bundled);
    expect(premiumSlugs().sort()).toEqual(Object.keys(bundled).sort());
  });
});

describe("premiumSlugOf", () => {
  test("returns the slug of a registered book", () => {
    expect(premiumSlugOf("/books/buku-a/content/02_x.html")).toBe("buku-a");
    expect(premiumSlugOf("/books/buku-a")).toBe("buku-a");
    expect(premiumSlugOf("/books/buku-a/")).toBe("buku-a");
  });

  test("decodes the pathname before matching", () => {
    expect(premiumSlugOf("/books/buku%2Da/index.html")).toBe("buku-a");
  });

  test("a malformed escape still resolves the slug, so the path stays gated", () => {
    expect(premiumSlugOf("/books/buku-a/%E0%A4%A")).toBe("buku-a");
  });

  test("returns null for an unregistered book", () => {
    expect(premiumSlugOf("/books/buku-b/content/02_x.html")).toBeNull();
  });

  test("returns null for paths outside /books/", () => {
    expect(premiumSlugOf("/")).toBeNull();
    expect(premiumSlugOf("/api/progress")).toBeNull();
    expect(premiumSlugOf("/buku-a/index.html")).toBeNull();
  });
});

describe("isPremiumPublicPage", () => {
  const publicPaths = [
    "/books/buku-a",
    "/books/buku-a/",
    "/books/buku-a/index.html",
    "/books/buku-a/index",
    "/books/buku-a/toc.html",
    "/books/buku-a/toc",
    "/books/buku-a/404.html",
    "/books/buku-a/content/01_pengantar.html",
    "/books/buku-a/content/01_pengantar",
    "/books/buku-a/01_pengantar.html",
    "/books/buku-a/chapter_1.html",
    "/books/buku-a/chapter_1",
    "/books/buku-a/content/chapter_1.html",
    "/books/buku-a/book-abc123.js",
    "/books/buku-a/x.woff",
    "/books/buku-a/x.woff2",
    "/books/buku-a/x.ttf",
    "/books/buku-a/x.otf",
    "/books/buku-a/x.eot",
    "/books/buku-a/css/chrome.css",
    "/books/buku-a/css/anything",
    "/books/buku-a/fonts/fonts.css",
    "/books/buku-a/fonts/OpenSans.data",
    "/books/buku-a/FontAwesome/fonts/fontawesome-webfont.svg",
    "/books/buku-a/favicon.svg",
    "/books/buku-a/favicon-de23e50b.png",
    "/books/buku-a/images/public/sampul.png",
  ];
  for (const p of publicPaths) {
    test(`public: ${p}`, () => expect(isPremiumPublicPage(p)).toBe(true));
  }

  const gatedPaths = [
    "/books/buku-a/content/02_x.html",
    "/books/buku-a/content/02_x",
    "/books/buku-a/images/x.png",
    "/books/buku-a/searchindex-ab12.js",
    "/books/buku-a/searchindex.json",
    "/books/buku-a/searchindex.js",
    "/books/buku-a/print.html",
    "/books/buku-a/print",
    "/books/buku-a/x.json",
    "/books/buku-a/content/10_x.html",
    "/books/buku-a/chapter_10.html",
    "/books/buku-a/content/010_x.html",
    "/books/buku-a/content/01_x%2F..%2F02_y.html",
    "/books/buku-a/css/..%2Fcontent%2F02_x.html",
    "/books/buku-a/%E0%A4%A",
  ];
  for (const p of gatedPaths) {
    test(`gated: ${p}`, () => expect(isPremiumPublicPage(p)).toBe(false));
  }
});

describe("isPremiumPublicPage hardening", () => {
  const gatedByCase = ["/books/buku-a/SEARCHINDEX.JS", "/books/buku-a/SearchIndex-ab12.js", "/books/buku-a/content/02_x.JS"];
  for (const p of gatedByCase) {
    test(`hardening: upper-case name stays gated: ${p}`, () => expect(isPremiumPublicPage(p)).toBe(false));
  }

  const gatedOutsideThemeDirs = [
    "/books/buku-a/content/02_y.js",
    "/books/buku-a/content/02_y.css",
    "/books/buku-a/images/x.css",
    "/books/buku-a/images/x.woff2",
    "/books/buku-a/content/favicon.png",
    "/books/buku-a/theme/custom.css",
  ];
  for (const p of gatedOutsideThemeDirs) {
    test(`hardening: theme asset outside mdBook theme dirs stays gated: ${p}`, () =>
      expect(isPremiumPublicPage(p)).toBe(false));
  }

  const publicThemeAssets = [
    "/books/buku-a/toc.js",
    "/books/buku-a/book-1234.js",
    "/books/buku-a/css/general.css",
    "/books/buku-a/fonts/x.woff2",
    "/books/buku-a/FontAwesome/fonts/x.woff2",
    "/books/buku-a/favicon.svg",
    "/books/buku-a/favicon-1234.png",
  ];
  for (const p of publicThemeAssets) {
    test(`hardening: mdBook theme asset stays public: ${p}`, () => expect(isPremiumPublicPage(p)).toBe(true));
  }
});

describe("checkPremiumAccess", () => {
  test("allows a member even when the membership is for an unrelated product", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "member@example.test", ENTRY_A)).toBe("allowed");
  });

  test("allows an unduhan buyer of one of the book's products", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "buyer@x.com", ENTRY_A)).toBe("allowed");
  });

  test("allows an allowlisted email", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "staff@example.test", ENTRY_A)).toBe("allowed");
  });

  test("refuses a revoked unduhan", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "revoked@example.test", ENTRY_A)).toBe("refused");
  });

  test("refuses an unduhan of another product", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "other@example.test", ENTRY_A)).toBe("refused");
  });

  test("refuses an unknown email", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "nobody@example.test", ENTRY_A)).toBe("refused");
  });

  test("refuses an empty or blank email without issuing a query", async () => {
    const { db, calls } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "", ENTRY_A)).toBe("refused");
    expect(await checkPremiumAccess(db, "   ", ENTRY_A)).toBe("refused");
    expect(calls.length).toBe(0);
  });

  test("normalises case and surrounding whitespace of the email", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    expect(await checkPremiumAccess(db, "  Buyer@X.COM ", ENTRY_A)).toBe("allowed");
  });

  test("a book with no products still admits members and the allowlist only", async () => {
    const { db } = fakeD1(ROWS, ALLOW);
    const noProducts: PremiumEntry = { products: [], productUrl: "https://x/none" };
    expect(await checkPremiumAccess(db, "member@example.test", noProducts)).toBe("allowed");
    expect(await checkPremiumAccess(db, "staff@example.test", noProducts)).toBe("allowed");
    expect(await checkPremiumAccess(db, "buyer@x.com", noProducts)).toBe("refused");
  });

  test("is unavailable when the binding is missing", async () => {
    expect(await checkPremiumAccess(undefined, "buyer@x.com", ENTRY_A)).toBe("unavailable");
  });

  test("is unavailable when prepare throws", async () => {
    const db = {
      prepare() {
        throw new Error("no such table: entitlements");
      },
    } as unknown as D1Database;
    expect(await checkPremiumAccess(db, "buyer@x.com", ENTRY_A)).toBe("unavailable");
  });

  test("is unavailable when first rejects", async () => {
    const db = {
      prepare() {
        return { bind: () => ({ first: async () => Promise.reject(new Error("D1_ERROR")) }) };
      },
    } as unknown as D1Database;
    expect(await checkPremiumAccess(db, "buyer@x.com", ENTRY_A)).toBe("unavailable");
  });
});

// fakeD1 above decides access in JavaScript and never reads the SQL, so the
// kind rules are tested here by running the real query on SQLite. Schema:
// bcb apps/dashboard/migrations-lms 0000 (allowlist) and 0001 (entitlements),
// with the kind list widened by bcb migration 0003.
function sqliteLms(rows: { email: string; product_id: string; kind: string; revoked_at?: string }[]): D1Database {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE allowlist (email TEXT PRIMARY KEY COLLATE NOCASE, created_at INTEGER NOT NULL, note TEXT);
    CREATE TABLE entitlements (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL COLLATE NOCASE,
      product_id TEXT NOT NULL,
      order_id TEXT,
      kind TEXT NOT NULL CHECK (kind IN ('member', 'ebook_premium', 'shinobidone', 'lms', 'unduhan', 'tautan')),
      granted_at TEXT NOT NULL,
      revoked_at TEXT,
      UNIQUE (email, product_id, kind)
    );
  `);
  const insert = sqlite.query(
    "INSERT INTO entitlements (id, email, product_id, kind, granted_at, revoked_at) VALUES (?1, ?2, ?3, ?4, '2026-11-01T00:00:00Z', ?5)",
  );
  rows.forEach((r, i) => insert.run(`e${i}`, r.email, r.product_id, r.kind, r.revoked_at ?? null));
  return {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          return { first: async () => sqlite.query(sql).get(...(params as string[])) ?? null };
        },
      };
    },
  } as unknown as D1Database;
}

describe("checkPremiumAccess kinds on SQLite", () => {
  test("ebook_premium: an ebook_premium entitlement for any product opens the book", async () => {
    const db = sqliteLms([{ email: "reader@example.test", product_id: "P-1MUzOd", kind: "ebook_premium" }]);
    expect(await checkPremiumAccess(db, "reader@example.test", ENTRY_A)).toBe("allowed");
  });

  test("ebook_premium: a shinobidone entitlement alone grants no e-book access", async () => {
    const db = sqliteLms([{ email: "ninja@example.test", product_id: "P-Z1LSw6j", kind: "shinobidone" }]);
    expect(await checkPremiumAccess(db, "ninja@example.test", ENTRY_A)).toBe("refused");
  });

  test("ebook_premium: a revoked ebook_premium entitlement (refund) is refused", async () => {
    const db = sqliteLms([{ email: "refund@example.test", product_id: "P-1MUzOd", kind: "ebook_premium", revoked_at: "2026-11-01T00:00:00Z" }]);
    expect(await checkPremiumAccess(db, "refund@example.test", ENTRY_A)).toBe("refused");
  });

  test("ebook_premium: a member entitlement still opens the book until the contract migration", async () => {
    const db = sqliteLms([{ email: "member@example.test", product_id: "P-OTHER", kind: "member" }]);
    expect(await checkPremiumAccess(db, "member@example.test", ENTRY_A)).toBe("allowed");
  });
});

describe("single decode", () => {
  test("premiumSlugOf collapses repeated slashes after its own decode", () => {
    expect(premiumSlugOf("/books/buku-a//content/02_x.html")).toBe(premiumSlugOf("/books/buku-a/content/02_x.html"));
    expect(premiumSlugOf("//books/buku-a/content/02_x.html")).toBe("buku-a");
    expect(premiumSlugOf("/books/buku-a/%2Fcontent%2F02_x.html")).toBe("buku-a");
  });

  test("isPremiumPublicPage collapses repeated slashes after its own decode", () => {
    expect(isPremiumPublicPage("/books/buku-a//content/01_x.html")).toBe(isPremiumPublicPage("/books/buku-a/content/01_x.html"));
    expect(isPremiumPublicPage("/books/buku-a//content/01_x.html")).toBe(true);
    expect(isPremiumPublicPage("/books/buku-a//content/02_x.html")).toBe(false);
  });
});

describe("canonical path", () => {
  test("canonical: premiumSlugOf finds the slug through backslash separators", () => {
    expect(premiumSlugOf("/books%5Cbuku-a/content/02_x.html")).toBe("buku-a");
    expect(premiumSlugOf("/books/buku-a%5Ccontent%5C02_x.html")).toBe("buku-a");
    expect(premiumSlugOf("/books\\buku-a\\content\\02_x.html")).toBe("buku-a");
  });

  test("canonical: premiumSlugOf still finds the slug when an encoded escape remains", () => {
    expect(premiumSlugOf("/books/buku-a/%2573earchindex.js")).toBe("buku-a");
  });

  test("canonical: backslash forms of searchindex and chapter 2 are not public", () => {
    expect(isPremiumPublicPage("/books/buku-a/%5Csearchindex.js")).toBe(false);
    expect(isPremiumPublicPage("/books/buku-a%5Csearchindex.js")).toBe(false);
    expect(isPremiumPublicPage("/books/buku-a%5Ccontent%5C02_x.html")).toBe(false);
  });

  test("canonical: an encoded escape left after the one decode is not public", () => {
    expect(isPremiumPublicPage("/books/buku-a/%2573earchindex.js")).toBe(false);
    expect(isPremiumPublicPage("/books/buku-a/%2541.css")).toBe(false);
  });

  test("canonical: ordinary public pages stay public", () => {
    expect(isPremiumPublicPage("/books/buku-a/")).toBe(true);
    expect(isPremiumPublicPage("/books/buku-a/content/01_x.html")).toBe(true);
    expect(isPremiumPublicPage("/books/buku-a/css/general.css")).toBe(true);
    expect(isPremiumPublicPage("/books/buku-a/book-1234.js")).toBe(true);
  });

  test("canonical: a literal percent that is not an escape is judged by the normal rules", () => {
    expect(isPremiumPublicPage("/books/buku-a/content/01_100%25.html")).toBe(true);
  });
});
