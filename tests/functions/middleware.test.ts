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

    // Should NOT have gated cache headers because it's treated like a public pass-through
    expect(response.headers.get("Cache-Control")).toBeNull();

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
    expect(location).toContain("redirect_url=https%3A%2F%2Fexample.com%2Fadmin%2Fdashboard");
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

    const validSessionId = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
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
        Cookie: `session_id=${validSessionId}`,
      },
    });

    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("<h1>Admin Dashboard</h1>", { status: 200 })),
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

    const validSessionId = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
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
        Cookie: `session_id=${validSessionId}`,
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
      next: mock(async () => new Response("<html>Home</html>", { status: 200 })),
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
      next: mock(async () =>
        new Response("OK", {
          status: 200,
          headers: { "Content-Security-Policy": "default-src 'none'" },
        })
      ),
    };

    const response = await onRequest(context as any);
    expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'");
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
    const validSessionId = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const req = mockRequest("https://example.com/admin/secret", {
      headers: {
        Accept: "text/html",
        Cookie: `session_id=${validSessionId}`,
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
});
