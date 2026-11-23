import { CATALOGUE_SEED, type TreeCareSeed } from '../catalogue';
import { seededCatalogueStore } from '../catalogue/testing';
import { SubscriptionTier, TaskSource } from '@prisma/client';
import { FixedClock } from '../../common/time';
import {
  JournalService,
  PlantRecordService,
  SeasonalIntelligenceService,
  SpeciesNormalizationService,
  TaskDraft,
  TaskService,
} from '../plant-ledger';
import { UserRepository } from '../user';
import { OverlayRepository } from './repositories/overlay.repository';
import { SeasonalPackRepository } from './repositories/seasonal-pack.repository';
import { SeasonalService } from './seasonal.service';

const NOW = new Date('2026-05-01T00:00:00Z');

function build(opts: {
  premium: boolean;
  entries?: Array<{ content: string }>;
  /** Mango care to use; by default this catalogue has none (season-pack behaviour). */
  mangoCare?: TreeCareSeed;
  plant?: object;
  now?: Date;
}) {
  const now = opts.now ?? NOW;
  const pending = new Set<string>();
  const drafts: TaskDraft[] = [];
  const plant = {
    id: 'p1',
    name: 'Aam',
    lifecycle_stage: 'MATURE_BEARING',
    species: 'Mango',
    planting_date: null,
    planting_date_precision: 'UNKNOWN',
    ...opts.plant,
  };
  const user = {
    id: 'u1',
    district: 'Patna',
    subscription_tier: opts.premium
      ? SubscriptionTier.PREMIUM
      : SubscriptionTier.FREE,
    premium_expires_at: null,
  };
  const pack = {
    id: 'pack1',
    current_phase: 'fruit_development',
    upcoming_phase: 'harvest',
    task_templates: [
      {
        key: 'seasonal_primary_action',
        title: 'Thin fruit',
        category: 'inspection',
        priority: 'high',
        due_in_days: 3,
      },
    ],
  };
  const packs = {
    findCohort: jest.fn(() => Promise.resolve(pack as typeof pack | null)),
    create: jest.fn(),
  };
  const weatherQueue = { add: jest.fn(() => Promise.resolve()) };
  const retireCare = jest.fn(() => Promise.resolve(0));
  const service = new SeasonalService(
    weatherQueue as any,
    { getWeather: jest.fn(() => Promise.resolve({ temp: 30 })) } as any,
    { get: jest.fn(() => Promise.resolve(null)) } as any,
    {
      getOwnedOrThrow: jest.fn(() => Promise.resolve(plant)),
      assertGrowing: jest.fn(() => Promise.resolve(plant)),
    } as unknown as PlantRecordService,
    {
      recent: jest.fn(() =>
        Promise.resolve(
          (opts.entries ?? []).map((e) => ({
            ...e,
            metadata: null,
            timestamp: NOW,
          })),
        ),
      ),
    } as unknown as JournalService,
    {
      retireSeasonTasksExcept: jest.fn(() => Promise.resolve(0)),
      retireCareTasksExcept: retireCare,
      pendingCareKeys: jest.fn(() => Promise.resolve([])),
      createTasks: jest.fn((_u: string, _p: string, d: TaskDraft[]) => {
        drafts.push(...d);
        return Promise.resolve(
          d.map((x) => {
            const seen = pending.has(x.sourceKey);
            pending.add(x.sourceKey);
            return {
              sourceKey: x.sourceKey,
              status: seen ? 'skipped' : 'created',
            };
          }),
        );
      }),
    } as unknown as TaskService,
    {
      findById: jest.fn(() => Promise.resolve(user)),
    } as unknown as UserRepository,
    packs as unknown as SeasonalPackRepository,
    {
      findActive: jest.fn(() => Promise.resolve(null)),
      create: jest.fn((_u: string, _p: string, _k: string, data: object) =>
        Promise.resolve({ id: 'ov1', ...data }),
      ),
      update: jest.fn(),
    } as unknown as OverlayRepository,
    {} as unknown as SeasonalIntelligenceService,
    new SpeciesNormalizationService(seededCatalogueStore()),
    new FixedClock(now),
    { registerQueueDepth: jest.fn() } as any,
    { warn: jest.fn() } as any,
    // Season-pack behaviour: this catalogue has no mango care.
    seededCatalogueStore({
      ...CATALOGUE_SEED,
      treeCare: [
        ...CATALOGUE_SEED.treeCare.filter((c) => c.family !== 'mango'),
        ...(opts.mangoCare ? [opts.mangoCare] : []),
      ],
    }),
  );
  return { service, drafts, packs, pack, weatherQueue, retireCare };
}

