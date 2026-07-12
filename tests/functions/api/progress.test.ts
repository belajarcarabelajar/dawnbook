import { expect, test, describe } from "bun:test";
import { onRequest } from "../../../functions/api/progress";
import { createMockEnv, mockRequest } from "../../helpers/mocks";

const payload = Buffer.from(JSON.stringify({ sub: "user_123", exp: 9999999999 })).toString("base64");
const validToken = `header.${payload}.sig`;

describe("API: /api/progress", () => {
  test("GET returns 401 without valid JWT", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", { method: "GET" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(401);
  });

  test("POST returns 201 with valid JWT and append to completed_paths", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/progress", { 
      method: "POST", 
      headers: { "Authorization": `Bearer ${validToken}` },
      body: JSON.stringify({ bookSlug: "test-book", path: "/books/test-book/ch1.html", completed_path: "/books/test-book/ch1.html" })
    });
    
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.completed_paths).toEqual(["/books/test-book/ch1.html"]);
  });

  test("GET returns existing completed_paths", async () => {
    const env = createMockEnv();
    // Pre-populate mock D1
    env.DB.prepare = () => ({
      bind: () => ({
        first: async () => ({ last_read_path: "/books/test-book/ch1.html", completed_paths: '["/books/test-book/ch1.html"]' }),
        all: async () => ({ results: [] }),
        run: async () => ({ success: true })
      })
    }) as any;

    const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", { 
      method: "GET",
      headers: { "Authorization": `Bearer ${validToken}` },
    });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.path).toBe("/books/test-book/ch1.html");
    expect(data.completed_paths).toEqual(["/books/test-book/ch1.html"]);
  });

  test("Auth JWKS fetch utilizes Cloudflare edge caching", async () => {
    (global.fetch as any).mockClear();
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", { 
      method: "GET",
      headers: { "Authorization": `Bearer ${validToken}` },
    });
    
    await onRequest({ request: req, env } as any);
    
    const calls = (global.fetch as any).mock.calls;
    // The first call should be to the JWKS endpoint
    const jwksCall = calls.find((call: any[]) => typeof call[0] === 'string' && call[0].includes('.well-known/jwks.json'));
    expect(jwksCall).toBeDefined();
    
    // Check if Cloudflare cache options are present
    const initOptions = jwksCall[1];
    expect(initOptions).toBeDefined();
    expect(initOptions.cf).toBeDefined();
    expect(initOptions.cf.cacheEverything).toBe(true);
    expect(initOptions.cf.cacheTtl).toBeGreaterThan(0);
  });
});
