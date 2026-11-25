import { INestApplication } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { AccountEraserRepository } from '../../src/modules/account-erasure/account-eraser.repository';
import { AccountErasureService } from '../../src/modules/account-erasure/account-erasure.service';
import { MediaService } from '../../src/modules/media';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';
import { resetDb, seedPlant, seedUser } from './fixtures';

const DAY = 86_400_000;

describe('account erasure (day 30)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let erasure: AccountErasureService;
  let removeMedia: jest.SpyInstance;
  let alice: User;
  let bob: User;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    erasure = app.get(AccountErasureService);
    removeMedia = jest
      .spyOn(app.get(MediaService), 'removeOwnerMedia')
      .mockResolvedValue(0);
  });
  beforeEach(async () => {
    await resetDb(prisma);
    removeMedia.mockClear();
    alice = await seedUser(prisma);
    bob = await seedUser(prisma);
  });
  afterAll(async () => {
    await app.close();
  });

  const due = (user: User, at: Date | null) =>
    prisma.user.update({
      where: { id: user.id },
      data: { deletion_requested_at: at && new Date(), deletion_due_at: at },
    });

  /** Alice's whole garden and community life, tangled up with Bob's. */
  async function seedAliceLife() {
    const plant = await seedPlant(prisma, alice.id);
    const place = await prisma.gardenPlace.create({
      data: { user_id: alice.id, name: 'Roof bed', kind: 'BED' },
    });
    const cycle = await prisma.plantCycle.create({
      data: { plant_id: plant.id, cycle_year: 2026, place_id: place.id },
    });
    const session = await prisma.diagnosisSession.create({
      data: { subject_type: 'TREE', subject_id: plant.id, plant_id: plant.id },
    });
    const outcome = await prisma.diagnosisOutcome.create({
      data: { session_id: session.id, plant_id: plant.id },
    });
    await prisma.journalEntry.create({
      data: {
        plant_id: plant.id,
        plant_cycle_id: cycle.id,
        type: 'NOTE',
        content: 'first flowers',
        diagnosis_outcome_id: outcome.id,
      },
    });
    await prisma.task.create({
      data: {
        plant_id: plant.id,
        type: 'WATER',
        due_date: new Date(),
        diagnosis_outcome_id: outcome.id,
      },
    });
    const alicePost = await prisma.post.create({
      data: { author_id: alice.id, content: 'my roof garden' },
    });
    const bobPost = await prisma.post.create({
      data: { author_id: bob.id, content: 'bob asks about mango' },
    });
    await prisma.comment.create({
      data: { post_id: alicePost.id, author_id: bob.id, content: 'lovely' },
    });
    const aliceComment = await prisma.comment.create({
      data: { post_id: bobPost.id, author_id: alice.id, content: 'use neem' },
    });
    const bobComment = await prisma.comment.create({
      data: { post_id: bobPost.id, author_id: bob.id, content: 'thanks' },
    });
    await prisma.report.create({
      data: {
        target_type: 'POST',
        target_id: bobPost.id,
        reporter_id: alice.id,
        reason: 'spam',
      },
    });
    await prisma.report.create({
      data: {
        target_type: 'COMMENT',
        target_id: aliceComment.id,
        reporter_id: bob.id,
      },
    });
    const reportEvent = (actor: string, target: string, words: string) =>
      prisma.auditEvent.create({
        data: {
          action: 'COMMUNITY_REPORT_FILED',
          actor_user_id: actor,
          target_type: 'POST',
          target_id: target,
          snapshot: {
            target_id: target,
            reason: words,
            content_excerpt: words,
            reporter_id: actor,
          },
        },
      });
    const byAlice = await reportEvent(alice.id, bobPost.id, 'alice words');
    const aboutAlice = await reportEvent(
      bob.id,
      alicePost.id,
      'alice post text',
    );
    const unrelated = await reportEvent(bob.id, 'other-post', 'keep me');
    const hello = await prisma.message.create({
      data: { sender_id: alice.id, receiver_id: bob.id, content: 'hello bob' },
    });
    await prisma.message.create({
      data: { sender_id: bob.id, receiver_id: alice.id, content: 'hi alice' },
    });
    const [user_a, user_b] = [alice.id, bob.id].sort();
    await prisma.conversation.create({
      data: {
        user_a,
        user_b,
        last_message_id: hello.id,
        last_at: hello.created_at,
      },
    });
    await prisma.userBlock.create({
      data: { blocker_id: bob.id, blocked_id: alice.id },
    });
    await prisma.expertVerification.create({
      data: { user_id: alice.id, credential_type: 'KVK' },
    });
    await prisma.appliedPayment.create({
      data: { payment_id: 'pay_1', user_id: alice.id, plan_id: 'monthly' },
    });
    return { bobPost, bobComment, byAlice, aboutAlice, unrelated };
  }

  it('erases everything of a due account and leaves the other person whole', async () => {
    const bobPlant = await seedPlant(prisma, bob.id);
    const seeded = await seedAliceLife();
    await due(alice, new Date(Date.now() - DAY));

    await expect(erasure.run()).resolves.toEqual({
      due: 1,
      erased: 1,
      failed: 0,
    });

    expect(removeMedia).toHaveBeenCalledWith(alice.id);
    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(0);
    expect(await prisma.plant.count({ where: { user_id: alice.id } })).toBe(0);
    expect(await prisma.gardenPlace.count()).toBe(0);
    expect(await prisma.plantCycle.count()).toBe(0);
    expect(await prisma.journalEntry.count()).toBe(0);
    expect(await prisma.task.count()).toBe(0);
    expect(await prisma.diagnosisSession.count()).toBe(0);
    expect(await prisma.diagnosisOutcome.count()).toBe(0);
    expect(await prisma.message.count()).toBe(0);
    expect(await prisma.conversation.count()).toBe(0);
    expect(await prisma.userBlock.count()).toBe(0);
    expect(await prisma.expertVerification.count()).toBe(0);
    expect(await prisma.report.count()).toBe(0);

    // Bob keeps his plant, his post and his own reply on it; Alice's reply is gone.
    expect(
      await prisma.plant.findUnique({ where: { id: bobPlant.id } }),
    ).not.toBeNull();
    expect((await prisma.post.findMany()).map((p) => p.id)).toEqual([
      seeded.bobPost.id,
    ]);
    expect((await prisma.comment.findMany()).map((c) => c.id)).toEqual([
      seeded.bobComment.id,
    ]);

    // Kept by law: the payment record.
    expect(
      await prisma.appliedPayment.count({ where: { payment_id: 'pay_1' } }),
    ).toBe(1);

    // Audit events stay, without Alice's words.
    const snap = async (id: string) =>
      (await prisma.auditEvent.findUniqueOrThrow({ where: { id } }))
        .snapshot as Record<string, unknown>;
    for (const event of [seeded.byAlice, seeded.aboutAlice]) {
      const s = await snap(event.id);
      expect(s.reason).toBeNull();
      expect(s.content_excerpt).toBeNull();
      expect(s.target_id).toBeDefined();
    }
    expect((await snap(seeded.unrelated.id)).reason).toBe('keep me');
  });

  it('leaves an account that was kept (nothing pending) untouched', async () => {
    await seedPlant(prisma, alice.id);
    await due(alice, null);
    await expect(erasure.run()).resolves.toEqual({
      due: 0,
      erased: 0,
      failed: 0,
    });
    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(1);
    expect(removeMedia).not.toHaveBeenCalled();
  });

  it('leaves an account still inside its 30 days untouched', async () => {
    await due(alice, new Date(Date.now() + DAY));
    await expect(erasure.run()).resolves.toEqual({
      due: 0,
      erased: 0,
      failed: 0,
    });
    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(1);
  });

  it('keeps the account when its photos could not be removed, and erases it on a later run', async () => {
    await seedPlant(prisma, alice.id);
    await due(alice, new Date(Date.now() - DAY));
    removeMedia.mockRejectedValueOnce(new Error('AccessDenied'));
    await expect(erasure.run()).resolves.toEqual({
      due: 1,
      erased: 0,
      failed: 1,
    });
    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(1);
    await expect(erasure.run()).resolves.toEqual({
      due: 1,
      erased: 1,
      failed: 0,
    });
    expect(await prisma.user.count({ where: { id: alice.id } })).toBe(0);
  });

  it('one failing account does not stop the others', async () => {
    await due(alice, new Date(Date.now() - DAY));
    await due(bob, new Date(Date.now() - DAY));
    removeMedia.mockImplementation((id: string) =>
      id === alice.id ? Promise.reject(new Error('boom')) : Promise.resolve(0),
    );
    await expect(erasure.run()).resolves.toEqual({
      due: 2,
      erased: 1,
      failed: 1,
    });
    expect(await prisma.user.count({ where: { id: bob.id } })).toBe(0);
    removeMedia.mockResolvedValue(0);
  });
  it('a "keep my account" that lands after the run picked the account wins', async () => {
    await seedPlant(prisma, alice.id);
    await due(alice, new Date(Date.now() - DAY));
    const eraser = app.get(AccountEraserRepository);
    const picked = await eraser.dueBatch(new Date(), null, 10);
    expect(picked).toEqual([alice.id]);
    await due(alice, null); // kept just now
    await expect(eraser.erase(alice.id, new Date())).resolves.toBe('not-due');
    expect(await prisma.plant.count({ where: { user_id: alice.id } })).toBe(1);
  });
});
