-- Reference SQL. Use the guarded scripts/migrate-favorites.mjs runner.
-- Existing bookmarks deliberately keep NULL (unknown) saved dates.
ALTER TABLE bookmarks ADD COLUMN created_at INTEGER;
CREATE INDEX bookmarks_user_created_idx ON bookmarks(user_id,created_at DESC,paper_id);
CREATE INDEX papers_review_queue_idx ON research_papers(status,program_id,year DESC,id DESC);
