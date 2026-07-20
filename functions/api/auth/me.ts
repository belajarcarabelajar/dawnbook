/**
 * functions/api/auth/me.ts
 *
 * GET /api/auth/me
 *
 * Returns the current authenticated user as JSON, or 401 if not signed in.
 * Used by the admin SPA to bootstrap the auth context.
 */

import { getSessionWithUser } from "../../lib/db";
import { extractSessionId } from "../../lib/auth";
import type { Env } from "../../lib/auth";

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const sid = extractSessionId(request);
  if (!sid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  const result = await getSessionWithUser(env.DB, sid);
  if (!result) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
  const now = new Date().toISOString();
  if (result.session.expires_at <= now) {
    return new Response(JSON.stringify({ error: "Session expired" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  return new Response(
    JSON.stringify({
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      picture: result.user.picture,
      role: result.user.role,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
        Vary: "Cookie",
      },
    }
  );
};
