/**
 * functions/_middleware.ts
 *
 * Cloudflare Pages Functions middleware that runs on EVERY request before
 * static asset serving. Implements edge-level auth gating for book content.
 *
 * Policy delegation:
 *   - Public paths (determined by isPublicPath) pass through unchanged.
 *   - Gated paths require a valid Clerk session; unauthenticated requests
 *     get a 302 redirect (HTML) or 401 JSON response (API/fetch).
 *
 * Caching:
 *   - Gated responses always carry Cache-Control: private, no-store + Vary: Cookie
 *     to prevent the CDN from caching and serving authenticated content to anon visitors.
 *   - Public responses keep their original cache headers.
 */

import { createClerkClient, verifyToken } from "@clerk/backend";
import { isPublicPath } from "./lib/gating";
import { resolveLocale, COOKIE_NAME, DEFAULT_LOCALE } from "./lib/i18n";

interface Env {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  DB: D1Database;
}

/**
 * Detects whether the request is likely from a browser expecting HTML
 * (as opposed to a fetch/API client expecting JSON).
 */
function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  // Browsers send Accept: text/html,...; fetch clients typically send application/json
  // or do not include text/html at all.
  return accept.includes("text/html");
}

/**
 * Extracts the Clerk session token from either the __session cookie
 * or the Authorization: Bearer header.
 */
function extractSessionToken(request: Request): string | null {
  // 1. Try Authorization header first (programmatic clients)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) return token;
  }

  // 2. Try __session cookie (browser sessions set by Clerk)
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith("__session=")) {
      const value = cookie.slice("__session=".length).trim();
      if (value) return value;
    }
  }

  return null;
}

/**
 * Verifies a Clerk session token using @clerk/backend.
 * Returns the verified session payload, or null if invalid/expired.
 */
async function verifySession(
  token: string,
  env: Env
): Promise<Record<string, unknown> | null> {
  try {
    if (!env.CLERK_SECRET_KEY) return null;
    const result = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: undefined,
    });
    return result as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Returns a 401 JSON error for API/fetch clients.
 */
function unauthorizedJson(): Response {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message:
        "Authentication required. Sign in at /sign-in to access this content.",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    }
  );
}

/**
 * Applies gated-content cache headers to a response.
 * Creates a new Response to avoid immutable-headers issues.
 */
function applyGatedCacheHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set("Cache-Control", "private, no-store");
  newResponse.headers.set("Vary", "Cookie");
  return newResponse;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // --- Locale detection and cookie logic ---
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  let cookieValue: string | null = null;
  for (const cookie of cookies) {
    if (cookie.startsWith(`${COOKIE_NAME}=`)) {
      cookieValue = cookie.slice(`${COOKIE_NAME}=`.length).trim();
      break;
    }
  }

  const country = (request.cf?.country as string) || null;
  const locale = resolveLocale({ cookieValue, country });
  const needsCookie = !cookieValue;

  // Since we need to append Set-Cookie to the outgoing response, we will wrap next()
  // and modify the response before returning it.
  async function nextWithLocale(): Promise<Response> {
    const response = await next();
    if (!needsCookie) return response;
    
    // Create a new response to allow header modification
    const newResponse = new Response(response.body, response);
    newResponse.headers.append("Set-Cookie", `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`);
    return newResponse;
  }

  // --- Public paths: pass through unchanged ---
  if (isPublicPath(pathname)) {
    return nextWithLocale();
  }

  // --- Gated paths: require Clerk session ---
  if (wantsHtml(request)) {
    const token = extractSessionToken(request);
    if (!token || !(await verifySession(token, env))) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return Response.redirect(signInUrl.toString(), 302);
    }
    const response = await nextWithLocale();
    return applyGatedCacheHeaders(response);
  }

  const token = extractSessionToken(request);

  if (!token) {
    return unauthorizedJson();
  }

  // Verify the token with Clerk backend
  const session = await verifySession(token, env);

  if (!session) {
    return unauthorizedJson();
  }

  // --- Authenticated: serve the gated content with safe cache headers ---
  const response = await nextWithLocale();
  return applyGatedCacheHeaders(response);
};
