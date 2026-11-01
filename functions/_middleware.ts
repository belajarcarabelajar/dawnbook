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

import type { PagesFunction } from "./lib/pages-function";
import { verifySession, type Env as AuthEnv } from "./lib/auth";
import { isAiCrawler, isPublicPath } from "./lib/gating";
import { isVerifiedBotRequest } from "./lib/bot-verify";
import { resolveLocale, COOKIE_NAME } from "./lib/i18n";
import { CONTENT_SECURITY_POLICY } from "./lib/security-headers";
import {
  checkPremiumAccess,
  isPremiumPublicPage,
  loadPremiumRegistry,
  premiumSlugOf,
  type PremiumEntry,
} from "./lib/premium";
import type { D1Database } from "@cloudflare/workers-types";

interface Env extends AuthEnv {
  // GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DB inherited from AuthEnv.
  // Store database owned by the bcb repo; read with SELECT only.
  LMS_DB?: D1Database;
}

const BUNDLE_URL = "https://belajarcarabelajar.com/product/bundle-ebook-bcb";
const STORE_SIGN_IN_URL = "https://belajarcarabelajar.com/masuk-dawnbook";

/** Joins Vary values, keeping the upstream ones and dropping case-insensitive duplicates. */
function mergeVary(existing: string | null, add: string[]): string {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of [...(existing ?? "").split(","), ...add]) {
    const name = value.trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out.join(", ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PAGE_STYLE =
  "body{font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.6}" +
  "ul{padding-left:1.2rem}";

function htmlPage(status: number, title: string, body: string): Response {
  const html =
    `<!doctype html><html lang="id"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="robots" content="noindex">` +
    `<title>${escapeHtml(title)}</title><style>${PAGE_STYLE}</style></head>` +
    `<body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}

function premiumRefused(request: Request, email: string, entry: PremiumEntry): Response {
  if (!wantsHtml(request)) return jsonError(403, "Forbidden");
  const signIn = `/sign-in?redirect_url=${encodeURIComponent(request.url)}`;
  const requestUrl = new URL(request.url);
  const storeSignIn = `${STORE_SIGN_IN_URL}?next=${encodeURIComponent(requestUrl.pathname + requestUrl.search)}`;
  const body =
    `<p>Akun <strong>${escapeHtml(email)}</strong> belum punya akses ke e-book ini.</p>` +
    `<p>Kalau kamu sudah membelinya, masuk dengan email yang kamu pakai saat membeli.</p>` +
    `<ul>` +
    `<li><a href="${escapeHtml(entry.productUrl)}">Beli e-book ini</a></li>` +
    `<li><a href="${escapeHtml(BUNDLE_URL)}">Lihat Bundle E-book</a></li>` +
    `<li><a href="${escapeHtml(signIn)}">Masuk dengan akun lain</a></li>` +
    `<li><a href="${escapeHtml(storeSignIn)}">Masuk lewat akun belajarcarabelajar.com</a></li>` +
    `<li><a href="/">Kembali ke Dawnbook</a></li>` +
    `</ul>`;
  return htmlPage(403, "Belum punya akses", body);
}

function premiumUnavailable(request: Request): Response {
  if (!wantsHtml(request)) return jsonError(503, "Service Unavailable");
  return htmlPage(
    503,
    "Sedang ada gangguan",
    `<p>Sedang ada gangguan, coba lagi beberapa saat lagi.</p><p><a href="/">Kembali ke Dawnbook</a></p>`,
  );
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
    },
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
    newResponse.headers.set(
      "Referrer-Policy",
      "strict-origin-when-cross-origin",
    );
  }
  if (!newResponse.headers.has("Permissions-Policy")) {
    newResponse.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
  }
  if (!newResponse.headers.has("Content-Security-Policy")) {
    newResponse.headers.set("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  }
  return newResponse;
}

const gatingMiddleware: PagesFunction<Env> = async (context) => {
  const { request, next, env } = context;
  const url = new URL(request.url);
  // Raw on purpose: isPublicPath, premiumSlugOf and isPremiumPublicPage each
  // decode once and collapse repeated slashes; decoding here as well would
  // turn %25 into a URIError and %252F into a real slash.
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
        `${COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`,
      );
      return newResponse;
    }

    // --- Premium e-books: purchase check, never a crawler bypass ---
    const premiumSlug = premiumSlugOf(pathname);
    if (premiumSlug !== null) {
      if (isPremiumPublicPage(pathname)) {
        const response = await nextWithLocale();
        const newResponse = new Response(response.body, response);
        newResponse.headers.append("Vary", "User-Agent");
        return applySecurityHeaders(newResponse);
      }

      const session = await verifySession(request, env);
      if (!session) {
        if (wantsHtml(request)) {
          const signInUrl = new URL("/sign-in", request.url);
          signInUrl.searchParams.set("redirect_url", request.url);
          return applySecurityHeaders(
            Response.redirect(signInUrl.toString(), 302),
          );
        }
        return applySecurityHeaders(unauthorizedJson());
      }

      const entry = loadPremiumRegistry()[premiumSlug];
      const access = await checkPremiumAccess(env.LMS_DB, session.email, entry);
      if (access === "allowed") {
        const response = await nextWithLocale();
        return applySecurityHeaders(applyGatedCacheHeaders(response));
      }
      if (access === "refused") {
        return applySecurityHeaders(premiumRefused(request, session.email, entry));
      }
      return applySecurityHeaders(premiumUnavailable(request));
    }

    // --- Public paths or VERIFIED Search Engine Bots: pass through unchanged ---
    //
    // Policy decision (F-104): a bot-like User-Agent alone is not enough — it
    // is trivially spoofable. Only requests whose connecting IP passes the
    // reverse-DNS + forward-confirmation check in isVerifiedBotRequest() get
    // the crawler pass-through for gated content. Unverifiable bot claims are
    // treated as regular visitors and must authenticate like everyone else.
    const publicPath = isPublicPath(pathname);
    if (
      publicPath ||
      (!isAiCrawler(request.headers.get("User-Agent")) && (await isVerifiedBotRequest(request)))
    ) {
      const response = await nextWithLocale();
      if (!publicPath) {
        // Gated text served to a crawler must never land in a shared cache.
        const upstreamVary = response.headers.get("Vary");
        const gated = applyGatedCacheHeaders(response);
        gated.headers.set("Vary", mergeVary(upstreamVary, ["Cookie", "User-Agent"]));
        return applySecurityHeaders(gated);
      }
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
        return applySecurityHeaders(
          Response.redirect(signInUrl.toString(), 302),
        );
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
};

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    return await gatingMiddleware(context);
  } catch (err) {
    console.error("Middleware error:", err);

    if (err instanceof URIError) {
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Malformed URI component.",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "private, no-store",
            },
          },
        ),
      );
    }

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
        },
      ),
    );
  }
};
