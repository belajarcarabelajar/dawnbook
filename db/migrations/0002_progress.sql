-- 0002_progress.sql
-- Checkpoint system for storing a user's reading progress per book.

CREATE TABLE IF NOT EXISTS reading_progress (
  user_id        TEXT    NOT NULL,
  book_slug      TEXT    NOT NULL,
  last_read_path TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  PRIMARY KEY (user_id, book_slug)
);
