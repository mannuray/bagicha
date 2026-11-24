import { hindiSeed, seededCatalogueStore } from '../../catalogue/testing';
import { toPlantView } from '../domain/plant-view';
import { mapTaskView } from '../domain/task-view';
import { PlantNamesService } from './plant-names.service';

const names = new PlantNamesService(seededCatalogueStore(hindiSeed()));
const tomato = {
  id: 'p1',
  name: 'Tomato',
  crop_id: 'tomato',
  species_family: null,
};

describe('plant names in the request language', () => {
  it('shows the Hindi name beside the saved one, never instead of it', async () => {
    const view = toPlantView(tomato, await names.namer('hi'));
    expect(view.name).toBe('Tomato');
    expect(view.display_name).toBe('टमाटर');
  });

  it('shows a renamed plant as written', async () => {
    const view = toPlantView(
      { ...tomato, name: "Dadi's tomato" },
      await names.namer('hi'),
    );
    expect(view.display_name).toBe("Dadi's tomato");
  });

  it('names the plants it replaces, or was replaced by, the same way', async () => {
    const view = toPlantView(
      {
        ...tomato,
        replaced_by: { ...tomato, id: 'p2' },
        replaces: [{ ...tomato, id: 'p0', name: "Dadi's tomato" }],
      },
      await names.namer('hi'),
    );
    expect(view.replaced_by).toMatchObject({
      id: 'p2',
      name: 'Tomato',
      display_name: 'टमाटर',
    });
    expect(view.replaces).toEqual([
      expect.objectContaining({ id: 'p0', display_name: "Dadi's tomato" }),
    ]);
  });

  it('shows the saved name in English', async () => {
    expect(toPlantView(tomato, await names.namer('en')).display_name).toBe(
      'Tomato',
    );
    expect(toPlantView(tomato).display_name).toBe('Tomato');
  });

  it("names a reminder's plant in Hindi", async () => {
    const task = {
      id: 't1',
      type: 'WATER',
      title: 'Water it',
      category: 'WATERING',
      priority: 'MEDIUM',
      status: 'PENDING',
      source: 'SYSTEM',
      reason: null,
      due_date: new Date(),
      completed_at: null,
      plant_cycle_id: null,
      plant: { ...tomato, record_kind: 'CROP' },
    } as unknown as Parameters<typeof mapTaskView>[0];
    expect(mapTaskView(task, await names.namer('hi')).tree_name).toBe('टमाटर');
    expect(mapTaskView(task).tree_name).toBe('Tomato');
  });

  describe('reminder titles', () => {
    const base = {
      id: 't1',
      type: 'OBSERVE',
      category: 'OBSERVATION',
      priority: 'MEDIUM',
      status: 'PENDING',
      reason: null,
      due_date: new Date(),
      completed_at: null,
      plant_cycle_id: null,
      plant: { ...tomato, record_kind: 'CROP' },
    };
    const task = (over: Record<string, unknown>) =>
      ({ ...base, ...over }) as unknown as Parameters<typeof mapTaskView>[0];

    it('writes a crop reminder in Hindi from its saved sentence', async () => {
      const t = task({
        source: 'CROP_PLAN',
        title: 'Stake the tomato plants',
        metadata: {
          crop_id: 'tomato',
          step: 'stake',
          title: { key: 'care', crop: 'tomato', step: 'stake' },
        },
      });
      const hi = mapTaskView(
        t,
        await names.namer('hi'),
        await names.titler('hi'),
      );
      expect(hi.title).toBe('टमाटर के पौधों को डंडी से सहारा दें');
      const en = mapTaskView(
        t,
        await names.namer('en'),
        await names.titler('en'),
      );
      expect(en.title).toBe('Stake the tomato plants');
    });

    it('keeps an older crop reminder with no saved sentence in English', async () => {
      const t = task({
        source: 'CROP_PLAN',
        title: 'Stake the tomato plants',
        metadata: { crop_id: 'tomato', step: 'stake' },
      });
      expect(
        mapTaskView(t, await names.namer('hi'), await names.titler('hi')).title,
      ).toBe('Stake the tomato plants');
    });

    it('writes perennial flower care and untitled reminders in Hindi', async () => {
      const flower = task({
        source: 'FLOWER_CARE',
        title: 'Prune the rose',
        source_key: 'rose:prune:2026-10',
      });
      expect(
        mapTaskView(flower, await names.namer('hi'), await names.titler('hi'))
          .title,
      ).toMatch(/गुलाब/);
      const untitled = task({ source: 'SYSTEM', type: 'WATER', title: null });
      expect(
        mapTaskView(untitled, await names.namer('hi'), await names.titler('hi'))
          .title,
      ).toBe('पौधे को पानी दें');
      expect(mapTaskView(untitled).title).toBe('Water the plant');
    });

    it('leaves tree care and typed reminders as saved', async () => {
      const t = task({ source: 'TREE_CARE', title: 'Bag the guava fruits' });
      expect(
        mapTaskView(t, await names.namer('hi'), await names.titler('hi')).title,
      ).toBe('Bag the guava fruits');
    });
  });
});

