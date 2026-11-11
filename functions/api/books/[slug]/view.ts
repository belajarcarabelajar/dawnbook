/**
 * functions/api/books/[slug]/view.ts
 *
 * Cloudflare Pages Function handling:
 *   POST /api/books/:slug/view — Increment view count
 */

import type { D1Database } from "@cloudflare/workers-types";
import type { PagesFunction } from "../../../lib/pages-function";
import { enforceRateLimit, RATE_LIMIT_UPSERT_SQL } from "../../../lib/rate-limit";

const VIEW_DEDUPE_SECONDS = 86400;

interface Env {
  DB: D1Database;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // CSRF Protection: Require standard custom header
  // Cross-origin HTML forms cannot send custom headers.
  // Standard fetch requests with custom headers from other origins
  // will trigger a CORS preflight (OPTIONS), which our server rejects.
  const requestedWith = request.headers.get("X-Requested-With");
  if (requestedWith !== "XMLHttpRequest") {
    return errorResponse("Forbidden: Invalid CSRF protection header", 403);
  }

  // Per-IP cap so a script cannot inflate view counts (or burn D1 writes).
  const rateLimited = await enforceRateLimit(env, request, {
    route: "books-view",
    limit: 120,
    windowSeconds: 600,
  });
  if (rateLimited) return rateLimited;

  const slug = params.slug as string;

  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return errorResponse("Invalid slug format", 400);
  }

  // One counted view per IP per book per VIEW_DEDUPE_SECONDS. The dedupe claim
  // and the increment run in one D1 batch (a single transaction), so a failed
  // increment rolls the claim back and the viewer's retry still counts. The
  // UPDATE is guarded on the claim's count inside that transaction, so
  // concurrent requests from one viewer increment at most once.
  // The key must match what checkRateLimit wrote before this change, or live
  // windows reset on deploy.
  const ip = request.headers.get("CF-Connecting-IP");
  const dedupeKey = `books-view:${slug}:ip:${ip ?? "unknown"}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    const [claim, update] = await env.DB.batch<{ count: number }>([
      env.DB.prepare(RATE_LIMIT_UPSERT_SQL).bind(dedupeKey, now, now + VIEW_DEDUPE_SECONDS),
      env.DB.prepare(
        "UPDATE books SET view_count = view_count + 1 WHERE slug = ?1 AND (SELECT count FROM rate_limits WHERE key = ?2) = 1",
      ).bind(slug, dedupeKey),
    ]);

    if (!claim?.success || !update?.success) {
      return errorResponse("Failed to update view count", 500);
    }

    const count = claim.results?.[0]?.count;
    if (count !== undefined && count > 1) {
      return jsonResponse({ success: true, counted: false });
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
