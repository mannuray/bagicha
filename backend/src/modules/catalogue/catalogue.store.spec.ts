import { allowLogFields } from '../../common/logging/log-fields';
import { PinoLogger } from 'nestjs-pino';
import { Clock } from '../../common/time';
import { Metrics } from '../../common/observability';
import { CatalogueRepository } from './catalogue.repository';
import { CatalogueStore } from './catalogue.store';
import { CATALOGUE_SEED } from './seed';
import type { CatalogueSeed } from './domain/types';

class StepClock extends Clock {
  at = Date.parse('2026-11-14T06:00:00Z');
  now() {
    return new Date(this.at);
  }
}

function setup(seed: CatalogueSeed = CATALOGUE_SEED) {
  const state = { version: 1, seed, versionCalls: 0, loads: 0 };
  const repo = {
    version: jest.fn(() => {
      state.versionCalls++;
      return Promise.resolve(state.version);
    }),
    loadSeed: jest.fn(() => {
      state.loads++;
      return Promise.resolve(state.seed);
    }),
  };
  const clock = new StepClock();
  const metrics = { catalogueLoaded: jest.fn() };
  const logger = { info: jest.fn(), warn: jest.fn() };
  const store = new CatalogueStore(
    repo as unknown as CatalogueRepository,
    clock,
    metrics as unknown as Metrics,
    logger as unknown as PinoLogger,
  );
  return { store, state, clock, repo, metrics, logger };
}

describe('CatalogueStore', () => {
  it('loads once, and does not check the version again within a minute', async () => {
    const { store, state, clock } = setup();
    await store.snapshot();
    clock.at += 30_000;
    await store.snapshot();
    expect(state.loads).toBe(1);
    expect(state.versionCalls).toBe(1);
  });

  it('after a minute, checks the version and reloads only when it changed', async () => {
    const { store, state, clock, metrics } = setup();
    await store.snapshot();
    clock.at += 61_000;
    await store.snapshot();
    expect(state.loads).toBe(1);
    state.version = 2;
    state.seed = {
      ...CATALOGUE_SEED,
      crops: CATALOGUE_SEED.crops.filter((c) => c.id !== 'carrot'),
    };
    clock.at += 61_000;
    const fresh = await store.snapshot();
    expect(state.loads).toBe(2);
    expect(fresh.version).toBe(2);
    expect(fresh.crop('carrot')).toBeNull();
    expect(metrics.catalogueLoaded).toHaveBeenLastCalledWith(
      2,
      CATALOGUE_SEED.crops.length - 1,
    );
  });

  it('refuses a catalogue with no approved crops', async () => {
    const { store } = setup({
      ...CATALOGUE_SEED,
      crops: CATALOGUE_SEED.crops.map((c) => ({ ...c, status: 'DRAFT' })),
    });
    await expect(store.snapshot()).rejects.toMatchObject({
      reason: 'CATALOGUE_EMPTY',
    });
  });

  it('never serves an empty catalogue when the database fails', async () => {
    const { store, repo } = setup();
    repo.loadSeed.mockRejectedValueOnce(new Error('connection refused'));
    await expect(store.snapshot()).rejects.toThrow('connection refused');
  });

  it('keeps serving the loaded catalogue if a later reload fails', async () => {
    const { store, state, clock, repo } = setup();
    await store.snapshot();
    state.version = 2;
    repo.loadSeed.mockRejectedValueOnce(new Error('blip'));
    clock.at += 61_000;
    expect((await store.snapshot()).version).toBe(1);
    clock.at += 61_000;
    expect((await store.snapshot()).version).toBe(2);
  });

  it('logs the loaded version and crop count under fields the log keeps', async () => {
    const { store, logger } = setup();
    await store.snapshot();
    expect(
      allowLogFields(logger.info.mock.calls[0][0] as Record<string, unknown>),
    ).toEqual({
      catalogueVersion: 1,
      cropCount: CATALOGUE_SEED.crops.length,
    });
  });

  it('loads at start, so a bad catalogue stops the app starting', async () => {
    const { store, state } = setup();
    await store.onApplicationBootstrap();
    expect(state.loads).toBe(1);
  });
});