describe('saved tree-care reminders in Hindi', () => {
  const { CATALOGUE_SEED } = jest.requireActual('../../catalogue');
  const withHindi =
    (region: string, title: string) =>
    (r: { items: Array<{ key: string; hi?: object }> }) => ({
      ...r,
      items: r.items.map((i) =>
        i.key === 'feed_1' ? { ...i, hi: { title, why: 'नियमित खाद' } } : i,
      ),
      _region: region,
    });
  const papaya = CATALOGUE_SEED.treeCare.find(
    (c: { family: string }) => c.family === 'papaya',
  );
  const seed = {
    ...CATALOGUE_SEED,
    treeCare: [
      ...CATALOGUE_SEED.treeCare.filter(
        (c: { family: string }) => c.family !== 'papaya',
      ),
      {
        ...papaya,
        regions: {
          ...papaya.regions,
          SOUTH_DECCAN: (({ _region, ...r }) => r)(
            withHindi('S', 'पहली खाद: 50 ग्राम')(papaya.regions.SOUTH_DECCAN),
          ),
          COASTAL_HUMID: (({ _region, ...r }) => r)(
            withHindi('K', 'पहली खाद: 40 ग्राम')(papaya.regions.COASTAL_HUMID),
          ),
        },
      },
    ],
  };
  const service = new PlantNamesService(seededCatalogueStore(seed));
  const task = {
    type: 'FEED',
    title: 'Give feed 1: 50 g each of N, P and K',
    source: 'TREE_CARE',
    source_key: 'papaya:feed_1:d90',
  };

  it("uses the gardener's region: South's Hindi, not the coast's", async () => {
    const texts = await service.careTexter('hi', 'SOUTH_DECCAN');
    expect(texts(task)).toMatchObject({
      title: 'पहली खाद: 50 ग्राम',
      why: 'नियमित खाद',
    });
  });

  it('keeps English when the item is gone or the request is English', async () => {
    expect(
      (await service.careTexter('hi', 'SOUTH_DECCAN'))({
        ...task,
        source_key: 'papaya:no_such_item:d90',
      }),
    ).toBeNull();
    expect((await service.careTexter('en', 'SOUTH_DECCAN'))(task)).toBeNull();
  });
});

describe('a saved tree-care reminder card in Hindi', () => {
  it('replaces title, how-to and reason; keeps the amount', () => {
    const view = mapTaskView(
      {
        id: 't1',
        type: 'FEED',
        title: 'Give feed 1',
        category: null,
        priority: 'MEDIUM',
        status: 'PENDING',
        source: 'TREE_CARE',
        source_key: 'papaya:feed_1:d90',
        reason: 'Regular feeds',
        due_date: new Date('2026-09-01'),
        completed_at: null,
        plant_cycle_id: null,
        metadata: {
          organic: 'FYM',
          chemical: 'Urea 110 g',
          why: 'Regular feeds',
          amount: '110 g urea',
          window_end: '2026-09-29T00:00:00.000Z',
        },
      } as never,
      undefined,
      undefined,
      () => ({
        title: 'पहली खाद',
        why: 'नियमित खाद',
        chemical: 'यूरिया 110 ग्राम',
      }),
    );
    expect(view.title).toBe('पहली खाद');
    expect(view.reason).toBe('नियमित खाद');
    expect(view.care_how).toMatchObject({
      organic: 'FYM',
      chemical: 'यूरिया 110 ग्राम',
      why: 'नियमित खाद',
      amount: '110 g urea',
    });
  });
});

describe('saved dryness reminders in Hindi', () => {
  const { CATALOGUE_SEED } = jest.requireActual('../../catalogue');
  const hindi: Record<string, string> = {
    'overlay.task.water_today.title': 'आज पानी दें',
    'overlay.task.water_today.reason': '{name} में सूखापन दिखा',
    'overlay.dryness.summary': 'हाल की बातें सूखापन दिखाती हैं',
  };
  const service = new PlantNamesService(
    seededCatalogueStore({
      ...CATALOGUE_SEED,
      advice: CATALOGUE_SEED.advice.map((a: { key: string }) =>
        hindi[a.key] ? { ...a, hi: hindi[a.key] } : a,
      ),
    }),
  );
  const task = {
    type: 'WATER',
    title: 'Water the plant today',
    source: 'PERSONALIZED_OVERLAY',
    source_key: 'ov1:water_tree_today',
    metadata: {
      key: 'water_tree_today',
      advice: {
        title: { key: 'overlay.task.water_today.title' },
        reason: {
          key: 'overlay.task.water_today.reason',
          params: { name: 'Aam' },
        },
        summary: { key: 'overlay.dryness.summary' },
      },
    },
  };

  it('reads the title, reason and why-line from the saved advice keys', async () => {
    expect((await service.careTexter('hi', 'NORTH_INDIA'))(task)).toEqual({
      title: 'आज पानी दें',
      why: 'Aam में सूखापन दिखा',
      summary: 'हाल की बातें सूखापन दिखाती हैं',
    });
  });

  it('keeps English for English requests and tasks saved without keys', async () => {
    expect((await service.careTexter('en', 'NORTH_INDIA'))(task)).toBeNull();
    expect(
      (await service.careTexter('hi', 'NORTH_INDIA'))({
        ...task,
        metadata: { key: 'water_tree_today' },
      }),
    ).toBeNull();
  });
});
