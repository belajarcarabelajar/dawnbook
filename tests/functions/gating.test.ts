import { expect, test, describe, mock } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import { createMockEnv, mockRequest } from "../helpers/mocks";

describe("Edge Middleware Auth Gating", () => {
  test("unauthenticated raw HTTP fetch of a gated chapter does NOT return readable chapter body content", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/books/mybook/02-gated-chapter.html");
    req.headers.set("Accept", "text/html");
    
    const context = {
      request: req,
      env: env,
      next: mock(async () => new Response("<html><body>Secret content</body></html>", { headers: { "Content-Type": "text/html" } }))
    };

    const response = await onRequest(context as any);
    
    if (response.status === 200) {
      const text = await response.text();
      expect(text).not.toContain("Secret content");
    } else {
      expect(response.status).toBe(401);
    }
  });
});
