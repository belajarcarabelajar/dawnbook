/**
 * functions/api/books/[slug].ts
 *
 * Cloudflare Pages Function handling:
 *   GET /api/books/:slug — Retrieve a single book by slug (public)
 *   DELETE /api/books/:slug — Delete a book by slug (requires Clerk auth)
 */

import { verifyClerkSession } from "../../lib/auth";

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
  subject_label?: string | null;
  view_count: number;
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

  const slug = params.slug as string;

  if (!slug || !/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return errorResponse("Invalid slug format", 400);
  }

  try {
    if (request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT id, slug, title, status, content_md, created_at, updated_at, subject_label, view_count FROM books WHERE slug = ?1"
      )
        .bind(slug)
        .first<BookRow>();

      if (!result) {
        return errorResponse("Book not found", 404);
      }

      return jsonResponse({ book: result });
    }

    if (request.method === "DELETE") {
      const session = await verifyClerkSession(request, env);
      if (!session) {
        return errorResponse("Unauthorized: valid Clerk session required", 401);
      }

      // Strict Admin Authorization
      if ((session.publicMetadata as any)?.role !== "admin") {
        return errorResponse("Forbidden: Administrator access required", 403);
      }

      const result = await env.DB.prepare("DELETE FROM books WHERE slug = ?1").bind(slug).run();

      if (!result.success) {
        return errorResponse("Database deletion failed", 500);
      }

      return jsonResponse({ success: true, message: "Book deleted successfully" });
    }

    return errorResponse("Method not allowed", 405);
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
