import { Injectable } from '@nestjs/common';
import { PlantCatalogEntry, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** The shared plant catalogue (not user-owned). */
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActive(): Promise<PlantCatalogEntry[]> {
    return this.prisma.plantCatalogEntry.findMany({
      where: { active: true },
      orderBy: [{ confidence_weight: 'desc' }, { display_name: 'asc' }],
    });
  }

  /**
   * Adds each entry, or refreshes the one with the same family, species and
   * variety. Find-then-write because there is no unique key on those columns
   * (and variety can be null).
   */
  async upsertAll(
    data: Prisma.PlantCatalogEntryCreateManyInput[],
  ): Promise<void> {
    for (const entry of data) {
      const existing = await this.prisma.plantCatalogEntry.findFirst({
        where: {
          species_family: entry.species_family,
          species: entry.species,
          variety: entry.variety ?? null,
        },
        select: { id: true },
      });
      if (existing) {
        await this.prisma.plantCatalogEntry.update({
          where: { id: existing.id },
          data: entry,
        });
      } else {
        await this.prisma.plantCatalogEntry.create({ data: entry });
      }
    }
  }
}
