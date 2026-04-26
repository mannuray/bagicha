-- CreateTable
CREATE TABLE "plant_catalog_entries" (
    "id" TEXT NOT NULL,
    "species_family" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "variety" TEXT,
    "display_name" TEXT NOT NULL,
    "plant_type" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" JSONB,
    "regions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidence_weight" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plant_catalog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plant_catalog_entries_species_family_species_active_idx"
ON "plant_catalog_entries"("species_family", "species", "active");

-- CreateIndex
CREATE INDEX "plant_catalog_entries_display_name_active_idx"
ON "plant_catalog_entries"("display_name", "active");
