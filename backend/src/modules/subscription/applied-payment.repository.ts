import { Injectable } from '@nestjs/common';
import { Tx } from '../../common/prisma/transaction';

/** Payments already applied, keyed by the Razorpay payment id (the de-dup record). */
@Injectable()
export class AppliedPaymentRepository {
  /** Throws a unique violation (P2002) when this payment was applied before. */
  async record(
    tx: Tx,
    payment: { paymentId: string; userId: string; planId: string },
  ): Promise<void> {
    await tx.appliedPayment.create({
      data: {
        payment_id: payment.paymentId,
        user_id: payment.userId,
        plan_id: payment.planId,
      },
    });
  }
}
