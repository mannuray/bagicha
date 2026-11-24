import { Injectable } from '@nestjs/common';
import {
  PersonalizedOverlay,
  Plant,
  SeasonalPack,
  RecordKind,
  User,
} from '@prisma/client';
import { NotFoundError } from '../../../common/errors';
import { Clock } from '../../../common/time';
import {
  JournalService,
  PlantRecordService,
  SpeciesNormalizationService,
  carePhaseView,
  careFor,
  treeCareDue,
} from '../../plant-ledger';
import type { SpeciesResolver } from '../../plant-ledger';
import { isPremium, UserRepository } from '../../user';
import { buildPersonalizedOverlay } from '../domain/overlay-rules';
import { CatalogueStore } from '../../catalogue';
import { regionFor } from '../../regions';
import type { Lang } from '../../../common/http/lang';
import { resolveSeasonWindow } from '../domain/season-window';
import { OverlayRepository } from '../repositories/overlay.repository';
import { SeasonalPackRepository } from '../repositories/seasonal-pack.repository';
import { isUniqueViolation } from '../../../common/prisma/unique-violation';
import { toOverlayView, toPackView } from '../intelligence-view';

/**
 * Pack rows are only the personal adjustment's database anchor now (stage 4):
 * version 2 rows carry no guidance, and a rolled-back API (version 1) never
 * reuses them.
 */
const PACK_VERSION = 2;
/** The phase shown for a tree whose reviewed care hasn't shipped (reads "Care coming"). */
const CARE_COMING = 'care_coming';
const RECENT_ENTRIES_FOR_OVERLAY = 10;

/** A tree's season view: its reviewed care phase, the anchor row and the personal adjustment. */
@Injectable()
export class TreeIntelligenceService {
  constructor(
    private readonly plants: PlantRecordService,
    private readonly journal: JournalService,
    private readonly users: UserRepository,
    private readonly packs: SeasonalPackRepository,
    private readonly overlays: OverlayRepository,
    private readonly species: SpeciesNormalizationService,
    private readonly clock: Clock,
    private readonly catalogue: CatalogueStore,
  ) {}

  async getTreeIntelligence(
    userId: string,
    plantId: string,
    lang: Lang = 'en',
  ) {
    const { pack, overlay, premium, careNote, care, user, plant } =
      await this.load(userId, plantId, lang);
    const careDue = care
      ? treeCareDue(care, {
          region: regionFor(user),
          stage: plant.lifecycle_stage,
          plantedAt: plant.planting_date,
          plantingPrecision: plant.planting_date_precision,
          now: this.clock.now(),
          lang,
        })
      : null;
    return {
      seasonal_pack: toPackView(pack),
      personalized_overlay: overlay ? toOverlayView(overlay) : null,
      is_paid_user: premium,
      care_note: careNote,
      care_this_month: careDue?.thisMonth ?? [],
      care_needs_planting_month: careDue?.needsPlantingMonth ?? false,
      care_status: care ? ('reviewed' as const) : ('coming' as const),
    };
  }

  /** Everything the season view and task creation read for one tree. */
  async load(userId: string, plantId: string, lang: Lang = 'en') {
    const plant = await this.plants.getOwnedOrThrow(userId, plantId);
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('USER_NOT_FOUND', 'User not found');
    const now = this.clock.now();
    const premium = isPremium(user, now);
    const species = await this.species.resolver();
    const region = regionFor(user);
    // Perennial flowers have their own care; a pending family or region gets none.
    const care =
      plant.record_kind === RecordKind.FLOWER
        ? null
        : careFor(
            await this.catalogue.snapshot(),
            species.family(plant),
            plant,
            region,
          );
    const anchor = await this.getOrCreateAnchor(plant, user, species);
    const phase = care
      ? carePhaseView(care, { region, stage: plant.lifecycle_stage, now, lang })
      : null;
    // Guidance comes from reviewed care only, never from the anchor row (old
    // version-1 rows still hold the retired filler).
    const pack: SeasonalPack = {
      ...anchor,
      current_phase: phase?.current_phase ?? CARE_COMING,
      upcoming_phase: phase?.upcoming_phase ?? CARE_COMING,
      do_now: phase?.do_now ?? [],
      avoid_now: phase?.avoid_now ?? [],
      watch_for: phase?.watch_for ?? [],
      confidence: phase ? 'high' : 'low',
      task_templates: [],
    };
    const overlay = premium
      ? await this.getOrRefreshOverlay(
          userId,
          plant,
          anchor,
          phase?.current_phase ?? null,
        )
      : null;
    return {
      pack,
      overlay,
      premium,
      care,
      user,
      plant,
      careNote: phase?.note ?? null,
    };
  }

  /** The cohort row the personal adjustment hangs on; it carries no guidance. */
  private async getOrCreateAnchor(
    plant: Plant,
    user: User,
    species: SpeciesResolver,
  ): Promise<SeasonalPack> {
    const cohort = {
      region_cluster: regionFor(user),
      species_family: species.family(plant),
      lifecycle_stage: plant.lifecycle_stage,
      season_window: resolveSeasonWindow(this.clock.now()),
      pack_version: PACK_VERSION,
    };
    const existing = await this.packs.findCohort(cohort);
    if (existing) return existing;
    const data = {
      ...cohort,
      model_version: 'anchor_only',
      current_phase: CARE_COMING,
      upcoming_phase: CARE_COMING,
      confidence: 'low',
      do_now: [],
      avoid_now: [],
      watch_for: [],
      task_templates: [],
      basis: 'anchor_only',
    };
    try {
      return await this.packs.create(data);
    } catch (err) {
      // Two first visits for a new cohort raced; the other one created it.
      if (!isUniqueViolation(err)) throw err;
      const winner = await this.packs.findCohort(cohort);
      if (!winner) throw err;
      return winner;
    }
  }

  private async getOrRefreshOverlay(
    userId: string,
    plant: Plant,
    pack: SeasonalPack,
    phase: string | null,
  ): Promise<PersonalizedOverlay | null> {
    const now = this.clock.now();
    const existing = await this.overlays.findActive(
      userId,
      plant.id,
      pack.id,
      now,
    );
    const entries = await this.journal.recent(
      userId,
      plant.id,
      RECENT_ENTRIES_FOR_OVERLAY,
    );
    const payload = buildPersonalizedOverlay(plant, entries, phase, now);
    if (!payload) return existing;
    return existing
      ? this.overlays.update(userId, existing.id, payload)
      : this.overlays.create(userId, plant.id, pack.id, payload);
  }
}
