import { expect, test, describe } from "bun:test";
import { onRequest } from "../../../functions/api/books/index";
import { createMockEnv, mockRequest } from "../../helpers/mocks";

describe("API: /api/books", () => {
  test("POST returns 401 without valid JWT", async () => {
    const env = createMockEnv();
    const req = mockRequest("https://example.com/api/books", { method: "POST" });
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(401);
  });

  test("POST returns 201 with valid JWT", async () => {
    const env = createMockEnv();
    const payload = Buffer.from(JSON.stringify({ sub: "user_3FGEVcEVho4UC4uCE6gs3TfyVwV", exp: 9999999999 })).toString("base64");
    const validToken = `header.${payload}.sig`;
    const req = mockRequest("https://example.com/api/books", { 
      method: "POST", 
      headers: { "Authorization": `Bearer ${validToken}` },
      body: JSON.stringify({ bookSlug: "new-book", chapterTitle: "New Book", markdownContent: "Content" })
    });
    
    const response = await onRequest({ request: req, env } as any);
    expect(response.status).toBe(201);
  });
});
