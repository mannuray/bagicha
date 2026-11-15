import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './app';

/**
 * Add-tree search and resolve, recorded from the boot-filled table before
 * stage 2 of the catalogue move (2026-11-14). Search now ranks the catalogue
 * in memory and must give exactly these answers, in this order.
 */
const RECORDED: Record<
  string,
  {
    search: string[];
    resolve: {
      match: string | null;
      confidence: string;
      matched_alias: string | null;
      alternatives: string[];
    };
  }
> = {
  aam: {
    search: [
      'Mango',
      'Mango (Malda)',
      'Mango (Langra)',
      'Mango (Amrapali)',
      'Mango (Alphonso)',
      'Mango (Chausa)',
      'Mango (Dasheri)',
      'Mango (Fazli)',
      'Mango (Himsagar)',
      'Mango (Kesar)',
      'Mango (Mallika)',
    ],
    resolve: {
      match: 'Mango',
      confidence: 'high',
      matched_alias: 'aam',
      alternatives: ['Mango (Malda)', 'Mango (Langra)', 'Mango (Amrapali)'],
    },
  },
  mango: {
    search: [
      'Mango',
      'Mango (Malda)',
      'Mango (Langra)',
      'Mango (Amrapali)',
      'Mango (Alphonso)',
      'Mango (Banganapalli)',
      'Mango (Chausa)',
      'Mango (Dasheri)',
      'Mango (Fazli)',
      'Mango (Himsagar)',
      'Mango (Kesar)',
      'Mango (Mallika)',
      'Mango (Neelum)',
      'Mango (Totapuri)',
    ],
    resolve: {
      match: 'Mango',
      confidence: 'high',
      matched_alias: 'Mango',
      alternatives: ['Mango (Malda)', 'Mango (Langra)', 'Mango (Amrapali)'],
    },
  },
  dasheri: {
    search: ['Mango (Dasheri)'],
    resolve: {
      match: 'Mango (Dasheri)',
      confidence: 'high',
      matched_alias: 'dasheri',
      alternatives: [],
    },
  },
  आम: {
    search: ['Mango', 'Mango (Malda)', 'Mango (Langra)', 'Mango (Amrapali)'],
    resolve: {
      match: 'Mango',
      confidence: 'high',
      matched_alias: 'आम',
      alternatives: ['Mango (Malda)', 'Mango (Langra)', 'Mango (Amrapali)'],
    },
  },
  nimbu: {
    search: ['Lemon', 'Lemon (Assam lemon)', 'Lemon (Galgal)', 'Lemon (Kagzi)'],
    resolve: {
      match: 'Lemon',
      confidence: 'high',
      matched_alias: 'nimbu',
      alternatives: ['Lemon (Assam lemon)', 'Lemon (Galgal)', 'Lemon (Kagzi)'],
    },
  },
  lemon: {
    search: [
      'Lemon',
      'Lemon (Assam lemon)',
      'Lemon (Galgal)',
      'Lemon (Gondhoraj)',
      'Lemon (Kagzi)',
      'Lemon (Seedless)',
    ],
    resolve: {
      match: 'Lemon',
      confidence: 'high',
      matched_alias: 'Lemon',
      alternatives: [
        'Lemon (Assam lemon)',
        'Lemon (Galgal)',
        'Lemon (Gondhoraj)',
      ],
    },
  },
  rose: {
    search: ['Rose', 'Litchi (Rose Scented)', 'Adenium', 'Hibiscus'],
    resolve: {
      match: 'Rose',
      confidence: 'high',
      matched_alias: 'Rose',
      alternatives: ['Litchi (Rose Scented)', 'Adenium', 'Hibiscus'],
    },
  },
  gulab: {
    search: ['Rose', 'Litchi (Rose Scented)'],
    resolve: {
      match: 'Rose',
      confidence: 'high',
      matched_alias: 'gulab',
      alternatives: ['Litchi (Rose Scented)'],
    },
  },
  'china rose': {
    search: [
      'Hibiscus',
      'Rose',
      'Litchi (China)',
      'Litchi (Rose Scented)',
      'Adenium',
    ],
    resolve: {
      match: 'Hibiscus',
      confidence: 'high',
      matched_alias: 'china rose',
      alternatives: ['Rose', 'Litchi (China)', 'Litchi (Rose Scented)'],
    },
  },
  mogra: {
    search: ['Mogra'],
    resolve: {
      match: 'Mogra',
      confidence: 'high',
      matched_alias: 'Mogra',
      alternatives: [],
    },
  },
  ber: {
    search: [
      'Ber',
      'Ber (Apple Ber)',
      'Ber (Banarasi Karaka)',
      'Ber (Gola)',
      'Ber (Umran)',
      'Mulberry (Black)',
      'Mulberry (Long)',
      // Phase 3: search matches inside names, as with "mulberry".
      'Peach (July Elberta)',
      'Mulberry',
      'Amla',
    ],
    resolve: {
      match: 'Ber',
      confidence: 'high',
      matched_alias: 'Ber',
      alternatives: ['Ber (Apple Ber)', 'Ber (Banarasi Karaka)', 'Ber (Gola)'],
    },
  },
  mulberry: {
    search: ['Mulberry', 'Mulberry (Black)', 'Mulberry (Long)', 'Ber'],
    resolve: {
      match: 'Mulberry',
      confidence: 'high',
      matched_alias: 'Mulberry',
      alternatives: ['Mulberry (Black)', 'Mulberry (Long)', 'Ber'],
    },
  },
  kela: {
    search: [
      'Banana',
      'Banana (Elaichi)',
      'Banana (Malbhog)',
      'Banana (Red)',
      'Banana (Robusta)',
    ],
    resolve: {
      match: 'Banana',
      confidence: 'high',
      matched_alias: 'kela',
      alternatives: ['Banana (Elaichi)', 'Banana (Malbhog)', 'Banana (Red)'],
    },
  },
  g9: {
    search: ['Banana (Grand Naine)'],
    resolve: {
      match: 'Banana (Grand Naine)',
      confidence: 'high',
      matched_alias: 'g9',
      alternatives: [],
    },
  },
  jamun: {
    search: ['Jamun', 'Jamun (Jamwant)', 'Jamun (Konkan Bahadoli)'],
    resolve: {
      match: 'Jamun',
      confidence: 'high',
      matched_alias: 'Jamun',
      alternatives: ['Jamun (Jamwant)', 'Jamun (Konkan Bahadoli)'],
    },
  },
  xyz: {
    search: [],
    resolve: {
      match: null,
      confidence: 'low',
      matched_alias: null,
      alternatives: [],
    },
  },
};

describe('add-tree search gives the same answers as before the catalogue move', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(Object.keys(RECORDED))('%s', async (q) => {
    const server = app.getHttpServer();
    const search = await request(server).get(
      `/api/v1/plants/search?q=${encodeURIComponent(q)}&page_size=50`,
    );
    expect(
      search.body.data.map((e: { display_name: string }) => e.display_name),
    ).toEqual(RECORDED[q].search);
    const resolve = (
      await request(server).post('/api/v1/plants/resolve').send({ query: q })
    ).body.data;
    expect({
      match: resolve.match?.display_name ?? null,
      confidence: resolve.confidence,
      matched_alias: resolve.matched_alias,
      alternatives: resolve.alternatives.map(
        (e: { display_name: string }) => e.display_name,
      ),
    }).toEqual(RECORDED[q].resolve);
  });
});
