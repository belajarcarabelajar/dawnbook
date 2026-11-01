import { describe, expect, test } from "bun:test";
import { handleBcbStart, onRequest } from "../../../../functions/api/auth/bcb/start";

const STATE_RE = /^[A-Za-z0-9_-]{43}$/;

function startRequest(next: string | null, method = "GET"): Request {
  const url = new URL("https://example.com/api/auth/bcb/start");
  if (next !== null) url.searchParams.set("next", next);
  return new Request(url, { method });
}

function stateCookie(res: Response): string {
  const header = res.headers.get("Set-Cookie") ?? "";
  const match = header.match(/^__Host-bcb_sso_state=([^;]*);/);
  expect(match).not.toBeNull();
  return match![1];
}

describe("/api/auth/bcb/start store hand-off launcher", () => {
  test("sets the state cookie with exact attributes and sends s and next to the store", async () => {
    const res = await handleBcbStart(startRequest("/books/buku-a/content/02_x.html?a=1&b=2"));

    expect(res.status).toBe(302);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const state = stateCookie(res);
    expect(state).toMatch(STATE_RE);
    expect(res.headers.get("Set-Cookie")).toBe(
      `__Host-bcb_sso_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    );
    expect(res.headers.get("Location")).toBe(
      "https://belajarcarabelajar.com/masuk-dawnbook?next=%2Fbooks%2Fbuku-a%2Fcontent%2F02_x.html%3Fa%3D1%26b%3D2" +
        `&s=${state}`,
    );
  });

  test("two starts produce different states", async () => {
    const a = stateCookie(await handleBcbStart(startRequest("/")));
    const b = stateCookie(await handleBcbStart(startRequest("/")));
    expect(a).not.toBe(b);
  });

  for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", null]) {
    test(`unsafe or missing next (${String(next)}) becomes next=%2F`, async () => {
      const res = await handleBcbStart(startRequest(next));
      const loc = res.headers.get("Location")!;
      expect(loc.startsWith("https://belajarcarabelajar.com/masuk-dawnbook?next=%2F&s=")).toBe(true);
      expect(new URL(loc).searchParams.get("s")).toBe(stateCookie(res));
    });
  }

  test("POST is refused with 405, no cookie and no-store", async () => {
    const res = await handleBcbStart(startRequest("/", "POST"));
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("GET");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  test("onRequest is wired to the handler", async () => {
    const res = await onRequest({ request: startRequest("/x") } as any);
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("Location")!).searchParams.get("next")).toBe("/x");
  });
});
