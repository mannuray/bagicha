import { Injectable } from '@nestjs/common';
import type { RegionCluster, ReminderSlot } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { Lang } from '../../common/http/lang';
import { UpstreamError } from '../../common/errors';
import { addDays, Clock } from '../../common/time';
import { PlantNamesService, TaskService } from '../plant-ledger';
import { regionFor } from '../regions';
import { countWindow, istQuarter, REMINDER_RANGES } from '../user';
import { composeReminder, type ReminderTask } from './domain/reminder-message';
import { PushDeviceRepository } from './push-device.repository';
import { PushSender } from './push-sender';
import {
  ReminderAudienceRepository,
  type ReminderUser,
} from './reminder-audience.repository';
import { ReminderSendsRepository } from './reminder-sends.repository';

export interface ReminderRunSummary {
  slot: ReminderSlot | null;
  users: number;
  sent: number;
  empty: number;
  failed: number;
  /** Gardeners whose slot was given back for the job's retry. */
  retry: number;
  tokensRemoved: number;
  staleRemoved: number;
  sendsPruned: number;
  /** The run started over an hour after its quarter-hour (the server was down), so it sent nothing. */
  tooLate: boolean;
}

const BATCH_SIZE = 200;
const STALE_DEVICE_DAYS = 60;
const KEEP_SENDS_DAYS = 30;
/** Gardeners reminded at the same time: overlaps the push calls without crowding the database pool. */
const PARALLEL = 10;
/** A reminder later than this is no longer about "now"; the next day's comes instead. */
const MAX_LATE_MS = 60 * 60_000;

const istDayStart = (date: string) => new Date(`${date}T00:00:00+05:30`);
const slotAt = (minute: number): ReminderSlot | null =>
  (Object.keys(REMINDER_RANGES) as ReminderSlot[]).find(
    (s) => minute >= REMINDER_RANGES[s].min && minute <= REMINDER_RANGES[s].max,
  ) ?? null;

type Names = Parameters<TaskService['reminderTasks']>[2];
type TaskView = Awaited<ReturnType<TaskService['reminderTasks']>>[number];

/**
 * The quarter-hourly reminder run: for the slot whose time it is, each
 * gardener set to this quarter-hour gets one push summing up what is due,
 * at most once a day. Logs hold counts only.
 */
@Injectable()
export class ReminderDispatchService {
  constructor(
    private readonly audience: ReminderAudienceRepository,
    private readonly sends: ReminderSendsRepository,
    private readonly devices: PushDeviceRepository,
    private readonly tasks: TaskService,
    private readonly names: PlantNamesService,
    private readonly sender: PushSender,
    private readonly clock: Clock,
    @InjectPinoLogger(ReminderDispatchService.name)
    private readonly logger: PinoLogger,
  ) {}

  /** `dueAt` is the quarter-hour this run was scheduled for; it defaults to now. */
  async run(dueAt?: Date): Promise<ReminderRunSummary> {
    const now = this.clock.now();
    const at = dueAt ?? now;
    const summary: ReminderRunSummary = {
      slot: null,
      users: 0,
      sent: 0,
      empty: 0,
      failed: 0,
      retry: 0,
      tokensRemoved: 0,
      staleRemoved: 0,
      sendsPruned: 0,
      tooLate: now.getTime() - at.getTime() > MAX_LATE_MS,
    };
    if (!this.sender.enabled) return summary;

    const { istDate, minute } = istQuarter(at);
    summary.slot = summary.tooLate ? null : slotAt(minute);
    if (summary.slot)
      await this.sendSlot(summary.slot, istDate, minute, summary);

    summary.staleRemoved = await this.devices.removeStale(
      addDays(now, -STALE_DEVICE_DAYS),
    );
    summary.sendsPruned = await this.sends.pruneBefore(
      addDays(now, -KEEP_SENDS_DAYS),
    );
    this.logger.info({ ...summary }, 'push reminders run');
    if (summary.retry > 0) {
      // BullMQ retries only a failed job; gardeners already reminded keep their claim and are skipped.
      throw new UpstreamError(
        'PUSH_RETRY',
        'Some reminders could not be sent; the job will retry them',
        { retry: summary.retry },
      );
    }
    return summary;
  }

