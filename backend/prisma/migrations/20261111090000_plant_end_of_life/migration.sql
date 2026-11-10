-- CreateEnum
CREATE TYPE "PlantEndReason" AS ENUM ('DISEASE_OR_PEST', 'WEATHER', 'WATER', 'OLD_AGE', 'UNKNOWN_CAUSE', 'REMOVED', 'REPLACED');

-- AlterEnum
ALTER TYPE "LogType" ADD VALUE 'PLANT_ENDED';

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "trees" ADD COLUMN     "end_entry_id" TEXT,
ADD COLUMN     "end_note" TEXT,
ADD COLUMN     "end_reason" "PlantEndReason",
ADD COLUMN     "ended_at" TIMESTAMP(3),
ADD COLUMN     "replaced_by_id" TEXT;

-- CreateIndex
CREATE INDEX "trees_user_id_ended_at_idx" ON "trees"("user_id", "ended_at");

-- AddForeignKey
ALTER TABLE "trees" ADD CONSTRAINT "trees_replaced_by_id_fkey" FOREIGN KEY ("replaced_by_id") REFERENCES "trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

