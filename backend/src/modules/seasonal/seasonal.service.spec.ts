import { CATALOGUE_SEED, type TreeCareSeed } from '../catalogue';
import { seededCatalogueStore } from '../catalogue/testing';
import { SubscriptionTier, TaskSource } from '@prisma/client';
import { FixedClock } from '../../common/time';
import {
  JournalService,
  PlantRecordService,
  SpeciesNormalizationService,
  TaskDraft,
  TaskService,
} from '../plant-ledger';
import { UserRepository } from '../user';
import { OverlayRepository } from './repositories/overlay.repository';
import { SeasonalPackRepository } from './repositories/seasonal-pack.repository';
import { SeasonalService } from './seasonal.service';
import { TreeIntelligenceService } from './services/tree-intelligence.service';
import { TreeTaskMaterializer } from './services/tree-task-materializer.service';

const NOW = new Date('2026-05-01T00:00:00Z');

function build(opts: {
  premium: boolean;
  entries?: Array<{ content: string }>;
  /** Mango care to use; by default this catalogue has none (season-pack behaviour). */
  mangoCare?: TreeCareSeed;
  plant?: object;
  now?: Date;
  seasonGuide?: typeof CATALOGUE_SEED.seasonGuide;
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
  const retireCare = jest.fn(() => Promise.resolve(0));
  const retireSeason = jest.fn((_u: string, _p: string, _keys: string[]) =>
    Promise.resolve(0),
  );
  const plants = {
    getOwnedOrThrow: jest.fn(() => Promise.resolve(plant)),
    assertGrowing: jest.fn(() => Promise.resolve(plant)),
  } as unknown as PlantRecordService;
  const journal = {
    recent: jest.fn(() =>
      Promise.resolve(
        (opts.entries ?? []).map((e) => ({
          ...e,
          metadata: null,
          timestamp: NOW,
        })),
      ),
    ),
  } as unknown as JournalService;
  const tasks = {
    retireSeasonTasksExcept: retireSeason,
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
  } as unknown as TaskService;
  const users = {
    findById: jest.fn(() => Promise.resolve(user)),
  } as unknown as UserRepository;
  const packsArg = packs as unknown as SeasonalPackRepository;
  const overlays = {
    findActive: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((_u: string, _p: string, _k: string, data: object) =>
      Promise.resolve({ id: 'ov1', ...data }),
    ),
    update: jest.fn(),
  } as unknown as OverlayRepository;
  const species = new SpeciesNormalizationService(seededCatalogueStore());
  const clock = new FixedClock(now);
  const catalogue = // Season-pack behaviour: this catalogue has no mango care.
    seededCatalogueStore({
      ...CATALOGUE_SEED,
      treeCare: [
        ...CATALOGUE_SEED.treeCare.filter((c) => c.family !== 'mango'),
        ...(opts.mangoCare ? [opts.mangoCare] : []),
      ],
      seasonGuide: opts.seasonGuide ?? CATALOGUE_SEED.seasonGuide,
    });
  const intelligence = new TreeIntelligenceService(
    plants,
    journal,
    users,
    packsArg,
    overlays,
    species,
    clock,
    catalogue,
  );
  const materializer = new TreeTaskMaterializer(
    intelligence,
    plants,
    tasks,
    users,
    species,
    clock,
  );
  const seasonal = new SeasonalService(clock, catalogue);
  // One handle on the three services the old SeasonalService was split into.
  const service = {
    materializeTasksForTree:
      materializer.materializeTasksForTree.bind(materializer),
    getTreeIntelligence: intelligence.getTreeIntelligence.bind(intelligence),
    getSeasonalGuide: seasonal.getSeasonalGuide.bind(seasonal),
  };
  return {
    service,
    seasonal,
    drafts,
    packs,
    pack,
    retireCare,
    retireSeason,
  };
}

describe('SeasonalService.materializeTasksForTree', () => {
  it('creates on the first run and skips everything on the second', async () => {
    const { service } = build({
      premium: true,
      entries: [{ content: 'soil dry' }],
    });
    const first = await service.materializeTasksForTree('u1', 'p1');
    const second = await service.materializeTasksForTree('u1', 'p1');
    expect(first.results.map((r) => r.status)).toEqual(['created', 'created']);
    expect(second.created_count).toBe(0);
  });

  it('a tree without reviewed care gets no season-pack task, even from an old filler row', async () => {
    // The fixture row is a version-1 pack with filler lists and a task template.
    const { service, drafts, retireSeason } = build({ premium: false });
    await service.materializeTasksForTree('u1', 'p1');
    expect(drafts).toEqual([]);
    expect(retireSeason).toHaveBeenCalledWith('u1', 'p1', []);
  });

  it('a premium tree without care keeps its dryness tasks through the retire step', async () => {
    const { service, drafts, retireSeason } = build({
      premium: true,
      entries: [{ content: 'soil dry' }],
    });
    await service.materializeTasksForTree('u1', 'p1');
    const keys = drafts.map((d) => d.sourceKey);
    expect(drafts.map((d) => d.source)).toEqual([
      TaskSource.PERSONALIZED_OVERLAY,
      TaskSource.PERSONALIZED_OVERLAY,
    ]);
    expect(retireSeason).toHaveBeenCalledWith('u1', 'p1', keys);
  });

  it('cancels any care reminders left on a tree whose care went away', async () => {
    const { service, retireCare } = build({ premium: false });
    await service.materializeTasksForTree('u1', 'p1');
    expect(retireCare).toHaveBeenCalledWith('u1', 'p1', []);
  });

  it('due dates come from the injected clock', async () => {
    const { service, drafts } = build({
      premium: true,
      entries: [{ content: 'soil dry' }],
    });
    await service.materializeTasksForTree('u1', 'p1');
    expect(drafts.map((d) => d.dueDate.toISOString())).toEqual([
      '2026-05-01T00:00:00.000Z',
      '2026-05-03T00:00:00.000Z',
    ]);
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

describe('SeasonalService.getSeasonalGuide', () => {
  it("reads the region's month from the catalogue", async () => {
    const seasonGuide = CATALOGUE_SEED.seasonGuide.map((g) =>
      g.region === 'NORTH_INDIA'
        ? {
            ...g,
            months: g.months.map((m, i) =>
              i === 0 ? { ...m, headline: 'Test headline' } : m,
            ),
          }
        : g,
    );
    const { service } = build({
      premium: false,
      seasonGuide,
      now: new Date('2026-01-15T06:00:00+05:30'),
    });
    const guide = await service.getSeasonalGuide({
      district: null,
      region_cluster: 'NORTH_INDIA',
    });
    expect(guide.advice).toBe('Test headline');
  });

  it("names the missing region's guide, not an empty catalogue", async () => {
    const { service, seasonal } = build({ premium: false });
    (seasonal as unknown as { catalogue: unknown }).catalogue = {
      snapshot: () =>
        Promise.resolve({ seasonGuide: () => null, listedCrops: () => [] }),
    };
    await expect(
      service.getSeasonalGuide({
        district: null,
        region_cluster: 'HILLS_COOL',
      }),
    ).rejects.toMatchObject({ reason: 'CATALOGUE_REGION_MISSING' });
  });

  it('answers in Hindi where the month has it', async () => {
    const seasonGuide = CATALOGUE_SEED.seasonGuide.map((g) => ({
      ...g,
      months: g.months.map((m) => ({
        ...m,
        hi: { headline: 'हिंदी शीर्षक' },
      })),
    }));
    const { service } = build({
      premium: false,
      seasonGuide,
      now: new Date('2026-01-15T06:00:00+05:30'),
    });
    const guide = await service.getSeasonalGuide(
      { district: null, region_cluster: 'NORTH_INDIA' },
      'hi',
    );
    expect(guide.advice).toBe('हिंदी शीर्षक');
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

describe('SeasonalService care status', () => {
  it("a tree without reviewed care is 'coming' with an empty pack", async () => {
    const { service } = build({ premium: false });
    const intel = await service.getTreeIntelligence('u1', 'p1');
    expect(intel.care_status).toBe('coming');
    expect(intel.seasonal_pack).toMatchObject({
      current_phase: 'care_coming',
      upcoming_phase: 'care_coming',
      do_now: [],
      avoid_now: [],
      watch_for: [],
    });
  });

  it("a reviewed tree is 'reviewed' with its care phase", async () => {
    const { service } = build({
      premium: false,
      mangoCare: CATALOGUE_SEED.treeCare.find((c) => c.family === 'mango')!,
    });
    const intel = await service.getTreeIntelligence('u1', 'p1');
    expect(intel.care_status).toBe('reviewed');
  });

  it('a premium tree without care shows the dryness adjustment with no season phase', async () => {
    const { service } = build({
      premium: true,
      entries: [{ content: 'soil dry' }],
    });
    const intel = await service.getTreeIntelligence('u1', 'p1');
    expect(intel.personalized_overlay?.adjusted_phase).toBe(
      'dryness_attention',
    );
  });

  it('new anchor rows are version 2 with no content', async () => {
    const { service, packs } = build({ premium: false });
    packs.findCohort.mockResolvedValueOnce(null);
    packs.create.mockImplementationOnce((data: object) =>
      Promise.resolve({ id: 'pack2', ...data }),
    );
    await service.getTreeIntelligence('u1', 'p1');
    expect(packs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pack_version: 2,
        basis: 'anchor_only',
        current_phase: 'care_coming',
        do_now: [],
        avoid_now: [],
        watch_for: [],
        task_templates: [],
      }),
    );
  });

  it("two first visits at once: the loser of the create race uses the winner's anchor", async () => {
    const { service, packs, pack } = build({ premium: false });
    packs.findCohort.mockResolvedValueOnce(null).mockResolvedValueOnce(pack);
    packs.create.mockRejectedValueOnce(
      Object.assign(new Error('unique'), { code: 'P2002' }),
    );
    const res = await service.getTreeIntelligence('u1', 'p1');
    expect(res.seasonal_pack).toMatchObject({ id: 'pack1' });
  });
});
