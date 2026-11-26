import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TaskService } from '../../src/modules/plant-ledger';
import { ReminderAudienceRepository } from '../../src/modules/notifications/reminder-audience.repository';
import { ReminderSendsRepository } from '../../src/modules/notifications/reminder-sends.repository';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser } from './fixtures';

const ist = (date: string, time = '00:00') =>
  new Date(`${date}T${time}:00+05:30`);

describe('reminder queries', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  describe('due tasks', () => {
    const window = (weather: boolean) => ({
      from: ist('2026-11-20'),
      to: ist('2026-11-28'),
      weatherUntil: weather ? ist('2026-11-29') : null,
    });
    const titles = async (weather: boolean) =>
      (await app.get(TaskService).reminderTasks(alice.id, window(weather)))
        .map((t) => t.title)
        .sort();

    async function seed() {
      const plant = await seedPlant(prisma, alice.id);
      const ended = await seedPlant(prisma, alice.id, { ended_at: new Date() });
      const task = (
        title: string,
        due: Date,
        over: Record<string, unknown> = {},
      ) =>
        prisma.task.create({
          data: {
            plant_id: plant.id,
            type: 'WATER',
            title,
            due_date: due,
            ...over,
          },
        });
      await task('today', ist('2026-11-27', '09:00'));
      await task('a week late', ist('2026-11-20'));
      await task('eight days late', ist('2026-11-19', '23:00'));
      await task('tomorrow', ist('2026-11-28'));
      await task('tomorrow weather', ist('2026-11-28'), { source: 'WEATHER' });
      await task('day after weather', ist('2026-11-29'), { source: 'WEATHER' });
      await task('done', ist('2026-11-27'), { status: 'COMPLETED' });
      await task('cancelled', ist('2026-11-27'), { status: 'CANCELLED' });
      await task('late tonight IST', new Date('2026-11-27T18:00:00Z'));
      await task('ended plant', ist('2026-11-27'), { plant_id: ended.id });
    }

    it('counts pending tasks from a week back to the end of today, on living plants', async () => {
      await seed();
      expect(await titles(false)).toEqual([
        'a week late',
        'late tonight IST',
        'today',
      ]);
    });

    it('adds only tomorrow’s weather tasks for the evening', async () => {
      await seed();
      expect(await titles(true)).toEqual([
        'a week late',
        'late tonight IST',
        'today',
        'tomorrow weather',
      ]);
    });

    it('a task at 00:30 IST on the 28th is not today', async () => {
      const plant = await seedPlant(prisma, alice.id);
      await prisma.task.create({
        data: {
          plant_id: plant.id,
          type: 'WATER',
          title: 'just after midnight',
          due_date: new Date('2026-11-27T19:00:00Z'),
        },
      });
      expect(await titles(false)).toEqual([]);
    });
  });

  describe('who gets a reminder', () => {
    const ids = async (slot: 'MORNING' | 'EVENING', minute: number) =>
      (await app.get(ReminderAudienceRepository).batch(slot, minute, null, 50))
        .map((u) => u.id)
        .sort();
    const phone = (userId: string) =>
      prisma.pushDevice.create({
        data: {
          user_id: userId,
          token: `tok-${userId}`,
          platform: 'ANDROID',
        },
      });

    it('finds gardeners at that time who have a phone', async () => {
      await phone(alice.id);
      const noPhone = await seedUser(prisma);
      const other = await seedUser(prisma, { reminder_morning_min: 435 });
      await phone(other.id);
      const off = await seedUser(prisma, { reminder_morning_min: null });
      await phone(off.id);
      const leaving = await seedUser(prisma, {
        deletion_requested_at: new Date(),
        deletion_due_at: new Date(Date.now() + 86_400_000),
      });
      await phone(leaving.id);

      expect(await ids('MORNING', 420)).toEqual([alice.id]);
      expect(await ids('MORNING', 435)).toEqual([other.id]);
      expect(await ids('EVENING', 1080)).toEqual(
        [alice.id, other.id, off.id].sort(),
      );
      void noPhone;
    });
  });

  describe('reminder sends', () => {
    it('claims a slot once per day and can give it back', async () => {
      const sends = app.get(ReminderSendsRepository);
      expect(await sends.claim(alice.id, 'MORNING', '2026-11-27')).toBe(true);
      expect(await sends.claim(alice.id, 'MORNING', '2026-11-27')).toBe(false);
      expect(await sends.claim(alice.id, 'EVENING', '2026-11-27')).toBe(true);
      await sends.release(alice.id, 'MORNING', '2026-11-27');
      expect(await sends.claim(alice.id, 'MORNING', '2026-11-27')).toBe(true);
    });
  });
});
