/**
 * functions/api/books/index.ts
 *
 * Cloudflare Pages Function handling:
 *   GET  /api/books     — List all books (public)
 *   POST /api/books     — Create/publish a book (requires Clerk auth)
 */

interface Env {
  DB: D1Database;
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
}

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

/**
 * Verifies a Clerk session JWT from the Authorization header.
 * Returns the decoded payload on success, or null on failure.
 */
async function verifyClerkSession(
  request: Request,
  env: Env
): Promise<Record<string, unknown> | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  if (!token) return null;

  // Fetch Clerk's JWKS to verify the token
  // Extract the Clerk Frontend API domain from the publishable key
  const pkParts = env.CLERK_PUBLISHABLE_KEY;
  let clerkDomain: string;

  try {
    // Clerk publishable keys encode the Frontend API domain in base64
    // Format: pk_test_<base64-encoded-domain>$ or pk_live_<base64-encoded-domain>$
    const keyBody = pkParts.replace(/^pk_(test|live)_/, "").replace(/\$$/, "");
    clerkDomain = atob(keyBody);
  } catch {
    // Fallback: try using the secret key to call Clerk's session verification API
    return await verifyViaClerkAPI(token, env.CLERK_SECRET_KEY);
  }

  try {
    // Verify JWT using Clerk's JWKS endpoint
    const jwksUrl = `https://${clerkDomain}/.well-known/jwks.json`;
    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) {
      return await verifyViaClerkAPI(token, env.CLERK_SECRET_KEY);
    }

    const jwks = (await jwksResponse.json()) as { keys: JsonWebKey[] };
    if (!jwks.keys || jwks.keys.length === 0) {
      return null;
    }

    // Decode the JWT header to find the matching key
    const [headerB64] = token.split(".");
    const header = JSON.parse(atob(headerB64.replace(/-/g, "+").replace(/_/g, "/")));
    const matchingKey = jwks.keys.find(
      (k: any) => k.kid === header.kid && k.alg === header.alg
    );

    if (!matchingKey) return null;

    // Import the key and verify
    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      matchingKey,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const [, payloadB64, signatureB64] = token.split(".");
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signature,
      data
    );

    if (!valid) return null;

    // Decode and validate the payload
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
    ) as Record<string, unknown>;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Fallback: verify token via Clerk's Backend API.
 */
async function verifyViaClerkAPI(
  token: string,
  secretKey: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch("https://api.clerk.dev/v1/tokens/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
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
