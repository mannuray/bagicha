import type { ReminderSlot } from '@prisma/client';
import { FixedClock } from '../../common/time';
import type { ReminderUser } from './reminder-audience.repository';
import { ReminderDispatchService } from './reminder-dispatch.service';
import type { PushMessage, SendOutcome } from './push-sender';

/** A task view as TaskService.reminderTasks returns it (only what the run reads). */
const view = (over: Record<string, unknown> = {}) => ({
  type: 'WATER',
  title: 'Water the plant',
  tree_name: 'Tomato',
  priority: 'MEDIUM',
  source: 'TREE_CARE',
  due_date: new Date('2026-11-27T00:00:00+05:30'),
  ...over,
});

const user = (id: string): ReminderUser => ({
  id,
  language_pref: 'en',
  region_cluster: null,
  district: 'Patna',
});

/** 07:00 IST on 27 Nov 2026. */
const MORNING = new Date('2026-11-27T01:30:00Z');
/** 18:00 IST on 27 Nov 2026. */
const EVENING = new Date('2026-11-27T12:30:00Z');

function setup(opts: {
  now: Date;
  users?: ReminderUser[];
  tasks?: Record<string, ReturnType<typeof view>[]>;
  tokens?: Record<string, string[]>;
  outcomes?: (tokens: string[]) => SendOutcome[];
  enabled?: boolean;
}) {
  const users = opts.users ?? [user('u1')];
  const claimed = new Set<string>();
  const audience = {
    batch: jest.fn(
      (_slot: ReminderSlot, _minute: number, after: string | null) =>
        Promise.resolve(after ? [] : users),
    ),
  };
  const sends = {
    claim: jest.fn((userId: string, slot: ReminderSlot, date: string) => {
      const key = `${userId}|${slot}|${date}`;
      if (claimed.has(key)) return Promise.resolve(false);
      claimed.add(key);
      return Promise.resolve(true);
    }),
    release: jest.fn((userId: string, slot: ReminderSlot, date: string) => {
      claimed.delete(`${userId}|${slot}|${date}`);
      return Promise.resolve();
    }),
    pruneBefore: jest.fn(() => Promise.resolve(0)),
  };
  const devices = {
    tokensFor: jest.fn((ids: string[]) =>
      Promise.resolve(
        new Map(ids.map((id) => [id, opts.tokens?.[id] ?? [`tok-${id}`]])),
      ),
    ),
    removeTokens: jest.fn((t: string[]) => Promise.resolve(t.length)),
    removeStale: jest.fn(() => Promise.resolve(0)),
  };
  const tasks = {
    reminderTasks: jest.fn((userId: string) =>
      Promise.resolve(opts.tasks?.[userId] ?? [view()]),
    ),
  };
  const names = {
    namer: jest.fn(() => Promise.resolve(() => 'unused')),
    titler: jest.fn(() => Promise.resolve(() => 'unused')),
    careTexter: jest.fn(() => Promise.resolve(() => null)),
  };
  const sent: Array<{ tokens: string[]; msg: PushMessage }> = [];
  const sender = {
    enabled: opts.enabled ?? true,
    send: jest.fn((tokens: string[], msg: PushMessage) => {
      sent.push({ tokens, msg });
      return Promise.resolve(
        opts.outcomes?.(tokens) ?? tokens.map(() => 'sent' as const),
      );
    }),
  };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const service = new ReminderDispatchService(
    audience as never,
    sends as never,
    devices as never,
    tasks as never,
    names as never,
    sender as never,
    new FixedClock(opts.now),
    logger as never,
  );
  return { service, audience, sends, devices, tasks, sender, sent, logger };
}

