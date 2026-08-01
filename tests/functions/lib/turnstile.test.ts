import { expect, test, describe, afterEach } from "bun:test";
import { verifyTurnstileToken } from "../../../functions/lib/turnstile";

describe("functions/lib/turnstile.ts", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("returns false immediately when token or secretKey is missing", async () => {
    expect(await verifyTurnstileToken("", "secret_123")).toBe(false);
    expect(await verifyTurnstileToken("token_123", "")).toBe(false);
    expect(await verifyTurnstileToken("", "")).toBe(false);
  });

  test("returns true when Cloudflare siteverify responds with success: true", async () => {
    global.fetch = async (url: string | URL | Request, init?: RequestInit) => {
      expect(url.toString()).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
      expect(init?.method).toBe("POST");
      const bodyStr = init?.body?.toString() || "";
      expect(bodyStr).toContain("secret=secret_123");
      expect(bodyStr).toContain("response=valid_token");
      expect(bodyStr).toContain("remoteip=1.2.3.4");
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };

    const isValid = await verifyTurnstileToken("valid_token", "secret_123", "1.2.3.4");
    expect(isValid).toBe(true);
  });

  test("returns false when siteverify returns success: false with error-codes", async () => {
    global.fetch = async () =>
      new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), { status: 200 });

    const isValid = await verifyTurnstileToken("invalid_token", "secret_123");
    expect(isValid).toBe(false);
  });

  test("returns false when siteverify HTTP status is non-2xx", async () => {
    global.fetch = async () => new Response("Internal Server Error", { status: 500, statusText: "Server Error" });

    const isValid = await verifyTurnstileToken("token_123", "secret_123");
    expect(isValid).toBe(false);
  });

  test("returns false when fetch throws network error or JSON parsing fails", async () => {
    global.fetch = async () => {
      throw new Error("Network unreachable");
    };
    expect(await verifyTurnstileToken("token_123", "secret_123")).toBe(false);

    global.fetch = async () => new Response("not json", { status: 200 });
    expect(await verifyTurnstileToken("token_123", "secret_123")).toBe(false);
  });
});
