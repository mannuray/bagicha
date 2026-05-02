-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogType" ADD VALUE 'SOWING';
ALTER TYPE "LogType" ADD VALUE 'TRANSPLANTING';
ALTER TYPE "LogType" ADD VALUE 'GERMINATION';
ALTER TYPE "LogType" ADD VALUE 'THINNING';
ALTER TYPE "LogType" ADD VALUE 'BOLTING';
ALTER TYPE "LogType" ADD VALUE 'PINCHING';
ALTER TYPE "LogType" ADD VALUE 'DEADHEADING';
ALTER TYPE "LogType" ADD VALUE 'BLOOM_PEAK';
ALTER TYPE "LogType" ADD VALUE 'SEASON_END';

-- AlterTable
ALTER TABLE "personalized_overlays" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "plant_catalog_entries" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "seasonal_packs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tasks" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "tree_cycles" ALTER COLUMN "updated_at" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "seasonal_pack_cohort_version" RENAME TO "seasonal_packs_region_cluster_species_family_lifecycle_stag_key";

-- RenameIndex
ALTER INDEX "seasonal_packs_region_cluster_species_family_lifecycle_stage_se" RENAME TO "seasonal_packs_region_cluster_species_family_lifecycle_stag_idx";

-- RenameIndex
ALTER INDEX "tree_cycle_year" RENAME TO "tree_cycles_tree_id_cycle_year_key";
