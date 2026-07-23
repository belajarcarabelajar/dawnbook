/**
 * functions/lib/oauth.ts
 *
 * Google OAuth 2.0 helpers used by /api/auth/* endpoints.
 *
 * Flow:
 *   1. login.ts calls buildAuthUrl() to get the Google consent URL.
 *   2. User approves; Google redirects to /api/auth/callback?code=...&state=...
 *   3. callback.ts calls exchangeCode() to get an access_token, then
 *      fetchUserInfo() to get the user's profile.
 *   4. The handler upserts the user into D1 and issues a session cookie.
 *
 * State is round-tripped via a short-lived HttpOnly cookie set by login.ts
 * and validated by callback.ts (constant-time comparison to defeat timing
 * attacks).
 */

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL =
  "https://openidconnect.googleapis.com/v1/userinfo";
export const SCOPES = ["openid", "email", "profile"];

const HEX32 = /^[a-f0-9]{32,}$/;

/**
 * Generates a URL-safe random token. `bytes` is the entropy in bytes
 * (so 32 bytes → 64 hex chars). Uses crypto.getRandomValues, which is
 * available in the Cloudflare Workers runtime.
 */
export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a 64-char-hex session id (32 bytes entropy).
 */
export function randomSessionId(): string {
  return randomToken(32);
}

/**
 * Generates a 32-byte state nonce, hex-encoded.
 */
export function randomState(): string {
  return randomToken(16);
}

/**
 * Builds the Google consent URL. `redirectUri` must be exactly the URI
 * registered in the Google Cloud Console (including scheme, host, path,
 * and query — and no trailing slash unless registered that way).
 */
export function buildAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state: opts.state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for an access_token + id_token.
 * Throws on non-2xx with the response body for diagnostics.
 */
export async function exchangeCode(opts: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  expires_in: number;
  id_token?: string;
  token_type: string;
}> {
  const body = new URLSearchParams({
    code: opts.code,
    client_id: opts.clientId,
    client_secret: opts.clientSecret,
    redirect_uri: opts.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new Error(
      `Google token exchange failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as any;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

/**
 * Fetches the user's Google profile. Throws if the response is not 2xx
 * or if the payload is missing required fields (`sub`, `email`).
 */
export async function fetchUserInfo(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(
      `Google userinfo failed: ${res.status} ${await res.text()}`,
    );
  }
  const data = (await res.json()) as GoogleUserInfo;
  if (!data.sub || !data.email) {
    throw new Error("Google userinfo missing required fields (sub, email)");
  }
  return data;
}

/**
 * Constant-time string comparison. Used to validate the OAuth state
 * round-trip without leaking the correct prefix length via timing.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Hardens a `redirect_url` value to defeat open-redirect attacks.
 * Allows only same-origin relative paths (must start with "/" but not "//").
 * Returns "/" for anything else.
 */
export function safeRedirectPath(input: string | null | undefined): string {
  if (!input) return "/";
  if (typeof input !== "string") return "/";
  if (!input.startsWith("/")) return "/";
  if (input.startsWith("//") || input.startsWith("/\\")) return "/";
  if (input.includes("\n") || input.includes("\r")) return "/";
  return input;
}

export function isValidState(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && HEX32.test(value);
}
