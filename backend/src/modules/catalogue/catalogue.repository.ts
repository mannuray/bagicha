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
      // Stored from the next commit (the catalogue_tree_care table).
      treeCare: [],
    };
  }

  /** Writes the given records and bumps the version, all or nothing. Returns the new version. */
  async applyPush(write: CatalogueWrite): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      await writeRows(
        tx.catalogueCrop as unknown as Table,
        'id',
        write.crops.map(
          ({
            id,
            kind,
            name,
            family,
            method,
            status,
            notes,
            sort_order,
            ...data
          }) => ({
            id,
            kind,
            name,
            family,
            method,
            status,
            notes,
            sort_order,
            data: json(data),
          }),
        ),
      );
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
      await writeRows(
        tx.catalogueFruitType as unknown as Table,
        'key',
        write.fruitTypes.map(({ key, status, notes, sort_order, ...data }) => ({
          key,
          status,
          notes,
          sort_order,
          data: json(data),
        })),
      );
      await writeRows(
        tx.catalogueFruitPlant as unknown as Table,
        'key',
        write.fruitPlants.map(
          ({ key, species_family, status, notes, sort_order, ...data }) => ({
            key,
            species_family,
            status,
            notes,
            sort_order,
            data: json(data),
          }),
        ),
      );
      await writeRows(
        tx.cataloguePerennialFlower as unknown as Table,
        'family',
        write.perennialFlowers.map(
          ({ family, status, notes, sort_order, ...data }) => ({
            family,
            status,
            notes,
            sort_order,
            data: json(data),
          }),
        ),
      );
      const meta = await tx.catalogueMeta.upsert({
        where: { id: 1 },
        create: { id: 1, version: 1 },
        update: { version: { increment: 1 } },
      });
      return meta.version;
    }, PUSH_TRANSACTION);
  }
}

/** The part of a Prisma table delegate the push uses (the generated types don't share an interface). */
interface Table {
  findMany(args: {
    where: Record<string, { in: string[] }>;
    select: Record<string, true>;
  }): Promise<Array<Record<string, string>>>;
  createMany(args: { data: object[] }): Promise<unknown>;
  update(args: {
    where: Record<string, string>;
    data: object;
  }): Promise<unknown>;
}

/**
 * Inserts the new rows in one statement and updates the existing ones one by
 * one: a first push of ~150 records over a slow link would outlast the
 * transaction as row-by-row upserts.
 */
async function writeRows(
  table: Table,
  keyField: string,
  rows: Array<Record<string, unknown>>,
): Promise<void> {
  if (rows.length === 0) return;
  const keyOf = (row: Record<string, unknown>) => row[keyField] as string;
  const existing = new Set(
    (
      await table.findMany({
        where: { [keyField]: { in: rows.map(keyOf) } },
        select: { [keyField]: true },
      })
    ).map((row) => row[keyField]),
  );
  const added = rows.filter((row) => !existing.has(keyOf(row)));
  if (added.length > 0) await table.createMany({ data: added });
  for (const row of rows.filter((r) => existing.has(keyOf(r)))) {
    const { [keyField]: key, ...data } = row;
    await table.update({ where: { [keyField]: key as string }, data });
  }
}

/** Prisma's 5 s default is too short for a full push from a laptop to Neon. */
const PUSH_TRANSACTION = { timeout: 60_000, maxWait: 10_000 };

const json = (value: object) => value as Prisma.InputJsonValue;
