import { INestApplication } from '@nestjs/common';
import { Plant, PrismaClient, User } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { withFakeAi } from './fakes';
import { resetDb, seedPlant, seedUser, tokenFor } from './fixtures';

const TINY_JPEG_B64 = Buffer.from('fake-image').toString('base64');

describe('plant ownership', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let alice: User;
  let bob: User;
  let alicePlant: Plant;
  let bobPlant: Plant;

  const finalizeBody = (
    plantId: string,
    extra: Record<string, unknown> = {},
  ) => ({
    subject_type: 'TREE',
    subject_id: plantId,
    primary_issue: 'PEST',
    severity: 'MEDIUM',
    reasoning_summary: 'Aphids',
    recommended_actions: ['Spray neem'],
    ...extra,
  });

  const counts = async () => ({
    sessions: await prisma.diagnosisSession.count(),
    entries: await prisma.journalEntry.count(),
    tasks: await prisma.task.count(),
  });

  beforeAll(async () => {
    app = await createTestApp(withFakeAi);
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await resetDb(prisma);
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
    alicePlant = await seedPlant(prisma, alice.id);
    bobPlant = await seedPlant(prisma, bob.id);
  });

  afterAll(async () => {
    await app.close();
  });

  const as = (user: User) => ({
    post: (url: string) =>
      request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${tokenFor(app, user)}`),
  });

  describe('diagnosis/finalize', () => {
    it("returns 404 for another user's plant and writes nothing", async () => {
      const before = await counts();
      const res = await as(bob)
        .post('/api/v1/diagnosis/finalize')
        .send(finalizeBody(alicePlant.id));
      expect(res.status).toBe(404);
      expect(await counts()).toEqual(before);
    });

    it("returns 404 when session_id belongs to another user's plant", async () => {
      const aliceSession = await prisma.diagnosisSession.create({
        data: {
          subject_type: 'TREE',
          subject_id: alicePlant.id,
          plant_id: alicePlant.id,
        },
      });
      const res = await as(bob)
        .post('/api/v1/diagnosis/finalize')
        .send(finalizeBody(bobPlant.id, { session_id: aliceSession.id }));
      expect(res.status).toBe(404);
      const untouched = await prisma.diagnosisSession.findUnique({
        where: { id: aliceSession.id },
      });
      expect(untouched?.status).toBe('OPEN');
    });

    it('rejects a malformed event_at with 422 instead of crashing', async () => {
      const res = await as(alice)
        .post('/api/v1/diagnosis/finalize')
        .send(finalizeBody(alicePlant.id, { event_at: 'junk' }));
      expect(res.status).toBe(422);
    });

    it('lets the owner finalize a diagnosis', async () => {
      const res = await as(alice)
        .post('/api/v1/diagnosis/finalize')
        .send(finalizeBody(alicePlant.id));
      expect(res.status).toBe(200);
      expect(res.body.data.success).toBeUndefined();
      expect(res.body.data.tasks).toEqual([
        expect.objectContaining({
          status: 'created',
          taskId: expect.any(String),
        }),
      ]);
    });
  });

  describe('vision/diagnose', () => {
    it("returns 404 for another user's plant_id", async () => {
      const before = await counts();
      const res = await as(bob)
        .post('/api/v1/vision/diagnose')
        .send({ image_base64: TINY_JPEG_B64, plant_id: alicePlant.id });
      expect(res.status).toBe(404);
      expect(await counts()).toEqual(before);
    });

    it('lets the owner diagnose their plant', async () => {
      const res = await as(alice)
        .post('/api/v1/vision/diagnose')
        .send({ image_base64: TINY_JPEG_B64, plant_id: alicePlant.id });
      expect(res.status).toBe(201);
    });
  });

  describe('community/ask-ai', () => {
    it("returns 404 for another user's plant_id", async () => {
      const res = await as(bob)
        .post('/api/v1/community/ask-ai')
        .send({ question: 'Why are leaves curling?', plant_id: alicePlant.id });
      expect(res.status).toBe(404);
    });

    it('lets the owner ask about their plant', async () => {
      const res = await as(alice)
        .post('/api/v1/community/ask-ai')
        .send({ question: 'Why are leaves curling?', plant_id: alicePlant.id });
      expect(res.status).toBe(201);
    });
  });
});
