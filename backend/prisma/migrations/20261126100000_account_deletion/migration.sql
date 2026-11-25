-- Account deletion: a pending request and its erasure date (null = nothing pending).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletion_requested_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deletion_due_at" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "users_deletion_due_at_idx" ON "users"("deletion_due_at");
