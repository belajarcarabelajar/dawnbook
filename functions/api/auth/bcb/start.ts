/**
 * functions/api/auth/bcb/start.ts
 *
 * GET /api/auth/bcb/start?next=<path>
 *
 * Starts the store hand-off: sets a random state in the `__Host-bcb_sso_state`
 * cookie and redirects to the store with the same
 * state as `s`. /api/auth/bcb accepts a token only when the cookie and `s`
 * match, so a victim who opens a link carrying someone else's token cannot be
 * signed in to that account (login CSRF).
 */

import type { PagesFunction } from "../../../lib/pages-function";
import { safeRedirectPath } from "../../../lib/oauth";

// The __Host- prefix makes browsers refuse a copy set with Domain= by a sibling
// subdomain of belajarcarabelajar.com; it requires Path=/ and no Domain.
export const BCB_SSO_STATE_COOKIE = "__Host-bcb_sso_state";
export const BCB_SSO_STATE_RE = /^[A-Za-z0-9_-]{43}$/;
const STORE_SIGN_IN_URL = "https://belajarcarabelajar.com/masuk-dawnbook";
const STATE_MAX_AGE_S = 600;

function newState(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  let bin = "";
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function handleBcbStart(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" },
    });
  }
  const next = safeRedirectPath(new URL(request.url).searchParams.get("next"));
  const state = newState();
  return new Response(null, {
    status: 302,
    headers: {
      Location: `${STORE_SIGN_IN_URL}?next=${encodeURIComponent(next)}&s=${state}`,
      "Cache-Control": "no-store",
      "Set-Cookie": `${BCB_SSO_STATE_COOKIE}=${state}; Path=/; Max-Age=${STATE_MAX_AGE_S}; HttpOnly; Secure; SameSite=Lax`,
    },
  });
}

export const onRequest: PagesFunction = async ({ request }) => handleBcbStart(request);
