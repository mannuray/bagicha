import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppError } from '../../common/errors';
import { Metrics } from '../../common/observability';
import { Clock } from '../../common/time';
import { CatalogueRepository } from './catalogue.repository';
import { Catalogue } from './domain/catalogue';
import { validateSeed } from './domain/schemas';

/** How often the store asks whether a push has changed the catalogue. */
const CHECK_EVERY_MS = 60_000;

/** No approved crops: a push hasn't run, or ran wrong. Serving an empty catalogue would look like data loss. */
export class CatalogueUnavailableError extends AppError {
  readonly httpStatus = 503;
  readonly kind = 'programmer' as const;

  constructor() {
    super('CATALOGUE_EMPTY', 'The plant catalogue is not loaded');
  }
}

/**
 * The approved (and retired) catalogue, held in memory. Reloads when a push
 * bumps the version, checking at most once a minute.
 */
@Injectable()
export class CatalogueStore implements OnApplicationBootstrap {
  private current: Catalogue | null = null;
  private checkedAt = 0;

  constructor(
    private readonly repo: CatalogueRepository,
    private readonly clock: Clock,
    private readonly metrics: Metrics,
    @InjectPinoLogger(CatalogueStore.name)
    private readonly logger: PinoLogger,
  ) {}

  /** Loading at start makes an unreadable or empty catalogue stop the app, not its first user. */
  async onApplicationBootstrap(): Promise<void> {
    await this.snapshot();
  }

  async snapshot(): Promise<Catalogue> {
    const now = this.clock.now().getTime();
    if (this.current && now - this.checkedAt < CHECK_EVERY_MS)
      return this.current;
    if (!this.current) return this.load(now);
    try {
      const version = await this.repo.version();
      return version === this.current.version
        ? this.mark(now)
        : await this.load(now);
    } catch (error: unknown) {
      // A blip after start: keep serving what we have, try again next minute.
      this.logger.warn(
        { err: error },
        'Catalogue reload failed; serving the loaded one',
      );
      return this.mark(now);
    }
  }

  private async load(now: number): Promise<Catalogue> {
    const version = await this.repo.version();
    const seed = validateSeed(
      await this.repo.loadSeed(['APPROVED', 'RETIRED']),
    );
    const catalogue = Catalogue.from(seed, version);
    if (catalogue.listedCrops().length === 0)
      throw new CatalogueUnavailableError();
    this.current = catalogue;
    this.checkedAt = now;
    const crops = catalogue.listedCrops().length;
    this.metrics.catalogueLoaded(version, crops);
    this.logger.info(
      { catalogueVersion: version, cropCount: crops },
      'Catalogue loaded',
    );
    return catalogue;
  }

  private mark(now: number): Catalogue {
    this.checkedAt = now;
    return this.current as Catalogue;
  }
}
