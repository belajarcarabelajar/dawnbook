/**
 * functions/api/auth/callback.ts
 *
 * GET /api/auth/callback
 *
 * Handles the Google OAuth redirect. Validates the `state` against the
 * `oauth_state` cookie (one-shot), exchanges the `code` for an access
 * token, fetches the userinfo, upserts the user into D1, creates a new
 * session, sets the `session_id` cookie, and 302-redirects to the
 * originally requested `redirect_url` (or "/").
 *
 * On any failure, redirects to /sign-in?error=<code> so the user can be
 * shown a meaningful message; we never echo the raw error to the client.
 */

import {
  exchangeCode,
  fetchUserInfo,
  constantTimeEqual,
  safeRedirectPath,
  isValidState,
} from "../../lib/oauth";
import {
  getUserByGoogleSub,
  upsertGoogleUser,
  createSession,
  generateUserId,
} from "../../lib/db";
import type { Env } from "../../lib/auth";

const STATE_COOKIE = "oauth_state";
const REDIRECT_COOKIE = "oauth_redirect";
const SESSION_COOKIE = "session_id";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (const c of header.split(";").map((c) => c.trim())) {
    if (c.startsWith(`${name}=`)) {
      return c.slice(name.length + 1).trim();
    }
  }
  return null;
}

function clearStateCookies(headers: Headers): void {
  headers.append("Set-Cookie", `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  headers.append("Set-Cookie", `${REDIRECT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

function redirectWithError(request: Request, code: string): Response {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("error", code);
  const headers = new Headers({
    Location: url.toString(),
    "Cache-Control": "no-store",
  });
  clearStateCookies(headers);
  return new Response(null, {
    status: 302,
    headers,
  });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stateCookie = readCookie(request, STATE_COOKIE);

  if (!code || !state || !stateCookie) {
    return redirectWithError(request, "missing_params");
  }
  if (!isValidState(state) || !constantTimeEqual(state, stateCookie)) {
    return redirectWithError(request, "state_mismatch");
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(request, "config");
  }

  let userInfo;
  try {
    const token = await exchangeCode({
      code,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${url.origin}/api/auth/callback`,
    });
    userInfo = await fetchUserInfo(token.access_token);
  } catch (err) {
    console.error("[auth/callback] Google exchange failed:", err);
    return redirectWithError(request, "google_exchange");
  }

  try {
    // Lookup by google_sub; if absent, allocate a new user id.
    const existing = await getUserByGoogleSub(env.DB, userInfo.sub);
    const userId = existing?.id ?? generateUserId();

    await upsertGoogleUser(env.DB, {
      id: userId,
      google_sub: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name ?? null,
      picture: userInfo.picture ?? null,
    });

    // Look up the user again so we get the post-upsert row (with id, role).
    const fresh = await getUserByGoogleSub(env.DB, userInfo.sub);
    if (!fresh) throw new Error("user not found after upsert");

    // 32 bytes of entropy → 64-char hex. Matches the HEX64 regex used by
    // extractSessionId() on the verification side.
    const sessionId = (() => {
      const buf = new Uint8Array(32);
      crypto.getRandomValues(buf);
      return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    })();

    const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
    const userAgent = request.headers.get("User-Agent") ?? null;
    const ip = request.headers.get("CF-Connecting-IP") ?? null;

    await createSession(env.DB, {
      id: sessionId,
      user_id: fresh.id,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip,
    });

    const redirectPath = safeRedirectPath(
      decodeURIComponent(readCookie(request, REDIRECT_COOKIE) ?? "")
    );
    const dest = new URL(redirectPath, request.url).toString();

    const headers = new Headers({
      Location: dest,
      "Cache-Control": "no-store",
    });
    headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    );
    clearStateCookies(headers);

    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (err) {
    console.error("[auth/callback] D1 ops failed:", err);
    return redirectWithError(request, "server");
  }
};
