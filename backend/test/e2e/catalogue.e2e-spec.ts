import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PlantsService } from '../../src/modules/plants/plants.service';
import { createTestApp } from './app';

describe('plant catalogue', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
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
  describe('seeding new families into an existing catalogue', () => {
    it('adds papaya and chikoo to a catalogue that already has the old rows, without duplicates', async () => {
      const prisma = app.get(PrismaService);
      await prisma.plantCatalogEntry.deleteMany({
        where: {
          species_family: {
            in: [
              'papaya',
              'grape',
              'jackfruit',
              'coconut',
              'sapota',
              'amla',
              'custard_apple',
              'moringa',
            ],
          },
        },
      });
      expect(await prisma.plantCatalogEntry.count()).toBeGreaterThan(0);

      await app.get(PlantsService).onModuleInit();
      const afterFirst = await prisma.plantCatalogEntry.count();
      await app.get(PlantsService).onModuleInit();
      expect(await prisma.plantCatalogEntry.count()).toBe(afterFirst);

      const server = app.getHttpServer();
      const papita = await request(server).get(
        '/api/v1/plants/search?q=papita',
      );
      expect(papita.body.data[0]).toMatchObject({ species_family: 'papaya' });
      const chikoo = await request(server).get(
        '/api/v1/plants/search?q=chikoo',
      );
      expect(chikoo.body.data[0]).toMatchObject({ species_family: 'sapota' });
      const sahjan = await request(server).get(
        '/api/v1/plants/search?q=sahjan',
      );
      expect(sahjan.body.data[0]).toMatchObject({ species_family: 'moringa' });
    });
  });
});
