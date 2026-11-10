import { INestApplication } from '@nestjs/common';
import {
  LogType,
  Plant,
  PlantCycle,
  PrismaClient,
  Task,
  TaskSource,
  TaskStatus,
  TaskType,
  User,
} from '@prisma/client';
import { CycleRepository } from '../../src/modules/plant-ledger/repositories/cycle.repository';
import { JournalRepository } from '../../src/modules/plant-ledger/repositories/journal.repository';
import { PlantRepository } from '../../src/modules/plant-ledger/repositories/plant.repository';
import { TaskRepository } from '../../src/modules/plant-ledger/repositories/task.repository';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser } from './fixtures';

describe('plant-ledger repositories are owner-scoped', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let plants: PlantRepository;
  let journal: JournalRepository;
  let cycles: CycleRepository;
  let tasks: TaskRepository;
  let alice: User;
  let bob: User;
  let plant: Plant;
  let cycle: PlantCycle;
  let task: Task;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    plants = app.get(PlantRepository);
    journal = app.get(JournalRepository);
    cycles = app.get(CycleRepository);
    tasks = app.get(TaskRepository);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
    plant = await seedPlant(prisma, alice.id);
    cycle = await prisma.plantCycle.create({
      data: { plant_id: plant.id, cycle_year: 2026 },
    });
    await prisma.journalEntry.create({
      data: {
        plant_id: plant.id,
        plant_cycle_id: cycle.id,
        type: LogType.NOTE,
      },
    });
    task = await prisma.task.create({
      data: {
        plant_id: plant.id,
        plant_cycle_id: cycle.id,
        type: TaskType.WATER,
        source: TaskSource.MANUAL,
        source_key: 'k1',
        due_date: new Date('2026-12-01T00:00:00Z'),
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const page = { skip: 0, take: 20 };

  describe('PlantRepository', () => {
    it('hides plants from other users', async () => {
      expect(await plants.findOwned(bob.id, plant.id)).toBeNull();
      expect(await plants.findOwnedDetail(bob.id, plant.id)).toBeNull();
      expect(await plants.findOwnedWithContext(bob.id, plant.id)).toBeNull();
      expect((await plants.listOwned(bob.id, page)).rows).toEqual([]);
    });

    it('refuses to update another user’s plant', async () => {
      expect(
        await plants.updateOwned(bob.id, plant.id, { name: 'stolen' }),
      ).toBeNull();
      expect(
        (await prisma.plant.findUniqueOrThrow({ where: { id: plant.id } }))
          .name,
      ).toBe(plant.name);
    });

    it('pages the owner’s plants and counts only theirs', async () => {
      await seedPlant(prisma, alice.id);
      await seedPlant(prisma, alice.id);
      await seedPlant(prisma, bob.id);
      const first = await plants.listOwned(alice.id, { skip: 0, take: 2 });
      expect(first.rows).toHaveLength(2);
      expect(first.total).toBe(3);
      const second = await plants.listOwned(alice.id, { skip: 2, take: 2 });
      expect(second.rows).toHaveLength(1);
    });

    it('creates plants for the given owner', async () => {
      const created = await plants.create(alice.id, {
        name: 'Nimbu',
        species: 'Lemon',
      });
      expect(created.user_id).toBe(alice.id);
    });
  });

  describe('JournalRepository', () => {
    it('hides and refuses entries for other users', async () => {
      expect((await journal.listForPlant(bob.id, plant.id, page)).rows).toEqual(
        [],
      );
      expect(await journal.listForCycle(bob.id, plant.id, cycle.id)).toEqual(
        [],
      );
      expect(
        await journal.recentByTypes(bob.id, plant.id, [LogType.NOTE], 5),
      ).toEqual([]);
      expect(await journal.recent(bob.id, plant.id, 5)).toEqual([]);
      expect(
        await journal.create(bob.id, plant.id, { type: LogType.NOTE }),
      ).toBeNull();
      expect(await prisma.journalEntry.count()).toBe(1);
    });

    it('lets the owner read and write', async () => {
      expect((await journal.listForPlant(alice.id, plant.id, page)).total).toBe(
        1,
      );
      expect(
        await journal.create(alice.id, plant.id, { type: LogType.WATERING }),
      ).not.toBeNull();
    });
  });

  describe('CycleRepository', () => {
    it('hides and refuses cycles for other users', async () => {
      expect(await cycles.upsertForYear(bob.id, plant.id, 2027)).toBeNull();
      expect((await cycles.listForPlant(bob.id, plant.id, page)).rows).toEqual(
        [],
      );
      expect(await cycles.latestTwo(bob.id, plant.id)).toEqual([]);
      expect(
        await cycles.update(bob.id, cycle.id, { cycle_summary: 'x' }),
      ).toBe(false);
      expect(await prisma.plantCycle.count()).toBe(1);
    });

    it('upserts one cycle per year for the owner', async () => {
      const a = await cycles.upsertForYear(alice.id, plant.id, 2026);
      expect(a?.id).toBe(cycle.id);
      expect(
        await cycles.update(alice.id, cycle.id, { cycle_summary: 'ok' }),
      ).toBe(true);
    });
  });

  describe('TaskRepository', () => {
    it('hides and refuses tasks for other users', async () => {
      expect((await tasks.listForPlant(bob.id, plant.id, page)).rows).toEqual(
        [],
      );
      expect((await tasks.listForUser(bob.id, page)).rows).toEqual([]);
      expect(await tasks.findOwned(bob.id, plant.id, task.id)).toBeNull();
      expect(
        await tasks.findPendingBySourceKey(
          bob.id,
          plant.id,
          TaskSource.MANUAL,
          'k1',
        ),
      ).toBeNull();
      expect(
        await tasks.updateStatus(
          bob.id,
          plant.id,
          task.id,
          TaskStatus.COMPLETED,
          new Date(),
        ),
      ).toBeNull();
      expect(await tasks.listForCycle(bob.id, plant.id, cycle.id)).toEqual([]);
      expect(
        await tasks.create(bob.id, plant.id, {
          type: TaskType.WATER,
          due_date: new Date(),
        }),
      ).toBeNull();
      const stored = await prisma.task.findUniqueOrThrow({
        where: { id: task.id },
      });
      expect(stored.status).toBe(TaskStatus.PENDING);
      expect(await prisma.task.count()).toBe(1);
    });

    it('lets the owner find, list and update', async () => {
      expect(
        await tasks.findPendingBySourceKey(
          alice.id,
          plant.id,
          TaskSource.MANUAL,
          'k1',
        ),
      ).not.toBeNull();
      expect((await tasks.listForUser(alice.id, page)).total).toBe(1);
      const done = await tasks.updateStatus(
        alice.id,
        plant.id,
        task.id,
        TaskStatus.COMPLETED,
        new Date(),
      );
      expect(done?.status).toBe(TaskStatus.COMPLETED);
    });
  });
});
