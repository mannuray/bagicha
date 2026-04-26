-- CreateEnum
CREATE TYPE "RegionCluster" AS ENUM (
    'NORTH_INDIA',
    'EAST_INDIA',
    'WEST_INDIA',
    'CENTRAL_INDIA',
    'SOUTH_DECCAN',
    'COASTAL_HUMID',
    'HILLS_COOL'
);

-- CreateEnum
CREATE TYPE "SeasonWindow" AS ENUM (
    'LATE_WINTER',
    'SPRING',
    'SUMMER',
    'MONSOON',
    'POST_MONSOON'
);

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM (
    'WATERING',
    'INSPECTION',
    'PRUNING',
    'FEEDING',
    'HARVEST',
    'TREATMENT',
    'OBSERVATION'
);

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM (
    'SYSTEM',
    'SEASONAL_PACK',
    'PERSONALIZED_OVERLAY',
    'MANUAL'
);

-- AlterEnum
ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'INSPECT';
ALTER TYPE "TaskType" ADD VALUE IF NOT EXISTS 'OBSERVE';

-- CreateTable
CREATE TABLE "seasonal_packs" (
    "id" TEXT NOT NULL,
    "region_cluster" "RegionCluster" NOT NULL,
    "species_family" TEXT NOT NULL,
    "lifecycle_stage" "LifecycleStage" NOT NULL,
    "season_window" "SeasonWindow" NOT NULL,
    "pack_version" INTEGER NOT NULL DEFAULT 1,
    "model_version" TEXT,
    "current_phase" TEXT NOT NULL,
    "upcoming_phase" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "do_now" JSONB NOT NULL,
    "avoid_now" JSONB NOT NULL,
    "watch_for" JSONB NOT NULL,
    "task_templates" JSONB NOT NULL,
    "basis" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasonal_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalized_overlays" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tree_id" TEXT NOT NULL,
    "seasonal_pack_id" TEXT NOT NULL,
    "adjusted_phase" TEXT,
    "priority_actions" JSONB,
    "suppressed_actions" JSONB,
    "personalized_tasks" JSONB,
    "reasoning_summary" TEXT,
    "expires_at" TIMESTAMP(3),
    "refreshed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personalized_overlays_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tasks"
ADD COLUMN "title" TEXT,
ADD COLUMN "category" "TaskCategory",
ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "source" "TaskSource" NOT NULL DEFAULT 'SYSTEM',
ADD COLUMN "source_key" TEXT,
ADD COLUMN "reason" TEXT,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "seasonal_pack_id" TEXT,
ADD COLUMN "personalized_overlay_id" TEXT,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "seasonal_pack_cohort_version" ON "seasonal_packs"(
    "region_cluster",
    "species_family",
    "lifecycle_stage",
    "season_window",
    "pack_version"
);

-- CreateIndex
CREATE INDEX "seasonal_packs_region_cluster_species_family_lifecycle_stage_season_window_idx"
ON "seasonal_packs"("region_cluster", "species_family", "lifecycle_stage", "season_window");

-- CreateIndex
CREATE INDEX "personalized_overlays_user_id_tree_id_idx"
ON "personalized_overlays"("user_id", "tree_id");

-- CreateIndex
CREATE INDEX "personalized_overlays_tree_id_expires_at_idx"
ON "personalized_overlays"("tree_id", "expires_at");

-- CreateIndex
CREATE INDEX "personalized_overlays_seasonal_pack_id_idx"
ON "personalized_overlays"("seasonal_pack_id");

-- CreateIndex
CREATE INDEX "tasks_tree_id_due_date_status_idx"
ON "tasks"("tree_id", "due_date", "status");

-- CreateIndex
CREATE INDEX "tasks_source_due_date_idx"
ON "tasks"("source", "due_date");

-- CreateIndex
CREATE INDEX "tasks_seasonal_pack_id_idx"
ON "tasks"("seasonal_pack_id");

-- CreateIndex
CREATE INDEX "tasks_personalized_overlay_id_idx"
ON "tasks"("personalized_overlay_id");

-- AddForeignKey
ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_seasonal_pack_id_fkey"
FOREIGN KEY ("seasonal_pack_id") REFERENCES "seasonal_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_personalized_overlay_id_fkey"
FOREIGN KEY ("personalized_overlay_id") REFERENCES "personalized_overlays"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_overlays"
ADD CONSTRAINT "personalized_overlays_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_overlays"
ADD CONSTRAINT "personalized_overlays_tree_id_fkey"
FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_overlays"
ADD CONSTRAINT "personalized_overlays_seasonal_pack_id_fkey"
FOREIGN KEY ("seasonal_pack_id") REFERENCES "seasonal_packs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
