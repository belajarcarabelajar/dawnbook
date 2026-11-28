import { expect, test, describe, mock, afterEach } from "bun:test";
import { onRequest } from "../../functions/_middleware";
import { createMockEnv, mockRequest } from "../helpers/mocks";
import { __setDnsFetcherForTests, clearBotCache } from "../../functions/lib/bot-verify";

// Search Console listed /api/stats and /api/books?content=false as "Crawled -
// currently not indexed"; robots.txt must stay open because the hub fetches
// these APIs while Google renders it, so the header is the only lever.
async function fetchThroughMiddleware(url: string, contentType: string): Promise<Response> {
  const context = {
    request: mockRequest(url, { headers: { Cookie: "dawnbook_lang=id" } }),
    env: createMockEnv(),
    next: mock(async () =>
      new Response("{}", { status: 200, headers: { "Content-Type": contentType } }),
    ),
  };
  return onRequest(context as any);
}

describe("X-Robots-Tag noindex on /api/* responses", () => {
  afterEach(() => {
    __setDnsFetcherForTests(null);
    clearBotCache();
  });

  test("/api/stats carries X-Robots-Tag: noindex", async () => {
    const response = await fetchThroughMiddleware("https://dawnbook.com/api/stats", "application/json");
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  test("/api/books?content=false carries X-Robots-Tag: noindex", async () => {
    const response = await fetchThroughMiddleware(
      "https://dawnbook.com/api/books?content=false",
      "application/json",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  test("a public book root has no X-Robots-Tag", async () => {
    const response = await fetchThroughMiddleware(
      "https://dawnbook.com/books/some-free-book/",
      "text/html",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });

  test("a hub page has no X-Robots-Tag", async () => {
    const response = await fetchThroughMiddleware("https://dawnbook.com/about", "text/html");
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });
});
