import { expect, test, describe } from "bun:test";
import { onRequest } from "../functions/api/books/index";

// Mock DB with simulated latency
const simulateLatency = async () => new Promise(resolve => setTimeout(resolve, 50)); // 50ms latency

let callCount = 0;

const mockD1Database = {
  prepare: (query: string) => ({
    bind: (...args: any[]) => ({
      run: async () => {
        callCount++;
        await simulateLatency();
        return { success: true };
      }
    })
  }),
  batch: async (statements: any[]) => {
    callCount++;
    await simulateLatency();
    return statements.map(() => ({ success: true }));
  }
};

const createMockEnv = () => ({
  DB: mockD1Database,
  CLERK_SECRET_KEY: "test_secret_key",
  CLERK_PUBLISHABLE_KEY: "pk_test_placeholder"
});

const mockRequest = (url: string, init?: RequestInit) => {
  const req = new Request(url, init) as any;
  req.cf = { country: "US" };
  return req;
};

// Mock fetch for JWKS / verify API to avoid ERR_INVALID_URL
const mockFetch = async (req: Request | string, init?: RequestInit) => {
  const url = typeof req === 'string' ? req : req.url;
  if (url.includes('.well-known/jwks.json')) {
    return new Response("Not Found", { status: 404 });
  }
  if (url.includes('/v1/tokens/verify')) {
    return new Response(JSON.stringify({ sub: "user_123", publicMetadata: { role: "admin" } }), { status: 200 });
  }
  return new Response("Not Found", { status: 404 });
};

global.fetch = mockFetch as any;

const runBenchmark = async () => {
  callCount = 0;
  const env = createMockEnv();
  const payloadStr = Buffer.from(JSON.stringify({ sub: "user_123", publicMetadata: { role: "admin" }, exp: 9999999999 })).toString("base64");
  const validToken = `header.${payloadStr}.sig`;

  // Create a large markdown content of 1.5MB (50 chunks)
  const largeContent = "a".repeat(1500000);

  const req = mockRequest("https://example.com/api/books", {
    method: "POST",
    headers: { "Authorization": `Bearer ${validToken}` },
    body: JSON.stringify({ bookSlug: "perf-book", chapterTitle: "Perf Book", markdownContent: largeContent })
  });

  const start = performance.now();
  const response = await onRequest({ request: req, env } as any);
  const end = performance.now();

  console.log(`Time taken: ${(end - start).toFixed(2)}ms`);
  console.log(`Status: ${response.status}`);
  console.log(`DB call count: ${callCount}`);
};

runBenchmark();
