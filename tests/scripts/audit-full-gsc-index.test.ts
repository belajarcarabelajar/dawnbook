import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  base64url,
  inspectUrl,
  getAccessTokenFromRefreshToken,
  resolveAccessToken,
  main,
} from "../../scripts/audit-full-gsc-index";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const INSPECT_URL =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

const OAUTH_ENV = {
  GSC_OAUTH_CLIENT_ID: "client-id-abc",
  GSC_OAUTH_CLIENT_SECRET: "client-secret-SHOULD-NOT-LEAK",
  GSC_OAUTH_REFRESH_TOKEN_TULIS: "tulis-refresh-SHOULD-NOT-LEAK",
  GSC_OAUTH_REFRESH_TOKEN: "dead-refresh-SHOULD-NOT-LEAK",
};

type Call = { url: string; body: string };

function fakeFetch(
  calls: Call[],
  inspect: () => Response,
  tokenResponse: () => Response = () =>
    new Response(JSON.stringify({ access_token: "access-SHOULD-NOT-LEAK" }), {
      status: 200,
    }),
): typeof fetch {
  return (async (input: string | URL | Request, init?: RequestInit) => {
    const url = input.toString();
    calls.push({ url, body: String(init?.body ?? "") });
    if (url === TOKEN_URL) return tokenResponse();
    if (url === INSPECT_URL) return inspect();
    throw new Error(`unexpected URL ${url}`);
  }) as typeof fetch;
}

function refreshTokenSent(call: Call): string | null {
  return new URLSearchParams(call.body).get("refresh_token");
}

function captureConsole<T>(fn: () => Promise<T>): Promise<{ value: T; out: string }> {
  const orig = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    write: process.stdout.write,
  };
  let out = "";
  const sink = (...args: unknown[]) => {
    out += args.map(String).join(" ") + "\n";
  };
  console.log = sink;
  console.warn = sink;
  console.error = sink;
  process.stdout.write = ((chunk: unknown) => {
    out += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  return fn()
    .then((value) => ({ value, out }))
    .finally(() => {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
      process.stdout.write = orig.write;
    });
}

describe("resolveAccessToken", () => {
  it("uses GSC_OAUTH_REFRESH_TOKEN_TULIS when both refresh tokens are set", async () => {
    const calls: Call[] = [];
    const source = await resolveAccessToken(
      OAUTH_ENV,
      fakeFetch(calls, () => new Response("{}")),
    );
    expect(source.token).toBe("access-SHOULD-NOT-LEAK");
    expect(calls).toHaveLength(1);
    expect(refreshTokenSent(calls[0])).toBe("tulis-refresh-SHOULD-NOT-LEAK");
  });

  it("falls back to GSC_OAUTH_REFRESH_TOKEN when TULIS is unset", async () => {
    const calls: Call[] = [];
    const { GSC_OAUTH_REFRESH_TOKEN_TULIS: _unused, ...env } = OAUTH_ENV;
    await resolveAccessToken(env, fakeFetch(calls, () => new Response("{}")));
    expect(refreshTokenSent(calls[0])).toBe("dead-refresh-SHOULD-NOT-LEAK");
  });

  it("names the variable and hides secret values when the refresh fails", async () => {
    const calls: Call[] = [];
    const failing = fakeFetch(
      calls,
      () => new Response("{}"),
      () =>
        new Response(
          JSON.stringify({ error: "invalid_grant", error_description: "Bad Request" }),
          { status: 400 },
        ),
    );
    const err = await resolveAccessToken(OAUTH_ENV, failing).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("GSC_OAUTH_REFRESH_TOKEN_TULIS");
    expect(err.message).toContain("invalid_grant");
    expect(err.message).not.toContain("SHOULD-NOT-LEAK");
  });

  it("throws naming the variables when no credential is configured", async () => {
    const err = await resolveAccessToken(
      {},
      fakeFetch([], () => new Response("{}")),
      "/nonexistent/service-account.json",
    ).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("GSC_OAUTH_REFRESH_TOKEN_TULIS");
  });
});

describe("main exit code", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "audit-gsc-test-"));
    fs.writeFileSync(
      path.join(dir, "sitemap.xml"),
      "<urlset><url><loc>https://dawnbook.belajarcarabelajar.com/books/a/</loc></url></urlset>",
    );
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const run = (fetchFn: typeof fetch) =>
    captureConsole(() =>
      main({
        env: OAUTH_ENV,
        fetchFn,
        sitemapPath: path.join(dir, "sitemap.xml"),
        reportDir: path.join(dir, "out"),
        delayMs: 0,
      }),
    );

  it("returns 0 when every inspection succeeds", async () => {
    const { value } = await run(
      fakeFetch([], () =>
        new Response(
          JSON.stringify({
            inspectionResult: {
              indexStatusResult: {
                verdict: "PASS",
                coverageState: "Submitted and indexed",
                indexingState: "INDEXING_ALLOWED",
              },
            },
          }),
          { status: 200 },
        ),
      ),
    );
    expect(value).toBe(0);
    expect(fs.existsSync(path.join(dir, "out", "FULL_GSC_INDEXING_REPORT.md"))).toBe(true);
  });

  it("returns non-zero when URL inspection answers 403", async () => {
    const { value, out } = await run(
      fakeFetch([], () =>
        new Response(
          JSON.stringify({
            error: { code: 403, message: "User does not have sufficient permission" },
          }),
          { status: 403 },
        ),
      ),
    );
    expect(value).not.toBe(0);
    expect(out).not.toContain("SHOULD-NOT-LEAK");
  });

  it("returns non-zero when the token refresh fails", async () => {
    const { value, out } = await run(
      fakeFetch(
        [],
        () => new Response("{}"),
        () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }),
      ),
    );
    expect(value).not.toBe(0);
    expect(out).toContain("GSC_OAUTH_REFRESH_TOKEN_TULIS");
    expect(out).not.toContain("SHOULD-NOT-LEAK");
  });
});

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
      }) as unknown as typeof global.fetch;

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
      }) as unknown as typeof global.fetch;

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
      }) as unknown as typeof global.fetch;

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
      }) as unknown as typeof global.fetch;

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
      }) as unknown as typeof global.fetch;

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