describe('ReminderDispatchService', () => {
  it('sends one message to each gardener whose morning time is now', async () => {
    const { service, audience, sent } = setup({
      now: MORNING,
      users: [user('u1'), user('u2')],
    });
    const summary = await service.run();
    expect(audience.batch).toHaveBeenCalledWith('MORNING', 420, null, 200);
    expect(sent).toEqual([
      {
        tokens: ['tok-u1'],
        msg: {
          title: '1 garden task today',
          body: 'Water the plant (Tomato)',
          route: '/tasks',
        },
      },
      expect.objectContaining({ tokens: ['tok-u2'] }),
    ]);
    expect(summary).toMatchObject({ slot: 'MORNING', users: 2, sent: 2 });
  });

  it('serves the quarter-hour the run was scheduled for, even when it starts late', async () => {
    // Queued behind a slow 07:00 run, the 07:15 run only starts at 07:35.
    const { service, audience } = setup({
      now: new Date('2026-11-27T02:05:00Z'),
    });
    const summary = await service.run(new Date('2026-11-27T01:45:00Z'));
    expect(audience.batch).toHaveBeenCalledWith('MORNING', 435, null, 200);
    expect(summary).toMatchObject({ slot: 'MORNING', sent: 1, tooLate: false });
  });

  it('skips a run more than an hour late (the server was down) but still tidies up', async () => {
    const { service, audience, devices, sent } = setup({
      now: new Date('2026-11-27T02:31:00Z'),
    });
    const summary = await service.run(MORNING);
    expect(audience.batch).not.toHaveBeenCalled();
    expect(sent).toHaveLength(0);
    expect(devices.removeStale).toHaveBeenCalled();
    expect(summary).toMatchObject({ slot: null, tooLate: true });
  });

  it('reminds up to 10 gardeners at once, and every one of them', async () => {
    const users = Array.from({ length: 25 }, (_, i) =>
      user(`u${String(i).padStart(2, '0')}`),
    );
    const { service, sender } = setup({ now: MORNING, users });
    let inFlight = 0;
    let most = 0;
    sender.send.mockImplementation(async (tokens: string[]) => {
      inFlight += 1;
      most = Math.max(most, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return tokens.map(() => 'sent' as const);
    });
    const summary = await service.run();
    expect(most).toBe(10);
    expect(sender.send).toHaveBeenCalledTimes(25);
    expect(summary).toMatchObject({ users: 25, sent: 25 });
  });

  it('does not send a slot twice on the same day', async () => {
    const { service, sent } = setup({ now: MORNING });
    await service.run();
    const again = await service.run();
    expect(sent).toHaveLength(1);
    expect(again).toMatchObject({ users: 1, sent: 0 });
  });

  it('sends nothing, and keeps the slot handled, when nothing is due', async () => {
    const { service, sends, sent } = setup({
      now: MORNING,
      tasks: { u1: [] },
    });
    const summary = await service.run();
    expect(sent).toHaveLength(0);
    expect(sends.release).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ empty: 1, sent: 0 });
  });

  it('forgets a dead phone and keeps the slot when another phone got it', async () => {
    const { service, devices, sends } = setup({
      now: MORNING,
      tokens: { u1: ['tok-live', 'tok-dead'] },
      outcomes: () => ['sent', 'invalid-token'],
    });
    const summary = await service.run();
    expect(devices.removeTokens).toHaveBeenCalledWith(['tok-dead']);
    expect(sends.release).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ sent: 1, tokensRemoved: 1 });
  });

  it('frees the slot and fails the job, so its retry sends it, when every phone failed', async () => {
    const { service, sends, sent } = setup({
      now: MORNING,
      users: [user('u1'), user('u2')],
      outcomes: (t) =>
        t[0] === 'tok-u1' ? ['failed'] : t.map(() => 'sent' as const),
    });
    await expect(service.run()).rejects.toMatchObject({
      reason: 'PUSH_RETRY',
    });
    expect(sends.release).toHaveBeenCalledWith('u1', 'MORNING', '2026-11-27');
    expect(sent).toHaveLength(2);
    // The retry: u2 already has it, u1 is tried again.
    sent.length = 0;
    await expect(service.run()).rejects.toMatchObject({ reason: 'PUSH_RETRY' });
    expect(sent.map((s) => s.tokens)).toEqual([['tok-u1']]);
  });

  it('gives a gardener’s slot back when their tasks cannot be loaded, finishes the others, then fails the job', async () => {
    const { service, sends, tasks, sent } = setup({
      now: MORNING,
      users: [user('u1'), user('u2'), user('u3')],
    });
    tasks.reminderTasks.mockImplementation((userId: string) =>
      userId === 'u2'
        ? Promise.reject(new Error('pool timeout'))
        : Promise.resolve([view()]),
    );
    await expect(service.run()).rejects.toMatchObject({
      reason: 'PUSH_RETRY',
    });
    expect(sends.release).toHaveBeenCalledWith('u2', 'MORNING', '2026-11-27');
    expect(sent.map((s) => s.tokens)).toEqual([['tok-u1'], ['tok-u3']]);
  });

  it('asks for tomorrow’s weather tasks in the evening only', async () => {
    const morning = setup({ now: MORNING });
    await morning.service.run();
    expect(morning.tasks.reminderTasks).toHaveBeenCalledWith(
      'u1',
      {
        from: new Date('2026-11-20T00:00:00+05:30'),
        to: new Date('2026-11-28T00:00:00+05:30'),
        weatherUntil: null,
      },
      expect.anything(),
    );

    const evening = setup({
      now: EVENING,
      tasks: {
        u1: [
          view(),
          view({
            type: 'INSPECT',
            title: 'Cover against the cold night',
            tree_name: 'Papaya',
            source: 'WEATHER',
            due_date: new Date('2026-11-28T00:00:00+05:30'),
          }),
        ],
      },
    });
    await evening.service.run();
    expect(evening.tasks.reminderTasks).toHaveBeenCalledWith(
      'u1',
      {
        from: new Date('2026-11-20T00:00:00+05:30'),
        to: new Date('2026-11-28T00:00:00+05:30'),
        weatherUntil: new Date('2026-11-29T00:00:00+05:30'),
      },
      expect.anything(),
    );
    expect(evening.audience.batch).toHaveBeenCalledWith(
      'EVENING',
      1080,
      null,
      200,
    );
    expect(evening.sent[0].msg).toEqual({
      title: '2 garden tasks for tonight and tomorrow',
      body: 'Cover against the cold night (Papaya) · Water the plant (Tomato)',
      route: '/tasks',
    });
  });

  it('outside both reminder ranges only tidies up', async () => {
    // 13:00 IST
    const { service, audience, devices, sends } = setup({
      now: new Date('2026-11-27T07:30:00Z'),
    });
    const summary = await service.run();
    expect(audience.batch).not.toHaveBeenCalled();
    expect(devices.removeStale).toHaveBeenCalledWith(
      new Date('2026-09-28T07:30:00Z'),
    );
    expect(sends.pruneBefore).toHaveBeenCalledWith(
      new Date('2026-10-28T07:30:00Z'),
    );
    expect(summary.slot).toBeNull();
  });

  it('does nothing when push sending is off', async () => {
    const { service, audience, sends } = setup({
      now: MORNING,
      enabled: false,
    });
    await service.run();
    expect(audience.batch).not.toHaveBeenCalled();
    expect(sends.claim).not.toHaveBeenCalled();
  });

  it('logs counts only', async () => {
    const { service, logger } = setup({ now: MORNING });
    await service.run();
    const logged = JSON.stringify(logger.info.mock.calls);
    expect(logged).not.toContain('tok-u1');
    expect(logged).not.toContain('Tomato');
  });
});
