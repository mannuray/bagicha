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
}) {
  const pending = new Set<string>();
  const drafts: TaskDraft[] = [];
  const plant = {
    id: 'p1',
    name: 'Aam',
    lifecycle_stage: 'MATURE_BEARING',
    species: 'Mango',
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
  const service = new SeasonalService(
    { add: jest.fn() } as any,
    {} as any,
    { get: jest.fn() } as any,
    {
      getOwnedOrThrow: jest.fn(() => Promise.resolve(plant)),
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
    {
      findCohort: jest.fn(() => Promise.resolve(pack)),
      create: jest.fn(),
    } as unknown as SeasonalPackRepository,
    {
      findActive: jest.fn(() => Promise.resolve(null)),
      create: jest.fn((_u: string, _p: string, _k: string, data: object) =>
        Promise.resolve({ id: 'ov1', ...data }),
      ),
      update: jest.fn(),
    } as unknown as OverlayRepository,
    {} as unknown as SeasonalIntelligenceService,
    {
      resolveSpeciesFamily: () => 'mango',
    } as unknown as SpeciesNormalizationService,
    new FixedClock(NOW),
    { registerQueueDepth: jest.fn() } as any,
  );
  return { service, drafts };
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

  it('due dates come from the injected clock', async () => {
    const { service, drafts } = build({ premium: false });
    await service.materializeTasksForTree('u1', 'p1');
    expect(drafts[0]).toMatchObject({
      source: TaskSource.SEASONAL_PACK,
      sourceKey: 'seasonal_primary_action',
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
