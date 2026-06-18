-- 0005_book_view_count.sql
-- Add view_count for books

ALTER TABLE books ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_books_view_count ON books(view_count DESC);
