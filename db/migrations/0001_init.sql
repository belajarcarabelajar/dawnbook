-- 0001_init.sql
-- Initial schema for Dawnbook D1 database.
-- Derived from Book and PublishPayload TypeScript interfaces.

CREATE TABLE IF NOT EXISTS books (
  id         TEXT    PRIMARY KEY,
  slug       TEXT    UNIQUE NOT NULL,
  title      TEXT    NOT NULL,
  status     TEXT    NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  content_md TEXT    NOT NULL,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);

-- Index on status for filtered listing queries
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
