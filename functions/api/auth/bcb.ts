/**
 * functions/api/auth/bcb.ts
 *
 * GET /api/auth/bcb?t=<token>&next=<path>
 *
 * Store hand-off from belajarcarabelajar.com: verifies the signed token
 * (functions/lib/bcb-sso.ts), burns its nonce, finds or creates the user by
 * email, opens a session exactly like the Google callback, and 302-redirects
 * to a same-site `next` path (or "/"). Failures redirect to
 * /sign-in?error=<code>. The token and email are never logged.
 */

import type { PagesFunction } from "../../lib/pages-function";
import type { Env } from "../../lib/auth";
import { assertSsoSecret, verifySsoToken } from "../../lib/bcb-sso";
import { safeRedirectPath } from "../../lib/oauth";
import { createSession } from "../../lib/db";
import { findOrCreateBcbUser } from "../../lib/sso-user";

export interface BcbSsoEnv extends Env {
  BCB_SSO_SECRET?: string;
}

// Same cookie name and lifetime as functions/api/auth/callback.ts, which keeps
// them module-private; duplicated here rather than editing that file.
const SESSION_COOKIE = "session_id";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
// Outlives SSO_MAX_AGE_S, so a token cannot be replayed after its nonce row
// is garbage-collected.
const NONCE_TTL_SECONDS = 600;

function redirectWithError(request: Request, code: string): Response {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("error", code);
  return new Response(null, {
    status: 302,
    headers: { Location: url.toString(), "Cache-Control": "no-store" },
  });
}

function newSessionId(): string {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function handleBcbSso(
  request: Request,
  env: BcbSsoEnv,
  nowSec: number,
): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "GET", "Cache-Control": "no-store" },
    });
  }

  let secret: string;
  try {
    secret = assertSsoSecret(env.BCB_SSO_SECRET);
  } catch {
    return redirectWithError(request, "sso_unavailable");
  }

  const url = new URL(request.url);
  const claims = await verifySsoToken(secret, url.searchParams.get("t") ?? "", nowSec);
  if (!claims) return redirectWithError(request, "sso_invalid");

  try {
    // Single use: the nonce row must be new before any session exists.
    const burn = await env.DB.prepare(
      `INSERT INTO rate_limits (key, count, window_start, expires_at)
       VALUES (?1, 1, ?2, ?3)
       ON CONFLICT(key) DO NOTHING`,
    )
      .bind(`sso:${claims.nonce}`, nowSec, nowSec + NONCE_TTL_SECONDS)
      .run();
    if (!burn.meta.changes) return redirectWithError(request, "sso_invalid");

    const user = await findOrCreateBcbUser(env.DB, claims.email);
    // A store purchase must never grant an admin session; admins sign in with
    // Google. The nonce stays consumed.
    if (user.role === "admin") return redirectWithError(request, "sso_invalid");

    const sessionId = newSessionId();
    await createSession(env.DB, {
      id: sessionId,
      user_id: user.id,
      expires_at: new Date((nowSec + SESSION_TTL_SECONDS) * 1000).toISOString(),
      user_agent: request.headers.get("User-Agent") ?? null,
      ip: request.headers.get("CF-Connecting-IP") ?? null,
    });

    const dest = new URL(safeRedirectPath(url.searchParams.get("next")), request.url);
    const headers = new Headers({
      Location: dest.toString(),
      "Cache-Control": "no-store",
    });
    headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE}=${sessionId}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
    );
    return new Response(null, { status: 302, headers });
  } catch (err) {
    // Only the error name: a D1 message could quote the email.
    console.error("[auth/bcb] D1 ops failed:", err instanceof Error ? err.name : "unknown");
    return redirectWithError(request, "server");
  }
}

export const onRequest: PagesFunction<BcbSsoEnv> = async ({ request, env }) =>
  handleBcbSso(request, env, Math.floor(Date.now() / 1000));
