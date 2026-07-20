/**
 * functions/api/auth/login.ts
 *
 * GET /api/auth/login
 *
 * Initiates the Google OAuth flow. Generates a `state` nonce, stores it in
 * a short-lived HttpOnly cookie (`oauth_state`, 5 min), and 302-redirects
 * the user to Google's consent screen.
 *
 * Query params:
 *   redirect_url (optional): where to send the user after successful login.
 *                            Must be a same-origin path; falls back to "/".
 */

import { buildAuthUrl, randomState, safeRedirectPath } from "../../lib/oauth";
import type { Env } from "../../lib/auth";

const STATE_COOKIE = "oauth_state";
const STATE_TTL_SECONDS = 300; // 5 minutes

function setStateCookie(request: Request, state: string): string {
  return `${STATE_COOKIE}=${state}; Path=/; Max-Age=${STATE_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!env.GOOGLE_CLIENT_ID) {
    return new Response("Google OAuth not configured", { status: 503 });
  }

  const state = randomState();
  const redirectUrl = safeRedirectPath(url.searchParams.get("redirect_url"));

  // We round-trip redirect_url via the state cookie by encoding it inside
  // a sentinel: append `|redirectUrl` to the state value, but separate with
  // a non-valid-hex char so the hex validator rejects tampered values.
  // Simpler: keep state pure-hex, and store the redirect_url in a
  // companion cookie.
  const redirectCookie = redirectUrl === "/"
    ? ""
    : `oauth_redirect=${encodeURIComponent(redirectUrl)}; Path=/; Max-Age=${STATE_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax; `;

  const redirectUri = `${url.origin}/api/auth/callback`;
  const authUrl = buildAuthUrl({
    clientId: env.GOOGLE_CLIENT_ID,
    redirectUri,
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": `${redirectCookie}${setStateCookie(request, state)}`,
      "Cache-Control": "no-store",
    },
  });
};
