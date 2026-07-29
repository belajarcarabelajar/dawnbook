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
import { verifyTurnstileToken } from "../../lib/turnstile";
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

  const redirectUrl = safeRedirectPath(url.searchParams.get("redirect_url"));

  // Verify Cloudflare Turnstile bot challenge if TURNSTILE_SECRET / TURNSTILE_SECRET_KEY is configured
  const secret = env.TURNSTILE_SECRET || env.TURNSTILE_SECRET_KEY;
  if (secret) {
    const turnstileToken =
      url.searchParams.get("cf-turnstile-response") ||
      url.searchParams.get("turnstile_token");
    const clientIp = request.headers.get("CF-Connecting-IP");
    const isHuman = await verifyTurnstileToken(
      turnstileToken ?? "",
      secret,
      clientIp
    );

    if (!isHuman) {
      const errorRedirect = new URL("/sign-in", request.url);
      errorRedirect.searchParams.set("error", "bot_detected");
      if (redirectUrl !== "/") {
        errorRedirect.searchParams.set("redirect_url", redirectUrl);
      }
      return Response.redirect(errorRedirect.toString(), 302);
    }
  }

  const state = randomState();

  // We round-trip redirect_url via the state cookie by encoding it inside
  // a sentinel: append `|redirectUrl` to the state value, but separate with
  // a non-valid-hex char so the hex validator rejects tampered values.
  // Simpler: keep state pure-hex, and store the redirect_url in a
  // companion cookie.
  const redirectUri = `${url.origin}/api/auth/callback`;
  const authUrl = buildAuthUrl({
    clientId: env.GOOGLE_CLIENT_ID,
    redirectUri,
    state,
  });

  const headers = new Headers({
    Location: authUrl,
    "Cache-Control": "no-store",
  });
  headers.append("Set-Cookie", setStateCookie(request, state));
  if (redirectUrl !== "/") {
    headers.append(
      "Set-Cookie",
      `oauth_redirect=${encodeURIComponent(redirectUrl)}; Path=/; Max-Age=${STATE_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    );
  }

  return new Response(null, {
    status: 302,
    headers,
  });
};
