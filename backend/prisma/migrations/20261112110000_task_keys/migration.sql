-- Season tasks are now keyed per pack/overlay ("<pack id>:<template key>"), so a
-- task done or skipped this season never comes back. Rewrite existing keys to match,
-- or the next refresh would add a second copy of every pending one.
UPDATE "tasks"
SET source_key = seasonal_pack_id || ':' || source_key
WHERE source = 'SEASONAL_PACK'
  AND seasonal_pack_id IS NOT NULL
  AND source_key IS NOT NULL
  AND position(':' IN source_key) = 0;

UPDATE "tasks"
SET source_key = personalized_overlay_id || ':' || source_key
WHERE source = 'PERSONALIZED_OVERLAY'
  AND personalized_overlay_id IS NOT NULL
  AND source_key IS NOT NULL
  AND position(':' IN source_key) = 0;

-- One pending task per (plant, source, key): cancel any extra copies a race let in
-- (keeping the earliest), then enforce it.
UPDATE "tasks" t
SET status = 'CANCELLED'
FROM "tasks" d
WHERE t.status = 'PENDING'
  AND d.status = 'PENDING'
  AND t.tree_id = d.tree_id
  AND t.source = d.source
  AND t.source_key = d.source_key
  AND (t.created_at, t.id) > (d.created_at, d.id);

CREATE UNIQUE INDEX "tasks_pending_source_key_key"
  ON "tasks"("tree_id", "source", "source_key")
  WHERE status = 'PENDING' AND source_key IS NOT NULL;
