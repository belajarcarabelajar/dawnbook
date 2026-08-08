import { describe, it, expect, mock } from "bun:test";
import { onRequest } from "../../../../../functions/api/books/[slug]/view";
import { createMockEnv, setRunHandler, setQueryHandler } from "../../../../helpers/mocks";

describe("POST /api/books/[slug]/view", () => {
  it("allows requests with a valid X-Requested-With header", async () => {
    const env = createMockEnv();
    let queryExecuted = false;

    setRunHandler(env, "UPDATE", (sql, params) => {
      if (sql.includes("view_count") && params[0] === "test-book") {
        queryExecuted = true;
      }
      return { success: true };
    });

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const context = {
      request,
      env,
      params: { slug: "test-book" },
      waitUntil: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(200);
    expect(queryExecuted).toBe(true);
  });

  it("blocks requests with an invalid X-Requested-With header", async () => {
    const env = createMockEnv();

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: {
        "X-Requested-With": "InvalidValue",
      },
    });

    const context = {
      request,
      env,
      params: { slug: "test-book" },
      waitUntil: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: "Forbidden: Invalid CSRF protection header" });
  });

  it("blocks requests with missing X-Requested-With header", async () => {
    const env = createMockEnv();

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
    });

    const context = {
      request,
      env,
      params: { slug: "test-book" },
      waitUntil: () => {},
      next: () => Promise.resolve(new Response()),
      data: {},
    } as any;

    const response = await onRequest(context);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toEqual({ error: "Forbidden: Invalid CSRF protection header" });
  });

  it("returns 429 when the rate limit is exceeded", async () => {
    const env = createMockEnv();
    const now = Math.floor(Date.now() / 1000);
    // Over the 120/10min per-IP limit.
    setQueryHandler(env, "INSERT", () => [{ count: 121, window_start: now, expires_at: now + 600 }]);

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: "Rate limit exceeded" });
  });

  it("returns 405 Method Not Allowed when method is not POST", async () => {
    const env = createMockEnv();
    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", { method: "GET" });
    const response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({ error: "Method not allowed" });
  });

  it("returns 400 Bad Request for invalid slug format", async () => {
    const env = createMockEnv();
    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/bad%20slug!/view", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    const response = await onRequest({ request, env, params: { slug: "bad slug!" } } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid slug format" });
  });

  it("returns 500 Internal Server Error when D1 update fails or throws", async () => {
    const env = createMockEnv();
    setRunHandler(env, "UPDATE", () => ({ success: false }));

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
    let response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Failed to update view count" });

    // DB Exception
    env.DB.prepare = mock(() => {
      throw new Error("DB Error");
    });
    response = await onRequest({ request, env, params: { slug: "test-book" } } as any);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});
