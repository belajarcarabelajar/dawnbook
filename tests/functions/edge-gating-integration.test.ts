import { expect, test, describe, mock } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import { createMockEnv, mockRequest, setQueryHandler } from "../helpers/mocks";

describe("Edge Gating Integration (Human Visitors vs Search Engine Bots)", () => {
  test("human visitor accessing chapter 1 preview gets 200 OK", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/books/piaget/01_intro.html", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    });

    const context = {
      request: req,
      env,
      next: mock(async () => new Response("Chapter 1 Content", { status: 200 })),
    };

    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
  });

  test("unauthenticated human visitor accessing chapter 2 gets redirected 302 to /sign-in", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/books/piaget/02_konsep.html", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
    });

    const context = {
      request: req,
      env,
      next: mock(async () => new Response("Gated Content")),
    };

    const res = await onRequest(context as any);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("/sign-in");
  });

  test("Search Engine Bot (Googlebot) accessing chapter 2 bypasses gating and gets 200 OK", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/books/piaget/02_konsep.html", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    const context = {
      request: req,
      env,
      next: mock(async () => new Response("Chapter 2 Content for Googlebot", { status: 200 })),
    };

    const res = await onRequest(context as any);
    expect(res.status).toBe(200);
    expect(res.headers.get("Vary")).toContain("User-Agent");
  });
});
