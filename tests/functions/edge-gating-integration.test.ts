import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import {
  clearBotCache,
  __setDnsFetcherForTests,
} from "../../functions/lib/bot-verify";
import { createMockEnv, mockRequest, setQueryHandler } from "../helpers/mocks";

/** Minimal DoH JSON responder for the tests below. */
function dohResponder(answers: Record<string, string[]>) {
  return async (input: RequestInfo | URL): Promise<Response> => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url
    );
    const name = url.searchParams.get("name") ?? "";
    const type = url.searchParams.get("type") ?? "";
    const data = answers[`${name}|${type}`];
    if (!data) {
      return new Response(JSON.stringify({ Status: 3 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    const recordType = type === "PTR" ? 12 : type === "A" ? 1 : 28;
    return new Response(
      JSON.stringify({
        Status: 0,
        Answer: data.map((d) => ({ name, type: recordType, TTL: 3600, data: d })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };
}

beforeEach(() => {
  clearBotCache();
});

afterEach(() => {
  __setDnsFetcherForTests(null);
});

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

  test("VERIFIED Googlebot (matching UA + DNS-confirmed IP) accessing chapter 2 bypasses gating and gets 200 OK", async () => {
    __setDnsFetcherForTests(
      dohResponder({
        "1.65.249.66.in-addr.arpa|PTR": ["crawl-66-249-65-1.googlebot.com."],
        "crawl-66-249-65-1.googlebot.com|A": ["66.249.65.1"],
      })
    );

    const env = createMockEnv();
    const req = mockRequest("https://example.com/books/piaget/02_konsep.html", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "CF-Connecting-IP": "66.249.65.1",
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

  test("SPOOFED Googlebot User-Agent from a non-bot IP does NOT bypass gating (302 to /sign-in)", async () => {
    // The DNS records do not identify 203.0.113.7 as a crawler.
    __setDnsFetcherForTests(
      dohResponder({
        "7.0.113.203.in-addr.arpa|PTR": ["203-113-0-7.dynamic.example.com."],
      })
    );

    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/books/piaget/02_konsep.html", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "CF-Connecting-IP": "203.0.113.7",
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
    // The pass-through branch adds Vary: User-Agent; the gated branch must not.
    expect(res.headers.get("Vary") ?? "").not.toContain("User-Agent");
  });
});
