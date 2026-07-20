import { expect, test, describe, beforeEach, mock } from "bun:test";
import { onRequestGet as loginHandler } from "../../../functions/api/auth/login";
import { onRequestGet as callbackHandler } from "../../../functions/api/auth/callback";
import { onRequestPost, onRequestGet as logoutGet } from "../../../functions/api/auth/logout";
import { onRequestGet as meHandler } from "../../../functions/api/auth/me";
import {
  createMockEnv,
  setQueryHandler,
  setRunHandler,
} from "../../helpers/mocks";
import type { Env } from "../../../functions/lib/auth";

const ENV_OVERRIDES = {
  GOOGLE_CLIENT_ID: "test_client_id",
  GOOGLE_CLIENT_SECRET: "test_client_secret",
};

const SESSION_ID_HEX = "c".repeat(64);
const STATE_HEX = "d".repeat(32);

const setEnvHandlers = (env: any) => {
  // Default: empty D1. Tests opt in to specific behaviors below.
  setQueryHandler(env, "SELECT", () => []);
  setRunHandler(env, "INSERT", () => ({ success: true }));
  setRunHandler(env, "UPDATE", () => ({ success: true }));
};

describe("/api/auth/login", () => {
  test("returns 503 when GOOGLE_CLIENT_ID missing", async () => {
    const env = createMockEnv({ GOOGLE_CLIENT_ID: "" }) as unknown as Env;
    const res = await loginHandler({ request: new Request("https://example.com/api/auth/login"), env } as any);
    expect(res.status).toBe(503);
  });

  test("returns 302 to accounts.google.com with state", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const res = await loginHandler({ request: new Request("https://example.com/api/auth/login"), env } as any);
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location")!;
    expect(loc).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(loc).toContain("client_id=test_client_id");
    expect(loc).toContain("response_type=code");
    expect(loc).toContain("scope=openid+email+profile");
    expect(loc).toMatch(/state=[a-f0-9]+/);
    const setCookie = res.headers.get("Set-Cookie")!;
    expect(setCookie).toContain("oauth_state=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
  });

  test("stores redirect_url in oauth_redirect cookie when provided (safe path)", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const req = new Request("https://example.com/api/auth/login?redirect_url=/appreciation.html");
    const res = await loginHandler({ request: req, env } as any);
    const cookies = res.headers.get("Set-Cookie")!;
    expect(cookies).toContain("oauth_redirect=");
    // URL-encoded "/" is %2F
    expect(cookies).toContain("%2Fappreciation.html");
  });

  test("drops open-redirect attempt with //evil.com", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const req = new Request("https://example.com/api/auth/login?redirect_url=//evil.com/x");
    const res = await loginHandler({ request: req, env } as any);
    const cookies = res.headers.get("Set-Cookie")!;
    // No oauth_redirect cookie should be set when redirect_url is unsafe.
    expect(cookies).not.toContain("oauth_redirect=");
  });
});

describe("/api/auth/callback", () => {
  const baseUrl = "https://example.com/api/auth/callback";

  test("redirects with error=missing_params when code/state missing", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const res = await callbackHandler({ request: new Request(baseUrl), env } as any);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=missing_params");
  });

  test("rejects state mismatch", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const url = `${baseUrl}?code=abc&state=${STATE_HEX}`;
    const req = new Request(url, { headers: { Cookie: `oauth_state=00ff00ff` } });
    const res = await callbackHandler({ request: req, env } as any);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=state_mismatch");
  });

  test("rejects state with non-hex characters", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const url = `${baseUrl}?code=abc&state=ZZZZ`;
    const req = new Request(url, { headers: { Cookie: `oauth_state=ZZZZ` } });
    const res = await callbackHandler({ request: req, env } as any);
    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toContain("error=state_mismatch");
  });

  test("happy path: exchanges code, upserts user, sets session cookie, redirects to redirect_url", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);

    // First SELECT (getUserByGoogleSub): no existing user.
    // Second SELECT (after upsert): the user is now there.
    let selectCalls = 0;
    setQueryHandler(env, "SELECT", (sql, params) => {
      selectCalls++;
      if (selectCalls === 1) return []; // initial lookup
      return [{
        id: "u_abc",
        google_sub: "google_sub_123",
        email: "tester@example.com",
        name: "Test User",
        picture: "https://example.com/pic.png",
        role: "reader",
        donation_badge: null,
        created_at: "2024-01-01T00:00:00.000Z",
        last_login_at: "2024-01-01T00:00:00.000Z",
      }];
    });

    const url = `${baseUrl}?code=valid_code&state=${STATE_HEX}`;
    const req = new Request(url, {
      headers: {
        Cookie: `oauth_state=${STATE_HEX}; oauth_redirect=%2Fappreciation.html`,
        "CF-Connecting-IP": "203.0.113.1",
        "User-Agent": "bun-test",
      },
    });
    const res = await callbackHandler({ request: req, env } as any);

    expect(res.status).toBe(302);
    const setCookie = res.headers.get("Set-Cookie")!;
    expect(setCookie).toMatch(/session_id=[a-f0-9]{64}/);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain("oauth_state=;"); // cleared
    expect(setCookie).toContain("oauth_redirect=;"); // cleared
    expect(res.headers.get("Location")).toContain("/appreciation.html");
  });

  test("falls back to / when redirect_url cookie missing or invalid", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);

    let selectCalls = 0;
    setQueryHandler(env, "SELECT", () => {
      selectCalls++;
      if (selectCalls === 1) return [];
      return [{
        id: "u_abc", google_sub: "g", email: "e@e.com", name: null, picture: null,
        role: "reader", donation_badge: null,
        created_at: "2024-01-01T00:00:00.000Z", last_login_at: "2024-01-01T00:00:00.000Z",
      }];
    });

    const url = `${baseUrl}?code=valid_code&state=${STATE_HEX}`;
    // No oauth_redirect cookie at all.
    const req = new Request(url, { headers: { Cookie: `oauth_state=${STATE_HEX}` } });
    const res = await callbackHandler({ request: req, env } as any);
    const dest = new URL(res.headers.get("Location")!, "https://example.com");
    expect(dest.pathname).toBe("/");
  });
});

