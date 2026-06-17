/**
 * functions/api/books/[slug].ts
 *
 * Cloudflare Pages Function handling:
 *   GET /api/books/:slug — Retrieve a single book by slug (public)
 */

interface Env {
  DB: D1Database;
}

interface BookRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  content_md: string;
  created_at: string;
  updated_at: string;
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

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (request.method !== "GET") {
    return errorResponse("Method not allowed", 405);
  }

  const slug = params.slug as string;

  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return errorResponse("Invalid slug format", 400);
  }

  try {
    const result = await env.DB.prepare(
      "SELECT id, slug, title, status, content_md, created_at, updated_at FROM books WHERE slug = ?1"
    )
      .bind(slug)
      .first<BookRow>();

    if (!result) {
      return errorResponse("Book not found", 404);
    }

    return jsonResponse({ book: result });
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
