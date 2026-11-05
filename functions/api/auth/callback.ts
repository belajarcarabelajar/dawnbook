/**
 * functions/api/auth/callback.ts
 *
 * GET /api/auth/callback
 *
 * Handles the Google OAuth redirect. Validates the `state` against the
 * `__Host-oauth_state` cookie (one-shot), exchanges the `code` for an access
 * token, fetches the userinfo, upserts the user into D1, creates a new
 * session, sets the `__Host-session_id` cookie, and 302-redirects to the
 * originally requested `redirect_url` (or "/").
 *
 * On any failure, redirects to /sign-in?error=<code> so the user can be
 * shown a meaningful message; we never echo the raw error to the client.
 */

import type { PagesFunction } from "../../lib/pages-function";
import {
  exchangeCode,
  fetchUserInfo,
  constantTimeEqual,
  safeRedirectPath,
  isValidState,
} from "../../lib/oauth";
import {
  getUserByGoogleSub,
  getUserByEmail,
  linkGoogleSub,
  upsertGoogleUser,
  createSession,
  generateUserId,
  type UserRow,
} from "../../lib/db";
import { enforceRateLimit } from "../../lib/rate-limit";
import type { Env } from "../../lib/auth";
import {
  OAUTH_REDIRECT_COOKIE as REDIRECT_COOKIE,
  OAUTH_STATE_COOKIE as STATE_COOKIE,
  SESSION_COOKIE,
} from "../../lib/cookies";

const BCB_SUB_PREFIX = "bcb:";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") ?? "";
  for (let c of header.split(";")) {
    c = c.trim();
    if (c.startsWith(`${name}=`)) {
      return c.slice(name.length + 1).trim();
    }
  }
  return null;
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return "/";
  }
}

function clearStateCookies(headers: Headers): void {
  headers.append(
    "Set-Cookie",
    `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  );
  headers.append(
    "Set-Cookie",
    `${REDIRECT_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  );
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

  // Protect the OAuth code-exchange from brute-force / abuse by IP. This runs
  // before the state check so attackers burning through invalid callbacks are
  // also counted.
  const rateLimited = await enforceRateLimit(env, request, {
    route: "auth/callback",
    limit: 60,
    windowSeconds: 600,
  });
  if (rateLimited) return redirectWithError(request, "rate_limited");

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
    // Lookup by google_sub; if absent, try the email: a store hand-off user
    // ("bcb:" sub) is linked, a different Google account is refused, since
    // email is UNIQUE and the insert would be silently ignored.
    const existing = await getUserByGoogleSub(env.DB, userInfo.sub);
    let fresh: UserRow | null = null;
    let userId = existing?.id;

    if (!existing) {
      const byEmail = await getUserByEmail(
        env.DB,
        userInfo.email.trim().toLowerCase(),
      );
      // Linking hands over a store account, so only an address Google has
      // verified may claim it; strict `=== true` refuses a missing or string flag.
      if (
        byEmail &&
        byEmail.google_sub.startsWith(BCB_SUB_PREFIX) &&
        userInfo.email_verified === true
      ) {
        fresh = await linkGoogleSub(env.DB, byEmail.id, userInfo.sub, {
          name: userInfo.name ?? null,
          picture: userInfo.picture ?? null,
        });
      } else if (byEmail && byEmail.google_sub !== userInfo.sub) {
        return redirectWithError(request, "account_conflict");
      } else if (byEmail) {
        // byEmail with the same sub means a concurrent first login inserted it.
        userId = byEmail.id;
      } else if (userInfo.email_verified !== true) {
        // A new account needs an email address Google has verified.
        return redirectWithError(request, "email_unverified");
      }
    }

    if (!fresh) {
      await upsertGoogleUser(env.DB, {
        id: userId ?? generateUserId(),
        google_sub: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name ?? null,
        picture: userInfo.picture ?? null,
      });

      // Look up the user again so we get the post-upsert row (with id, role).
      fresh = await getUserByGoogleSub(env.DB, userInfo.sub);
      if (!fresh) throw new Error("user not found after upsert");
    }

    // Decoded before the session exists, so a malformed cookie cannot leave
    // an orphan session behind.
    const redirectPath = safeRedirectPath(
      decodeCookieValue(readCookie(request, REDIRECT_COOKIE) ?? ""),
    );
    const dest = new URL(redirectPath, request.url).toString();

    // 32 bytes of entropy → 64-char hex. Matches the HEX64 regex used by
    // extractSessionId() on the verification side.
    const sessionId = (() => {
      const buf = new Uint8Array(32);
      crypto.getRandomValues(buf);
      return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    })();

    const expiresAt = new Date(
      Date.now() + SESSION_TTL_SECONDS * 1000,
    ).toISOString();
    const userAgent = request.headers.get("User-Agent") ?? null;
    const ip = request.headers.get("CF-Connecting-IP") ?? null;

    await createSession(env.DB, {
      id: sessionId,
      user_id: fresh.id,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip,
    });

    const headers = new Headers({
      Location: dest,
      "Cache-Control": "no-store",
    });
    headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
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
