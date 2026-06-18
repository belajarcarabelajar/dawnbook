-- 0004_book_subject_label.sql
-- Add subject_label for books

ALTER TABLE books ADD COLUMN subject_label TEXT;

CREATE INDEX IF NOT EXISTS idx_books_subject_label ON books(subject_label);
