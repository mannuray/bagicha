-- AlterEnum
ALTER TYPE "TaskSource" ADD VALUE 'FLOWER_CARE';

-- One-time cleanup (flowers spec §3.1): flowers made before this ran the fruit
-- pack. Cancel their pending pack and overlay tasks; completed history stays.
-- Same statement as FLOWER_CLEANUP_SQL in src/modules/plant-ledger/domain/flower-care.ts.
UPDATE "tasks" SET "status" = 'CANCELLED' WHERE "status" = 'PENDING' AND "source" IN ('SEASONAL_PACK', 'PERSONALIZED_OVERLAY') AND "tree_id" IN (SELECT "id" FROM "trees" WHERE "record_kind" = 'FLOWER');
