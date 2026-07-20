/**
 * functions/lib/auth.ts
 *
 * Shared authentication logic for Cloudflare Pages Functions using D1 +
 * Google OAuth. Replaces the previous Clerk JWT-based flow.
 *
 * A session is identified by an opaque random `session_id` cookie (64-char
 * hex). On every request, the cookie is looked up against the `sessions`
 * table; expiry and last-seen are checked; the joined `users` row is
 * returned as the authenticated principal.
 *
 * The returned `AuthSession` keeps the Clerk-era shape (`sub` is the user
 * id, `email` and `role` are surfaced alongside) so that existing handlers
 * (which still read `session.sub` and `session.publicMetadata.role`) only
 * need a one-line swap from the previous Clerk-based verifier to
 * `verifySession`.
 */

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: "reader" | "admin";
}

export interface AuthSession {
  /** User id (users.id). Replaces Clerk's `sub`. */
  sub: string;
  /** Session id (sessions.id). Useful for refresh/logout flows. */
  sid: string;
  email: string;
  role: "reader" | "admin";
  /**
   * Kept for backward compatibility with handlers that previously read
   * Clerk's `publicMetadata.role`. New code should prefer `role` directly.
   */
  publicMetadata: { role: "reader" | "admin" };
  [key: string]: unknown;
}

interface SessionRow {
  s_id: string;
  s_user_id: string;
  s_expires_at: string;
  u_id: string;
  u_email: string;
  u_name: string | null;
  u_picture: string | null;
  u_role: "reader" | "admin";
}

/**
 * Extracts the session id from either the `session_id` cookie or the
 * `Authorization: Session <hex>` header. Returns null if absent or
 * malformed. Validates that the value is exactly 64 lowercase hex chars
 * (the format we generate on session creation).
 */
export function extractSessionId(request: Request): string | null {
  const HEX64 = /^[a-f0-9]{64}$/;

  // 1. Cookie (browser flow).
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const c of cookieHeader.split(";").map((c) => c.trim())) {
    if (c.startsWith("session_id=")) {
      const v = c.slice("session_id=".length).trim();
      if (v && HEX64.test(v)) return v;
    }
  }

  // 2. Authorization: Session <hex> (programmatic clients).
  const auth = request.headers.get("Authorization");
  if (auth?.startsWith("Session ")) {
    const v = auth.slice(8).trim();
    if (v && HEX64.test(v)) return v;
  }

  return null;
}

/**
 * Verifies a session by looking it up in D1. Returns the joined
 * AuthSession on success, or null if the session is missing, malformed,
 * or expired. Expired sessions are left in place (a periodic cleanup
 * task, not implemented here, would GC them).
 */
export async function verifySession(
  request: Request,
  env: Env
): Promise<AuthSession | null> {
  const sid = extractSessionId(request);
  if (!sid) return null;

  const row = await env.DB.prepare(
    `SELECT
       s.id           AS s_id,
       s.user_id      AS s_user_id,
       s.expires_at   AS s_expires_at,
       u.id           AS u_id,
       u.email        AS u_email,
       u.name         AS u_name,
       u.picture      AS u_picture,
       u.role         AS u_role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?1`
  )
    .bind(sid)
    .first<SessionRow>();

  if (!row) return null;

  // Expiry check: ISO 8601 strings are lexicographically comparable when
  // they are normalized to UTC, which our schema enforces.
  const now = new Date().toISOString();
  if (row.s_expires_at <= now) return null;

  // Best-effort last-seen update. Failure here must not break the request,
  // so swallow errors silently. (Pages Functions have ~50ms CPU budget
  // per request on the free plan; this is a single point UPDATE.)
  try {
    await env.DB.prepare(
      "UPDATE sessions SET last_seen_at = ?1 WHERE id = ?2"
    )
      .bind(now, sid)
      .run();
  } catch {
    // ignore
  }

  return {
    sub: row.u_id,
    sid: row.s_id,
    email: row.u_email,
    role: row.u_role,
    publicMetadata: { role: row.u_role },
  };
}
