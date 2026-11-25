import { INestApplication } from '@nestjs/common';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { WeatherForecasts } from '../../src/modules/weather/weather-forecasts';
import { WeatherReminderService } from '../../src/modules/weather/weather-reminder.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

const istDate = (offsetDays: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(
    new Date(Date.now() + offsetDays * 864e5),
  );
const day = (offset: number, maxC: number) => ({
  date: istDate(offset),
  condition: 'CLEAR',
  maxC,
  minC: 20,
  rainMm: 0,
  rainChance: 0,
});

/** The daily weather run against the real database. */
describe('weather reminders', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let reminders: WeatherReminderService;
  let user: User;
  let plant: Plant;

  beforeAll(async () => {
    app = await createTestApp((b) =>
      b.overrideProvider(WeatherForecasts).useValue({
        // Tomorrow is a very hot day in the plains.
        forCell: () =>
          Promise.resolve({
            forecast: {
              now: { tempC: 35, condition: 'CLEAR' },
              days: [day(0, 36), day(1, 42)],
            },
            source: 'Open-Meteo',
          }),
      }),
    );
    prisma = app.get(PrismaService);
    reminders = app.get(WeatherReminderService);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    user = await seedUser(prisma);
    await prisma.user.update({
      where: { id: user.id },
      data: { district: 'Patna' },
    });
    plant = await seedPlant(prisma, user.id);
  });
  afterAll(async () => {
    await app.close();
  });

  const weatherTasks = () =>
    prisma.task.findMany({ where: { plant_id: plant.id, source: 'WEATHER' } });

  it('adds one watering reminder for tomorrow, readable in Hindi', async () => {
    await reminders.run();
    const tasks = await weatherTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      type: 'WATER',
      status: 'PENDING',
      source_key: `weather:HEAT:${plant.id}:${istDate(1)}`,
      title: 'Water the soil lightly in the early morning or evening',
      reason: 'Very hot day expected (42°C)',
    });
    const res = await request(app.getHttpServer())
      .get('/api/v1/ledger/tasks')
      .set('Authorization', `Bearer ${tokenFor(app, user)}`)
      .set('Accept-Language', 'hi');
    expect(JSON.stringify(res.body)).toContain(
      'सुबह जल्दी या शाम को मिट्टी को हल्का पानी दें',
    );
  });

  it('adds nothing when it runs again', async () => {
    await reminders.run();
    await reminders.run();
    expect(await weatherTasks()).toHaveLength(1);
  });

  it('does not bring back a reminder the gardener completed', async () => {
    await reminders.run();
    const [task] = await weatherTasks();
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'COMPLETED' },
    });
    await reminders.run();
    const tasks = await weatherTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe('COMPLETED');
  });

  it("expires yesterday's unfinished weather reminder", async () => {
    const stale = await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'WATER',
        source: 'WEATHER',
        source_key: `weather:HEAT:${plant.id}:${istDate(-1)}`,
        due_date: new Date(`${istDate(-1)}T00:00:00+05:30`),
      },
    });
    await reminders.run();
    expect(
      (await prisma.task.findUnique({ where: { id: stale.id } }))?.status,
    ).toBe('CANCELLED');
  });

  it('leaves ended plants alone', async () => {
    await prisma.plant.update({
      where: { id: plant.id },
      data: { ended_at: new Date() },
    });
    await reminders.run();
    expect(await weatherTasks()).toHaveLength(0);
  });
});
