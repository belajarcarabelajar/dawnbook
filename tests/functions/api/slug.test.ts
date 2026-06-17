import { expect, test, describe } from "bun:test";
import { onRequest } from "../../../functions/api/books/[slug]";
import { createMockEnv, mockRequest } from "../../helpers/mocks";

describe("API: /api/books/[slug]", () => {
  test("GET returns 400 for invalid slug", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books/invalid slug!", { method: "GET" });
    const response = await onRequest({ request: req, env, params: { slug: "invalid slug!" } } as any);
    expect(response.status).toBe(400);
  });

  test("GET returns 404 for unknown slug", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books/unknown-slug", { method: "GET" });
    const response = await onRequest({ request: req, env, params: { slug: "unknown-slug" } } as any);
    expect(response.status).toBe(404);
  });
});
