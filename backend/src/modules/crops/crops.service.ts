import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Clock } from '../../common/time';
import { NotFoundError, ValidationError } from '../../common/errors';
import {
  CROPS,
  climateGroupFor,
  CropPlanService,
  cropById,
  GardenPlaceRepository,
  windowStatus,
  type CropInfo,
} from '../plant-ledger';
import { CreatePlaceDto, UpdatePlaceDto } from './dto/place.dto';
import { regionFor } from '../seasonal';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** "Sep–Nov" for the window a status points at. */
function windowLabel(
  crop: CropInfo,
  group: ReturnType<typeof climateGroupFor>,
  index: number | undefined,
): string | null {
  const window = index === undefined ? undefined : crop.windows[group][index];
  return window ? `${MONTHS[window[0] - 1]}–${MONTHS[window[1] - 1]}` : null;
}

/** The vegetable side of the garden: the calendar, want-to-grow and places. */
@Injectable()
export class CropsService {
  constructor(
    private readonly clock: Clock,
    private readonly placesRepo: GardenPlaceRepository,
    private readonly plan: CropPlanService,
  ) {}

  addToPlan(userId: string, cropId: string) {
    return this.plan.add(userId, cropId);
  }

  removeFromPlan(userId: string, plantId: string) {
    return this.plan.remove(userId, plantId);
  }

  /**
   * Gentle rotation hint: the same botanical family grew here in a season that
   * ended within the last 12 months. Never blocks.
   */
  async rotation(userId: string, placeId: string, cropId: string) {
    const place = await this.placesRepo.findOwned(userId, placeId);
    if (!place) throw new NotFoundError('PLACE_NOT_FOUND', 'Place not found');
    const crop = cropById(cropId);
    if (!crop) throw new ValidationError('VALIDATION_ERROR', 'Unknown crop');
    const since = new Date(
      this.clock.now().getTime() - 365 * 24 * 60 * 60 * 1000,
    );
    const season = await this.placesRepo.lastClosedSeason(placeId, since);
    const previous = cropById(season?.plant.crop_id);
    // Rotation is about vegetable family pests in the soil; a flower season doesn't count.
    if (!season || !previous || previous.kind === 'FLOWER')
      return { conflict: false, last: null };
    const started = season.started_at ?? season.closed_at ?? new Date();
    return {
      conflict: previous.family === crop.family,
      last: {
        crop_id: previous.id,
        crop_name: previous.name,
        family: previous.family,
        season_label: monthLabel(started),
      },
    };
  }

  /** Seed and sow reminders for the user's region; the dashboard calls this once a session. */
  sync(user: User) {
    return this.plan.sync(user.id, climateGroupFor(regionFor(user)));
  }

  places(userId: string) {
    return this.placesRepo.listActive(userId);
  }

  createPlace(userId: string, dto: CreatePlaceDto) {
    return this.placesRepo.create(userId, {
      name: dto.name.trim(),
      kind: dto.kind,
      sun_hours: dto.sun_hours ?? null,
    });
  }

  async updatePlace(userId: string, id: string, dto: UpdatePlaceDto) {
    const updated = await this.placesRepo.updateOwned(userId, id, {
      name: dto.name?.trim(),
      kind: dto.kind,
      sun_hours: dto.sun_hours,
      archived_at:
        dto.archived === undefined
          ? undefined
          : dto.archived
            ? this.clock.now()
            : null,
    });
    if (!updated) throw new NotFoundError('PLACE_NOT_FOUND', 'Place not found');
    return updated;
  }

  /** Every crop with its sowing status for the user's region. */
  calendar(user: User) {
    const group = climateGroupFor(regionFor(user));
    const now = this.clock.now();
    return CROPS.map((crop) => this.item(crop, group, now));
  }

  /** Everything about one crop, with its sowing windows for the user's region. */
  detail(user: User, cropId: string) {
    const crop = cropById(cropId);
    if (!crop) throw new NotFoundError('CROP_NOT_FOUND', 'Crop not found');
    const group = climateGroupFor(regionFor(user));
    return {
      ...this.item(crop, group, this.clock.now()),
      germination_days: crop.germination_days,
      transplant_after_days: crop.transplant_after_days,
      harvest_span_days: crop.harvest_span_days,
      thin_after_days: crop.thin_after_days,
      succession_every_days: crop.succession_every_days,
      care: crop.care,
      windows: crop.windows[group].map(([start, end], index) => ({
        start_month: start,
        end_month: end,
        label: windowLabel(crop, group, index),
      })),
    };
  }

  private item(
    crop: CropInfo,
    group: ReturnType<typeof climateGroupFor>,
    now: Date,
  ) {
    const status = windowStatus(crop, group, now);
    return {
      id: crop.id,
      kind: crop.kind,
      name: crop.name,
      aliases: crop.aliases,
      family: crop.family,
      method: crop.method,
      tags: crop.tags,
      guide: crop.guide,
      days_to_first_harvest: crop.days_to_first_harvest,
      scientific_name: crop.scientific_name,
      description: crop.description,
      sun: crop.sun,
      status: status.status,
      opens_in_days: status.opens_in_days ?? null,
      next_month: status.next_month ?? null,
      window_label: windowLabel(crop, group, status.window_index),
    };
  }
}

/** "Oct 2026" for a season start, in IST. */
function monthLabel(d: Date): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return `${MONTHS[ist.getUTCMonth()]} ${ist.getUTCFullYear()}`;
}
