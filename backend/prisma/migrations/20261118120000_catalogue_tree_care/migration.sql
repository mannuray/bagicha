-- CreateTable
CREATE TABLE "catalogue_tree_care" (
    "family" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_tree_care_pkey" PRIMARY KEY ("family")
);
