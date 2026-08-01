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
    global.fetch = async () => new Response("invalid_grant", { status: 400 });

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
    global.fetch = async () =>
      new Response(JSON.stringify({ access_token: "access_123", expires_in: 3600, token_type: "Bearer" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const res = await exchangeCode({
      code: "valid_code",
      clientId: "client_id",
      clientSecret: "client_secret",
      redirectUri: "https://example.com/callback",
    });
    expect(res.access_token).toBe("access_123");
  });

  test("fetchUserInfo throws Error on non-2xx HTTP response from Google userinfo endpoint", async () => {
    global.fetch = async () => new Response("Unauthorized", { status: 401 });

    expect(fetchUserInfo("bad_token")).rejects.toThrow("Google userinfo failed: 401 Unauthorized");
  });

  test("fetchUserInfo throws Error when mandatory fields (sub, email) are missing", async () => {
    global.fetch = async () =>
      new Response(JSON.stringify({ name: "User Without Sub Or Email" }), { status: 200 });

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
});
