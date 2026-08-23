import { describe, expect, test, afterEach } from "bun:test";
import crypto from "crypto";
import {
  inspectUrl,
  getAccessTokenFromRefreshToken,
  getAccessToken,
} from "../../scripts/audit-full-gsc-index";

describe("audit-full-gsc-index", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("inspectUrl", () => {
    test("returns formatted InspectionResult when GSC API responds with indexStatusResult", async () => {
      const mockResult = {
        inspectionResult: {
          indexStatusResult: {
            verdict: "PASS",
            coverageState: "Submitted and indexed",
            indexingState: "INDEXED",
            googleCanonical: "https://dawnbook.belajarcarabelajar.com/books/sample/",
            userCanonical: "https://dawnbook.belajarcarabelajar.com/books/sample/",
          },
        },
      };

      global.fetch = (async () => {
        return new Response(JSON.stringify(mockResult), { status: 200 });
      }) as any;

      const result = await inspectUrl(
        "mock-token",
        "https://dawnbook.belajarcarabelajar.com/books/sample/",
        "sc-domain:dawnbook.belajarcarabelajar.com"
      );

      expect(result.url).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
      expect(result.verdict).toBe("PASS");
      expect(result.coverageState).toBe("Submitted and indexed");
      expect(result.indexingState).toBe("INDEXED");
      expect(result.googleCanonical).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
      expect(result.userCanonical).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
    });

    test("uses default UNKNOWN fallback values when indexStatusResult fields are missing", async () => {
      const mockResult = {
        inspectionResult: {
          indexStatusResult: {},
        },
      };

      global.fetch = (async () => {
        return new Response(JSON.stringify(mockResult), { status: 200 });
      }) as any;

      const result = await inspectUrl(
        "mock-token",
        "https://dawnbook.belajarcarabelajar.com/books/sample/",
        "sc-domain:dawnbook.belajarcarabelajar.com"
      );

      expect(result.url).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
      expect(result.verdict).toBe("UNKNOWN");
      expect(result.coverageState).toBe("UNKNOWN");
      expect(result.indexingState).toBe("UNKNOWN");
    });

    test("returns ERROR verdict and error message when API returns error payload", async () => {
      const mockErrorResponse = {
        error: {
          code: 403,
          message: "User does not have sufficient permission for this site.",
          status: "PERMISSION_DENIED",
        },
      };

      global.fetch = (async () => {
        return new Response(JSON.stringify(mockErrorResponse), { status: 403 });
      }) as any;

      const result = await inspectUrl(
        "mock-token",
        "https://dawnbook.belajarcarabelajar.com/books/sample/",
        "sc-domain:dawnbook.belajarcarabelajar.com"
      );

      expect(result.url).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
      expect(result.verdict).toBe("ERROR");
      expect(result.coverageState).toBe("User does not have sufficient permission for this site.");
      expect(result.indexingState).toBe("ERROR");
    });

    test("returns ERROR verdict with fallback NO_RESULT when API response has no error message nor inspectionResult", async () => {
      global.fetch = (async () => {
        return new Response(JSON.stringify({}), { status: 200 });
      }) as any;

      const result = await inspectUrl(
        "mock-token",
        "https://dawnbook.belajarcarabelajar.com/books/sample/",
        "sc-domain:dawnbook.belajarcarabelajar.com"
      );

      expect(result.url).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
      expect(result.verdict).toBe("ERROR");
      expect(result.coverageState).toBe("NO_RESULT");
      expect(result.indexingState).toBe("ERROR");
    });

    test("handles network exception gracefully and returns exception message in coverageState", async () => {
      global.fetch = (async () => {
        throw new Error("Network connection failure");
      }) as any;

      const result = await inspectUrl(
        "mock-token",
        "https://dawnbook.belajarcarabelajar.com/books/sample/",
        "sc-domain:dawnbook.belajarcarabelajar.com"
      );

      expect(result.url).toBe("https://dawnbook.belajarcarabelajar.com/books/sample/");
      expect(result.verdict).toBe("ERROR");
      expect(result.coverageState).toBe("Network connection failure");
      expect(result.indexingState).toBe("ERROR");
    });
  });

  describe("getAccessTokenFromRefreshToken", () => {
    test("returns access token on successful OAuth exchange", async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({ access_token: "mock-access-token", expires_in: 3600 }),
          { status: 200 }
        );
      }) as any;

      const token = await getAccessTokenFromRefreshToken("client-id", "client-secret", "refresh-token");
      expect(token).toBe("mock-access-token");
    });

    test("throws error when access_token is missing from response", async () => {
      global.fetch = (async () => {
        return new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Token has been revoked" }),
          { status: 400 }
        );
      }) as any;

      expect(
        getAccessTokenFromRefreshToken("client-id", "client-secret", "refresh-token")
      ).rejects.toThrow("Failed to refresh OAuth token:");
    });
  });

  describe("getAccessToken", () => {
    test("generates JWT and returns access token from service account credentials", async () => {
      const { privateKey } = crypto.generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: { type: "pkcs1", format: "pem" },
        privateKeyEncoding: { type: "pkcs8", format: "pem" },
      });

      const mockSa = {
        client_email: "test-sa@example.com",
        private_key: privateKey,
      };

      global.fetch = (async (url: string, options: any) => {
        expect(url).toBe("https://oauth2.googleapis.com/token");
        expect(options.method).toBe("POST");
        return new Response(
          JSON.stringify({ access_token: "service-account-access-token" }),
          { status: 200 }
        );
      }) as any;

      const token = await getAccessToken(mockSa);
      expect(token).toBe("service-account-access-token");
    });
  });
});
