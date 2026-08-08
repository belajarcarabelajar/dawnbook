/**
 * functions/_middleware.ts
 *
 * Cloudflare Pages Functions middleware that runs on EVERY request before
 * static asset serving. Implements edge-level auth gating for book content.
 *
 * Policy delegation:
 *   - Public paths (determined by isPublicPath) pass through unchanged.
 *   - Gated paths require a valid D1 session; unauthenticated requests
 *     get a 302 redirect (HTML) or 401 JSON response (API/fetch).
 *
 * Caching:
 *   - Gated responses always carry Cache-Control: private, no-store + Vary: Cookie
 *     to prevent the CDN from caching and serving authenticated content to anon visitors.
 *   - Public responses keep their original cache headers.
 */

import { verifySession, type Env as AuthEnv } from "./lib/auth";
import { isPublicPath } from "./lib/gating";
import { isVerifiedBotRequest } from "./lib/bot-verify";
import { resolveLocale, COOKIE_NAME } from "./lib/i18n";
import { CONTENT_SECURITY_POLICY } from "./lib/security-headers";

interface Env extends AuthEnv {
  // GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DB inherited from AuthEnv.
}

/**
 * Detects whether the request is likely from a browser expecting HTML
 * (as opposed to a fetch/API client expecting JSON).
 */
function wantsHtml(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html");
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

/**
 * Applies baseline defensive HTTP security headers to an outgoing response.
 */
function applySecurityHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  if (!newResponse.headers.has("X-Frame-Options")) {
    newResponse.headers.set("X-Frame-Options", "DENY");
  }
  if (!newResponse.headers.has("X-Content-Type-Options")) {
    newResponse.headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!newResponse.headers.has("Referrer-Policy")) {
    newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  if (!newResponse.headers.has("Permissions-Policy")) {
    newResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  }
  if (!newResponse.headers.has("Content-Security-Policy")) {
    newResponse.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  }
  return newResponse;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
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

    async function nextWithLocale(): Promise<Response> {
      const response = await next();
      if (!needsCookie) return response;
      const newResponse = new Response(response.body, response);
      newResponse.headers.append(
        "Set-Cookie",
        `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
      );
      return newResponse;
    }

    // --- Public paths or VERIFIED Search Engine Bots: pass through unchanged ---
    //
    // Policy decision (F-104): a bot-like User-Agent alone is not enough — it
    // is trivially spoofable. Only requests whose connecting IP passes the
    // reverse-DNS + forward-confirmation check in isVerifiedBotRequest() get
    // the crawler pass-through for gated content. Unverifiable bot claims are
    // treated as regular visitors and must authenticate like everyone else.
    if (isPublicPath(pathname) || (await isVerifiedBotRequest(request))) {
      const response = await nextWithLocale();
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Vary", "User-Agent");
      return applySecurityHeaders(newResponse);
    }

    // --- Gated paths: require D1 session ---
    if (wantsHtml(request)) {
      const session = await verifySession(request, env);
      if (!session) {
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", request.url);
        return applySecurityHeaders(Response.redirect(signInUrl.toString(), 302));
      }
      const response = await nextWithLocale();
      return applySecurityHeaders(applyGatedCacheHeaders(response));
    }

    // Non-HTML (API/fetch).
    const session = await verifySession(request, env);
    if (!session) {
      return applySecurityHeaders(unauthorizedJson());
    }

    const response = await nextWithLocale();
    return applySecurityHeaders(applyGatedCacheHeaders(response));
  } catch (err) {
    console.error("Middleware error:", err);
    return applySecurityHeaders(
      new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: "An unexpected error occurred at the edge.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, no-store",
          },
        }
      )
    );
  }
};
