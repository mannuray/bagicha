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

  count(): Promise<number> {
    return this.prisma.plantCatalogEntry.count();
  }

  async createMany(
    data: Prisma.PlantCatalogEntryCreateManyInput[],
  ): Promise<void> {
    await this.prisma.plantCatalogEntry.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
