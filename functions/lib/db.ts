/**
 * functions/lib/db.ts
 *
 * Centralized D1 query helpers for the auth subsystem. Every helper returns
 * plain rows; no `D1Result.meta` leakage. Each helper is a thin wrapper so
 * the SQL is still greppable from the calling site, but the parameter
 * binding shape is enforced in one place.
 *
 * Convention: query functions read (`.first()`/`.all()`); mutators return
 * the `{ success }` flag from D1 so callers can decide what to do on
 * failure (e.g. surface a 500).
 */

export interface UserRow {
  id: string;
  google_sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: "reader" | "admin";
  donation_badge: string | null;
  created_at: string;
  last_login_at: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
  last_seen_at: string;
  user_agent: string | null;
  ip: string | null;
}

export interface SessionWithUser {
  session: SessionRow;
  user: UserRow;
}

/**
 * Looks up a user by their stable Google subject id. Returns null if the
 * user has not been seen before (first-time login).
 */
export async function getUserByGoogleSub(
  db: D1Database,
  googleSub: string
): Promise<UserRow | null> {
  return await db
    .prepare(
      "SELECT id, google_sub, email, name, picture, role, donation_badge, created_at, last_login_at FROM users WHERE google_sub = ?1"
    )
    .bind(googleSub)
    .first<UserRow>();
}

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<UserRow | null> {
  return await db
    .prepare(
      "SELECT id, google_sub, email, name, picture, role, donation_badge, created_at, last_login_at FROM users WHERE email = ?1"
    )
    .bind(email)
    .first<UserRow>();
}

export async function getUserById(
  db: D1Database,
  id: string
): Promise<UserRow | null> {
  return await db
    .prepare(
      "SELECT id, google_sub, email, name, picture, role, donation_badge, created_at, last_login_at FROM users WHERE id = ?1"
    )
    .bind(id)
    .first<UserRow>();
}

/**
 * Inserts a new user, or updates the existing row keyed by `google_sub`
 * with the latest name/picture from Google. Always bumps `last_login_at`.
 *
 * Returns the resulting row (re-read after upsert so `id`, `role`, and
 * timestamps are correct).
 */
export async function upsertGoogleUser(
  db: D1Database,
  params: {
    id: string;
    google_sub: string;
    email: string;
    name: string | null;
    picture: string | null;
  }
): Promise<UserRow> {
  // Two statements because SQLite UPSERT in D1 needs unique index targets;
  // doing INSERT-or-IGNORE then UPDATE keeps the SQL obvious and avoids
  // relying on dialect-specific UPSERT syntax.
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO users (id, google_sub, email, name, picture, role, last_login_at)
       VALUES (?1, ?2, ?3, ?4, ?5, 'reader', ?6)`
    )
    .bind(params.id, params.google_sub, params.email, params.name, params.picture, now)
    .run();

  await db
    .prepare(
      `UPDATE users
       SET email = ?1, name = ?2, picture = ?3, last_login_at = ?4
       WHERE google_sub = ?5`
    )
    .bind(params.email, params.name, params.picture, now, params.google_sub)
    .run();

  const row = await getUserByGoogleSub(db, params.google_sub);
  if (!row) {
    throw new Error("upsertGoogleUser: row not found after upsert");
  }
  return row;
}

export async function createSession(
  db: D1Database,
  params: {
    id: string;
    user_id: string;
    expires_at: string;
    user_agent?: string | null;
    ip?: string | null;
  }
): Promise<SessionRow> {
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, expires_at, user_agent, ip)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    )
    .bind(params.id, params.user_id, params.expires_at, params.user_agent ?? null, params.ip ?? null)
    .run();
  const row = await db
    .prepare("SELECT id, user_id, expires_at, created_at, last_seen_at, user_agent, ip FROM sessions WHERE id = ?1")
    .bind(params.id)
    .first<SessionRow>();
  if (!row) throw new Error("createSession: row not found after insert");
  return row;
}

export async function deleteSession(db: D1Database, id: string): Promise<boolean> {
  const res = await db.prepare("DELETE FROM sessions WHERE id = ?1").bind(id).run();
  return res.success;
}

export async function getSessionWithUser(
  db: D1Database,
  sessionId: string
): Promise<SessionWithUser | null> {
  const row = await db
    .prepare(
      `SELECT
         s.id            AS s_id,
         s.user_id       AS s_user_id,
         s.expires_at    AS s_expires_at,
         s.created_at    AS s_created_at,
         s.last_seen_at  AS s_last_seen_at,
         s.user_agent    AS s_user_agent,
         s.ip            AS s_ip,
         u.id            AS u_id,
         u.google_sub    AS u_google_sub,
         u.email         AS u_email,
         u.name          AS u_name,
         u.picture       AS u_picture,
         u.role          AS u_role,
         u.donation_badge AS u_donation_badge,
         u.created_at    AS u_created_at,
         u.last_login_at AS u_last_login_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?1`
    )
    .bind(sessionId)
    .first<any>();
  if (!row) return null;
  const session: SessionRow = {
    id: row.s_id,
    user_id: row.s_user_id,
    expires_at: row.s_expires_at,
    created_at: row.s_created_at,
    last_seen_at: row.s_last_seen_at,
    user_agent: row.s_user_agent,
    ip: row.s_ip,
  };
  const user: UserRow = {
    id: row.u_id,
    google_sub: row.u_google_sub,
    email: row.u_email,
    name: row.u_name,
    picture: row.u_picture,
    role: row.u_role,
    donation_badge: row.u_donation_badge,
    created_at: row.u_created_at,
    last_login_at: row.u_last_login_at,
  };
  return { session, user };
}

/**
 * Generates a 26-char Crockford-base32 ULID-ish id. We do not need true
 * monotonicity for this use case, so a random 16-byte hex string is fine.
 * Collisions are practically impossible at the user scale of dawnbook.
 */
export function generateUserId(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}
