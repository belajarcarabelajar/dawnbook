import { describe, expect, it } from "bun:test";
import {
  randomToken,
  randomSessionId,
  randomState,
  buildAuthUrl,
  constantTimeEqual,
  safeRedirectPath,
  isValidState,
  GOOGLE_AUTH_URL,
  SCOPES,
} from "../../../functions/lib/oauth";

describe("oauth.ts", () => {
  describe("random generators", () => {
    it("randomToken generates hex string of correct length", () => {
      const token = randomToken(16);
      expect(token).toHaveLength(32);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);

      const token2 = randomToken(16);
      expect(token).not.toEqual(token2);
    });

    it("randomSessionId generates 64-char hex string", () => {
      const sessionId = randomSessionId();
      expect(sessionId).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(sessionId)).toBe(true);
    });

    it("randomState generates 32-char hex string", () => {
      const state = randomState();
      expect(state).toHaveLength(32);
      expect(/^[a-f0-9]{32}$/.test(state)).toBe(true);
    });
  });

  describe("buildAuthUrl", () => {
    it("builds the correct Google consent URL", () => {
      const url = buildAuthUrl({
        clientId: "test-client-id",
        redirectUri: "https://example.com/callback",
        state: "test-state",
      });

      const parsedUrl = new URL(url);
      expect(parsedUrl.origin + parsedUrl.pathname).toBe(GOOGLE_AUTH_URL);
      expect(parsedUrl.searchParams.get("client_id")).toBe("test-client-id");
      expect(parsedUrl.searchParams.get("redirect_uri")).toBe(
        "https://example.com/callback",
      );
      expect(parsedUrl.searchParams.get("response_type")).toBe("code");
      expect(parsedUrl.searchParams.get("scope")).toBe(SCOPES.join(" "));
      expect(parsedUrl.searchParams.get("state")).toBe("test-state");
      expect(parsedUrl.searchParams.get("access_type")).toBe("online");
      expect(parsedUrl.searchParams.get("prompt")).toBe("select_account");
    });
  });

  describe("constantTimeEqual", () => {
    it("returns true for identical strings", () => {
      expect(constantTimeEqual("hello", "hello")).toBe(true);
      expect(constantTimeEqual("", "")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      expect(constantTimeEqual("hello", "world")).toBe(false);
      expect(constantTimeEqual("abc", "abd")).toBe(false);
    });

    it("returns false for strings of different lengths", () => {
      expect(constantTimeEqual("hello", "hello ")).toBe(false);
      expect(constantTimeEqual("hello", "he")).toBe(false);
    });
  });

  describe("safeRedirectPath", () => {
    it("returns '/' for null/undefined/empty", () => {
      expect(safeRedirectPath(null)).toBe("/");
      expect(safeRedirectPath(undefined)).toBe("/");
      expect(safeRedirectPath("")).toBe("/");
      expect(safeRedirectPath(123 as any)).toBe("/");
    });

    it("returns '/' for paths not starting with '/'", () => {
      expect(safeRedirectPath("https://example.com")).toBe("/");
      expect(safeRedirectPath("foo/bar")).toBe("/");
    });

    it("returns '/' for paths starting with '//' (protocol-relative)", () => {
      expect(safeRedirectPath("//example.com")).toBe("/");
      expect(safeRedirectPath("///foo")).toBe("/");
    });

    it("returns '/' if path contains newline or carriage return", () => {
      expect(safeRedirectPath("/foo\nbar")).toBe("/");
      expect(safeRedirectPath("/foo\rbar")).toBe("/");
      expect(safeRedirectPath("/foo\r\nbar")).toBe("/");
    });

    it("returns the input for safe same-origin relative paths", () => {
      expect(safeRedirectPath("/")).toBe("/");
      expect(safeRedirectPath("/foo/bar")).toBe("/foo/bar");
      expect(safeRedirectPath("/login?redirect=/home")).toBe(
        "/login?redirect=/home",
      );
    });
  });

  describe("isValidState", () => {
    it("returns false for non-strings or empty strings", () => {
      expect(isValidState(null)).toBe(false);
      expect(isValidState(undefined)).toBe(false);
      expect(isValidState("")).toBe(false);
      expect(isValidState(123 as any)).toBe(false);
    });

    it("returns true for valid 32+ char hex strings", () => {
      expect(isValidState("a".repeat(32))).toBe(true);
      expect(isValidState("0123456789abcdef0123456789abcdef")).toBe(true);
      expect(isValidState("a".repeat(64))).toBe(true);
    });

    it("returns false for strings shorter than 32 chars", () => {
      expect(isValidState("a".repeat(31))).toBe(false);
    });

    it("returns false for non-hex characters", () => {
      expect(isValidState("g".repeat(32))).toBe(false); // 'g' is not hex
      expect(isValidState("a".repeat(31) + "G")).toBe(false); // uppercase not allowed by regex
    });
  });
});