  private async sendSlot(
    slot: ReminderSlot,
    istDate: string,
    minute: number,
    summary: ReminderRunSummary,
  ): Promise<void> {
    const days = countWindow(istDate);
    const window = {
      from: istDayStart(days.fromDate),
      to: istDayStart(days.tomorrow),
      // The evening also covers tomorrow's weather: a cold night or heavy rain dated tomorrow is about tonight.
      weatherUntil:
        slot === 'EVENING'
          ? istDayStart(countWindow(days.tomorrow).tomorrow)
          : null,
    };
    const namesFor = this.namesCache();

    let after: string | null = null;
    for (;;) {
      const users = await this.audience.batch(slot, minute, after, BATCH_SIZE);
      if (users.length === 0) break;
      after = users[users.length - 1].id;
      summary.users += users.length;
      const tokens = await this.devices.tokensFor(users.map((u) => u.id));

      await eachLimited(users, PARALLEL, async (user) => {
        if (!(await this.sends.claim(user.id, slot, istDate))) return;
        try {
          await this.remind(
            user,
            tokens.get(user.id) ?? [],
            window,
            namesFor,
            { slot, istDate },
            summary,
          );
        } catch {
          // A failure for one gardener (a database blip) must not cost them the day's reminder.
          await this.sends.release(user.id, slot, istDate);
          summary.retry += 1;
        }
      });
      if (users.length < BATCH_SIZE) break;
    }
  }

  private async remind(
    user: ReminderUser,
    tokens: string[],
    window: { from: Date; to: Date; weatherUntil: Date | null },
    namesFor: ReturnType<ReminderDispatchService['namesCache']>,
    at: { slot: ReminderSlot; istDate: string },
    summary: ReminderRunSummary,
  ): Promise<void> {
    const lang: Lang = user.language_pref === 'hi' ? 'hi' : 'en';
    const due = await this.tasks.reminderTasks(
      user.id,
      window,
      await namesFor(lang, user),
    );
    const message = composeReminder(
      due.map((t) => toReminderTask(t, window.to)),
      lang,
    );
    if (!message) {
      summary.empty += 1;
      return;
    }
    await this.deliver(
      user.id,
      tokens,
      { ...message, route: '/tasks' },
      at,
      summary,
    );
  }

  private async deliver(
    userId: string,
    tokens: string[],
    message: { title: string; body: string; route: '/tasks' },
    at: { slot: ReminderSlot; istDate: string },
    summary: ReminderRunSummary,
  ): Promise<void> {
    const outcomes = tokens.length
      ? await this.sender.send(tokens, message)
      : [];
    const dead = tokens.filter((_, i) => outcomes[i] === 'invalid-token');
    summary.tokensRemoved += await this.devices.removeTokens(dead);
    if (outcomes.includes('sent')) {
      summary.sent += 1;
      return;
    }
    if (outcomes.length > 0 && outcomes.every((o) => o === 'failed')) {
      // Nothing reached any phone: free the slot so the job's retry can send it.
      await this.sends.release(userId, at.slot, at.istDate);
      summary.retry += 1;
    }
    summary.failed += 1;
  }

  /** One namer/titler per language and one care texter per language and region, per run. */
  private namesCache() {
    const cache = new Map<string, Promise<Names>>();
    return (lang: Lang, user: ReminderUser): Promise<Names> => {
      const region: RegionCluster = regionFor(user);
      const key = `${lang}|${region}`;
      let names = cache.get(key);
      if (!names) {
        names = Promise.all([
          this.names.namer(lang),
          this.names.titler(lang),
          this.names.careTexter(lang, region),
        ]).then(([namer, titler, careTexter]) => ({
          namer,
          titler,
          careTexter,
        }));
        cache.set(key, names);
      }
      return names;
    };
  }
}

/** Runs `fn` over `items` with at most `limit` running at once; `fn` handles its own errors. */
async function eachLimited<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const lane = async () => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, lane),
  );
}

function toReminderTask(t: TaskView, tomorrowStart: Date): ReminderTask {
  return {
    type: t.type,
    title: t.title,
    plantName: t.tree_name ?? '',
    priority: t.priority,
    dueDate: istQuarter(t.due_date).istDate,
    weather: t.source === 'WEATHER',
    tomorrow: t.due_date.getTime() >= tomorrowStart.getTime(),
  };
}
