import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Clock } from '../../common/time';
import { NotFoundError } from '../../common/errors';
import {
  CROPS,
  climateGroupFor,
  CropPlanService,
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
    });
  }

  async updatePlace(userId: string, id: string, dto: UpdatePlaceDto) {
    const updated = await this.placesRepo.updateOwned(userId, id, {
      name: dto.name?.trim(),
      kind: dto.kind,
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
    return CROPS.map((crop) => {
      const status = windowStatus(crop, group, now);
      return {
        id: crop.id,
        name: crop.name,
        aliases: crop.aliases,
        family: crop.family,
        method: crop.method,
        tags: crop.tags,
        guide: crop.guide,
        days_to_first_harvest: crop.days_to_first_harvest,
        status: status.status,
        opens_in_days: status.opens_in_days ?? null,
        next_month: status.next_month ?? null,
        window_label: windowLabel(crop, group, status.window_index),
      };
    });
  }
}
