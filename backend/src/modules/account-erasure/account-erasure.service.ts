import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { reportError } from '../../common/observability/error-reporting';
import { Clock } from '../../common/time';
import { MediaService } from '../media';
import { AccountEraserRepository } from './account-eraser.repository';

export const ACCOUNT_ERASURE_QUEUE = 'account-erasure';
/** Optional override of how many due accounts are read per page. */
export const ACCOUNT_ERASURE_BATCH = Symbol('ACCOUNT_ERASURE_BATCH');
const DEFAULT_BATCH = 50;

export interface ErasureRunSummary {
  due: number;
  erased: number;
  failed: number;
}

/**
 * Erases every account whose notice period has ended. Photos go first, then the
 * database rows in one transaction: if anything fails the account row is still
 * there, so tomorrow's run tries again. One failure never stops the others.
 */
@Injectable()
export class AccountErasureService {
  private readonly batchSize: number;

  constructor(
    private readonly accounts: AccountEraserRepository,
    private readonly media: MediaService,
    private readonly clock: Clock,
    @InjectPinoLogger(AccountErasureService.name)
    private readonly logger: PinoLogger,
    @Optional() @Inject(ACCOUNT_ERASURE_BATCH) batchSize?: number,
  ) {
    this.batchSize = batchSize ?? DEFAULT_BATCH;
  }

  async run(): Promise<ErasureRunSummary> {
    const now = this.clock.now();
    const summary: ErasureRunSummary = { due: 0, erased: 0, failed: 0 };
    let after: string | null = null;
    for (;;) {
      const ids = await this.accounts.dueBatch(now, after, this.batchSize);
      if (ids.length === 0) break;
      for (const userId of ids) {
        summary.due += 1;
        const outcome = await this.eraseOne(userId, now);
        if (outcome === 'erased') summary.erased += 1;
        if (outcome === 'failed') summary.failed += 1;
      }
      after = ids[ids.length - 1];
    }
    this.logger.info(summary, 'Account erasure run finished');
    return summary;
  }

  private async eraseOne(
    userId: string,
    now: Date,
  ): Promise<'erased' | 'not-due' | 'failed'> {
    try {
      const photos = await this.media.removeOwnerMedia(userId);
      const outcome = await this.accounts.erase(userId, now);
      this.logger.info({ userId, photos, outcome }, 'Account erased');
      return outcome;
    } catch (err: unknown) {
      this.logger.error(
        { err, userId },
        'Account erasure failed; retried tomorrow',
      );
      reportError(err, { queue: ACCOUNT_ERASURE_QUEUE });
      return 'failed';
    }
  }
}
