import { expect, test, describe, afterEach } from "bun:test";
import {
  exchangeCode,
  fetchUserInfo,
  constantTimeEqual,
  isValidState,
  safeRedirectPath,
  randomToken,
  randomSessionId,
  randomState,
} from "../../../functions/lib/oauth";

describe("functions/lib/oauth.ts unit tests", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test("randomToken, randomSessionId, and randomState generate hex strings", () => {
    expect(randomToken(16)).toMatch(/^[a-f0-9]{32}$/);
    expect(randomSessionId()).toMatch(/^[a-f0-9]{64}$/);
    expect(randomState()).toMatch(/^[a-f0-9]{32}$/);
  });

  test("exchangeCode throws Error on non-2xx HTTP response from Google token endpoint", async () => {
    global.fetch = (async () => new Response("invalid_grant", { status: 400 })) as unknown as typeof fetch;

    expect(
      exchangeCode({
        code: "invalid_code",
        clientId: "client_id",
        clientSecret: "client_secret",
        redirectUri: "https://example.com/callback",
      })
    ).rejects.toThrow("Google token exchange failed: 400 invalid_grant");
  });

  test("exchangeCode returns token payload on 200 OK", async () => {
    global.fetch = (async () =>
      new Response(JSON.stringify({ access_token: "access_123", expires_in: 3600, token_type: "Bearer" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch;

    const res = await exchangeCode({
      code: "valid_code",
      clientId: "client_id",
      clientSecret: "client_secret",
      redirectUri: "https://example.com/callback",
    });
    expect(res.access_token).toBe("access_123");
  });

  test("fetchUserInfo throws Error on non-2xx HTTP response from Google userinfo endpoint", async () => {
    global.fetch = (async () => new Response("Unauthorized", { status: 401 })) as unknown as typeof fetch;

    expect(fetchUserInfo("bad_token")).rejects.toThrow("Google userinfo failed: 401 Unauthorized");
  });

  test("fetchUserInfo throws Error when mandatory fields (sub, email) are missing", async () => {
    global.fetch = (async () =>
      new Response(JSON.stringify({ name: "User Without Sub Or Email" }), { status: 200 })) as unknown as typeof fetch;

    expect(fetchUserInfo("token")).rejects.toThrow("Google userinfo missing required fields (sub, email)");
  });

  test("constantTimeEqual compares strings in constant time", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });

  test("isValidState validates 32+ char hex strings", () => {
    expect(isValidState("a".repeat(32))).toBe(true);
    expect(isValidState("a".repeat(31))).toBe(false);
    expect(isValidState("invalid_hex_string")).toBe(false);
    expect(isValidState(null)).toBe(false);
  });

  test("safeRedirectPath enforces same-origin relative paths", () => {
    expect(safeRedirectPath("/books/intro")).toBe("/books/intro");
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("path/without/slash")).toBe("/");
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
  });

  describe("safe redirect", () => {
    const BASE = "https://dawnbook.example/api/auth/callback";

    // URL parsing strips TAB, LF and CR, so "/\t/evil.com" resolves to
    // https://evil.com/; the check must hold after parsing, not on raw text.
    for (const input of [
      "/\t/evil.com",
      "/\n/evil.com",
      "/\r/evil.com",
      "/%09/evil.com",
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "javascript:alert(1)",
      "/\u0000/evil.com",
      "/\u007f/evil.com",
      // Dot segments can normalise to a "//" path after parsing.
      "/a/..//evil.com",
    ]) {
      test(`safe redirect keeps ${JSON.stringify(input)} on the site`, () => {
        const out = safeRedirectPath(input);
        expect(out.startsWith("/")).toBe(true);
        expect(out.startsWith("//")).toBe(false);
        expect(new URL(out, BASE).origin).toBe("https://dawnbook.example");
      });
    }

    test("safe redirect refuses control characters outright", () => {
      expect(safeRedirectPath("/\t/evil.com")).toBe("/");
      expect(safeRedirectPath("/\n/evil.com")).toBe("/");
      expect(safeRedirectPath("/\u0000/evil.com")).toBe("/");
      expect(safeRedirectPath("/\u007f/evil.com")).toBe("/");
    });

    test("safe redirect keeps an encoded tab as a literal same-site path", () => {
      expect(safeRedirectPath("/%09/evil.com")).toBe("/%09/evil.com");
    });

    test("safe redirect leaves a normal chapter path with query and hash unchanged", () => {
      expect(safeRedirectPath("/books/x/content/02_a.html?y=1#z")).toBe(
        "/books/x/content/02_a.html?y=1#z",
      );
    });
  });
});
