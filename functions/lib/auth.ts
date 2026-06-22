/**
 * functions/lib/auth.ts
 * Shared authentication logic for Cloudflare Pages Functions using Clerk.
 *
 * Primary: Verify session JWT locally via JWKS (networkless after key fetch).
 * Fallback: Verify via Clerk Backend API if local verification fails.
 */

export interface Env {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}

export interface AuthSession {
  sub: string; // The user ID
  [key: string]: unknown;
}

/**
 * Converts a base64url string to standard base64 with proper padding.
 */
function base64urlToBase64(str: string): string {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  return b64;
}

/**
 * Extracts the Clerk Frontend API domain from a publishable key.
 * The key format is: pk_(test|live)_<base64url encoded domain>
 * The decoded domain has a trailing '$' that must be stripped.
 */
function getClerkDomain(publishableKey: string): string {
  const keyBody = publishableKey.replace(/^pk_(test|live)_/, "");
  const padded = base64urlToBase64(keyBody);
  const decoded = atob(padded);
  // Clerk always appends a '$' sentinel to the encoded domain — strip it
  return decoded.replace(/\$+$/, "");
}

/**
 * Verifies a Clerk session JWT from the Authorization header.
 * Returns the decoded payload on success, or null on failure.
 */
export async function verifyClerkSession(
  request: Request,
  env: Env
): Promise<AuthSession | null> {
  let token = "";
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    const cookieHeader = request.headers.get("Cookie") || "";
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("__session=")) {
        token = cookie.slice("__session=".length).trim();
        break;
      }
    }
  }

  if (!token) return null;

  const pk = env.CLERK_PUBLISHABLE_KEY || (env as any).VITE_CLERK_PUBLISHABLE_KEY;

  // --- Attempt 1: Local JWKS verification ---
  if (pk) {
    try {
      const clerkDomain = getClerkDomain(pk);
      const jwksUrl = `https://${clerkDomain}/.well-known/jwks.json`;
      const jwksResponse = await fetch(jwksUrl);

      if (jwksResponse.ok) {
        const jwks = (await jwksResponse.json()) as { keys: JsonWebKey[] };
        if (jwks.keys && jwks.keys.length > 0) {
          const result = await verifyWithJWKS(token, jwks.keys);
          if (result) return result;
        }
      }
    } catch (e) {
      console.error("[auth] JWKS verification failed:", e);
    }
  }

  // --- Attempt 2: Clerk Backend API verification ---
  if (env.CLERK_SECRET_KEY) {
    try {
      return await verifyViaClerkBackendAPI(token, env.CLERK_SECRET_KEY);
    } catch (e) {
      console.error("[auth] Backend API verification failed:", e);
    }
  }

  return null;
}

/**
 * Verify a JWT against a set of JWK keys using Web Crypto API.
 */
async function verifyWithJWKS(
  token: string,
  keys: JsonWebKey[]
): Promise<AuthSession | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  const header = JSON.parse(atob(base64urlToBase64(headerB64)));
  const matchingKey = keys.find(
    (k: any) => k.kid === header.kid && k.alg === header.alg
  );

  if (!matchingKey) return null;

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    matchingKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = Uint8Array.from(
    atob(base64urlToBase64(signatureB64)),
    (c) => c.charCodeAt(0)
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    signature,
    data
  );

  if (!valid) return null;

  const payload = JSON.parse(
    atob(base64urlToBase64(payloadB64))
  ) as AuthSession;

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    return null;
  }

  return payload;
}

/**
 * Fallback: Verify the session token by decoding it and calling
 * Clerk Backend API to validate the session.
 *
 * We decode the JWT payload to get the session ID (sid),
 * then call GET /v1/sessions/{sid} to confirm it's active.
 */
async function verifyViaClerkBackendAPI(
  token: string,
  secretKey: string
): Promise<AuthSession | null> {
  // Decode the JWT payload to extract sub and sid
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const payload = JSON.parse(
    atob(base64urlToBase64(parts[1]))
  ) as AuthSession;

  if (!payload.sub) return null;

  // If there's a session ID, verify it's active via Clerk Backend API
  const sid = payload.sid as string | undefined;
  if (sid) {
    const response = await fetch(
      `https://api.clerk.com/v1/sessions/${sid}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    if (!response.ok) return null;

    const session = (await response.json()) as {
      status: string;
      user_id: string;
    };

    // Only accept active sessions
    if (session.status !== "active") return null;

    // Verify the user_id matches the token's sub claim
    if (session.user_id !== payload.sub) return null;
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === "number" && payload.exp < now) {
    return null;
  }

  return payload;
}
