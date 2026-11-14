import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Clock, FixedClock } from '../../src/common/time';
import { CATALOGUE_SEED } from '../../src/modules/catalogue';
import { CatalogueRepository } from '../../src/modules/catalogue/catalogue.repository';
import { CataloguePushService } from '../../src/modules/catalogue/push/catalogue-push.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from './app';

class MovableClock extends FixedClock {
  private at = Date.now();
  advance(ms: number) {
    this.at += ms;
  }
  now(): Date {
    return new Date(this.at);
  }
}

describe('plant catalogue', () => {
  let app: INestApplication;
  const clock = new MovableClock(new Date());

  beforeAll(async () => {
    app = await createTestApp((b) => b.overrideProvider(Clock).useValue(clock));
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a resolve request without a query', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/plants/resolve')
      .send({ query: '' });
    expect(res.status).toBe(422);
  });

  it('rejects an unknown region cluster', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/plants/resolve')
      .send({ query: 'aam', region_cluster: 'MARS' });
    expect(res.status).toBe(422);
  });

  it('pages search results', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/plants/search?q=a&page_size=2',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toMatchObject({ page_size: 2 });
  });
  describe('search reads the pushed catalogue', () => {
    const sindhuri = {
      ...CATALOGUE_SEED.fruitPlants.find((p) => p.key === 'mango:malda')!,
      key: 'mango:Sindhuri',
      variety: 'Sindhuri',
      display_name: 'Mango (Sindhuri)',
      aliases: ['sindhuri'],
      languages: null,
    };

    afterAll(async () => {
      // The push never deletes: take the test entry out by hand so later pushes match the seed.
      await app
        .get(PrismaService)
        .catalogueFruitPlant.deleteMany({ where: { key: sindhuri.key } });
    });

    it('finds an entry pushed while the app runs, within a minute', async () => {
      const server = app.getHttpServer();
      const search = async () =>
        (await request(server).get('/api/v1/plants/search?q=sindhuri')).body
          .data as Array<{ id: string; display_name: string }>;
      expect(await search()).toEqual([]);
      await new CataloguePushService(app.get(CatalogueRepository)).push({
        ...CATALOGUE_SEED,
        fruitPlants: [...CATALOGUE_SEED.fruitPlants, sindhuri],
      });
      clock.advance(61_000);
      expect(await search()).toEqual([
        expect.objectContaining({
          id: 'mango:Sindhuri',
          display_name: 'Mango (Sindhuri)',
        }),
      ]);
    });

    it('starting the app writes nothing to the old catalogue table', async () => {
      const prisma = app.get(PrismaService);
      await prisma.plantCatalogEntry.deleteMany();
      const second = await createTestApp();
      try {
        expect(await prisma.plantCatalogEntry.count()).toBe(0);
        const res = await request(second.getHttpServer()).get(
          '/api/v1/plants/search?q=aam',
        );
        expect(res.body.data[0]).toMatchObject({
          id: 'mango',
          species_family: 'mango',
        });
      } finally {
        await second.close();
      }
    });
  });

  describe('fruit varieties and Hindi names', () => {
    const top = async (q: string) =>
      (
        await request(app.getHttpServer()).get(
          `/api/v1/plants/search?q=${encodeURIComponent(q)}`,
        )
      ).body.data[0];

    it.each([
      ['dasheri', { species_family: 'mango', variety: 'Dasheri' }],
      ['hapus', { species_family: 'mango', variety: 'Alphonso' }],
      ['kagzi', { species_family: 'citrus', variety: 'Kagzi' }],
      ['gondhoraj', { species_family: 'citrus', variety: 'Gondhoraj' }],
      ['g9', { species_family: 'banana', variety: 'Grand Naine' }],
      ['red lady', { species_family: 'papaya', variety: 'Red Lady' }],
      ['आम', { species_family: 'mango' }],
      ['अमरूद', { species_family: 'guava' }],
      ['jamun', { species_family: 'jamun' }],
      ['जामुन', { species_family: 'jamun' }],
      ['इमली', { species_family: 'tamarind' }],
      ['shahtoot', { species_family: 'mulberry' }],
      ['apple ber', { species_family: 'ber', variety: 'Apple Ber' }],
      ['malda', { species_family: 'mango', display_name: 'Mango (Malda)' }],
    ])('finds %s', async (q, expected) => {
      expect(await top(q)).toMatchObject(expected);
    });
  });
});
