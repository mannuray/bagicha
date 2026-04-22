-- AlterTable
ALTER TABLE "users"
ADD COLUMN "garden_types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
