/**
 * functions/api/books/index.ts
 *
 * Cloudflare Pages Function handling:
 *   GET  /api/books     — List all books (public)
 *   POST /api/books     — Create/publish a book (requires Clerk auth)
 */

import { Env, verifyClerkSession } from "../../lib/auth";

interface BookRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  content_md: string;
  created_at: string;
  updated_at: string;
}

interface PublishPayload {
  bookSlug: string;
  chapterTitle: string;
  markdownContent: string;
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

/**
 * GET /api/books — Public. Returns all books (without full content by default).
 */
async function handleGetBooks(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const includeContent = url.searchParams.get("content") === "true";
  const statusFilter = url.searchParams.get("status");

  let query: string;
  const params: unknown[] = [];

  if (includeContent) {
    query = "SELECT id, slug, title, status, content_md, created_at, updated_at FROM books";
  } else {
    query = "SELECT id, slug, title, status, created_at, updated_at FROM books";
  }

  if (statusFilter && (statusFilter === "draft" || statusFilter === "published")) {
    query += " WHERE status = ?1";
    params.push(statusFilter);
  }

  query += " ORDER BY created_at DESC";

  const result = await env.DB.prepare(query)
    .bind(...params)
    .all<BookRow>();

  return jsonResponse({ books: result.results });
}

/**
 * POST /api/books — Authenticated. Creates or updates a book entry.
 */
async function handlePostBook(
  env: Env,
  request: Request
): Promise<Response> {
  // Verify authentication BEFORE any DB operation
  const session = await verifyClerkSession(request, env);
  if (!session) {
    return errorResponse("Unauthorized: valid Clerk session required", 401);
  }

  let payload: PublishPayload;
  try {
    payload = (await request.json()) as PublishPayload;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  // Validate required fields
  if (!payload.bookSlug || !payload.chapterTitle || !payload.markdownContent) {
    return errorResponse(
      "Missing required fields: bookSlug, chapterTitle, markdownContent",
      400
    );
  }

  // Validate slug format
  if (!/^[a-zA-Z0-9_-]+$/.test(payload.bookSlug)) {
    return errorResponse("Invalid bookSlug format", 400);
  }

  const now = new Date().toISOString();
  const id = payload.bookSlug; // Use slug as deterministic ID

  // Upsert: insert or update on conflict
  const result = await env.DB.prepare(
    `INSERT INTO books (id, slug, title, status, content_md, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
     ON CONFLICT(slug) DO UPDATE SET
       title = excluded.title,
       content_md = excluded.content_md,
       status = excluded.status,
       updated_at = excluded.updated_at`
  )
    .bind(
      id,
      payload.bookSlug,
      payload.chapterTitle,
      "published",
      payload.markdownContent,
      now,
      now
    )
    .run();

  if (!result.success) {
    return errorResponse("Database write failed", 500);
  }

  return jsonResponse(
    {
      success: true,
      message: `Successfully saved "${payload.chapterTitle}" to ${payload.bookSlug}`,
      book: {
        id,
        slug: payload.bookSlug,
        title: payload.chapterTitle,
        status: "published",
        updated_at: now,
      },
    },
    201
  );
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    switch (request.method) {
      case "GET":
        return handleGetBooks(env, request);
      case "POST":
        return handlePostBook(env, request);
      case "OPTIONS":
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
