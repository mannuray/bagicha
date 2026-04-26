ALTER TABLE "tree_logs"
ADD COLUMN "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "tree_logs"
SET "recorded_at" = "timestamp"
WHERE "recorded_at" IS NULL OR "recorded_at" <> "timestamp";
