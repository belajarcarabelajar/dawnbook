-- 0003_progress_completion.sql
-- Add completed_paths to track cumulative book progress

ALTER TABLE reading_progress ADD COLUMN completed_paths TEXT DEFAULT '[]';
