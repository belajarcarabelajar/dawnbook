import { expect, test, describe } from "bun:test";
import { BookService } from "../../apps/admin/src/services/book-service";
import { mockFetch } from "../helpers/mocks";

describe("Admin BookService", () => {
  test("fetchBooks returns mapped books on success", async () => {
    // We already mocked global fetch in helpers/mocks.ts but we need to override it for this specific test
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
      await expect(BookService.fetchBooks()).rejects.toThrow("Failed to fetch books: 404 ");
    } finally {
      global.fetch = originalFetch;
    }
  });
});
