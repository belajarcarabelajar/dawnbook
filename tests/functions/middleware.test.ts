import { expect, test, describe, mock, afterEach } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import { createMockEnv, mockRequest, setQueryHandler } from "../helpers/mocks";
import { __setDnsFetcherForTests, clearBotCache } from "../../functions/lib/bot-verify";

describe("Cloudflare Pages Edge Middleware (functions/_middleware.ts)", () => {
  afterEach(() => {
    __setDnsFetcherForTests(null);
    clearBotCache();
  });
  test("public path passes through next() and appends dawnbook_lang Set-Cookie header when cookie missing", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/", {}, "ID");

    let nextCalled = false;
    const context = {
      request: req,
      env: env,
      next: mock(async () => {
        nextCalled = true;
        return new Response("<html>Home</html>", {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
      }),
    };

    const response = await onRequest(context as any);
    expect(nextCalled).toBe(true);
    expect(response.status).toBe(200);

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain("dawnbook_lang=id");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("SameSite=Lax");
  });

  test("verified bot requesting gated path passes through and sets Vary: User-Agent", async () => {
    const env = createMockEnv();

    // Simulate a verified bot
    __setDnsFetcherForTests(async (urlStr: RequestInfo | URL) => {
      const url = new URL(urlStr as string);
      const type = url.searchParams.get("type");
      if (type === "PTR") {
        return new Response(JSON.stringify({
          Status: 0,
          Answer: [{ type: 12, data: "crawl-66-249-65-1.googlebot.com." }]
        }));
      } else if (type === "A") {
        return new Response(JSON.stringify({
          Status: 0,
          Answer: [{ type: 1, data: "66.249.65.1" }]
        }));
      }
      return new Response("{}", { status: 404 });
    });

    const req = mockRequest("https://example.com/admin/dashboard", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "CF-Connecting-IP": "66.249.65.1"
      }
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("Gated Content", { status: 200 })),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(200);
    expect(response.headers.get("Vary")).toContain("User-Agent");

    // The path is gated, so the bot pass-through must not be cacheable by a shared cache.
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");

    const text = await response.text();
    expect(text).toBe("Gated Content");
  });

  test("public path does NOT append Set-Cookie if dawnbook_lang cookie already present", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/", {
      headers: { Cookie: "dawnbook_lang=en" },
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("OK", { status: 200 })),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(200);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  test("unauthenticated HTML request to gated path redirects 302 to /sign-in with redirect_url param", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/admin/dashboard", {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("Gated Content")),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(302);

    const location = response.headers.get("Location");
    expect(location).not.toBeNull();
    expect(location).toContain("/sign-in");
    expect(location).toContain(
      "redirect_url=https%3A%2F%2Fexample.com%2Fadmin%2Fdashboard",
    );
  });

  test("unauthenticated non-HTML (API) request to gated path returns 401 JSON error", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/admin/data.json", {
      headers: { Accept: "application/json" },
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("{}")),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(401);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toBe("Cookie");

    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
    expect(json.message).toContain("Sign in at /sign-in");
  });

  test("authenticated request to gated path returns 200 with gated cache headers", async () => {
    const env = createMockEnv();

    const validSessionId =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    setQueryHandler(env, "SELECT", (sql) => {
      if (sql.includes("sessions")) {
        return [
          {
            id: validSessionId,
            user_id: "user_123",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString(),
            email: "admin@example.com",
            name: "Admin User",
            picture: "",
            role: "admin",
          },
        ];
      }
      return [];
    });

    const req = mockRequest("https://example.com/admin/dashboard", {
      headers: {
        Accept: "text/html",
        Cookie: `__Host-session_id=${validSessionId}`,
      },
    });

    const context = {
      request: req,
      env: env,
      next: mock(
        async () => new Response("<h1>Admin Dashboard</h1>", { status: 200 }),
      ),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toBe("Cookie");

    const text = await response.text();
    expect(text).toBe("<h1>Admin Dashboard</h1>");
  });

  test("authenticated non-HTML (API) request to gated path returns 200 with gated cache headers", async () => {
    const env = createMockEnv();

    const validSessionId =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    setQueryHandler(env, "SELECT", (sql) => {
      if (sql.includes("sessions")) {
        return [
          {
            id: validSessionId,
            user_id: "user_123",
            expires_at: new Date(Date.now() + 86400000).toISOString(),
            created_at: new Date().toISOString(),
            email: "admin@example.com",
            name: "Admin User",
            picture: "",
            role: "admin",
          },
        ];
      }
      return [];
    });

    const req = mockRequest("https://example.com/admin/data.json", {
      headers: {
        Accept: "application/json",
        Cookie: `__Host-session_id=${validSessionId}`,
      },
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response('{"data":1}', { status: 200 })),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toBe("Cookie");

    const json = await response.json();
    expect(json.data).toBe(1);
  });

  test("applies Content-Security-Policy to responses (F-105)", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/", {}, "US");

    const context = {
      request: req,
      env,
      next: mock(
        async () => new Response("<html>Home</html>", { status: 200 }),
      ),
    };

    const response = await onRequest(context as any);
    const csp = response.headers.get("Content-Security-Policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  test("does not override an existing Content-Security-Policy", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/", {}, "US");

    const context = {
      request: req,
      env,
      next: mock(
        async () =>
          new Response("OK", {
            status: 200,
            headers: { "Content-Security-Policy": "default-src 'none'" },
          }),
      ),
    };

    const response = await onRequest(context as any);
    expect(response.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'",
    );
  });

  // Hub pages run without 'unsafe-inline' in script-src; mdBook book pages
  // keep the previous policy until their inline scripts are moved out.
  const BOOK_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://*.googleusercontent.com https://analytics.google.com https://www.google.com https://cloudflareinsights.com; frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
  const STRICT_POLICY = "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://www.googletagmanager.com https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://challenges.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://*.googleusercontent.com https://analytics.google.com https://www.google.com https://cloudflareinsights.com; frame-src 'self' https://challenges.cloudflare.com https://www.youtube-nocookie.com https://www.youtube.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";

  async function fallbackCsp(path: string): Promise<string | null> {
    const env = createMockEnv();
    const context = {
      request: mockRequest(`https://example.com${path}`, {}, "US"),
      env,
      next: mock(async () => new Response("<html>x</html>", { status: 200 })),
    };
    const response = await onRequest(context as any);
    return response.headers.get("Content-Security-Policy");
  }

  test("CSP fallback: a book path gets the book policy, which equals the previous policy", async () => {
    const headers: Record<string, unknown> = await import("../../functions/lib/security-headers");
    expect(headers.BOOK_CONTENT_SECURITY_POLICY).toBe(BOOK_POLICY);
    expect(await fallbackCsp("/books/test-book/")).toBe(BOOK_POLICY);
  });

  test("CSP fallback: the hub home page gets the strict policy", async () => {
    expect(await fallbackCsp("/")).toBe(STRICT_POLICY);
  });

  test("CSP fallback: a path that only starts with the letters books gets the strict policy", async () => {
    expect(await fallbackCsp("/booksx")).toBe(STRICT_POLICY);
  });

  test("does not override existing security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/", {}, "US");

    const context = {
      request: req,
      env,
      next: mock(async () =>
        new Response("OK", {
          status: 200,
          headers: {
            "X-Frame-Options": "SAMEORIGIN",
            "X-Content-Type-Options": "custom",
            "Referrer-Policy": "no-referrer",
            "Permissions-Policy": "fullscreen=()",
          },
        })
      ),
    };

    const response = await onRequest(context as any);
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("X-Content-Type-Options")).toBe("custom");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("Permissions-Policy")).toBe("fullscreen=()");
  });

  test("internal error in middleware catches exception and returns 500 JSON", async () => {
    const env = createMockEnv();
    const validSessionId =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const req = mockRequest("https://example.com/admin/secret", {
      headers: {
        Accept: "text/html",
        Cookie: `__Host-session_id=${validSessionId}`,
      },
    });

    // Cause DB prepare to throw
    env.DB.prepare = mock(() => {
      throw new Error("Fatal DB Error");
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("Gated")),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const json = await response.json();
    expect(json.error).toBe("Internal Server Error");
    expect(json.message).toContain("unexpected error");
  });

  test("URIError in middleware is caught and returns 400 Bad Request JSON", async () => {
    const env = createMockEnv();
    const validSessionId =
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    // %E0%A4%A causes URIError when passed to decodeURIComponent
    const req = mockRequest("https://example.com/admin/secret/%E0%A4%A", {
      headers: {
        Accept: "text/html",
        Cookie: `__Host-session_id=${validSessionId}`,
      },
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("Gated")),
    };

    const response = await onRequest(context as any);
    expect(response.status).toBe(400);
    expect(response.headers.get("Content-Type")).toBe("application/json");

    const json = await response.json();
    expect(json.error).toBe("Bad Request");
    expect(json.message).toContain("Malformed URI component");
  });
  test("anonymous HTML request for a book searchindex redirects 302 to /sign-in", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/books/x/searchindex-a2c06330.js", {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    const next = mock(async () => new Response("window.search = {}"));
    const context = { request: req, env: env, next };

    const response = await onRequest(context as any);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("/sign-in");
    expect(next).not.toHaveBeenCalled();
  });

  test("anonymous fetch of a book searchindex returns 401", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/books/x/searchindex-a2c06330.js", {
      headers: { Accept: "*/*" },
    });

    const next = mock(async () => new Response("window.search = {}"));
    const context = { request: req, env: env, next };

    const response = await onRequest(context as any);
    expect(response.status).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
  test("anonymous HTML request for a double slash searchindex path redirects 302", async () => {
    const env = createMockEnv();
    setQueryHandler(env, "SELECT", () => []);

    const req = mockRequest("https://example.com/books/x//searchindex-a.js", {
      headers: { Accept: "text/html,application/xhtml+xml" },
    });

    const next = mock(async () => new Response("window.search = {}"));
    const context = { request: req, env: env, next };

    const response = await onRequest(context as any);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toContain("/sign-in");
    expect(next).not.toHaveBeenCalled();
  });

  test("bot cache: verified bot on a gated free chapter gets private, no-store", async () => {
    verifyGooglebotForCacheTests();
    const req = mockRequest("https://example.com/books/buku-gratis/content/02_x.html", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "CF-Connecting-IP": "66.249.65.1",
        Cookie: "dawnbook_lang=id",
      },
    });
    const next = mock(async () =>
      new Response("<h1>Bab 2</h1>", { status: 200, headers: { "Cache-Control": "public, max-age=3600" } }),
    );
    const response = await onRequest({ request: req, env: createMockEnv(), next } as any);
    expect(response.status).toBe(200);
    expect(next).toHaveBeenCalledTimes(1);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toContain("Cookie");
    expect(response.headers.get("Vary")).toContain("User-Agent");
    expect(await response.text()).toBe("<h1>Bab 2</h1>");
  });

  test("bot cache: public page via a verified bot keeps its original cache header", async () => {
    verifyGooglebotForCacheTests();
    const req = mockRequest("https://example.com/", {
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "CF-Connecting-IP": "66.249.65.1",
        Cookie: "dawnbook_lang=id",
      },
    });
    const next = mock(async () =>
      new Response("<h1>Hub</h1>", { status: 200, headers: { "Cache-Control": "public, max-age=60" } }),
    );
    const response = await onRequest({ request: req, env: createMockEnv(), next } as any);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
    expect(response.headers.get("Vary")).toContain("User-Agent");
  });
});

function verifyGooglebotForCacheTests() {
  __setDnsFetcherForTests(async (urlStr: RequestInfo | URL) => {
    const type = new URL(urlStr as string).searchParams.get("type");
    if (type === "PTR") {
      return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 12, data: "crawl-66-249-65-1.googlebot.com." }] }));
    }
    if (type === "A") {
      return new Response(JSON.stringify({ Status: 0, Answer: [{ type: 1, data: "66.249.65.1" }] }));
    }
    return new Response("{}", { status: 404 });
  });
}
