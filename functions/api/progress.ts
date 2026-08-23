/**
 * functions/api/progress.ts
 *
 * Cloudflare Pages Function handling reading progress:
 *   GET  /api/progress?bookSlug=... — Get last read path
 *   POST /api/progress — Save last read path
 */

import { Env, verifySession } from "../lib/auth";
import { enforceRateLimit } from "../lib/rate-limit";
import { jsonResponse, errorResponse } from "../lib/response";

interface ProgressRow {
  last_read_path: string;
  completed_paths: string;
}

interface ProgressPayload {
  bookSlug: string;
  path: string;
  completed_path?: string;
}

async function handleGetProgress(
  env: Env,
  request: Request,
): Promise<Response> {
  const session = await verifySession(request, env);
  if (!session || !session.sub) {
    return errorResponse("Unauthorized", 401);
  }

  const url = new URL(request.url);
  const bookSlug = url.searchParams.get("bookSlug");
  if (!bookSlug) {
    // Return all progress for user
    const results = await env.DB.prepare(
      `SELECT
         book_slug,
         last_read_path,
         CASE
           WHEN json_valid(completed_paths) AND json_type(completed_paths) = 'array' THEN completed_paths
           ELSE '[]'
         END as completed_paths
       FROM reading_progress WHERE user_id = ?1`
    )
      .bind(session.sub)
      .all<{
        book_slug: string;
        last_read_path: string;
        completed_paths: string;
      }>();

    // Avoid blocking the event loop with JSON.parse on each row by concatenating the validated JSON string directly
    const responseStr = `{"progress":[${results.results.map(row => {
      // Fallback in case of mocked/invalid db responses that bypass SQLite's json_valid check in tests
      const cp = (row.completed_paths && row.completed_paths.startsWith('[') && row.completed_paths.endsWith(']')) ? row.completed_paths : '[]';
      return `{"book_slug":${JSON.stringify(row.book_slug)},"last_read_path":${JSON.stringify(row.last_read_path)},"completed_paths":${cp}}`;
    }).join(',')}]}`;

    return new Response(responseStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await env.DB.prepare(
    `SELECT
       last_read_path,
       CASE
         WHEN json_valid(completed_paths) AND json_type(completed_paths) = 'array' THEN completed_paths
         ELSE '[]'
       END as completed_paths
     FROM reading_progress WHERE user_id = ?1 AND book_slug = ?2`
  )
    .bind(session.sub, bookSlug)
    .first<ProgressRow>();

  if (!result) {
    return jsonResponse({ path: null, completed_paths: [] });
  }

  const cp = (result.completed_paths && result.completed_paths.startsWith('[') && result.completed_paths.endsWith(']')) ? result.completed_paths : '[]';
  const responseStr = `{"path":${JSON.stringify(result.last_read_path)},"completed_paths":${cp}}`;

  return new Response(responseStr, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

async function handlePostProgress(
  env: Env,
  request: Request,
): Promise<Response> {
  const session = await verifySession(request, env);
  if (!session || !session.sub) {
    return errorResponse("Unauthorized", 401);
  }

  // Per-user cap on progress writes so a runaway tab/script cannot flood D1.
  const rateLimited = await enforceRateLimit(env, request, {
    route: "progress",
    limit: 120,
    windowSeconds: 600,
    userKey: session.sub,
  });
  if (rateLimited) return rateLimited;

  let payload: ProgressPayload;
  try {
    payload = (await request.json()) as ProgressPayload;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  if (
    !payload.bookSlug ||
    !/^[a-zA-Z0-9_-]+$/.test(payload.bookSlug) ||
    payload.bookSlug.length > 100
  ) {
    return errorResponse("Invalid bookSlug format or length", 400);
  }

  if (
    !payload.path ||
    typeof payload.path !== "string" ||
    payload.path.length > 1000 ||
    !payload.path.startsWith("/")
  ) {
    return errorResponse("Invalid path format or length", 400);
  }

  if (
    payload.completed_path &&
    (typeof payload.completed_path !== "string" ||
      payload.completed_path.length > 1000 ||
      !payload.completed_path.startsWith("/"))
  ) {
    return errorResponse("Invalid completed_path format or length", 400);
  }

  const now = new Date().toISOString();

  // Fetch existing to append to completed_paths
  let completedPaths: string[] = [];
  const existing = await env.DB.prepare(
    "SELECT completed_paths FROM reading_progress WHERE user_id = ?1 AND book_slug = ?2",
  )
    .bind(session.sub, payload.bookSlug)
    .first<{ completed_paths: string }>();

  if (existing && existing.completed_paths) {
    try {
      const jsonParsed = JSON.parse(existing.completed_paths);
      if (Array.isArray(jsonParsed)) {
        completedPaths = jsonParsed;
      }
    } catch (e) {
      console.warn("[progress] Failed to parse existing completed_paths JSON on POST:", e);
    }
  }

  if (
    payload.completed_path &&
    !completedPaths.includes(payload.completed_path)
  ) {
    completedPaths.push(payload.completed_path);
  }

  const completedPathsJson = JSON.stringify(completedPaths);

  const result = await env.DB.prepare(
    `INSERT INTO reading_progress (user_id, book_slug, last_read_path, updated_at, completed_paths)
     VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT(user_id, book_slug) DO UPDATE SET
       last_read_path = excluded.last_read_path,
       updated_at = excluded.updated_at,
       completed_paths = excluded.completed_paths`,
  )
    .bind(session.sub, payload.bookSlug, payload.path, now, completedPathsJson)
    .run();

  if (!result.success) {
    console.error("DB write failed for reading_progress");
    return errorResponse("Database write failed", 500);
  }

  return jsonResponse({ success: true, completed_paths: completedPaths }, 201);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    switch (request.method) {
      case "GET":
        return await handleGetProgress(env, request);
      case "POST":
        return await handlePostProgress(env, request);

      default:
        return errorResponse("Method not allowed", 405);
    }
  } catch (err) {
    console.error("API error:", err);
    return errorResponse("Internal server error", 500);
  }
};
