import { mock } from "bun:test";

export const mockD1Database = {
  prepare: mock(() => ({
    bind: mock(() => ({
      all: mock(async () => ({ results: [] })),
      first: mock(async () => null),
      run: mock(async () => ({ success: true }))
    }))
  }))
};

export const createMockEnv = () => ({
  DB: mockD1Database,
  CLERK_SECRET_KEY: "test_secret_key",
  CLERK_PUBLISHABLE_KEY: "pk_test_Y2xlcmsuYXBwLmRldiQ="
});

export const mockRequest = (url: string, init?: RequestInit, country?: string) => {
  const req = new Request(url, init) as any;
  req.cf = { country: country || "US" };
  return req;
};

export const mockFetch = mock(async (req: Request | string, init?: RequestInit) => {
  const url = typeof req === 'string' ? req : req.url;
  if (url.includes('.well-known/jwks.json')) {
    return new Response("Not Found", { status: 404 });
  }
  if (url.includes('/v1/tokens/verify')) {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    if (body.token === "valid_token") {
      return new Response(JSON.stringify({ sub: "user_123" }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "invalid token" }), { status: 401 });
  }
  return new Response("Not Found", { status: 404 });
});

global.fetch = mockFetch as any;
