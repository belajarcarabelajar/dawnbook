/**
 * functions/api/progress.ts
 *
 * Cloudflare Pages Function handling reading progress:
 *   GET  /api/progress?bookSlug=... — Get last read path
 *   POST /api/progress — Save last read path
 */

import { Env, verifySession } from "../lib/auth";

interface ProgressRow {
  last_read_path: string;
  completed_paths: string;
}

interface ProgressPayload {
  bookSlug: string;
  path: string;
  completed_path?: string;
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

async function handleGetProgress(env: Env, request: Request): Promise<Response> {
  const session = await verifySession(request, env);
  if (!session || !session.sub) {
    return errorResponse("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug");
  if (!bookSlug) {
    // Return all progress for user
    const results = await env.DB.prepare(
      "SELECT book_slug, last_read_path, completed_paths FROM reading_progress WHERE user_id = ?1"
    )
      .bind(session.sub)
      .all<{book_slug: string, last_read_path: string, completed_paths: string}>();
      
    const parsedResults = results.results.map(row => {
      let parsed = [];
      try {
        if (row.completed_paths) parsed = JSON.parse(row.completed_paths);
      } catch (e) {}
      return {
        book_slug: row.book_slug,
        last_read_path: row.last_read_path,
        completed_paths: parsed
      };
    });

    return jsonResponse({ progress: parsedResults });
  }

  const result = await env.DB.prepare(
    "SELECT last_read_path, completed_paths FROM reading_progress WHERE user_id = ?1 AND book_slug = ?2"
  )
    .bind(session.sub, bookSlug)
    .first<ProgressRow>();

  if (!result) {
    return jsonResponse({ path: null, completed_paths: [] });
  }

  let parsedPaths = [];
  try {
    if (result.completed_paths) parsedPaths = JSON.parse(result.completed_paths);
  } catch(e) {}

  return jsonResponse({ 
    path: result.last_read_path,
    completed_paths: parsedPaths
  });
}

async function handlePostProgress(env: Env, request: Request): Promise<Response> {
  console.log("POST /api/progress hit!");
  const session = await verifySession(request, env);
  if (!session || !session.sub) {
    return errorResponse("Unauthorized", 401);
  }

  let payload: ProgressPayload;
  try {
    payload = (await request.json()) as ProgressPayload;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (!payload.bookSlug || !/^[a-zA-Z0-9_-]+$/.test(payload.bookSlug) || payload.bookSlug.length > 100) {
    return errorResponse("Invalid bookSlug format or length", 400);
  }

  if (!payload.path || typeof payload.path !== 'string' || payload.path.length > 1000 || !payload.path.startsWith('/')) {
    { console.log("Failed path check:", payload.path); return errorResponse("Invalid path format or length", 400); }
  }

  if (payload.completed_path && (typeof payload.completed_path !== 'string' || payload.completed_path.length > 1000 || !payload.completed_path.startsWith('/'))) {
    return errorResponse("Invalid completed_path format or length", 400);
  }

  const now = new Date().toISOString();

  // Fetch existing to append to completed_paths
  let completedPaths: string[] = [];
  const existing = await env.DB.prepare(
    "SELECT completed_paths FROM reading_progress WHERE user_id = ?1 AND book_slug = ?2"
  ).bind(session.sub, payload.bookSlug).first<{completed_paths: string}>();

  if (existing && existing.completed_paths) {
    try {
      completedPaths = JSON.parse(existing.completed_paths);
    } catch(e) {}
  }

  if (payload.completed_path && !completedPaths.includes(payload.completed_path)) {
    completedPaths.push(payload.completed_path);
  }

  const completedPathsJson = JSON.stringify(completedPaths);

  const result = await env.DB.prepare(
    `INSERT INTO reading_progress (user_id, book_slug, last_read_path, updated_at, completed_paths)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(user_id, book_slug) DO UPDATE SET
       last_read_path = excluded.last_read_path,
       updated_at = excluded.updated_at,
       completed_paths = excluded.completed_paths`
  )
    .bind(session.sub, payload.bookSlug, payload.path, now, completedPathsJson)
    .run();

  if (!result.success) {
    { console.log("DB write failed"); return errorResponse("Database write failed", 500); }
  }

  return jsonResponse({ success: true, completed_paths: completedPaths }, 201);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    switch (request.method) {
      case "GET":
        return handleGetProgress(env, request);
      case "POST":
        return handlePostProgress(env, request);

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
