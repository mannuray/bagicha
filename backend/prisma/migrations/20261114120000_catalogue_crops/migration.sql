-- The plant catalogue in the database (stage 1: crops, flowers, methods, care steps).
-- Empty until the catalogue push fills it; see docs/deploy.md.

-- CreateEnum
CREATE TYPE "CatalogueStatus" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');

-- CreateEnum
CREATE TYPE "CatalogueCropKind" AS ENUM ('CROP', 'FLOWER');

-- CreateEnum
CREATE TYPE "CatalogueJourney" AS ENUM ('NURSERY', 'DIRECT', 'PLANT');

-- CreateTable
CREATE TABLE "catalogue_crops" (
    "id" TEXT NOT NULL,
    "kind" "CatalogueCropKind" NOT NULL,
    "name" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "sort_order" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogue_methods" (
    "key" TEXT NOT NULL,
    "journey" "CatalogueJourney" NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_methods_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "catalogue_care_steps" (
    "key" TEXT NOT NULL,
    "status" "CatalogueStatus" NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogue_care_steps_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "catalogue_meta" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "catalogue_meta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalogue_crops_status_sort_order_idx" ON "catalogue_crops"("status", "sort_order");


-- The single version row the catalogue push bumps.
INSERT INTO "catalogue_meta" ("id", "version") VALUES (1, 0);
