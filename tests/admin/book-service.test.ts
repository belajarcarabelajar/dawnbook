import { expect, test, describe } from "bun:test";
import { BookService } from "../../apps/admin/src/services/book-service";

describe("Admin BookService", () => {
  test("fetchBooks returns mapped books on success", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({ books: [{ slug: "test", title: "Test Book" }] }));

    try {
      const books = await BookService.fetchBooks();
      expect(books).toEqual([{ slug: "test", title: "Test Book" }]);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("fetchBooks throws on non-ok response", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response("Not Found", { status: 404 });

    try {
      await expect(BookService.fetchBooks()).rejects.toThrow("Failed to fetch books: 404");
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("deleteBook returns success message on 200", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () =>
      new Response(JSON.stringify({ success: true, message: "Book deleted" }), { status: 200 });

    try {
      const result = await BookService.deleteBook("foo");
      expect(result).toEqual({ success: true, message: "Book deleted" });
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("deleteBook returns friendly message on 401", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    try {
      const result = await BookService.deleteBook("foo");
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/sign in/i);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("deleteBook returns friendly message on 403", async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    try {
      const result = await BookService.deleteBook("foo");
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/admin/i);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test("publishChapter does NOT include an Authorization header (cookie-based auth)", async () => {
    const originalFetch = global.fetch;
    let captured: RequestInit | undefined;
    global.fetch = async (_url, init) => {
      captured = init;
      return new Response(JSON.stringify({ success: true, message: "Published" }), { status: 200 });
    };

    try {
      await BookService.publishChapter({
        bookSlug: "x",
        chapterTitle: "t",
        markdownContent: "c",
      });
      expect(captured).toBeDefined();
      const headers = (captured!.headers ?? {}) as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
      expect(captured!.credentials).toBe("same-origin");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
