-- Migration 0006: User accounts + sessions for Google OAuth (replaces Clerk).
--
-- Conventions follow 0001-0005:
--   * ISO 8601 strings for timestamps (strftime in DEFAULT).
--   * TEXT for enums with CHECK constraints.
--   * Idempotent via IF NOT EXISTS on tables + indices.
--
-- Fresh-start semantics: no data is backfilled from Clerk. The new tables are
-- empty; old users re-login with Google and get new rows. reading_progress
-- rows (which reference the Clerk `sub` as `user_id`) are left untouched —
-- they will become orphaned but the column is preserved so the API surface
-- does not break.

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  google_sub      TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  picture         TEXT,
  role            TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('reader', 'admin')),
  donation_badge  TEXT,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_login_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,        -- 64-char hex (32 bytes)
  user_id      TEXT NOT NULL,
  expires_at   TEXT NOT NULL,           -- ISO 8601
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  last_seen_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  user_agent   TEXT,
  ip           TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
