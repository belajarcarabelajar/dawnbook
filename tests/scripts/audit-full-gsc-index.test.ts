import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import {
  base64url,
  inspectUrl,
  getAccessTokenFromRefreshToken,
} from "../../scripts/audit-full-gsc-index";

describe("audit-full-gsc-index script", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("base64url", () => {
    it("should encode string to base64url format without =, +, or /", () => {
      const input = "Hello World?+/>=";
      const encoded = base64url(input);
      expect(encoded).not.toContain("=");
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(typeof encoded).toBe("string");
    });

    it("should encode Buffer to base64url format", () => {
      const buf = Buffer.from([255, 254, 253, 252, 251]);
      const encoded = base64url(buf);
      expect(encoded).not.toContain("=");
      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
    });
  });

  describe("inspectUrl", () => {
    const token = "mock-token-123";
    const inspectionUrl = "https://dawnbook.belajarcarabelajar.com/books/test/chap1";
    const siteUrl = "sc-domain:dawnbook.belajarcarabelajar.com";

    it("should return inspection results when GSC API responds with indexStatusResult", async () => {
      global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        expect(url.toString()).toBe(
          "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        );
        expect(init?.method).toBe("POST");
        const headers = init?.headers as Record<string, string>;
        expect(headers["Authorization"]).toBe("Bearer mock-token-123");

        return new Response(
          JSON.stringify({
            inspectionResult: {
              indexStatusResult: {
                verdict: "PASS",
                coverageState: "Submitted and indexed",
                indexingState: "INDEXED",
                googleCanonical: "https://dawnbook.belajarcarabelajar.com/books/test/chap1",
                userCanonical: "https://dawnbook.belajarcarabelajar.com/books/test/chap1",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof global.fetch;

      const result = await inspectUrl(token, inspectionUrl, siteUrl);

      expect(result).toEqual({
        url: inspectionUrl,
        verdict: "PASS",
        coverageState: "Submitted and indexed",
        indexingState: "INDEXED",
        googleCanonical: "https://dawnbook.belajarcarabelajar.com/books/test/chap1",
        userCanonical: "https://dawnbook.belajarcarabelajar.com/books/test/chap1",
      });
    });

    it("should fallback to UNKNOWN when status result fields are missing", async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            inspectionResult: {
              indexStatusResult: {},
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof global.fetch;

      const result = await inspectUrl(token, inspectionUrl, siteUrl);

      expect(result.verdict).toBe("UNKNOWN");
      expect(result.coverageState).toBe("UNKNOWN");
      expect(result.indexingState).toBe("UNKNOWN");
    });

    it("should handle GSC API error response with data.error", async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            error: {
              code: 403,
              message: "User does not have access to this property.",
              status: "PERMISSION_DENIED",
            },
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof global.fetch;

      const result = await inspectUrl(token, inspectionUrl, siteUrl);

      expect(result).toEqual({
        url: inspectionUrl,
        verdict: "ERROR",
        coverageState: "User does not have access to this property.",
        indexingState: "ERROR",
      });
    });

    it("should handle GSC API response with neither inspectionResult nor data.error (NO_RESULT)", async () => {
      global.fetch = (async () => {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof global.fetch;

      const result = await inspectUrl(token, inspectionUrl, siteUrl);

      expect(result).toEqual({
        url: inspectionUrl,
        verdict: "ERROR",
        coverageState: "NO_RESULT",
        indexingState: "ERROR",
      });
    });

    it("should handle catch block when fetch throws network error", async () => {
      global.fetch = (async () => {
        throw new Error("Network connectivity lost");
      }) as typeof global.fetch;

      const result = await inspectUrl(token, inspectionUrl, siteUrl);

      expect(result).toEqual({
        url: inspectionUrl,
        verdict: "ERROR",
        coverageState: "Network connectivity lost",
        indexingState: "ERROR",
      });
    });
  });

  describe("getAccessTokenFromRefreshToken", () => {
    it("should return access token on successful refresh", async () => {
      global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
        expect(url.toString()).toBe("https://oauth2.googleapis.com/token");
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            access_token: "new-access-token-xyz",
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      }) as typeof global.fetch;

      const token = await getAccessTokenFromRefreshToken(
        "client-id-123",
        "client-secret-456",
        "refresh-token-789",
      );

      expect(token).toBe("new-access-token-xyz");
    });

    it("should throw error when refresh token exchange fails", async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({
            error: "invalid_grant",
            error_description: "Token has been expired or revoked.",
          }),
          { status: 400 },
        );
      }) as typeof global.fetch;

      expect(
        getAccessTokenFromRefreshToken(
          "client-id-123",
          "client-secret-456",
          "refresh-token-789",
        ),
      ).rejects.toThrow("Failed to refresh OAuth token:");
    });
  });
});
