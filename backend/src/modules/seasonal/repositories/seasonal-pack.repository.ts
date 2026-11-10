import { Injectable } from '@nestjs/common';
import {
  LifecycleStage,
  Prisma,
  RegionCluster,
  SeasonalPack,
  SeasonWindow,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export interface PackCohort {
  region_cluster: RegionCluster;
  species_family: string;
  lifecycle_stage: LifecycleStage;
  season_window: SeasonWindow;
  pack_version: number;
}

/** Shared cohort guidance (not user-owned). */
@Injectable()
export class SeasonalPackRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCohort(cohort: PackCohort): Promise<SeasonalPack | null> {
    return this.prisma.seasonalPack.findUnique({
      where: { seasonal_pack_cohort_version: cohort },
    });
  }

  create(data: Prisma.SeasonalPackCreateInput): Promise<SeasonalPack> {
    return this.prisma.seasonalPack.create({ data });
  }
}
