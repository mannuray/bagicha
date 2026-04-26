-- CreateEnum
CREATE TYPE "PlantingDatePrecision" AS ENUM ('EXACT_DATE', 'MONTH_YEAR', 'YEAR', 'UNKNOWN');

-- AlterTable
ALTER TABLE "trees"
ADD COLUMN "planting_date_precision" "PlantingDatePrecision" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "planting_date_input" TEXT;
