-- The audit log stays append-only, with one exception for account erasure:
-- a COMMUNITY_REPORT_FILED row may have its snapshot's "reason" and
-- "content_excerpt" set to null (the words of a person who deleted their
-- account). Every other column and every other snapshot key must stay as it was.
CREATE OR REPLACE FUNCTION audit_events_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.action = 'COMMUNITY_REPORT_FILED'
     AND NEW.id = OLD.id
     AND NEW.action = OLD.action
     AND NEW.actor_user_id IS NOT DISTINCT FROM OLD.actor_user_id
     AND NEW.target_type = OLD.target_type
     AND NEW.target_id = OLD.target_id
     AND NEW.created_at = OLD.created_at
     AND NEW.snapshot = OLD.snapshot || '{"reason": null, "content_excerpt": null}'::jsonb
  THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;
