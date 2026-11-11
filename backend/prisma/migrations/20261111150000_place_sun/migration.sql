-- CreateEnum
CREATE TYPE "GardenSun" AS ENUM ('FULL', 'PARTIAL', 'SHADE');

-- AlterTable
ALTER TABLE "garden_places" ADD COLUMN     "sun_hours" "GardenSun";

