/**
 * functions/api/books/[slug].ts
 *
 * Cloudflare Pages Function handling:
 *   GET /api/books/:slug — Retrieve a single book by slug (public; drafts only for admins)
 *   DELETE /api/books/:slug — Delete a book by slug (requires admin auth)
 */

import { verifySession, type Env as AuthEnv } from "../../lib/auth";
import { enforceRateLimit } from "../../lib/rate-limit";

interface Env extends AuthEnv {}

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
      // Draft-status books are only visible to authenticated admins. A draft
      // requested by anyone else returns 404 (indistinguishable from a
      // missing book, so drafts cannot be probed via the API).
      const session = await verifySession(request, env);
      const isAdmin = session?.role === "admin";

      const result = isAdmin
        ? await env.DB.prepare(
            "SELECT id, slug, title, status, content_md, created_at, updated_at, subject_label, view_count FROM books WHERE slug = ?1"
          )
            .bind(slug)
            .first<BookRow>()
        : await env.DB.prepare(
            "SELECT id, slug, title, status, content_md, created_at, updated_at, subject_label, view_count FROM books WHERE slug = ?1 AND status = 'published'"
          )
            .bind(slug)
            .first<BookRow>();

      if (!result) {
        return errorResponse("Book not found", 404);
      }

      return jsonResponse({ book: result });
    }

    if (request.method === "DELETE") {
      const session = await verifySession(request, env);
      if (!session) {
        return errorResponse("Unauthorized: valid session required", 401);
      }

      // Strict Admin Authorization (D1-backed)
      if (session.role !== "admin") {
        return errorResponse("Forbidden: Administrator access required", 403);
      }

      // Cap destructive admin operations per user.
      const rateLimited = await enforceRateLimit(env, request, {
        route: "books-delete",
        limit: 60,
        windowSeconds: 600,
        userKey: session.sub,
      });
      if (rateLimited) return rateLimited;

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
