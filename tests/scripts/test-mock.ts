import { test, expect } from "bun:test";
import { mockRequest, createMockEnv } from "./tests/helpers/mocks";
import { onRequest } from "./functions/api/progress";

const payload = Buffer.from(JSON.stringify({ sub: "user_123", exp: 9999999999 })).toString("base64");
const validToken = `header.${payload}.sig`;

test("check fetch calls", async () => {
  // reset mock
  (global.fetch as any).mockClear();
  const env = createMockEnv();
  const req = mockRequest("https://example.com/api/progress?bookSlug=test-book", { 
    method: "GET",
    headers: { "Authorization": `Bearer ${validToken}` },
  });
  
  await onRequest({ request: req, env } as any);
  
  const calls = (global.fetch as any).mock.calls;
  console.log(calls.length);
  if (calls.length > 0) {
    console.log(calls[0][1]?.cf);
  }
});
