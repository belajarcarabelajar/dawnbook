/**
 * functions/api/books/[slug]/view.ts
 *
 * Cloudflare Pages Function handling:
 *   POST /api/books/:slug/view — Increment view count
 */

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

  const slug = params.slug as string;

  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return errorResponse("Invalid slug format", 400);
  }

  try {
    const result = await env.DB.prepare(
      "UPDATE books SET view_count = view_count + 1 WHERE slug = ?1",
    )
      .bind(slug)
      .run();

    if (!result.success) {
      return errorResponse("Failed to update view count", 500);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
