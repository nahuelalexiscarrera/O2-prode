-- Migration: comment_count trigger
-- Keeps post.comment_count in sync when comments are inserted or hard-deleted.
-- Soft deletes (deleted_at) are handled by the app layer (comment stays in table,
-- realtime hook filters it out client-side), so we only need INSERT / DELETE here.

CREATE OR REPLACE FUNCTION trg_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_comment_count_change ON comment;

CREATE TRIGGER trg_comment_count_change
  AFTER INSERT OR DELETE ON comment
  FOR EACH ROW EXECUTE FUNCTION trg_comment_count();
