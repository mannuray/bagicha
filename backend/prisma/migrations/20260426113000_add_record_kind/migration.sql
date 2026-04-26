CREATE TYPE "RecordKind" AS ENUM ('TREE', 'FLOWER', 'CROP');

ALTER TABLE "trees"
ADD COLUMN "record_kind" "RecordKind" NOT NULL DEFAULT 'TREE';