describe("/api/auth/logout", () => {
  test("returns 204 and clears cookie when no session present", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const res = await onRequestPost({ request: new Request("https://example.com/api/auth/logout", { method: "POST" }), env } as any);
    expect(res.status).toBe(204);
    expect(res.headers.get("Set-Cookie")).toContain("session_id=;");
    expect(res.headers.get("Set-Cookie")).toContain("Max-Age=0");
  });

  test("returns 204 and clears cookie for valid session (delete from D1)", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const req = new Request("https://example.com/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `session_id=${SESSION_ID_HEX}` },
    });
    const res = await onRequestPost({ request: req, env } as any);
    expect(res.status).toBe(204);
    expect(res.headers.get("Set-Cookie")).toContain("session_id=;");
  });

  test("GET is allowed (idempotent sign-out via link)", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const res = await logoutGet({ request: new Request("https://example.com/api/auth/logout"), env } as any);
    expect(res.status).toBe(204);
  });
});

describe("/api/auth/me", () => {
  test("returns 401 when no session cookie", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    const res = await meHandler({ request: new Request("https://example.com/api/auth/me"), env } as any);
    expect(res.status).toBe(401);
  });

  test("returns 401 when session row not found", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    setQueryHandler(env, "SELECT", () => []); // no row
    const req = new Request("https://example.com/api/auth/me", {
      headers: { Cookie: `session_id=${SESSION_ID_HEX}` },
    });
    const res = await meHandler({ request: req, env } as any);
    expect(res.status).toBe(401);
  });

  test("returns 401 when session expired", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    setQueryHandler(env, "SELECT", () => [{
      s_id: SESSION_ID_HEX, s_user_id: "u", s_expires_at: "2000-01-01T00:00:00.000Z",
      s_created_at: "2000-01-01T00:00:00.000Z", s_last_seen_at: "2000-01-01T00:00:00.000Z",
      s_user_agent: null, s_ip: null,
      u_id: "u", u_google_sub: "g", u_email: "e@e.com", u_name: null, u_picture: null,
      u_role: "reader", u_donation_badge: null,
      u_created_at: "2000-01-01T00:00:00.000Z", u_last_login_at: "2000-01-01T00:00:00.000Z",
    }]);
    const req = new Request("https://example.com/api/auth/me", {
      headers: { Cookie: `session_id=${SESSION_ID_HEX}` },
    });
    const res = await meHandler({ request: req, env } as any);
    expect(res.status).toBe(401);
  });

  test("returns user JSON for valid session", async () => {
    const env = createMockEnv(ENV_OVERRIDES) as unknown as Env;
    setEnvHandlers(env);
    setQueryHandler(env, "SELECT", () => [{
      s_id: SESSION_ID_HEX, s_user_id: "u_1", s_expires_at: "2099-01-01T00:00:00.000Z",
      s_created_at: "2024-01-01T00:00:00.000Z", s_last_seen_at: "2024-01-01T00:00:00.000Z",
      s_user_agent: null, s_ip: null,
      u_id: "u_1", u_google_sub: "g_1", u_email: "alice@example.com", u_name: "Alice",
      u_picture: "https://example.com/a.png", u_role: "admin", u_donation_badge: null,
      u_created_at: "2024-01-01T00:00:00.000Z", u_last_login_at: "2024-01-01T00:00:00.000Z",
    }]);
    const req = new Request("https://example.com/api/auth/me", {
      headers: { Cookie: `session_id=${SESSION_ID_HEX}` },
    });
    const res = await meHandler({ request: req, env } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      id: "u_1",
      email: "alice@example.com",
      name: "Alice",
      picture: "https://example.com/a.png",
      role: "admin",
    });
  });
});
