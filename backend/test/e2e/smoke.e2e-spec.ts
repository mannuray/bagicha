import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './app';

describe('e2e harness smoke', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the public plant catalogue search', async () => {
    const res = await request(app.getHttpServer()).get(
      '/api/v1/plants/search?q=mango',
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
