-- Payments applied before applied_payments existed (de-dup was Redis-only) are in
-- the audit log; record them so a late Razorpay redelivery can't apply them again.
INSERT INTO "applied_payments" ("payment_id", "user_id", "plan_id", "applied_at")
SELECT DISTINCT ON (snapshot->>'payment_id')
  snapshot->>'payment_id',
  target_id,
  COALESCE(snapshot->>'plan_id', 'UNKNOWN'),
  created_at
FROM "audit_events"
WHERE action = 'SUBSCRIPTION_CHANGED'
  AND snapshot->>'payment_id' IS NOT NULL
ORDER BY snapshot->>'payment_id', created_at
ON CONFLICT ("payment_id") DO NOTHING;
