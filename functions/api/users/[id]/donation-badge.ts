/**
 * functions/api/users/[id]/donation-badge.ts
 *
 * PATCH /api/users/:id/donation-badge — Set a user's donation tier.
 *
 * Auth: requires an admin session (D1-based, role === "admin").
 *
 * Body: { "tier": "Gold" | "Silver" | "Bronze" | null }
 *   - `null` clears the badge.
 *
 * Responses:
 *   200 { ok: true, tier: "Gold" } on success
 *   400 { error: "..." } on invalid body / invalid tier
 *   401 { error: "Unauthorized" } when no session
 *   403 { error: "Forbidden" } when session is not an admin
 *   404 { error: "User not found" } when the target user_id does not exist
 */

import { verifySession, type Env } from "../../../lib/auth";
import { setDonationBadge, getUserById } from "../../../lib/db";

interface PatchBody {
  tier?: unknown;
}

const ALLOWED_TIERS = new Set(["Gold", "Silver", "Bronze"]);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const userId = (params as Record<string, string | string[] | undefined>).id as
    | string
    | undefined;
  if (!userId) {
    return jsonResponse({ error: "Missing user id" }, 400);
  }

  // Auth: must be an admin session.
  const session = await verifySession(request, env);
  if (!session) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (session.role !== "admin") {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  // Parse + validate body.
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const { tier } = body;
  if (tier !== null && typeof tier !== "string") {
    return jsonResponse({ error: "tier must be a string or null" }, 400);
  }
  if (tier !== null && !ALLOWED_TIERS.has(tier)) {
    return jsonResponse(
      { error: `tier must be one of: Gold, Silver, Bronze, null` },
      400
    );
  }

  // Confirm target user exists before writing — gives a clean 404.
  const target = await getUserById(env.DB, userId);
  if (!target) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  const ok = await setDonationBadge(env.DB, {
    userId,
    tier: tier as string | null,
  });
  if (!ok) {
    return jsonResponse({ error: "Update failed" }, 500);
  }

  return jsonResponse({ ok: true, tier });
};
