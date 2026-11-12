-- The audit log refuses a whole-table wipe too (row triggers don't fire on TRUNCATE).
-- Test resets switch this trigger off around their TRUNCATE (test/e2e/fixtures.ts).
CREATE TRIGGER audit_events_no_truncate
  BEFORE TRUNCATE ON "audit_events"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_events_append_only();
