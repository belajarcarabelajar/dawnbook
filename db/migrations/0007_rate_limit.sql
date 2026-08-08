-- Migration 0007: Rate-limiting counters (fixed-window, D1-backed).
--
-- Cloudflare Pages Functions isolates are stateless and recycled, so an
-- in-memory counter is unreliable. This table stores a single counter row
-- per "<route>:<ip|user>" key; the counter is incremented atomically by
-- functions/lib/rate-limit.ts via a single
-- `INSERT ... ON CONFLICT ... RETURNING` statement, so no background task
-- is needed for correctness (expired windows reset inline).
--
-- Timestamps are unix seconds (integers) so the window arithmetic in the
-- UPSERT is simple and portable across SQLite versions.

CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,          -- "<route>:<ip|user>"
  count        INTEGER NOT NULL,          -- requests observed in the current window
  window_start INTEGER NOT NULL,          -- unix seconds the window began
  expires_at   INTEGER NOT NULL           -- unix seconds the window ends
);

-- Supports an optional periodic GC job that removes fully-expired rows.
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits (expires_at);
