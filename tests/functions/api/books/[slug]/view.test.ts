import { describe, it, expect, mock } from "bun:test";
import { onRequest } from "../../../../../functions/api/books/[slug]/view";
import { createMockEnv, setRunHandler } from "../../../../helpers/mocks";

describe("POST /api/books/[slug]/view", () => {
  it("allows requests with a valid Origin header", async () => {
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
        Origin: "https://dawnbook.belajarcarabelajar.com",
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

  it("allows requests with a valid Referer header when Origin is missing", async () => {
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
        Referer: "https://dawnbook.belajarcarabelajar.com/books/test-book/",
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

  it("blocks requests with a mismatched Origin header", async () => {
    const env = createMockEnv();

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: {
        Origin: "https://evil.com",
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
    expect(body).toEqual({ error: "Forbidden: Invalid origin" });
  });

  it("blocks requests with a mismatched Referer header", async () => {
    const env = createMockEnv();

    const request = new Request("https://dawnbook.belajarcarabelajar.com/api/books/test-book/view", {
      method: "POST",
      headers: {
        Referer: "https://evil.com/some/path",
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
    expect(body).toEqual({ error: "Forbidden: Invalid origin" });
  });

  it("blocks requests with no Origin or Referer header", async () => {
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
    expect(body).toEqual({ error: "Forbidden: Invalid origin" });
  });
});
