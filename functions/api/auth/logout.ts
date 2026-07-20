/**
 * functions/api/auth/logout.ts
 *
 * POST /api/auth/logout
 *
 * Deletes the current session from D1 (so the cookie cannot be reused
 * after revocation) and clears the `session_id` cookie. Idempotent: if
 * the cookie is missing or already invalid, returns 204 anyway.
 */

import { deleteSession } from "../../lib/db";
import { extractSessionId } from "../../lib/auth";
import type { Env } from "../../lib/auth";

const SESSION_COOKIE = "session_id";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const sid = extractSessionId(request);
  if (sid) {
    try {
      await deleteSession(env.DB, sid);
    } catch (err) {
      console.error("[auth/logout] D1 delete failed:", err);
      // Still clear the cookie — the worst case is a stale session row
      // that the periodic GC will remove.
    }
  }
  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
      "Cache-Control": "no-store",
    },
  });
};

// Allow GET for browser bookmark / direct link to sign out, with the same
// semantics. Some sign-out UI patterns link to a URL rather than POSTing.
export const onRequestGet = onRequestPost;
