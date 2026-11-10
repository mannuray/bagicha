-- CreateEnum
CREATE TYPE "CropStage" AS ENUM ('PLANNED', 'NURSERY', 'IN_GROUND', 'HARVESTING', 'RESTING');

-- CreateEnum
CREATE TYPE "GardenPlaceKind" AS ENUM ('BED', 'GROW_BAG', 'POT', 'CONTAINER', 'GROUND');

-- AlterEnum
ALTER TYPE "TaskSource" ADD VALUE 'CROP_PLAN';

-- DropIndex
DROP INDEX "tree_cycles_tree_id_cycle_year_key";

-- AlterTable
ALTER TABLE "tree_cycles" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "place_id" TEXT,
ADD COLUMN     "season_no" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "started_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trees" ADD COLUMN     "crop_id" TEXT,
ADD COLUMN     "crop_stage" "CropStage";

-- CreateTable
CREATE TABLE "garden_places" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GardenPlaceKind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3),

    CONSTRAINT "garden_places_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "garden_places_user_id_idx" ON "garden_places"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tree_cycles_tree_id_cycle_year_season_no_key" ON "tree_cycles"("tree_id", "cycle_year", "season_no");

-- AddForeignKey
ALTER TABLE "tree_cycles" ADD CONSTRAINT "tree_cycles_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "garden_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_places" ADD CONSTRAINT "garden_places_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

