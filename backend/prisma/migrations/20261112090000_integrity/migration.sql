-- One report per reporter per target: remove any duplicates a race let in
-- (keeping the earliest), then enforce it.
DELETE FROM "reports" r
USING "reports" d
WHERE r.target_type = d.target_type
  AND r.target_id = d.target_id
  AND r.reporter_id = d.reporter_id
  AND (r.created_at, r.id) > (d.created_at, d.id);

CREATE UNIQUE INDEX "reports_target_type_target_id_reporter_id_key"
  ON "reports"("target_type", "target_id", "reporter_id");

-- The audit log is evidence: rows can be added, never changed or removed.
CREATE OR REPLACE FUNCTION audit_events_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_no_update_or_delete
  BEFORE UPDATE OR DELETE ON "audit_events"
  FOR EACH ROW EXECUTE FUNCTION audit_events_append_only();
