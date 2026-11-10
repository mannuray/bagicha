import { Injectable } from '@nestjs/common';
import { DiagnosisOutcome, DiagnosisSession, Prisma } from '@prisma/client';
import { Tx } from '../../../common/prisma/transaction';
import { PrismaService } from '../../../prisma/prisma.service';

type NewSession = Omit<Prisma.DiagnosisSessionUncheckedCreateInput, 'plant_id'>;
type NewOutcome = Omit<Prisma.DiagnosisOutcomeUncheckedCreateInput, 'plant_id'>;

/** Diagnosis sessions/outcomes, always reached through a plant the user owns. Misses return null. */
@Injectable()
export class DiagnosisRepository {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: Tx) {
    return tx ?? this.prisma;
  }

  private async ownsPlant(
    db: Tx | PrismaService,
    userId: string,
    plantId: string,
  ) {
    const plant = await db.plant.findFirst({
      where: { id: plantId, user_id: userId },
      select: { id: true },
    });
    return plant !== null;
  }

  findOwnedSession(
    userId: string,
    sessionId: string,
    plantId: string,
    tx?: Tx,
  ): Promise<Pick<DiagnosisSession, 'id'> | null> {
    return this.db(tx).diagnosisSession.findFirst({
      where: { id: sessionId, plant_id: plantId, plant: { user_id: userId } },
      select: { id: true },
    });
  }

  async createSession(
    userId: string,
    plantId: string,
    data: NewSession,
    tx?: Tx,
  ): Promise<DiagnosisSession | null> {
    const db = this.db(tx);
    if (!(await this.ownsPlant(db, userId, plantId))) return null;
    return db.diagnosisSession.create({ data: { ...data, plant_id: plantId } });
  }

  async resolveSession(
    userId: string,
    sessionId: string,
    data: Prisma.DiagnosisSessionUncheckedUpdateManyInput,
    tx?: Tx,
  ): Promise<DiagnosisSession | null> {
    const db = this.db(tx);
    const { count } = await db.diagnosisSession.updateMany({
      where: { id: sessionId, plant: { user_id: userId } },
      data,
    });
    return count === 0
      ? null
      : db.diagnosisSession.findUnique({ where: { id: sessionId } });
  }

  async createOutcome(
    userId: string,
    plantId: string,
    data: NewOutcome,
    tx?: Tx,
  ): Promise<DiagnosisOutcome | null> {
    const db = this.db(tx);
    if (!(await this.ownsPlant(db, userId, plantId))) return null;
    return db.diagnosisOutcome.create({ data: { ...data, plant_id: plantId } });
  }
}
