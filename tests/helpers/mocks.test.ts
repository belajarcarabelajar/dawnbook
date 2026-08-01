import { expect, test, describe } from "bun:test";
import { mockFetch } from "./mocks";

describe("tests/helpers/mocks.ts mockFetch helper", () => {
  test("mockFetch handles jwks.json, accounts.google.com auth, and default fallback", async () => {
    const resJwks = await mockFetch("https://example.com/.well-known/jwks.json");
    expect(resJwks.status).toBe(404);

    const resAuth = await mockFetch("https://accounts.google.com/o/oauth2/v2/auth");
    expect(resAuth.status).toBe(200);

    const resUnknown = await mockFetch("https://unknown.com/unknown");
    expect(resUnknown.status).toBe(404);
  });
});