describe('SeasonalService.materializeTasksForTree', () => {
  it('creates on the first run and skips everything on the second', async () => {
    const { service } = build({ premium: false });
    const first = await service.materializeTasksForTree('u1', 'p1');
    const second = await service.materializeTasksForTree('u1', 'p1');
    expect(first.results.map((r) => r.status)).toEqual(['created']);
    expect(first.created_count).toBe(1);
    expect(second.results.map((r) => r.status)).toEqual(['skipped']);
    expect(second.created_count).toBe(0);
  });

  it('cancels any care reminders left on a tree whose care went away', async () => {
    const { service, retireCare } = build({ premium: false });
    await service.materializeTasksForTree('u1', 'p1');
    expect(retireCare).toHaveBeenCalledWith('u1', 'p1', []);
  });

  it('due dates come from the injected clock', async () => {
    const { service, drafts } = build({ premium: false });
    await service.materializeTasksForTree('u1', 'p1');
    expect(drafts[0]).toMatchObject({
      source: TaskSource.SEASONAL_PACK,
      sourceKey: 'pack1:seasonal_primary_action',
      seasonalPackId: 'pack1',
    });
    expect(drafts[0].dueDate.toISOString()).toBe('2026-05-04T00:00:00.000Z');
  });

  it('gives free users no personalized overlay tasks', async () => {
    const { service, drafts } = build({
      premium: false,
      entries: [{ content: 'soil dry' }],
    });
    await service.materializeTasksForTree('u1', 'p1');
    expect(
      drafts.filter((d) => d.source === TaskSource.PERSONALIZED_OVERLAY),
    ).toHaveLength(0);
  });

  it('gives premium users two overlay tasks when dryness is logged', async () => {
    const { service, drafts } = build({
      premium: true,
      entries: [{ content: 'soil dry' }],
    });
    await service.materializeTasksForTree('u1', 'p1');
    expect(
      drafts.filter((d) => d.source === TaskSource.PERSONALIZED_OVERLAY),
    ).toHaveLength(2);
  });
});

describe('SeasonalService planting-timed care', () => {
  // Patna is in EAST_INDIA; one feed 90–120 days after planting.
  const mangoCare: TreeCareSeed = {
    family: 'mango',
    sources: ['test'],
    grownIn: ['EAST_INDIA'],
    regions: {
      EAST_INDIA: {
        items: [
          {
            key: 'feed',
            title: 'First feed',
            category: 'FEEDING',
            stages: ['YOUNG', 'BEARING'],
            when: { kind: 'FROM_PLANTING', fromDays: 90, toDays: 120 },
            organic: '2 kg compost',
            why: 'Young plants need food',
          },
        ],
        phases: [],
      },
    },
    status: 'APPROVED',
    notes: null,
  };

  it('reports that a planting month is needed', async () => {
    const { service } = build({ premium: false, mangoCare });
    const intel = await service.getTreeIntelligence('u1', 'p1');
    expect(intel.care_needs_planting_month).toBe(true);
  });

  it('passes the planting precision to the engine', async () => {
    const { service, drafts } = build({
      premium: false,
      mangoCare,
      plant: {
        planting_date: new Date('2026-06-01T00:00:00Z'),
        planting_date_precision: 'MONTH_YEAR',
      },
      now: new Date('2026-09-14T06:00:00+05:30'),
    });
    await service.materializeTasksForTree('u1', 'p1');
    expect(drafts.map((d) => d.sourceKey)).toEqual(['mango:feed:d90']);
    expect(drafts[0].dueDate).toEqual(new Date('2026-09-14T06:00:00+05:30'));
  });

  it('no reviewed care: flag false', async () => {
    const { service } = build({ premium: false });
    const intel = await service.getTreeIntelligence('u1', 'p1');
    expect(intel.care_needs_planting_month).toBe(false);
  });
});

describe('SeasonalService season pack', () => {
  it("two first visits at once: the loser of the create race uses the winner's pack", async () => {
    const { service, packs, pack } = build({ premium: false });
    packs.findCohort.mockResolvedValueOnce(null).mockResolvedValueOnce(pack);
    packs.create.mockRejectedValueOnce(
      Object.assign(new Error('unique'), { code: 'P2002' }),
    );
    (service as any).seasonalIntelligence = {
      inferTreeSeasonalState: () => ({
        current_phase: 'x',
        upcoming_phase: 'y',
        confidence: 0.5,
        do_now: [],
        avoid_now: [],
        watch_for: [],
        basis: [],
      }),
    };
    const res = await service.getTreeIntelligence('u1', 'p1');
    expect(res.seasonal_pack).toMatchObject({ id: 'pack1' });
  });
});

describe('SeasonalService weather', () => {
  it('queues one check per pincode and still answers when the queue is down', async () => {
    const { service, weatherQueue } = build({ premium: false });
    weatherQueue.add.mockRejectedValueOnce(new Error('redis down'));
    await expect(service.getLocalizedWeather('800001')).resolves.toEqual({
      temp: 30,
    });
    expect(weatherQueue.add).toHaveBeenCalledWith(
      'check',
      { pincode: '800001' },
      { jobId: 'weather-800001' },
    );
  });
});
