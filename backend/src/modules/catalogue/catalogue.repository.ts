import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CareStepSeed,
  CatalogueSeed,
  CatalogueStatus,
  CropSeed,
  FruitPlantSeed,
  FruitTypeSeed,
  MethodSeed,
  PerennialFlowerSeed,
} from './domain/types';

/** A record as the push writes it: its seed record and its place in the catalogue. */
export type Ordered<T> = T & { sort_order: number };
export type OrderedCrop = Ordered<CropSeed>;

export interface CatalogueWrite {
  crops: OrderedCrop[];
  methods: MethodSeed[];
  careSteps: CareStepSeed[];
  fruitTypes: Ordered<FruitTypeSeed>[];
  fruitPlants: Ordered<FruitPlantSeed>[];
  perennialFlowers: Ordered<PerennialFlowerSeed>[];
}

/**
 * The catalogue tables (shared reference data, not user-owned). Records go in
 * as written by the push, which validates them; readers validate again on load.
 */
@Injectable()
export class CatalogueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async version(): Promise<number> {
    const meta = await this.prisma.catalogueMeta.findUnique({
      where: { id: 1 },
    });
    return meta?.version ?? 0;
  }

  async loadSeed(statuses: CatalogueStatus[]): Promise<CatalogueSeed> {
    const where = { status: { in: statuses } };
    const inOrder = { where, orderBy: { sort_order: 'asc' as const } };
    const [crops, methods, careSteps, fruitTypes, fruitPlants, flowers] =
      await Promise.all([
        this.prisma.catalogueCrop.findMany(inOrder),
        this.prisma.catalogueMethod.findMany({
          where,
          orderBy: { key: 'asc' },
        }),
        this.prisma.catalogueCareStep.findMany({
          where,
          orderBy: { key: 'asc' },
        }),
        this.prisma.catalogueFruitType.findMany(inOrder),
        this.prisma.catalogueFruitPlant.findMany(inOrder),
        this.prisma.cataloguePerennialFlower.findMany(inOrder),
      ]);
    return {
      crops: crops.map(
        (row) =>
          ({
            ...(row.data as object),
            id: row.id,
            kind: row.kind,
            name: row.name,
            family: row.family,
            method: row.method,
            status: row.status,
            notes: row.notes,
          }) as CropSeed,
      ),
      methods: methods.map(
        (row) =>
          ({
            ...(row.data as object),
            key: row.key,
            journey: row.journey,
            status: row.status,
          }) as MethodSeed,
      ),
      careSteps: careSteps.map(
        (row) =>
          ({
            ...(row.data as object),
            key: row.key,
            status: row.status,
          }) as CareStepSeed,
      ),
      fruitTypes: fruitTypes.map(
        (row) =>
          ({
            ...(row.data as object),
            key: row.key,
            status: row.status,
            notes: row.notes,
          }) as FruitTypeSeed,
      ),
      fruitPlants: fruitPlants.map(
        (row) =>
          ({
            ...(row.data as object),
            key: row.key,
            species_family: row.species_family,
            status: row.status,
            notes: row.notes,
          }) as FruitPlantSeed,
      ),
      perennialFlowers: flowers.map(
        (row) =>
          ({
            ...(row.data as object),
            family: row.family,
            status: row.status,
            notes: row.notes,
          }) as PerennialFlowerSeed,
      ),
    };
  }

  /** Writes the given records and bumps the version, all or nothing. Returns the new version. */
  async applyPush(write: CatalogueWrite): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      for (const crop of write.crops) {
        const {
          id,
          kind,
          name,
          family,
          method,
          status,
          notes,
          sort_order,
          ...data
        } = crop;
        const row = { kind, name, family, method, status, notes, sort_order };
        await tx.catalogueCrop.upsert({
          where: { id },
          create: { id, ...row, data: json(data) },
          update: { ...row, data: json(data) },
        });
      }
      for (const { key, journey, status, ...data } of write.methods) {
        await tx.catalogueMethod.upsert({
          where: { key },
          create: { key, journey, status, data: json(data) },
          update: { journey, status, data: json(data) },
        });
      }
      for (const { key, status, ...data } of write.careSteps) {
        await tx.catalogueCareStep.upsert({
          where: { key },
          create: { key, status, data: json(data) },
          update: { status, data: json(data) },
        });
      }
      for (const {
        key,
        status,
        notes,
        sort_order,
        ...data
      } of write.fruitTypes) {
        const row = { status, notes, sort_order, data: json(data) };
        await tx.catalogueFruitType.upsert({
          where: { key },
          create: { key, ...row },
          update: row,
        });
      }
      for (const plant of write.fruitPlants) {
        const { key, species_family, status, notes, sort_order, ...data } =
          plant;
        const row = {
          species_family,
          status,
          notes,
          sort_order,
          data: json(data),
        };
        await tx.catalogueFruitPlant.upsert({
          where: { key },
          create: { key, ...row },
          update: row,
        });
      }
      for (const flower of write.perennialFlowers) {
        const { family, status, notes, sort_order, ...data } = flower;
        const row = { status, notes, sort_order, data: json(data) };
        await tx.cataloguePerennialFlower.upsert({
          where: { family },
          create: { family, ...row },
          update: row,
        });
      }
      const meta = await tx.catalogueMeta.upsert({
        where: { id: 1 },
        create: { id: 1, version: 1 },
        update: { version: { increment: 1 } },
      });
      return meta.version;
    }, PUSH_TRANSACTION);
  }
}

/** Prisma's 5 s default is too short for a full push from a laptop to Neon. */
const PUSH_TRANSACTION = { timeout: 60_000, maxWait: 10_000 };

const json = (value: object) => value as Prisma.InputJsonValue;
