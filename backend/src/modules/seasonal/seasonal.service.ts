import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Clock } from '../../common/time';
import { climateGroupFor, windowStatus } from '../plant-ledger';
import { CatalogueStore, CatalogueUnavailableError } from '../catalogue';
import { regionFor } from '../regions';
import type { Lang } from '../../common/http/lang';
import { monthOf } from './domain/season-guide';

@Injectable()
export class SeasonalService {
  constructor(
    private readonly clock: Clock,
    private readonly catalogue: CatalogueStore,
  ) {}

  /** Season advice, with "good to sow now" from the crop calendar for the user's region. */
  async getSeasonalGuide(
    user: Pick<User, 'district' | 'region_cluster'>,
    lang: Lang = 'en',
  ) {
    const region = regionFor(user);
    const group = climateGroupFor(region);
    const now = this.clock.now();
    const catalogue = await this.catalogue.snapshot();
    // The store refuses a catalogue without every region's guide.
    const months = catalogue.seasonGuide(region);
    if (!months)
      throw new CatalogueUnavailableError(
        'CATALOGUE_REGION_MISSING',
        `No season guide for ${region}`,
      );
    const { season, headline, points } = monthOf(months, now, lang);
    const listed = catalogue.listedCrops();
    const crops = listed
      .filter(
        (c) =>
          c.kind === 'CROP' && windowStatus(c, group, now).status === 'open',
      )
      .map((c) => c.name);
    return { season, advice: headline, points, crops };
  }
}
