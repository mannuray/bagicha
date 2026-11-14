import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CareStepSeed,
  CatalogueSeed,
  CatalogueStatus,
  CropSeed,
  MethodSeed,
} from './domain/types';

/** A crop as the push writes it: its seed record and its place in the catalogue. */
export type OrderedCrop = CropSeed & { sort_order: number };

export interface CatalogueWrite {
  crops: OrderedCrop[];
  methods: MethodSeed[];
  careSteps: CareStepSeed[];
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
    const [crops, methods, careSteps] = await Promise.all([
      this.prisma.catalogueCrop.findMany({
        where,
        orderBy: { sort_order: 'asc' },
      }),
      this.prisma.catalogueMethod.findMany({ where, orderBy: { key: 'asc' } }),
      this.prisma.catalogueCareStep.findMany({
        where,
        orderBy: { key: 'asc' },
      }),
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
