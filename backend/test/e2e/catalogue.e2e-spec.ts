import { INestApplication } from '@nestjs/common';
import request from 'supertest';
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
});
