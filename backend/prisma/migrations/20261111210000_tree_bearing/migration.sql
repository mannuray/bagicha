-- CreateEnum
CREATE TYPE "BearingStatus" AS ENUM ('BEARING', 'NOT_YET');
-- AlterTable
ALTER TABLE "trees" ADD COLUMN     "bearing_since_year" INTEGER,
ADD COLUMN     "bearing_status" "BearingStatus";
