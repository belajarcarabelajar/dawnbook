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
  subject_label?: string | null;
  view_count: number;
}

interface PublishPayload {
  bookSlug: string;
  chapterTitle: string;
  markdownContent: string;
  subjectLabel?: string;
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
  const subjectLabel = url.searchParams.get("subject_label");
  const sortBy = url.searchParams.get("sort_by") || "newest";

  let query: string;
  const params: unknown[] = [];

  if (includeContent) {
    query = "SELECT id, slug, title, status, content_md, created_at, updated_at, subject_label, view_count FROM books";
  } else {
    query = "SELECT id, slug, title, status, created_at, updated_at, subject_label, view_count FROM books";
  }

  const conditions = [];

  if (statusFilter && (statusFilter === "draft" || statusFilter === "published")) {
    conditions.push(`status = ?${params.length + 1}`);
    params.push(statusFilter);
  }

  if (subjectLabel) {
    conditions.push(`subject_label = ?${params.length + 1}`);
    params.push(subjectLabel);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  if (sortBy === "oldest") {
    query += " ORDER BY created_at ASC";
  } else if (sortBy === "popular") {
    query += " ORDER BY view_count DESC, created_at DESC";
  } else {
    query += " ORDER BY created_at DESC";
  }

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

  // Strict Admin Authorization
  if (session.sub !== "user_3FGEVcEVho4UC4uCE6gs3TfyVwV") {
    return errorResponse("Forbidden: Administrator access required", 403);
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

  // Validate slug format and general lengths
  if (!/^[a-zA-Z0-9_-]+$/.test(payload.bookSlug) || payload.bookSlug.length > 100) {
    return errorResponse("Invalid bookSlug format or length", 400);
  }

  if (payload.chapterTitle.length > 300) {
    return errorResponse("chapterTitle too long", 400);
  }

  if (payload.markdownContent.length > 5000000) {
    return errorResponse("markdownContent too long", 400);
  }

  if (payload.subjectLabel && payload.subjectLabel.length > 100) {
    return errorResponse("subjectLabel too long", 400);
  }

  const now = new Date().toISOString();
  const id = payload.bookSlug; // Use slug as deterministic ID

  // Upsert: insert or update on conflict (with empty content initially)
  const initResult = await env.DB.prepare(
    `INSERT INTO books (id, slug, title, status, content_md, created_at, updated_at, subject_label, view_count)
     VALUES (?1, ?2, ?3, ?4, '', ?5, ?6, ?7, 0)
     ON CONFLICT(slug) DO UPDATE SET
       title = excluded.title,
       content_md = '',
       status = excluded.status,
       subject_label = excluded.subject_label,
       updated_at = excluded.updated_at`
  )
    .bind(
      id,
      payload.bookSlug,
      payload.chapterTitle,
      "published",
      now,
      now,
      payload.subjectLabel || null
    )
    .run();

  if (!initResult.success) {
    return errorResponse("Database metadata write failed", 500);
  }

  // Chunk content to avoid SQLITE_TOOBIG limits (Cloudflare D1 100KB statement limit)
  const chunkSize = 30000;
  const statements = [];
  for (let i = 0; i < payload.markdownContent.length; i += chunkSize) {
    const chunk = payload.markdownContent.slice(i, i + chunkSize);
    statements.push(
      env.DB.prepare(
        "UPDATE books SET content_md = content_md || ?1 WHERE slug = ?2"
      ).bind(chunk, payload.bookSlug)
    );
  }

  if (statements.length > 0) {
    const batchRes = await env.DB.batch(statements);
    const allSuccess = batchRes.every((res) => res.success);
    if (!allSuccess) {
      return errorResponse("Database chunk write failed", 500);
    }
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
        subject_label: payload.subjectLabel || null,
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

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
