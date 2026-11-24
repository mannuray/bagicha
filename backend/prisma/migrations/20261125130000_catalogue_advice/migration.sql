-- CreateTable
CREATE TABLE "catalogue_advice" (
    "key" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_advice_pkey" PRIMARY KEY ("key")
);

-- AlterTable: a season's summary and next actions as advice keys (read in the reader's language).
ALTER TABLE "tree_cycles" ADD COLUMN "cycle_summary_refs" JSONB,
ADD COLUMN "recommended_actions_refs" JSONB;
