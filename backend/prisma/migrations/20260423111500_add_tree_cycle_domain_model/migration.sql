-- AlterEnum
ALTER TYPE "LifecycleStage" ADD VALUE IF NOT EXISTS 'FIRST_HARVEST';

-- AlterEnum
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'PLANTING';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'WATERING';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'WATERING_STRESS';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'PRUNING';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'FEEDING';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'FLOWERING';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'FLOWER_DROP';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'FRUIT_SET';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'FRUIT_DROP';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'DIAGNOSIS';
ALTER TYPE "LogType" ADD VALUE IF NOT EXISTS 'WEATHER_DAMAGE';

-- CreateEnum
CREATE TYPE "PlantedContext" AS ENUM ('GROUND', 'POT', 'GROW_BAG', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DropLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "YieldQuality" AS ENUM ('POOR', 'FAIR', 'GOOD', 'EXCELLENT', 'UNKNOWN');

-- AlterTable
ALTER TABLE "trees"
ADD COLUMN "species_family" TEXT,
ADD COLUMN "planted_context" "PlantedContext" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "first_flowering_at" TIMESTAMP(3),
ADD COLUMN "first_fruit_set_at" TIMESTAMP(3),
ADD COLUMN "first_harvest_at" TIMESTAMP(3),
ADD COLUMN "latest_harvest_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "tree_cycles" (
    "id" TEXT NOT NULL,
    "tree_id" TEXT NOT NULL,
    "cycle_year" INTEGER NOT NULL,
    "region_cluster" "RegionCluster",
    "season_window" "SeasonWindow",
    "expected_flowering_window" TEXT,
    "observed_flowering_at" TIMESTAMP(3),
    "observed_fruit_set_at" TIMESTAMP(3),
    "harvest_started_at" TIMESTAMP(3),
    "harvest_completed_at" TIMESTAMP(3),
    "yield_quantity" DOUBLE PRECISION,
    "yield_unit" TEXT,
    "yield_quality" "YieldQuality" NOT NULL DEFAULT 'UNKNOWN',
    "flower_drop_level" "DropLevel" NOT NULL DEFAULT 'UNKNOWN',
    "fruit_drop_level" "DropLevel" NOT NULL DEFAULT 'UNKNOWN',
    "stress_score" INTEGER,
    "pest_pressure_score" INTEGER,
    "treatment_count" INTEGER NOT NULL DEFAULT 0,
    "cycle_summary" TEXT,
    "recommended_next_cycle_actions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tree_cycles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tree_logs"
ADD COLUMN "tree_cycle_id" TEXT;

-- AlterTable
ALTER TABLE "tasks"
ADD COLUMN "tree_cycle_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tree_cycle_year" ON "tree_cycles"("tree_id", "cycle_year");

-- CreateIndex
CREATE INDEX "tree_cycles_tree_id_cycle_year_idx" ON "tree_cycles"("tree_id", "cycle_year");

-- CreateIndex
CREATE INDEX "tree_logs_tree_id_timestamp_idx" ON "tree_logs"("tree_id", "timestamp");

-- CreateIndex
CREATE INDEX "tree_logs_tree_cycle_id_idx" ON "tree_logs"("tree_cycle_id");

-- CreateIndex
CREATE INDEX "tasks_tree_cycle_id_idx" ON "tasks"("tree_cycle_id");

-- AddForeignKey
ALTER TABLE "tree_cycles"
ADD CONSTRAINT "tree_cycles_tree_id_fkey"
FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tree_logs"
ADD CONSTRAINT "tree_logs_tree_cycle_id_fkey"
FOREIGN KEY ("tree_cycle_id") REFERENCES "tree_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_tree_cycle_id_fkey"
FOREIGN KEY ("tree_cycle_id") REFERENCES "tree_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
