import {
  DiagnosisIssueType,
  DiagnosisSeverity,
  DiagnosisSubjectType,
  LogType,
  TaskPriority,
  TaskSource,
  TaskType,
} from '@prisma/client';
import { ValidationError } from '../../../common/errors';
import { Metrics } from '../../../common/observability';
import { TransactionRunner } from '../../../common/prisma/transaction';
import { FixedClock } from '../../../common/time';
import {
  CycleService,
  JournalService,
  PlantRecordService,
  TaskDraft,
  TaskService,
} from '../../plant-ledger';
import { DiagnosisRepository } from '../repositories/diagnosis.repository';
import {
  DiagnosisPipelineService,
  FinalizeDiagnosisInput,
} from './diagnosis-pipeline.service';

const EVENT_AT = '2026-03-01T06:00:00.000Z';

function build() {
  const drafts: TaskDraft[] = [];
  const entries: Array<{ type: LogType }> = [];
  const plant = { id: 'p1', name: 'Aam', user_id: 'u1' };
  const plants = {
    getOwnedOrThrow: jest.fn(() => Promise.resolve(plant)),
    assertGrowing: jest.fn(() => Promise.resolve(plant)),
  };
  const cycles = { ensureCycle: jest.fn(() => Promise.resolve({ id: 'c1' })) };
  const journal = {
    recordEntry: jest.fn((_u: string, _p: string, e: { type: LogType }) => {
      entries.push(e);
      return Promise.resolve({ id: `log-${entries.length}` });
    }),
  };
  const tasks = {
    createTasks: jest.fn((_u: string, _p: string, d: TaskDraft[]) => {
      drafts.push(...d);
      return Promise.resolve(
        d.map((x, i) => ({
          sourceKey: x.sourceKey,
          status: 'created',
          taskId: `t${i}`,
        })),
      );
    }),
  };
  const repo = {
    findOwnedSession: jest.fn(() => Promise.resolve({ id: 's-existing' })),
    createSession: jest.fn(() => Promise.resolve({ id: 's1' })),
    resolveSession: jest.fn(() => Promise.resolve({ id: 's-existing' })),
    createOutcome: jest.fn(() => Promise.resolve({ id: 'o1' })),
  };
  const transactions = { run: (fn: (tx: unknown) => unknown) => fn('tx') };
  const metrics = { diagnosisRecorded: jest.fn() };
  const service = new DiagnosisPipelineService(
    repo as unknown as DiagnosisRepository,
    plants as unknown as PlantRecordService,
    cycles as unknown as CycleService,
    journal as unknown as JournalService,
    tasks as unknown as TaskService,
    transactions as unknown as TransactionRunner,
    new FixedClock(new Date('2026-03-02T00:00:00Z')),
    metrics as unknown as Metrics,
  );
  return { service, drafts, entries, repo, metrics, journal };
}

const input = (
  over: Partial<FinalizeDiagnosisInput> = {},
): FinalizeDiagnosisInput => ({
  subject_type: DiagnosisSubjectType.TREE,
  subject_id: 'p1',
  event_at: EVENT_AT,
  primary_issue: DiagnosisIssueType.PEST,
  severity: DiagnosisSeverity.HIGH,
  reasoning_summary: 'Mealybugs',
  recommended_actions: [
    'Spray neem',
    'Prune',
    'Recheck',
    'Band trunk',
    'Clear litter',
  ],
  follow_up_days: 4,
  ...over,
});

describe('DiagnosisPipelineService.finalize', () => {
  it('creates one task per action with the existing priorities and due dates', async () => {
    const { service, drafts } = build();
    await service.finalize('u1', input());
    expect(drafts).toHaveLength(5);
    expect(drafts[0]).toMatchObject({
      type: TaskType.TREAT,
      priority: TaskPriority.HIGH,
      source: TaskSource.AI_DIAGNOSIS,
      sourceKey: 'diagnosis:o1:0',
      title: 'Spray neem',
      diagnosisOutcomeId: 'o1',
      plantCycleId: 'c1',
    });
    expect(drafts[0].dueDate.toISOString()).toBe('2026-03-05T06:00:00.000Z');
    expect(drafts[1].priority).toBe(TaskPriority.MEDIUM);
    expect(drafts[1].dueDate.toISOString()).toBe('2026-03-07T06:00:00.000Z');
    expect(drafts[4].dueDate.toISOString()).toBe('2026-03-13T06:00:00.000Z');
  });

  it('caps tasks at MAX_TASKS_FROM_DIAGNOSIS (5)', async () => {
    const { service, drafts } = build();
    await service.finalize(
      'u1',
      input({ recommended_actions: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
    );
    expect(drafts).toHaveLength(5);
  });

  it('records the diagnosis entry plus the inferred related entry', async () => {
    const { service, entries } = build();
    const result = await service.finalize('u1', input());
    expect(entries.map((e) => e.type)).toEqual([
      LogType.DIAGNOSIS,
      LogType.PEST_DIAGNOSIS,
    ]);
    expect(result).toMatchObject({
      session_id: 's1',
      outcome_id: 'o1',
      log_ids: ['log-1', 'log-2'],
      tasks: expect.arrayContaining([
        expect.objectContaining({ status: 'created', taskId: 't0' }),
      ]),
    });
  });

  it('rejects unsupported subjects with DIAGNOSIS_SUBJECT_UNSUPPORTED', async () => {
    const { service } = build();
    await expect(
      service.finalize(
        'u1',
        input({ subject_type: DiagnosisSubjectType.CROP_SEASON }),
      ),
    ).rejects.toMatchObject({ reason: 'DIAGNOSIS_SUBJECT_UNSUPPORTED' });
    await expect(
      service.finalize(
        'u1',
        input({ subject_type: DiagnosisSubjectType.CROP_SEASON }),
      ),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a session that is not on this plant', async () => {
    const { service, repo } = build();
    repo.findOwnedSession.mockImplementationOnce(() =>
      Promise.resolve(null as never),
    );
    await expect(
      service.finalize('u1', input({ session_id: 'foreign' })),
    ).rejects.toMatchObject({ reason: 'DIAGNOSIS_SESSION_NOT_FOUND' });
  });

  it('counts the recorded diagnosis', async () => {
    const { service, metrics } = build();
    await service.finalize('u1', input());
    expect(metrics.diagnosisRecorded).toHaveBeenCalledWith('PEST');
  });

  it('rejects an unparseable event_at before writing anything', async () => {
    const { service, entries } = build();
    await expect(
      service.finalize('u1', input({ event_at: 'not-a-date' })),
    ).rejects.toMatchObject({ reason: 'DIAGNOSIS_EVENT_AT_INVALID' });
    expect(entries).toHaveLength(0);
  });
});
