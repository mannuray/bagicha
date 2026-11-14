-- The plant catalogue in the database (stage 2: fruit types, add-tree entries, perennial flowers).
-- Empty until the catalogue push fills it; see docs/deploy.md.

-- CreateTable
CREATE TABLE "catalogue_fruit_types" (
    "key" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_fruit_types_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "catalogue_fruit_plants" (
    "key" TEXT NOT NULL,
    "species_family" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_fruit_plants_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "catalogue_perennial_flowers" (
    "family" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_perennial_flowers_pkey" PRIMARY KEY ("family")
);

-- CreateIndex
CREATE INDEX "catalogue_fruit_types_status_sort_order_idx" ON "catalogue_fruit_types"("status", "sort_order");

-- CreateIndex
CREATE INDEX "catalogue_fruit_plants_status_sort_order_idx" ON "catalogue_fruit_plants"("status", "sort_order");

-- CreateIndex
CREATE INDEX "catalogue_perennial_flowers_status_sort_order_idx" ON "catalogue_perennial_flowers"("status", "sort_order");

